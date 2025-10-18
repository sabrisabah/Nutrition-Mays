from rest_framework import serializers
from .models import (
    FoodCategory, Food, MealPlanTemplate, MealPlan, MealType, 
    Meal, MealIngredient, MealPlanProgress, Recipe, RecipeIngredient
)


class FoodCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodCategory
        fields = '__all__'


class FoodSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Food
        fields = '__all__'


class MealPlanTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    meals = serializers.SerializerMethodField()
    
    class Meta:
        model = MealPlanTemplate
        fields = '__all__'
        read_only_fields = ['created_by']
    
    def get_meals(self, obj):
        meals = []
        # البحث عن الوجبات المرتبطة بهذا القالب
        # نستخدم MealPlan مع title يحتوي على Template ID
        template_meals = Meal.objects.filter(
            meal_plan__title__startswith=f'Template {obj.id}'
        )
        
        for meal in template_meals:
            meal_data = {
                'id': meal.id,
                'meal_type': meal.meal_type.name_ar if meal.meal_type else meal.meal_type.name,
                'name': meal.name,
                'ingredients': []
            }
            
            for ingredient in meal.ingredients.all():
                ingredient_data = {
                    'food_name': ingredient.food.name_ar or ingredient.food.name,
                    'amount': ingredient.amount,
                    'calories': ingredient.food.calories_per_100g * (ingredient.amount / 100),
                    'protein': ingredient.food.protein_per_100g * (ingredient.amount / 100),
                    'carbs': ingredient.food.carbs_per_100g * (ingredient.amount / 100),
                    'fat': ingredient.food.fat_per_100g * (ingredient.amount / 100),
                    'fiber': ingredient.food.fiber_per_100g * (ingredient.amount / 100)
                }
                meal_data['ingredients'].append(ingredient_data)
            
            meals.append(meal_data)
        return meals


class MealTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealType
        fields = '__all__'


class MealIngredientSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food.name', read_only=True)
    food_name_ar = serializers.CharField(source='food.name_ar', read_only=True)
    nutrition = serializers.SerializerMethodField()
    calories_per_100g = serializers.FloatField(source='food.calories_per_100g', read_only=True)
    protein_per_100g = serializers.FloatField(source='food.protein_per_100g', read_only=True)
    carbs_per_100g = serializers.FloatField(source='food.carbs_per_100g', read_only=True)
    fat_per_100g = serializers.FloatField(source='food.fat_per_100g', read_only=True)
    fiber_per_100g = serializers.FloatField(source='food.fiber_per_100g', read_only=True)
    sugar_per_100g = serializers.FloatField(source='food.sugar_per_100g', read_only=True)
    sodium_per_100g = serializers.FloatField(source='food.sodium_per_100g', read_only=True)
    
    class Meta:
        model = MealIngredient
        fields = '__all__'
    
    def get_nutrition(self, obj):
        return obj.get_nutrition()


class MealSerializer(serializers.ModelSerializer):
    ingredients = MealIngredientSerializer(many=True, read_only=True)
    meal_type_name = serializers.CharField(source='meal_type.name', read_only=True)
    meal_type_name_ar = serializers.CharField(source='meal_type.name_ar', read_only=True)
    total_nutrition = serializers.SerializerMethodField()
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = Meal
        fields = '__all__'
    
    def get_total_nutrition(self, obj):
        return obj.get_total_nutrition()


class MealPlanSerializer(serializers.ModelSerializer):
    meals = MealSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = MealPlan
        fields = '__all__'
        read_only_fields = ['doctor', 'delivered_at', 'acknowledged_at']
    
    def update(self, instance, validated_data):
        print(f"🔍 MealPlanSerializer.update called with data:", validated_data)
        print(f"🔍 Current instance data: start_date={instance.start_date}, end_date={instance.end_date}")
        
        # تحديث البيانات
        updated_instance = super().update(instance, validated_data)
        
        print(f"✅ Updated instance data: start_date={updated_instance.start_date}, end_date={updated_instance.end_date}")
        return updated_instance


