/**
 * Enhanced BMR (Basal Metabolic Rate) Calculator using Mifflin-St Jeor Equation
 * 
 * The Mifflin-St Jeor equation is widely considered the most accurate method
 * for calculating resting metabolic rate (RMR) in healthy individuals.
 * 
 * Formula:
 * - Females: (10 × weight [kg]) + (6.25 × height [cm]) – (5 × age [years]) – 161
 * - Males: (10 × weight [kg]) + (6.25 × height [cm]) – (5 × age [years]) + 5
 * 
 * Activity Level Multipliers:
 * - Sedentary: 1.2 (little to no exercise)
 * - Lightly Active: 1.375 (light exercise 1-3 days/week)
 * - Moderately Active: 1.55 (moderate exercise 3-5 days/week)
 * - Active: 1.725 (heavy exercise 6-7 days/week)
 * - Very Active: 1.9 (very heavy exercise, physical job)
 */

export class BMRCalculator {
  /**
   * Activity level constants
   */
  static ACTIVITY_LEVELS = {
    SEDENTARY: 'sedentary',
    LIGHT: 'light',
    MODERATE: 'moderate',
    ACTIVE: 'active',
    VERY_ACTIVE: 'very_active'
  };

  /**
   * Activity level multipliers for TDEE calculation
   */
  static ACTIVITY_MULTIPLIERS = {
    [BMRCalculator.ACTIVITY_LEVELS.SEDENTARY]: 1.2,
    [BMRCalculator.ACTIVITY_LEVELS.LIGHT]: 1.375,
    [BMRCalculator.ACTIVITY_LEVELS.MODERATE]: 1.55,
    [BMRCalculator.ACTIVITY_LEVELS.ACTIVE]: 1.725,
    [BMRCalculator.ACTIVITY_LEVELS.VERY_ACTIVE]: 1.9
  };

  /**
   * Activity level descriptions in English
   */
  static ACTIVITY_DESCRIPTIONS = {
    [BMRCalculator.ACTIVITY_LEVELS.SEDENTARY]: 'Little to no exercise, desk job',
    [BMRCalculator.ACTIVITY_LEVELS.LIGHT]: 'Light exercise 1-3 days per week',
    [BMRCalculator.ACTIVITY_LEVELS.MODERATE]: 'Moderate exercise 3-5 days per week',
    [BMRCalculator.ACTIVITY_LEVELS.ACTIVE]: 'Heavy exercise 6-7 days per week',
    [BMRCalculator.ACTIVITY_LEVELS.VERY_ACTIVE]: 'Very heavy exercise, physical job or 2x training'
  };

  /**
   * Activity level descriptions in Arabic
   */
  static ACTIVITY_DESCRIPTIONS_AR = {
    [BMRCalculator.ACTIVITY_LEVELS.SEDENTARY]: 'قليل النشاط - عمل مكتبي بدون تمارين',
    [BMRCalculator.ACTIVITY_LEVELS.LIGHT]: 'نشاط خفيف - تمارين خفيفة 1-3 مرات/أسبوع',
    [BMRCalculator.ACTIVITY_LEVELS.MODERATE]: 'نشاط متوسط - تمارين متوسطة 3-5 مرات/أسبوع',
    [BMRCalculator.ACTIVITY_LEVELS.ACTIVE]: 'نشاط عالي - تمارين شاقة 6-7 مرات/أسبوع',
    [BMRCalculator.ACTIVITY_LEVELS.VERY_ACTIVE]: 'نشاط عالي جداً - تمارين شاقة يومياً أو عمل بدني'
  };

  /**
   * Gender constants
   */
  static GENDER = {
    MALE: 'male',
    FEMALE: 'female'
  };

  /**
   * Input validation rules
   */
  static VALIDATION_RULES = {
    weight: { min: 20, max: 300 }, // kg
    height: { min: 100, max: 250 }, // cm
    age: { min: 15, max: 100 } // years
  };

