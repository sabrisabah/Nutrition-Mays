from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', _('Admin')),
        ('doctor', _('Doctor')),
        ('patient', _('Patient')),
        ('accountant', _('Accountant')),
    ]
    
    # Override email field to make it optional and not required
    email = models.EmailField(blank=True, null=True)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, help_text=_('Full address'))
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class PatientProfile(models.Model):
    GENDER_CHOICES = [
        ('male', _('Male')),
        ('female', _('Female')),
    ]
    
    ACTIVITY_LEVEL_CHOICES = [
        ('sedentary', _('Sedentary')),
        ('light', _('Light')),
        ('moderate', _('Moderate')),
        ('active', _('Active')),
        ('very_active', _('Very Active')),
    ]
    
    GOAL_CHOICES = [
        ('lose_weight', _('Lose Weight')),
        ('gain_weight', _('Gain Weight')),
        ('maintain_weight', _('Maintain Weight')),
        ('build_muscle', _('Build Muscle')),
        ('improve_health', _('Improve Health')),
    ]
    
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    height = models.FloatField(help_text=_('Height in cm'))
    current_weight = models.FloatField(help_text=_('Weight in kg'))
    target_weight = models.FloatField(help_text=_('Target weight in kg'), blank=True, null=True)
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_LEVEL_CHOICES, default='moderate')
    goal = models.CharField(max_length=20, choices=GOAL_CHOICES)
    medical_conditions = models.TextField(blank=True, help_text=_('Medical conditions and allergies'))
    dietary_restrictions = models.TextField(blank=True, help_text=_('Dietary restrictions'))
    medications = models.TextField(blank=True, help_text=_('Current medications'))
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - Patient Profile"


class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    license_number = models.CharField(max_length=50, unique=True)
    specialization = models.CharField(max_length=100)
    years_of_experience = models.IntegerField()
    education = models.TextField()
    certifications = models.TextField(blank=True)
    bio = models.TextField(blank=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2)
    available_days = models.CharField(max_length=50, help_text=_('Available days (e.g., Mon,Tue,Wed)'))
    available_hours_start = models.TimeField()
    available_hours_end = models.TimeField()
    is_approved = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0)
    total_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dr. {self.user.get_full_name()}"


class PatientMeasurement(models.Model):
    ACTIVITY_LEVEL_CHOICES = [
        ('sedentary', _('Sedentary')),
        ('light', _('Light')),
        ('moderate', _('Moderate')),
        ('active', _('Active')),
        ('very_active', _('Very Active')),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='measurements')
    weight = models.FloatField()
    body_fat_percentage = models.FloatField(blank=True, null=True)
    muscle_mass = models.FloatField(blank=True, null=True)
    waist_circumference = models.FloatField(blank=True, null=True)
    hip_circumference = models.FloatField(blank=True, null=True)
    chest_circumference = models.FloatField(blank=True, null=True)
    arm_circumference = models.FloatField(blank=True, null=True)
    blood_pressure_systolic = models.IntegerField(blank=True, null=True)
    blood_pressure_diastolic = models.IntegerField(blank=True, null=True)
    blood_sugar = models.FloatField(blank=True, null=True)
    adjusted_body_weight = models.FloatField(blank=True, null=True, help_text=_('Adjusted Body Weight calculated automatically'))
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_LEVEL_CHOICES, blank=True, null=True, help_text=_('Physical activity level'))
    notes = models.TextField(blank=True)
    measured_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-measured_at']

    def calculate_adjusted_body_weight(self):
        """
        Calculate Adjusted Body Weight using the formula:
        ABW = IBW + 0.4 * (actual weight - IBW)
        where IBW (Ideal Body Weight) is calculated using Devine formula:
        - Men: IBW = 50 + 2.3 * (height in inches - 60)
        - Women: IBW = 45.5 + 2.3 * (height in inches - 60)
        """
        if not self.patient or not self.patient.patient_profile:
            return None
            
        profile = self.patient.patient_profile
        height_cm = profile.height
        weight_kg = self.weight
        gender = profile.gender
        
        if not height_cm or not weight_kg or not gender:
            return None
            
        # Convert height from cm to inches
        height_inches = height_cm / 2.54
        
        # Calculate Ideal Body Weight (IBW) using Devine formula
        if gender == 'male':
            ibw = 50 + (2.3 * (height_inches - 60))
        else:  # female
            ibw = 45.5 + (2.3 * (height_inches - 60))
            
        # Calculate Adjusted Body Weight
        abw = ibw + (0.4 * (weight_kg - ibw))
        
        return round(abw, 2)
    
    def save(self, *args, **kwargs):
        # Calculate adjusted body weight before saving
        if self.weight and self.patient and self.patient.patient_profile:
            self.adjusted_body_weight = self.calculate_adjusted_body_weight()
        
        # Update patient profile with latest weight (only if auto_update_profile is True)
        auto_update_profile = kwargs.pop('auto_update_profile', True)
        if auto_update_profile and self.weight and self.patient and self.patient.patient_profile:
            profile = self.patient.patient_profile
            profile.current_weight = self.weight
            # Update activity level if provided
            if self.activity_level:
                profile.activity_level = self.activity_level
            profile.save()
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.weight}kg - {self.measured_at.date()}"


class MedicalDocument(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medical_documents')
    title = models.CharField(max_length=200)
    document = models.FileField(upload_to='medical_documents/')
    document_type = models.CharField(max_length=50, choices=[
        ('lab_report', _('Lab Report')),
        ('medical_report', _('Medical Report')),
        ('prescription', _('Prescription')),
        ('xray', _('X-Ray')),
        ('other', _('Other')),
    ])
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_documents')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_private = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.title}"
