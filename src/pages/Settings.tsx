import { useState } from 'react'
import { PencilIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useGoals, type Goal } from '../contexts/GoalContext'
import { useCategories, type Category } from '../contexts/CategoryContext'

type EditableGoal = Goal & { isEditing: boolean }

function Settings() {
  const { goals, updateGoal, deleteGoal } = useGoals()
  const { categories } = useCategories()
  const [editableGoals, setEditableGoals] = useState<EditableGoal[]>(
    goals.map(goal => ({ ...goal, isEditing: false }))
  )

  const handleGoalEdit = (goalId: string) => {
    setEditableGoals(current =>
      current.map(goal =>
        goal.id === goalId ? { ...goal, isEditing: true } : goal
      )
    )
  }

  const handleGoalDelete = (goalId: string) => {
    deleteGoal(goalId)
    setEditableGoals(current => current.filter(goal => goal.id !== goalId))
  }

  const handleGoalSave = (goal: EditableGoal) => {
    const { isEditing, ...goalWithoutEditing } = goal
    updateGoal(goalWithoutEditing)
    setEditableGoals(current =>
      current.map(g =>
        g.id === goal.id ? { ...goal, isEditing: false } : g
      )
    )
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
            {editableGoals.map(goal => (
              <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg">
                {goal.isEditing ? (
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={goal.title}
                      onChange={e => setEditableGoals(current =>
                        current.map(g =>
                          g.id === goal.id ? { ...g, title: e.target.value } : g
                        )
                      )}
                      className="block w-full rounded-md border border-gray-200 px-3 py-2"
                      placeholder="Goal title"
                    />
                    <input
                      type="text"
                      value={goal.description}
                      onChange={e => setEditableGoals(current =>
                        current.map(g =>
                          g.id === goal.id ? { ...g, description: e.target.value } : g
                        )
                      )}
                      className="block w-full rounded-md border border-gray-200 px-3 py-2"
                      placeholder="Description"
                    />
                    <select
                      value={goal.status}
                      onChange={e => setEditableGoals(current =>
                        current.map(g =>
                          g.id === goal.id ? { ...g, status: e.target.value as Goal['status'] } : g
                        )
                      )}
                      className="block w-full rounded-md border border-gray-200 px-3 py-2"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <select
                      value={goal.category}
                      onChange={e => setEditableGoals(current =>
                        current.map(g =>
                          g.id === goal.id ? { ...g, category: e.target.value } : g
                        )
                      )}
                      className="block w-full rounded-md border border-gray-200 px-3 py-2"
                    >
                      {categories.map((category: Category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={goal.timeHorizon}
                      onChange={e => setEditableGoals(current =>
                        current.map(g =>
                          g.id === goal.id ? { ...g, timeHorizon: e.target.value as Goal['timeHorizon'] } : g
                        )
                      )}
                      className="block w-full rounded-md border border-gray-200 px-3 py-2"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditableGoals(current =>
                          current.map(g =>
                            g.id === goal.id ? { ...g, isEditing: false } : g
                          )
                        )}
                        className="px-3 py-1 text-text-secondary hover:text-text-primary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleGoalSave(goal)}
                        className="btn-primary"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="font-medium">{goal.title}</h3>
                      <p className="text-sm text-text-secondary">{goal.description}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {goal.category} • {goal.timeHorizon.charAt(0).toUpperCase() + goal.timeHorizon.slice(1)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGoalEdit(goal.id)}
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
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings