"""
إنشاء قوالب وجبات عراقية متنوعة
Create Diverse Iraqi Meal Templates
"""

from django.core.management.base import BaseCommand
from django.db.utils import IntegrityError
from django.utils import timezone
from meal_plans.models import FoodCategory, Food, MealType, MealPlanTemplate, Meal, MealIngredient, MealPlan
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'إنشاء قوالب وجبات عراقية متنوعة'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('بدء إنشاء قوالب الوجبات العراقية المتنوعة...'))
        
        # التأكد من وجود الأطعمة العراقية
        self.ensure_iraqi_foods_exist()
        
        # إنشاء قوالب الوجبات العراقية المتنوعة
        self.create_iraqi_meal_templates()
        
        self.stdout.write(
            self.style.SUCCESS('تم إنشاء قوالب الوجبات العراقية المتنوعة بنجاح!')
        )

    def ensure_iraqi_foods_exist(self):
        """التأكد من وجود الأطعمة العراقية الأساسية"""
        iraqi_foods = [
            # خبز عراقي
            {'name': 'Samoon', 'name_ar': 'صمون', 'category': 'Iraqi Breads', 'calories': 265, 'protein': 8.5, 'carbs': 49, 'fat': 3.2, 'fiber': 2.1},
            {'name': 'Khubz Tannour', 'name_ar': 'خبز تنور', 'category': 'Iraqi Breads', 'calories': 275, 'protein': 9.1, 'carbs': 52, 'fat': 2.8, 'fiber': 2.5},
            
            # أطعمة عراقية تقليدية
            {'name': 'Masgouf', 'name_ar': 'مسكوف', 'category': 'Protein', 'calories': 206, 'protein': 22, 'carbs': 0, 'fat': 12, 'fiber': 0},
            {'name': 'Kubba Halab', 'name_ar': 'كبة حلب', 'category': 'Protein', 'calories': 285, 'protein': 18, 'carbs': 22, 'fat': 15, 'fiber': 2.1},
            {'name': 'Dolma', 'name_ar': 'دولمة', 'category': 'Vegetables', 'calories': 125, 'protein': 8.5, 'carbs': 15, 'fat': 3.2, 'fiber': 3.8},
            {'name': 'Fasolia', 'name_ar': 'فاصوليا', 'category': 'Vegetables', 'calories': 95, 'protein': 6.8, 'carbs': 18, 'fat': 0.5, 'fiber': 6.2},
            {'name': 'Bamia', 'name_ar': 'بامية', 'category': 'Vegetables', 'calories': 33, 'protein': 1.9, 'carbs': 7, 'fat': 0.2, 'fiber': 3.2},
            {'name': 'Tashreeb', 'name_ar': 'تشريب', 'category': 'Cereals', 'calories': 185, 'protein': 12, 'carbs': 25, 'fat': 4.2, 'fiber': 2.8},
            {'name': 'Qeema', 'name_ar': 'قيمة', 'category': 'Protein', 'calories': 245, 'protein': 20, 'carbs': 8, 'fat': 15, 'fiber': 1.2},
            {'name': 'Kebab', 'name_ar': 'كباب', 'category': 'Protein', 'calories': 298, 'protein': 25, 'carbs': 2, 'fat': 20, 'fiber': 0.1},
            {'name': 'Kofta', 'name_ar': 'كفتة', 'category': 'Protein', 'calories': 275, 'protein': 22, 'carbs': 5, 'fat': 18, 'fiber': 0.8},
            
            # شوربات عراقية
            {'name': 'Lentil Soup', 'name_ar': 'شوربة عدس', 'category': 'Beverages', 'calories': 116, 'protein': 9.0, 'carbs': 20, 'fat': 0.4, 'fiber': 7.9},
            {'name': 'Vegetable Soup', 'name_ar': 'شوربة خضار', 'category': 'Beverages', 'calories': 25, 'protein': 1.0, 'carbs': 5, 'fat': 0.2, 'fiber': 1.5},
            
            # أطعمة أساسية
            {'name': 'Rice', 'name_ar': 'تمن', 'category': 'Cereals', 'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4},
            {'name': 'Chicken', 'name_ar': 'دجاج', 'category': 'Protein', 'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0},
            {'name': 'Lamb', 'name_ar': 'لحم خروف', 'category': 'Protein', 'calories': 294, 'protein': 25, 'carbs': 0, 'fat': 21, 'fiber': 0},
            {'name': 'Egg', 'name_ar': 'بيض', 'category': 'Protein', 'calories': 155, 'protein': 13, 'carbs': 1.1, 'fat': 11, 'fiber': 0},
            
            # خضروات عراقية
            {'name': 'Tomato', 'name_ar': 'طماطم', 'category': 'Vegetables', 'calories': 18, 'protein': 0.9, 'carbs': 3.9, 'fat': 0.2, 'fiber': 1.2},
            {'name': 'Cucumber', 'name_ar': 'خيار', 'category': 'Vegetables', 'calories': 15, 'protein': 0.7, 'carbs': 3.6, 'fat': 0.1, 'fiber': 1.5},
            {'name': 'Onion', 'name_ar': 'بصل', 'category': 'Vegetables', 'calories': 40, 'protein': 1.1, 'carbs': 9.3, 'fat': 0.1, 'fiber': 1.7},
            {'name': 'Garlic', 'name_ar': 'ثوم', 'category': 'Vegetables', 'calories': 149, 'protein': 6.4, 'carbs': 33, 'fat': 0.5, 'fiber': 2.1},
            
            # فواكه عراقية
            {'name': 'Date', 'name_ar': 'تمر', 'category': 'Fruits', 'calories': 277, 'protein': 1.8, 'carbs': 75, 'fat': 0.2, 'fiber': 6.7},
            {'name': 'Pomegranate', 'name_ar': 'رمان', 'category': 'Fruits', 'calories': 83, 'protein': 1.7, 'carbs': 19, 'fat': 1.2, 'fiber': 4},
            {'name': 'Fig', 'name_ar': 'تين', 'category': 'Fruits', 'calories': 74, 'protein': 0.8, 'carbs': 19, 'fat': 0.3, 'fiber': 2.9},
            
            # منتجات ألبان عراقية
            {'name': 'Labneh', 'name_ar': 'لبنة', 'category': 'Dairy', 'calories': 97, 'protein': 10, 'carbs': 4, 'fat': 4, 'fiber': 0},
            {'name': 'Yogurt', 'name_ar': 'لبن', 'category': 'Dairy', 'calories': 59, 'protein': 10, 'carbs': 3.6, 'fat': 0.4, 'fiber': 0},
            {'name': 'Cheese', 'name_ar': 'جبنة', 'category': 'Dairy', 'calories': 113, 'protein': 7, 'carbs': 1, 'fat': 9, 'fiber': 0},
            
            # أطعمة إضافية
            {'name': 'Walnuts', 'name_ar': 'جوز', 'category': 'Nuts', 'calories': 654, 'protein': 15.2, 'carbs': 13.7, 'fat': 65.2, 'fiber': 6.7},
            {'name': 'Almonds', 'name_ar': 'لوز', 'category': 'Nuts', 'calories': 579, 'protein': 21, 'carbs': 21.6, 'fat': 49.9, 'fiber': 12.5},
            {'name': 'Olives', 'name_ar': 'زيتون', 'category': 'Vegetables', 'calories': 115, 'protein': 0.8, 'carbs': 6, 'fat': 10.7, 'fiber': 3.2},
            {'name': 'Salad', 'name_ar': 'سلطة', 'category': 'Vegetables', 'calories': 20, 'protein': 1.0, 'carbs': 4.0, 'fat': 0.2, 'fiber': 1.5},
        ]
        
        for food_data in iraqi_foods:
            try:
                category = FoodCategory.objects.get(name=food_data['category'])
                food, created = Food.objects.get_or_create(
                    name=food_data['name'],
                    defaults={
                        'name_ar': food_data['name_ar'],
                        'category': category,
                        'calories_per_100g': food_data['calories'],
                        'protein_per_100g': food_data['protein'],
                        'carbs_per_100g': food_data['carbs'],
                        'fat_per_100g': food_data['fat'],
                        'fiber_per_100g': food_data['fiber'],
                        'is_active': True
                    }
                )
                if created:
                    self.stdout.write(f'تم إنشاء طعام عراقي: {food_data["name_ar"]}')
            except FoodCategory.DoesNotExist:
                self.stdout.write(f'تحذير: فئة الطعام غير موجودة: {food_data["category"]}')

    def create_iraqi_meal_templates(self):
        """إنشاء قوالب الوجبات العراقية المتنوعة"""
        
        # الحصول على أنواع الوجبات
        breakfast = MealType.objects.get(name='Breakfast')
        morning_snack = MealType.objects.get(name='Morning Snack')
        lunch = MealType.objects.get(name='Lunch')
        evening_snack = MealType.objects.get(name='Evening Snack')
        dinner = MealType.objects.get(name='Dinner')
        
        # الحصول على مستخدم افتراضي
        default_user = User.objects.first()
        if not default_user:
            self.stdout.write(self.style.ERROR('لا يوجد مستخدمين في النظام. يرجى إنشاء مستخدم أولاً.'))
            return
        
        # قوالب الوجبات العراقية المتنوعة
        iraqi_templates = [
            {
                'name': 'خطة وجبات عراقية تقليدية',
                'name_ar': 'خطة وجبات عراقية تقليدية',
                'description': 'خطة وجبات متنوعة بالأطعمة العراقية التقليدية',
                'meals': [
                    {
                        'type': breakfast,
                        'name': 'فطور عراقي تقليدي',
                        'ingredients': [
                            {'food': 'صمون', 'amount': 100},
                            {'food': 'لبنة', 'amount': 50},
                            {'food': 'طماطم', 'amount': 100},
                            {'food': 'خيار', 'amount': 50},
                        ]
                    },
                    {
                        'type': morning_snack,
                        'name': 'سناك صباحي عراقي',
                        'ingredients': [
                            {'food': 'تمر', 'amount': 50},
                            {'food': 'جوز', 'amount': 20},
                        ]
                    },
                    {
                        'type': lunch,
                        'name': 'غداء عراقي متكامل',
                        'ingredients': [
                            {'food': 'مسكوف', 'amount': 150},
                            {'food': 'تمن', 'amount': 150},
                            {'food': 'دولمة', 'amount': 100},
                            {'food': 'سلطة', 'amount': 100},
                        ]
                    },
                    {
                        'type': evening_snack,
                        'name': 'سناك مسائي خفيف',
                        'ingredients': [
                            {'food': 'رمان', 'amount': 100},
                        ]
                    },
                    {
                        'type': dinner,
                        'name': 'عشاء عراقي دافئ',
                        'ingredients': [
                            {'food': 'شوربة عدس', 'amount': 250},
                            {'food': 'خبز تنور', 'amount': 50},
                        ]
                    }
                ]
            },
            {
                'name': 'خطة وجبات عراقية بروتينية',
                'name_ar': 'خطة وجبات عراقية بروتينية',
                'description': 'خطة وجبات عراقية غنية بالبروتين',
                'meals': [
                    {
                        'type': breakfast,
                        'name': 'فطور بروتيني عراقي',
                        'ingredients': [
                            {'food': 'بيض', 'amount': 100},
                            {'food': 'خبز تنور', 'amount': 50},
                            {'food': 'جبنة', 'amount': 30},
                        ]
                    },
                    {
                        'type': morning_snack,
                        'name': 'سناك بروتين',
                        'ingredients': [
                            {'food': 'لبن', 'amount': 150},
                        ]
                    },
                    {
                        'type': lunch,
                        'name': 'غداء بروتين متنوع',
                        'ingredients': [
                            {'food': 'كباب', 'amount': 120},
                            {'food': 'كفتة', 'amount': 100},
                            {'food': 'تمن', 'amount': 100},
                            {'food': 'بامية', 'amount': 150},
                        ]
                    },
                    {
                        'type': evening_snack,
                        'name': 'سناك مسائي',
                        'ingredients': [
                            {'food': 'تين', 'amount': 80},
                        ]
                    },
                    {
                        'type': dinner,
                        'name': 'عشاء بروتين خفيف',
                        'ingredients': [
                            {'food': 'قيمة', 'amount': 100},
                            {'food': 'تشريب', 'amount': 200},
                        ]
                    }
                ]
            },
            {
                'name': 'خطة وجبات عراقية نباتية',
                'name_ar': 'خطة وجبات عراقية نباتية',
                'description': 'خطة وجبات عراقية نباتية متنوعة',
                'meals': [
                    {
                        'type': breakfast,
                        'name': 'فطور نباتي عراقي',
                        'ingredients': [
                            {'food': 'صمون', 'amount': 80},
                            {'food': 'لبنة', 'amount': 40},
                            {'food': 'زيتون', 'amount': 30},
                        ]
                    },
                    {
                        'type': morning_snack,
                        'name': 'سناك فواكه عراقية',
                        'ingredients': [
                            {'food': 'رمان', 'amount': 120},
                        ]
                    },
                    {
                        'type': lunch,
                        'name': 'غداء نباتي متكامل',
                        'ingredients': [
                            {'food': 'دولمة', 'amount': 150},
                            {'food': 'فاصوليا', 'amount': 100},
                            {'food': 'تمن', 'amount': 120},
                            {'food': 'سلطة', 'amount': 100},
                        ]
                    },
                    {
                        'type': evening_snack,
                        'name': 'سناك مسائي نباتي',
                        'ingredients': [
                            {'food': 'تمر', 'amount': 60},
                            {'food': 'لوز', 'amount': 15},
                        ]
                    },
                    {
                        'type': dinner,
                        'name': 'عشاء نباتي دافئ',
                        'ingredients': [
                            {'food': 'شوربة خضار', 'amount': 300},
                            {'food': 'خبز تنور', 'amount': 40},
                        ]
                    }
                ]
            }
        ]
        
        # إنشاء القوالب
        for template_data in iraqi_templates:
            template, created = MealPlanTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults={
                    'name_ar': template_data['name_ar'],
                    'description': template_data['description'],
                    'plan_type': 'balanced',
                    'target_calories': 2000,
                    'target_protein_percentage': 25.0,
                    'target_carbs_percentage': 45.0,
                    'target_fat_percentage': 30.0,
                    'created_by': default_user,
                    'is_public': True
                }
            )
            
            if created:
                self.stdout.write(f'تم إنشاء قالب عراقي: {template_data["name_ar"]}')
                
                # إنشاء الوجبات للقالب
                for meal_data in template_data['meals']:
                    # إنشاء وجبة مؤقتة للقالب (سنحتاج إلى تعديل النموذج لاحقاً)
                    # للآن سنستخدم meal_plan مؤقت
                    temp_meal_plan = MealPlan.objects.create(
                        patient=default_user,
                        doctor=default_user,
                        title=f"Template {template.id}",
                        start_date=timezone.now().date(),
                        end_date=timezone.now().date(),
                        target_calories=2000,
                        target_protein=500,
                        target_carbs=900,
                        target_fat=600,
                        status='template'
                    )
                    
                    meal = Meal.objects.create(
                        meal_plan=temp_meal_plan,
                        meal_type=meal_data['type'],
                        name=meal_data['name'],
                        day_of_week=1
                    )
                    
                    # إضافة المكونات
                    for ingredient_data in meal_data['ingredients']:
                        try:
                            food = Food.objects.get(name_ar=ingredient_data['food'])
                            MealIngredient.objects.create(
                                meal=meal,
                                food=food,
                                amount=ingredient_data['amount']
                            )
                        except Food.DoesNotExist:
                            self.stdout.write(f'تحذير: لم يتم العثور على الطعام: {ingredient_data["food"]}')
                
                self.stdout.write(f'تم إنشاء {len(template_data["meals"])} وجبة للقالب')
            else:
                self.stdout.write(f'القالب موجود بالفعل: {template_data["name_ar"]}')
