import { createContext, useContext, useState, ReactNode } from 'react'

export type TimeHorizon = 'weekly' | 'quarterly' | 'annual' | 'lifetime'

export type Goal = {
  id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'archived'
  category: string
  timeHorizon: TimeHorizon
  tracking: {
    startDate?: string // ISO date string
    endDate?: string // ISO date string for weekly/quarterly/annual goals
    target?: {
      value: number
      unit: string
    }
    progress?: number // 0-100 for percentage goals, or actual value for countable goals
    checkpoints?: {
      id: string
      title: string
      completed: boolean
      dueDate?: string // ISO date string
    }[]
    routineConfig?: { // For weekly goals that are routine-based
      frequency: 'daily' | 'weekly'
      scheduledDays: number[] // 0-6 for days of week
      completedDates: string[] // ISO date strings
    }
  }
}

type GoalContextType = {
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id' | 'status'>) => void
  updateGoal: (goal: Goal) => void
  deleteGoal: (id: string) => void
  getGoalsByTimeHorizon: (timeHorizon: TimeHorizon) => Goal[]
  toggleRoutineCompletion: (goalId: string, date: string) => void
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
        startDate: '2024-01-01',
        endDate: '2024-12-31',
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
      tracking: {
        routineConfig: {
          frequency: 'daily',
          scheduledDays: [0, 1, 2, 3, 4, 5, 6],
          completedDates: []
        }
      }
    }
  ])

  const addGoal = (newGoal: Omit<Goal, 'id' | 'status'>) => {
    const goal: Goal = {
      ...newGoal,
      id: Math.random().toString(36).substr(2, 9),
      status: 'not_started'
    }
    setGoals(current => [...current, goal])
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
        if (goal.id === goalId && goal.tracking.routineConfig) {
          const completedDates = goal.tracking.routineConfig.completedDates
          const isCompleted = completedDates.includes(date)
          return {
            ...goal,
            tracking: {
              ...goal.tracking,
              routineConfig: {
                ...goal.tracking.routineConfig,
                completedDates: isCompleted
                  ? completedDates.filter(d => d !== date)
                  : [...completedDates, date]
              }
            }
          }
        }
        return goal
      })
    )
  }

  return (
    <GoalContext.Provider 
      value={{ 
        goals, 
        addGoal, 
        updateGoal, 
        deleteGoal, 
        getGoalsByTimeHorizon,
        toggleRoutineCompletion 
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