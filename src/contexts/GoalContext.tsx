import { createContext, useContext, useState, ReactNode } from 'react'
import { startOfWeek, subWeeks } from 'date-fns'

export type TimeHorizon = 'weekly' | 'quarterly' | 'annual' | 'lifetime'

export type Goal = {
  id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'archived'
  category: string
  timeHorizon: TimeHorizon
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
  }
}

export type WeeklySchedule = {
  weekStartDate: string  // ISO date string of week start
  scheduledDays: {
    [goalId: string]: number[]  // Maps goal IDs to their scheduled days
  }
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
}

const GoalContext = createContext<GoalContextType | undefined>(undefined)

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Run a Marathon',
      description: 'Train and complete a full marathon',
      status: 'in_progress',
      category: 'Health',
      timeHorizon: 'annual',
      tracking: {
        scheduledDays: [],
        completedDates: [],
        checkpoints: [
          {
            id: '1',
            title: 'Run 5K without stopping',
            completed: true,
            dueDate: '2024-03-31'
          },
          {
            id: '2',
            title: 'Complete first half marathon',
            completed: false,
            dueDate: '2024-08-31'
          }
        ]
      }
    },
    {
      id: '2',
      title: 'Daily Reading Habit',
      description: 'Read for at least 30 minutes every day',
      status: 'in_progress',
      category: 'Learning',
      timeHorizon: 'weekly',
      daysPerWeek: 5,
      tracking: {
        scheduledDays: [1, 2, 3, 4, 5], // Mon-Fri
        completedDates: []
      }
    }
  ])
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>([])

  const addGoal = (newGoal: Omit<Goal, 'id' | 'status'>) => {
    const goal: Goal = {
      ...newGoal,
      id: Math.random().toString(36).substr(2, 9),
      status: 'not_started',
      tracking: {
        ...newGoal.tracking,
        scheduledDays: newGoal.tracking.scheduledDays || [],
        completedDates: []
      }
    }
    setGoals(current => [...current, goal])
  }

  const updateScheduledDays = (goalId: string, days: number[]) => {
    setGoals(current =>
      current.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              tracking: {
                ...goal.tracking,
                scheduledDays: days
              }
            }
          : goal
      )
    )
  }

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(current =>
      current.map(goal => (goal.id === updatedGoal.id ? updatedGoal : goal))
    )
  }

  const deleteGoal = (id: string) => {
    setGoals(current => current.filter(goal => goal.id !== id))
  }

  const getGoalsByTimeHorizon = (timeHorizon: TimeHorizon) => {
    return goals.filter(goal => goal.timeHorizon === timeHorizon)
  }

  const toggleRoutineCompletion = (goalId: string, date: string) => {
    setGoals(current =>
      current.map(goal => {
        if (goal.id === goalId && goal.tracking.scheduledDays.length > 0) {
          const completedDates = goal.tracking.completedDates
          const isCompleted = completedDates.includes(date)
          return {
            ...goal,
            tracking: {
              ...goal.tracking,
              completedDates: isCompleted
                ? completedDates.filter(d => d !== date)
                : [...completedDates, date]
            }
          }
        }
        return goal
      })
    )
  }

  const processWeekTransition = () => {
    const today = new Date()
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString().split('T')[0]
    const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }).toISOString().split('T')[0]

    const thisWeekSchedule = weeklySchedules.find(s => s.weekStartDate === thisWeekStart)
    if (thisWeekSchedule) {
      setWeeklySchedules(current => [
        ...current.filter(s => s.weekStartDate !== lastWeekStart),
        { weekStartDate: lastWeekStart, scheduledDays: thisWeekSchedule.scheduledDays }
      ])
    }
  }

  const setWeekSchedule = (weekStartDate: string, goalId: string, days: number[]) => {
    setWeeklySchedules(current => {
      const existingSchedule = current.find(s => s.weekStartDate === weekStartDate)
      if (existingSchedule) {
        return current.map(schedule => 
          schedule.weekStartDate === weekStartDate
            ? {
                ...schedule,
                scheduledDays: { ...schedule.scheduledDays, [goalId]: days }
              }
            : schedule
        )
      }
      return [...current, {
        weekStartDate,
        scheduledDays: { [goalId]: days }
      }]
    })
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
        processWeekTransition
      }}
    >
      {children}
    </GoalContext.Provider>
  )
}

export function useGoals() {
  const context = useContext(GoalContext)
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider')
  }
  return context
} 