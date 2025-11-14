/**
 * Comprehensive test suite for BMR Calculator using Mifflin-St Jeor equation
 */

import { BMRCalculator } from '../bmrCalculator';

describe('BMRCalculator', () => {
  describe('Input Validation', () => {
    test('should validate correct input parameters', () => {
      const validInput = {
        weight: 70,
        height: 175,
        age: 30,
        gender: 'male'
      };

      const result = BMRCalculator.validateInput(validInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid weight values', () => {
      const invalidWeights = [0, -5, 500, 'invalid', null, undefined];
      
      invalidWeights.forEach(weight => {
        const result = BMRCalculator.validateInput({
          weight,
          height: 175,
          age: 30,
          gender: 'male'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should reject invalid height values', () => {
      const invalidHeights = [0, -10, 300, 'invalid', null, undefined];
      
      invalidHeights.forEach(height => {
        const result = BMRCalculator.validateInput({
          weight: 70,
          height,
          age: 30,
          gender: 'male'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should reject invalid age values', () => {
      const invalidAges = [0, -5, 150, 'invalid', null, undefined];
      
      invalidAges.forEach(age => {
        const result = BMRCalculator.validateInput({
          weight: 70,
          height: 175,
          age,
          gender: 'male'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should reject invalid gender values', () => {
      const invalidGenders = ['invalid', 'MALE', 'FEMALE', null, undefined, 123];
      
      invalidGenders.forEach(gender => {
        const result = BMRCalculator.validateInput({
          weight: 70,
          height: 175,
          age: 30,
          gender
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should enforce weight range limits', () => {
      const tooLight = BMRCalculator.validateInput({
        weight: 15,
        height: 175,
        age: 30,
        gender: 'male'
      });
      expect(tooLight.isValid).toBe(false);
      expect(tooLight.errors[0]).toContain('Weight must be between 20 and 300 kg');

      const tooHeavy = BMRCalculator.validateInput({
        weight: 350,
        height: 175,
        age: 30,
        gender: 'male'
      });
      expect(tooHeavy.isValid).toBe(false);
      expect(tooHeavy.errors[0]).toContain('Weight must be between 20 and 300 kg');
    });

    test('should enforce height range limits', () => {
      const tooShort = BMRCalculator.validateInput({
        weight: 70,
        height: 50,
        age: 30,
        gender: 'male'
      });
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors[0]).toContain('Height must be between 100 and 250 cm');

      const tooTall = BMRCalculator.validateInput({
        weight: 70,
        height: 300,
        age: 30,
        gender: 'male'
      });
      expect(tooTall.isValid).toBe(false);
      expect(tooTall.errors[0]).toContain('Height must be between 100 and 250 cm');
    });

    test('should enforce age range limits', () => {
      const tooYoung = BMRCalculator.validateInput({
        weight: 70,
        height: 175,
        age: 10,
        gender: 'male'
      });
      expect(tooYoung.isValid).toBe(false);
      expect(tooYoung.errors[0]).toContain('Age must be between 15 and 100 years');

      const tooOld = BMRCalculator.validateInput({
        weight: 70,
        height: 175,
        age: 150,
        gender: 'male'
      });
      expect(tooOld.isValid).toBe(false);
      expect(tooOld.errors[0]).toContain('Age must be between 15 and 100 years');
    });
  });

  describe('BMR Calculation', () => {
    test('should calculate BMR correctly for male', () => {
      const result = BMRCalculator.calculateBMR({
        weight: 70,
        height: 175,
        age: 30,
        gender: 'male'
      });

      expect(result.success).toBe(true);
      expect(result.bmr).toBe(1702); // (10 * 70) + (6.25 * 175) - (5 * 30) + 5 = 1701.25 ≈ 1702
      expect(result.formula.equation).toBe('(10 × weight) + (6.25 × height) - (5 × age) + 5');
    });

    test('should calculate BMR correctly for female', () => {
      const result = BMRCalculator.calculateBMR({
        weight: 60,
        height: 165,
        age: 25,
        gender: 'female'
      });

      expect(result.success).toBe(true);
      expect(result.bmr).toBe(1344); // (10 * 60) + (6.25 * 165) - (5 * 25) - 161 = 1343.75 ≈ 1344
      expect(result.formula.equation).toBe('(10 × weight) + (6.25 × height) - (5 × age) - 161');
    });

    test('should return error for invalid input', () => {
      const result = BMRCalculator.calculateBMR({
        weight: -10,
        height: 175,
        age: 30,
        gender: 'male'
      });

      expect(result.success).toBe(false);
      expect(result.bmr).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle edge case values', () => {
      // Minimum valid values
      const minResult = BMRCalculator.calculateBMR({
        weight: 20,
        height: 100,
        age: 15,
        gender: 'male'
      });
      expect(minResult.success).toBe(true);
      expect(minResult.bmr).toBeGreaterThan(0);

      // Maximum valid values
      const maxResult = BMRCalculator.calculateBMR({
        weight: 300,
        height: 250,
        age: 100,
        gender: 'female'
      });
      expect(maxResult.success).toBe(true);
      expect(maxResult.bmr).toBeGreaterThan(0);
    });
  });

  describe('TDEE Calculation', () => {
    test('should calculate TDEE correctly for all activity levels', () => {
      const bmr = 1700;
      const activityLevels = [
        { level: 'sedentary', expected: 2040 },
        { level: 'light', expected: 2338 },
        { level: 'moderate', expected: 2635 },
        { level: 'active', expected: 2933 },
        { level: 'very_active', expected: 3230 }
      ];

      activityLevels.forEach(({ level, expected }) => {
        const result = BMRCalculator.calculateTDEE(bmr, level);
        expect(result.success).toBe(true);
        expect(result.tdee).toBe(expected);
        expect(result.multiplier).toBe(BMRCalculator.ACTIVITY_MULTIPLIERS[level]);
      });
    });

    test('should return error for invalid BMR', () => {
      const result = BMRCalculator.calculateTDEE(0, 'moderate');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('BMR must be a positive number');
    });

    test('should return error for invalid activity level', () => {
      const result = BMRCalculator.calculateTDEE(1700, 'invalid_level');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid activity level: invalid_level');
    });
  });

  describe('Complete Metabolic Profile', () => {
    test('should calculate complete profile correctly', () => {
      const result = BMRCalculator.calculateMetabolicProfile({
        weight: 70,
        height: 175,
        age: 30,
        gender: 'male',
        activityLevel: 'moderate'
      });

      expect(result.success).toBe(true);
      expect(result.bmr).toBe(1702);
      expect(result.tdee).toBe(2638); // 1702 * 1.55
      expect(result.activityLevel).toBe('moderate');
      expect(result.multiplier).toBe(1.55);
      expect(result.description).toBe('Moderate exercise 3-5 days per week');
    });

    test('should return error for invalid input in complete profile', () => {
      const result = BMRCalculator.calculateMetabolicProfile({
        weight: -10,
        height: 175,
        age: 30,
        gender: 'male',
        activityLevel: 'moderate'
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Activity Levels', () => {
    test('should return all activity levels in English', () => {
      const levels = BMRCalculator.getActivityLevels('en');
      expect(levels).toHaveLength(5);
      
      const levelValues = levels.map(level => level.value);
      expect(levelValues).toContain('sedentary');
      expect(levelValues).toContain('light');
      expect(levelValues).toContain('moderate');
      expect(levelValues).toContain('active');
      expect(levelValues).toContain('very_active');
    });

    test('should return all activity levels in Arabic', () => {
      const levels = BMRCalculator.getActivityLevels('ar');
      expect(levels).toHaveLength(5);
      
      // Check that Arabic descriptions are present
      const sedentaryLevel = levels.find(level => level.value === 'sedentary');
      expect(sedentaryLevel.description).toContain('قليل النشاط');
    });

    test('should have correct multipliers for all activity levels', () => {
      const levels = BMRCalculator.getActivityLevels();
      
      expect(levels.find(l => l.value === 'sedentary').multiplier).toBe(1.2);
      expect(levels.find(l => l.value === 'light').multiplier).toBe(1.375);
      expect(levels.find(l => l.value === 'moderate').multiplier).toBe(1.55);
      expect(levels.find(l => l.value === 'active').multiplier).toBe(1.725);
      expect(levels.find(l => l.value === 'very_active').multiplier).toBe(1.9);
    });
  });

  describe('Utility Functions', () => {
    test('should calculate age from date of birth correctly', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      
      const age = BMRCalculator.calculateAge(birthDate);
      expect(age).toBe(25);
    });

    test('should handle invalid date of birth', () => {
      const age = BMRCalculator.calculateAge('invalid-date');
      expect(age).toBe(0);
    });

    test('should convert pounds to kilograms correctly', () => {
      const kg = BMRCalculator.poundsToKg(154.324); // 70 kg in pounds
      expect(kg).toBeCloseTo(70, 1);
    });

    test('should convert inches to centimeters correctly', () => {
      const cm = BMRCalculator.inchesToCm(68.9); // 175 cm in inches
      expect(cm).toBeCloseTo(175, 1);
    });

    test('should convert feet and inches to centimeters correctly', () => {
      const cm = BMRCalculator.feetInchesToCm(5, 9); // 5'9" = 175.26 cm
      expect(cm).toBeCloseTo(175.26, 1);
    });
  });

  describe('Real-world Test Cases', () => {
    test('should match expected values for typical adult male', () => {
      // 30-year-old male, 70kg, 175cm, moderate activity
      const result = BMRCalculator.calculateMetabolicProfile({
        weight: 70,
        height: 175,
        age: 30,
        gender: 'male',
        activityLevel: 'moderate'
      });

      expect(result.success).toBe(true);
      expect(result.bmr).toBe(1702);
      expect(result.tdee).toBe(2638);
    });

    test('should match expected values for typical adult female', () => {
      // 25-year-old female, 60kg, 165cm, light activity
      const result = BMRCalculator.calculateMetabolicProfile({
        weight: 60,
        height: 165,
        age: 25,
        gender: 'female',
        activityLevel: 'light'
      });

      expect(result.success).toBe(true);
      expect(result.bmr).toBe(1344);
      expect(result.tdee).toBe(1848); // 1344 * 1.375
    });

    test('should handle elderly person correctly', () => {
      // 75-year-old male, 80kg, 170cm, sedentary
      const result = BMRCalculator.calculateMetabolicProfile({
        weight: 80,
        height: 170,
        age: 75,
        gender: 'male',
        activityLevel: 'sedentary'
      });

      expect(result.success).toBe(true);
      expect(result.bmr).toBe(1520); // (10 * 80) + (6.25 * 170) - (5 * 75) + 5 = 1520
      expect(result.tdee).toBe(1824); // 1520 * 1.2
    });

    test('should handle very active person correctly', () => {
      // 22-year-old female, 55kg, 160cm, very active
      const result = BMRCalculator.calculateMetabolicProfile({
        weight: 55,
        height: 160,
        age: 22,
        gender: 'female',
        activityLevel: 'very_active'
      });

      expect(result.success).toBe(true);
      expect(result.bmr).toBe(1254); // (10 * 55) + (6.25 * 160) - (5 * 22) - 161 = 1254
      expect(result.tdee).toBe(2383); // 1254 * 1.9
    });
  });
});
