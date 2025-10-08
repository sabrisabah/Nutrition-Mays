from django.core.management.base import BaseCommand
from accounts.models import User
from rest_framework.authtoken.models import Token
from meal_plans.models import MealPlan, Meal, MealIngredient, Food
import random
import requests
import time

class Command(BaseCommand):
    help = 'Auto refresh meal plan data and clear cache'

    def get_system_token(self):
        """Get or create a system token for auto refresh operations"""
        try:
            # Try to get or create a system user for auto refresh
            system_user, created = User.objects.get_or_create(
                username='auto_refresh_system',
                defaults={
                    'email': 'system@auto-refresh.local',
                    'first_name': 'Auto',
                    'last_name': 'Refresh System',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True
                }
            )
            
            # Get or create token for the system user
            token, created = Token.objects.get_or_create(user=system_user)
            return token.key
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error getting system token: {e}')
            )
            # Fallback to hardcoded token if system fails
            return "b4f87597777edfd6f6a21587b5e649f4baf64b6a"

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=30,
            help='Refresh interval in seconds (default: 30)',
        )
        parser.add_argument(
            '--once',
            action='store_true',
            help='Run once and exit',
        )

    def handle(self, *args, **options):
        interval = options['interval']
        run_once = options['once']
        
        self.stdout.write(
            self.style.SUCCESS(f'[INFO] Starting auto refresh (interval: {interval}s)')
        )
        
        if run_once:
            self.perform_refresh()
        else:
            self.run_continuous(interval)

    def perform_refresh(self):
        """Perform a single refresh"""
        try:
            # Update ingredients
            self.update_ingredients()
            
            # Clear cache
            self.clear_cache()
            
            self.stdout.write(
                self.style.SUCCESS('[SUCCESS] Refresh completed successfully')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Refresh failed: {e}')
            )

    def update_ingredients(self):
        """Update ingredients for meal plans without ingredients"""
        try:
            # Find meal plans with meals that have no ingredients
            plans_without_ingredients = MealPlan.objects.filter(
                is_active=True,
                meals__ingredients__isnull=True
            ).distinct()
            
            if plans_without_ingredients.count() == 0:
                self.stdout.write('[INFO] All meal plans have ingredients')
                return
            
            self.stdout.write(f'[INFO] Found {plans_without_ingredients.count()} meal plans without ingredients')
            
            updated_plans = 0
            for plan in plans_without_ingredients:
                if self.update_meal_plan_ingredients(plan):
                    updated_plans += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'[SUCCESS] Updated {updated_plans}/{plans_without_ingredients.count()} meal plans')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Error updating ingredients: {e}')
            )

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
            # Get appropriate foods
            foods = self.get_foods_for_diet_plan(meal_plan.diet_plan)
            
            if foods.count() == 0:
                self.stdout.write(
                    self.style.ERROR(f'No foods available for diet plan: {meal_plan.diet_plan}')
                )
                return False
            
            # Update each meal
            updated_meals = 0
            for meal in meal_plan.meals.all():
                if self.add_ingredients_to_meal(meal, foods):
                    updated_meals += 1
            
            return updated_meals > 0
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating meal plan {meal_plan.id}: {e}')
            )
            return False

    def clear_cache(self):
        """Clear browser cache by making API requests"""
        try:
            api_urls = [
                "http://localhost:8000/api/meals/patients/47/meal-plans/",
                "http://localhost:8000/api/meals/meal-plans/check-updates/",
            ]
            
            headers = {
                "Authorization": f"Token {self.get_system_token()}",
                "Content-Type": "application/json"
            }
            
            for url in api_urls:
                try:
                    response = requests.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        self.stdout.write(f'[SUCCESS] API refreshed: {url}')
                    else:
                        self.stdout.write(
                            self.style.ERROR(f'[ERROR] API error: {url} - Status: {response.status_code}')
                        )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'[ERROR] API request failed: {url} - Error: {e}')
                    )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Error clearing cache: {e}')
            )

    def run_continuous(self, interval):
        """Run continuous refresh"""
        try:
            while True:
                self.perform_refresh()
                time.sleep(interval)
        except KeyboardInterrupt:
            self.stdout.write(
                self.style.SUCCESS('\n[STOP] Auto refresh stopped by user')
            )
