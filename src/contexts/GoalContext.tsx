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

export type GoalContextType = {
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>
  updateGoal: (goal: Goal) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  getGoalsByTimeHorizon: (timeHorizon: TimeHorizon) => Goal[]
  toggleRoutineCompletion: (goalId: string, date: string) => void
  updateScheduledDays: (goalId: string, days: number[]) => void
  weeklySchedules: WeeklySchedule[]
  setWeekSchedule: (weekStartDate: string, goalId: string, days: number[]) => void
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
    // If this goal has a parent or is a parent, make sure we preserve history
    const relatedGoals = goals.filter(g => 
      g.id === updatedGoal.parentGoalId || // Parent
      g.parentGoalId === updatedGoal.id    // Children
    )

    // Get the most complete history from all related goals
    let fullHistory = updatedGoal.tracking.countHistory || []
    for (const relatedGoal of relatedGoals) {
      if (relatedGoal.tracking.countHistory?.length) {
        // If related goal has more history entries, use that
        if (relatedGoal.tracking.countHistory.length > fullHistory.length) {
          fullHistory = [...relatedGoal.tracking.countHistory]
        }
      }
    }

    // Update the goal with the complete history
    const goalToUpdate = {
      ...updatedGoal,
      tracking: {
        ...updatedGoal.tracking,
        countHistory: fullHistory,
        progress: fullHistory.reduce((sum, entry) => sum + entry.value, 0)
      }
    }

    await dbUpdateGoal(goalToUpdate)

    // Update all related goals with the same history
    for (const relatedGoal of relatedGoals) {
      await dbUpdateGoal({
        ...relatedGoal,
        tracking: {
          ...relatedGoal.tracking,
          countHistory: fullHistory,
          progress: fullHistory.reduce((sum, entry) => sum + entry.value, 0)
        }
      })
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

  let lastRecalculationTime = 0

  const recalculateAllGoalsProgress = async () => {
    // Don't recalculate if we've done it recently
    const now = Date.now()
    if (lastRecalculationTime && now - lastRecalculationTime < 1000) {
      return
    }
    lastRecalculationTime = now

    console.log('Starting recalculation...')
    
    // First, handle all goals with count history
    for (const goal of goals) {
      if (goal.trackingType === 'count' && goal.tracking.countHistory) {
        const totalProgress = goal.tracking.countHistory.reduce(
          (sum, entry) => sum + entry.value, 
          0
        )

        if (totalProgress !== goal.tracking.progress) {
          await dbUpdateGoal({
            ...goal,
            tracking: {
              ...goal.tracking,
              progress: totalProgress
            }
          })
        }
      }
    }

    // Then, sync histories between related goals
    const goalPairs = goals.reduce((pairs, goal) => {
      if (goal.parentGoalId) {
        const parent = goals.find(g => g.id === goal.parentGoalId)
        if (parent) {
          pairs.push({ child: goal, parent })
        }
      }
      return pairs
    }, [] as { child: Goal, parent: Goal }[])

    console.log('Found goal pairs:', goalPairs.map(pair => ({
      childId: pair.child.id,
      childTitle: pair.child.title,
      parentId: pair.parent.id,
      parentTitle: pair.parent.title
    })))

    // For each pair, ensure their histories match
    for (const { child, parent } of goalPairs) {
      if (child.trackingType === 'count' && child.tracking.countHistory) {
        const history = [...child.tracking.countHistory].sort((a, b) => 
          a.date.localeCompare(b.date)
        )
        const totalProgress = history.reduce((sum, entry) => sum + entry.value, 0)

        // Only update if the histories or progress values are different
        if (JSON.stringify(parent.tracking.countHistory) !== JSON.stringify(history) ||
            parent.tracking.progress !== totalProgress) {
          console.log(`Syncing pair ${child.id} -> ${parent.id}:`, {
            historyLength: history.length,
            totalProgress
          })

          await dbUpdateGoal({
            ...parent,
            tracking: {
              ...parent.tracking,
              countHistory: history,
              progress: totalProgress
            }
          })
        }
      }
    }
  }

  // Add this new function to sync histories
  const syncGoalHistories = async () => {
    console.log('Starting history sync...')
    
    // First, find all goal pairs
    const allPairs = goals.reduce((pairs, goal) => {
      if (goal.parentGoalId) {
        const parent = goals.find(g => g.id === goal.parentGoalId)
        if (parent) {
          pairs.push({ child: goal, parent })
        }
      }
      return pairs
    }, [] as { child: Goal, parent: Goal }[])

    // For each pair, combine their histories
    for (const { child, parent } of allPairs) {
      const childHistory = child.tracking.countHistory || []
      const parentHistory = parent.tracking.countHistory || []

      // Combine histories, removing duplicates
      const combinedHistory = [...childHistory, ...parentHistory]
        .reduce((unique, entry) => {
          const exists = unique.find(e => e.date === entry.date)
          if (!exists) {
            unique.push(entry)
          }
          return unique
        }, [] as typeof childHistory)
        .sort((a, b) => a.date.localeCompare(b.date))

      const totalProgress = combinedHistory.reduce((sum, entry) => sum + entry.value, 0)

      // Update both goals with the combined history
      await dbUpdateGoal({
        ...child,
        tracking: {
          ...child.tracking,
          countHistory: combinedHistory,
          progress: totalProgress
        }
      })

      await dbUpdateGoal({
        ...parent,
        tracking: {
          ...parent.tracking,
          countHistory: combinedHistory,
          progress: totalProgress
        }
      })
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