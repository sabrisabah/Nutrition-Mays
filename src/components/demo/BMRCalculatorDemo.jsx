import React, { useState } from 'react'
import { BMRCalculator } from '../../utils/bmrCalculator'

const BMRCalculatorDemo = () => {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    activityLevel: 'moderate'
  })

  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState([])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCalculate = (e) => {
    e.preventDefault()
    setErrors([])

    // Convert string inputs to numbers
    const numericData = {
      ...formData,
      weight: parseFloat(formData.weight),
      height: parseFloat(formData.height),
      age: parseInt(formData.age)
    }

    // Calculate metabolic profile
    const calculationResult = BMRCalculator.calculateMetabolicProfile(numericData)

    if (calculationResult.success) {
      setResult(calculationResult)
    } else {
      setErrors(calculationResult.errors)
    }
  }

  const activityLevels = BMRCalculator.getActivityLevels('en')

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-calculator me-2"></i>
                BMR Calculator Demo - Mifflin-St Jeor Equation
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleCalculate}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Weight (kg)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        placeholder="70"
                        step="0.1"
                        min="20"
                        max="300"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Height (cm)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        placeholder="175"
                        step="0.1"
                        min="100"
                        max="250"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Age (years)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        placeholder="30"
                        min="15"
                        max="100"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-select"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Activity Level</label>
                  <select
                    className="form-select"
                    name="activityLevel"
                    value={formData.activityLevel}
                    onChange={handleInputChange}
                  >
                    {activityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.description} (×{level.multiplier})
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-calculator me-2"></i>
                  Calculate BMR & TDEE
                </button>
              </form>

              {errors.length > 0 && (
                <div className="alert alert-danger mt-3">
                  <h6 className="alert-heading">Validation Errors:</h6>
                  <ul className="mb-0">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result && (
                <div className="mt-4">
                  <h5 className="text-primary">Results</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6 className="card-title">Basal Metabolic Rate (BMR)</h6>
                          <h4 className="text-primary">{result.bmr} calories/day</h4>
                          <small className="text-muted">
                            Energy needed for basic body functions
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6 className="card-title">Total Daily Energy Expenditure (TDEE)</h6>
                          <h4 className="text-success">{result.tdee} calories/day</h4>
                          <small className="text-muted">
                            {result.description}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h6>Calculation Details:</h6>
                    <div className="alert alert-info">
                      <strong>Formula:</strong> {result.formula.equation}<br/>
                      <strong>Activity Multiplier:</strong> {result.multiplier}<br/>
                      <strong>Activity Level:</strong> {result.description}
                    </div>
                  </div>

                  <div className="mt-3">
                    <h6>Nutrition Recommendations:</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="card border-primary">
                          <div className="card-body text-center">
                            <h6 className="card-title text-primary">Weight Loss</h6>
                            <h5>{result.tdee - 500} cal/day</h5>
                            <small className="text-muted">-500 calories deficit</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-success">
                          <div className="card-body text-center">
                            <h6 className="card-title text-success">Maintenance</h6>
                            <h5>{result.tdee} cal/day</h5>
                            <small className="text-muted">No change needed</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-warning">
                          <div className="card-body text-center">
                            <h6 className="card-title text-warning">Weight Gain</h6>
                            <h5>{result.tdee + 300} cal/day</h5>
                            <small className="text-muted">+300 calories surplus</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BMRCalculatorDemo
