from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from meal_plans.models import MealPlan, MealType, Food, Meal, MealIngredient
from django.utils import timezone
from datetime import date, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample meals for existing meal plans'

    def handle(self, *args, **options):
        # الحصول على أنواع الوجبات
        try:
            breakfast = MealType.objects.get(name='Breakfast')
            lunch = MealType.objects.get(name='Lunch')
            dinner = MealType.objects.get(name='Dinner')
            morning_snack = MealType.objects.get(name='Morning Snack')
            afternoon_snack = MealType.objects.get(name='Afternoon Snack')
        except MealType.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('Meal types not found. Please run setup_meal_types first.')
            )
            return

        # الحصول على الأطعمة
        try:
            # حبوب
            oats = Food.objects.get(name='Oats')
            brown_rice = Food.objects.get(name='Brown Rice')
            quinoa = Food.objects.get(name='Quinoa')
            
            # بروتين
            chicken_breast = Food.objects.get(name='Chicken Breast')
            eggs = Food.objects.get(name='Eggs')
            salmon = Food.objects.get(name='Salmon')
            greek_yogurt = Food.objects.get(name='Greek Yogurt')
            
            # خضروات
            broccoli = Food.objects.get(name='Broccoli')
            spinach = Food.objects.get(name='Spinach')
            bell_peppers = Food.objects.get(name='Bell Peppers')
            
            # فواكه
            banana = Food.objects.get(name='Banana')
            apple = Food.objects.get(name='Apple')
            avocado = Food.objects.get(name='Avocado')
            blueberries = Food.objects.get(name='Blueberries')
            
            # دهون صحية
            olive_oil = Food.objects.get(name='Olive Oil')
            almonds = Food.objects.get(name='Almonds')
            
        except Food.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('Required foods not found. Please run setup_comprehensive_foods first.')
            )
            return

        # الحصول على خطط الوجبات الموجودة
        meal_plans = MealPlan.objects.all()
        
        if not meal_plans.exists():
            self.stdout.write(
                self.style.WARNING('No meal plans found. Please create meal plans first.')
            )
            return

        created_meals = 0
        
        for meal_plan in meal_plans:
            # إنشاء وجبات للأسبوع الأول
            for day in range(7):  # 7 أيام
                # فطور
                breakfast_meal = Meal.objects.create(
                    meal_plan=meal_plan,
                    meal_type=breakfast,
                    day_of_week=day,
                    name='فطور صحي',
                    description='فطور متوازن يحتوي على البروتين والكربوهيدرات',
                    instructions='اخلط الشوفان مع الزبادي اليوناني وأضف التوت الأزرق',
                    prep_time=10
                )
                
                # إضافة مكونات الفطور
                MealIngredient.objects.create(
                    meal=breakfast_meal,
                    food=oats,
                    amount=50,
                    notes='شوفان مطبوخ'
                )
                MealIngredient.objects.create(
                    meal=breakfast_meal,
                    food=greek_yogurt,
                    amount=150,
                    notes='زبادي يوناني'
                )
                MealIngredient.objects.create(
                    meal=breakfast_meal,
                    food=blueberries,
                    amount=50,
                    notes='توت أزرق طازج'
                )
                MealIngredient.objects.create(
                    meal=breakfast_meal,
                    food=almonds,
                    amount=20,
                    notes='لوز مقطع'
                )
                
                # غداء
                lunch_meal = Meal.objects.create(
                    meal_plan=meal_plan,
                    meal_type=lunch,
                    day_of_week=day,
                    name='غداء متوازن',
                    description='غداء يحتوي على البروتين والخضروات',
                    instructions='اشوي صدر الدجاج مع الخضروات',
                    prep_time=30
                )
                
                # إضافة مكونات الغداء
                MealIngredient.objects.create(
                    meal=lunch_meal,
                    food=chicken_breast,
                    amount=150,
                    notes='صدر دجاج مشوي'
                )
                MealIngredient.objects.create(
                    meal=lunch_meal,
                    food=broccoli,
                    amount=100,
                    notes='بروكلي مطبوخ على البخار'
                )
                MealIngredient.objects.create(
                    meal=lunch_meal,
                    food=brown_rice,
                    amount=80,
                    notes='أرز بني مطبوخ'
                )
                MealIngredient.objects.create(
                    meal=lunch_meal,
                    food=olive_oil,
                    amount=10,
                    notes='زيت زيتون للطبخ'
                )
                
                # عشاء
                dinner_meal = Meal.objects.create(
                    meal_plan=meal_plan,
                    meal_type=dinner,
                    day_of_week=day,
                    name='عشاء خفيف',
                    description='عشاء خفيف وصحي',
                    instructions='اشوي السلمون مع الخضروات',
                    prep_time=25
                )
                
                # إضافة مكونات العشاء
                MealIngredient.objects.create(
                    meal=dinner_meal,
                    food=salmon,
                    amount=120,
                    notes='سلمون مشوي'
                )
                MealIngredient.objects.create(
                    meal=dinner_meal,
                    food=spinach,
                    amount=80,
                    notes='سبانخ مطبوخة'
                )
                MealIngredient.objects.create(
                    meal=dinner_meal,
                    food=bell_peppers,
                    amount=60,
                    notes='فلفل حلو مشوي'
                )
                MealIngredient.objects.create(
                    meal=dinner_meal,
                    food=olive_oil,
                    amount=8,
                    notes='زيت زيتون'
                )
                
                # وجبة خفيفة صباحية
                morning_snack_meal = Meal.objects.create(
                    meal_plan=meal_plan,
                    meal_type=morning_snack,
                    day_of_week=day,
                    name='وجبة خفيفة صباحية',
                    description='وجبة خفيفة صحية',
                    instructions='تناول تفاحة مع حفنة من اللوز',
                    prep_time=5
                )
                
                MealIngredient.objects.create(
                    meal=morning_snack_meal,
                    food=apple,
                    amount=100,
                    notes='تفاحة متوسطة'
                )
                MealIngredient.objects.create(
                    meal=morning_snack_meal,
                    food=almonds,
                    amount=15,
                    notes='حفنة لوز'
                )
                
                # وجبة خفيفة بعد الظهر
                afternoon_snack_meal = Meal.objects.create(
                    meal_plan=meal_plan,
                    meal_type=afternoon_snack,
                    day_of_week=day,
                    name='وجبة خفيفة بعد الظهر',
                    description='وجبة خفيفة مغذية',
                    instructions='تناول موزة مع زبادي يوناني',
                    prep_time=5
                )
                
                MealIngredient.objects.create(
                    meal=afternoon_snack_meal,
                    food=banana,
                    amount=80,
                    notes='موزة متوسطة'
                )
                MealIngredient.objects.create(
                    meal=afternoon_snack_meal,
                    food=greek_yogurt,
                    amount=100,
                    notes='زبادي يوناني'
                )
                
                created_meals += 5  # 5 وجبات لكل يوم
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_meals} sample meals for {meal_plans.count()} meal plans')
        )
