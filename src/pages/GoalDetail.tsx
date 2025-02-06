import { useParams, Link } from 'react-router-dom'
import { useGoals } from '../contexts/GoalContext'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function GoalDetail() {
  const { id } = useParams()
  const { goals } = useGoals()
  const goal = goals.find(g => g.id === id)

  if (!goal) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Link
            to="/goals"
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Goal Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to="/goals"
          className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{goal.title}</h1>
          <p className="text-text-secondary">{goal.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Goal Details</h2>
          <div className="space-y-4">
            <p className="text-text-secondary">Status: {goal.status}</p>
            <p className="text-text-secondary">Category: {goal.category}</p>
            <p className="text-text-secondary">Time Horizon: {goal.timeHorizon}</p>

            {goal.tracking.startDate && (
              <p className="text-text-secondary">
                Start Date: {new Date(goal.tracking.startDate).toLocaleDateString()}
              </p>
            )}

            {goal.tracking.endDate && (
              <p className="text-text-secondary">
                End Date: {new Date(goal.tracking.endDate).toLocaleDateString()}
              </p>
            )}

            {goal.tracking.target && (
              <p className="text-text-secondary">
                Target: {goal.tracking.target.value} {goal.tracking.target.unit}
              </p>
            )}

            {goal.tracking.progress !== undefined && (
              <p className="text-text-secondary">Progress: {goal.tracking.progress}%</p>
            )}

            {goal.tracking.routineConfig && (
              <>
                <p className="text-text-secondary">
                  Frequency: {goal.tracking.routineConfig.frequency}
                </p>
                <p className="text-text-secondary">
                  Scheduled Days: {goal.tracking.routineConfig.scheduledDays.map(day => 
                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                  ).join(', ')}
                </p>
              </>
            )}

            {goal.tracking.checkpoints && goal.tracking.checkpoints.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-2">Checkpoints</h3>
                <ul className="space-y-2">
                  {goal.tracking.checkpoints.map((checkpoint) => (
                    <li
                      key={checkpoint.id}
                      className="flex items-center gap-2 text-text-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={checkpoint.completed}
                        readOnly
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{checkpoint.title}</span>
                      {checkpoint.dueDate && (
                        <span className="text-sm">
                          (Due: {new Date(checkpoint.dueDate).toLocaleDateString()})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 