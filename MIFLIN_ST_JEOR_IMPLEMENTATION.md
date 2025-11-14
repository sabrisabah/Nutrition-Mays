# Mifflin-St Jeor Equation Implementation Guide

## Overview

This document provides a comprehensive guide to the Mifflin-St Jeor equation implementation in the Dr. May's Nutrition application. The Mifflin-St Jeor equation is widely considered the most accurate method for calculating Basal Metabolic Rate (BMR) in healthy adults.

## What is the Mifflin-St Jeor Equation?

The Mifflin-St Jeor equation is a formula used to calculate the resting metabolic rate (RMR), which represents the number of calories the body burns while at complete rest. It was developed by MD Mifflin and ST St Jeor and first published in 1990.

### Why Use Mifflin-St Jeor?

- **Higher Accuracy**: More likely to predict RMR within 10% of measured values
- **Modern Formula**: Developed in 1990, more recent than Harris-Benedict (1919)
- **Evidence-Based**: Supported by comparative studies showing superior accuracy
- **Widely Accepted**: Used by healthcare professionals and nutritionists worldwide

## Formula Details

### Basic Equations

**For Males:**
```
BMR = (10 × weight [kg]) + (6.25 × height [cm]) - (5 × age [years]) + 5
```

**For Females:**
```
BMR = (10 × weight [kg]) + (6.25 × height [cm]) - (5 × age [years]) - 161
```

### Activity Level Multipliers

To calculate Total Daily Energy Expenditure (TDEE), multiply BMR by the appropriate activity factor:

| Activity Level | Multiplier | Description |
|----------------|------------|-------------|
| Sedentary | 1.2 | Little to no exercise, desk job |
| Lightly Active | 1.375 | Light exercise 1-3 days per week |
| Moderately Active | 1.55 | Moderate exercise 3-5 days per week |
| Active | 1.725 | Heavy exercise 6-7 days per week |
| Very Active | 1.9 | Very heavy exercise, physical job |

## Implementation in the Application

### 1. Core Calculator (`src/utils/bmrCalculator.js`)

The main BMR calculator utility provides:

- **Input Validation**: Ensures all parameters are within valid ranges
- **BMR Calculation**: Implements the Mifflin-St Jeor formula
- **TDEE Calculation**: Applies activity level multipliers
- **Error Handling**: Comprehensive error reporting
- **Unit Conversions**: Support for different measurement units
- **Bilingual Support**: Arabic and English descriptions

#### Key Features:

```javascript
// Calculate BMR
const bmrResult = BMRCalculator.calculateBMR({
  weight: 70,    // kg
  height: 175,   // cm
  age: 30,       // years
  gender: 'male'
});

// Calculate TDEE
const tdeeResult = BMRCalculator.calculateTDEE(bmrResult.bmr, 'moderate');

// Get complete metabolic profile
const profile = BMRCalculator.calculateMetabolicProfile({
  weight: 70,
  height: 175,
  age: 30,
  gender: 'male',
  activityLevel: 'moderate'
});
```

### 2. Enhanced Nutrition Calculator (`src/components/nutrition/EnhancedNutritionCalculator.jsx`)

An improved version of the nutrition calculator that uses the enhanced BMR calculator:

- **Better Validation**: Uses the robust validation from the utility
- **Detailed Reporting**: Shows calculation formulas and activity descriptions
- **Error Handling**: Displays validation errors to users
- **Goal-Based Adjustments**: Adjusts calories based on patient goals
- **Comprehensive Nutrition**: Calculates protein, carbs, fat, fiber, and water needs

### 3. Test Suite (`src/utils/__tests__/bmrCalculator.test.js`)

Comprehensive test coverage including:

- **Input Validation Tests**: Ensures proper validation of all parameters
- **BMR Calculation Tests**: Verifies correct formula implementation
- **TDEE Calculation Tests**: Tests all activity level multipliers
- **Edge Case Tests**: Handles boundary values and invalid inputs
- **Real-world Test Cases**: Validates against known examples

## Usage Examples

### Basic BMR Calculation

```javascript
import { BMRCalculator } from './utils/bmrCalculator';

// Calculate BMR for a 30-year-old male, 70kg, 175cm
const result = BMRCalculator.calculateBMR({
  weight: 70,
  height: 175,
  age: 30,
  gender: 'male'
});

console.log(`BMR: ${result.bmr} calories/day`);
// Output: BMR: 1702 calories/day
```

### Complete Metabolic Profile

```javascript
// Get complete metabolic profile
const profile = BMRCalculator.calculateMetabolicProfile({
  weight: 70,
  height: 175,
  age: 30,
  gender: 'male',
  activityLevel: 'moderate'
});

console.log(`BMR: ${profile.bmr} calories/day`);
console.log(`TDEE: ${profile.tdee} calories/day`);
console.log(`Activity: ${profile.description}`);
// Output: 
// BMR: 1702 calories/day
// TDEE: 2638 calories/day
// Activity: Moderate exercise 3-5 days per week
```

### Using in React Components

