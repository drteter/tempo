import { createContext, useContext, ReactNode } from 'react'
import { useDatabase } from '../hooks/useDatabase'

export type TimeHorizon = 'weekly' | 'quarterly' | 'annual' | 'lifetime' | 'ongoing'

export type Goal = {
  id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'archived'
  category: string
  timeHorizon: TimeHorizon
  type?: 'good_enough'
  trackingType: 'boolean' | 'count'
  threshold?: number
  relationship?: '>=' | '<=' | '>' | '<' | '='
  timeframe?: 'quarterly' | 'annual'
  unit?: '' | '$' | '%' | 'miles' | 'words' | 'minutes'
  daysPerWeek?: number
  tracking: {
    scheduledDays: number[]
    completedDates: string[]
    target?: {
      value: number
      unit: string
    }
    progress?: number
    countHistory?: {
      date: string
      value: number
    }[]
    checkpoints?: {
      id: string
      title: string
      completed: boolean
      dueDate?: string
    }[]
    quarterlyValues?: {
      [key: string]: number  // Format: "Q1 2023": 75, "Q2 2023": 80, etc.
    }
  }
  linkedGoalId?: string    // Reference to parent goal
  progress?: GoalProgress  // For goals that need numerical tracking
  parentGoalId?: string  // Reference to parent annual/lifetime goal
}

export type WeeklySchedule = {
  weekStartDate: string  // ISO date string of week start
  scheduledDays: {
    [goalId: string]: number[]  // Maps goal IDs to their scheduled days
  }
}

type GoalProgress = {
  target: number
  current: number
  unit: string
}

type GoalContextType = {
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id' | 'status'>) => void
  updateGoal: (goal: Goal) => void
  deleteGoal: (id: string) => void
  getGoalsByTimeHorizon: (timeHorizon: TimeHorizon) => Goal[]
  toggleRoutineCompletion: (goalId: string, date: string) => void
  updateScheduledDays: (goalId: string, days: number[]) => void
  weeklySchedules: WeeklySchedule[]
  setWeekSchedule: (weekStartDate: string, goalId: string, days: number[]) => void
  processWeekTransition: () => void  // Called on app load to handle week transitions
  updateGoalProgress: (goalId: string, amount: number, date: string) => void
  checkGoalCompletion: (goal: Goal, date: string) => boolean
}

export const GoalContext = createContext<GoalContextType | undefined>(undefined)

export function GoalProvider({ children }: { children: ReactNode }) {
  const { 
    goals, 
    addGoal: dbAddGoal, 
    updateGoal: dbUpdateGoal,
    deleteGoal: dbDeleteGoal,
    weeklySchedules,
    setWeekSchedule: dbSetWeekSchedule
  } = useDatabase()

  const addGoal = async (newGoal: Omit<Goal, 'id' | 'status'>) => {
    const goal: Omit<Goal, 'id'> = {
      ...newGoal,
      status: 'not_started' as const,
      tracking: {
        ...newGoal.tracking,
        scheduledDays: newGoal.tracking.scheduledDays || [],
        completedDates: []
      }
    }
    await dbAddGoal(goal)
  }

  const updateScheduledDays = async (goalId: string, days: number[]) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    await dbUpdateGoal({
      ...goal,
      tracking: {
        ...goal.tracking,
        scheduledDays: days
      }
    })
  }

  const updateGoal = async (updatedGoal: Goal) => {
    await dbUpdateGoal(updatedGoal)
  }

  const deleteGoal = async (id: string) => {
    await dbDeleteGoal(id)
  }

  const getGoalsByTimeHorizon = (timeHorizon: TimeHorizon) => {
    return goals.filter(goal => goal.timeHorizon === timeHorizon)
  }

  const toggleRoutineCompletion = async (goalId: string, date: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    const isCompleted = goal.tracking.completedDates.includes(date)
    const newCompletedDates = isCompleted
      ? goal.tracking.completedDates.filter(d => d !== date)
      : [...goal.tracking.completedDates, date].sort()

    const updatedGoal = {
      ...goal,
      tracking: {
        ...goal.tracking,
        completedDates: newCompletedDates
      }
    }

    // Just update the goal in the database
    // The useDatabase hook should handle state updates automatically
    await dbUpdateGoal(updatedGoal)
  }

  const processWeekTransition = async () => {
    // Move last week's schedule to history and reset current week
    const weeklyGoals = goals.filter(goal => goal.timeHorizon === 'weekly')
    
    for (const goal of weeklyGoals) {
      await dbUpdateGoal({
        ...goal,
        tracking: {
          ...goal.tracking,
          scheduledDays: []
        }
      })
    }
  }

  const setWeekSchedule = async (weekStartDate: string, goalId: string, days: number[]) => {
    await dbSetWeekSchedule(weekStartDate, goalId, days)
  }

  const updateGoalProgress = async (goalId: string, amount: number, date: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    // Get existing count history
    const newCountHistory = [
      ...(goal.tracking.countHistory || []).filter(h => h.date !== date),
      { date, value: amount }
    ]

    // Calculate total progress
    const totalProgress = newCountHistory.reduce((sum, entry) => sum + entry.value, 0)

    // Check if daily target is met
    const meetsTarget = goal.tracking.target ? amount >= goal.tracking.target.value : true
    
    // Update completedDates based on target
    const newCompletedDates = meetsTarget
      ? [...new Set([...goal.tracking.completedDates, date])].sort()
      : goal.tracking.completedDates.filter(d => d !== date)

    // Update the goal with all changes
    await dbUpdateGoal({
      ...goal,
      tracking: {
        ...goal.tracking,
        countHistory: newCountHistory,
        progress: totalProgress,
        completedDates: newCompletedDates
      }
    })

    // If this goal is linked to another goal, update that one too
    if (goal.linkedGoalId) {
      const parentGoal = goals.find(g => g.id === goal.linkedGoalId)
      if (parentGoal) {
        await updateGoalProgress(parentGoal.id, amount, date)
      }
    }
  }

  const checkGoalCompletion = (goal: Goal, date: string) => {
    if (goal.trackingType === 'boolean') {
      return goal.tracking.completedDates.includes(date)
    }
    
    if (goal.trackingType === 'count') {
      const dailyValue = goal.tracking.countHistory?.find(h => h.date === date)?.value || 0
      return goal.tracking.target ? dailyValue >= goal.tracking.target.value : dailyValue > 0
    }
    
    return false
  }

  return (
    <GoalContext.Provider 
      value={{ 
        goals, 
        addGoal, 
        updateGoal, 
        deleteGoal, 
        getGoalsByTimeHorizon,
        toggleRoutineCompletion,
        updateScheduledDays,
        weeklySchedules,
        setWeekSchedule,
        processWeekTransition,
        updateGoalProgress,
        checkGoalCompletion
      }}
    >
      {children}
    </GoalContext.Provider>
  )
}

export const useGoals = () => {
  const context = useContext(GoalContext)
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider')
  }
  return context
} 