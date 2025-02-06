import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHabits } from '../contexts/HabitContext'
import { useCategories } from '../contexts/CategoryContext'

type FormData = {
  title: string
  description: string
  frequency: 'daily' | 'weekly'
  category: string
  scheduledDays: number[]
}

function HabitForm() {
  const navigate = useNavigate()
  const { addHabit } = useHabits()
  const { categories } = useCategories()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    frequency: 'daily',
    category: '',
    scheduledDays: []
  })

  const weekDays = [
    { value: 7, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ]

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      scheduledDays: prev.scheduledDays.includes(day)
        ? prev.scheduledDays.filter(d => d !== day)
        : [...prev.scheduledDays, day]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addHabit(formData)
    navigate('/habits')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Create New Habit</h1>
        <p className="text-text-secondary mt-1">Set up a new habit to track.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary">Title</label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Description</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Category</label>
          <select
            required
            className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2"
            value={formData.category}
            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Scheduled Days</label>
          <div className="flex flex-wrap gap-2">
            {weekDays.map(day => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleDayToggle(day.value)}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.scheduledDays.includes(day.value)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => navigate('/habits')}
          className="px-4 py-2 text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Create Habit
        </button>
      </div>
    </form>
  )
}

export default HabitForm 