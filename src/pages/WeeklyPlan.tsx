import { CalendarIcon, Bars4Icon, TableCellsIcon } from '@heroicons/react/24/outline'
import { useGoals, type Goal } from '../contexts/GoalContext'
import { useCategories } from '../contexts/CategoryContext'
import { useState } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import ScheduleGoalsModal, { WEEKDAYS } from '../components/ScheduleGoalsModal'

export default function WeeklyPlan() {
  const { goals, updateScheduledDays, toggleRoutineCompletion } = useGoals()
  const { categories } = useCategories()
  const weeklyGoals = goals.filter(goal => goal.timeHorizon === 'weekly')
  const today = new Date()
  const todayKey = today.toISOString().split('T')[0]
  const weekStart = startOfWeek(today)
  const [selectedDay, setSelectedDay] = useState<{ index: number, date: Date } | null>(null)
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid')

  const getSchedulingStatus = (goal: Goal) => {
    const scheduledCount = goal.tracking.scheduledDays.length
    const targetCount = goal.daysPerWeek || 0
    const isOnTrack = scheduledCount >= targetCount

    return {
      scheduledCount,
      targetCount,
      isOnTrack
    }
  }

  const getDaySchedule = (dayIndex: number) => {
    return weeklyGoals.filter(goal => 
      goal.tracking.scheduledDays.includes(dayIndex)
    )
  }

  const handleDragStart = (e: React.DragEvent, goalId: string) => {
    e.dataTransfer.setData('goalId', goalId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dayValue: number) => {
    e.preventDefault()
    const goalId = e.dataTransfer.getData('goalId')
    const goal = weeklyGoals.find(g => g.id === goalId)
    if (!goal) return

    const currentDays = goal.tracking.scheduledDays
    if (!currentDays.includes(dayValue)) {
      const newDays = [...currentDays, dayValue].sort()
      updateScheduledDays(goalId, newDays)
    }
  }

  const handleRemoveFromDay = (goalId: string, dayValue: number) => {
    const goal = weeklyGoals.find(g => g.id === goalId)
    if (!goal) return

    const newDays = goal.tracking.scheduledDays.filter(d => d !== dayValue)
    updateScheduledDays(goalId, newDays)
  }

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName)
    return category ? {
      Icon: category.icon,
      color: category.color
    } : null
  }

  const areAllGoalsScheduled = () => {
    return weeklyGoals.every(goal => {
      const { scheduledCount, targetCount } = getSchedulingStatus(goal)
      return scheduledCount >= targetCount
    })
  }

  return (
    <div className="space-y-8">
      {areAllGoalsScheduled() && weeklyGoals.length > 0 && (
        <div className="flex justify-center w-full">
          <div className="flex items-center gap-3 bg-[#10B981] text-white px-6 py-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full">
              <svg className="w-6 h-6 text-[#10B981]" viewBox="0 0 24 24">
                <path 
                  fill="currentColor" 
                  d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" 
                />
              </svg>
            </div>
            <span className="font-bold text-lg">YOU'RE ON THE RIGHT FUCKING TRACK</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Weekly Plan</h1>
            <p className="text-text-secondary">Plan and track your weekly activities</p>
          </div>
        </div>
        <button
          onClick={() => setViewType(prev => prev === 'grid' ? 'list' : 'grid')}
          className="p-2 rounded-lg hover:bg-gray-100"
          title={viewType === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
        >
          {viewType === 'grid' ? (
            <Bars4Icon className="h-6 w-6 text-gray-600" />
          ) : (
            <TableCellsIcon className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Weekly Goals Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Goals for the Week</h2>
          <div className="space-y-4">
            {weeklyGoals.map(goal => {
              const { scheduledCount, targetCount, isOnTrack } = getSchedulingStatus(goal)
              const categoryIcon = getCategoryIcon(goal.category)
              
              return (
                <div 
                  key={goal.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, goal.id)}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-move"
                >
                  <div className="flex items-center gap-4">
                    {categoryIcon && (
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${categoryIcon.color}20` }}
                      >
                        <categoryIcon.Icon 
                          className="h-5 w-5"
                          style={{ color: categoryIcon.color }}
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{goal.title}</h3>
                      <p className="text-sm text-text-secondary">{goal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOnTrack && (
                      <span className="text-xs font-medium text-emerald-600">
                        ON TRACK
                      </span>
                    )}
                    <span className={`text-xs ${isOnTrack ? 'text-emerald-600' : 'text-text-secondary'}`}>
                      {scheduledCount}/{targetCount} scheduled
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Daily Schedule Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Daily Schedule</h2>
          <div className={viewType === 'grid' ? 'grid grid-cols-7 gap-4' : 'space-y-6'}>
            {WEEKDAYS.map(day => {
              const dayDate = addDays(weekStart, day.value)
              const isToday = format(dayDate, 'yyyy-MM-dd') === todayKey
              const scheduledGoals = getDaySchedule(day.value)

              return (
                <div 
                  key={day.value}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day.value)}
                  className={`${
                    viewType === 'grid' 
                      ? 'p-3 min-h-[200px]' 
                      : 'p-4'
                  } rounded-lg ${
                    isToday 
                      ? 'bg-primary/5' 
                      : 'border-2 border-dashed border-gray-200'
                  }`}
                >
                  <h3 className={`font-medium mb-3 ${viewType === 'grid' ? 'text-center' : ''}`}>
                    {day.label}
                  </h3>
                  {scheduledGoals.length > 0 ? (
                    <div className="space-y-2">
                      {scheduledGoals.map(goal => {
                        const isCompleted = goal.tracking.completedDates.includes(format(dayDate, 'yyyy-MM-dd'))
                        const categoryIcon = getCategoryIcon(goal.category)
                        
                        return (
                          <div 
                            key={goal.id} 
                            className={`flex items-center justify-between gap-2 p-2 rounded-lg transition-colors ${
                              isCompleted 
                                ? 'bg-[#10B981] text-white' 
                                : 'bg-white shadow-sm'
                            } ${viewType === 'grid' ? 'text-sm' : ''}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {categoryIcon && (
                                <div 
                                  className={`p-1 rounded-lg ${
                                    isCompleted ? 'bg-white/20' : ''
                                  }`}
                                  style={{ backgroundColor: isCompleted ? undefined : `${categoryIcon.color}20` }}
                                >
                                  <categoryIcon.Icon 
                                    className={`${viewType === 'grid' ? 'h-4 w-4' : 'h-5 w-5'}`}
                                    style={{ color: isCompleted ? 'white' : categoryIcon.color }}
                                  />
                                </div>
                              )}
                              <span className="truncate">{goal.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleRoutineCompletion(goal.id, format(dayDate, 'yyyy-MM-dd'))}
                                className={`flex items-center justify-center ${viewType === 'grid' ? 'w-6 h-6' : 'w-8 h-8'} rounded-full ${
                                  isCompleted
                                    ? 'bg-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                {isCompleted ? (
                                  <svg className={`${viewType === 'grid' ? 'w-4 h-4' : 'w-5 h-5'} text-[#10B981]`} viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                ) : (
                                  <div className={`${viewType === 'grid' ? 'w-4 h-4' : 'w-5 h-5'} rounded-full border-2 border-gray-300`} />
                                )}
                              </button>
                              <button
                                onClick={() => handleRemoveFromDay(goal.id, day.value)}
                                className={`text-gray-400 hover:text-gray-600 flex-shrink-0 ${
                                  isCompleted ? 'text-white/60 hover:text-white' : ''
                                }`}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary text-center py-4">
                      Drop goals here
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selectedDay && (
        <ScheduleGoalsModal
          isOpen={true}
          onClose={() => setSelectedDay(null)}
          dayIndex={selectedDay.index}
          date={selectedDay.date}
        />
      )}
    </div>
  )
} 