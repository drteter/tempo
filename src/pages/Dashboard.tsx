import { useGoals } from '../contexts/GoalContext'
import { useHabits } from '../contexts/HabitContext'
import { useCategories } from '../contexts/CategoryContext'
import type { Habit } from '../contexts/HabitContext'
import CompletionModal from '../components/CompletionModal'
import { useState, useEffect } from 'react'
import AnnualProgressCard from '../components/AnnualProgressCard'
import { useNavigate } from 'react-router-dom'

// Add getCategoryIcon function
const getCategoryIcon = (categoryName: string) => {
  const { categories } = useCategories()
  const category = categories.find(c => c.name === categoryName)
  return category ? {
    Icon: category.icon,
    color: category.color
  } : null
}
function HabitItem({ habit }: { habit: Habit }) {
  const { toggleHabitCompletion } = useHabits()
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  const isCompletedToday = habit.completedDates.includes(todayString)

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
      isCompletedToday 
        ? 'bg-[#10B981] text-white' 
        : 'hover:bg-gray-50'
    }`}>
      <div>
        <h3 className={`font-medium ${isCompletedToday ? 'text-white' : 'text-text-primary'}`}>
          {habit.title}
        </h3>
        <p className={`text-sm ${isCompletedToday ? 'text-white/80' : 'text-text-secondary'}`}>
          {habit.description}
        </p>
      </div>
      <button
        onClick={() => toggleHabitCompletion(habit.id, todayString)}
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          isCompletedToday
            ? 'bg-white'
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        {isCompletedToday ? (
          <svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24">
            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        )}
      </button>
    </div>
  )
}

function GoalItem({ goal, onComplete }: { goal: any, onComplete: (id: string, date: string) => void }) {
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const navigate = useNavigate()
  const { categories } = useCategories()
  const { checkGoalCompletion } = useGoals()
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  const categoryIcon = getCategoryIcon(goal.category)
  
  const isCompletedToday = goal.trackingType === 'count'
    ? checkGoalCompletion(goal, todayString)
    : goal.tracking.completedDates.includes(todayString)

  console.log('Goal completion status:', {
    goalTitle: goal.title,
    trackingType: goal.trackingType,
    todayString,
    isCompletedToday,
    countHistory: goal.tracking.countHistory,
    completedDates: goal.tracking.completedDates
  })

  const formatValue = (value: number, unit: string) => {
    const formatter = new Intl.NumberFormat('en-US')
    return `${formatter.format(value)} ${unit}`
  }

  const getCurrentProgress = (goal: any) => {
    if (goal.trackingType === 'count') {
      return goal.tracking.progress || 0
    }
    return goal.tracking.completedDates?.length || 0
  }

  const handleClick = () => {
    if (goal.trackingType === 'count') {
      setShowCompletionModal(true)
    } else {
      onComplete(goal.id, todayString)
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
          isCompletedToday 
            ? 'bg-[#10B981] text-white' 
            : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-4">
          {categoryIcon && (
            <div 
              className={`p-2 rounded-lg ${
                isCompletedToday 
                  ? 'bg-white/20' 
                  : ''
              }`}
              style={{ backgroundColor: isCompletedToday ? undefined : `${categoryIcon.color}20` }}
            >
              <categoryIcon.Icon 
                className="h-5 w-5"
                style={{ color: isCompletedToday ? 'white' : categoryIcon.color }}
              />
            </div>
          )}
          <div>
            <h3 
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/goals/${goal.id}`)
              }}
              className={`font-medium ${isCompletedToday ? 'text-white' : 'text-text-primary'} cursor-pointer hover:underline`}
            >
              {goal.title}
            </h3>
            <p className={`text-sm ${isCompletedToday ? 'text-white/80' : 'text-text-secondary'}`}>
              {goal.description}
            </p>
            {goal.trackingType === 'count' && goal.tracking.countHistory && (
              <p className={`text-xs mt-1 ${isCompletedToday ? 'text-white/80' : 'text-text-secondary'}`}>
                Progress: {formatValue(getCurrentProgress(goal), goal.tracking.target?.unit || '')}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isCompletedToday
              ? 'bg-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {isCompletedToday ? (
            <svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
          )}
        </button>
      </div>

      {showCompletionModal && (
        <CompletionModal
          isOpen={true}
          onClose={() => setShowCompletionModal(false)}
          goal={goal}
          date={todayString}
        />
      )}
    </>
  )
}

