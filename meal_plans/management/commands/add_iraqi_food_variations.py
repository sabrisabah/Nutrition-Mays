"""
إضافة المزيد من الأطعمة العراقية التقليدية
Add More Iraqi Traditional Foods
"""

from django.core.management.base import BaseCommand
from meal_plans.models import Food, FoodCategory


class Command(BaseCommand):
    help = 'إضافة المزيد من الأطعمة العراقية التقليدية'

    def handle(self, *args, **options):
        self.stdout.write('بدء إضافة الأطعمة العراقية الإضافية...')
        
        # إنشاء فئات إضافية إذا لم تكن موجودة
        self.create_additional_categories()
        
        # إضافة الأطعمة العراقية الإضافية
        self.add_iraqi_food_variations()
        
        self.stdout.write(
            self.style.SUCCESS('تم إضافة الأطعمة العراقية الإضافية بنجاح!')
        )

    def create_additional_categories(self):
        """إنشاء فئات إضافية للأطعمة العراقية"""
        categories = [
            {'name': 'Iraqi Breads', 'name_ar': 'خبز عراقي'},
            {'name': 'Iraqi Sweets', 'name_ar': 'حلويات عراقية'},
            {'name': 'Iraqi Spices', 'name_ar': 'بهارات عراقية'},
            {'name': 'Iraqi Beverages', 'name_ar': 'مشروبات عراقية'},
            {'name': 'Iraqi Condiments', 'name_ar': 'توابل عراقية'},
        ]
        
        for cat_data in categories:
            category, created = FoodCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'name_ar': cat_data['name_ar']}
            )
            if created:
                self.stdout.write(f'تم إنشاء فئة: {cat_data["name_ar"]}')

    def add_iraqi_food_variations(self):
        """إضافة الأطعمة العراقية الإضافية"""
        foods_data = [
            # خبز عراقي
            {'name': 'Samoon', 'name_ar': 'صمون', 'category': 'Iraqi Breads', 'calories': 265, 'protein': 8.5, 'carbs': 49, 'fat': 3.2, 'fiber': 2.1},
            {'name': 'Khubz Tannour', 'name_ar': 'خبز تنور', 'category': 'Iraqi Breads', 'calories': 275, 'protein': 9.1, 'carbs': 52, 'fat': 2.8, 'fiber': 2.5},
            {'name': 'Lavash', 'name_ar': 'لافاش', 'category': 'Iraqi Breads', 'calories': 258, 'protein': 8.2, 'carbs': 48, 'fat': 3.5, 'fiber': 1.8},
            
            # حلويات عراقية
            {'name': 'Baklava', 'name_ar': 'بقلاوة', 'category': 'Iraqi Sweets', 'calories': 428, 'protein': 6.2, 'carbs': 52, 'fat': 22, 'fiber': 1.8},
            {'name': 'Kleicha', 'name_ar': 'كليجة', 'category': 'Iraqi Sweets', 'calories': 385, 'protein': 5.8, 'carbs': 58, 'fat': 15, 'fiber': 2.2},
            {'name': 'Zalabiya', 'name_ar': 'زلابية', 'category': 'Iraqi Sweets', 'calories': 312, 'protein': 4.1, 'carbs': 45, 'fat': 12, 'fiber': 1.5},
            {'name': 'Mamoul', 'name_ar': 'معمول', 'category': 'Iraqi Sweets', 'calories': 445, 'protein': 7.2, 'carbs': 48, 'fat': 25, 'fiber': 2.8},
            {'name': 'Qatayef', 'name_ar': 'قطايف', 'category': 'Iraqi Sweets', 'calories': 298, 'protein': 5.5, 'carbs': 42, 'fat': 12, 'fiber': 1.9},
            
            # بهارات عراقية
            {'name': 'Baharat Mix', 'name_ar': 'بهارات عراقية', 'category': 'Iraqi Spices', 'calories': 251, 'protein': 10.4, 'carbs': 56, 'fat': 3.3, 'fiber': 25.3},
            {'name': 'Sumac', 'name_ar': 'سماق', 'category': 'Iraqi Spices', 'calories': 239, 'protein': 6.4, 'carbs': 52, 'fat': 1.2, 'fiber': 14.3},
            {'name': 'Zaatar', 'name_ar': 'زعتر', 'category': 'Iraqi Spices', 'calories': 264, 'protein': 9.7, 'carbs': 38, 'fat': 4.3, 'fiber': 14.5},
            
            # مشروبات عراقية
            {'name': 'Chai Karak', 'name_ar': 'شاي كرك', 'category': 'Iraqi Beverages', 'calories': 45, 'protein': 1.2, 'carbs': 8.5, 'fat': 1.1, 'fiber': 0.2},
            {'name': 'Arak', 'name_ar': 'عرق', 'category': 'Iraqi Beverages', 'calories': 231, 'protein': 0, 'carbs': 0, 'fat': 0, 'fiber': 0},
            {'name': 'Jallab', 'name_ar': 'جلاب', 'category': 'Iraqi Beverages', 'calories': 85, 'protein': 0.5, 'carbs': 21, 'fat': 0.1, 'fiber': 0.8},
            {'name': 'Tamar Hindi', 'name_ar': 'تمر هندي', 'category': 'Iraqi Beverages', 'calories': 62, 'protein': 0.6, 'carbs': 15, 'fat': 0.1, 'fiber': 1.2},
            
            # توابل عراقية
            {'name': 'Amba', 'name_ar': 'امبا', 'category': 'Iraqi Condiments', 'calories': 35, 'protein': 0.8, 'carbs': 8.2, 'fat': 0.2, 'fiber': 1.5},
            {'name': 'Tahini', 'name_ar': 'طحينة', 'category': 'Iraqi Condiments', 'calories': 595, 'protein': 18, 'carbs': 18, 'fat': 54, 'fiber': 9.3},
            {'name': 'Pomegranate Molasses', 'name_ar': 'دبس رمان', 'category': 'Iraqi Condiments', 'calories': 275, 'protein': 0.3, 'carbs': 68, 'fat': 0.1, 'fiber': 0.2},
            {'name': 'Date Syrup', 'name_ar': 'دبس التمر', 'category': 'Iraqi Condiments', 'calories': 320, 'protein': 1.8, 'carbs': 78, 'fat': 0.1, 'fiber': 0.2},
            
            # أطعمة عراقية تقليدية إضافية
            {'name': 'Kubba Halab', 'name_ar': 'كبة حلب', 'category': 'Protein', 'calories': 285, 'protein': 18, 'carbs': 22, 'fat': 15, 'fiber': 2.1},
            {'name': 'Kubba Mosul', 'name_ar': 'كبة الموصل', 'category': 'Protein', 'calories': 298, 'protein': 19, 'carbs': 25, 'fat': 14, 'fiber': 2.3},
            {'name': 'Dolma', 'name_ar': 'دولمة', 'category': 'Vegetables', 'calories': 125, 'protein': 8.5, 'carbs': 15, 'fat': 3.2, 'fiber': 3.8},
            {'name': 'Fasolia', 'name_ar': 'فاصوليا', 'category': 'Vegetables', 'calories': 95, 'protein': 6.8, 'carbs': 18, 'fat': 0.5, 'fiber': 6.2},
            {'name': 'Bamia', 'name_ar': 'بامية', 'category': 'Vegetables', 'calories': 33, 'protein': 1.9, 'carbs': 7, 'fat': 0.2, 'fiber': 3.2},
            {'name': 'Fasolia Khadra', 'name_ar': 'فاصوليا خضراء', 'category': 'Vegetables', 'calories': 31, 'protein': 1.8, 'carbs': 7, 'fat': 0.1, 'fiber': 2.7},
            
            # أطعمة عراقية تقليدية أخرى
            {'name': 'Masgouf', 'name_ar': 'مسكوف', 'category': 'Protein', 'calories': 206, 'protein': 22, 'carbs': 0, 'fat': 12, 'fiber': 0},
            {'name': 'Tashreeb', 'name_ar': 'تشريب', 'category': 'Cereals', 'calories': 185, 'protein': 12, 'carbs': 25, 'fat': 4.2, 'fiber': 2.8},
            {'name': 'Qeema', 'name_ar': 'قيمة', 'category': 'Protein', 'calories': 245, 'protein': 20, 'carbs': 8, 'fat': 15, 'fiber': 1.2},
            {'name': 'Kebab', 'name_ar': 'كباب', 'category': 'Protein', 'calories': 298, 'protein': 25, 'carbs': 2, 'fat': 20, 'fiber': 0.1},
            {'name': 'Kofta', 'name_ar': 'كفتة', 'category': 'Protein', 'calories': 275, 'protein': 22, 'carbs': 5, 'fat': 18, 'fiber': 0.8},
        ]
        
        for food_data in foods_data:
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
                    self.stdout.write(f'تم إنشاء طعام: {food_data["name_ar"]}')
                else:
                    self.stdout.write(f'الطعام موجود بالفعل: {food_data["name_ar"]}')
            except FoodCategory.DoesNotExist:
                self.stdout.write(f'تحذير: فئة الطعام غير موجودة: {food_data["category"]}')
            except Exception as e:
                self.stdout.write(f'خطأ في إنشاء الطعام {food_data["name_ar"]}: {str(e)}')
