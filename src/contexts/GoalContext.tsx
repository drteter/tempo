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
  threshold?: number
  relationship?: '>=' | '<=' | '>' | '<' | '='
  timeframe?: 'quarterly' | 'annual'
  unit?: '' | '$' | '%'
  daysPerWeek?: number
  tracking: {
    scheduledDays: number[]
    completedDates: string[]
    target?: {
      value: number
      unit: string
    }
    progress?: number
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
  updateGoalProgress: (goalId: string, amount: number) => void
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

  const updateGoalProgress = async (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal?.progress) return

    const newProgress = {
      ...goal.progress,
      current: goal.progress.current + amount
    }

    // Update this goal's progress
    await dbUpdateGoal({
      ...goal,
      progress: newProgress
    })

    // If this goal is linked to another goal, update that one too
    if (goal.linkedGoalId) {
      const parentGoal = goals.find(g => g.id === goal.linkedGoalId)
      if (parentGoal?.progress) {
        await updateGoalProgress(parentGoal.id, amount)
      }
    }
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
        updateGoalProgress
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