function WeeklyProgressCard() {
  const { goals, checkGoalCompletion } = useGoals()
  const { habits } = useHabits()
  const today = new Date()
  
  const getWeekProgress = () => {
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
    const todayStr = today.toISOString().split('T')[0]
    
    let scheduled = 0
    let completed = 0
    
    // Check each day up to today
    for (let d = new Date(startOfWeek); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1 // Convert to Monday-based

      // Count scheduled habits
      habits.forEach(habit => {
        if (habit.scheduledDays.includes(dayOfWeek)) {
          scheduled++
          if (habit.completedDates.includes(dateStr)) completed++
        }
      })

      // Count scheduled goals
      goals.forEach(goal => {
        if (goal.timeHorizon === 'weekly' && goal.tracking.scheduledDays.includes(dayOfWeek)) {
          scheduled++
          // If trackingType is undefined or 'boolean', check completedDates
          if (!goal.trackingType || goal.trackingType === 'boolean') {
            if (goal.tracking.completedDates.includes(dateStr)) {
              completed++
            }
          } else if (checkGoalCompletion(goal, dateStr)) {
            completed++
          }
        }
      })
    }

    return {
      percentage: scheduled ? Math.round((completed / scheduled) * 100) : 0,
      completed,
      scheduled
    }
  }

  const progress = getWeekProgress()

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">This Week's Progress</h2>
      <div className="space-y-4">
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-[#10B981] transition-all"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-text-secondary">
          Completed {progress.completed} of {progress.scheduled} scheduled activities ({progress.percentage}%)
        </p>
      </div>
    </div>
  )
}

function WeeklyGoalProgress() {
  const { goals, checkGoalCompletion } = useGoals()
  const today = new Date()
  
  const getGoalProgress = (goal: any) => {
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1)
    
    let scheduled = 0
    let completed = 0
    
    for (let d = new Date(startOfWeek); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1

      if (goal.tracking.scheduledDays.includes(dayOfWeek)) {
        scheduled++
        // If trackingType is undefined or 'boolean', check completedDates
        if (!goal.trackingType || goal.trackingType === 'boolean') {
          if (goal.tracking.completedDates.includes(dateStr)) {
            completed++
          }
        } else if (checkGoalCompletion(goal, dateStr)) {
          completed++
        }
      }
    }
    
    return { scheduled, completed }
  }

  const weeklyGoals = goals.filter(goal => goal.timeHorizon === 'weekly')

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Weekly Goals Progress</h2>
      <div className="space-y-4">
        {weeklyGoals.map(goal => {
          const progress = getGoalProgress(goal)
          const percentage = progress.scheduled ? Math.round((progress.completed / progress.scheduled) * 100) : 0
          const categoryIcon = getCategoryIcon(goal.category)

          return (
            <div key={goal.id} className="flex items-center space-x-4">
              {categoryIcon && (
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${categoryIcon.color}20` }}>
                  <categoryIcon.Icon className="h-5 w-5" style={{ color: categoryIcon.color }} />
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium text-text-primary">{goal.title}</h3>
                  <span className="text-sm text-text-secondary">
                    {progress.completed}/{progress.scheduled} ({percentage}%)
                  </span>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-[#10B981] transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Dashboard() {
  const { goals, toggleRoutineCompletion, recalculateAllGoalsProgress } = useGoals()
  const { habits } = useHabits()
  
  // Only recalculate when the component mounts for the first time
  useEffect(() => {
    const lastRecalcTime = localStorage.getItem('lastRecalcTime')
    const now = Date.now()
    
    // Only recalculate if it's been more than 5 minutes since the last recalc
    if (!lastRecalcTime || now - parseInt(lastRecalcTime) > 5 * 60 * 1000) {
      console.log('Dashboard mounted, running recalculation...')
      recalculateAllGoalsProgress()
      localStorage.setItem('lastRecalcTime', now.toString())
    }
  }, []) // Remove recalculateAllGoalsProgress from deps to only run on mount

  // Get today's habits and weekly goals based on scheduled days
  const todaysActivities = () => {
    const today = new Date()
    // Convert Sunday-based (0-6) to Monday-based (1-7)
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
    const todayKey = today.toISOString().split('T')[0]

    const todaysHabits = habits.filter(habit => 
      habit.scheduledDays.includes(dayOfWeek)
    )

    const todaysGoals = goals.filter(goal => 
      goal.timeHorizon === 'weekly' && 
      goal.tracking.scheduledDays.includes(dayOfWeek)
    )

    return {
      habits: todaysHabits,
      goals: todaysGoals.map(goal => ({
        ...goal,
        isCompleted: goal.tracking.completedDates.includes(todayKey)
      }))
    }
  }

  const { habits: todaysHabits, goals: todaysGoals } = todaysActivities()

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Track your progress and stay motivated.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WeeklyProgressCard />
          <WeeklyGoalProgress />
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Today's Activities</h2>
            <div className="space-y-4">
              {todaysHabits.length > 0 || todaysGoals.length > 0 ? (
                <>
                  {todaysHabits.map(habit => (
                    <HabitItem key={habit.id} habit={habit} />
                  ))}
                  {todaysGoals.map(goal => (
                    <GoalItem 
                      key={goal.id} 
                      goal={goal} 
                      onComplete={toggleRoutineCompletion}
                    />
                  ))}
                </>
              ) : (
                <p className="text-text-secondary">No activities scheduled for today.</p>
              )}
            </div>
          </div>
        </div>
        <div className="lg:sticky lg:top-6">
          <AnnualProgressCard />
        </div>
      </div>
    </div>
  )
}

export default Dashboard 