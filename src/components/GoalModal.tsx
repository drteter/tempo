import { Dialog } from '@headlessui/react'
import { useState } from 'react'
import { useGoals } from '../contexts/GoalContext'
import { useCategories } from '../contexts/CategoryContext'

type GoalModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function GoalModal({ isOpen, onClose }: GoalModalProps) {
  const { addGoal } = useGoals()
  const { categories } = useCategories()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: categories[0]?.name || '',
    timeHorizon: 'weekly' as const,
    daysPerWeek: 1
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const goalData = {
      ...formData,
      tracking: {
        scheduledDays: [], // Will be set on Weekly Plan page
        completedDates: []
      }
    }
    
    addGoal(goalData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold mb-4">Create New Goal</Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-md border p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border p-2"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time Horizon</label>
              <select
                value={formData.timeHorizon}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  timeHorizon: e.target.value as typeof formData.timeHorizon 
                }))}
                className="w-full rounded-md border p-2"
              >
                <option value="weekly">Weekly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>

            {formData.timeHorizon === 'weekly' && (
              <div>
                <label className="block text-sm font-medium mb-1">Days per Week</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      daysPerWeek: Math.max(1, prev.daysPerWeek - 1) 
                    }))}
                    className="p-2 rounded-md border"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{formData.daysPerWeek}</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      daysPerWeek: Math.min(7, prev.daysPerWeek + 1) 
                    }))}
                    className="p-2 rounded-md border"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Create Goal
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 