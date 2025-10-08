from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class FoodCategory(models.Model):
    name = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Food Categories"

    def __str__(self):
        return self.name


class Food(models.Model):
    name = models.CharField(max_length=200)
    name_ar = models.CharField(max_length=200, blank=True)
    category = models.ForeignKey(FoodCategory, on_delete=models.CASCADE, related_name='foods')
    description = models.TextField(blank=True)
    
    # Nutritional values per 100g
    calories_per_100g = models.FloatField()
    protein_per_100g = models.FloatField()
    carbs_per_100g = models.FloatField()
    fat_per_100g = models.FloatField()
    fiber_per_100g = models.FloatField(default=0)
    sugar_per_100g = models.FloatField(default=0)
    sodium_per_100g = models.FloatField(default=0)
    
    # Additional nutrients
    vitamin_a = models.FloatField(default=0, help_text="mcg")
    vitamin_c = models.FloatField(default=0, help_text="mg")
    vitamin_d = models.FloatField(default=0, help_text="mcg")
    calcium = models.FloatField(default=0, help_text="mg")
    iron = models.FloatField(default=0, help_text="mg")
    
    # Common serving sizes
    common_serving_size = models.CharField(max_length=100, blank=True, help_text="e.g., 1 cup, 1 slice")
    common_serving_weight = models.FloatField(blank=True, null=True, help_text="Weight in grams")
    
    image = models.ImageField(upload_to='food_images/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def get_nutrition_for_amount(self, amount_in_grams):
        """Calculate nutrition values for a specific amount"""
        factor = amount_in_grams / 100
        return {
            'calories': self.calories_per_100g * factor,
            'protein': self.protein_per_100g * factor,
            'carbs': self.carbs_per_100g * factor,
            'fat': self.fat_per_100g * factor,
            'fiber': self.fiber_per_100g * factor,
            'sugar': self.sugar_per_100g * factor,
            'sodium': self.sodium_per_100g * factor,
        }


class MealPlanTemplate(models.Model):
    PLAN_TYPE_CHOICES = [
        ('keto', _('Ketogenic')),
        ('balanced', _('Balanced')),
        ('high_protein', _('High Protein')),
        ('low_carb', _('Low Carb')),
        ('mediterranean', _('Mediterranean')),
        ('vegetarian', _('Vegetarian')),
        ('vegan', _('Vegan')),
    ]

    name = models.CharField(max_length=200)
    name_ar = models.CharField(max_length=200, blank=True)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)
    description = models.TextField()
    target_calories = models.IntegerField()
    target_protein_percentage = models.FloatField()
    target_carbs_percentage = models.FloatField()
    target_fat_percentage = models.FloatField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class MealPlan(models.Model):
    STATUS_CHOICES = [
        ('waiting', _('Waiting for Patient')),
        ('delivered', _('Meal Plan Delivered')),
        ('acknowledged', _('Patient Acknowledged')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_plans')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_meal_plans')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    template = models.ForeignKey(MealPlanTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    target_calories = models.IntegerField()
    target_protein = models.FloatField()
    target_carbs = models.FloatField()
    target_fat = models.FloatField()
    
    # النظام الغذائي المتكامل
    diet_plan = models.CharField(max_length=50, blank=True, null=True, help_text="النظام الغذائي المتكامل المختار")
    
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    delivered_at = models.DateTimeField(blank=True, null=True)
    acknowledged_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.title}"

    def mark_as_delivered(self):
        """Mark meal plan as delivered to patient"""
        from django.utils import timezone
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save()

    def mark_as_acknowledged(self):
        """Mark meal plan as acknowledged by patient"""
        from django.utils import timezone
        self.status = 'acknowledged'
        self.acknowledged_at = timezone.now()
        self.save()

    def mark_as_in_progress(self):
        """Mark meal plan as in progress"""
        self.status = 'in_progress'
        self.save()

    def mark_as_completed(self):
        """Mark meal plan as completed"""
        self.status = 'completed'
        self.save()

    def cancel_plan(self):
        """Cancel the meal plan"""
        self.status = 'cancelled'
        self.is_active = False
        self.save()

    def save(self, *args, **kwargs):
        # If this is a new meal plan and it's being set as active
        if not self.pk and self.is_active:
            # Deactivate all other active meal plans for this patient
            MealPlan.objects.filter(
                patient=self.patient,
                is_active=True
            ).exclude(id=self.pk).update(is_active=False)
        
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']


class MealType(models.Model):
    name = models.CharField(max_length=50)
    name_ar = models.CharField(max_length=50, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name


class Meal(models.Model):
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='meals')
    meal_type = models.ForeignKey(MealType, on_delete=models.CASCADE)
    day_of_week = models.IntegerField(choices=[
        (0, _('Monday')),
        (1, _('Tuesday')),
        (2, _('Wednesday')),
        (3, _('Thursday')),
        (4, _('Friday')),
        (5, _('Saturday')),
        (6, _('Sunday')),
    ])
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    prep_time = models.IntegerField(blank=True, null=True, help_text="Preparation time in minutes")
    
    def __str__(self):
        return f"{self.meal_plan.title} - {self.get_day_of_week_display()} - {self.meal_type.name} - {self.name}"

    def get_total_nutrition(self):
        """Calculate total nutrition for this meal"""
        total = {
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0,
            'sodium': 0,
        }
        
        for ingredient in self.ingredients.all():
            nutrition = ingredient.food.get_nutrition_for_amount(ingredient.amount)
            for key in total:
                total[key] += nutrition.get(key, 0)
        
        return total


class MealIngredient(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='ingredients')
    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    amount = models.FloatField(help_text="Amount in grams")
    notes = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.meal.name} - {self.food.name} ({self.amount}g)"

    def get_nutrition(self):
        """Get nutrition values for this ingredient amount"""
        return self.food.get_nutrition_for_amount(self.amount)


