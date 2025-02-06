import { CalendarIcon } from '@heroicons/react/24/outline'
import { useGoals } from '../contexts/GoalContext'

export default function WeeklyPlan() {
  const { goals } = useGoals()
  const weeklyGoals = goals.filter(goal => goal.timeHorizon === 'weekly')

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <CalendarIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Weekly Plan</h1>
          <p className="text-text-secondary">Plan and track your weekly activities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">This Week's Focus</h2>
          {weeklyGoals.length > 0 ? (
            <div className="space-y-4">
              {weeklyGoals.map(goal => (
                <div key={goal.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium">{goal.title}</h3>
                  <p className="text-sm text-text-secondary">{goal.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No weekly goals set yet</p>
          )}
        </div>
      </div>
    </div>
  )
} 