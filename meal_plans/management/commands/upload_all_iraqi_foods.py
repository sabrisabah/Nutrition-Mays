from django.core.management.base import BaseCommand
from meal_plans.models import FoodCategory, Food


class Command(BaseCommand):
    help = 'Upload all Iraqi foods with complete nutritional data to the backend'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting Iraqi foods upload...'))
        
        # Create or get food categories
        categories_data = {
            'Fruits': {'name_ar': 'الفواكه'},
            'Vegetables': {'name_ar': 'الخضروات'},
            'Grains': {'name_ar': 'الحبوب'},
            'Protein': {'name_ar': 'البروتين'},
            'Dairy': {'name_ar': 'الألبان'},
            'Nuts': {'name_ar': 'المكسرات'},
            'Oils': {'name_ar': 'الزيوت'},
            'Legumes': {'name_ar': 'البقوليات'},
            'Beverages': {'name_ar': 'المشروبات'},
            'Condiments': {'name_ar': 'التوابل والصلصات'},
            'Spices': {'name_ar': 'التوابل'},
            'Cereals': {'name_ar': 'الحبوب'},
            'Iraqi Breads': {'name_ar': 'خبز عراقي'},
            'Iraqi Sweets': {'name_ar': 'حلويات عراقية'},
            'Iraqi Spices': {'name_ar': 'توابل عراقية'},
            'Iraqi Beverages': {'name_ar': 'مشروبات عراقية'},
            'Iraqi Condiments': {'name_ar': 'صلصات عراقية'},
        }
        
        categories = {}
        for cat_name, cat_data in categories_data.items():
            category, created = FoodCategory.objects.get_or_create(
                name=cat_name,
                defaults={'name_ar': cat_data['name_ar']}
            )
            categories[cat_name] = category
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {cat_name}'))
        
        # Comprehensive Iraqi foods with nutritional data
        iraqi_foods = [
            # Iraqi Breads - خبز عراقي
            {
                'name': 'Samoon Bread',
                'name_ar': 'خبز صمون',
                'category': 'Iraqi Breads',
                'calories_per_100g': 265,
                'protein_per_100g': 8.5,
                'carbs_per_100g': 52.0,
                'fat_per_100g': 2.5,
                'fiber_per_100g': 2.8,
                'sugar_per_100g': 1.2,
                'sodium_per_100g': 500,
                'common_serving_size': '1 piece',
                'common_serving_weight': 80
            },
            {
                'name': 'Iraqi Bread',
                'name_ar': 'خبز عراقي',
                'category': 'Iraqi Breads',
                'calories_per_100g': 250,
                'protein_per_100g': 8.0,
                'carbs_per_100g': 50.0,
                'fat_per_100g': 2.0,
                'fiber_per_100g': 2.5,
                'sugar_per_100g': 1.0,
                'sodium_per_100g': 450,
                'common_serving_size': '1 piece',
                'common_serving_weight': 100
            },
            {
                'name': 'Tanoor Bread',
                'name_ar': 'خبز التنور',
                'category': 'Iraqi Breads',
                'calories_per_100g': 270,
                'protein_per_100g': 9.0,
                'carbs_per_100g': 53.0,
                'fat_per_100g': 2.2,
                'fiber_per_100g': 3.0,
                'sugar_per_100g': 1.5,
                'sodium_per_100g': 480,
                'common_serving_size': '1 piece',
                'common_serving_weight': 90
            },
            
            # Dairy - الألبان
            {
                'name': 'Iraqi Yogurt',
                'name_ar': 'لبن عراقي',
                'category': 'Dairy',
                'calories_per_100g': 59,
                'protein_per_100g': 10.0,
                'carbs_per_100g': 3.6,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 0,
                'sugar_per_100g': 3.6,
                'sodium_per_100g': 36,
                'calcium': 110,
                'common_serving_size': '1 cup',
                'common_serving_weight': 245
            },
            {
                'name': 'Iraqi White Cheese',
                'name_ar': 'جبن أبيض عراقي',
                'category': 'Dairy',
                'calories_per_100g': 98,
                'protein_per_100g': 11.0,
                'carbs_per_100g': 2.0,
                'fat_per_100g': 5.0,
                'fiber_per_100g': 0,
                'sugar_per_100g': 1.0,
                'sodium_per_100g': 400,
                'calcium': 200,
                'common_serving_size': '100g',
                'common_serving_weight': 100
            },
            {
                'name': 'Buttermilk',
                'name_ar': 'لبن رائب',
                'category': 'Dairy',
                'calories_per_100g': 40,
                'protein_per_100g': 3.3,
                'carbs_per_100g': 4.8,
                'fat_per_100g': 0.9,
                'fiber_per_100g': 0,
                'sugar_per_100g': 4.8,
                'sodium_per_100g': 105,
                'calcium': 116,
                'common_serving_size': '1 cup',
                'common_serving_weight': 245
            },
            
            # Protein - البروتين
            {
                'name': 'Iraqi Kebab',
                'name_ar': 'كباب عراقي',
                'category': 'Protein',
                'calories_per_100g': 250,
                'protein_per_100g': 25.0,
                'carbs_per_100g': 2.0,
                'fat_per_100g': 15.0,
                'fiber_per_100g': 0,
                'sugar_per_100g': 0.5,
                'sodium_per_100g': 600,
                'iron': 2.5,
                'common_serving_size': '1 skewer',
                'common_serving_weight': 150
            },
            {
                'name': 'Grilled Chicken',
                'name_ar': 'دجاج مشوي',
                'category': 'Protein',
                'calories_per_100g': 165,
                'protein_per_100g': 31.0,
                'carbs_per_100g': 0,
                'fat_per_100g': 3.6,
                'fiber_per_100g': 0,
                'sugar_per_100g': 0,
                'sodium_per_100g': 74,
                'iron': 0.9,
                'common_serving_size': '100g',
                'common_serving_weight': 100
            },
            {
                'name': 'Meat Stew',
                'name_ar': 'مرق لحم',
                'category': 'Protein',
                'calories_per_100g': 180,
                'protein_per_100g': 20.0,
                'carbs_per_100g': 3.0,
                'fat_per_100g': 9.0,
                'fiber_per_100g': 0.5,
                'sugar_per_100g': 1.5,
                'sodium_per_100g': 450,
                'iron': 2.0,
                'common_serving_size': '1 cup',
                'common_serving_weight': 250
            },
            
            # Grains - الحبوب
            {
                'name': 'Basmati Rice',
                'name_ar': 'رز بسمتي',
                'category': 'Grains',
                'calories_per_100g': 130,
                'protein_per_100g': 2.7,
                'carbs_per_100g': 28.0,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 0.4,
                'sugar_per_100g': 0.1,
                'sodium_per_100g': 1,
                'iron': 0.8,
                'common_serving_size': '1 cup cooked',
                'common_serving_weight': 200
            },
            
            # Vegetables - الخضروات
            {
                'name': 'Fresh Tomatoes',
                'name_ar': 'طماطم طازجة',
                'category': 'Vegetables',
                'calories_per_100g': 18,
                'protein_per_100g': 0.9,
                'carbs_per_100g': 3.9,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 1.2,
                'sugar_per_100g': 2.6,
                'sodium_per_100g': 5,
                'vitamin_c': 13.7,
                'vitamin_a': 833,
                'common_serving_size': '1 medium',
                'common_serving_weight': 150
            },
            {
                'name': 'Onion and Tomato',
                'name_ar': 'بصل وطماطم',
                'category': 'Vegetables',
                'calories_per_100g': 25,
                'protein_per_100g': 1.0,
                'carbs_per_100g': 5.5,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 1.5,
                'sugar_per_100g': 3.5,
                'sodium_per_100g': 8,
                'vitamin_c': 10.0,
                'common_serving_size': '100g',
                'common_serving_weight': 100
            },
            {
                'name': 'Vegetable Salad',
                'name_ar': 'سلطة خضار',
                'category': 'Vegetables',
                'calories_per_100g': 20,
                'protein_per_100g': 1.2,
                'carbs_per_100g': 4.0,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 2.0,
                'sugar_per_100g': 2.5,
                'sodium_per_100g': 10,
                'vitamin_c': 15.0,
                'common_serving_size': '1 cup',
                'common_serving_weight': 150
            },
            {
                'name': 'Mixed Vegetables',
                'name_ar': 'خضار مشكلة',
                'category': 'Vegetables',
                'calories_per_100g': 35,
                'protein_per_100g': 2.0,
                'carbs_per_100g': 7.0,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 2.5,
                'sugar_per_100g': 4.0,
                'sodium_per_100g': 15,
                'vitamin_c': 20.0,
                'common_serving_size': '1 cup',
                'common_serving_weight': 200
            },
            {
                'name': 'Fresh Vegetables',
                'name_ar': 'خضار طازجة',
                'category': 'Vegetables',
                'calories_per_100g': 30,
                'protein_per_100g': 1.5,
                'carbs_per_100g': 6.0,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 2.0,
                'sugar_per_100g': 3.5,
                'sodium_per_100g': 12,
                'vitamin_c': 18.0,
                'common_serving_size': '100g',
                'common_serving_weight': 100
            },
            
            # Nuts - المكسرات
            {
                'name': 'Iraqi Walnuts',
                'name_ar': 'جوز عراقي',
                'category': 'Nuts',
                'calories_per_100g': 654,
                'protein_per_100g': 15.2,
                'carbs_per_100g': 13.7,
                'fat_per_100g': 65.2,
                'fiber_per_100g': 6.7,
                'sugar_per_100g': 2.6,
                'sodium_per_100g': 2,
                'calcium': 98,
                'iron': 2.9,
                'common_serving_size': '1/4 cup',
                'common_serving_weight': 30
            },
            
            # Oils - الزيوت
            {
                'name': 'Olive Oil',
                'name_ar': 'زيت زيتون',
                'category': 'Oils',
                'calories_per_100g': 884,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 100.0,
                'fiber_per_100g': 0,
                'sugar_per_100g': 0,
                'sodium_per_100g': 2,
                'vitamin_e': 14.0,
                'common_serving_size': '1 tbsp',
                'common_serving_weight': 15
            },
            {
                'name': 'Black Olives',
                'name_ar': 'زيتون أسود',
                'category': 'Oils',
                'calories_per_100g': 115,
                'protein_per_100g': 0.8,
                'carbs_per_100g': 6.0,
                'fat_per_100g': 10.7,
                'fiber_per_100g': 3.2,
                'sugar_per_100g': 0,
                'sodium_per_100g': 735,
                'iron': 3.3,
                'common_serving_size': '10 olives',
                'common_serving_weight': 30
            },
            
            # Fruits - الفواكه
            {
                'name': 'Iraqi Dates',
                'name_ar': 'تمر عراقي',
                'category': 'Fruits',
                'calories_per_100g': 282,
                'protein_per_100g': 2.5,
                'carbs_per_100g': 75.0,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 8.0,
                'sugar_per_100g': 63.0,
                'sodium_per_100g': 1,
                'iron': 1.0,
                'potassium': 656,
                'common_serving_size': '3 dates',
                'common_serving_weight': 24
            },
            
            # Iraqi Sweets - حلويات عراقية
            {
                'name': 'Tahini Halva',
                'name_ar': 'حلاوة طحينية',
                'category': 'Iraqi Sweets',
                'calories_per_100g': 520,
                'protein_per_100g': 12.0,
                'carbs_per_100g': 54.0,
                'fat_per_100g': 30.0,
                'fiber_per_100g': 2.0,
                'sugar_per_100g': 50.0,
                'sodium_per_100g': 50,
                'calcium': 50,
                'iron': 2.0,
                'common_serving_size': '50g',
                'common_serving_weight': 50
            },
            {
                'name': 'Iraqi Biscuit',
                'name_ar': 'بسكويت عراقي',
                'category': 'Iraqi Sweets',
                'calories_per_100g': 450,
                'protein_per_100g': 7.0,
                'carbs_per_100g': 65.0,
                'fat_per_100g': 18.0,
                'fiber_per_100g': 2.5,
                'sugar_per_100g': 25.0,
                'sodium_per_100g': 400,
                'common_serving_size': '2 pieces',
                'common_serving_weight': 30
            },
            {
                'name': 'Natural Honey',
                'name_ar': 'عسل طبيعي',
                'category': 'Iraqi Sweets',
                'calories_per_100g': 304,
                'protein_per_100g': 0.3,
                'carbs_per_100g': 82.0,
                'fat_per_100g': 0,
                'fiber_per_100g': 0.2,
                'sugar_per_100g': 82.0,
                'sodium_per_100g': 4,
                'common_serving_size': '1 tbsp',
                'common_serving_weight': 21
            },
            
            # Beverages - المشروبات
            {
                'name': 'Iraqi Tea',
                'name_ar': 'شاي عراقي',
                'category': 'Iraqi Beverages',
                'calories_per_100g': 2,
                'protein_per_100g': 0.1,
                'carbs_per_100g': 0.3,
                'fat_per_100g': 0,
                'fiber_per_100g': 0,
                'sugar_per_100g': 0,
                'sodium_per_100g': 3,
                'caffeine': 20,
                'common_serving_size': '1 cup',
                'common_serving_weight': 240
            },
            {
                'name': 'Milk Tea',
                'name_ar': 'شاي بالحليب',
                'category': 'Iraqi Beverages',
                'calories_per_100g': 30,
                'protein_per_100g': 1.5,
                'carbs_per_100g': 4.5,
                'fat_per_100g': 1.0,
                'fiber_per_100g': 0,
                'sugar_per_100g': 4.0,
                'sodium_per_100g': 20,
                'calcium': 50,
                'common_serving_size': '1 cup',
                'common_serving_weight': 240
            },
            
            # Legumes - البقوليات
            {
                'name': 'Chickpeas',
                'name_ar': 'حمص',
                'category': 'Legumes',
                'calories_per_100g': 364,
                'protein_per_100g': 19.3,
                'carbs_per_100g': 60.7,
                'fat_per_100g': 6.0,
                'fiber_per_100g': 17.4,
                'sugar_per_100g': 10.7,
                'sodium_per_100g': 24,
                'iron': 4.3,
                'calcium': 105,
                'common_serving_size': '1 cup cooked',
                'common_serving_weight': 164
            },
            {
                'name': 'Lentils',
                'name_ar': 'عدس',
                'category': 'Legumes',
                'calories_per_100g': 353,
                'protein_per_100g': 24.6,
                'carbs_per_100g': 63.4,
                'fat_per_100g': 1.1,
                'fiber_per_100g': 10.7,
                'sugar_per_100g': 2.0,
                'sodium_per_100g': 6,
                'iron': 6.5,
                'calcium': 56,
                'common_serving_size': '1 cup cooked',
                'common_serving_weight': 198
            },
            {
                'name': 'White Beans',
                'name_ar': 'فاصوليا بيضاء',
                'category': 'Legumes',
                'calories_per_100g': 333,
                'protein_per_100g': 23.4,
                'carbs_per_100g': 60.3,
                'fat_per_100g': 0.9,
                'fiber_per_100g': 15.2,
                'sugar_per_100g': 2.1,
                'sodium_per_100g': 16,
                'iron': 7.7,
                'calcium': 240,
                'common_serving_size': '1 cup cooked',
                'common_serving_weight': 179
            },
            
            # More Vegetables
            {
                'name': 'Eggplant',
                'name_ar': 'باذنجان',
                'category': 'Vegetables',
                'calories_per_100g': 25,
                'protein_per_100g': 1.0,
                'carbs_per_100g': 6.0,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 3.0,
                'sugar_per_100g': 3.5,
                'sodium_per_100g': 2,
                'vitamin_c': 2.2,
                'common_serving_size': '1 medium',
                'common_serving_weight': 200
            },
            {
                'name': 'Onions',
                'name_ar': 'بصل',
                'category': 'Vegetables',
                'calories_per_100g': 40,
                'protein_per_100g': 1.1,
                'carbs_per_100g': 9.3,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 1.7,
                'sugar_per_100g': 4.2,
                'sodium_per_100g': 4,
                'vitamin_c': 7.4,
                'common_serving_size': '1 medium',
                'common_serving_weight': 100
            },
            {
                'name': 'Cucumber',
                'name_ar': 'خيار',
                'category': 'Vegetables',
                'calories_per_100g': 16,
                'protein_per_100g': 0.7,
                'carbs_per_100g': 3.6,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 0.5,
                'sugar_per_100g': 1.7,
                'sodium_per_100g': 2,
                'vitamin_c': 2.8,
                'common_serving_size': '1 medium',
                'common_serving_weight': 150
            },
            {
                'name': 'Bell Pepper',
                'name_ar': 'فلفل رومي',
                'category': 'Vegetables',
                'calories_per_100g': 31,
                'protein_per_100g': 1.0,
                'carbs_per_100g': 7.0,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 2.5,
                'sugar_per_100g': 5.0,
                'sodium_per_100g': 4,
                'vitamin_c': 127.7,
                'vitamin_a': 3131,
                'common_serving_size': '1 medium',
                'common_serving_weight': 150
            },
            
            # More Fruits
            {
                'name': 'Watermelon',
                'name_ar': 'بطيخ',
                'category': 'Fruits',
                'calories_per_100g': 30,
                'protein_per_100g': 0.6,
                'carbs_per_100g': 7.6,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 0.4,
                'sugar_per_100g': 6.2,
                'sodium_per_100g': 1,
                'vitamin_c': 8.1,
                'vitamin_a': 569,
                'common_serving_size': '1 cup diced',
                'common_serving_weight': 152
            },
            {
                'name': 'Grapes',
                'name_ar': 'عنب',
                'category': 'Fruits',
                'calories_per_100g': 69,
                'protein_per_100g': 0.7,
                'carbs_per_100g': 18.0,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 0.9,
                'sugar_per_100g': 16.0,
                'sodium_per_100g': 3,
                'vitamin_c': 3.2,
                'common_serving_size': '1 cup',
                'common_serving_weight': 151
            },
            {
                'name': 'Pomegranate',
                'name_ar': 'رمان',
                'category': 'Fruits',
                'calories_per_100g': 83,
                'protein_per_100g': 1.7,
                'carbs_per_100g': 18.7,
                'fat_per_100g': 1.2,
                'fiber_per_100g': 4.0,
                'sugar_per_100g': 13.7,
                'sodium_per_100g': 3,
                'vitamin_c': 10.2,
                'common_serving_size': '1/2 cup arils',
                'common_serving_weight': 87
            },
            
            # More Protein
            {
                'name': 'Lamb Meat',
                'name_ar': 'لحم ضأن',
                'category': 'Protein',
                'calories_per_100g': 294,
                'protein_per_100g': 25.6,
                'carbs_per_100g': 0,
                'fat_per_100g': 20.9,
                'fiber_per_100g': 0,
                'sugar_per_100g': 0,
                'sodium_per_100g': 72,
                'iron': 2.3,
                'common_serving_size': '100g',
                'common_serving_weight': 100
            },
            {
                'name': 'Beef',
                'name_ar': 'لحم بقري',
                'category': 'Protein',
                'calories_per_100g': 250,
                'protein_per_100g': 26.0,
                'carbs_per_100g': 0,
                'fat_per_100g': 15.0,
                'fiber_per_100g': 0,
                'sugar_per_100g': 0,
                'sodium_per_100g': 72,
                'iron': 2.6,
                'common_serving_size': '100g',
                'common_serving_weight': 100
            },
            {
                'name': 'Fish (Carp)',
                'name_ar': 'سمك كارب',
                'category': 'Protein',
                'calories_per_100g': 127,
                'protein_per_100g': 17.8,
                'carbs_per_100g': 0,
                'fat_per_100g': 5.6,
                'fiber_per_100g': 0,
                'sugar_per_100g': 0,
                'sodium_per_100g': 49,
                'iron': 0.3,
                'common_serving_size': '100g',
                'common_serving_weight': 100
            },
            {
                'name': 'Eggs',
                'name_ar': 'بيض',
                'category': 'Protein',
                'calories_per_100g': 155,
                'protein_per_100g': 13.0,
                'carbs_per_100g': 1.1,
                'fat_per_100g': 11.0,
                'fiber_per_100g': 0,
                'sugar_per_100g': 1.1,
                'sodium_per_100g': 124,
                'iron': 1.8,
                'calcium': 56,
                'common_serving_size': '1 large egg',
                'common_serving_weight': 50
            },
            
            # More Spices
            {
                'name': 'Cumin',
                'name_ar': 'كمون',
                'category': 'Iraqi Spices',
                'calories_per_100g': 375,
                'protein_per_100g': 17.8,
                'carbs_per_100g': 44.2,
                'fat_per_100g': 22.3,
                'fiber_per_100g': 10.5,
                'sugar_per_100g': 2.3,
                'sodium_per_100g': 168,
                'iron': 66.4,
                'calcium': 931,
                'common_serving_size': '1 tsp',
                'common_serving_weight': 2
            },
            {
                'name': 'Turmeric',
                'name_ar': 'كركم',
                'category': 'Iraqi Spices',
                'calories_per_100g': 354,
                'protein_per_100g': 7.8,
                'carbs_per_100g': 64.9,
                'fat_per_100g': 9.9,
                'fiber_per_100g': 21.1,
                'sugar_per_100g': 3.2,
                'sodium_per_100g': 38,
                'iron': 41.4,
                'calcium': 183,
                'common_serving_size': '1 tsp',
                'common_serving_weight': 2
            },
            {
                'name': 'Cardamom',
                'name_ar': 'هيل',
                'category': 'Iraqi Spices',
                'calories_per_100g': 311,
                'protein_per_100g': 10.8,
                'carbs_per_100g': 68.5,
                'fat_per_100g': 6.7,
                'fiber_per_100g': 28.0,
                'sugar_per_100g': 0,
                'sodium_per_100g': 18,
                'iron': 13.9,
                'calcium': 383,
                'common_serving_size': '1 tsp',
                'common_serving_weight': 2
            },
            {
                'name': 'Black Pepper',
                'name_ar': 'فلفل أسود',
                'category': 'Iraqi Spices',
                'calories_per_100g': 251,
                'protein_per_100g': 10.4,
                'carbs_per_100g': 63.9,
                'fat_per_100g': 3.3,
                'fiber_per_100g': 25.3,
                'sugar_per_100g': 0.6,
                'sodium_per_100g': 20,
                'iron': 28.9,
                'calcium': 443,
                'common_serving_size': '1 tsp',
                'common_serving_weight': 2
            },
        ]
        
        # Upload foods
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for food_data in iraqi_foods:
            try:
                category = categories.get(food_data['category'])
                if not category:
                    self.stdout.write(
                        self.style.WARNING(f"Category '{food_data['category']}' not found for {food_data['name_ar']}")
                    )
                    skipped_count += 1
                    continue
                
                # Check if food already exists
                food, created = Food.objects.get_or_create(
                    name_ar=food_data['name_ar'],
                    defaults={
                        'name': food_data['name'],
                        'category': category,
                        'calories_per_100g': food_data['calories_per_100g'],
                        'protein_per_100g': food_data.get('protein_per_100g', 0),
                        'carbs_per_100g': food_data.get('carbs_per_100g', 0),
                        'fat_per_100g': food_data.get('fat_per_100g', 0),
                        'fiber_per_100g': food_data.get('fiber_per_100g', 0),
                        'sugar_per_100g': food_data.get('sugar_per_100g', 0),
                        'sodium_per_100g': food_data.get('sodium_per_100g', 0),
                        'vitamin_a': food_data.get('vitamin_a', 0),
                        'vitamin_c': food_data.get('vitamin_c', 0),
                        'vitamin_d': food_data.get('vitamin_d', 0),
                        'calcium': food_data.get('calcium', 0),
                        'iron': food_data.get('iron', 0),
                        'common_serving_size': food_data.get('common_serving_size', ''),
                        'common_serving_weight': food_data.get('common_serving_weight'),
                        'is_active': True,
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Created: {food_data["name_ar"]} ({food_data["name"]})')
                    )
                else:
                    # Update existing food with new nutritional data
                    food.name = food_data['name']
                    food.calories_per_100g = food_data['calories_per_100g']
                    food.protein_per_100g = food_data.get('protein_per_100g', food.protein_per_100g or 0)
                    food.carbs_per_100g = food_data.get('carbs_per_100g', food.carbs_per_100g or 0)
                    food.fat_per_100g = food_data.get('fat_per_100g', food.fat_per_100g or 0)
                    food.fiber_per_100g = food_data.get('fiber_per_100g', food.fiber_per_100g or 0)
                    food.sugar_per_100g = food_data.get('sugar_per_100g', food.sugar_per_100g or 0)
                    food.sodium_per_100g = food_data.get('sodium_per_100g', food.sodium_per_100g or 0)
                    food.vitamin_a = food_data.get('vitamin_a', food.vitamin_a or 0)
                    food.vitamin_c = food_data.get('vitamin_c', food.vitamin_c or 0)
                    food.vitamin_d = food_data.get('vitamin_d', food.vitamin_d or 0)
                    food.calcium = food_data.get('calcium', food.calcium or 0)
                    food.iron = food_data.get('iron', food.iron or 0)
                    food.common_serving_size = food_data.get('common_serving_size', food.common_serving_size or '')
                    food.common_serving_weight = food_data.get('common_serving_weight', food.common_serving_weight)
                    food.is_active = True
                    food.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'↻ Updated: {food_data["name_ar"]} ({food_data["name"]})')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Error creating {food_data["name_ar"]}: {str(e)}')
                )
                skipped_count += 1
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS('Upload Summary:'))
        self.stdout.write(self.style.SUCCESS(f'  Created: {created_count} foods'))
        self.stdout.write(self.style.SUCCESS(f'  Updated: {updated_count} foods'))
        self.stdout.write(self.style.WARNING(f'  Skipped: {skipped_count} foods'))
        self.stdout.write(self.style.SUCCESS(f'  Total: {created_count + updated_count} foods processed'))
        self.stdout.write(self.style.SUCCESS('='*50))

