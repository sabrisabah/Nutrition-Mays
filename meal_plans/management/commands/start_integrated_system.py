#!/usr/bin/env python3
"""
Django Management Command: start_integrated_system
Starts the complete integrated meal monitoring and refresh system
"""

import os
import sys
import django
import threading
import time
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Start the complete integrated meal monitoring and refresh system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--monitor-interval',
            type=int,
            default=30,
            help='Meal monitoring interval in seconds (default: 30)'
        )
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
            '--monitor-only',
            action='store_true',
            help='Run only meal monitoring'
        )
        parser.add_argument(
            '--refresh-only',
            action='store_true',
            help='Run only auto refresh system'
        )
        parser.add_argument(
            '--run-once',
            action='store_true',
            help='Run once and exit'
        )
    
    def handle(self, *args, **options):
        """Main command handler"""
        monitor_interval = options['monitor_interval']
        cache_interval = options['cache_interval']
        ingredients_interval = options['ingredients_interval']
        full_refresh_interval = options['full_refresh_interval']
        daemon = options['daemon']
        monitor_only = options['monitor_only']
        refresh_only = options['refresh_only']
        run_once = options['run_once']
        
        self.stdout.write(
            self.style.SUCCESS('=' * 60)
        )
        self.stdout.write(
            self.style.SUCCESS('Starting Integrated Meal System')
        )
        self.stdout.write(
            self.style.SUCCESS('=' * 60)
        )
        self.stdout.write(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
        self.stdout.write(f'Monitor interval: {monitor_interval} seconds')
        self.stdout.write(f'Cache interval: {cache_interval} seconds')
        self.stdout.write(f'Ingredients interval: {ingredients_interval} seconds')
        self.stdout.write(f'Full refresh interval: {full_refresh_interval} seconds')
        self.stdout.write(f'Daemon mode: {daemon}')
        self.stdout.write('=' * 60)
        
        # Initialize integrated system
        system = IntegratedSystem(
            self, monitor_interval, cache_interval, 
            ingredients_interval, full_refresh_interval
        )
        
        if run_once:
            self.stdout.write('Running once...')
            system.run_once()
        elif monitor_only:
            self.stdout.write('Starting meal monitoring only...')
            system.start_monitor_only()
        elif refresh_only:
            self.stdout.write('Starting auto refresh only...')
            system.start_refresh_only()
        else:
            self.stdout.write('Starting complete integrated system...')
            system.start_complete_system(daemon)


class IntegratedSystem:
    """Complete integrated meal monitoring and refresh system"""
    
    def __init__(self, command, monitor_interval=30, cache_interval=120, 
                 ingredients_interval=600, full_refresh_interval=1800):
        self.command = command
        self.monitor_interval = monitor_interval
        self.cache_interval = cache_interval
        self.ingredients_interval = ingredients_interval
        self.full_refresh_interval = full_refresh_interval
        self.threads = []
        
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
    
    def run_monitor_command(self):
        """Run meal monitor command in thread"""
        try:
            call_command('start_meal_monitor', 
                        interval=self.monitor_interval,
                        daemon=True)
        except Exception as e:
            self.log(f"Error in meal monitor: {e}", "ERROR")
    
    def run_refresh_command(self):
        """Run auto refresh command in thread"""
        try:
            call_command('auto_refresh_system',
                        cache_interval=self.cache_interval,
                        ingredients_interval=self.ingredients_interval,
                        full_refresh_interval=self.full_refresh_interval,
                        daemon=True)
        except Exception as e:
            self.log(f"Error in auto refresh: {e}", "ERROR")
    
    def start_monitor_only(self):
        """Start only meal monitoring"""
        self.log("Starting meal monitoring system...")
        try:
            call_command('start_meal_monitor', 
                        interval=self.monitor_interval)
        except KeyboardInterrupt:
            self.log("Meal monitoring stopped by user")
        except Exception as e:
            self.log(f"Error in meal monitoring: {e}", "ERROR")
    
    def start_refresh_only(self):
        """Start only auto refresh system"""
        self.log("Starting auto refresh system...")
        try:
            call_command('auto_refresh_system',
                        cache_interval=self.cache_interval,
                        ingredients_interval=self.ingredients_interval,
                        full_refresh_interval=self.full_refresh_interval)
        except KeyboardInterrupt:
            self.log("Auto refresh system stopped by user")
        except Exception as e:
            self.log(f"Error in auto refresh system: {e}", "ERROR")
    
    def run_once(self):
        """Run both systems once and exit"""
        self.log("Running integrated system once...")
        try:
            # Run meal monitor once
            self.log("Running meal monitor...")
            call_command('start_meal_monitor', 
                        interval=self.monitor_interval,
                        run_once=True)
            
            # Run auto refresh once
            self.log("Running auto refresh...")
            call_command('auto_refresh_system',
                        cache_interval=self.cache_interval,
                        ingredients_interval=self.ingredients_interval,
                        full_refresh_interval=self.full_refresh_interval,
                        run_once=True)
            
            self.log("Integrated system run completed", "SUCCESS")
            
        except Exception as e:
            self.log(f"Error in integrated system run: {e}", "ERROR")
    
    def start_complete_system(self, daemon=False):
        """Start complete integrated system"""
        self.log("Starting complete integrated system...")
        
        if daemon:
            self.log("Starting in daemon mode...")
            
            # Start meal monitor in daemon thread
            monitor_thread = threading.Thread(
                target=self.run_monitor_command, 
                daemon=True,
                name="MealMonitor"
            )
            monitor_thread.start()
            self.threads.append(monitor_thread)
            
            # Start auto refresh in daemon thread
            refresh_thread = threading.Thread(
                target=self.run_refresh_command,
                daemon=True,
                name="AutoRefresh"
            )
            refresh_thread.start()
            self.threads.append(refresh_thread)
            
            self.log("Both systems started in background", "SUCCESS")
            
            # Keep main thread alive
            try:
                while True:
                    time.sleep(60)  # Check every minute
                    # Check if threads are still alive
                    if not monitor_thread.is_alive():
                        self.log("Meal monitor thread died, restarting...", "WARNING")
                        monitor_thread = threading.Thread(
                            target=self.run_monitor_command,
                            daemon=True,
                            name="MealMonitor"
                        )
                        monitor_thread.start()
                        self.threads[0] = monitor_thread
                    
                    if not refresh_thread.is_alive():
                        self.log("Auto refresh thread died, restarting...", "WARNING")
                        refresh_thread = threading.Thread(
                            target=self.run_refresh_command,
                            daemon=True,
                            name="AutoRefresh"
                        )
                        refresh_thread.start()
                        self.threads[1] = refresh_thread
                        
            except KeyboardInterrupt:
                self.log("Integrated system stopped by user")
                self.log("=" * 60)
        else:
            self.log("Starting in interactive mode...")
            self.log("Note: Interactive mode runs systems sequentially")
            self.log("For parallel execution, use --daemon flag")
            
            try:
                # Run meal monitor first
                self.log("Starting meal monitoring...")
                call_command('start_meal_monitor', 
                            interval=self.monitor_interval)
            except KeyboardInterrupt:
                self.log("Meal monitoring stopped, starting auto refresh...")
                try:
                    call_command('auto_refresh_system',
                                cache_interval=self.cache_interval,
                                ingredients_interval=self.ingredients_interval,
                                full_refresh_interval=self.full_refresh_interval)
                except KeyboardInterrupt:
                    self.log("Integrated system stopped by user")
                    self.log("=" * 60)
