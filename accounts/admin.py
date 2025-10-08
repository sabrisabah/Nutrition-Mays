from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PatientProfile, DoctorProfile, PatientMeasurement, MedicalDocument


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'date_joined']
    list_filter = ['role', 'is_verified', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'avatar', 'date_of_birth', 'is_verified')}),
    )


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'gender', 'current_weight', 'target_weight', 'goal', 'activity_level']
    list_filter = ['gender', 'goal', 'activity_level']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'specialization', 'years_of_experience', 'consultation_fee', 'is_approved', 'rating']
    list_filter = ['specialization', 'is_approved', 'years_of_experience']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name', 'license_number']


@admin.register(PatientMeasurement)
class PatientMeasurementAdmin(admin.ModelAdmin):
    list_display = ['patient', 'weight', 'body_fat_percentage', 'measured_at']
    list_filter = ['measured_at']
    search_fields = ['patient__username', 'patient__email']
    date_hierarchy = 'measured_at'


@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ['patient', 'title', 'document_type', 'uploaded_by', 'uploaded_at', 'is_private']
    list_filter = ['document_type', 'is_private', 'uploaded_at']
    search_fields = ['patient__username', 'title', 'uploaded_by__username']
    date_hierarchy = 'uploaded_at'
