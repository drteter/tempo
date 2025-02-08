import { useLiveQuery } from 'dexie-react-hooks'
import { db, initDatabase } from '../services/db'
import type { Goal } from '../contexts/GoalContext'
import type { Habit } from '../contexts/HabitContext'
import { useState, useEffect } from 'react'

export function useDatabase() {
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        await initDatabase()
        if (mounted) {
          setIsInitialized(true)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize database')
          console.error('Database initialization error:', err)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  // Don't try to query the database until it's initialized
  const goals = useLiveQuery(
    async () => isInitialized ? await db.goals.toArray() : [],
    [isInitialized]
  ) || []
  
  const habits = useLiveQuery(
    async () => isInitialized ? await db.habits.toArray() : [],
    [isInitialized]
  ) || []
  
  const categories = useLiveQuery(
    async () => isInitialized ? await db.categories.toArray() : [],
    [isInitialized]
  ) || []

  const weeklySchedules = useLiveQuery(
    async () => isInitialized ? await db.weeklySchedules.toArray() : [],
    [isInitialized]
  ) || []

  // Only allow database operations when initialized
  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    if (!isInitialized) throw new Error('Database not initialized')
    const goalWithId = {
      ...goal,
      id: Math.random().toString(36).substring(2, 15)
    }
    await db.goals.add(goalWithId)
    return goalWithId.id
  }

  const updateGoal = async (goal: Goal) => {
    if (!isInitialized) throw new Error('Database not initialized')
    return await db.goals.put(goal)
  }

  const deleteGoal = async (id: string) => {
    if (!isInitialized) throw new Error('Database not initialized')
    return await db.goals.delete(id)
  }

  const addHabit = async (habit: Omit<Habit, 'id'>) => {
    if (!isInitialized) throw new Error('Database not initialized')
    return await db.habits.add(habit as Habit)
  }

  const updateHabit = async (habit: Habit) => {
    if (!isInitialized) throw new Error('Database not initialized')
    return await db.habits.put(habit)
  }

  const deleteHabit = async (id: string) => {
    if (!isInitialized) throw new Error('Database not initialized')
    return await db.habits.delete(id)
  }

  const setWeekSchedule = async (weekStartDate: string, goalId: string, days: number[]) => {
    if (!isInitialized) throw new Error('Database not initialized')
    const schedule = await db.weeklySchedules.get(weekStartDate)
    if (schedule) {
      schedule.scheduledDays[goalId] = days
      return await db.weeklySchedules.put(schedule)
    } else {
      return await db.weeklySchedules.add({
        weekStartDate,
        scheduledDays: { [goalId]: days }
      })
    }
  }
  return {
    goals,
    habits,
    categories,
    weeklySchedules,
    addGoal,
    updateGoal,
    deleteGoal,
    addHabit,
    updateHabit,
    deleteHabit,
    setWeekSchedule,
    error,
    isInitialized
  }
} 