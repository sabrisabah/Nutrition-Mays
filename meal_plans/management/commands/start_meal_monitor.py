#!/usr/bin/env python3
"""
Django Management Command: start_meal_monitor
Starts the continuous meal monitoring system integrated with Django
"""

import os
import sys
import django
import requests
import time
from datetime import datetime
import subprocess
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from meal_plans.models import MealPlan, Meal, MealIngredient, Food
from django.db.models import Q, Count

# Try to import schedule, fallback to time-based approach if not available
try:
    import schedule
    SCHEDULE_AVAILABLE = True
except ImportError:
    SCHEDULE_AVAILABLE = False
    print("Warning: schedule module not available, using time-based approach")
import random

class Command(BaseCommand):
    help = 'Start continuous meal monitoring system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=30,
            help='Monitoring interval in seconds (default: 30)'
        )
        parser.add_argument(
            '--daemon',
            action='store_true',
            help='Run as daemon process'
        )
        parser.add_argument(
            '--log-level',
            choices=['INFO', 'DEBUG', 'WARNING', 'ERROR'],
            default='INFO',
            help='Log level for monitoring'
        )
        parser.add_argument(
            '--run-once',
            action='store_true',
            help='Run once and exit'
        )
    
    def handle(self, *args, **options):
        """Main command handler"""
        interval = options['interval']
        daemon = options['daemon']
        log_level = options['log_level']
        run_once = options['run_once']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting Continuous Meal Monitor...')
        )
        self.stdout.write(f'Interval: {interval} seconds')
        self.stdout.write(f'Daemon mode: {daemon}')
        self.stdout.write(f'Log level: {log_level}')
        self.stdout.write('=' * 60)
        
        # Initialize monitor
        monitor = MealMonitor(self, interval, log_level)
        
        if run_once:
            self.stdout.write('Running once...')
            monitor.monitor_and_update()
        elif daemon:
            self.stdout.write('Running in daemon mode...')
            monitor.start_daemon()
        else:
            self.stdout.write('Running in interactive mode...')
            monitor.start_monitoring()


