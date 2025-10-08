from django.contrib import admin
from .models import (
    DoctorAvailability, DoctorUnavailability, Appointment,
    AppointmentRating, AppointmentRescheduleRequest, TimeSlot
)


@admin.register(DoctorAvailability)
class DoctorAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'get_weekday_display', 'start_time', 'end_time', 'is_available']
    list_filter = ['weekday', 'is_available']
    search_fields = ['doctor__username', 'doctor__first_name', 'doctor__last_name']


@admin.register(DoctorUnavailability)
class DoctorUnavailabilityAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'start_datetime', 'end_datetime', 'reason']
    list_filter = ['start_datetime']
    search_fields = ['doctor__username', 'doctor__first_name', 'doctor__last_name']
    date_hierarchy = 'start_datetime'


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'scheduled_date', 'scheduled_time', 'status', 'appointment_type', 'consultation_fee', 'is_paid']
    list_filter = ['status', 'appointment_type', 'scheduled_date', 'is_paid']
    search_fields = ['patient__username', 'doctor__username', 'patient__first_name', 'doctor__first_name']
    date_hierarchy = 'scheduled_date'
    readonly_fields = ['created_at', 'updated_at', 'confirmed_at', 'cancelled_at', 'completed_at']


@admin.register(AppointmentRating)
class AppointmentRatingAdmin(admin.ModelAdmin):
    list_display = ['appointment', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['appointment__patient__username', 'appointment__doctor__username']


@admin.register(AppointmentRescheduleRequest)
class AppointmentRescheduleRequestAdmin(admin.ModelAdmin):
    list_display = ['appointment', 'requested_by', 'new_date', 'new_time', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['appointment__patient__username', 'appointment__doctor__username']


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'date', 'start_time', 'end_time', 'is_available', 'current_appointments', 'max_appointments']
    list_filter = ['is_available', 'date']
    search_fields = ['doctor__username', 'doctor__first_name', 'doctor__last_name']
    date_hierarchy = 'date'
