import { createContext, useContext, ReactNode } from 'react'
import { useDatabase } from '../hooks/useDatabase'
import { startOfWeek, subWeeks } from 'date-fns'

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
  weekStartDate: string
  scheduledDays: {
    [goalId: string]: number[]
  }
  completedDates?: {
    [goalId: string]: string[]
  }
}

type GoalProgress = {
  target: number
  current: number
  unit: string
}

export type GoalContextType = {
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>
  updateGoal: (goal: Goal) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  getGoalsByTimeHorizon: (timeHorizon: TimeHorizon) => Goal[]
  toggleRoutineCompletion: (goalId: string, date: string) => void
  updateScheduledDays: (goalId: string, days: number[]) => void
  weeklySchedules: WeeklySchedule[]
  setWeekSchedule: (weekStartDate: string, goalId: string, days: number[]) => Promise<void>
  processWeekTransition: () => void  // Called on app load to handle week transitions
  updateGoalProgress: (goalId: string, amount: number, date: string) => void
  checkGoalCompletion: (goal: Goal, date: string) => boolean
  recalculateAllGoalsProgress: () => Promise<void>
  syncGoalHistories: () => Promise<void>
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
    console.log('🎯 Updating goal:', {
      id: updatedGoal.id,
      title: updatedGoal.title,
      quarterlyValues: updatedGoal.tracking.quarterlyValues
    })

    // For good_enough goals, ensure we preserve quarterly values
    if (updatedGoal.type === 'good_enough') {
      const totalProgress = Object.values(updatedGoal.tracking.quarterlyValues || {}).reduce((sum, val) => sum + val, 0)
      
      const goalToUpdate = {
        ...updatedGoal,
        tracking: {
          ...updatedGoal.tracking,
          progress: totalProgress,
          quarterlyValues: updatedGoal.tracking.quarterlyValues,
          countHistory: Object.entries(updatedGoal.tracking.quarterlyValues || {}).map(([quarter, value]) => ({
            date: quarter.replace(' ', '-'),
            value
          })).sort((a, b) => a.date.localeCompare(b.date))
        }
      }

      console.log('📊 Goal to update:', {
        id: goalToUpdate.id,
        quarterlyValues: goalToUpdate.tracking.quarterlyValues,
        progress: goalToUpdate.tracking.progress,
        countHistory: goalToUpdate.tracking.countHistory
      })

      // Update in database
      await dbUpdateGoal(goalToUpdate)

      // If this is a child goal, update its parent
      if (goalToUpdate.parentGoalId) {
        const parent = goals.find(g => g.id === goalToUpdate.parentGoalId)
        if (parent) {
          const updatedParent = {
            ...parent,
            tracking: {
              ...parent.tracking,
              quarterlyValues: goalToUpdate.tracking.quarterlyValues,
              progress: totalProgress,
              countHistory: goalToUpdate.tracking.countHistory
            }
          }
          await dbUpdateGoal(updatedParent)
        }
      }
    } else {
      await dbUpdateGoal(updatedGoal)
    }
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
    const weeklyGoals = goals.filter(goal => goal.timeHorizon === 'weekly')
    const today = new Date()
    const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })
    const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0]
    
    // Save each goal's schedule separately
    for (const goal of weeklyGoals) {
      if (goal.tracking.scheduledDays.length > 0) {
        await setWeekSchedule(lastWeekStartStr, goal.id, [...goal.tracking.scheduledDays])
      }
    }
    
    // Clear current week's schedule
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
    if (!weeklySchedules) return
    await dbSetWeekSchedule(weekStartDate, goalId, days)
  }

  const updateGoalProgress = async (goalId: string, amount: number, date: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    console.log(`Updating progress for goal ${goalId}:`, {
      amount,
      date,
      isParent: !goal.parentGoalId,
      parentId: goal.parentGoalId,
      timeHorizon: goal.timeHorizon
    })

    // Get existing count history, filtering out the current date if it exists
    const existingHistory = (goal.tracking.countHistory || []).filter(h => h.date !== date)
    
    // Only add new entry if amount is greater than 0
    const newCountHistory = amount > 0
      ? [...existingHistory, { date, value: amount }].sort((a, b) => a.date.localeCompare(b.date))
      : existingHistory

    // Calculate total progress
    const totalProgress = newCountHistory.reduce((sum, entry) => sum + entry.value, 0)
    console.log(`Calculated progress for ${goalId}:`, { totalProgress, historyLength: newCountHistory.length })

    // Check if daily target is met (any amount > 0 counts as completion if no target is set)
    const meetsTarget = goal.tracking.target 
      ? amount >= goal.tracking.target.value 
      : amount > 0

    // Update completedDates based on target
    const newCompletedDates = meetsTarget
      ? [...new Set([...goal.tracking.completedDates, date])].sort()
      : goal.tracking.completedDates.filter(d => d !== date)

    // Find all related goals (parent and children)
    const relatedGoals = [goal]
    if (goal.parentGoalId) {
      const parent = goals.find(g => g.id === goal.parentGoalId)
      if (parent) relatedGoals.push(parent)
    }
    const children = goals.filter(g => g.parentGoalId === goal.id)
    relatedGoals.push(...children)

    // Update all related goals
    for (const relatedGoal of relatedGoals) {
      console.log(`Updating related goal ${relatedGoal.id} (${relatedGoal.timeHorizon})`)
      await dbUpdateGoal({
        ...relatedGoal,
        tracking: {
          ...relatedGoal.tracking, // Preserve existing tracking data
          countHistory: newCountHistory,
          progress: totalProgress,
          completedDates: newCompletedDates
        }
      })
    }

    // Force a recalculation to ensure everything is in sync
    await recalculateAllGoalsProgress()
  }

  const checkGoalCompletion = (goal: Goal, date: string) => {
    if (goal.trackingType === 'boolean') {
      return goal.tracking.completedDates.includes(date)
    }
    
    if (goal.trackingType === 'count') {
      const dailyValue = goal.tracking.countHistory?.find(h => h.date === date)?.value || 0
      // If there's no target, any value > 0 counts as completion
      const meetsTarget = !goal.tracking.target || dailyValue > 0
      console.log('Checking goal completion:', {
        goalTitle: goal.title,
        date,
        dailyValue,
        hasTarget: !!goal.tracking.target,
        targetValue: goal.tracking.target?.value,
        meetsTarget
      })
      return meetsTarget
    }
    
    return false
  }

  const recalculateAllGoalsProgress = async () => {
    console.log('Starting recalculation...')
    
    // First, handle all goals with count history or quarterly values
    for (const goal of goals) {
      if (goal.type === 'good_enough' && goal.tracking.quarterlyValues) {
        const totalProgress = Object.values(goal.tracking.quarterlyValues).reduce((sum, val) => sum + val, 0)
        
        const countHistory = Object.entries(goal.tracking.quarterlyValues).map(([quarter, value]) => ({
          date: quarter.replace(' ', '-'),
          value
        })).sort((a, b) => a.date.localeCompare(b.date))

        await dbUpdateGoal({
          ...goal,
          tracking: {
            ...goal.tracking,
            progress: totalProgress,
            countHistory,
            quarterlyValues: goal.tracking.quarterlyValues
          }
        })
      }
    }
    
    console.log('Recalculation complete')
  }

  // Add this new function to sync histories
  const syncGoalHistories = async () => {
    console.log('🔄 Starting history sync...')
    
    // First, find all goal pairs
    const allPairs = goals.reduce((pairs, goal) => {
      if (goal.parentGoalId) {
        const parent = goals.find(g => g.id === goal.parentGoalId)
        if (parent) {
          console.log(' Found goal pair:', {
            childId: goal.id,
            childTitle: goal.title,
            childProgress: goal.tracking.progress,
            parentId: parent.id,
            parentTitle: parent.title,
            parentProgress: parent.tracking.progress
          })
          pairs.push({ child: goal, parent })
        }
      }
      return pairs
    }, [] as { child: Goal, parent: Goal }[])

    // For each pair, combine their histories
    for (const { child, parent } of allPairs) {
      if (child.type === 'good_enough' && child.tracking.quarterlyValues) {
        // For Good Enough goals, use quarterly values directly
        const history = Object.entries(child.tracking.quarterlyValues).map(([quarter, value]) => ({
          date: quarter.replace(' ', '-'),
          value
        })).sort((a, b) => a.date.localeCompare(b.date))
        
        const totalProgress = Object.values(child.tracking.quarterlyValues).reduce((sum, val) => sum + val, 0)

        console.log('Updating parent with quarterly data:', {
          childId: child.id,
          parentId: parent.id,
          historyLength: history.length,
          totalProgress
        })

        // Update parent with quarterly data
        await dbUpdateGoal({
          ...parent,
          tracking: {
            ...parent.tracking,
            countHistory: history,
            progress: totalProgress,
            quarterlyValues: child.tracking.quarterlyValues
          }
        })
      }
    }

    console.log('History sync complete')
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
        checkGoalCompletion,
        recalculateAllGoalsProgress,
        syncGoalHistories
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