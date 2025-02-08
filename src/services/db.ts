import Dexie, { Table } from 'dexie'
import type { Goal } from '../contexts/GoalContext'
import type { Habit } from '../contexts/HabitContext'
import type { Category } from '../contexts/CategoryContext'

export class TempoDB extends Dexie {
  goals!: Table<Goal>
  habits!: Table<Habit>
  categories!: Table<Category>
  weeklySchedules!: Table<{
    weekStartDate: string
    scheduledDays: { [goalId: string]: number[] }
  }>

  constructor() {
    super('tempo')
    
    this.version(1).stores({
      goals: 'id, title, category, timeHorizon, status',
      habits: '++id, title, category, frequency',
      categories: '++id, name',
      weeklySchedules: 'weekStartDate'
    })
  }
}

// Create a single instance of the database
const db = new TempoDB()

// Initialize the database
export const initDatabase = async () => {
  try {
    // Ensure we're in a supported context
    if (!indexedDB) {
      throw new Error('IndexedDB is not supported in this environment')
    }
    
    // Just open the database - no need to delete it
    await db.open()
    console.log('Database initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

export { db }
export default db 