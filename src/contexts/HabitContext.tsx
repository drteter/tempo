import { createContext, useContext, useState, ReactNode } from 'react'

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
  const [habits, setHabits] = useState<Habit[]>([])

  const addHabit = (newHabit: Omit<Habit, 'id' | 'completedDates'>) => {
    const habit: Habit = {
      ...newHabit,
      id: Math.random().toString(36).substr(2, 9),
      completedDates: []
    }
    setHabits(current => [...current, habit])
  }

  const updateHabit = (updatedHabit: Habit) => {
    setHabits(current =>
      current.map(habit => (habit.id === updatedHabit.id ? updatedHabit : habit))
    )
  }

  const deleteHabit = (id: string) => {
    setHabits(current => current.filter(habit => habit.id !== id))
  }

  const toggleHabitCompletion = (habitId: string, date: string) => {
    setHabits(current =>
      current.map(habit => {
        if (habit.id === habitId) {
          const isCompleted = habit.completedDates.includes(date)
          return {
            ...habit,
            completedDates: isCompleted
              ? habit.completedDates.filter(d => d !== date)
              : [...habit.completedDates, date]
          }
        }
        return habit
      })
    )
  }

  return (
    <HabitContext.Provider value={{ habits, addHabit, updateHabit, deleteHabit, toggleHabitCompletion }}>
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