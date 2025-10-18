from django.core.management.base import BaseCommand
from meal_plans.models import (
    MealPlanTemplate, Food, FoodCategory, MealType, 
    Recipe, MealPlan, Meal, MealIngredient
)
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Create Iraqi traditional meal plan templates'

    def handle(self, *args, **options):
        self.stdout.write('Creating Iraqi meal plan templates...')
        
        # Get or create admin user
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@example.com',
                password='admin123',
                is_superuser=True,
                is_staff=True
            )
        
        # Create Iraqi meal plan templates
        self.create_iraqi_meal_plans(admin_user)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created Iraqi meal plan templates!')
        )

    def create_iraqi_meal_plans(self, admin_user):
        """Create traditional Iraqi meal plan templates"""
        
        iraqi_meal_plans = [
            {
                'name': 'Traditional Iraqi Diet',
                'name_ar': 'النظام الغذائي العراقي التقليدي',
                'plan_type': 'balanced',
                'description': 'نظام غذائي متوازن يعتمد على الأكلات العراقية التقليدية',
                'target_calories': 2000,
                'target_protein_percentage': 20,
                'target_carbs_percentage': 50,
                'target_fat_percentage': 30,
                'meals': [
                    {
                        'meal_type': 'breakfast',
                        'name': 'إفطار عراقي تقليدي',
                        'description': 'خبز عراقي مع جبن أبيض ولبن وزيت زيتون',
                        'ingredients': [
                            {'food': 'Wheat Flour', 'amount': 100, 'notes': 'خبز عراقي طازج'},
                            {'food': 'White Cheese', 'amount': 50, 'notes': 'جبن أبيض عراقي'},
                            {'food': 'Yogurt', 'amount': 150, 'notes': 'لبن طازج'},
                            {'food': 'Olive Oil', 'amount': 10, 'notes': 'زيت زيتون'},
                        ]
                    },
                    {
                        'meal_type': 'lunch',
                        'name': 'غداء عراقي متكامل',
                        'description': 'أرز بسمتي مع لحم ضأن وخضروات',
                        'ingredients': [
                            {'food': 'Basmati Rice', 'amount': 200, 'notes': 'أرز بسمتي مطبوخ'},
                            {'food': 'Lamb Meat', 'amount': 150, 'notes': 'لحم ضأن مشوي'},
                            {'food': 'Tomatoes', 'amount': 100, 'notes': 'طماطم طازجة'},
                            {'food': 'Onions', 'amount': 50, 'notes': 'بصل مقطع'},
                            {'food': 'Sesame Oil', 'amount': 15, 'notes': 'زيت سمسم'},
                        ]
                    },
                    {
                        'meal_type': 'dinner',
                        'name': 'عشاء عراقي خفيف',
                        'description': 'شوربة عدس مع خبز',
                        'ingredients': [
                            {'food': 'Lentils', 'amount': 100, 'notes': 'عدس مطبوخ'},
                            {'food': 'Wheat Flour', 'amount': 80, 'notes': 'خبز عراقي'},
                            {'food': 'Onions', 'amount': 30, 'notes': 'بصل للشوربة'},
                            {'food': 'Cumin', 'amount': 2, 'notes': 'كمون للتوابل'},
                        ]
                    }
                ]
            },
            {
                'name': 'Iraqi High Protein Diet',
                'name_ar': 'النظام الغذائي العراقي عالي البروتين',
                'plan_type': 'high_protein',
                'description': 'نظام غذائي عراقي يركز على البروتين من اللحوم والأسماك',
                'target_calories': 2200,
                'target_protein_percentage': 30,
                'target_carbs_percentage': 40,
                'target_fat_percentage': 30,
                'meals': [
                    {
                        'meal_type': 'breakfast',
                        'name': 'إفطار بروتيني عراقي',
                        'description': 'بيض مع خبز وجبن',
                        'ingredients': [
                            {'food': 'Chicken Breast', 'amount': 100, 'notes': 'صدر دجاج مشوي'},
                            {'food': 'Wheat Flour', 'amount': 80, 'notes': 'خبز عراقي'},
                            {'food': 'White Cheese', 'amount': 40, 'notes': 'جبن أبيض'},
                            {'food': 'Olive Oil', 'amount': 8, 'notes': 'زيت زيتون'},
                        ]
                    },
                    {
                        'meal_type': 'lunch',
                        'name': 'مسكوف عراقي',
                        'description': 'سمك مشوي مع أرز وخضروات',
                        'ingredients': [
                            {'food': 'Basmati Rice', 'amount': 150, 'notes': 'أرز بسمتي'},
                            {'food': 'Lamb Meat', 'amount': 200, 'notes': 'لحم ضأن أو سمك'},
                            {'food': 'Tomatoes', 'amount': 120, 'notes': 'طماطم طازجة'},
                            {'food': 'Onions', 'amount': 80, 'notes': 'بصل مقطع'},
                            {'food': 'Sesame Oil', 'amount': 12, 'notes': 'زيت سمسم'},
                            {'food': 'Cumin', 'amount': 3, 'notes': 'كمون'},
                        ]
                    },
                    {
                        'meal_type': 'dinner',
                        'name': 'كبة عراقية',
                        'description': 'كبة محشوة باللحم',
                        'ingredients': [
                            {'food': 'Lamb Meat', 'amount': 120, 'notes': 'لحم ضأن للكبة'},
                            {'food': 'Wheat Flour', 'amount': 60, 'notes': 'برغل للكبة'},
                            {'food': 'Onions', 'amount': 40, 'notes': 'بصل للحشوة'},
                            {'food': 'Sesame Oil', 'amount': 10, 'notes': 'زيت للقلي'},
                        ]
                    }
                ]
            },
            {
                'name': 'Iraqi Vegetarian Diet',
                'name_ar': 'النظام الغذائي العراقي النباتي',
                'plan_type': 'vegetarian',
                'description': 'نظام غذائي عراقي نباتي يعتمد على البقوليات والخضروات',
                'target_calories': 1800,
                'target_protein_percentage': 18,
                'target_carbs_percentage': 55,
                'target_fat_percentage': 27,
                'meals': [
                    {
                        'meal_type': 'breakfast',
                        'name': 'إفطار نباتي عراقي',
                        'description': 'حمص مع خبز وزيت زيتون',
                        'ingredients': [
                            {'food': 'Chickpeas', 'amount': 100, 'notes': 'حمص مطبوخ'},
                            {'food': 'Wheat Flour', 'amount': 80, 'notes': 'خبز عراقي'},
                            {'food': 'Olive Oil', 'amount': 12, 'notes': 'زيت زيتون'},
                            {'food': 'Cumin', 'amount': 2, 'notes': 'كمون'},
                        ]
                    },
                    {
                        'meal_type': 'lunch',
                        'name': 'فاصوليا عراقية',
                        'description': 'فاصوليا بيضاء مع أرز وخضروات',
                        'ingredients': [
                            {'food': 'Basmati Rice', 'amount': 150, 'notes': 'أرز بسمتي'},
                            {'food': 'Chickpeas', 'amount': 120, 'notes': 'فاصوليا بيضاء مطبوخة'},
                            {'food': 'Tomatoes', 'amount': 100, 'notes': 'طماطم طازجة'},
                            {'food': 'Onions', 'amount': 60, 'notes': 'بصل مقطع'},
                            {'food': 'Olive Oil', 'amount': 10, 'notes': 'زيت زيتون'},
                        ]
                    },
                    {
                        'meal_type': 'dinner',
                        'name': 'دولمة نباتية',
                        'description': 'دولمة محشوة بالأرز والخضروات',
                        'ingredients': [
                            {'food': 'Basmati Rice', 'amount': 100, 'notes': 'أرز بسمتي للحشوة'},
                            {'food': 'Tomatoes', 'amount': 80, 'notes': 'طماطم للحشوة'},
                            {'food': 'Onions', 'amount': 50, 'notes': 'بصل للحشوة'},
                            {'food': 'Olive Oil', 'amount': 8, 'notes': 'زيت زيتون'},
                            {'food': 'Cumin', 'amount': 2, 'notes': 'كمون'},
                        ]
                    }
                ]
            },
            {
                'name': 'Iraqi Weight Loss Diet',
                'name_ar': 'النظام الغذائي العراقي لإنقاص الوزن',
                'plan_type': 'low_carb',
                'description': 'نظام غذائي عراقي منخفض الكربوهيدرات لإنقاص الوزن',
                'target_calories': 1500,
                'target_protein_percentage': 25,
                'target_carbs_percentage': 35,
                'target_fat_percentage': 40,
                'meals': [
                    {
                        'meal_type': 'breakfast',
                        'name': 'إفطار خفيف عراقي',
                        'description': 'جبن أبيض مع زيت زيتون',
                        'ingredients': [
                            {'food': 'White Cheese', 'amount': 80, 'notes': 'جبن أبيض قليل الدسم'},
                            {'food': 'Olive Oil', 'amount': 10, 'notes': 'زيت زيتون'},
                            {'food': 'Yogurt', 'amount': 100, 'notes': 'لبن قليل الدسم'},
                        ]
                    },
                    {
                        'meal_type': 'lunch',
                        'name': 'لحم مشوي مع خضروات',
                        'description': 'لحم ضأن مشوي مع خضروات طازجة',
                        'ingredients': [
                            {'food': 'Lamb Meat', 'amount': 150, 'notes': 'لحم ضأن مشوي'},
                            {'food': 'Tomatoes', 'amount': 100, 'notes': 'طماطم طازجة'},
                            {'food': 'Onions', 'amount': 50, 'notes': 'بصل طازج'},
                            {'food': 'Olive Oil', 'amount': 8, 'notes': 'زيت زيتون'},
                        ]
                    },
                    {
                        'meal_type': 'dinner',
                        'name': 'شوربة خضروات عراقية',
                        'description': 'شوربة خضروات مع لحم قليل',
                        'ingredients': [
                            {'food': 'Lamb Meat', 'amount': 80, 'notes': 'لحم ضأن قليل'},
                            {'food': 'Tomatoes', 'amount': 80, 'notes': 'طماطم للشوربة'},
                            {'food': 'Onions', 'amount': 40, 'notes': 'بصل للشوربة'},
                            {'food': 'Olive Oil', 'amount': 5, 'notes': 'زيت زيتون'},
                        ]
                    }
                ]
            }
        ]
        
        for plan_data in iraqi_meal_plans:
            # Create meal plan template
            template, created = MealPlanTemplate.objects.get_or_create(
                name=plan_data['name'],
                defaults={
                    'name_ar': plan_data['name_ar'],
                    'plan_type': plan_data['plan_type'],
                    'description': plan_data['description'],
                    'target_calories': plan_data['target_calories'],
                    'target_protein_percentage': plan_data['target_protein_percentage'],
                    'target_carbs_percentage': plan_data['target_carbs_percentage'],
                    'target_fat_percentage': plan_data['target_fat_percentage'],
                    'created_by': admin_user,
                    'is_public': True
                }
            )
            
            if created:
                self.stdout.write(f'Created meal plan template: {plan_data["name_ar"]}')
                
                # Create sample meal plan for demonstration
                sample_plan = MealPlan.objects.create(
                    patient=admin_user,  # Using admin as sample patient
                    doctor=admin_user,
                    title=f'عينة - {plan_data["name_ar"]}',
                    description=f'خطة وجبات عراقية تجريبية - {plan_data["description"]}',
                    template=template,
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=7),
                    target_calories=plan_data['target_calories'],
                    target_protein=plan_data['target_calories'] * plan_data['target_protein_percentage'] / 100 / 4,
                    target_carbs=plan_data['target_calories'] * plan_data['target_carbs_percentage'] / 100 / 4,
                    target_fat=plan_data['target_calories'] * plan_data['target_fat_percentage'] / 100 / 9,
                    diet_plan=plan_data['plan_type'],
                    notes='خطة وجبات عراقية تجريبية للمريض',
                    status='delivered'
                )
                
                # Create meals for the sample plan
                for meal_data in plan_data['meals']:
                    meal_type, _ = MealType.objects.get_or_create(
                        name=meal_data['meal_type'],
                        defaults={'name_ar': meal_data['meal_type'], 'order': 1}
                    )
                    
                    meal = Meal.objects.create(
                        meal_plan=sample_plan,
                        meal_type=meal_type,
                        day_of_week=0,  # Monday
                        name=meal_data['name'],
                        description=meal_data['description'],
                        instructions=f'اتبع الوصفة التقليدية العراقية لـ {meal_data["name"]}',
                        prep_time=30
                    )
                    
                    # Add ingredients to the meal
                    for ingredient_data in meal_data['ingredients']:
                        try:
                            food = Food.objects.get(name=ingredient_data['food'])
                            MealIngredient.objects.create(
                                meal=meal,
                                food=food,
                                amount=ingredient_data['amount'],
                                notes=ingredient_data['notes']
                            )
                        except Food.DoesNotExist:
                            self.stdout.write(
                                self.style.WARNING(f'Food not found: {ingredient_data["food"]}')
                            )
                
                self.stdout.write(f'Created sample meal plan: {sample_plan.title}')
            else:
                self.stdout.write(f'Meal plan template already exists: {plan_data["name_ar"]}')
