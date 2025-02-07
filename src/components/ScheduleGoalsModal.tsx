import { Dialog } from '@headlessui/react'
import { useGoals } from '../contexts/GoalContext'

type ScheduleGoalsModalProps = {
  isOpen: boolean
  onClose: () => void
  dayIndex: number
  date: Date
}

// Export this constant so it can be imported in both files
export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' }
]

export default function ScheduleGoalsModal({ isOpen, onClose, dayIndex, date }: ScheduleGoalsModalProps) {
  const { goals, updateScheduledDays } = useGoals()
  const weeklyGoals = goals.filter(goal => goal.timeHorizon === 'weekly')

  const handleToggleGoal = (goalId: string) => {
    const goal = weeklyGoals.find(g => g.id === goalId)
    if (!goal) return

    const currentDays = goal.tracking.scheduledDays
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex].sort()

    updateScheduledDays(goalId, newDays)
  }

  const dayLabel = WEEKDAYS.find(day => day.value === dayIndex)?.label || 'Unknown'

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Schedule Goals for {dayLabel} ({date.toLocaleDateString()})
          </Dialog.Title>

          <div className="space-y-4">
            {weeklyGoals.map(goal => {
              const isScheduled = goal.tracking.scheduledDays.includes(dayIndex)
              return (
                <div 
                  key={goal.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleToggleGoal(goal.id)}
                >
                  <div>
                    <h3 className="font-medium">{goal.title}</h3>
                    <p className="text-sm text-text-secondary">{goal.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    isScheduled 
                      ? 'bg-primary border-primary' 
                      : 'border-gray-300'
                  }`}>
                    {isScheduled && (
                      <svg className="w-full h-full text-white" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 