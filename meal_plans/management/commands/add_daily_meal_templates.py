"""
إضافة قوالب الوجبات اليومية الصحية
Add Daily Healthy Meal Templates
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from meal_plans.models import Food, FoodCategory, MealPlanTemplate, MealType, Meal, MealIngredient
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'إضافة قوالب الوجبات اليومية الصحية'

    def handle(self, *args, **options):
        self.stdout.write('بدء إضافة قوالب الوجبات اليومية...')
        
        # إنشاء فئات الأطعمة إذا لم تكن موجودة
        self.create_food_categories()
        
        # إنشاء الأطعمة إذا لم تكن موجودة
        self.create_foods()
        
        # إنشاء أنواع الوجبات
        self.create_meal_types()
        
        # إنشاء قوالب الوجبات اليومية
        self.create_daily_meal_templates()
        
        self.stdout.write(
            self.style.SUCCESS('تم إضافة قوالب الوجبات اليومية بنجاح!')
        )

    def create_food_categories(self):
        """إنشاء فئات الأطعمة"""
        categories = [
            {'name': 'Cereals', 'name_ar': 'حبوب'},
            {'name': 'Dairy', 'name_ar': 'ألبان'},
            {'name': 'Fruits', 'name_ar': 'فواكه'},
            {'name': 'Vegetables', 'name_ar': 'خضروات'},
            {'name': 'Protein', 'name_ar': 'بروتين'},
            {'name': 'Nuts', 'name_ar': 'مكسرات'},
            {'name': 'Beverages', 'name_ar': 'مشروبات'},
        ]
        
        for cat_data in categories:
            category, created = FoodCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'name_ar': cat_data['name_ar']}
            )
            if created:
                self.stdout.write(f'تم إنشاء فئة: {cat_data["name_ar"]}')

    def create_foods(self):
        """إنشاء الأطعمة"""
        foods_data = [
            # حبوب
            {'name': 'Oatmeal', 'name_ar': 'شوفان', 'category': 'Cereals', 'calories': 68, 'protein': 2.4, 'carbs': 12, 'fat': 1.4, 'fiber': 1.7},
            {'name': 'Brown Rice', 'name_ar': 'تمن بني', 'category': 'Cereals', 'calories': 111, 'protein': 2.6, 'carbs': 23, 'fat': 0.9, 'fiber': 1.8},
            {'name': 'Bulgur', 'name_ar': 'برغل', 'category': 'Cereals', 'calories': 83, 'protein': 3.1, 'carbs': 18.6, 'fat': 0.2, 'fiber': 4.5},
            {'name': 'Whole Wheat Bread', 'name_ar': 'خبز أسمر', 'category': 'Cereals', 'calories': 247, 'protein': 13.4, 'carbs': 41.3, 'fat': 4.2, 'fiber': 6.0},
            
            # ألبان
            {'name': 'Milk', 'name_ar': 'حليب', 'category': 'Dairy', 'calories': 42, 'protein': 3.4, 'carbs': 5, 'fat': 1, 'fiber': 0},
            {'name': 'Labneh', 'name_ar': 'لبنة', 'category': 'Dairy', 'calories': 59, 'protein': 10, 'carbs': 3.6, 'fat': 0.4, 'fiber': 0},
            {'name': 'Yogurt', 'name_ar': 'لبن كانون', 'category': 'Dairy', 'calories': 59, 'protein': 10, 'carbs': 3.6, 'fat': 0.4, 'fiber': 0},
            
            # فواكه
            {'name': 'Apple', 'name_ar': 'تفاح', 'category': 'Fruits', 'calories': 52, 'protein': 0.3, 'carbs': 14, 'fat': 0.2, 'fiber': 2.4},
            {'name': 'Orange', 'name_ar': 'برتقال', 'category': 'Fruits', 'calories': 47, 'protein': 0.9, 'carbs': 12, 'fat': 0.1, 'fiber': 2.4},
            {'name': 'Strawberry', 'name_ar': 'فراولة', 'category': 'Fruits', 'calories': 32, 'protein': 0.7, 'carbs': 8, 'fat': 0.3, 'fiber': 2},
            
            # خضروات
            {'name': 'Cucumber', 'name_ar': 'خيار', 'category': 'Vegetables', 'calories': 16, 'protein': 0.7, 'carbs': 4, 'fat': 0.1, 'fiber': 0.5},
            {'name': 'Tomato', 'name_ar': 'طماطم', 'category': 'Vegetables', 'calories': 18, 'protein': 0.9, 'carbs': 3.9, 'fat': 0.2, 'fiber': 1.2},
            {'name': 'Mixed Vegetables', 'name_ar': 'خضروات متنوعة', 'category': 'Vegetables', 'calories': 25, 'protein': 1.5, 'carbs': 5, 'fat': 0.2, 'fiber': 2},
            {'name': 'Salad', 'name_ar': 'زلاطة', 'category': 'Vegetables', 'calories': 20, 'protein': 1, 'carbs': 4, 'fat': 0.2, 'fiber': 1.5},
            
            # بروتين
            {'name': 'Chicken Breast', 'name_ar': 'صدر دجاج', 'category': 'Protein', 'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0},
            {'name': 'Fish', 'name_ar': 'سمك', 'category': 'Protein', 'calories': 206, 'protein': 22, 'carbs': 0, 'fat': 12, 'fiber': 0},
            {'name': 'Beef', 'name_ar': 'لحم بقري', 'category': 'Protein', 'calories': 250, 'protein': 26, 'carbs': 0, 'fat': 15, 'fiber': 0},
            {'name': 'Egg', 'name_ar': 'بيض', 'category': 'Protein', 'calories': 155, 'protein': 13, 'carbs': 1.1, 'fat': 11, 'fiber': 0},
            {'name': 'Tuna', 'name_ar': 'تونة', 'category': 'Protein', 'calories': 132, 'protein': 28, 'carbs': 0, 'fat': 1.3, 'fiber': 0},
            
            # مكسرات
            {'name': 'Almonds', 'name_ar': 'لوز', 'category': 'Nuts', 'calories': 579, 'protein': 21, 'carbs': 22, 'fat': 50, 'fiber': 12},
            {'name': 'Walnuts', 'name_ar': 'جوز', 'category': 'Nuts', 'calories': 654, 'protein': 15, 'carbs': 14, 'fat': 65, 'fiber': 6.7},
            
            # مشروبات
            {'name': 'Lentil Soup', 'name_ar': 'شوربة عدس', 'category': 'Beverages', 'calories': 116, 'protein': 9, 'carbs': 20, 'fat': 0.4, 'fiber': 7.9},
            {'name': 'Vegetable Soup', 'name_ar': 'شوربة خضار', 'category': 'Beverages', 'calories': 25, 'protein': 1, 'carbs': 5, 'fat': 0.2, 'fiber': 1.5},
        ]
        
        for food_data in foods_data:
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
                self.stdout.write(f'تم إنشاء طعام: {food_data["name_ar"]}')

    def create_meal_types(self):
        """إنشاء أنواع الوجبات"""
        meal_types = [
            {'name': 'Breakfast', 'name_ar': 'إفطار'},
            {'name': 'Morning Snack', 'name_ar': 'وجبة خفيفة صباحية'},
            {'name': 'Lunch', 'name_ar': 'غداء'},
            {'name': 'Evening Snack', 'name_ar': 'وجبة خفيفة مسائية'},
            {'name': 'Dinner', 'name_ar': 'عشاء'},
        ]
        
        for meal_type_data in meal_types:
            meal_type, created = MealType.objects.get_or_create(
                name=meal_type_data['name'],
                defaults={'name_ar': meal_type_data['name_ar']}
            )
            if created:
                self.stdout.write(f'تم إنشاء نوع وجبة: {meal_type_data["name_ar"]}')

    def create_daily_meal_templates(self):
        """إنشاء قوالب الوجبات اليومية"""
        # الحصول على أنواع الوجبات
        breakfast = MealType.objects.get(name='Breakfast')
        morning_snack = MealType.objects.get(name='Morning Snack')
        lunch = MealType.objects.get(name='Lunch')
        evening_snack = MealType.objects.get(name='Evening Snack')
        dinner = MealType.objects.get(name='Dinner')
        
        # قوالب الوجبات اليومية
        daily_templates = [
            {
                'name': 'خطة يومية صحية - يوم 1',
                'name_ar': 'خطة يومية صحية - يوم 1',
                'description': 'خطة وجبات متوازنة مع التركيز على البروتين والخضروات',
                'meals': [
                    {
                        'type': breakfast,
                        'name': 'إفطار صحي',
                        'ingredients': [
                            {'food': 'شوفان', 'amount': 50},  # 50 جرام شوفان
                            {'food': 'حليب', 'amount': 200},  # 200 مل حليب
                        ]
                    },
                    {
                        'type': morning_snack,
                        'name': 'وجبة خفيفة صباحية',
                        'ingredients': [
                            {'food': 'تفاح', 'amount': 150},  # تفاحة متوسطة
                        ]
                    },
                    {
                        'type': lunch,
                        'name': 'غداء متوازن',
                        'ingredients': [
                            {'food': 'صدر دجاج', 'amount': 150},  # 150 جرام دجاج
                            {'food': 'خضروات متنوعة', 'amount': 200},  # 200 جرام خضروات
                            {'food': 'تمن بني', 'amount': 100},  # نصف كوب أرز بني
                        ]
                    },
                    {
                        'type': evening_snack,
                        'name': 'وجبة خفيفة مسائية',
                        'ingredients': [
                            {'food': 'لبن كانون', 'amount': 150},  # كوب لبن
                        ]
                    },
                    {
                        'type': dinner,
                        'name': 'عشاء خفيف',
                        'ingredients': [
                            {'food': 'شوربة عدس', 'amount': 250},  # كوب شوربة عدس
                            {'food': 'زلاطة', 'amount': 100},  # سلطة
                        ]
                    }
                ]
            },
            {
                'name': 'خطة يومية صحية - يوم 2',
                'name_ar': 'خطة يومية صحية - يوم 2',
                'description': 'خطة وجبات مع التركيز على الأسماك والخضروات',
                'meals': [
                    {
                        'type': breakfast,
                        'name': 'إفطار بروتيني',
                        'ingredients': [
                            {'food': 'بيض', 'amount': 100},  # بيضتين
                            {'food': 'خبز أسمر', 'amount': 50},  # شريحة خبز
                            {'food': 'خيار', 'amount': 100},
                            {'food': 'طماطم', 'amount': 100},
                        ]
                    },
                    {
                        'type': morning_snack,
                        'name': 'وجبة خفيفة صباحية',
                        'ingredients': [
                            {'food': 'لوز', 'amount': 15},  # 5 حبات لوز
                        ]
                    },
                    {
                        'type': lunch,
                        'name': 'غداء بحري',
                        'ingredients': [
                            {'food': 'سمك', 'amount': 150},  # 150 جرام سمك
                            {'food': 'زلاطة', 'amount': 150},
                            {'food': 'خبز أسمر', 'amount': 30},  # نصف شريحة
                        ]
                    },
                    {
                        'type': evening_snack,
                        'name': 'وجبة خفيفة مسائية',
                        'ingredients': [
                            {'food': 'فراولة', 'amount': 100},  # أو تفاحة
                        ]
                    },
                    {
                        'type': dinner,
                        'name': 'عشاء خفيف',
                        'ingredients': [
                            {'food': 'تونة', 'amount': 100},  # تونة
                            {'food': 'زلاطة', 'amount': 150},  # سلطة خضراء
                        ]
                    }
                ]
            },
            # يمكن إضافة المزيد من القوالب هنا
        ]
        
        # إنشاء القوالب
        for template_data in daily_templates:
            # الحصول على مستخدم افتراضي (أول مستخدم في النظام)
            default_user = User.objects.first()
            if not default_user:
                self.stdout.write(self.style.ERROR('لا يوجد مستخدمين في النظام. يرجى إنشاء مستخدم أولاً.'))
                return
                
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
                self.stdout.write(f'تم إنشاء قالب: {template_data["name"]}')
                
                # إنشاء الوجبات للقالب
                for meal_data in template_data['meals']:
                    meal = Meal.objects.create(
                        meal_plan_id=None,  # سيتم ربطها بالقالب لاحقاً
                        meal_type=meal_data['type'],
                        name=meal_data['name'],
                        day_of_week=1  # افتراضياً
                    )
                    
                    # إضافة المكونات للوجبة
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
                self.stdout.write(f'القالب موجود بالفعل: {template_data["name"]}')
