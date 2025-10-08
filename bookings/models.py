from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from datetime import datetime, time, timedelta

User = get_user_model()


class DoctorAvailability(models.Model):
    WEEKDAY_CHOICES = [
        (0, _('Monday')),
        (1, _('Tuesday')),
        (2, _('Wednesday')),
        (3, _('Thursday')),
        (4, _('Friday')),
        (5, _('Saturday')),
        (6, _('Sunday')),
    ]
    
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availability_slots')
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['doctor', 'weekday', 'start_time']
        ordering = ['weekday', 'start_time']

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError(_('Start time must be before end time'))

    def __str__(self):
        return f"Dr. {self.doctor.get_full_name()} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class DoctorUnavailability(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='unavailable_slots')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reason = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.start_datetime >= self.end_datetime:
            raise ValidationError(_('Start time must be before end time'))

    def __str__(self):
        return f"Dr. {self.doctor.get_full_name()} - Unavailable {self.start_datetime.date()}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('confirmed', _('Confirmed')),
        ('cancelled', _('Cancelled')),
        ('completed', _('Completed')),
        ('no_show', _('No Show')),
    ]
    
    APPOINTMENT_TYPE_CHOICES = [
        ('consultation', _('Consultation')),
        ('follow_up', _('Follow Up')),
        ('meal_plan_review', _('Meal Plan Review')),
        ('progress_check', _('Progress Check')),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments')
    appointment_type = models.CharField(max_length=20, choices=APPOINTMENT_TYPE_CHOICES, default='consultation')
    
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration = models.IntegerField(default=30, help_text=_('Duration in minutes'))
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Patient information
    chief_complaint = models.TextField(blank=True, help_text=_('Main reason for appointment'))
    notes_from_patient = models.TextField(blank=True)
    
    # Doctor information
    notes_from_doctor = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    
    # Fees and payment
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    payment_method = models.CharField(max_length=50, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Cancellation details
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_appointments')
    cancellation_reason = models.TextField(blank=True)
    
    # Reminders
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['scheduled_date', 'scheduled_time']
        unique_together = ['doctor', 'scheduled_date', 'scheduled_time']

    def clean(self):
        # Check if doctor is available at this time
        weekday = self.scheduled_date.weekday()
        availability = DoctorAvailability.objects.filter(
            doctor=self.doctor,
            weekday=weekday,
            start_time__lte=self.scheduled_time,
            end_time__gt=self.scheduled_time,
            is_available=True
        ).exists()
        
        if not availability:
            raise ValidationError(_('Doctor is not available at this time'))
        
        # Check for conflicts with unavailability
        start_datetime = datetime.combine(self.scheduled_date, self.scheduled_time)
        end_datetime = start_datetime + timedelta(minutes=self.duration)
        
        conflicts = DoctorUnavailability.objects.filter(
            doctor=self.doctor,
            start_datetime__lt=end_datetime,
            end_datetime__gt=start_datetime
        ).exists()
        
        if conflicts:
            raise ValidationError(_('Doctor is unavailable at this time'))

    def __str__(self):
        return f"{self.patient.get_full_name()} with Dr. {self.doctor.get_full_name()} - {self.scheduled_date} {self.scheduled_time}"

    @property
    def scheduled_datetime(self):
        return datetime.combine(self.scheduled_date, self.scheduled_time)

    @property
    def end_datetime(self):
        return self.scheduled_datetime + timedelta(minutes=self.duration)

    def can_be_cancelled(self):
        """Check if appointment can be cancelled (at least 24 hours before)"""
        if self.status in ['cancelled', 'completed']:
            return False
        
        now = datetime.now()
        appointment_time = self.scheduled_datetime
        return (appointment_time - now).total_seconds() > 24 * 3600

    def cancel(self, cancelled_by, reason=""):
        """Cancel the appointment"""
        if not self.can_be_cancelled():
            raise ValidationError(_('Cannot cancel appointment less than 24 hours before scheduled time'))
        
        from django.utils import timezone
        self.status = 'cancelled'
        self.cancelled_by = cancelled_by
        self.cancellation_reason = reason
        self.cancelled_at = timezone.now()
        self.save()

    def confirm(self):
        """Confirm the appointment"""
        if self.status != 'pending':
            raise ValidationError(_('Only pending appointments can be confirmed'))
        
        from django.utils import timezone
        self.status = 'confirmed'
        self.confirmed_at = timezone.now()
        self.save()

    def complete(self):
        """Mark appointment as completed"""
        if self.status != 'confirmed':
            raise ValidationError(_('Only confirmed appointments can be completed'))
        
        from django.utils import timezone
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()


class AppointmentRating(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='rating')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    review = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.appointment} - {self.rating} stars"


class AppointmentRescheduleRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
    ]
    
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='reschedule_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # New requested time
    new_date = models.DateField()
    new_time = models.TimeField()
    
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Response from doctor/admin
    response_notes = models.TextField(blank=True)
    responded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reschedule_responses')
    responded_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reschedule {self.appointment} to {self.new_date} {self.new_time}"

    def approve(self, approved_by):
        """Approve the reschedule request"""
        from django.utils import timezone
        self.status = 'approved'
        self.responded_by = approved_by
        self.responded_at = timezone.now()
        self.save()
        
        # Update the original appointment
        self.appointment.scheduled_date = self.new_date
        self.appointment.scheduled_time = self.new_time
        self.appointment.save()

    def reject(self, rejected_by, reason=""):
        """Reject the reschedule request"""
        from django.utils import timezone
        self.status = 'rejected'
        self.responded_by = rejected_by
        self.responded_at = timezone.now()
        self.response_notes = reason
        self.save()


class TimeSlot(models.Model):
    """Available time slots for booking"""
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='time_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    max_appointments = models.IntegerField(default=1)
    current_appointments = models.IntegerField(default=0)

    class Meta:
        unique_together = ['doctor', 'date', 'start_time']
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"Dr. {self.doctor.get_full_name()} - {self.date} {self.start_time}-{self.end_time}"

    @property
    def is_fully_booked(self):
        return self.current_appointments >= self.max_appointments

    def book_slot(self):
        """Book this time slot"""
        if self.is_fully_booked:
            raise ValidationError(_('Time slot is fully booked'))
        
        self.current_appointments += 1
        if self.current_appointments >= self.max_appointments:
            self.is_available = False
        self.save()

    def release_slot(self):
        """Release this time slot"""
        if self.current_appointments > 0:
            self.current_appointments -= 1
            self.is_available = True
            self.save()
