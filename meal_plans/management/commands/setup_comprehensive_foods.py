from django.core.management.base import BaseCommand
from meal_plans.models import FoodCategory, Food

class Command(BaseCommand):
    help = 'Setup comprehensive food database for all diet plans'

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
        
        # Create comprehensive foods for all diet plans
        foods = [
            # Grains - الحبوب
            {
                'name': 'Brown Rice',
                'name_ar': 'أرز بني',
                'category_name': 'Grains',
                'calories_per_100g': 111,
                'protein_per_100g': 2.6,
                'carbs_per_100g': 23,
                'fat_per_100g': 0.9,
                'fiber_per_100g': 1.8
            },
            {
                'name': 'Quinoa',
                'name_ar': 'الكينوا',
                'category_name': 'Grains',
                'calories_per_100g': 120,
                'protein_per_100g': 4.4,
                'carbs_per_100g': 22,
                'fat_per_100g': 1.9,
                'fiber_per_100g': 2.8
            },
            {
                'name': 'Oats',
                'name_ar': 'الشوفان',
                'category_name': 'Grains',
                'calories_per_100g': 389,
                'protein_per_100g': 16.9,
                'carbs_per_100g': 66.3,
                'fat_per_100g': 6.9,
                'fiber_per_100g': 10.6
            },
            {
                'name': 'Whole Wheat Bread',
                'name_ar': 'خبز القمح الكامل',
                'category_name': 'Grains',
                'calories_per_100g': 247,
                'protein_per_100g': 13.4,
                'carbs_per_100g': 41.3,
                'fat_per_100g': 4.2,
                'fiber_per_100g': 6.0
            },
            {
                'name': 'Sweet Potato',
                'name_ar': 'البطاطا الحلوة',
                'category_name': 'Grains',
                'calories_per_100g': 86,
                'protein_per_100g': 1.6,
                'carbs_per_100g': 20.1,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 3.0
            },
            {
                'name': 'White Rice',
                'name_ar': 'أرز أبيض',
                'category_name': 'Grains',
                'calories_per_100g': 130,
                'protein_per_100g': 2.7,
                'carbs_per_100g': 28,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 0.4
            },
            {
                'name': 'Barley',
                'name_ar': 'الشعير',
                'category_name': 'Grains',
                'calories_per_100g': 352,
                'protein_per_100g': 9.9,
                'carbs_per_100g': 77.7,
                'fat_per_100g': 1.2,
                'fiber_per_100g': 15.6
            },
            {
                'name': 'Buckwheat',
                'name_ar': 'الحنطة السوداء',
                'category_name': 'Grains',
                'calories_per_100g': 343,
                'protein_per_100g': 13.3,
                'carbs_per_100g': 71.5,
                'fat_per_100g': 3.4,
                'fiber_per_100g': 10.0
            },

            # Protein - البروتين
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
                'name': 'Chicken Thigh',
                'name_ar': 'فخذ دجاج',
                'category_name': 'Protein',
                'calories_per_100g': 209,
                'protein_per_100g': 18,
                'carbs_per_100g': 0,
                'fat_per_100g': 14
            },
            {
                'name': 'Turkey Breast',
                'name_ar': 'صدر ديك رومي',
                'category_name': 'Protein',
                'calories_per_100g': 135,
                'protein_per_100g': 30,
                'carbs_per_100g': 0,
                'fat_per_100g': 1.5
            },
            {
                'name': 'Lean Beef',
                'name_ar': 'لحم بقري خالي الدهن',
                'category_name': 'Protein',
                'calories_per_100g': 250,
                'protein_per_100g': 26,
                'carbs_per_100g': 0,
                'fat_per_100g': 15
            },
            {
                'name': 'Lamb',
                'name_ar': 'لحم خروف',
                'category_name': 'Protein',
                'calories_per_100g': 294,
                'protein_per_100g': 25,
                'carbs_per_100g': 0,
                'fat_per_100g': 21
            },
            {
                'name': 'Pork Tenderloin',
                'name_ar': 'فيليه خنزير',
                'category_name': 'Protein',
                'calories_per_100g': 143,
                'protein_per_100g': 28,
                'carbs_per_100g': 0,
                'fat_per_100g': 3
            },
            {
                'name': 'Eggs',
                'name_ar': 'البيض',
                'category_name': 'Protein',
                'calories_per_100g': 155,
                'protein_per_100g': 13,
                'carbs_per_100g': 1.1,
                'fat_per_100g': 11
            },
            {
                'name': 'Egg Whites',
                'name_ar': 'بياض البيض',
                'category_name': 'Protein',
                'calories_per_100g': 52,
                'protein_per_100g': 11,
                'carbs_per_100g': 0.7,
                'fat_per_100g': 0.2
            },

            # Vegetables - الخضروات
            {
                'name': 'Broccoli',
                'name_ar': 'بروكلي',
                'category_name': 'Vegetables',
                'calories_per_100g': 34,
                'protein_per_100g': 2.8,
                'carbs_per_100g': 7,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 2.6
            },
            {
                'name': 'Spinach',
                'name_ar': 'السبانخ',
                'category_name': 'Vegetables',
                'calories_per_100g': 23,
                'protein_per_100g': 2.9,
                'carbs_per_100g': 3.6,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 2.2
            },
            {
                'name': 'Kale',
                'name_ar': 'الكرنب',
                'category_name': 'Vegetables',
                'calories_per_100g': 49,
                'protein_per_100g': 4.3,
                'carbs_per_100g': 8.8,
                'fat_per_100g': 0.9,
                'fiber_per_100g': 3.6
            },
            {
                'name': 'Bell Peppers',
                'name_ar': 'الفلفل الحلو',
                'category_name': 'Vegetables',
                'calories_per_100g': 31,
                'protein_per_100g': 1,
                'carbs_per_100g': 7.3,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 2.5
            },
            {
                'name': 'Cauliflower',
                'name_ar': 'القرنبيط',
                'category_name': 'Vegetables',
                'calories_per_100g': 25,
                'protein_per_100g': 1.9,
                'carbs_per_100g': 5,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 2.0
            },
            {
                'name': 'Zucchini',
                'name_ar': 'الكوسا',
                'category_name': 'Vegetables',
                'calories_per_100g': 17,
                'protein_per_100g': 1.2,
                'carbs_per_100g': 3.1,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 1.0
            },
            {
                'name': 'Cucumber',
                'name_ar': 'الخيار',
                'category_name': 'Vegetables',
                'calories_per_100g': 16,
                'protein_per_100g': 0.7,
                'carbs_per_100g': 4,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 0.5
            },
            {
                'name': 'Tomatoes',
                'name_ar': 'الطماطم',
                'category_name': 'Vegetables',
                'calories_per_100g': 18,
                'protein_per_100g': 0.9,
                'carbs_per_100g': 3.9,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 1.2
            },
            {
                'name': 'Carrots',
                'name_ar': 'الجزر',
                'category_name': 'Vegetables',
                'calories_per_100g': 41,
                'protein_per_100g': 0.9,
                'carbs_per_100g': 9.6,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 2.8
            },
            {
                'name': 'Asparagus',
                'name_ar': 'الهليون',
                'category_name': 'Vegetables',
                'calories_per_100g': 20,
                'protein_per_100g': 2.2,
                'carbs_per_100g': 3.9,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 2.1
            },
            {
                'name': 'Brussels Sprouts',
                'name_ar': 'كرنب بروكسل',
                'category_name': 'Vegetables',
                'calories_per_100g': 43,
                'protein_per_100g': 3.4,
                'carbs_per_100g': 8.9,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 3.8
            },
            {
                'name': 'Cabbage',
                'name_ar': 'الملفوف',
                'category_name': 'Vegetables',
                'calories_per_100g': 25,
                'protein_per_100g': 1.3,
                'carbs_per_100g': 5.8,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 2.5
            },
            {
                'name': 'Eggplant',
                'name_ar': 'الباذنجان',
                'category_name': 'Vegetables',
                'calories_per_100g': 25,
                'protein_per_100g': 1,
                'carbs_per_100g': 6,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 3.0
            },
            {
                'name': 'Green Beans',
                'name_ar': 'الفاصوليا الخضراء',
                'category_name': 'Vegetables',
                'calories_per_100g': 31,
                'protein_per_100g': 1.8,
                'carbs_per_100g': 7,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 2.7
            },
            {
                'name': 'Mushrooms',
                'name_ar': 'الفطر',
                'category_name': 'Vegetables',
                'calories_per_100g': 22,
                'protein_per_100g': 3.1,
                'carbs_per_100g': 3.3,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 1.0
            },
            {
                'name': 'Onions',
                'name_ar': 'البصل',
                'category_name': 'Vegetables',
                'calories_per_100g': 40,
                'protein_per_100g': 1.1,
                'carbs_per_100g': 9.3,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 1.7
            },
            {
                'name': 'Radishes',
                'name_ar': 'الفجل',
                'category_name': 'Vegetables',
                'calories_per_100g': 16,
                'protein_per_100g': 0.7,
                'carbs_per_100g': 3.4,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 1.6
            },
            {
                'name': 'Lettuce',
                'name_ar': 'الخس',
                'category_name': 'Vegetables',
                'calories_per_100g': 15,
                'protein_per_100g': 1.4,
                'carbs_per_100g': 2.9,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 1.3
            },
            {
                'name': 'Celery',
                'name_ar': 'الكرفس',
                'category_name': 'Vegetables',
                'calories_per_100g': 16,
                'protein_per_100g': 0.7,
                'carbs_per_100g': 3.0,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 1.6
            },

            # Fruits - الفواكه
            {
                'name': 'Blueberries',
                'name_ar': 'التوت الأزرق',
                'category_name': 'Fruits',
                'calories_per_100g': 57,
                'protein_per_100g': 0.7,
                'carbs_per_100g': 14.5,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 2.4
            },
            {
                'name': 'Strawberries',
                'name_ar': 'الفراولة',
                'category_name': 'Fruits',
                'calories_per_100g': 32,
                'protein_per_100g': 0.7,
                'carbs_per_100g': 7.7,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 2.0
            },
            {
                'name': 'Avocado',
                'name_ar': 'الأفوكادو',
                'category_name': 'Fruits',
                'calories_per_100g': 160,
                'protein_per_100g': 2,
                'carbs_per_100g': 8.5,
                'fat_per_100g': 14.7,
                'fiber_per_100g': 6.7
            },
            {
                'name': 'Banana',
                'name_ar': 'الموز',
                'category_name': 'Fruits',
                'calories_per_100g': 89,
                'protein_per_100g': 1.1,
                'carbs_per_100g': 22.8,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 2.6
            },
            {
                'name': 'Apple',
                'name_ar': 'التفاح',
                'category_name': 'Fruits',
                'calories_per_100g': 52,
                'protein_per_100g': 0.3,
                'carbs_per_100g': 13.8,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 2.4
            },
            {
                'name': 'Orange',
                'name_ar': 'البرتقال',
                'category_name': 'Fruits',
                'calories_per_100g': 47,
                'protein_per_100g': 0.9,
                'carbs_per_100g': 11.8,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 2.4
            },
            {
                'name': 'Lemon',
                'name_ar': 'الليمون',
                'category_name': 'Fruits',
                'calories_per_100g': 29,
                'protein_per_100g': 1.1,
                'carbs_per_100g': 9.3,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 2.8
            },
            {
                'name': 'Grapefruit',
                'name_ar': 'الجريب فروت',
                'category_name': 'Fruits',
                'calories_per_100g': 42,
                'protein_per_100g': 0.8,
                'carbs_per_100g': 10.7,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 1.6
            },
            {
                'name': 'Kiwi',
                'name_ar': 'الكيوي',
                'category_name': 'Fruits',
                'calories_per_100g': 61,
                'protein_per_100g': 1.1,
                'carbs_per_100g': 14.7,
                'fat_per_100g': 0.5,
                'fiber_per_100g': 3.0
            },
            {
                'name': 'Pomegranate',
                'name_ar': 'الرمان',
                'category_name': 'Fruits',
                'calories_per_100g': 83,
                'protein_per_100g': 1.7,
                'carbs_per_100g': 18.7,
                'fat_per_100g': 1.2,
                'fiber_per_100g': 4.0
            },
            {
                'name': 'Grapes',
                'name_ar': 'العنب',
                'category_name': 'Fruits',
                'calories_per_100g': 62,
                'protein_per_100g': 0.6,
                'carbs_per_100g': 16,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 0.9
            },
            {
                'name': 'Pear',
                'name_ar': 'الكمثرى',
                'category_name': 'Fruits',
                'calories_per_100g': 57,
                'protein_per_100g': 0.4,
                'carbs_per_100g': 15.2,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 3.1
            },
            {
                'name': 'Peach',
                'name_ar': 'الخوخ',
                'category_name': 'Fruits',
                'calories_per_100g': 39,
                'protein_per_100g': 0.9,
                'carbs_per_100g': 9.5,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 1.5
            },
            {
                'name': 'Plum',
                'name_ar': 'البرقوق',
                'category_name': 'Fruits',
                'calories_per_100g': 46,
                'protein_per_100g': 0.7,
                'carbs_per_100g': 11.4,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 1.4
            },
            {
                'name': 'Cherry',
                'name_ar': 'الكرز',
                'category_name': 'Fruits',
                'calories_per_100g': 50,
                'protein_per_100g': 1.0,
                'carbs_per_100g': 12.2,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 1.6
            },
            {
                'name': 'Raspberries',
                'name_ar': 'التوت الأحمر',
                'category_name': 'Fruits',
                'calories_per_100g': 52,
                'protein_per_100g': 1.2,
                'carbs_per_100g': 11.9,
                'fat_per_100g': 0.7,
                'fiber_per_100g': 6.5
            },
            {
                'name': 'Blackberries',
                'name_ar': 'التوت الأسود',
                'category_name': 'Fruits',
                'calories_per_100g': 43,
                'protein_per_100g': 1.4,
                'carbs_per_100g': 9.6,
                'fat_per_100g': 0.5,
                'fiber_per_100g': 5.3
            },
            {
                'name': 'Cranberries',
                'name_ar': 'التوت البري',
                'category_name': 'Fruits',
                'calories_per_100g': 46,
                'protein_per_100g': 0.4,
                'carbs_per_100g': 12.2,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 4.6
            },
            {
                'name': 'Watermelon',
                'name_ar': 'البطيخ',
                'category_name': 'Fruits',
                'calories_per_100g': 30,
                'protein_per_100g': 0.6,
                'carbs_per_100g': 7.6,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 0.4
            },
            {
                'name': 'Cantaloupe',
                'name_ar': 'الشمام',
                'category_name': 'Fruits',
                'calories_per_100g': 34,
                'protein_per_100g': 0.8,
                'carbs_per_100g': 8.2,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 0.9
            },
            {
                'name': 'Pineapple',
                'name_ar': 'الأناناس',
                'category_name': 'Fruits',
                'calories_per_100g': 50,
                'protein_per_100g': 0.5,
                'carbs_per_100g': 13.1,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 1.4
            },
            {
                'name': 'Mango',
                'name_ar': 'المانجو',
                'category_name': 'Fruits',
                'calories_per_100g': 60,
                'protein_per_100g': 0.8,
                'carbs_per_100g': 15.0,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 1.6
            },
            {
                'name': 'Papaya',
                'name_ar': 'البابايا',
                'category_name': 'Fruits',
                'calories_per_100g': 43,
                'protein_per_100g': 0.5,
                'carbs_per_100g': 11.0,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 1.7
            },
            {
                'name': 'Coconut',
                'name_ar': 'جوز الهند',
                'category_name': 'Fruits',
                'calories_per_100g': 354,
                'protein_per_100g': 3.3,
                'carbs_per_100g': 15.2,
                'fat_per_100g': 33.5,
                'fiber_per_100g': 9.0
            },
            {
                'name': 'Dates',
                'name_ar': 'التمر',
                'category_name': 'Fruits',
                'calories_per_100g': 277,
                'protein_per_100g': 1.8,
                'carbs_per_100g': 75.0,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 6.7
            },
            {
                'name': 'Figs',
                'name_ar': 'التين',
                'category_name': 'Fruits',
                'calories_per_100g': 74,
                'protein_per_100g': 0.8,
                'carbs_per_100g': 19.2,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 2.9
            },
            {
                'name': 'Olives',
                'name_ar': 'الزيتون',
                'category_name': 'Fruits',
                'calories_per_100g': 115,
                'protein_per_100g': 0.8,
                'carbs_per_100g': 6.0,
                'fat_per_100g': 10.7,
                'fiber_per_100g': 3.2
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
                    'fat_per_100g': food_data['fat_per_100g'],
                    'fiber_per_100g': food_data.get('fiber_per_100g', 0)
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
            self.style.SUCCESS('Successfully setup comprehensive foods database')
        )
