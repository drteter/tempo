import { SparklesIcon } from '@heroicons/react/24/outline'
import { useGoals } from '../contexts/GoalContext'
import { useNavigate } from 'react-router-dom'

export default function LifetimeGoals() {
  const { goals } = useGoals()
  const navigate = useNavigate()
  const lifetimeGoals = goals.filter(goal => goal.timeHorizon === 'lifetime')

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <SparklesIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Lifetime Goals</h1>
          <p className="text-text-secondary">Your long-term aspirations and dreams</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Life Aspirations</h2>
          {lifetimeGoals.length > 0 ? (
            <div className="space-y-4">
              {lifetimeGoals.map(goal => (
                <div 
                  key={goal.id} 
                  onClick={() => navigate(`/goals/${goal.id}`)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <h3 className="font-medium hover:text-primary">{goal.title}</h3>
                  <p className="text-sm text-text-secondary">{goal.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No lifetime goals set yet</p>
          )}
        </div>
      </div>
    </div>
  )
} 