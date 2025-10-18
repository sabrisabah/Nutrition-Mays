from django.core.management.base import BaseCommand
from meal_plans.models import FoodCategory, Food, MealType, Recipe, RecipeIngredient
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Add Iraqi traditional foods and recipes to the system'

    def handle(self, *args, **options):
        self.stdout.write('Adding Iraqi traditional foods...')
        
        # Create or get categories
        categories = self.create_categories()
        
        # Create or get meal types
        meal_types = self.create_meal_types()
        
        # Add Iraqi foods
        self.add_iraqi_foods(categories)
        
        # Add Iraqi recipes
        self.add_iraqi_recipes()
        
        self.stdout.write(
            self.style.SUCCESS('Successfully added Iraqi foods and recipes!')
        )

    def create_categories(self):
        """Create food categories for Iraqi foods"""
        categories = {}
        
        category_data = [
            ('grains', 'الحبوب', 'الأرز والقمح والشعير'),
            ('meat', 'اللحوم', 'لحم البقر والضأن والدجاج'),
            ('vegetables', 'الخضروات', 'الخضروات الطازجة والمطبوخة'),
            ('legumes', 'البقوليات', 'الحمص والفاصوليا والعدس'),
            ('dairy', 'الألبان', 'اللبن والجبن والزبدة'),
            ('spices', 'التوابل', 'التوابل العراقية التقليدية'),
            ('fruits', 'الفواكه', 'الفواكه الطازجة والمجففة'),
            ('nuts', 'المكسرات', 'الجوز واللوز والفستق'),
            ('oils', 'الزيوت', 'زيت الزيتون وزيت السمسم'),
        ]
        
        for name, name_ar, description in category_data:
            category, created = FoodCategory.objects.get_or_create(
                name=name,
                defaults={'name_ar': name_ar, 'description': description}
            )
            categories[name] = category
            if created:
                self.stdout.write(f'Created category: {name_ar}')
        
        return categories

    def create_meal_types(self):
        """Create meal types in Arabic"""
        meal_types = {}
        
        meal_type_data = [
            ('breakfast', 'الإفطار', 1),
            ('lunch', 'الغداء', 2),
            ('dinner', 'العشاء', 3),
            ('snack', 'وجبة خفيفة', 4),
        ]
        
        for name, name_ar, order in meal_type_data:
            meal_type, created = MealType.objects.get_or_create(
                name=name,
                defaults={'name_ar': name_ar, 'order': order}
            )
            meal_types[name] = meal_type
            if created:
                self.stdout.write(f'Created meal type: {name_ar}')
        
        return meal_types

    def add_iraqi_foods(self, categories):
        """Add traditional Iraqi foods with nutritional information"""
        
        # Get or create a superuser for recipes
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@example.com',
                password='admin123',
                is_superuser=True,
                is_staff=True
            )
        
        iraqi_foods = [
            # الحبوب
            {
                'name': 'Basmati Rice',
                'name_ar': 'أرز بسمتي',
                'category': 'grains',
                'description': 'الأرز البسمتي العراقي عالي الجودة',
                'calories_per_100g': 130,
                'protein_per_100g': 2.7,
                'carbs_per_100g': 28,
                'fat_per_100g': 0.3,
                'fiber_per_100g': 0.4,
                'common_serving_size': '1 كوب مطبوخ',
                'common_serving_weight': 200
            },
            {
                'name': 'Wheat Flour',
                'name_ar': 'طحين القمح',
                'category': 'grains',
                'description': 'طحين القمح العراقي للخبز والمعجنات',
                'calories_per_100g': 364,
                'protein_per_100g': 10.3,
                'carbs_per_100g': 76.3,
                'fat_per_100g': 1.0,
                'fiber_per_100g': 2.7,
                'common_serving_size': '1 كوب',
                'common_serving_weight': 120
            },
            
            # اللحوم
            {
                'name': 'Lamb Meat',
                'name_ar': 'لحم الضأن',
                'category': 'meat',
                'description': 'لحم الضأن العراقي الطازج',
                'calories_per_100g': 294,
                'protein_per_100g': 25.6,
                'carbs_per_100g': 0,
                'fat_per_100g': 20.9,
                'fiber_per_100g': 0,
                'common_serving_size': '100 جرام',
                'common_serving_weight': 100
            },
            {
                'name': 'Chicken Breast',
                'name_ar': 'صدر الدجاج',
                'category': 'meat',
                'description': 'صدر الدجاج العراقي منزوع الجلد',
                'calories_per_100g': 165,
                'protein_per_100g': 31,
                'carbs_per_100g': 0,
                'fat_per_100g': 3.6,
                'fiber_per_100g': 0,
                'common_serving_size': '100 جرام',
                'common_serving_weight': 100
            },
            
            # الخضروات
            {
                'name': 'Eggplant',
                'name_ar': 'الباذنجان',
                'category': 'vegetables',
                'description': 'الباذنجان العراقي الطازج',
                'calories_per_100g': 25,
                'protein_per_100g': 1.0,
                'carbs_per_100g': 6.0,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 3.0,
                'common_serving_size': '1 حبة متوسطة',
                'common_serving_weight': 200
            },
            {
                'name': 'Tomatoes',
                'name_ar': 'الطماطم',
                'category': 'vegetables',
                'description': 'الطماطم العراقية الطازجة',
                'calories_per_100g': 18,
                'protein_per_100g': 0.9,
                'carbs_per_100g': 3.9,
                'fat_per_100g': 0.2,
                'fiber_per_100g': 1.2,
                'common_serving_size': '1 حبة متوسطة',
                'common_serving_weight': 150
            },
            {
                'name': 'Onions',
                'name_ar': 'البصل',
                'category': 'vegetables',
                'description': 'البصل العراقي الأبيض والأحمر',
                'calories_per_100g': 40,
                'protein_per_100g': 1.1,
                'carbs_per_100g': 9.3,
                'fat_per_100g': 0.1,
                'fiber_per_100g': 1.7,
                'common_serving_size': '1 حبة متوسطة',
                'common_serving_weight': 100
            },
            
            # البقوليات
            {
                'name': 'Chickpeas',
                'name_ar': 'الحمص',
                'category': 'legumes',
                'description': 'الحمص العراقي المجفف',
                'calories_per_100g': 364,
                'protein_per_100g': 19.3,
                'carbs_per_100g': 60.7,
                'fat_per_100g': 6.0,
                'fiber_per_100g': 17.4,
                'common_serving_size': '1 كوب مطبوخ',
                'common_serving_weight': 164
            },
            {
                'name': 'Lentils',
                'name_ar': 'العدس',
                'category': 'legumes',
                'description': 'العدس العراقي الأحمر والأخضر',
                'calories_per_100g': 353,
                'protein_per_100g': 24.6,
                'carbs_per_100g': 63.4,
                'fat_per_100g': 1.1,
                'fiber_per_100g': 10.7,
                'common_serving_size': '1 كوب مطبوخ',
                'common_serving_weight': 198
            },
            
            # الألبان
            {
                'name': 'Yogurt',
                'name_ar': 'اللبن',
                'category': 'dairy',
                'description': 'اللبن العراقي الطازج',
                'calories_per_100g': 59,
                'protein_per_100g': 10.0,
                'carbs_per_100g': 3.6,
                'fat_per_100g': 0.4,
                'fiber_per_100g': 0,
                'common_serving_size': '1 كوب',
                'common_serving_weight': 245
            },
            {
                'name': 'White Cheese',
                'name_ar': 'الجبن الأبيض',
                'category': 'dairy',
                'description': 'الجبن الأبيض العراقي الطازج',
                'calories_per_100g': 264,
                'protein_per_100g': 11.0,
                'carbs_per_100g': 2.0,
                'fat_per_100g': 24.0,
                'fiber_per_100g': 0,
                'common_serving_size': '100 جرام',
                'common_serving_weight': 100
            },
            
            # التوابل
            {
                'name': 'Cumin',
                'name_ar': 'الكمون',
                'category': 'spices',
                'description': 'الكمون العراقي المطحون',
                'calories_per_100g': 375,
                'protein_per_100g': 17.8,
                'carbs_per_100g': 44.2,
                'fat_per_100g': 22.3,
                'fiber_per_100g': 10.5,
                'common_serving_size': '1 ملعقة صغيرة',
                'common_serving_weight': 2
            },
            {
                'name': 'Turmeric',
                'name_ar': 'الكركم',
                'category': 'spices',
                'description': 'الكركم العراقي المطحون',
                'calories_per_100g': 354,
                'protein_per_100g': 7.8,
                'carbs_per_100g': 64.9,
                'fat_per_100g': 9.9,
                'fiber_per_100g': 21.1,
                'common_serving_size': '1 ملعقة صغيرة',
                'common_serving_weight': 2
            },
            {
                'name': 'Cardamom',
                'name_ar': 'الهيل',
                'category': 'spices',
                'description': 'الهيل العراقي الأخضر',
                'calories_per_100g': 311,
                'protein_per_100g': 10.8,
                'carbs_per_100g': 68.5,
                'fat_per_100g': 6.7,
                'fiber_per_100g': 28.0,
                'common_serving_size': '1 ملعقة صغيرة',
                'common_serving_weight': 2
            },
            
            # الزيوت
            {
                'name': 'Sesame Oil',
                'name_ar': 'زيت السمسم',
                'category': 'oils',
                'description': 'زيت السمسم العراقي الأصلي',
                'calories_per_100g': 884,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 100,
                'fiber_per_100g': 0,
                'common_serving_size': '1 ملعقة كبيرة',
                'common_serving_weight': 14
            },
            {
                'name': 'Olive Oil',
                'name_ar': 'زيت الزيتون',
                'category': 'oils',
                'description': 'زيت الزيتون العراقي البكر',
                'calories_per_100g': 884,
                'protein_per_100g': 0,
                'carbs_per_100g': 0,
                'fat_per_100g': 100,
                'fiber_per_100g': 0,
                'common_serving_size': '1 ملعقة كبيرة',
                'common_serving_weight': 14
            },
        ]
        
        for food_data in iraqi_foods:
            food, created = Food.objects.get_or_create(
                name=food_data['name'],
                defaults={
                    'name_ar': food_data['name_ar'],
                    'category': categories[food_data['category']],
                    'description': food_data['description'],
                    'calories_per_100g': food_data['calories_per_100g'],
                    'protein_per_100g': food_data['protein_per_100g'],
                    'carbs_per_100g': food_data['carbs_per_100g'],
                    'fat_per_100g': food_data['fat_per_100g'],
                    'fiber_per_100g': food_data['fiber_per_100g'],
                    'common_serving_size': food_data['common_serving_size'],
                    'common_serving_weight': food_data['common_serving_weight']
                }
            )
            if created:
                self.stdout.write(f'Created food: {food_data["name_ar"]}')

    def add_iraqi_recipes(self):
        """Add traditional Iraqi recipes"""
        
        # Get admin user
        admin_user = User.objects.filter(is_superuser=True).first()
        
        iraqi_recipes = [
            {
                'name': 'Masgouf',
                'name_ar': 'المسكوف',
                'description': 'السمك المشوي العراقي التقليدي',
                'instructions': '''
                1. نظف السمك واشطفه جيداً
                2. اقطع السمك من الظهر وافتحه
                3. ضع السمك على عصي الشواء
                4. اشوي السمك على نار هادئة لمدة 45-60 دقيقة
                5. قدم مع البصل والطماطم والليمون
                ''',
                'prep_time': 30,
                'cook_time': 60,
                'servings': 4,
                'difficulty_level': 'medium',
                'ingredients': [
                    {'food': 'Fish (Carp)', 'amount': 1000, 'notes': 'سمك الكارب الطازج'},
                    {'food': 'Onions', 'amount': 200, 'notes': 'بصل مقطع'},
                    {'food': 'Tomatoes', 'amount': 300, 'notes': 'طماطم طازجة'},
                    {'food': 'Olive Oil', 'amount': 30, 'notes': 'زيت زيتون'},
                    {'food': 'Cumin', 'amount': 5, 'notes': 'كمون مطحون'},
                    {'food': 'Turmeric', 'amount': 3, 'notes': 'كركم مطحون'},
                ]
            },
            {
                'name': 'Dolma',
                'name_ar': 'الدولمة',
                'description': 'الدولمة العراقية المحشوة باللحم والأرز',
                'instructions': '''
                1. اغسل ورق العنب جيداً
                2. اخلط اللحم المفروم مع الأرز والتوابل
                3. احشي ورق العنب بالخليط
                4. ضع الدولمة في قدر مع الماء والملح
                5. اطبخ على نار هادئة لمدة 45 دقيقة
                ''',
                'prep_time': 60,
                'cook_time': 45,
                'servings': 6,
                'difficulty_level': 'hard',
                'ingredients': [
                    {'food': 'Grape Leaves', 'amount': 50, 'notes': 'ورق العنب'},
                    {'food': 'Lamb Meat', 'amount': 300, 'notes': 'لحم ضأن مفروم'},
                    {'food': 'Basmati Rice', 'amount': 200, 'notes': 'أرز بسمتي'},
                    {'food': 'Onions', 'amount': 100, 'notes': 'بصل مفروم'},
                    {'food': 'Tomatoes', 'amount': 150, 'notes': 'طماطم مقطعة'},
                    {'food': 'Cumin', 'amount': 5, 'notes': 'كمون'},
                    {'food': 'Cardamom', 'amount': 3, 'notes': 'هيل مطحون'},
                ]
            },
            {
                'name': 'Kubba',
                'name_ar': 'الكبة',
                'description': 'الكبة العراقية المحشوة باللحم',
                'instructions': '''
                1. اخلط البرغل مع اللحم المفروم
                2. اعجن الخليط حتى يصبح متماسكاً
                3. احضر الحشوة من اللحم والبصل
                4. شكّل الكبة واملأها بالحشوة
                5. اقلي الكبة في الزيت حتى تصبح ذهبية
                ''',
                'prep_time': 90,
                'cook_time': 30,
                'servings': 8,
                'difficulty_level': 'hard',
                'ingredients': [
                    {'food': 'Bulgur Wheat', 'amount': 300, 'notes': 'برغل ناعم'},
                    {'food': 'Lamb Meat', 'amount': 400, 'notes': 'لحم ضأن مفروم'},
                    {'food': 'Onions', 'amount': 150, 'notes': 'بصل مفروم'},
                    {'food': 'Sesame Oil', 'amount': 50, 'notes': 'زيت سمسم للقلي'},
                    {'food': 'Cumin', 'amount': 5, 'notes': 'كمون'},
                    {'food': 'Turmeric', 'amount': 3, 'notes': 'كركم'},
                ]
            },
            {
                'name': 'Tashreeb',
                'name_ar': 'التشريب',
                'description': 'التشريب العراقي مع الخبز والمرق',
                'instructions': '''
                1. اطبخ اللحم مع البصل والتوابل
                2. أضف الماء واتركه يغلي
                3. قطع الخبز إلى قطع صغيرة
                4. ضع الخبز في الطبق
                5. صب المرق الساخن على الخبز
                6. قدم مع البصل والطماطم
                ''',
                'prep_time': 30,
                'cook_time': 90,
                'servings': 6,
                'difficulty_level': 'easy',
                'ingredients': [
                    {'food': 'Lamb Meat', 'amount': 500, 'notes': 'لحم ضأن مقطع'},
                    {'food': 'Wheat Flour', 'amount': 200, 'notes': 'خبز عراقي'},
                    {'food': 'Onions', 'amount': 200, 'notes': 'بصل مقطع'},
                    {'food': 'Tomatoes', 'amount': 300, 'notes': 'طماطم مقطعة'},
                    {'food': 'Cumin', 'amount': 5, 'notes': 'كمون'},
                    {'food': 'Turmeric', 'amount': 3, 'notes': 'كركم'},
                ]
            },
            {
                'name': 'Fasolia',
                'name_ar': 'الفاصوليا',
                'description': 'الفاصوليا العراقية مع اللحم',
                'instructions': '''
                1. انقع الفاصوليا البيضاء ليلة كاملة
                2. اطبخ الفاصوليا حتى تنضج
                3. اقلي اللحم مع البصل
                4. أضف الطماطم والتوابل
                5. اخلط الفاصوليا مع اللحم
                6. اطبخ لمدة 30 دقيقة إضافية
                ''',
                'prep_time': 20,
                'cook_time': 120,
                'servings': 6,
                'difficulty_level': 'medium',
                'ingredients': [
                    {'food': 'White Beans', 'amount': 300, 'notes': 'فاصوليا بيضاء مجففة'},
                    {'food': 'Lamb Meat', 'amount': 300, 'notes': 'لحم ضأن مقطع'},
                    {'food': 'Onions', 'amount': 150, 'notes': 'بصل مقطع'},
                    {'food': 'Tomatoes', 'amount': 200, 'notes': 'طماطم مقطعة'},
                    {'food': 'Olive Oil', 'amount': 30, 'notes': 'زيت زيتون'},
                    {'food': 'Cumin', 'amount': 5, 'notes': 'كمون'},
                ]
            },
            {
                'name': 'Biryani',
                'name_ar': 'البرياني',
                'description': 'البرياني العراقي مع اللحم والأرز',
                'instructions': '''
                1. انقع الأرز لمدة 30 دقيقة
                2. اطبخ اللحم مع البصل والتوابل
                3. اطبخ الأرز حتى ينضج جزئياً
                4. ضع طبقة من الأرز في القدر
                5. ضع اللحم في الوسط
                6. ضع طبقة أخرى من الأرز
                7. اطبخ على نار هادئة لمدة 30 دقيقة
                ''',
                'prep_time': 45,
                'cook_time': 60,
                'servings': 8,
                'difficulty_level': 'medium',
                'ingredients': [
                    {'food': 'Basmati Rice', 'amount': 500, 'notes': 'أرز بسمتي'},
                    {'food': 'Lamb Meat', 'amount': 600, 'notes': 'لحم ضأن مقطع'},
                    {'food': 'Onions', 'amount': 300, 'notes': 'بصل مقطع'},
                    {'food': 'Yogurt', 'amount': 200, 'notes': 'لبن'},
                    {'food': 'Sesame Oil', 'amount': 40, 'notes': 'زيت سمسم'},
                    {'food': 'Cumin', 'amount': 5, 'notes': 'كمون'},
                    {'food': 'Cardamom', 'amount': 3, 'notes': 'هيل'},
                    {'food': 'Turmeric', 'amount': 3, 'notes': 'كركم'},
                ]
            }
        ]
        
        for recipe_data in iraqi_recipes:
            # Check if recipe already exists
            if Recipe.objects.filter(name_ar=recipe_data['name_ar']).exists():
                continue
                
            recipe = Recipe.objects.create(
                name=recipe_data['name'],
                name_ar=recipe_data['name_ar'],
                description=recipe_data['description'],
                instructions=recipe_data['instructions'],
                prep_time=recipe_data['prep_time'],
                cook_time=recipe_data['cook_time'],
                servings=recipe_data['servings'],
                difficulty_level=recipe_data['difficulty_level'],
                created_by=admin_user,
                is_public=True
            )
            
            # Add ingredients
            for ingredient_data in recipe_data['ingredients']:
                try:
                    food = Food.objects.get(name=ingredient_data['food'])
                    RecipeIngredient.objects.create(
                        recipe=recipe,
                        food=food,
                        amount=ingredient_data['amount'],
                        notes=ingredient_data['notes']
                    )
                except Food.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'Food not found: {ingredient_data["food"]}')
                    )
            
            self.stdout.write(f'Created recipe: {recipe_data["name_ar"]}')
