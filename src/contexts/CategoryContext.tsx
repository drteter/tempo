import { createContext, useContext, useState, ReactNode } from 'react'
import {
  HeartIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export type Category = {
  id: string
  name: string
  icon: any
  color: string
  goalCount: number
  habitCount: number
}

type CategoryContextType = {
  categories: Category[]
  addCategory: (category: Omit<Category, 'id' | 'goalCount' | 'habitCount'>) => void
  updateCategory: (category: Category) => void
  deleteCategory: (id: string) => void
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState([
    {
      id: '1',
      name: 'Health',
      icon: HeartIcon,
      color: '#ef4444',
      goalCount: 0,
      habitCount: 0
    },
    {
      id: '2',
      name: 'Career',
      icon: BriefcaseIcon,
      color: '#3b82f6',
      goalCount: 0,
      habitCount: 0
    },
    {
      id: '3',
      name: 'Relationships',
      icon: UserGroupIcon,
      color: '#ec4899',
      goalCount: 0,
      habitCount: 0
    },
    {
      id: '4',
      name: 'Learning',
      icon: AcademicCapIcon,
      color: '#8b5cf6',
      goalCount: 0,
      habitCount: 0
    },
    {
      id: '5',
      name: 'Money',
      icon: CurrencyDollarIcon,
      color: '#10b981',
      goalCount: 0,
      habitCount: 0
    },
    {
      id: '6',
      name: 'Creativity',
      icon: SparklesIcon,
      color: '#f59e0b',
      goalCount: 0,
      habitCount: 0
    }
  ])

  const addCategory = (newCategory: Omit<Category, 'id' | 'goalCount' | 'habitCount'>) => {
    const category: Category = {
      ...newCategory,
      id: Math.random().toString(36).substr(2, 9),
      goalCount: 0,
      habitCount: 0
    }
    setCategories(current => [...current, category])
  }

  const updateCategory = (updatedCategory: Category) => {
    setCategories(current =>
      current.map(category => (category.id === updatedCategory.id ? updatedCategory : category))
    )
  }

  const deleteCategory = (id: string) => {
    setCategories(current => current.filter(category => category.id !== id))
  }

  return (
    <CategoryContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoryContext)
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider')
  }
  return context
} 