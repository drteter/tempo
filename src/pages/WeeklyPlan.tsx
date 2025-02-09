import { CalendarIcon, Bars4Icon, TableCellsIcon } from '@heroicons/react/24/outline'
import { useGoals, type Goal, type WeeklySchedule } from '../contexts/GoalContext'
import { useHabits } from '../contexts/HabitContext'
import { useCategories } from '../contexts/CategoryContext'
import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameWeek } from 'date-fns'
import ScheduleGoalsModal, { WEEKDAYS } from '../components/ScheduleGoalsModal'
import WeekSelector from '../components/WeekSelector'

export default function WeeklyPlan() {
  const { 
    goals, 
    updateScheduledDays, 
    toggleRoutineCompletion, 
    processWeekTransition,
    weeklySchedules,
    setWeekSchedule
  } = useGoals()
  const { habits, toggleHabitCompletion, updateHabit } = useHabits()
  const { categories } = useCategories()
  const weeklyGoals = goals.filter(goal => goal.timeHorizon === 'weekly')
  const today = new Date()
  const todayKey = today.toISOString().split('T')[0]
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const [selectedDay, setSelectedDay] = useState<{ index: number, date: Date } | null>(null)
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid')
  const [selectedDate, setSelectedDate] = useState(today)

  // Determine which week we're viewing
  const isLastWeek = isSameWeek(selectedDate, subWeeks(today, 1), { weekStartsOn: 1 })
  const isThisWeek = isSameWeek(selectedDate, today, { weekStartsOn: 1 })
  const isNextWeek = isSameWeek(selectedDate, addWeeks(today, 1), { weekStartsOn: 1 })
  
  // Disable editing for last week
  const isReadOnly = isLastWeek

  useEffect(() => {
    const checkWeekTransition = () => {
      const lastCheck = localStorage.getItem('lastWeekCheck')
      const today = new Date()
      const thisMonday = startOfWeek(today, { weekStartsOn: 1 })
      
      if (!lastCheck || new Date(lastCheck) < thisMonday) {
        processWeekTransition()
        localStorage.setItem('lastWeekCheck', today.toISOString())
      }
    }
    
    checkWeekTransition()
  }, [processWeekTransition])

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

  const getWeekSchedule = () => {
    // For last week, return empty schedule
    if (isLastWeek) {
      return weeklyGoals.map(goal => ({
        ...goal,
        tracking: {
          ...goal.tracking,
          scheduledDays: []
        }
      }))
    }

    // For next week, get from weeklySchedules if exists
    if (isNextWeek) {
      const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }).toISOString().split('T')[0]
      const nextWeekSchedule = weeklySchedules.find((schedule: WeeklySchedule) => 
        schedule.weekStartDate === nextWeekStart
      )
      
      return weeklyGoals.map(goal => ({
        ...goal,
        tracking: {
          ...goal.tracking,
          scheduledDays: nextWeekSchedule?.scheduledDays[goal.id] || []
        }
      }))
    }

    // For current week (isThisWeek), use actual goal schedules
    if (isThisWeek) {
      return weeklyGoals
    }

    // For any other week, return empty schedules
    return weeklyGoals.map(goal => ({
      ...goal,
      tracking: {
        ...goal.tracking,
        scheduledDays: []
      }
    }))
  }

  // Replace the existing weeklyGoals usage with filtered version
  const filteredWeeklyGoals = getWeekSchedule()

  const getDaySchedule = (dayIndex: number) => {
    // Convert Monday-based dayIndex (0-6, Mon-Sun) to date
    const date = addDays(weekStart, dayIndex)
    
    // Get Sunday-based day of week (0-6, Sun-Sat) for habit scheduling
    const dayOfWeek = date.getDay()
    
    const scheduledGoals = filteredWeeklyGoals.filter(goal => 
      goal.tracking.scheduledDays.includes(dayIndex)
    )
    
    // Filter habits using Sunday-based day of week
    const scheduledHabits = habits.filter(habit => 
      habit.scheduledDays.includes(dayOfWeek)
    )

    return {
      goals: scheduledGoals,
      habits: scheduledHabits
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string, type: 'goal' | 'habit') => {
    if (isReadOnly) return
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, dayValue: number) => {
    e.preventDefault()
    if (isReadOnly) return

    try {
      const { id, type } = JSON.parse(e.dataTransfer.getData('text/plain'))
      
      if (type === 'goal') {
        const goal = weeklyGoals.find(g => g.id === id)
        if (!goal) return

        if (isNextWeek) {
          const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }).toISOString().split('T')[0]
          await setWeekSchedule(nextWeekStart, id, [...goal.tracking.scheduledDays, dayValue].sort())
        } else {
          const currentDays = goal.tracking.scheduledDays
          if (!currentDays.includes(dayValue)) {
            const newDays = [...currentDays, dayValue].sort()
            await updateScheduledDays(id, newDays)
          }
        }
      } else if (type === 'habit') {
        const habit = habits.find(h => h.id === id)
        if (!habit) return

        const newScheduledDays = [...habit.scheduledDays]
        if (!newScheduledDays.includes(dayValue)) {
          newScheduledDays.push(dayValue)
          await updateHabit({
            ...habit,
            scheduledDays: newScheduledDays.sort()
          })
        }
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
    }
  }

  const handleRemoveFromDay = (goalId: string, dayValue: number) => {
    if (isReadOnly) return
    const goal = filteredWeeklyGoals.find(g => g.id === goalId)
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
    return filteredWeeklyGoals.every(goal => {
      const { scheduledCount, targetCount } = getSchedulingStatus(goal)
      return scheduledCount >= targetCount
    })
  }

  return (
    <div className="space-y-8">
      {areAllGoalsScheduled() && filteredWeeklyGoals.length > 0 && (
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

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Weekly Plan</h1>
            <p className="text-text-secondary">Plan and track your weekly activities</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <WeekSelector 
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
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
      </div>

      {isNextWeek && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-700">
            Planning mode: Changes made here will take effect next week
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Weekly Goals and Habits Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Available Goals and Habits</h2>
          <div className="space-y-4">
            {weeklyGoals.map(goal => {
              const { scheduledCount, targetCount, isOnTrack } = getSchedulingStatus(goal)
              const categoryIcon = getCategoryIcon(goal.category)
              
              return (
                <div 
                  key={goal.id} 
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, goal.id, 'goal')}
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
            {habits.map(habit => {
              const categoryIcon = getCategoryIcon(habit.category)
              
              return (
                <div 
                  key={habit.id} 
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, habit.id, 'habit')}
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
                      <h3 className="font-medium">{habit.title}</h3>
                      <p className="text-sm text-text-secondary">{habit.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">
                      {habit.scheduledDays.length} days scheduled
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
          <div className="space-y-4">
            {viewType === 'grid' ? (
              <div className="grid grid-cols-7 gap-4">
                {[...Array(7)].map((_, index) => {
                  const date = addDays(weekStart, index)
                  const { goals: dayGoals, habits: dayHabits } = getDaySchedule(index)
                  const dayKey = date.toISOString().split('T')[0]

                  return (
                    <div
                      key={index}
                      className="p-4 border rounded-lg"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <h3 className="font-medium text-sm mb-2">
                        {format(date, 'EEE')}
                      </h3>
                      <div className="space-y-2">
                        {dayHabits.map(habit => {
                          const categoryIcon = getCategoryIcon(habit.category)
                          const isCompleted = habit.completedDates.includes(dayKey)

                          return (
                            <div
                              key={habit.id}
                              className={`flex items-center justify-between p-3 rounded transition-colors ${
                                isCompleted 
                                  ? 'bg-[#10B981] text-white' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {categoryIcon && (
                                  <div 
                                    className={`p-1.5 rounded-lg ${
                                      isCompleted ? 'bg-white/20' : ''
                                    }`}
                                    style={{ backgroundColor: isCompleted ? undefined : `${categoryIcon.color}20` }}
                                  >
                                    <categoryIcon.Icon 
                                      className="h-4 w-4"
                                      style={{ color: isCompleted ? 'white' : categoryIcon.color }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className={`font-medium ${isCompleted ? 'text-white' : 'text-text-primary'}`}>
                                    {habit.title}
                                  </div>
                                  <div className={`text-sm ${isCompleted ? 'text-white/80' : 'text-text-secondary'}`}>
                                    {habit.description}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleHabitCompletion(habit.id, dayKey)}
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                  isCompleted
                                    ? 'bg-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                {isCompleted ? (
                                  <svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                              </button>
                            </div>
                          )
                        })}
                        {dayGoals.map(goal => {
                          const categoryIcon = getCategoryIcon(goal.category)
                          const isCompleted = goal.tracking.completedDates.includes(dayKey)

                          return (
                            <div
                              key={goal.id}
                              className={`flex items-center justify-between p-3 rounded transition-colors ${
                                isCompleted 
                                  ? 'bg-[#10B981] text-white' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {categoryIcon && (
                                  <div 
                                    className={`p-1.5 rounded-lg ${
                                      isCompleted ? 'bg-white/20' : ''
                                    }`}
                                    style={{ backgroundColor: isCompleted ? undefined : `${categoryIcon.color}20` }}
                                  >
                                    <categoryIcon.Icon 
                                      className="h-4 w-4"
                                      style={{ color: isCompleted ? 'white' : categoryIcon.color }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className={`font-medium ${isCompleted ? 'text-white' : 'text-text-primary'}`}>
                                    {goal.title}
                                  </div>
                                  <div className={`text-sm ${isCompleted ? 'text-white/80' : 'text-text-secondary'}`}>
                                    {goal.description}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleRoutineCompletion(goal.id, dayKey)}
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                  isCompleted
                                    ? 'bg-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                {isCompleted ? (
                                  <svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {[...Array(7)].map((_, index) => {
                  const date = addDays(weekStart, index)
                  const { goals: dayGoals, habits: dayHabits } = getDaySchedule(index)
                  const dayKey = date.toISOString().split('T')[0]

                  return (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-medium mb-2">
                        {format(date, 'EEEE')}
                      </h3>
                      <div className="space-y-2">
                        {dayHabits.map(habit => {
                          const categoryIcon = getCategoryIcon(habit.category)
                          const isCompleted = habit.completedDates.includes(dayKey)

                          return (
                            <div
                              key={habit.id}
                              className={`flex items-center justify-between p-3 rounded transition-colors ${
                                isCompleted 
                                  ? 'bg-[#10B981] text-white' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {categoryIcon && (
                                  <div 
                                    className={`p-1.5 rounded-lg ${
                                      isCompleted ? 'bg-white/20' : ''
                                    }`}
                                    style={{ backgroundColor: isCompleted ? undefined : `${categoryIcon.color}20` }}
                                  >
                                    <categoryIcon.Icon 
                                      className="h-4 w-4"
                                      style={{ color: isCompleted ? 'white' : categoryIcon.color }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className={`font-medium ${isCompleted ? 'text-white' : 'text-text-primary'}`}>
                                    {habit.title}
                                  </div>
                                  <div className={`text-sm ${isCompleted ? 'text-white/80' : 'text-text-secondary'}`}>
                                    {habit.description}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleHabitCompletion(habit.id, dayKey)}
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                  isCompleted
                                    ? 'bg-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                {isCompleted ? (
                                  <svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                              </button>
                            </div>
                          )
                        })}
                        {dayGoals.map(goal => {
                          const categoryIcon = getCategoryIcon(goal.category)
                          const isCompleted = goal.tracking.completedDates.includes(dayKey)

                          return (
                            <div
                              key={goal.id}
                              className={`flex items-center justify-between p-3 rounded transition-colors ${
                                isCompleted 
                                  ? 'bg-[#10B981] text-white' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {categoryIcon && (
                                  <div 
                                    className={`p-1.5 rounded-lg ${
                                      isCompleted ? 'bg-white/20' : ''
                                    }`}
                                    style={{ backgroundColor: isCompleted ? undefined : `${categoryIcon.color}20` }}
                                  >
                                    <categoryIcon.Icon 
                                      className="h-4 w-4"
                                      style={{ color: isCompleted ? 'white' : categoryIcon.color }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className={`font-medium ${isCompleted ? 'text-white' : 'text-text-primary'}`}>
                                    {goal.title}
                                  </div>
                                  <div className={`text-sm ${isCompleted ? 'text-white/80' : 'text-text-secondary'}`}>
                                    {goal.description}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleRoutineCompletion(goal.id, dayKey)}
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                  isCompleted
                                    ? 'bg-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                {isCompleted ? (
                                  <svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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