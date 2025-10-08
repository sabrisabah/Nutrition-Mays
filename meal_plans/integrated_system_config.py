#!/usr/bin/env python3
"""
Integrated System Configuration
Configuration settings for the integrated meal monitoring and refresh system
"""

import os
from django.conf import settings

class IntegratedSystemConfig:
    """Configuration for integrated meal monitoring system"""
    
    # Default intervals (in seconds)
    DEFAULT_MONITOR_INTERVAL = 30      # 30 seconds
    DEFAULT_CACHE_INTERVAL = 120       # 2 minutes
    DEFAULT_INGREDIENTS_INTERVAL = 600 # 10 minutes
    DEFAULT_FULL_REFRESH_INTERVAL = 1800 # 30 minutes
    
    # API Configuration
    API_BASE_URL = "http://localhost:8000/api/meals"
    DOCTOR_TOKEN = "b4f87597777edfd6f6a21587b5e649f4baf64b6a"
    
    # Food mappings for different diet plans
    FOOD_MAPPINGS = {
        'keto': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
        'low_carb': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
        'weight_loss': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
        'weight_gain': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
        'muscle_building': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
        'health_maintenance': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض'],
        'weight_maintenance': ['صدر دجاج', 'سلمون', 'السبانخ', 'بروكلي', 'الأفوكادو', 'اللوز', 'زيت الزيتون', 'البيض']
    }
    
    # Activity multipliers for calorie calculation
    ACTIVITY_MULTIPLIERS = {
        'sedentary': 1.2,      # قليل النشاط
        'light': 1.375,        # نشاط خفيف
        'moderate': 1.55,      # نشاط متوسط
        'active': 1.725,       # نشاط عالي
        'very_active': 1.9     # نشاط عالي جداً
    }
    
    # Goal-based calorie adjustments
    GOAL_CALORIE_ADJUSTMENTS = {
        'lose_weight': -500,      # عجز 500 سعرة حرارية
        'gain_weight': 500,       # فائض 500 سعرة حرارية
        'build_muscle': 300,      # فائض 300 سعرة حرارية
        'maintain_weight': 0,     # بدون تعديل
        'improve_health': 0       # بدون تعديل
    }
    
    # Ingredient settings
    MIN_INGREDIENTS_PER_MEAL = 2
    MAX_INGREDIENTS_PER_MEAL = 4
    MIN_INGREDIENT_AMOUNT = 50    # grams
    MAX_INGREDIENT_AMOUNT = 200   # grams
    
    # Logging settings
    LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR']
    DEFAULT_LOG_LEVEL = 'INFO'
    
    # Thread settings
    THREAD_CHECK_INTERVAL = 60    # seconds
    THREAD_RESTART_DELAY = 5      # seconds
    
    @classmethod
    def get_config(cls):
        """Get configuration from Django settings or defaults"""
        return {
            'monitor_interval': getattr(settings, 'MEAL_MONITOR_INTERVAL', cls.DEFAULT_MONITOR_INTERVAL),
            'cache_interval': getattr(settings, 'CACHE_INTERVAL', cls.DEFAULT_CACHE_INTERVAL),
            'ingredients_interval': getattr(settings, 'INGREDIENTS_INTERVAL', cls.DEFAULT_INGREDIENTS_INTERVAL),
            'full_refresh_interval': getattr(settings, 'FULL_REFRESH_INTERVAL', cls.DEFAULT_FULL_REFRESH_INTERVAL),
            'api_base_url': getattr(settings, 'MEAL_API_BASE_URL', cls.API_BASE_URL),
            'doctor_token': getattr(settings, 'DOCTOR_TOKEN', cls.DOCTOR_TOKEN),
            'log_level': getattr(settings, 'INTEGRATED_SYSTEM_LOG_LEVEL', cls.DEFAULT_LOG_LEVEL),
        }
    
    @classmethod
    def get_food_mappings(cls):
        """Get food mappings for diet plans"""
        return cls.FOOD_MAPPINGS
    
    @classmethod
    def get_activity_multipliers(cls):
        """Get activity multipliers for calorie calculation"""
        return cls.ACTIVITY_MULTIPLIERS
    
    @classmethod
    def get_goal_adjustments(cls):
        """Get goal-based calorie adjustments"""
        return cls.GOAL_CALORIE_ADJUSTMENTS
    
    @classmethod
    def get_ingredient_settings(cls):
        """Get ingredient generation settings"""
        return {
            'min_ingredients': cls.MIN_INGREDIENTS_PER_MEAL,
            'max_ingredients': cls.MAX_INGREDIENTS_PER_MEAL,
            'min_amount': cls.MIN_INGREDIENT_AMOUNT,
            'max_amount': cls.MAX_INGREDIENT_AMOUNT,
        }
    
    @classmethod
    def get_thread_settings(cls):
        """Get thread management settings"""
        return {
            'check_interval': cls.THREAD_CHECK_INTERVAL,
            'restart_delay': cls.THREAD_RESTART_DELAY,
        }
