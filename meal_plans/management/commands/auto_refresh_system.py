#!/usr/bin/env python3
"""
Django Management Command: auto_refresh_system
Integrated auto refresh system for meal plans and API cache
"""

import os
import sys
import django
import requests
import time
from datetime import datetime
import subprocess
from django.core.management.base import BaseCommand, CommandError
from accounts.models import User
from rest_framework.authtoken.models import Token
from meal_plans.models import MealPlan, Meal, MealIngredient, Food
from django.db.models import Q, Count

# Try to import schedule, fallback to time-based approach if not available
try:
    import schedule
    SCHEDULE_AVAILABLE = True
except ImportError:
    SCHEDULE_AVAILABLE = False
    print("Warning: schedule module not available, using time-based approach")

class Command(BaseCommand):
    help = 'Start integrated auto refresh system for meal plans'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--cache-interval',
            type=int,
            default=120,
            help='Cache clearing interval in seconds (default: 120)'
        )
        parser.add_argument(
            '--ingredients-interval',
            type=int,
            default=600,
            help='Ingredients update interval in seconds (default: 600)'
        )
        parser.add_argument(
            '--full-refresh-interval',
            type=int,
            default=1800,
            help='Full refresh interval in seconds (default: 1800)'
        )
        parser.add_argument(
            '--daemon',
            action='store_true',
            help='Run as daemon process'
        )
        parser.add_argument(
            '--run-once',
            action='store_true',
            help='Run once and exit'
        )
    
    def handle(self, *args, **options):
        """Main command handler"""
        cache_interval = options['cache_interval']
        ingredients_interval = options['ingredients_interval']
        full_refresh_interval = options['full_refresh_interval']
        daemon = options['daemon']
        run_once = options['run_once']
        
        self.stdout.write(
            self.style.SUCCESS('Starting Integrated Auto Refresh System...')
        )
        self.stdout.write(f'Cache clearing: Every {cache_interval} seconds')
        self.stdout.write(f'Ingredients update: Every {ingredients_interval} seconds')
        self.stdout.write(f'Full refresh: Every {full_refresh_interval} seconds')
        self.stdout.write('=' * 60)
        
        # Initialize refresh system
        refresh_system = AutoRefreshSystem(
            self, cache_interval, ingredients_interval, full_refresh_interval
        )
        
        if run_once:
            self.stdout.write('Running once...')
            refresh_system.full_refresh()
        elif daemon:
            self.stdout.write('Running in daemon mode...')
            refresh_system.start_daemon()
        else:
            self.stdout.write('Running in interactive mode...')
            refresh_system.start_scheduler()