class MealMonitor:
    """Integrated meal monitoring system"""
    
    def __init__(self, command, interval=30, log_level='INFO'):
        self.command = command
        self.interval = interval
        self.log_level = log_level
        self.api_base_url = "http://localhost:8000/api/meals"
        self.doctor_token = "b4f87597777edfd6f6a21587b5e649f4baf64b6a"
        self.headers = {
            "Authorization": f"Token {self.doctor_token}",
            "Content-Type": "application/json"
        }
        self.food_mappings = {
            'keto': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
            'low_carb': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
            'weight_loss': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
            'weight_gain': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
            'muscle_building': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
            'health_maintenance': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
            'weight_maintenance': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض']
        }
        
    def log(self, message, level="INFO"):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if level == "ERROR":
            self.command.stdout.write(
                self.command.style.ERROR(f'[{level}] {timestamp} - {message}')
            )
        elif level == "WARNING":
            self.command.stdout.write(
                self.command.style.WARNING(f'[{level}] {timestamp} - {message}')
            )
        elif level == "SUCCESS":
            self.command.stdout.write(
                self.command.style.SUCCESS(f'[{level}] {timestamp} - {message}')
            )
        else:
            self.command.stdout.write(f'[{level}] {timestamp} - {message}')
            
    def get_empty_meals(self):
        """Get all meals that have no ingredients or 0 ingredients"""
        try:
            empty_meals = Meal.objects.filter(
                meal_plan__is_active=True
            ).annotate(
                ingredient_count=Count('ingredients')
            ).filter(ingredient_count=0)
            
            return empty_meals
            
        except Exception as e:
            self.log(f"Error getting empty meals: {e}", "ERROR")
            return Meal.objects.none()
    
    def get_foods_for_diet_plan(self, diet_plan):
        """Get appropriate foods for a diet plan"""
        try:
            food_names = self.food_mappings.get(diet_plan, self.food_mappings['health_maintenance'])
            foods = Food.objects.filter(name_ar__in=food_names, is_active=True)
            return foods
        except Exception as e:
            self.log(f"Error getting foods for diet plan {diet_plan}: {e}", "ERROR")
            return Food.objects.none()
    
    def add_ingredients_to_meal(self, meal):
        """Add ingredients to a specific meal"""
        try:
            meal_plan = meal.meal_plan
            foods = self.get_foods_for_diet_plan(meal_plan.diet_plan)
            
            if not foods.exists():
                self.log(f"No foods available for diet plan: {meal_plan.diet_plan}", "WARNING")
                return False
            
            # Clear existing ingredients
            meal.ingredients.all().delete()
            
            # Add 2-4 random ingredients
            num_ingredients = random.randint(2, 4)
            selected_foods = foods.order_by('?')[:num_ingredients]
            
            for food in selected_foods:
                amount = random.uniform(50, 200)
                MealIngredient.objects.create(
                    meal=meal,
                    food=food,
                    amount=round(amount, 1)
                )
            
            self.log(f"Added {selected_foods.count()} ingredients to meal {meal.id}: {meal.name}")
            return True
            
        except Exception as e:
            self.log(f"Error adding ingredients to meal {meal.id}: {e}", "ERROR")
            return False
    
    def run_django_update_command(self):
        """Run the Django update_ingredients command"""
        try:
            result = subprocess.run([
                sys.executable, 'manage.py', 'update_ingredients', '--empty-only'
            ], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
            
            if result.returncode == 0:
                return True
            else:
                self.log(f"Django update command failed: {result.stderr}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Error running Django command: {e}", "ERROR")
            return False
    
    def refresh_api_cache(self):
        """Refresh API cache by making requests"""
        try:
            meal_plans = MealPlan.objects.filter(is_active=True)
            
            api_urls = [
                f"{self.api_base_url}/meal-plans/check-updates/",
            ]
            
            for plan in meal_plans:
                if plan.patient:
                    api_urls.append(f"{self.api_base_url}/patients/{plan.patient.id}/meal-plans/")
            
            success_count = 0
            
            for url in api_urls:
                try:
                    response = requests.get(url, headers=self.headers, timeout=10)
                    if response.status_code == 200:
                        success_count += 1
                    else:
                        self.log(f"API error: {url} - Status: {response.status_code}", "ERROR")
                except Exception as e:
                    self.log(f"API request failed: {url} - Error: {e}", "ERROR")
            
            return success_count > 0
            
        except Exception as e:
            self.log(f"Error refreshing API cache: {e}", "ERROR")
            return False
    
    def monitor_and_update(self):
        """Main monitoring and update function"""
        try:
            self.log("Starting continuous meal monitoring...")
            
            # Step 1: Check for empty meals
            empty_meals = self.get_empty_meals()
            
            if empty_meals.exists():
                self.log(f"Found {empty_meals.count()} meals without ingredients")
                
                updated_count = 0
                for meal in empty_meals:
                    if self.add_ingredients_to_meal(meal):
                        updated_count += 1
                
                self.log(f"Updated {updated_count}/{empty_meals.count()} meals", "SUCCESS")
            else:
                self.log("All meals have ingredients - no updates needed")
            
            # Step 2: Run Django command as backup
            self.run_django_update_command()
            
            # Step 3: Refresh API cache
            self.refresh_api_cache()
            
            self.log("Continuous monitoring cycle completed", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"Error in monitoring cycle: {e}", "ERROR")
            return False
    
    def start_monitoring(self):
        """Start the continuous monitoring"""
        self.log("=" * 60)
        self.log("Continuous Meal Monitor Started")
        self.log("=" * 60)
        self.log(f"Schedule: Every {self.interval} seconds")
        self.log("=" * 60)
        
        # Run once immediately
        self.monitor_and_update()
        
        # Keep the monitoring running
        try:
            if SCHEDULE_AVAILABLE:
                # Use schedule if available
                schedule.every(self.interval).seconds.do(self.monitor_and_update)
                while True:
                    schedule.run_pending()
                    time.sleep(1)
            else:
                # Use time-based approach
                while True:
                    time.sleep(self.interval)
                    self.monitor_and_update()
        except KeyboardInterrupt:
            self.log("Monitoring stopped by user")
            self.log("=" * 60)
    
    def start_daemon(self):
        """Start monitoring in daemon mode"""
        import threading
        
        def daemon_worker():
            if SCHEDULE_AVAILABLE:
                schedule.every(self.interval).seconds.do(self.monitor_and_update)
                while True:
                    schedule.run_pending()
                    time.sleep(1)
            else:
                while True:
                    time.sleep(self.interval)
                    self.monitor_and_update()
        
        # Start daemon thread
        daemon_thread = threading.Thread(target=daemon_worker, daemon=True)
        daemon_thread.start()
        
        self.log("Daemon monitoring started in background")
        
        # Keep main thread alive
        try:
            while True:
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            self.log("Daemon monitoring stopped")
