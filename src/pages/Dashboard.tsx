import { ChartBarIcon, CheckCircleIcon, FlagIcon } from '@heroicons/react/24/outline'
import { useGoals } from '../contexts/GoalContext'
import { useHabits } from '../contexts/HabitContext'
import type { Habit } from '../contexts/HabitContext'

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
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium text-text-primary">{habit.title}</h3>
        <p className="text-sm text-text-secondary">{habit.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
          {habit.category}
        </span>
        <button
          onClick={() => toggleHabitCompletion(habit.id, todayString)}
          className={`p-1 rounded-full ${
            isCompletedToday 
              ? 'bg-success/10 text-success' 
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          <CheckCircleIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}

function GoalItem({ goal, onComplete }: { goal: any, onComplete: (id: string, date: string) => void }) {
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
      <div>
        <h3 className="font-medium">{goal.title}</h3>
        <p className="text-sm text-text-secondary">{goal.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
          {goal.category}
        </span>
        <button
          onClick={() => onComplete(goal.id, todayString)}
          className={`p-1 rounded-full ${
            goal.isCompleted
              ? 'bg-success/10 text-success'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          <CheckCircleIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
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
    const dayOfWeek = today.getDay()
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