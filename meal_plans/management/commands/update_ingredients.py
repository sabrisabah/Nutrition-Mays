from django.core.management.base import BaseCommand
from meal_plans.models import MealPlan, Meal, MealIngredient, Food
import random

class Command(BaseCommand):
    help = 'Update ingredients for all active meal plans'

    def add_arguments(self, parser):
        parser.add_argument(
            '--plan-id',
            type=int,
            help='Update specific meal plan by ID',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Update all active meal plans',
        )
        parser.add_argument(
            '--empty-only',
            action='store_true',
            help='Update only meal plans without ingredients',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('[INFO] Starting ingredient update...')
        )

        if options['plan_id']:
            self.update_specific_plan(options['plan_id'])
        elif options['all']:
            self.update_all_active_plans()
        elif options['empty_only']:
            self.update_plans_without_ingredients()
        else:
            # Default: update plans without ingredients
            self.update_plans_without_ingredients()

    def get_foods_for_diet_plan(self, diet_plan):
        """Get appropriate foods based on diet plan"""
        if diet_plan == 'keto':
            return Food.objects.filter(
                name_ar__in=[
                    'الأفوكادو', 'زيت الزيتون', 'اللوز', 'سلمون', 'السبانخ', 
                    'بروكلي', 'صدر دجاج', 'البيض', 'الجبن', 'جوز الهند'
                ]
            )
        elif diet_plan == 'balanced':
            return Food.objects.filter(
                name_ar__in=[
                    'الشوفان', 'الزبادي اليوناني', 'التوت الأزرق', 'اللوز', 
                    'صدر دجاج', 'بروكلي', 'أرز بني', 'زيت الزيتون', 'سلمون', 
                    'السبانخ', 'الفلفل الحلو', 'تفاح', 'موز'
                ]
            )
        elif diet_plan == 'high_protein':
            return Food.objects.filter(
                name_ar__in=[
                    'صدر دجاج', 'سلمون', 'البيض', 'الزبادي اليوناني', 
                    'اللوز', 'بروكلي', 'السبانخ', 'الأفوكادو'
                ]
            )
        else:
            # Default foods
            return Food.objects.filter(
                name_ar__in=[
                    'صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 
                    'اللوز', 'زيت الزيتون', 'البيض'
                ]
            )

    def add_ingredients_to_meal(self, meal, foods):
        """Add random ingredients to a meal"""
        try:
            # Clear existing ingredients
            meal.ingredients.all().delete()
            
            # Add 2-3 random ingredients
            num_ingredients = random.randint(2, 3)
            selected_foods = random.sample(list(foods), min(num_ingredients, foods.count()))
            
            for food in selected_foods:
                amount = random.randint(50, 150)
                MealIngredient.objects.create(
                    meal=meal,
                    food=food,
                    amount=amount,
                    notes=''
                )
            
            return True
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error adding ingredients to meal {meal.id}: {e}')
            )
            return False

    def update_meal_plan_ingredients(self, meal_plan):
        """Update ingredients for all meals in a meal plan"""
        try:
            self.stdout.write(f'[INFO] Updating Plan {meal_plan.id}: {meal_plan.title}')
            self.stdout.write(f'   Patient: {meal_plan.patient.first_name} {meal_plan.patient.last_name}')
            self.stdout.write(f'   Diet Plan: {meal_plan.diet_plan}')
            
            # Get appropriate foods
            foods = self.get_foods_for_diet_plan(meal_plan.diet_plan)
            self.stdout.write(f'   Available foods: {foods.count()}')
            
            if foods.count() == 0:
                self.stdout.write(
                    self.style.ERROR(f'   No foods available for diet plan: {meal_plan.diet_plan}')
                )
                return False
            
            # Update each meal
            updated_meals = 0
            for meal in meal_plan.meals.all():
                if self.add_ingredients_to_meal(meal, foods):
                    updated_meals += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'   [SUCCESS] Updated meal {meal.id}: {meal.name} ({meal.ingredients.count()} ingredients)')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'   [ERROR] Failed to update meal {meal.id}: {meal.name}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f'   [SUCCESS] Successfully updated {updated_meals}/{meal_plan.meals.count()} meals')
            )
            return True
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Error updating meal plan {meal_plan.id}: {e}')
            )
            return False

    def update_specific_plan(self, plan_id):
        """Update specific meal plan by ID"""
        try:
            meal_plan = MealPlan.objects.get(id=plan_id)
            self.update_meal_plan_ingredients(meal_plan)
        except MealPlan.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Meal plan with ID {plan_id} not found')
            )

    def update_all_active_plans(self):
        """Update ingredients for all active meal plans"""
        try:
            active_plans = MealPlan.objects.filter(is_active=True)
            self.stdout.write(f'[INFO] Found {active_plans.count()} active meal plans')
            
            if active_plans.count() == 0:
                self.stdout.write('[INFO] No active meal plans found')
                return
            
            updated_plans = 0
            for plan in active_plans:
                if self.update_meal_plan_ingredients(plan):
                    updated_plans += 1
                self.stdout.write('')  # Empty line for readability
            
            self.stdout.write(
                self.style.SUCCESS(f'[SUCCESS] Successfully updated {updated_plans}/{active_plans.count()} meal plans')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Error updating meal plans: {e}')
            )

    def update_plans_without_ingredients(self):
        """Update meal plans that have meals without ingredients"""
        try:
            # Find meal plans with meals that have no ingredients
            plans_without_ingredients = MealPlan.objects.filter(
                is_active=True,
                meals__ingredients__isnull=True
            ).distinct()
            
            self.stdout.write(f'[INFO] Found {plans_without_ingredients.count()} meal plans without ingredients')
            
            if plans_without_ingredients.count() == 0:
                self.stdout.write('[INFO] All meal plans have ingredients')
                return
            
            updated_plans = 0
            for plan in plans_without_ingredients:
                if self.update_meal_plan_ingredients(plan):
                    updated_plans += 1
                self.stdout.write('')  # Empty line for readability
            
            self.stdout.write(
                self.style.SUCCESS(f'[SUCCESS] Successfully updated {updated_plans}/{plans_without_ingredients.count()} meal plans')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Error updating meal plans without ingredients: {e}')
            )