```jsx
import { BMRCalculator } from '../utils/bmrCalculator';

const MyComponent = ({ patientProfile }) => {
  const [nutritionData, setNutritionData] = useState({});

  useEffect(() => {
    if (patientProfile) {
      const result = BMRCalculator.calculateMetabolicProfile({
        weight: patientProfile.current_weight,
        height: patientProfile.height,
        age: patientProfile.user?.age,
        gender: patientProfile.gender,
        activityLevel: patientProfile.activity_level
      });

      if (result.success) {
        setNutritionData({
          bmr: result.bmr,
          tdee: result.tdee
        });
      }
    }
  }, [patientProfile]);

  return (
    <div>
      <p>BMR: {nutritionData.bmr} calories/day</p>
      <p>TDEE: {nutritionData.tdee} calories/day</p>
    </div>
  );
};
```

## Validation Rules

The calculator includes comprehensive input validation:

### Weight
- **Range**: 20-300 kg
- **Required**: Yes
- **Type**: Number

### Height
- **Range**: 100-250 cm
- **Required**: Yes
- **Type**: Number

### Age
- **Range**: 15-100 years
- **Required**: Yes
- **Type**: Number

### Gender
- **Values**: 'male' or 'female'
- **Required**: Yes
- **Type**: String

### Activity Level
- **Values**: 'sedentary', 'light', 'moderate', 'active', 'very_active'
- **Required**: Yes
- **Type**: String

## Error Handling

The calculator provides detailed error messages for various scenarios:

```javascript
// Example error handling
const result = BMRCalculator.calculateBMR({
  weight: -10,  // Invalid weight
  height: 175,
  age: 30,
  gender: 'male'
});

if (!result.success) {
  console.log('Errors:', result.errors);
  // Output: ['Weight must be between 20 and 300 kg']
}
```

## Unit Conversions

The calculator supports various unit conversions:

```javascript
// Convert pounds to kilograms
const kg = BMRCalculator.poundsToKg(154.324); // 70 kg

// Convert inches to centimeters
const cm = BMRCalculator.inchesToCm(68.9); // 175 cm

// Convert feet and inches to centimeters
const cm2 = BMRCalculator.feetInchesToCm(5, 9); // 175.26 cm

// Calculate age from date of birth
const age = BMRCalculator.calculateAge('1993-01-01'); // 31 years
```

## Integration with Existing Code

The enhanced calculator is designed to be a drop-in replacement for the existing `NutritionCalculator`:

1. **Same Props**: Uses the same `patientProfile` and `onNutritionCalculated` props
2. **Same Output**: Returns the same nutrition data structure
3. **Enhanced Features**: Adds validation, error handling, and detailed reporting
4. **Backward Compatible**: Can replace existing calculator without breaking changes

## Best Practices

### 1. Always Validate Input
```javascript
const validation = BMRCalculator.validateInput(input);
if (!validation.isValid) {
  // Handle validation errors
  return;
}
```

### 2. Handle Errors Gracefully
```javascript
const result = BMRCalculator.calculateBMR(input);
if (!result.success) {
  console.error('BMR calculation failed:', result.errors);
  // Show user-friendly error message
  return;
}
```

### 3. Use Appropriate Activity Levels
- **Sedentary**: Office workers, students
- **Light**: Light exercise 1-3 days/week
- **Moderate**: Regular exercise 3-5 days/week
- **Active**: Heavy exercise 6-7 days/week
- **Very Active**: Athletes, physical laborers

### 4. Consider Individual Factors
- Age affects BMR (decreases with age)
- Muscle mass affects BMR (higher muscle = higher BMR)
- Health conditions may require adjustments
- Always consult healthcare professionals for medical advice

## Testing

Run the test suite to ensure everything works correctly:

```bash
npm test src/utils/__tests__/bmrCalculator.test.js
```

The test suite includes:
- 50+ test cases
- Edge case validation
- Real-world examples
- Error handling verification
- Unit conversion tests

## Future Enhancements

Potential improvements for future versions:

1. **Body Composition Integration**: Factor in muscle mass and body fat percentage
2. **Health Condition Adjustments**: Special calculations for diabetes, thyroid conditions
3. **Age-Specific Formulas**: Different formulas for children and elderly
4. **Machine Learning**: AI-powered adjustments based on user feedback
5. **Integration with Wearables**: Real-time activity data from fitness trackers

## References

1. Mifflin, M. D., St Jeor, S. T., Hill, L. A., Scott, B. J., Daugherty, S. A., & Koh, Y. O. (1990). A new predictive equation for resting energy expenditure in healthy individuals. *The American Journal of Clinical Nutrition*, 51(2), 241-247.

2. Frankenfield, D., Roth-Yousey, L., & Compher, C. (2005). Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. *Journal of the American Dietetic Association*, 105(6), 775-789.

3. Compher, C., Frankenfield, D., Keim, N., & Roth-Yousey, L. (2006). Best practice methods to apply to measurement of resting metabolic rate in adults: a systematic review. *Journal of the American Dietetic Association*, 106(6), 881-903.
