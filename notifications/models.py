from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class Notification(models.Model):
    TYPE_CHOICES = [
        ('appointment_confirmed', _('Appointment Confirmed')),
        ('appointment_reminder', _('Appointment Reminder')),
        ('appointment_cancelled', _('Appointment Cancelled')),
        ('meal_plan_ready', _('Meal Plan Ready')),
        ('payment_successful', _('Payment Successful')),
        ('payment_failed', _('Payment Failed')),
        ('refund_processed', _('Refund Processed')),
        ('coupon_expiring', _('Coupon Expiring')),
        ('subscription_expiring', _('Subscription Expiring')),
        ('new_message', _('New Message')),
        ('system_announcement', _('System Announcement')),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    
    title = models.CharField(max_length=200)
    title_ar = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    message_ar = models.TextField(blank=True)
    
    # Related objects
    appointment = models.ForeignKey('bookings.Appointment', on_delete=models.CASCADE, null=True, blank=True)
    meal_plan = models.ForeignKey('meal_plans.MealPlan', on_delete=models.CASCADE, null=True, blank=True)
    payment = models.ForeignKey('payments.Payment', on_delete=models.CASCADE, null=True, blank=True)
    invoice = models.ForeignKey('payments.Invoice', on_delete=models.CASCADE, null=True, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    is_sent_email = models.BooleanField(default=False)
    is_sent_sms = models.BooleanField(default=False)
    is_sent_push = models.BooleanField(default=False)
    
    # Metadata
    data = models.JSONField(blank=True, null=True, help_text=_('Additional data for the notification'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.get_full_name()} - {self.title}"

    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email preferences
    email_appointments = models.BooleanField(default=True)
    email_meal_plans = models.BooleanField(default=True)
    email_payments = models.BooleanField(default=True)
    email_marketing = models.BooleanField(default=False)
    email_system = models.BooleanField(default=True)
    
    # SMS preferences
    sms_appointments = models.BooleanField(default=True)
    sms_meal_plans = models.BooleanField(default=False)
    sms_payments = models.BooleanField(default=True)
    sms_marketing = models.BooleanField(default=False)
    sms_system = models.BooleanField(default=False)
    
    # Push notification preferences
    push_appointments = models.BooleanField(default=True)
    push_meal_plans = models.BooleanField(default=True)
    push_payments = models.BooleanField(default=True)
    push_marketing = models.BooleanField(default=False)
    push_system = models.BooleanField(default=True)
    
    # In-app preferences
    inapp_appointments = models.BooleanField(default=True)
    inapp_meal_plans = models.BooleanField(default=True)
    inapp_payments = models.BooleanField(default=True)
    inapp_marketing = models.BooleanField(default=True)
    inapp_system = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - Notification Preferences"


class EmailTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=200)
    subject_ar = models.CharField(max_length=200, blank=True)
    
    html_content = models.TextField()
    html_content_ar = models.TextField(blank=True)
    
    text_content = models.TextField(blank=True)
    text_content_ar = models.TextField(blank=True)
    
    # Template variables documentation
    variables = models.JSONField(blank=True, null=True, help_text=_('Available template variables'))
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class SMSTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    content = models.TextField(max_length=160)
    content_ar = models.TextField(max_length=160, blank=True)
    
    # Template variables documentation
    variables = models.JSONField(blank=True, null=True, help_text=_('Available template variables'))
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class EmailLog(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('sent', _('Sent')),
        ('failed', _('Failed')),
        ('bounced', _('Bounced')),
        ('delivered', _('Delivered')),
        ('opened', _('Opened')),
        ('clicked', _('Clicked')),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_logs')
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, null=True, blank=True)
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    to_email = models.EmailField()
    subject = models.CharField(max_length=200)
    content = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    provider_message_id = models.CharField(max_length=200, blank=True)
    error_message = models.TextField(blank=True)
    
    sent_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    opened_at = models.DateTimeField(blank=True, null=True)
    clicked_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Email to {self.to_email} - {self.status}"


class SMSLog(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('sent', _('Sent')),
        ('failed', _('Failed')),
        ('delivered', _('Delivered')),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sms_logs')
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, null=True, blank=True)
    template = models.ForeignKey(SMSTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    to_phone = models.CharField(max_length=20)
    content = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    provider_message_id = models.CharField(max_length=200, blank=True)
    error_message = models.TextField(blank=True)
    
    sent_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SMS to {self.to_phone} - {self.status}"


class ChatMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    
    # Related appointment or meal plan
    appointment = models.ForeignKey('bookings.Appointment', on_delete=models.CASCADE, null=True, blank=True)
    meal_plan = models.ForeignKey('meal_plans.MealPlan', on_delete=models.CASCADE, null=True, blank=True)
    
    message = models.TextField()
    
    # File attachments
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.get_full_name()} to {self.recipient.get_full_name()}"

    def mark_as_read(self):
        """Mark message as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
