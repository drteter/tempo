import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { useHabits } from '../contexts/HabitContext'
import type { Habit } from '../contexts/HabitContext'

function HabitCard({ habit }: { habit: Habit }) {
  const { toggleHabitCompletion } = useHabits()
  const today = new Date()
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const isDateCompleted = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0]
    return habit.completedDates.includes(dateString)
  }

  const handleToggleCompletion = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    toggleHabitCompletion(habit.id, dateString)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClockIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{habit.title}</h3>
            <p className="text-sm text-text-secondary">{habit.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
            {habit.category}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          {weekDays.map((day) => {
            const isCompleted = isDateCompleted(day)
            const isScheduled = habit.scheduledDays.includes(day.getDay())

            return (
              <div key={day.toString()} className="flex flex-col items-center">
                <span className="text-xs text-text-secondary mb-2">
                  {format(day, 'EEE')}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleCompletion(day)}
                  disabled={!isScheduled}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isScheduled
                      ? isCompleted
                        ? 'bg-success/10 border-success text-success'
                        : 'border-gray-200 hover:border-success/50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  <CheckCircleIcon 
                    className={`h-5 w-5 ${
                      isCompleted 
                        ? 'text-success' 
                        : isScheduled 
                          ? 'text-gray-300' 
                          : 'text-gray-200'
                    }`} 
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Habits() {
  const { habits } = useHabits()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Habits</h1>
        <p className="text-text-secondary mt-1">Build and track your daily habits.</p>
      </div>

      <div className="space-y-4">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </div>
    </div>
  )
}

export default Habits 