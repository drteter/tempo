import { CalendarIcon } from '@heroicons/react/24/outline'
import { useGoals } from '../contexts/GoalContext'

export default function QuarterlyBaseline() {
  const { goals } = useGoals()
  const quarterlyGoals = goals.filter(goal => goal.timeHorizon === 'quarterly')

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <CalendarIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quarterly Baseline</h1>
          <p className="text-text-secondary">Track your quarterly objectives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">This Quarter's Goals</h2>
          {quarterlyGoals.length > 0 ? (
            <div className="space-y-4">
              {quarterlyGoals.map(goal => (
                <div key={goal.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium">{goal.title}</h3>
                  <p className="text-sm text-text-secondary">{goal.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No quarterly goals set yet.</p>
          )}
        </div>
      </div>
    </div>
  )
} 