class AutoRefreshSystem:
    """Integrated auto refresh system"""
    
    def __init__(self, command, cache_interval=120, ingredients_interval=600, full_refresh_interval=1800):
        self.command = command
        self.cache_interval = cache_interval
        self.ingredients_interval = ingredients_interval
        self.full_refresh_interval = full_refresh_interval
        self.api_base_url = "http://localhost:8000/api/meals"
        self.doctor_token = self.get_or_create_system_token()
        self.headers = {
            "Authorization": f"Token {self.doctor_token}",
            "Content-Type": "application/json"
        }
    
    def get_or_create_system_token(self):
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
            
            if created:
                self.log(f"Created system user: {system_user.username}", "SUCCESS")
            else:
                self.log(f"Using existing system user: {system_user.username}", "INFO")
            
            # Get or create token for the system user
            token, created = Token.objects.get_or_create(user=system_user)
            
            if created:
                self.log(f"Generated new token for system user: {token.key[:8]}...", "SUCCESS")
            else:
                self.log(f"Using existing token for system user: {token.key[:8]}...", "INFO")
            
            return token.key
            
        except Exception as e:
            self.log(f"Error getting system token: {e}", "ERROR")
            # Fallback to hardcoded token if system fails
            return "b4f87597777edfd6f6a21587b5e649f4baf64b6a"
        
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
    
    def update_ingredients(self):
        """Update ingredients for meal plans"""
        try:
            self.log("Updating ingredients...")
            
            result = subprocess.run([
                sys.executable, 'manage.py', 'update_ingredients', '--empty-only'
            ], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
            
            if result.returncode == 0:
                self.log("Ingredients updated successfully", "SUCCESS")
                if result.stdout:
                    self.log(f"Command output: {result.stdout}")
                return True
            else:
                self.log(f"Ingredient update failed: {result.stderr}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Error updating ingredients: {e}", "ERROR")
            return False
    
    def clear_cache(self):
        """Clear browser cache by making API requests"""
        try:
            self.log("Clearing cache...")
            
            # Get all active meal plans
            meal_plans = MealPlan.objects.filter(is_active=True)
            
            api_urls = [
                f"{self.api_base_url}/meal-plans/check-updates/",
            ]
            
            # Add patient-specific URLs for each meal plan
            for plan in meal_plans:
                if plan.patient:
                    api_urls.append(f"{self.api_base_url}/patients/{plan.patient.id}/meal-plans/")
            
            success_count = 0
            
            for url in api_urls:
                try:
                    response = requests.get(url, headers=self.headers, timeout=10)
                    if response.status_code == 200:
                        self.log(f"API refreshed: {url}", "SUCCESS")
                        success_count += 1
                    else:
                        self.log(f"API error: {url} - Status: {response.status_code}", "ERROR")
                except Exception as e:
                    self.log(f"API request failed: {url} - Error: {e}", "ERROR")
            
            self.log(f"Cache clearing completed: {success_count}/{len(api_urls)} successful", "SUCCESS")
            return success_count > 0
            
        except Exception as e:
            self.log(f"Error clearing cache: {e}", "ERROR")
            return False
    
    def full_refresh(self):
        """Perform full refresh (ingredients + cache)"""
        try:
            self.log("Starting full refresh...")
            
            # Update ingredients
            ingredients_success = self.update_ingredients()
            
            # Clear cache
            cache_success = self.clear_cache()
            
            if ingredients_success and cache_success:
                self.log("Full refresh completed successfully", "SUCCESS")
                return True
            else:
                self.log("Full refresh completed with some issues", "WARNING")
                return False
                
        except Exception as e:
            self.log(f"Error in full refresh: {e}", "ERROR")
            return False
    
    def start_scheduler(self):
        """Start the scheduler"""
        self.log("=" * 60)
        self.log("Auto Refresh Scheduler Started")
        self.log("=" * 60)
        self.log(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        self.log(f"Schedule:")
        self.log(f"  - Cache clearing: Every {self.cache_interval} seconds")
        self.log(f"  - Ingredients update: Every {self.ingredients_interval} seconds")
        self.log(f"  - Full refresh: Every {self.full_refresh_interval} seconds")
        self.log("=" * 60)
        
        # Run once immediately
        self.full_refresh()
        
        # Keep the scheduler running
        try:
            if SCHEDULE_AVAILABLE:
                # Use schedule if available
                schedule.every(self.cache_interval).seconds.do(self.clear_cache)
                schedule.every(self.ingredients_interval).seconds.do(self.update_ingredients)
                schedule.every(self.full_refresh_interval).seconds.do(self.full_refresh)
                
                while True:
                    schedule.run_pending()
                    time.sleep(1)
            else:
                # Use time-based approach
                last_cache_time = time.time()
                last_ingredients_time = time.time()
                last_full_refresh_time = time.time()
                
                while True:
                    current_time = time.time()
                    
                    # Check cache clearing
                    if current_time - last_cache_time >= self.cache_interval:
                        self.clear_cache()
                        last_cache_time = current_time
                    
                    # Check ingredients update
                    if current_time - last_ingredients_time >= self.ingredients_interval:
                        self.update_ingredients()
                        last_ingredients_time = current_time
                    
                    # Check full refresh
                    if current_time - last_full_refresh_time >= self.full_refresh_interval:
                        self.full_refresh()
                        last_full_refresh_time = current_time
                    
                    time.sleep(10)  # Check every 10 seconds
        except KeyboardInterrupt:
            self.log("Scheduler stopped by user")
            self.log("=" * 60)
    
    def start_daemon(self):
        """Start in daemon mode"""
        import threading
        
        def daemon_worker():
            # Run once immediately
            self.full_refresh()
            
            if SCHEDULE_AVAILABLE:
                schedule.every(self.cache_interval).seconds.do(self.clear_cache)
                schedule.every(self.ingredients_interval).seconds.do(self.update_ingredients)
                schedule.every(self.full_refresh_interval).seconds.do(self.full_refresh)
                
                while True:
                    schedule.run_pending()
                    time.sleep(1)
            else:
                # Use time-based approach
                last_cache_time = time.time()
                last_ingredients_time = time.time()
                last_full_refresh_time = time.time()
                
                while True:
                    current_time = time.time()
                    
                    # Check cache clearing
                    if current_time - last_cache_time >= self.cache_interval:
                        self.clear_cache()
                        last_cache_time = current_time
                    
                    # Check ingredients update
                    if current_time - last_ingredients_time >= self.ingredients_interval:
                        self.update_ingredients()
                        last_ingredients_time = current_time
                    
                    # Check full refresh
                    if current_time - last_full_refresh_time >= self.full_refresh_interval:
                        self.full_refresh()
                        last_full_refresh_time = current_time
                    
                    time.sleep(10)  # Check every 10 seconds
        
        # Start daemon thread
        daemon_thread = threading.Thread(target=daemon_worker, daemon=True)
        daemon_thread.start()
        
        self.log("Daemon refresh system started in background")
        
        # Keep main thread alive
        try:
            while True:
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            self.log("Daemon refresh system stopped")
