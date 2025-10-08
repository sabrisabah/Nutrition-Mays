from django.core.management.base import BaseCommand
from meal_plans.models import FoodCategory, Food

class Command(BaseCommand):
    help = 'Setup specialized foods for different diet plans (Keto, Mediterranean, etc.)'

    def handle(self, *args, **options):
        # Specialized foods for different diet plans
        specialized_foods = [
            # Nuts & Seeds - المكسرات والبذور
            {
                'name': 'Almonds',
                'name_ar': 'اللوز',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 579,
                'protein_per_100g': 21.2,
                'carbs_per_100g': 21.6,
                'fat_per_100g': 49.9,
                'fiber_per_100g': 12.5
            },
            {
                'name': 'Walnuts',
                'name_ar': 'الجوز',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 654,
                'protein_per_100g': 15.2,
                'carbs_per_100g': 13.7,
                'fat_per_100g': 65.2,
                'fiber_per_100g': 6.7
            },
            {
                'name': 'Chia Seeds',
                'name_ar': 'بذور الشيا',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 486,
                'protein_per_100g': 16.5,
                'carbs_per_100g': 42.1,
                'fat_per_100g': 30.7,
                'fiber_per_100g': 34.4
            },
            {
                'name': 'Flax Seeds',
                'name_ar': 'بذور الكتان',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 534,
                'protein_per_100g': 18.3,
                'carbs_per_100g': 28.9,
                'fat_per_100g': 42.2,
                'fiber_per_100g': 27.3
            },
            {
                'name': 'Pumpkin Seeds',
                'name_ar': 'بذور اليقطين',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 559,
                'protein_per_100g': 30.2,
                'carbs_per_100g': 10.7,
                'fat_per_100g': 49.1,
                'fiber_per_100g': 6.0
            },
            {
                'name': 'Sunflower Seeds',
                'name_ar': 'بذور عباد الشمس',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 584,
                'protein_per_100g': 20.8,
                'carbs_per_100g': 20.0,
                'fat_per_100g': 51.5,
                'fiber_per_100g': 8.6
            },
            {
                'name': 'Cashews',
                'name_ar': 'الكاجو',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 553,
                'protein_per_100g': 18.2,
                'carbs_per_100g': 30.2,
                'fat_per_100g': 43.8,
                'fiber_per_100g': 3.3
            },
            {
                'name': 'Pistachios',
                'name_ar': 'الفستق',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 560,
                'protein_per_100g': 20.2,
                'carbs_per_100g': 27.2,
                'fat_per_100g': 45.3,
                'fiber_per_100g': 10.6
            },
            {
                'name': 'Brazil Nuts',
                'name_ar': 'جوز البرازيل',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 659,
                'protein_per_100g': 14.3,
                'carbs_per_100g': 12.3,
                'fat_per_100g': 67.1,
                'fiber_per_100g': 7.5
            },
            {
                'name': 'Macadamia Nuts',
                'name_ar': 'جوز المكاديميا',
                'category_name': 'Nuts & Seeds',
                'calories_per_100g': 718,
                'protein_per_100g': 7.9,
                'carbs_per_100g': 13.8,
                'fat_per_100g': 75.8,
                'fiber_per_100g': 8.6
            },

            # Healthy Fats - الدهون الصحية
            {
                'name': 'Olive Oil',
                'name_ar': 'زيت الزيتون',
                'category_name': 'Healthy Fats',
                'calories_per_100g': 884,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 100
            },
            {
                'name': 'Coconut Oil',
                'name_ar': 'زيت جوز الهند',
                'category_name': 'Healthy Fats',
                'calories_per_100g': 862,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 100
            },
            {
                'name': 'Avocado Oil',
                'name_ar': 'زيت الأفوكادو',
                'category_name': 'Healthy Fats',
                'calories_per_100g': 884,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 100
            },
            {
                'name': 'MCT Oil',
                'name_ar': 'زيت MCT',
                'category_name': 'Healthy Fats',
                'calories_per_100g': 884,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 100
            },
            {
                'name': 'Ghee',
                'name_ar': 'السمن البلدي',
                'category_name': 'Healthy Fats',
                'calories_per_100g': 900,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 100
            },
            {
                'name': 'Butter',
                'name_ar': 'الزبدة',
                'category_name': 'Healthy Fats',
                'calories_per_100g': 717,
                'protein_per_100g': 0.9,
                'carbs_per_100g': 0.1,
                'fat_per_100g': 81.1
            },

            # Legumes - البقوليات
            {
                'name': 'Lentils',
                'name_ar': 'العدس',
                'category_name': 'Legumes',
                'calories_per_100g': 116,
                'protein_per_100g': 9,
                'carbs_per_100g': 20,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 7.9
            },
            {
                'name': 'Chickpeas',
                'name_ar': 'الحمص',
                'category_name': 'Legumes',
                'calories_per_100g': 164,
                'protein_per_100g': 8.9,
                'carbs_per_100g': 27.4,
                'fat_per_100g': 2.6,
                'fiber_per_100g': 7.6
            },
            {
                'name': 'Black Beans',
                'name_ar': 'الفاصوليا السوداء',
                'category_name': 'Legumes',
                'calories_per_100g': 132,
                'protein_per_100g': 8.9,
                'carbs_per_100g': 23.7,
                'fat_per_100g': 0.5,
                'fiber_per_100g': 8.7
            },
            {
                'name': 'Kidney Beans',
                'name_ar': 'الفاصوليا الحمراء',
                'category_name': 'Legumes',
                'calories_per_100g': 127,
                'protein_per_100g': 8.7,
                'carbs_per_100g': 22.8,
                'fat_per_100g': 0.5,
                'fiber_per_100g': 6.4
            },
            {
                'name': 'Navy Beans',
                'name_ar': 'الفاصوليا البيضاء',
                'category_name': 'Legumes',
                'calories_per_100g': 140,
                'protein_per_100g': 8.2,
                'carbs_per_100g': 26.1,
                'fat_per_100g': 0.6,
                'fiber_per_100g': 10.5
            },
            {
                'name': 'Pinto Beans',
                'name_ar': 'الفاصوليا البنية',
                'category_name': 'Legumes',
                'calories_per_100g': 143,
                'protein_per_100g': 9.0,
                'carbs_per_100g': 26.2,
                'fat_per_100g': 0.6,
                'fiber_per_100g': 9.0
            },
            {
                'name': 'Soybeans',
                'name_ar': 'فول الصويا',
                'category_name': 'Legumes',
                'calories_per_100g': 173,
                'protein_per_100g': 16.6,
                'carbs_per_100g': 9.9,
                'fat_per_100g': 9.0,
                'fiber_per_100g': 6.0
            },
            {
                'name': 'Edamame',
                'name_ar': 'إدامامي',
                'category_name': 'Legumes',
                'calories_per_100g': 122,
                'protein_per_100g': 11.9,
                'carbs_per_100g': 9.9,
                'fat_per_100g': 5.2,
                'fiber_per_100g': 5.2
            },
            {
                'name': 'Peas',
                'name_ar': 'البازلاء',
                'category_name': 'Legumes',
                'calories_per_100g': 81,
                'protein_per_100g': 5.4,
                'carbs_per_100g': 14.5,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 5.1
            },
            {
                'name': 'Green Lentils',
                'name_ar': 'العدس الأخضر',
                'category_name': 'Legumes',
                'calories_per_100g': 116,
                'protein_per_100g': 9,
                'carbs_per_100g': 20,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 7.9
            },

            # Seafood - المأكولات البحرية
            {
                'name': 'Salmon',
                'name_ar': 'السلمون',
                'category_name': 'Seafood',
                'calories_per_100g': 208,
                'protein_per_100g': 25.4,
                'carbs_per_100g': 0,
                'fat_per_100g': 12.4
            },
            {
                'name': 'Tuna',
                'name_ar': 'التونة',
                'category_name': 'Seafood',
                'calories_per_100g': 132,
                'protein_per_100g': 28,
                'carbs_per_100g': 0,
                'fat_per_100g': 1.3
            },
            {
                'name': 'Shrimp',
                'name_ar': 'الجمبري',
                'category_name': 'Seafood',
                'calories_per_100g': 99,
                'protein_per_100g': 24,
                'carbs_per_100g': 0.2,
                'fat_per_100g': 0.3
            },
            {
                'name': 'Cod',
                'name_ar': 'القد',
                'category_name': 'Seafood',
                'calories_per_100g': 82,
                'protein_per_100g': 18,
                'carbs_per_100g': 0,
                'fat_per_100g': 0.7
            },
            {
                'name': 'Mackerel',
                'name_ar': 'الماكريل',
                'category_name': 'Seafood',
                'calories_per_100g': 205,
                'protein_per_100g': 19,
                'carbs_per_100g': 0,
                'fat_per_100g': 13.9
            },
            {
                'name': 'Sardines',
                'name_ar': 'السردين',
                'category_name': 'Seafood',
                'calories_per_100g': 208,
                'protein_per_100g': 25,
                'carbs_per_100g': 0,
                'fat_per_100g': 11.5
            },
            {
                'name': 'Trout',
                'name_ar': 'التروت',
                'category_name': 'Seafood',
                'calories_per_100g': 148,
                'protein_per_100g': 20.8,
                'carbs_per_100g': 0,
                'fat_per_100g': 6.6
            },
            {
                'name': 'Halibut',
                'name_ar': 'الهلبوت',
                'category_name': 'Seafood',
                'calories_per_100g': 111,
                'protein_per_100g': 22.7,
                'carbs_per_100g': 0,
                'fat_per_100g': 1.6
            },
            {
                'name': 'Crab',
                'name_ar': 'السلطعون',
                'category_name': 'Seafood',
                'calories_per_100g': 97,
                'protein_per_100g': 20.1,
                'carbs_per_100g': 0,
                'fat_per_100g': 1.5
            },
            {
                'name': 'Lobster',
                'name_ar': 'جراد البحر',
                'category_name': 'Seafood',
                'calories_per_100g': 89,
                'protein_per_100g': 18.8,
                'carbs_per_100g': 0,
                'fat_per_100g': 0.9
            },
            {
                'name': 'Mussels',
                'name_ar': 'بلح البحر',
                'category_name': 'Seafood',
                'calories_per_100g': 86,
                'protein_per_100g': 11.9,
                'carbs_per_100g': 3.7,
                'fat_per_100g': 2.2
            },
            {
                'name': 'Oysters',
                'name_ar': 'المحار',
                'category_name': 'Seafood',
                'calories_per_100g': 68,
                'protein_per_100g': 7.1,
                'carbs_per_100g': 3.9,
                'fat_per_100g': 2.5
            },

            # Dairy - الألبان
            {
                'name': 'Greek Yogurt',
                'name_ar': 'الزبادي اليوناني',
                'category_name': 'Dairy',
                'calories_per_100g': 59,
                'protein_per_100g': 10,
                'carbs_per_100g': 3.6,
                'fat_per_100g': 0.4
            },
            {
                'name': 'Cottage Cheese',
                'name_ar': 'الجبن القريش',
                'category_name': 'Dairy',
                'calories_per_100g': 98,
                'protein_per_100g': 11,
                'carbs_per_100g': 3.4,
                'fat_per_100g': 4.3
            },
            {
                'name': 'Milk (Whole)',
                'name_ar': 'حليب كامل الدسم',
                'category_name': 'Dairy',
                'calories_per_100g': 61,
                'protein_per_100g': 3.2,
                'carbs_per_100g': 4.7,
                'fat_per_100g': 3.3
            },
            {
                'name': 'Milk (Skim)',
                'name_ar': 'حليب خالي الدسم',
                'category_name': 'Dairy',
                'calories_per_100g': 34,
                'protein_per_100g': 3.4,
                'carbs_per_100g': 5.0,
                'fat_per_100g': 0.2
            },
            {
                'name': 'Cheese (Cheddar)',
                'name_ar': 'جبن شيدر',
                'category_name': 'Dairy',
                'calories_per_100g': 403,
                'protein_per_100g': 25,
                'carbs_per_100g': 1.3,
                'fat_per_100g': 33
            },
            {
                'name': 'Feta Cheese',
                'name_ar': 'جبن الفيتا',
                'category_name': 'Dairy',
                'calories_per_100g': 264,
                'protein_per_100g': 14.2,
                'carbs_per_100g': 4.1,
                'fat_per_100g': 21.3
            },
            {
                'name': 'Mozzarella',
                'name_ar': 'جبن الموزاريلا',
                'category_name': 'Dairy',
                'calories_per_100g': 280,
                'protein_per_100g': 22.2,
                'carbs_per_100g': 2.2,
                'fat_per_100g': 22.4
            },
            {
                'name': 'Parmesan',
                'name_ar': 'جبن البارميزان',
                'category_name': 'Dairy',
                'calories_per_100g': 431,
                'protein_per_100g': 38.5,
                'carbs_per_100g': 4.1,
                'fat_per_100g': 29.0
            },
            {
                'name': 'Ricotta',
                'name_ar': 'جبن الريكوتا',
                'category_name': 'Dairy',
                'calories_per_100g': 174,
                'protein_per_100g': 11.3,
                'carbs_per_100g': 3.0,
                'fat_per_100g': 13.0
            },
            {
                'name': 'Kefir',
                'name_ar': 'الكفير',
                'category_name': 'Dairy',
                'calories_per_100g': 41,
                'protein_per_100g': 3.3,
                'carbs_per_100g': 4.5,
                'fat_per_100g': 1.0
            },

            # Herbs & Spices - الأعشاب والتوابل
            {
                'name': 'Turmeric',
                'name_ar': 'الكركم',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 354,
                'protein_per_100g': 7.8,
                'carbs_per_100g': 64.9,
                'fat_per_100g': 9.9,
                'fiber_per_100g': 21.1
            },
            {
                'name': 'Ginger',
                'name_ar': 'الزنجبيل',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 80,
                'protein_per_100g': 1.8,
                'carbs_per_100g': 17.8,
                'fat_per_100g': 0.8,
                'fiber_per_100g': 2.0
            },
            {
                'name': 'Garlic',
                'name_ar': 'الثوم',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 149,
                'protein_per_100g': 6.4,
                'carbs_per_100g': 33.1,
                'fat_per_100g': 0.5,
                'fiber_per_100g': 2.1
            },
            {
                'name': 'Cinnamon',
                'name_ar': 'القرفة',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 247,
                'protein_per_100g': 4,
                'carbs_per_100g': 80.6,
                'fat_per_100g': 1.2,
                'fiber_per_100g': 53.1
            },
            {
                'name': 'Cumin',
                'name_ar': 'الكمون',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 375,
                'protein_per_100g': 17.8,
                'carbs_per_100g': 44.2,
                'fat_per_100g': 22.3,
                'fiber_per_100g': 10.5
            },
            {
                'name': 'Coriander',
                'name_ar': 'الكزبرة',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 298,
                'protein_per_100g': 12.4,
                'carbs_per_100g': 54.9,
                'fat_per_100g': 17.8,
                'fiber_per_100g': 41.9
            },
            {
                'name': 'Paprika',
                'name_ar': 'البابريكا',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 282,
                'protein_per_100g': 14.1,
                'carbs_per_100g': 53.9,
                'fat_per_100g': 12.9,
                'fiber_per_100g': 34.9
            },
            {
                'name': 'Black Pepper',
                'name_ar': 'الفلفل الأسود',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 251,
                'protein_per_100g': 10.4,
                'carbs_per_100g': 63.9,
                'fat_per_100g': 3.3,
                'fiber_per_100g': 25.3
            },
            {
                'name': 'Oregano',
                'name_ar': 'الأوريجانو',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 265,
                'protein_per_100g': 9.0,
                'carbs_per_100g': 68.9,
                'fat_per_100g': 4.3,
                'fiber_per_100g': 42.5
            },
            {
                'name': 'Basil',
                'name_ar': 'الريحان',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 22,
                'protein_per_100g': 3.2,
                'carbs_per_100g': 2.6,
                'fat_per_100g': 0.6,
                'fiber_per_100g': 1.6
            },
            {
                'name': 'Thyme',
                'name_ar': 'الزعتر',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 276,
                'protein_per_100g': 9.1,
                'carbs_per_100g': 63.9,
                'fat_per_100g': 7.4,
                'fiber_per_100g': 37.0
            },
            {
                'name': 'Rosemary',
                'name_ar': 'إكليل الجبل',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 131,
                'protein_per_100g': 3.3,
                'carbs_per_100g': 20.7,
                'fat_per_100g': 5.9,
                'fiber_per_100g': 14.1
            },
            {
                'name': 'Sage',
                'name_ar': 'المريمية',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 315,
                'protein_per_100g': 10.6,
                'carbs_per_100g': 60.7,
                'fat_per_100g': 12.8,
                'fiber_per_100g': 40.3
            },
            {
                'name': 'Mint',
                'name_ar': 'النعناع',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 70,
                'protein_per_100g': 3.8,
                'carbs_per_100g': 14.9,
                'fat_per_100g': 0.9,
                'fiber_per_100g': 8.0
            },
            {
                'name': 'Parsley',
                'name_ar': 'البقدونس',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 36,
                'protein_per_100g': 3.0,
                'carbs_per_100g': 6.3,
                'fat_per_100g': 0.8,
                'fiber_per_100g': 3.3
            },
            {
                'name': 'Cilantro',
                'name_ar': 'الكزبرة الخضراء',
                'category_name': 'Herbs & Spices',
                'calories_per_100g': 23,
                'protein_per_100g': 2.1,
                'carbs_per_100g': 3.7,
                'fat_per_100g': 0.5,
                'fiber_per_100g': 2.8
            },

            # Beverages - المشروبات
            {
                'name': 'Green Tea',
                'name_ar': 'الشاي الأخضر',
                'category_name': 'Beverages',
                'calories_per_100g': 1,
                'protein_per_100g': 0.2,
                'carbs_per_100g': 0.2,
                'fat_per_100g': 0
            },
            {
                'name': 'Black Tea',
                'name_ar': 'الشاي الأسود',
                'category_name': 'Beverages',
                'calories_per_100g': 1,
                'protein_per_100g': 0.2,
                'carbs_per_100g': 0.2,
                'fat_per_100g': 0
            },
            {
                'name': 'Water',
                'name_ar': 'الماء',
                'category_name': 'Beverages',
                'calories_per_100g': 0,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 0
            },
            {
                'name': 'Coconut Water',
                'name_ar': 'ماء جوز الهند',
                'category_name': 'Beverages',
                'calories_per_100g': 19,
                'protein_per_100g': 0.7,
                'carbs_per_100g': 3.7,
                'fat_per_100g': 0.2
            },
            {
                'name': 'Herbal Tea',
                'name_ar': 'الشاي العشبي',
                'category_name': 'Beverages',
                'calories_per_100g': 1,
                'protein_per_100g': 0.2,
                'carbs_per_100g': 0.2,
                'fat_per_100g': 0
            },
            {
                'name': 'Coffee',
                'name_ar': 'القهوة',
                'category_name': 'Beverages',
                'calories_per_100g': 2,
                'protein_per_100g': 0.3,
                'carbs_per_100g': 0.2,
                'fat_per_100g': 0
            },
            {
                'name': 'Sparkling Water',
                'name_ar': 'الماء الفوار',
                'category_name': 'Beverages',
                'calories_per_100g': 0,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 0
            },
            {
                'name': 'Kombucha',
                'name_ar': 'الكومبوتشا',
                'category_name': 'Beverages',
                'calories_per_100g': 30,
                'protein_per_100g': 0.4,
                'carbs_per_100g': 7.0,
                'fat_per_100g': 0
            },
            {
                'name': 'Almond Milk',
                'name_ar': 'حليب اللوز',
                'category_name': 'Beverages',
                'calories_per_100g': 15,
                'protein_per_100g': 0.6,
                'carbs_per_100g': 0.6,
                'fat_per_100g': 1.1
            },
            {
                'name': 'Coconut Milk',
                'name_ar': 'حليب جوز الهند',
                'category_name': 'Beverages',
                'calories_per_100g': 230,
                'protein_per_100g': 2.3,
                'carbs_per_100g': 5.5,
                'fat_per_100g': 23.8
            },
            {
                'name': 'Oat Milk',
                'name_ar': 'حليب الشوفان',
                'category_name': 'Beverages',
                'calories_per_100g': 43,
                'protein_per_100g': 1.0,
                'carbs_per_100g': 7.0,
                'fat_per_100g': 1.5
            },
            {
                'name': 'Soy Milk',
                'name_ar': 'حليب الصويا',
                'category_name': 'Beverages',
                'calories_per_100g': 33,
                'protein_per_100g': 2.9,
                'carbs_per_100g': 1.8,
                'fat_per_100g': 1.8
            },

            # Condiments - التوابل والصلصات
            {
                'name': 'Apple Cider Vinegar',
                'name_ar': 'خل التفاح',
                'category_name': 'Condiments',
                'calories_per_100g': 22,
                'protein_per_100g': 0,
                'carbs_per_100g': 0.9,
                'fat_per_100g': 0
            },
            {
                'name': 'Balsamic Vinegar',
                'name_ar': 'الخل البلسمي',
                'category_name': 'Condiments',
                'calories_per_100g': 88,
                'protein_per_100g': 0.5,
                'carbs_per_100g': 17.0,
                'fat_per_100g': 0
            },
            {
                'name': 'Honey',
                'name_ar': 'العسل',
                'category_name': 'Condiments',
                'calories_per_100g': 304,
                'protein_per_100g': 0.3,
                'carbs_per_100g': 82.4,
                'fat_per_100g': 0
            },
            {
                'name': 'Maple Syrup',
                'name_ar': 'شراب القيقب',
                'category_name': 'Condiments',
                'calories_per_100g': 260,
                'protein_per_100g': 0,
                'carbs_per_100g': 67.0,
                'fat_per_100g': 0
            },
            {
                'name': 'Mustard',
                'name_ar': 'الخردل',
                'category_name': 'Condiments',
                'calories_per_100g': 66,
                'protein_per_100g': 4.0,
                'carbs_per_100g': 5.0,
                'fat_per_100g': 4.0
            },
            {
                'name': 'Hot Sauce',
                'name_ar': 'الصلصة الحارة',
                'category_name': 'Condiments',
                'calories_per_100g': 12,
                'protein_per_100g': 0.5,
                'carbs_per_100g': 2.5,
                'fat_per_100g': 0.1
            },
            {
                'name': 'Soy Sauce',
                'name_ar': 'صلصة الصويا',
                'category_name': 'Condiments',
                'calories_per_100g': 8,
                'protein_per_100g': 1.3,
                'carbs_per_100g': 0.8,
                'fat_per_100g': 0
            },
            {
                'name': 'Tahini',
                'name_ar': 'الطحينة',
                'category_name': 'Condiments',
                'calories_per_100g': 595,
                'protein_per_100g': 17.0,
                'carbs_per_100g': 21.2,
                'fat_per_100g': 53.8
            },
            {
                'name': 'Hummus',
                'name_ar': 'الحمص',
                'category_name': 'Condiments',
                'calories_per_100g': 166,
                'protein_per_100g': 7.9,
                'carbs_per_100g': 14.3,
                'fat_per_100g': 9.6
            },
            {
                'name': 'Pesto',
                'name_ar': 'البيستو',
                'category_name': 'Condiments',
                'calories_per_100g': 263,
                'protein_per_100g': 2.6,
                'carbs_per_100g': 6.2,
                'fat_per_100g': 26.0
            },
            {
                'name': 'Salsa',
                'name_ar': 'الصلصة',
                'category_name': 'Condiments',
                'calories_per_100g': 36,
                'protein_per_100g': 1.5,
                'carbs_per_100g': 7.0,
                'fat_per_100g': 0.2
            },
            {
                'name': 'Guacamole',
                'name_ar': 'الغواكامولي',
                'category_name': 'Condiments',
                'calories_per_100g': 160,
                'protein_per_100g': 2.0,
                'carbs_per_100g': 8.5,
                'fat_per_100g': 14.7
            }
        ]
        
        for food_data in specialized_foods:
            try:
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
            except FoodCategory.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Category not found: {food_data["category_name"]}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully setup specialized foods database')
        )
