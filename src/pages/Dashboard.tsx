import { ChartBarIcon, CheckCircleIcon, FlagIcon } from '@heroicons/react/24/outline'
import { useGoals } from '../contexts/GoalContext'
import { useHabits } from '../contexts/HabitContext'
import { useCategories } from '../contexts/CategoryContext'
import type { Habit } from '../contexts/HabitContext'
import CompletionModal from '../components/CompletionModal'
import { useState } from 'react'

// Add getCategoryIcon function
const getCategoryIcon = (categoryName: string) => {
  const { categories } = useCategories()
  const category = categories.find(c => c.name === categoryName)
  return category ? {
    Icon: category.icon,
    color: category.color
  } : null
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-semibold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
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
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  const categoryIcon = getCategoryIcon(goal.category)
  const isCompletedToday = goal.tracking.completedDates.includes(todayString)

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
            <h3 className={`font-medium ${isCompletedToday ? 'text-white' : 'text-text-primary'}`}>
              {goal.title}
            </h3>
            <p className={`text-sm ${isCompletedToday ? 'text-white/80' : 'text-text-secondary'}`}>
              {goal.description}
            </p>
            {goal.trackingType === 'count' && goal.tracking.countHistory && (
              <p className={`text-xs mt-1 ${isCompletedToday ? 'text-white/80' : 'text-text-secondary'}`}>
                Progress: {goal.tracking.progress || 0} {goal.tracking.target?.unit}
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

function Dashboard() {
  const { goals, toggleRoutineCompletion } = useGoals()
  const { habits } = useHabits()
  
  // Calculate real statistics
  const activeGoals = goals.filter(goal => goal.status === 'in_progress').length
  const completedGoals = goals.filter(goal => goal.status === 'completed').length
  
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
  
  // Calculate weekly progress (example metric)
  const calculateWeeklyProgress = () => {
    const totalGoals = goals.length
    if (totalGoals === 0) return '0%'
    const completedPercentage = (completedGoals / totalGoals) * 100
    return `${Math.round(completedPercentage)}%`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Track your progress and stay motivated.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={FlagIcon}
          label="Active Goals"
          value={activeGoals.toString()}
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Completed Goals"
          value={completedGoals.toString()}
        />
        <StatCard
          icon={ChartBarIcon}
          label="Weekly Progress"
          value={calculateWeeklyProgress()}
        />
      </div>
      
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
  )
}

export default Dashboard 