  /**
   * Validates input parameters for BMR calculation
   * @param {Object} params - Input parameters
   * @param {number} params.weight - Weight in kg
   * @param {number} params.height - Height in cm
   * @param {number} params.age - Age in years
   * @param {string} params.gender - Gender ('male' or 'female')
   * @returns {Object} Validation result with isValid and errors
   */
  static validateInput({ weight, height, age, gender }) {
    const errors = [];

    // Validate weight
    if (!weight || isNaN(weight) || weight <= 0) {
      errors.push('Weight is required and must be a positive number');
    } else if (weight < BMRCalculator.VALIDATION_RULES.weight.min || 
               weight > BMRCalculator.VALIDATION_RULES.weight.max) {
      errors.push(`Weight must be between ${BMRCalculator.VALIDATION_RULES.weight.min} and ${BMRCalculator.VALIDATION_RULES.weight.max} kg`);
    }

    // Validate height
    if (!height || isNaN(height) || height <= 0) {
      errors.push('Height is required and must be a positive number');
    } else if (height < BMRCalculator.VALIDATION_RULES.height.min || 
               height > BMRCalculator.VALIDATION_RULES.height.max) {
      errors.push(`Height must be between ${BMRCalculator.VALIDATION_RULES.height.min} and ${BMRCalculator.VALIDATION_RULES.height.max} cm`);
    }

    // Validate age
    if (!age || isNaN(age) || age <= 0) {
      errors.push('Age is required and must be a positive number');
    } else if (age < BMRCalculator.VALIDATION_RULES.age.min || 
               age > BMRCalculator.VALIDATION_RULES.age.max) {
      errors.push(`Age must be between ${BMRCalculator.VALIDATION_RULES.age.min} and ${BMRCalculator.VALIDATION_RULES.age.max} years`);
    }

    // Validate gender
    if (!gender || ![BMRCalculator.GENDER.MALE, BMRCalculator.GENDER.FEMALE].includes(gender)) {
      errors.push('Gender must be either "male" or "female"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculates BMR using the Mifflin-St Jeor equation
   * @param {Object} params - Input parameters
   * @param {number} params.weight - Weight in kg
   * @param {number} params.height - Height in cm
   * @param {number} params.age - Age in years
   * @param {string} params.gender - Gender ('male' or 'female')
   * @returns {Object} Calculation result with BMR and validation info
   */
  static calculateBMR({ weight, height, age, gender }) {
    // Validate input
    const validation = BMRCalculator.validateInput({ weight, height, age, gender });
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        bmr: 0
      };
    }

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr;
    if (gender === BMRCalculator.GENDER.MALE) {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    return {
      success: true,
      bmr: Math.round(bmr),
      formula: {
        equation: gender === BMRCalculator.GENDER.MALE 
          ? '(10 × weight) + (6.25 × height) - (5 × age) + 5'
          : '(10 × weight) + (6.25 × height) - (5 × age) - 161',
        values: {
          weight,
          height,
          age,
          gender
        }
      },
      errors: []
    };
  }

  /**
   * Calculates TDEE (Total Daily Energy Expenditure) from BMR and activity level
   * @param {number} bmr - Basal Metabolic Rate
   * @param {string} activityLevel - Activity level constant
   * @returns {Object} TDEE calculation result
   */
  static calculateTDEE(bmr, activityLevel) {
    if (!bmr || bmr <= 0) {
      return {
        success: false,
        errors: ['BMR must be a positive number'],
        tdee: 0
      };
    }

    const multiplier = BMRCalculator.ACTIVITY_MULTIPLIERS[activityLevel];
    
    if (!multiplier) {
      return {
        success: false,
        errors: [`Invalid activity level: ${activityLevel}`],
        tdee: 0
      };
    }

    const tdee = Math.round(bmr * multiplier);

    return {
      success: true,
      tdee,
      bmr,
      activityLevel,
      multiplier,
      description: BMRCalculator.ACTIVITY_DESCRIPTIONS[activityLevel],
      descriptionAr: BMRCalculator.ACTIVITY_DESCRIPTIONS_AR[activityLevel],
      errors: []
    };
  }

  /**
   * Calculates complete metabolic profile (BMR + TDEE)
   * @param {Object} params - Input parameters
   * @param {number} params.weight - Weight in kg
   * @param {number} params.height - Height in cm
   * @param {number} params.age - Age in years
   * @param {string} params.gender - Gender ('male' or 'female')
   * @param {string} params.activityLevel - Activity level constant
   * @param {boolean} params.useTDEEAsDailyCalories - Use TDEE as daily calories (default: true)
   * @returns {Object} Complete metabolic profile
   */
  static calculateMetabolicProfile({ weight, height, age, gender, activityLevel, useTDEEAsDailyCalories = true }) {
    // Calculate BMR first
    const bmrResult = BMRCalculator.calculateBMR({ weight, height, age, gender });
    
    if (!bmrResult.success) {
      return bmrResult;
    }

    // Calculate TDEE
    const tdeeResult = BMRCalculator.calculateTDEE(bmrResult.bmr, activityLevel);
    
    if (!tdeeResult.success) {
      return {
        success: false,
        errors: tdeeResult.errors,
        bmr: bmrResult.bmr,
        tdee: 0
      };
    }

    return {
      success: true,
      bmr: bmrResult.bmr,
      tdee: tdeeResult.tdee,
      dailyCalories: useTDEEAsDailyCalories ? tdeeResult.tdee : tdeeResult.tdee - 500,
      activityLevel,
      multiplier: tdeeResult.multiplier,
      description: tdeeResult.description,
      descriptionAr: tdeeResult.descriptionAr,
      formula: bmrResult.formula,
      useTDEEAsDailyCalories,
      errors: []
    };
  }

  /**
   * Gets all available activity levels with descriptions
   * @param {string} language - Language preference ('en' or 'ar')
   * @returns {Array} Array of activity level objects
   */
  static getActivityLevels(language = 'en') {
    const descriptions = language === 'ar' 
      ? BMRCalculator.ACTIVITY_DESCRIPTIONS_AR 
      : BMRCalculator.ACTIVITY_DESCRIPTIONS;

    return Object.values(BMRCalculator.ACTIVITY_LEVELS).map(level => ({
      value: level,
      multiplier: BMRCalculator.ACTIVITY_MULTIPLIERS[level],
      description: descriptions[level]
    }));
  }

  /**
   * Calculates age from date of birth
   * @param {string|Date} dateOfBirth - Date of birth
   * @returns {number} Age in years
   */
  static calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) return 0;
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Converts weight from pounds to kilograms
   * @param {number} pounds - Weight in pounds
   * @returns {number} Weight in kilograms
   */
  static poundsToKg(pounds) {
    return pounds * 0.453592;
  }

  /**
   * Converts height from inches to centimeters
   * @param {number} inches - Height in inches
   * @returns {number} Height in centimeters
   */
  static inchesToCm(inches) {
    return inches * 2.54;
  }

  /**
   * Converts height from feet and inches to centimeters
   * @param {number} feet - Height in feet
   * @param {number} inches - Height in inches
   * @returns {number} Height in centimeters
   */
  static feetInchesToCm(feet, inches) {
    return BMRCalculator.inchesToCm((feet * 12) + inches);
  }
}

export default BMRCalculator;
