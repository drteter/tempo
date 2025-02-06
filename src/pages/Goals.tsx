import { FlagIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useGoals } from '../contexts/GoalContext'

type Goal = {
  id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'archived'
  category: string
}

function GoalCard({ goal }: { goal: Goal }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/goals/${goal.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="card hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FlagIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{goal.title}</h3>
            <p className="text-sm text-text-secondary">{goal.description}</p>
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-text-secondary" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
          {goal.category}
        </span>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-info/10 text-info">
          {goal.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}

function Goals() {
  const { goals } = useGoals()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Goals</h1>
        <p className="text-text-secondary mt-1">Track and manage your goals.</p>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  )
}

export default Goals 