class MealPlanProgressSerializer(serializers.ModelSerializer):
    meal_name = serializers.CharField(source='meal.name', read_only=True)
    meal_type_name = serializers.CharField(source='meal.meal_type.name', read_only=True)
    
    class Meta:
        model = MealPlanProgress
        fields = '__all__'
        read_only_fields = ['meal_plan']


class RecipeIngredientSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source='food.name', read_only=True)
    food_name_ar = serializers.CharField(source='food.name_ar', read_only=True)
    
    class Meta:
        model = RecipeIngredient
        fields = '__all__'


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Recipe
        fields = '__all__'
        read_only_fields = ['created_by']


class MealPlanCreateSerializer(serializers.ModelSerializer):
    meals = serializers.ListField(write_only=True, required=False)
    
    class Meta:
        model = MealPlan
        fields = '__all__'
        read_only_fields = ['doctor', 'delivered_at', 'acknowledged_at']
    
    def create(self, validated_data):
        meals_data = validated_data.pop('meals', [])
        
        # Ensure only one meal plan is active per patient
        patient = validated_data.get('patient')
        if patient:
            # Deactivate all other active meal plans for this patient
            MealPlan.objects.filter(
                patient=patient,
                is_active=True
            ).update(is_active=False)
        
        meal_plan = MealPlan.objects.create(**validated_data)
        
        # Create meals for the meal plan
        for meal_data in meals_data:
            # Create meal type if it doesn't exist
            meal_type_name = meal_data.get('meal_type', 'breakfast')
            meal_type, created = MealType.objects.get_or_create(
                name=meal_type_name,
                defaults={'name_ar': meal_type_name, 'order': 0}
            )
            
            # Create meal
            meal = Meal.objects.create(
                meal_plan=meal_plan,
                meal_type=meal_type,
                day_of_week=0,  # Default to Monday
                name=meal_data.get('name', ''),
                description=meal_data.get('description', ''),
                instructions=meal_data.get('instructions', ''),
                prep_time=meal_data.get('prep_time', None)
            )
            
            # Create meal ingredients if any
            ingredients_data = meal_data.get('ingredients', [])
            for ingredient_data in ingredients_data:
                if isinstance(ingredient_data, str):
                    # If ingredient is just a string, try to find a food or create a basic one
                    try:
                        # Try to get the first available food
                        food = Food.objects.first()
                        if not food:
                            # Create a basic food if none exists
                            category, _ = FoodCategory.objects.get_or_create(
                                name='Other',
                                defaults={'name_ar': 'أخرى'}
                            )
                            food = Food.objects.create(
                                name='Basic Food',
                                name_ar='طعام أساسي',
                                category=category,
                                calories_per_100g=100,
                                protein_per_100g=5,
                                carbs_per_100g=15,
                                fat_per_100g=2
                            )
                        
                        MealIngredient.objects.create(
                            meal=meal,
                            food=food,
                            amount=100,  # Default amount
                            notes=ingredient_data
                        )
                    except Exception as e:
                        # If food creation fails, just create the meal without ingredients
                        print(f"Failed to create ingredient: {e}")
                        
                elif isinstance(ingredient_data, dict):
                    # If ingredient is a dictionary with food details
                    try:
                        food_id = ingredient_data.get('food_id', 1)
                        food = Food.objects.get(id=food_id)
                        MealIngredient.objects.create(
                            meal=meal,
                            food=food,
                            amount=ingredient_data.get('amount', 100),
                            notes=ingredient_data.get('notes', '')
                        )
                    except Food.DoesNotExist:
                        # If food doesn't exist, create a basic one
                        category, _ = FoodCategory.objects.get_or_create(
                            name='Other',
                            defaults={'name_ar': 'أخرى'}
                        )
                        food = Food.objects.create(
                            name=f"Food {food_id}",
                            name_ar=f"طعام {food_id}",
                            category=category,
                            calories_per_100g=100,
                            protein_per_100g=5,
                            carbs_per_100g=15,
                            fat_per_100g=2
                        )
                        MealIngredient.objects.create(
                            meal=meal,
                            food=food,
                            amount=ingredient_data.get('amount', 100),
                            notes=ingredient_data.get('notes', '')
                        )
        
        return meal_plan
