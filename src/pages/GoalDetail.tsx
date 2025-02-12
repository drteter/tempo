import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoals } from '../contexts/GoalContext'
import CompletionModal from '../components/CompletionModal'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function GoalDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { goals } = useGoals()
  const goal = goals.find(g => g.id === id)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  if (!goal) {
    return <div className="p-4">Goal not found</div>
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const getCompletionForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    if (goal.trackingType === 'boolean') {
      return goal.tracking.completedDates.includes(dateStr)
    } else {
      return goal.tracking.countHistory?.find(h => h.date === dateStr)?.value
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span>Back</span>
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{goal.title}</h1>
        <p className="text-gray-600">{goal.description}</p>
        
        {goal.tracking.target && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Progress</h2>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                {goal.tracking.progress || 0}
                {goal.tracking.target.unit && <span className="ml-1 text-lg">{goal.tracking.target.unit}</span>}
              </div>
              <div className="text-gray-600">
                of {goal.tracking.target.value}
                {goal.tracking.target.unit && <span className="ml-1">{goal.tracking.target.unit}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              ←
            </button>
            <span className="font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2 text-sm font-medium">
              {day}
            </div>
          ))}
          
          {days.map(day => {
            const completion = getCompletionForDate(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                className={`
                  aspect-square p-2 rounded-md text-sm relative
                  ${isCurrentMonth ? 'hover:bg-gray-100' : 'opacity-50'}
                  ${completion ? 'bg-green-100 hover:bg-green-200' : ''}
                `}
              >
                <span className="absolute top-1 left-1">{format(day, 'd')}</span>
                {typeof completion === 'number' && (
                  <span className="absolute bottom-1 right-1 text-xs font-medium">
                    {completion}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <CompletionModal
          isOpen={true}
          onClose={() => setSelectedDate(null)}
          goal={goal}
          date={selectedDate}
        />
      )}
    </div>
  )
} 