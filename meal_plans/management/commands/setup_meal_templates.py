from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from meal_plans.models import MealPlanTemplate, MealType, Food, Meal, MealIngredient, MealPlan
from django.utils import timezone
from datetime import date, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup meal plan templates for different diet plans'

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

        # الحصول على بعض الأطعمة الأساسية
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
            
            # دهون صحية
            olive_oil = Food.objects.get(name='Olive Oil')
            almonds = Food.objects.get(name='Almonds')
            
        except Food.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('Required foods not found. Please run setup_comprehensive_foods first.')
            )
            return

        # الحصول على مستخدم افتراضي (أول مستخدم في النظام)
        try:
            default_user = User.objects.first()
            if not default_user:
                self.stdout.write(
                    self.style.ERROR('No users found. Please create a user first.')
                )
                return
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error getting default user: {e}')
            )
            return

        # قوالب خطط الوجبات
        templates = [
            {
                'name': 'Balanced Diet Plan',
                'name_ar': 'خطة النظام المتوازن',
                'plan_type': 'balanced',
                'description': 'نظام غذائي متوازن يحتوي على جميع العناصر الغذائية الأساسية',
                'target_calories': 2000,
                'target_protein_percentage': 25,
                'target_carbs_percentage': 45,
                'target_fat_percentage': 30
            },
            {
                'name': 'Keto Diet Plan',
                'name_ar': 'خطة نظام الكيتو',
                'plan_type': 'keto',
                'description': 'نظام غذائي عالي الدهون ومنخفض الكربوهيدرات',
                'target_calories': 1800,
                'target_protein_percentage': 20,
                'target_carbs_percentage': 5,
                'target_fat_percentage': 75
            },
            {
                'name': 'High Protein Plan',
                'name_ar': 'خطة عالية البروتين',
                'plan_type': 'high_protein',
                'description': 'نظام غذائي عالي البروتين لبناء العضلات',
                'target_calories': 2200,
                'target_protein_percentage': 35,
                'target_carbs_percentage': 35,
                'target_fat_percentage': 30
            },
            {
                'name': 'Weight Loss Plan',
                'name_ar': 'خطة إنقاص الوزن',
                'plan_type': 'low_carb',
                'description': 'نظام غذائي منخفض السعرات لإنقاص الوزن',
                'target_calories': 1500,
                'target_protein_percentage': 30,
                'target_carbs_percentage': 30,
                'target_fat_percentage': 40
            },
            {
                'name': 'Mediterranean Plan',
                'name_ar': 'خطة النظام المتوسطي',
                'plan_type': 'mediterranean',
                'description': 'نظام غذائي متوسطي صحي',
                'target_calories': 2000,
                'target_protein_percentage': 20,
                'target_carbs_percentage': 50,
                'target_fat_percentage': 30
            }
        ]

        for template_data in templates:
            template, created = MealPlanTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults={
                    'name_ar': template_data['name_ar'],
                    'plan_type': template_data['plan_type'],
                    'description': template_data['description'],
                    'target_calories': template_data['target_calories'],
                    'target_protein_percentage': template_data['target_protein_percentage'],
                    'target_carbs_percentage': template_data['target_carbs_percentage'],
                    'target_fat_percentage': template_data['target_fat_percentage'],
                    'created_by': default_user,
                    'is_public': True
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Template already exists: {template.name}')
                )

        self.stdout.write(
            self.style.SUCCESS('Successfully setup meal plan templates')
        )
