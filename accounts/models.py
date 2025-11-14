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
    daily_calories = models.IntegerField(blank=True, null=True, help_text=_('Daily calorie intake target'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_bmr(self):
        """Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation"""
        if not all([self.current_weight, self.height]):
            return None
        
        # Calculate age from date of birth
        age = 30  # default age
        if self.user and self.user.date_of_birth:
            from datetime import date
            today = date.today()
            age = today.year - self.user.date_of_birth.year
            if today.month < self.user.date_of_birth.month or (today.month == self.user.date_of_birth.month and today.day < self.user.date_of_birth.day):
                age -= 1
        
        # Mifflin-St Jeor equation
        if self.gender == 'male':
            bmr = (10 * self.current_weight) + (6.25 * self.height) - (5 * age) + 5
        else:
            bmr = (10 * self.current_weight) + (6.25 * self.height) - (5 * age) - 161
        
        return round(bmr)
    
    def calculate_tdee(self):
        """Calculate Total Daily Energy Expenditure (TDEE)"""
        bmr = self.calculate_bmr()
        if not bmr:
            return None
        
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        }
        
        multiplier = activity_multipliers.get(self.activity_level, 1.55)
        tdee = bmr * multiplier
        
        return round(tdee)
    
    def calculate_daily_calories(self, force_recalculate=False):
        """
        Calculate daily calories required based on weight, height, activity, and goal
        
        الخطوات:
        1. حساب TDEE (Total Daily Energy Expenditure)
        2. تطبيق تعديل الهدف (goal adjustment):
           - lose_weight: طرح 500 سعرة (عجز 500 سعرة)
           - gain_weight: إضافة 500 سعرة (فائض 500 سعرة)
           - build_muscle: إضافة 300 سعرة
           - maintain_weight: بدون تعديل
           - improve_health: بدون تعديل
        
        Parameters:
        -----------
        force_recalculate : bool
            إذا كان True، يعيد حساب السعرات حتى لو كانت daily_calories محفوظة
            هذا يضمن تطبيق تعديل الهدف دائماً
        """
        tdee = self.calculate_tdee()
        if not tdee:
            return None
        
        # Apply goal-based adjustment to TDEE
        goal_adjustments = {
            'lose_weight': -500,      # عجز 500 سعرة حرارية لفقدان الوزن
            'gain_weight': 500,       # فائض 500 سعرة حرارية لزيادة الوزن
            'build_muscle': 300,      # فائض 300 سعرة حرارية لبناء العضلات
            'maintain_weight': 0,      # بدون تعديل - الحفاظ على الوزن
            'improve_health': 0        # بدون تعديل - تحسين الصحة
        }
        
        adjustment = goal_adjustments.get(self.goal, 0)
        calculated_calories = tdee + adjustment
        
        # Ensure minimum calories (at least 1200 for safety)
        if calculated_calories < 1200:
            calculated_calories = 1200
            print(f"⚠️ Warning: Calculated calories ({tdee + adjustment}) below minimum (1200). Using 1200.")
        
        # If daily_calories is manually set and force_recalculate is False, check if it matches calculated
        if not force_recalculate and self.daily_calories and self.daily_calories > 0:
            # Check if saved value matches calculated (within 10 calories tolerance)
            if abs(self.daily_calories - calculated_calories) <= 10:
                # Saved value matches calculated, use it
                return self.daily_calories
            else:
                # Saved value doesn't match calculated (probably old value without goal adjustment)
                # Recalculate and update
                print(f"🔄 Saved calories ({self.daily_calories}) doesn't match calculated ({calculated_calories}). Recalculating...")
        
        print(f"📊 Daily Calories Calculation:")
        print(f"  TDEE: {tdee} calories")
        print(f"  Goal: {self.goal}")
        print(f"  Adjustment: {adjustment} calories")
        print(f"  Final daily calories: {calculated_calories} calories")
        
        return round(calculated_calories)
    
    def calculate_nutrition_targets(self):
        """Calculate nutrition targets (protein, carbs, fat) based on daily calories"""
        daily_calories = self.calculate_daily_calories()
        if not daily_calories:
            return None
        
        # Protein calculation (based on goal and weight)
        protein_per_kg = {
            'lose_weight': 2.2,
            'maintain_weight': 1.6,
            'gain_weight': 1.8,
            'build_muscle': 2.0,
            'improve_health': 1.8
        }
        protein_per_kg_value = protein_per_kg.get(self.goal, 1.6)
        protein_grams = round(self.current_weight * protein_per_kg_value)
        protein_calories = protein_grams * 4
        
        # Fat calculation (percentage of total calories)
        fat_percentage = {
            'lose_weight': 0.25,
            'maintain_weight': 0.30,
            'gain_weight': 0.35,
            'build_muscle': 0.25,
            'improve_health': 0.30
        }
        fat_percentage_value = fat_percentage.get(self.goal, 0.30)
        fat_calories = daily_calories * fat_percentage_value
        fat_grams = round(fat_calories / 9)
        
        # Carbs calculation (remaining calories)
        carb_calories = daily_calories - protein_calories - fat_calories
        carb_grams = round(carb_calories / 4)
        
        return {
            'calories': daily_calories,
            'protein': protein_grams,
            'carbs': carb_grams,
            'fat': fat_grams,
            'protein_calories': protein_calories,
            'fat_calories': fat_calories,
            'carb_calories': carb_calories
        }

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
