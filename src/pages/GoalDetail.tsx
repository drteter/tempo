import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Goal, useGoals } from '../contexts/GoalContext'
import CompletionModal from '../components/CompletionModal'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, differenceInDays } from 'date-fns'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import MonthlyProgressChart from '../components/MonthlyProgressChart'

// Add calculateProjection function
const calculateProjection = (goal: Goal) => {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const endOfYear = new Date(now.getFullYear(), 11, 31)
  
  const daysPassed = differenceInDays(now, startOfYear)
  const totalDays = differenceInDays(endOfYear, startOfYear)
  const percentOfYearPassed = daysPassed / totalDays

  if (goal.trackingType === 'count') {
    const currentProgress = goal.tracking.progress || 0
    const target = goal.tracking.target?.value || 0
    const projectedValue = (currentProgress / percentOfYearPassed) || 0
    const percentComplete = (currentProgress / target) * 100
    const projectedPercent = (projectedValue / target) * 100

    return {
      percentComplete: percentComplete,
      projectedPercent: projectedPercent,
      currentValue: currentProgress,
      projectedValue: Math.round(projectedValue),
      target,
      unit: goal.tracking.target?.unit || ''
    }
  }

  // For boolean goals, use completion dates count
  const completions = goal.tracking.completedDates?.length || 0
  const projectedCompletions = (completions / percentOfYearPassed) || 0
  const target = goal.daysPerWeek ? goal.daysPerWeek * 52 : 365 // Default to daily if no daysPerWeek
  
  return {
    percentComplete: (completions / target) * 100,
    projectedPercent: (projectedCompletions / target) * 100,
    currentValue: completions,
    projectedValue: Math.round(projectedCompletions),
    target,
    unit: 'times'
  }
}

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

  // Find all weekly goals that are linked to this annual/lifetime goal
  const linkedWeeklyGoals = goals.filter(g => 
    g.timeHorizon === 'weekly' && g.parentGoalId === goal.id
  )

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

  const renderWeeklyView = () => {
    return (
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
    )
  }

  const renderAnnualView = () => {
    const {
      percentComplete,
      projectedPercent,
      currentValue,
      projectedValue,
      target,
      unit
    } = calculateProjection(goal)

    const isOverachieving = percentComplete > 100 || projectedPercent > 100
    const formatter = new Intl.NumberFormat('en-US')

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Progress Overview</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between mb-2">
              <div className="text-3xl font-bold">
                {formatter.format(currentValue)}
                <span className="ml-1 text-lg">{unit}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Target</div>
                <div className="font-semibold">{formatter.format(target)} {unit}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-4 bg-gray-200 rounded-full mt-4 overflow-hidden">
              <div 
                className={`absolute h-full bg-primary rounded-full transition-all duration-1000
                  ${isOverachieving ? 'animate-pulse-strong' : ''}`}
                style={{ width: `${Math.min(percentComplete, 100)}%` }}
              />
              {projectedPercent > percentComplete && (
                <div 
                  className={`absolute h-full bg-primary/30 rounded-full transition-all duration-1000
                    ${isOverachieving ? 'animate-pulse-strong' : ''}`}
                  style={{ 
                    width: `${Math.min(projectedPercent - percentComplete, 100 - percentComplete)}%`,
                    left: `${Math.min(percentComplete, 100)}%`
                  }}
                />
              )}
            </div>
            
            <div className="flex justify-between mt-2 text-sm">
              <div>{formatter.format(Math.round(percentComplete))}% complete</div>
              <div className="text-gray-600">
                Projected: {formatter.format(Math.round(projectedPercent))}%
                {projectedPercent > 100 && ' (Exceeding Target!)'}
              </div>
            </div>
          </div>
        </div>

        {linkedWeeklyGoals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Contributing Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkedWeeklyGoals.map(weeklyGoal => {
                const weeklyContribution = weeklyGoal.tracking.progress || 0
                const contributionPercent = (weeklyContribution / currentValue) * 100

                return (
                  <div 
                    key={weeklyGoal.id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <h3 
                      onClick={() => navigate(`/goals/${weeklyGoal.id}`)}
                      className="font-medium cursor-pointer hover:underline"
                    >
                      {weeklyGoal.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{weeklyGoal.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{formatter.format(weeklyContribution)} {unit}</span>
                        <span className="text-gray-600">{formatter.format(Math.round(contributionPercent))}% of total</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${contributionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Progress</h2>
          <MonthlyProgressChart goal={goal} />
        </div>
      </div>
    )
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
      </div>

      {goal.timeHorizon === 'weekly' ? renderWeeklyView() : renderAnnualView()}

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

function calculateCompletionRate(goal: Goal) {
  const today = new Date()
  const last4WeeksCompletions = goal.tracking.completedDates.filter(date => {
    const completionDate = new Date(date)
    const daysDiff = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 28 // 4 weeks
  })

  const targetCompletions = goal.daysPerWeek * 4 // target for 4 weeks
  return Math.round((last4WeeksCompletions.length / targetCompletions) * 100)
} 