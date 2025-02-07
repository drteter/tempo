import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'

type WeekSelectorProps = {
  selectedDate: Date
  onChange: (date: Date) => void
}

export default function WeekSelector({ selectedDate, onChange }: WeekSelectorProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Start weeks on Monday
  
  const handlePrevWeek = () => onChange(subWeeks(selectedDate, 1))
  const handleNextWeek = () => onChange(addWeeks(selectedDate, 1))
  
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePrevWeek}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      
      <span className="font-medium">
        Week of {format(weekStart, 'MMM d, yyyy')}
      </span>
      
      <button
        onClick={handleNextWeek}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  )
} 