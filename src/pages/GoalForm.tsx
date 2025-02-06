import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoals, type TimeHorizon, type Goal } from '../contexts/GoalContext'
import { useCategories } from '../contexts/CategoryContext'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type FormData = Omit<Goal, 'id' | 'status'> & {
  tracking: {
    startDate?: string
    endDate?: string
    target?: {
      value: number
      unit: string
    }
    routineConfig?: {
      frequency: 'daily' | 'weekly'
      scheduledDays: number[]
      completedDates: string[]
    }
    checkpoints?: {
      id: string
      title: string
      completed: boolean
      dueDate?: string
    }[]
  }
}

export default function GoalForm() {
  const navigate = useNavigate()
  const { addGoal } = useGoals()
  const { categories } = useCategories()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: categories[0]?.name || '',
    timeHorizon: 'weekly',
    tracking: {}
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Add default routineConfig for weekly goals
    if (formData.timeHorizon === 'weekly' && !formData.tracking.routineConfig) {
      formData.tracking.routineConfig = {
        frequency: 'daily',
        scheduledDays: [0, 1, 2, 3, 4, 5, 6],
        completedDates: []
      }
    }

    addGoal(formData)
    navigate('/')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-gray-50"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">New Goal</h1>
          <p className="text-text-secondary">Create a new goal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-primary">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-primary">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-primary">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="timeHorizon" className="block text-sm font-medium text-text-primary">
                Time Horizon
              </label>
              <select
                id="timeHorizon"
                value={formData.timeHorizon}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  timeHorizon: e.target.value as TimeHorizon,
                  tracking: {} // Reset tracking when time horizon changes
                }))}
                className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
                required
              >
                <option value="weekly">Weekly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Tracking Details</h2>
          <div className="space-y-4">
            {formData.timeHorizon !== 'lifetime' && (
              <>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-text-primary">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.tracking.startDate || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      tracking: { ...prev.tracking, startDate: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-text-primary">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={formData.tracking.endDate || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      tracking: { ...prev.tracking, endDate: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="targetValue" className="block text-sm font-medium text-text-primary">
                Target Value (optional)
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  id="targetValue"
                  value={formData.tracking.target?.value || ''}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    tracking: {
                      ...prev.tracking,
                      target: {
                        value: Number(e.target.value),
                        unit: prev.tracking.target?.unit || ''
                      }
                    }
                  }))}
                  className="block w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="e.g., 10"
                />
                <input
                  type="text"
                  value={formData.tracking.target?.unit || ''}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    tracking: {
                      ...prev.tracking,
                      target: {
                        value: prev.tracking.target?.value || 0,
                        unit: e.target.value
                      }
                    }
                  }))}
                  className="block w-32 rounded-md border border-gray-200 px-3 py-2"
                  placeholder="Unit"
                />
              </div>
            </div>

            {formData.timeHorizon === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-text-primary">
                  Frequency
                </label>
                <select
                  value={formData.tracking.routineConfig?.frequency || 'daily'}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    tracking: {
                      ...prev.tracking,
                      routineConfig: {
                        frequency: e.target.value as 'daily' | 'weekly',
                        scheduledDays: prev.tracking.routineConfig?.scheduledDays || [0,1,2,3,4,5,6],
                        completedDates: prev.tracking.routineConfig?.completedDates || []
                      }
                    }
                  }))}
                  className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            Create Goal
          </button>
        </div>
      </form>
    </div>
  )
} 