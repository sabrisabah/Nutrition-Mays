from django.core.management.base import BaseCommand
from meal_plans.models import FoodCategory, Food

class Command(BaseCommand):
    help = 'Setup initial food categories and foods'

    def handle(self, *args, **options):
        # Create food categories
        categories = [
            {'name': 'Grains', 'name_ar': 'الحبوب'},
            {'name': 'Vegetables', 'name_ar': 'الخضروات'},
            {'name': 'Fruits', 'name_ar': 'الفواكه'},
            {'name': 'Protein', 'name_ar': 'البروتين'},
            {'name': 'Dairy', 'name_ar': 'الألبان'},
            {'name': 'Nuts & Seeds', 'name_ar': 'المكسرات والبذور'},
            {'name': 'Healthy Fats', 'name_ar': 'الدهون الصحية'},
            {'name': 'Legumes', 'name_ar': 'البقوليات'},
            {'name': 'Seafood', 'name_ar': 'المأكولات البحرية'},
            {'name': 'Herbs & Spices', 'name_ar': 'الأعشاب والتوابل'},
            {'name': 'Beverages', 'name_ar': 'المشروبات'},
            {'name': 'Condiments', 'name_ar': 'التوابل والصلصات'},
        ]
        
        for cat_data in categories:
            category, created = FoodCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'name_ar': cat_data['name_ar']}
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {category.name}')
                )
        
        # Create some basic foods
        foods = [
            {
                'name': 'Rice',
                'name_ar': 'أرز',
                'category_name': 'Grains',
                'calories_per_100g': 130,
                'protein_per_100g': 2.7,
                'carbs_per_100g': 28,
                'fat_per_100g': 0.3
            },
            {
                'name': 'Chicken Breast',
                'name_ar': 'صدر دجاج',
                'category_name': 'Protein',
                'calories_per_100g': 165,
                'protein_per_100g': 31,
                'carbs_per_100g': 0,
                'fat_per_100g': 3.6
            },
            {
                'name': 'Broccoli',
                'name_ar': 'بروكلي',
                'category_name': 'Vegetables',
                'calories_per_100g': 34,
                'protein_per_100g': 2.8,
                'carbs_per_100g': 7,
                'fat_per_100g': 0.4
            }
        ]
        
        for food_data in foods:
            category = FoodCategory.objects.get(name=food_data['category_name'])
            food, created = Food.objects.get_or_create(
                name=food_data['name'],
                defaults={
                    'name_ar': food_data['name_ar'],
                    'category': category,
                    'calories_per_100g': food_data['calories_per_100g'],
                    'protein_per_100g': food_data['protein_per_100g'],
                    'carbs_per_100g': food_data['carbs_per_100g'],
                    'fat_per_100g': food_data['fat_per_100g']
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created food: {food.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Food already exists: {food.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully setup foods')
        )
