import { Dialog } from '@headlessui/react'
import { useState, useEffect } from 'react'
import { useGoals, type Goal } from '../contexts/GoalContext'

type CompletionModalProps = {
  isOpen: boolean
  onClose: () => void
  goal: Goal
  date: string
}

export default function CompletionModal({ isOpen, onClose, goal, date }: CompletionModalProps) {
  const { updateGoal, updateGoalProgress, recalculateAllGoalsProgress } = useGoals()
  const [value, setValue] = useState('')

  // Get existing value when modal opens or when date/goal changes
  useEffect(() => {
    if (isOpen) {
      const existingValue = goal.tracking.countHistory?.find(h => h.date === date)?.value
      if (existingValue) {
        setValue(existingValue.toString())
      } else {
        setValue('')
      }
    }
  }, [isOpen, date, goal.id]) // Only depend on isOpen, date, and goal.id instead of the entire goal object

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericValue = parseFloat(value)
    
    if (isNaN(numericValue)) return

    try {
      await updateGoalProgress(goal.id, numericValue, date)
      await recalculateAllGoalsProgress()
      setValue('')
      onClose()
    } catch (error) {
      console.error('Error updating goal progress:', error)
    }
  }

  const handleDelete = async () => {
    await updateGoalProgress(goal.id, 0, date)
    await recalculateAllGoalsProgress()
    onClose()
    setValue('')
  }

  const existingEntry = goal.tracking.countHistory?.find(h => h.date === date)

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {existingEntry ? 'Edit Progress for' : 'Record Progress for'} {goal.title}
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                How many {goal.tracking.target?.unit || 'units'}?
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="w-full rounded-md border p-2"
                  placeholder={`Enter ${goal.tracking.target?.unit || 'value'}`}
                  required
                  step="any"
                />
                {goal.tracking.target?.unit && (
                  <span className="flex items-center px-3 bg-gray-100 rounded-md">
                    {goal.tracking.target.unit}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Delete Entry
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Save Progress
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 