class MealPlanProgress(models.Model):
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='progress_entries')
    date = models.DateField()
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completion_percentage = models.IntegerField(default=0, help_text="0-100%")
    notes = models.TextField(blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['meal_plan', 'date', 'meal']

    def __str__(self):
        return f"{self.meal_plan.patient.get_full_name()} - {self.date} - {self.meal.name}"


class Recipe(models.Model):
    name = models.CharField(max_length=200)
    name_ar = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    instructions = models.TextField()
    prep_time = models.IntegerField(help_text="Preparation time in minutes")
    cook_time = models.IntegerField(help_text="Cooking time in minutes")
    servings = models.IntegerField()
    difficulty_level = models.CharField(max_length=20, choices=[
        ('easy', _('Easy')),
        ('medium', _('Medium')),
        ('hard', _('Hard')),
    ])
    image = models.ImageField(upload_to='recipe_images/', blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    amount = models.FloatField(help_text="Amount in grams")
    notes = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.recipe.name} - {self.food.name} ({self.amount}g)"


class PatientMealSelection(models.Model):
    """Model to store patient's meal selections"""
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_selections')
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='selections')
    meal_name = models.CharField(max_length=200)
    meal_type = models.CharField(max_length=50, choices=[
        ('breakfast', 'الإفطار'),
        ('lunch', 'الغداء'),
        ('dinner', 'العشاء'),
        ('snack', 'وجبة خفيفة')
    ])
    selected_at = models.DateTimeField(auto_now_add=True)
    
    # Nutrition information
    calories = models.FloatField(default=0)
    protein = models.FloatField(default=0)
    carbs = models.FloatField(default=0)
    fat = models.FloatField(default=0)
    
    # Ingredients information (JSON field to store ingredients)
    ingredients = models.JSONField(default=list, blank=True, help_text="List of ingredients with amounts")
    
    # Additional info
    notes = models.TextField(blank=True)
    is_confirmed = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-selected_at']
        unique_together = ['patient', 'meal_plan', 'meal_name', 'meal_type', 'selected_at']
    
    def __str__(self):
        return f"{self.patient.username} - {self.meal_name} ({self.meal_type})"