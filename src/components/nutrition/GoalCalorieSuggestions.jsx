import React from 'react'

/**
 * مكون لعرض السعرات الحرارية المقترحة حسب الهدف
 * يظهر جدول بالأهداف المختلفة مع السعرات المقترحة لكل هدف
 */
const GoalCalorieSuggestions = ({ onCalorieSelect, selectedGoal = null }) => {
  const goalOptions = [
    {
      id: 'moderate_loss',
      label: 'خسارة وزن معتدلة',
      calories: 2250,
      note: 'نقص 500 سعرة يومياً يؤدي إلى نزول 0.5 كغ أسبوعياً تقريباً',
      goalValue: 'lose_weight',
      color: 'success'
    },
    {
      id: 'fast_loss',
      label: 'خسارة سريعة',
      calories: 2000,
      note: 'يُفضل فقط لفترة قصيرة',
      goalValue: 'lose_weight',
      color: 'warning'
    },
    {
      id: 'maintain',
      label: 'تثبيت الوزن',
      calories: 2750,
      note: 'للحفاظ على نفس الوزن',
      goalValue: 'maintain_weight',
      color: 'info'
    },
    {
      id: 'gain',
      label: 'زيادة عضل أو وزن',
      calories: 3100,
      note: 'مع تمارين مقاومة',
      goalValue: 'build_muscle',
      color: 'primary'
    }
  ]

  const handleSelectCalories = (goalOption) => {
    if (onCalorieSelect) {
      onCalorieSelect({
        calories: goalOption.calories,
        goal: goalOption.goalValue,
        label: goalOption.label
      })
    }
  }

  return (
    <div className="card mb-4">
      <div className="card-header bg-light">
        <h5 className="mb-0">
          <i className="fas fa-bullseye me-2"></i>
          لتحديد الهدف - السعرات المقترحة
        </h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>الهدف</th>
                <th style={{ width: '25%' }} className="text-center">السعرات المقترحة</th>
                <th style={{ width: '45%' }}>الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {goalOptions.map((option) => {
                const isSelected = selectedGoal === option.goalValue
                return (
                  <tr
                    key={option.id}
                    onClick={() => handleSelectCalories(option)}
                    className={`${isSelected ? 'table-active' : ''} ${onCalorieSelect ? 'cursor-pointer' : ''}`}
                    style={{ cursor: onCalorieSelect ? 'pointer' : 'default' }}
                  >
                    <td>
                      <strong className={`text-${option.color}`}>
                        {option.label}
                      </strong>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-primary fs-6">
                        {option.calories.toLocaleString()} سعرة
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {option.note}
                      </small>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {onCalorieSelect && (
          <div className="mt-3">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              اضغط على أي صف لتطبيق السعرات المقترحة
            </small>
          </div>
        )}
      </div>
    </div>
  )
}

export default GoalCalorieSuggestions
