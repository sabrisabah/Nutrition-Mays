from django.core.management.base import BaseCommand
from meal_plans.models import MealPlanTemplate, MealPlan, Meal, MealType, Food, MealIngredient
from accounts.models import User


class Command(BaseCommand):
    help = 'إنشاء وجبات نموذجية للقوالب'

    def handle(self, *args, **options):
        # الحصول على أنواع الوجبات
        try:
            breakfast = MealType.objects.get(name='Breakfast')
            morning_snack = MealType.objects.get(name='Morning Snack')
            lunch = MealType.objects.get(name='Lunch')
            evening_snack = MealType.objects.get(name='Evening Snack')
            dinner = MealType.objects.get(name='Dinner')
        except MealType.DoesNotExist:
            self.stdout.write(self.style.ERROR('أنواع الوجبات غير موجودة. يرجى تشغيل add_daily_meal_templates أولاً'))
            return

        # الحصول على الأطعمة
        foods = {}
        for food in Food.objects.all():
            foods[food.name_ar or food.name] = food

        # الحصول على مستخدم افتراضي
        try:
            default_user = User.objects.filter(is_staff=True).first()
            if not default_user:
                default_user = User.objects.first()
            
            # الحصول على مريض افتراضي
            default_patient = User.objects.filter(role='patient').first()
            if not default_patient:
                default_patient = default_user
        except:
            self.stdout.write(self.style.ERROR('لا يوجد مستخدمين في النظام'))
            return

        # قوالب الوجبات مع الوجبات النموذجية
        template_meals_data = {
            'نظام غذائي متوازن': [
                {
                    'meal_type': breakfast,
                    'name': 'إفطار صحي',
                    'ingredients': [
                        {'food': 'شوفان', 'amount': 50},
                        {'food': 'حليب', 'amount': 200},
                        {'food': 'تفاح', 'amount': 100}
                    ]
                },
                {
                    'meal_type': morning_snack,
                    'name': 'وجبة خفيفة صباحية',
                    'ingredients': [
                        {'food': 'لوز', 'amount': 15}
                    ]
                },
                {
                    'meal_type': lunch,
                    'name': 'غداء متوازن',
                    'ingredients': [
                        {'food': 'صدر دجاج', 'amount': 150},
                        {'food': 'خضروات متنوعة', 'amount': 200},
                        {'food': 'تمن بني', 'amount': 100}
                    ]
                },
                {
                    'meal_type': evening_snack,
                    'name': 'وجبة خفيفة مسائية',
                    'ingredients': [
                        {'food': 'فراولة', 'amount': 100}
                    ]
                },
                {
                    'meal_type': dinner,
                    'name': 'عشاء خفيف',
                    'ingredients': [
                        {'food': 'سمك', 'amount': 120},
                        {'food': 'زلاطة', 'amount': 150}
                    ]
                }
            ],
            'نظام غذائي عالي البروتين': [
                {
                    'meal_type': breakfast,
                    'name': 'إفطار بروتيني',
                    'ingredients': [
                        {'food': 'بيض', 'amount': 100},
                        {'food': 'خبز أسمر', 'amount': 50},
                        {'food': 'لبنة', 'amount': 50}
                    ]
                },
                {
                    'meal_type': morning_snack,
                    'name': 'وجبة خفيفة صباحية',
                    'ingredients': [
                        {'food': 'جوز', 'amount': 20}
                    ]
                },
                {
                    'meal_type': lunch,
                    'name': 'غداء بروتيني',
                    'ingredients': [
                        {'food': 'لحم بقري', 'amount': 150},
                        {'food': 'خضروات متنوعة', 'amount': 200},
                        {'food': 'برغل', 'amount': 80}
                    ]
                },
                {
                    'meal_type': evening_snack,
                    'name': 'وجبة خفيفة مسائية',
                    'ingredients': [
                        {'food': 'لبن كانون', 'amount': 150}
                    ]
                },
                {
                    'meal_type': dinner,
                    'name': 'عشاء بروتيني',
                    'ingredients': [
                        {'food': 'تونة', 'amount': 120},
                        {'food': 'خيار', 'amount': 100},
                        {'food': 'طماطم', 'amount': 100}
                    ]
                }
            ],
            'نظام الكيتو دايت': [
                {
                    'meal_type': breakfast,
                    'name': 'إفطار كيتو',
                    'ingredients': [
                        {'food': 'بيض', 'amount': 100},
                        {'food': 'لوز', 'amount': 30},
                        {'food': 'خيار', 'amount': 100}
                    ]
                },
                {
                    'meal_type': morning_snack,
                    'name': 'وجبة خفيفة صباحية',
                    'ingredients': [
                        {'food': 'جوز', 'amount': 15}
                    ]
                },
                {
                    'meal_type': lunch,
                    'name': 'غداء كيتو',
                    'ingredients': [
                        {'food': 'صدر دجاج', 'amount': 150},
                        {'food': 'خضروات متنوعة', 'amount': 200}
                    ]
                },
                {
                    'meal_type': evening_snack,
                    'name': 'وجبة خفيفة مسائية',
                    'ingredients': [
                        {'food': 'فراولة', 'amount': 50}
                    ]
                },
                {
                    'meal_type': dinner,
                    'name': 'عشاء كيتو',
                    'ingredients': [
                        {'food': 'سمك', 'amount': 150},
                        {'food': 'زلاطة', 'amount': 150}
                    ]
                }
            ]
        }

        created_count = 0
        
        for template in MealPlanTemplate.objects.all():
            # إنشاء MealPlan للقالب
            from datetime import date
            meal_plan, created = MealPlan.objects.get_or_create(
                title=f'Template {template.id}',
                defaults={
                    'patient': default_patient,
                    'doctor': default_user,
                    'description': f'قالب وجبات: {template.name_ar}',
                    'template_id': template.id,
                    'start_date': date.today(),
                    'end_date': date.today(),
                    'target_calories': template.target_calories,
                    'target_protein': template.target_protein_percentage,
                    'target_carbs': template.target_carbs_percentage,
                    'target_fat': template.target_fat_percentage,
                    'is_active': False,  # غير نشط لأنه قالب
                    'status': 'template'
                }
            )
            
            if created:
                self.stdout.write(f'تم إنشاء MealPlan للقالب: {template.name_ar}')
            
            # حذف الوجبات الموجودة مسبقاً
            Meal.objects.filter(meal_plan=meal_plan).delete()
            
            # الحصول على بيانات الوجبات للقالب
            meals_data = template_meals_data.get(template.name_ar, [])
            
            if not meals_data:
                # استخدام بيانات افتراضية
                meals_data = template_meals_data['نظام غذائي متوازن']
            
            # إنشاء الوجبات
            for meal_data in meals_data:
                meal = Meal.objects.create(
                    meal_plan=meal_plan,
                    meal_type=meal_data['meal_type'],
                    name=meal_data['name'],
                    day_of_week=0  # يوم الأحد
                )
                
                # إنشاء المكونات
                for ingredient_data in meal_data['ingredients']:
                    food_name = ingredient_data['food']
                    food = foods.get(food_name)
                    
                    if food:
                        MealIngredient.objects.create(
                            meal=meal,
                            food=food,
                            amount=ingredient_data['amount']
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'لم يتم العثور على الطعام: {food_name}')
                        )
                
                created_count += 1
                self.stdout.write(f'تم إنشاء وجبة: {meal.name}')

        self.stdout.write(
            self.style.SUCCESS(f'تم إنشاء {created_count} وجبة نموذجية بنجاح')
        )
