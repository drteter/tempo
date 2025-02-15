import { FlagIcon } from '@heroicons/react/24/outline'
import { useGoals } from '../contexts/GoalContext'
import { useNavigate } from 'react-router-dom'

export default function AnnualGoals() {
  const { goals } = useGoals()
  const navigate = useNavigate()
  const annualGoals = goals.filter(goal => goal.timeHorizon === 'annual')

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FlagIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Annual Goals</h1>
          <p className="text-text-secondary">Priorities for the year</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">This Year's Goals</h2>
          {annualGoals.length > 0 ? (
            <div className="space-y-4">
              {annualGoals.map(goal => (
                <div key={goal.id} className="p-4 border rounded-lg">
                  <h3 
                    onClick={() => navigate(`/goals/${goal.id}`)}
                    className="font-medium cursor-pointer hover:underline"
                  >
                    {goal.title}
                  </h3>
                  <p className="text-sm text-text-secondary">{goal.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No annual goals set yet</p>
          )}
        </div>
      </div>
    </div>
  )
} 