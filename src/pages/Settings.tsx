import { useState } from 'react'
import { PencilIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useGoals, type Goal } from '../contexts/GoalContext'
import { useCategories } from '../contexts/CategoryContext'
import GoalModal from '../components/GoalModal'
import { useNavigate } from 'react-router-dom'

function Settings() {
  const { goals, deleteGoal } = useGoals()
  const { categories } = useCategories()
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const navigate = useNavigate()

  const handleGoalEdit = (goal: Goal) => {
    setSelectedGoal(goal)
  }

  const handleGoalDelete = (goalId: string) => {
    deleteGoal(goalId)
  }

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName)
    return category ? {
      Icon: category.icon,
      color: category.color
    } : null
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Cog6ToothIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary">Manage your goals</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Manage Goals</h2>
          <div className="space-y-4">
            {goals.map(goal => {
              const categoryIcon = getCategoryIcon(goal.category)
              
              return (
                <div key={goal.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                  <div className="flex items-center gap-4">
                    {categoryIcon && (
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${categoryIcon.color}20` }}
                      >
                        <categoryIcon.Icon 
                          className="h-5 w-5"
                          style={{ color: categoryIcon.color }}
                        />
                      </div>
                    )}
                    <div>
                      <h3 
                        onClick={() => navigate(`/goals/${goal.id}`)}
                        className="font-medium text-text-primary cursor-pointer hover:underline"
                      >
                        {goal.title}
                      </h3>
                      <p className="text-sm text-text-secondary">{goal.description}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {goal.timeHorizon.charAt(0).toUpperCase() + goal.timeHorizon.slice(1)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGoalEdit(goal)}
                      className="p-2 text-text-secondary hover:text-primary rounded-lg hover:bg-gray-50"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleGoalDelete(goal.id)}
                      className="p-2 text-text-secondary hover:text-error rounded-lg hover:bg-gray-50"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selectedGoal && (
        <GoalModal
          isOpen={true}
          onClose={() => setSelectedGoal(null)}
          editGoal={selectedGoal}
        />
      )}
    </div>
  )
}

export default Settings