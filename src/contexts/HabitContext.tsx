import { createContext, useContext, ReactNode } from 'react'
import { useDatabase } from '../hooks/useDatabase'

export type Habit = {
  id: string
  title: string
  description: string
  frequency: 'daily' | 'weekly'
  category: string
  scheduledDays: number[] // 0-6 for days of week
  completedDates: string[] // ISO date strings of completed dates
}

type HabitContextType = {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, 'id' | 'completedDates'>) => void
  updateHabit: (habit: Habit) => void
  deleteHabit: (id: string) => void
  toggleHabitCompletion: (habitId: string, date: string) => void
}

const HabitContext = createContext<HabitContextType | undefined>(undefined)

export function HabitProvider({ children }: { children: ReactNode }) {
  const { 
    habits, 
    addHabit: dbAddHabit, 
    updateHabit: dbUpdateHabit,
    deleteHabit: dbDeleteHabit 
  } = useDatabase()

  const addHabit = async (newHabit: Omit<Habit, 'id' | 'completedDates'>) => {
    const habit: Omit<Habit, 'id'> = {
      ...newHabit,
      completedDates: []
    }
    await dbAddHabit(habit)
  }

  const toggleHabitCompletion = async (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    const isCompleted = habit.completedDates.includes(date)
    const newCompletedDates = isCompleted
      ? habit.completedDates.filter(d => d !== date)
      : [...habit.completedDates, date]

    await dbUpdateHabit({
      ...habit,
      completedDates: newCompletedDates
    })
  }

  return (
    <HabitContext.Provider value={{ 
      habits, 
      addHabit,
      updateHabit: dbUpdateHabit, 
      deleteHabit: dbDeleteHabit,
      toggleHabitCompletion 
    }}>
      {children}
    </HabitContext.Provider>
  )
}

export const useHabits = () => {
  const context = useContext(HabitContext)
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider')
  }
  return context
} 