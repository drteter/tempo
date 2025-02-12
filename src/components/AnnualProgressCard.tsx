import { useGoals } from '../contexts/GoalContext'
import { useCategories } from '../contexts/CategoryContext'
import { differenceInDays } from 'date-fns'

function AnnualProgressCard() {
  const { goals } = useGoals()
  const { categories } = useCategories()
  const annualGoals = goals.filter(goal => goal.timeHorizon === 'annual')

  const calculateProjection = (goal: any) => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const endOfYear = new Date(now.getFullYear(), 11, 31)
    
    const daysPassed = differenceInDays(now, startOfYear)
    const totalDays = differenceInDays(endOfYear, startOfYear)
    const percentOfYearPassed = daysPassed / totalDays

    if (goal.trackingType === 'count') {
      const currentProgress = goal.tracking.progress || 0
      const target = goal.tracking.target?.value || 0
      const projectedValue = (currentProgress / percentOfYearPassed) || 0
      const percentComplete = (currentProgress / target) * 100
      const projectedPercent = (projectedValue / target) * 100

      return {
        percentComplete: Math.min(percentComplete, 100),
        projectedPercent: Math.min(projectedPercent, 100),
        currentValue: currentProgress,
        projectedValue: Math.round(projectedValue),
        target,
        unit: goal.tracking.target?.unit || ''
      }
    }

    // For boolean goals, use completion dates count
    const completions = goal.tracking.completedDates?.length || 0
    const projectedCompletions = (completions / percentOfYearPassed) || 0
    
    return {
      percentComplete: (completions / goal.target) * 100,
      projectedPercent: (projectedCompletions / goal.target) * 100,
      currentValue: completions,
      projectedValue: Math.round(projectedCompletions),
      target: goal.target,
      unit: 'times'
    }
  }

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName)
    return category ? {
      Icon: category.icon,
      color: category.color
    } : null
  }

  const formatValue = (value: number, unit: string) => {
    return `${value} ${unit}`
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Annual Goals Progress</h2>
      <div className="space-y-4">
        {annualGoals.map(goal => {
          const projection = calculateProjection(goal)
          const categoryIcon = getCategoryIcon(goal.category)

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center gap-2">
                {categoryIcon && (
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${categoryIcon.color}20` }}
                  >
                    <categoryIcon.Icon 
                      className="h-4 w-4"
                      style={{ color: categoryIcon.color }}
                    />
                  </div>
                )}
                <h3 className="font-medium text-text-primary">{goal.title}</h3>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    {formatValue(projection.currentValue, projection.unit)}
                  </span>
                  <span className="text-text-secondary">
                    {formatValue(projection.target, projection.unit)}
                  </span>
                </div>
                
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  {/* Current progress */}
                  <div 
                    className="absolute h-full bg-primary rounded-full"
                    style={{ width: `${projection.percentComplete}%` }}
                  />
                  {/* Projected progress indicator */}
                  <div 
                    className="absolute h-full w-0.5 bg-primary/50"
                    style={{ left: `${projection.projectedPercent}%` }}
                  />
                </div>
                
                <div className="text-xs text-text-secondary">
                  Projected: {formatValue(projection.projectedValue, projection.unit)}
                  {projection.projectedValue < projection.target ? 
                    " (Below Target)" : 
                    " (On Track)"}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AnnualProgressCard 