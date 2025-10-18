"""
تحديث القيم الغذائية للأطعمة العراقية
Update Iraqi Food Nutrition Values
"""

from django.core.management.base import BaseCommand
from django.db.models import Q
from meal_plans.models import Food, FoodCategory


class Command(BaseCommand):
    help = 'تحديث القيم الغذائية للأطعمة العراقية'

    def handle(self, *args, **options):
        self.stdout.write('بدء تحديث القيم الغذائية للأطعمة العراقية...')
        
        # بيانات القيم الغذائية للأطعمة العراقية
        iraqi_foods_nutrition = {
            # الأرز العراقي
            'الأرز العراقي': {
                'calories_per_100g': 130,
                'protein_per_100g': 2.7,
                'carbs_per_100g': 28.0,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 0.4,
                'sugar_per_100g': 0.1,
                'sodium_per_100g': 1.0,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 28,
                'iron': 0.8
            },
            
            # القيمة العراقي
            'القيمة العراقي': {
                'calories_per_100g': 180,
                'protein_per_100g': 6.0,
                'carbs_per_100g': 30.0,
                'fat_per_100g': 3.5,
                'fiber_per_100g': 2.0,
                'sugar_per_100g': 1.0,
                'sodium_per_100g': 5.0,
                'vitamin_a': 15,
                'vitamin_c': 2.0,
                'vitamin_d': 0,
                'calcium': 50,
                'iron': 1.2
            },
            
            # الكباب العراقي
            'الكباب العراقي': {
                'calories_per_100g': 250,
                'protein_per_100g': 25.0,
                'carbs_per_100g': 2.0,
                'fat_per_100g': 15.0,
                'fiber_per_100g': 0.5,
                'sugar_per_100g': 0.5,
                'sodium_per_100g': 400,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 20,
                'iron': 3.0
            },
            
            # المقلوبة العراقية
            'المقلوبة العراقية': {
                'calories_per_100g': 220,
                'protein_per_100g': 8.0,
                'carbs_per_100g': 35.0,
                'fat_per_100g': 5.0,
                'fiber_per_100g': 3.0,
                'sugar_per_100g': 2.0,
                'sodium_per_100g': 300,
                'vitamin_a': 200,
                'vitamin_c': 15.0,
                'vitamin_d': 0,
                'calcium': 40,
                'iron': 1.5
            },
            
            # الدولمة العراقية
            'الدولمة العراقية': {
                'calories_per_100g': 120,
                'protein_per_100g': 4.0,
                'carbs_per_100g': 20.0,
                'fat_per_100g': 2.5,
                'fiber_per_100g': 4.0,
                'sugar_per_100g': 3.0,
                'sodium_per_100g': 200,
                'vitamin_a': 300,
                'vitamin_c': 25.0,
                'vitamin_d': 0,
                'calcium': 60,
                'iron': 1.0
            },
            
            # الباجة العراقية
            'الباجة العراقية': {
                'calories_per_100g': 280,
                'protein_per_100g': 20.0,
                'carbs_per_100g': 5.0,
                'fat_per_100g': 20.0,
                'fiber_per_100g': 0.0,
                'sugar_per_100g': 0.0,
                'sodium_per_100g': 500,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 10,
                'iron': 2.5
            },
            
            # المندي العراقي
            'المندي العراقي': {
                'calories_per_100g': 200,
                'protein_per_100g': 18.0,
                'carbs_per_100g': 15.0,
                'fat_per_100g': 8.0,
                'fiber_per_100g': 2.0,
                'sugar_per_100g': 1.0,
                'sodium_per_100g': 350,
                'vitamin_a': 50,
                'vitamin_c': 5.0,
                'vitamin_d': 0,
                'calcium': 30,
                'iron': 2.0
            },
            
            # الكبة العراقية
            'الكبة العراقية': {
                'calories_per_100g': 190,
                'protein_per_100g': 12.0,
                'carbs_per_100g': 20.0,
                'fat_per_100g': 6.0,
                'fiber_per_100g': 2.5,
                'sugar_per_100g': 1.5,
                'sodium_per_100g': 250,
                'vitamin_a': 100,
                'vitamin_c': 8.0,
                'vitamin_d': 0,
                'calcium': 45,
                'iron': 1.8
            },
            
            # المنسف العراقي
            'المنسف العراقي': {
                'calories_per_100g': 240,
                'protein_per_100g': 22.0,
                'carbs_per_100g': 12.0,
                'fat_per_100g': 12.0,
                'fiber_per_100g': 1.5,
                'sugar_per_100g': 0.5,
                'sodium_per_100g': 400,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 25,
                'iron': 2.2
            },
            
            # البقلاوة العراقية
            'البقلاوة العراقية': {
                'calories_per_100g': 350,
                'protein_per_100g': 6.0,
                'carbs_per_100g': 45.0,
                'fat_per_100g': 18.0,
                'fiber_per_100g': 2.0,
                'sugar_per_100g': 25.0,
                'sodium_per_100g': 100,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 80,
                'iron': 1.0
            },
            
            # الزلابية العراقية
            'الزلابية العراقية': {
                'calories_per_100g': 320,
                'protein_per_100g': 4.0,
                'carbs_per_100g': 50.0,
                'fat_per_100g': 12.0,
                'fiber_per_100g': 1.0,
                'sugar_per_100g': 30.0,
                'sodium_per_100g': 50,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 60,
                'iron': 0.8
            },
            
            # الكنافة العراقية
            'الكنافة العراقية': {
                'calories_per_100g': 380,
                'protein_per_100g': 8.0,
                'carbs_per_100g': 55.0,
                'fat_per_100g': 15.0,
                'fiber_per_100g': 1.5,
                'sugar_per_100g': 35.0,
                'sodium_per_100g': 80,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 100,
                'iron': 1.2
            },
            
            # الحلاوة العراقية
            'الحلاوة العراقية': {
                'calories_per_100g': 420,
                'protein_per_100g': 10.0,
                'carbs_per_100g': 60.0,
                'fat_per_100g': 18.0,
                'fiber_per_100g': 2.0,
                'sugar_per_100g': 40.0,
                'sodium_per_100g': 60,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 120,
                'iron': 1.5
            },
            
            # الشاي العراقي
            'الشاي العراقي': {
                'calories_per_100g': 2,
                'protein_per_100g': 0.2,
                'carbs_per_100g': 0.3,
                'fat_per_100g': 0.0,
                'fiber_per_100g': 0.0,
                'sugar_per_100g': 0.0,
                'sodium_per_100g': 5,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 5,
                'iron': 0.1
            },
            
            # القهوة العراقية
            'القهوة العراقية': {
                'calories_per_100g': 5,
                'protein_per_100g': 0.3,
                'carbs_per_100g': 0.8,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 0.0,
                'sugar_per_100g': 0.0,
                'sodium_per_100g': 2,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 2,
                'iron': 0.1
            },
            
            # الخبز العراقي
            'الخبز العراقي': {
                'calories_per_100g': 265,
                'protein_per_100g': 8.0,
                'carbs_per_100g': 50.0,
                'fat_per_100g': 3.0,
                'fiber_per_100g': 2.5,
                'sugar_per_100g': 1.0,
                'sodium_per_100g': 400,
                'vitamin_a': 0,
                'vitamin_c': 0,
                'vitamin_d': 0,
                'calcium': 100,
                'iron': 2.0
            },
            
            # الجبن العراقي
            'الجبن العراقي': {
                'calories_per_100g': 300,
                'protein_per_100g': 25.0,
                'carbs_per_100g': 2.0,
                'fat_per_100g': 22.0,
                'fiber_per_100g': 0.0,
                'sugar_per_100g': 1.0,
                'sodium_per_100g': 600,
                'vitamin_a': 200,
                'vitamin_c': 0,
                'vitamin_d': 0.5,
                'calcium': 500,
                'iron': 0.5
            },
            
            # اللبن العراقي
            'اللبن العراقي': {
                'calories_per_100g': 60,
                'protein_per_100g': 3.5,
                'carbs_per_100g': 4.5,
                'fat_per_100g': 3.0,
                'fiber_per_100g': 0.0,
                'sugar_per_100g': 4.5,
                'sodium_per_100g': 40,
                'vitamin_a': 30,
                'vitamin_c': 1.0,
                'vitamin_d': 0.1,
                'calcium': 120,
                'iron': 0.1
            },
            
            # التمر العراقي
            'التمر العراقي': {
                'calories_per_100g': 280,
                'protein_per_100g': 2.5,
                'carbs_per_100g': 75.0,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 6.7,
                'sugar_per_100g': 66.0,
                'sodium_per_100g': 1,
                'vitamin_a': 7,
                'vitamin_c': 0.4,
                'vitamin_d': 0,
                'calcium': 39,
                'iron': 1.0
            }
        }
        
        updated_count = 0
        created_count = 0
        
        for food_name_ar, nutrition_data in iraqi_foods_nutrition.items():
            try:
                # البحث عن الطعام بالاسم العربي أو الإنجليزي
                food = Food.objects.filter(
                    Q(name_ar=food_name_ar) | Q(name=food_name_ar)
                ).first()
                
                if food:
                    # تحديث القيم الغذائية
                    for field, value in nutrition_data.items():
                        setattr(food, field, value)
                    food.save()
                    updated_count += 1
                    self.stdout.write(f'تم تحديث: {food_name_ar}')
                else:
                    self.stdout.write(f'لم يتم العثور على: {food_name_ar}')
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'خطأ في تحديث {food_name_ar}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'تم تحديث {updated_count} طعام عراقي بنجاح!'
            )
        )
        
        # إضافة معلومات إضافية
        self.stdout.write('\nمعلومات إضافية:')
        self.stdout.write('- تم تحديث القيم الغذائية لكل 100 جرام')
        self.stdout.write('- القيم تشمل: السعرات، البروتين، الكربوهيدرات، الدهون، الألياف')
        self.stdout.write('- تم إضافة الفيتامينات والمعادن الأساسية')
        self.stdout.write('- يمكن الآن استخدام حاسبة القيم الغذائية العراقية')
