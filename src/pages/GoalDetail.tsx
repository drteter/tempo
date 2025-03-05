import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Goal, useGoals } from '../contexts/GoalContext'
import CompletionModal from '../components/CompletionModal'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, subWeeks } from 'date-fns'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import MonthlyProgressChart from '../components/MonthlyProgressChart'

// Add calculateProjection function
const calculateProjection = (goal: Goal) => {
  
  // For lifetime goals with quarterly values
  if (goal.timeHorizon === 'lifetime' && goal.type === 'good_enough') {
    const currentProgress = Object.values(goal.tracking.quarterlyValues || {}).reduce((sum, val) => sum + val, 0)
    const target = goal.tracking.target?.value || 0
    const percentComplete = (currentProgress / target) * 100

    return {
      percentComplete,
      currentValue: currentProgress,
      target,
      unit: goal.unit || ''
    }
  }

  // For lifetime goals, we don't need projections - just show total progress
  if (goal.timeHorizon === 'lifetime') {
    if (goal.trackingType === 'count') {
      const currentProgress = goal.tracking.progress || 0
      const target = goal.tracking.target?.value || 0
      const percentComplete = (currentProgress / target) * 100

      return {
        percentComplete,
        currentValue: currentProgress,
        target,
        unit: goal.tracking.target?.unit || ''
      }
    }

    // For boolean goals
    const completions = goal.tracking.completedDates?.length || 0
    const target = goal.daysPerWeek ? goal.daysPerWeek * 52 : 365
    
    return {
      percentComplete: (completions / target) * 100,
      currentValue: completions,
      target,
      unit: 'times'
    }
  }

  // For non-lifetime goals
  if (goal.trackingType === 'count') {
    const currentProgress = goal.tracking.progress || 0
    const target = goal.tracking.target?.value || 0
    const percentComplete = (currentProgress / target) * 100

    return {
      percentComplete,
      currentValue: currentProgress,
      target,
      unit: goal.tracking.target?.unit || ''
    }
  }

  // For boolean goals, use completion dates count
  const completions = goal.tracking.completedDates?.length || 0
  const target = goal.daysPerWeek ? goal.daysPerWeek * 52 : 365 // Default to daily if no daysPerWeek
  
  return {
    percentComplete: (completions / target) * 100,
    currentValue: completions,
    target,
    unit: 'times'
  }
}

export default function GoalDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { goals, updateGoal } = useGoals()
  const goal = goals.find(g => g.id === id)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isAddingHistorical, setIsAddingHistorical] = useState(false)
  const [historicalValue, setHistoricalValue] = useState('')
  const [historicalQuarter, setHistoricalQuarter] = useState<string>('Q1')
  const [historicalYear, setHistoricalYear] = useState<string>(new Date().getFullYear().toString())
  
  // Add numberFormatter at component level so it's available everywhere
  const numberFormatter = new Intl.NumberFormat('en-US')

  // Add debug logs
  useEffect(() => {
    if (goal) {
      console.log('Current goal:', {
        id: goal.id,
        title: goal.title,
        type: goal.type,
        timeHorizon: goal.timeHorizon,
        tracking: goal.tracking
      })
    }
  }, [goal])

  if (!goal) {
    return <div className="p-4">Goal not found</div>
  }

  // Find all weekly goals that are linked to this annual/lifetime goal
  const linkedWeeklyGoals = goals.filter(g => 
    g.timeHorizon === 'weekly' && g.parentGoalId === goal.id
  )

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  // Calculate empty days at start of month grid
  const firstDayOfMonth = startOfMonth(currentMonth)
  const dayOfWeek = firstDayOfMonth.getDay() // 0-6, Sunday-Saturday
  const emptyDays = (dayOfWeek + 6) % 7 // Convert to Monday-based (0-6)

  // Add empty slots at the beginning
  const calendarDays = [...Array(emptyDays).fill(null), ...days]

  const getCompletionForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    if (goal.trackingType === 'boolean') {
      return goal.tracking.completedDates.includes(dateStr)
    } else {
      return goal.tracking.countHistory?.find(h => h.date === dateStr)?.value
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  const handleAddHistorical = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (goal.type === 'good_enough') {
      if (!historicalValue || !historicalQuarter || !historicalYear) return
      
      const quarterKey = `${historicalQuarter} ${historicalYear}`
      const value = parseFloat(historicalValue)
      
      // Create new quarterly values
      const newQuarterlyValues = {
        ...(goal.tracking.quarterlyValues || {}),
        [quarterKey]: value
      }
      
      // Calculate total progress
      const totalProgress = Object.values(newQuarterlyValues).reduce((sum, val) => sum + val, 0)
      
      // Create updated goal with new values
      const updatedGoal = {
        ...goal,
        tracking: {
          ...goal.tracking,
          quarterlyValues: newQuarterlyValues,
          progress: totalProgress,
          countHistory: Object.entries(newQuarterlyValues).map(([quarter, val]) => ({
            date: quarter.replace(' ', '-'),
            value: val
          })).sort((a, b) => a.date.localeCompare(b.date))
        }
      }

      await updateGoal(updatedGoal)
    } else {
      // For lifetime goals with count tracking
      if (!historicalValue || !historicalYear) return
      
      const value = parseFloat(historicalValue)
      
      // Check if an entry for this year already exists
      const existingEntryIndex = (goal.tracking.countHistory || [])
        .findIndex(entry => entry.date === historicalYear)
      
      let newCountHistory = [...(goal.tracking.countHistory || [])]
      
      if (existingEntryIndex >= 0) {
        // Update existing entry
        newCountHistory[existingEntryIndex] = {
          ...newCountHistory[existingEntryIndex],
          value: value // Replace value instead of adding to it
        }
      } else {
        // Add new entry
        newCountHistory.push({
          date: historicalYear,
          value: value
        })
      }
      
      // Sort the entries
      newCountHistory = newCountHistory.sort((a, b) => a.date.localeCompare(b.date))
      
      // Calculate total progress
      const totalProgress = newCountHistory.reduce((sum, entry) => sum + entry.value, 0)
      
      // Create updated goal with new values
      const updatedGoal = {
        ...goal,
        tracking: {
          ...goal.tracking,
          progress: totalProgress,
          countHistory: newCountHistory
        }
      }

      console.log('Updating goal with new history:', newCountHistory)
      await updateGoal(updatedGoal)
    }
    
    setIsAddingHistorical(false)
    setHistoricalValue('')
  }

  const renderScheduleEditor = () => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    const toggleDaySchedule = async (dayIndex: number) => {
      const newScheduledDays = goal.tracking.scheduledDays.includes(dayIndex)
        ? goal.tracking.scheduledDays.filter(d => d !== dayIndex)
        : [...goal.tracking.scheduledDays, dayIndex].sort()
        
      await updateGoal({
        ...goal,
        tracking: {
          ...goal.tracking,
          scheduledDays: newScheduledDays
        }
      })
    }
    
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Weekly Schedule</h2>
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map((day, index) => (
            <button
              key={day}
              onClick={() => toggleDaySchedule(index)}
              className={`px-3 py-2 rounded-md text-sm transition-colors
                ${goal.tracking.scheduledDays.includes(index) 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {day.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderCompletionStats = () => {
    // Calculate times per week this year
    const today = new Date()
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    const completionsThisYear = goal.tracking.completedDates.filter(date => 
      new Date(date) >= startOfYear
    ).length
    
    const weeksElapsedThisYear = Math.ceil(
      (today.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    
    const timesPerWeek = weeksElapsedThisYear > 0 
      ? (completionsThisYear / weeksElapsedThisYear).toFixed(1) 
      : '0.0'
    
    // Calculate streak of meeting weekly goal
    const weeklyStreak = calculateWeeklyStreak()
    
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-primary">{timesPerWeek}</div>
          <div className="text-sm text-gray-600">Times per week this year</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-primary">{weeklyStreak}</div>
          <div className="text-sm text-gray-600">Week streak</div>
        </div>
      </div>
    )
  }

  const calculateWeeklyStreak = () => {
    if (!goal.daysPerWeek) return 0
    
    const targetDaysPerWeek = goal.daysPerWeek
    const sortedDates = [...goal.tracking.completedDates].sort()
    
    if (sortedDates.length === 0) return 0
    
    // Group completions by week
    const weekCompletions: Record<string, number> = {}
    
    sortedDates.forEach(dateStr => {
      const date = new Date(dateStr)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 })
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      
      weekCompletions[weekKey] = (weekCompletions[weekKey] || 0) + 1
    })
    
    // Convert to array of week objects
    const weeks = Object.entries(weekCompletions)
      .map(([weekStart, count]) => ({ 
        weekStart, 
        count,
        metGoal: count >= targetDaysPerWeek
      }))
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart)) // Sort newest first
    
    // Calculate streak
    let streak = 0
    const today = new Date()
    const currentWeekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    
    // Start with current week
    let weekToCheck = currentWeekStart
    
    while (true) {
      const weekData = weeks.find(w => w.weekStart === weekToCheck)
      
      // If we found data for this week and the goal was met
      if (weekData && weekData.metGoal) {
        streak++
        // Move to previous week
        const prevWeekDate = subWeeks(new Date(weekToCheck), 1)
        weekToCheck = format(prevWeekDate, 'yyyy-MM-dd')
      } else {
        // Break the streak if goal wasn't met or no data
        break
      }
    }
    
    return streak
  }

  const renderWeeklyView = () => {
    return (
      <div>
        {renderScheduleEditor()}
        
        {renderCompletionStats()}
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">History</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                ←
              </button>
              <span className="font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center py-2 text-sm font-medium">
                {day}
              </div>
            ))}
            
            {calendarDays.map((day, index) => {
              if (!day) {
                return (
                  <div 
                    key={`empty-${index}`} 
                    className="aspect-square p-2 rounded-md text-sm relative"
                  />
                )
              }
              
              const completion = getCompletionForDate(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                  className={`
                    aspect-square p-2 rounded-md text-sm relative
                    ${isCurrentMonth ? 'hover:bg-gray-100' : 'opacity-50'}
                    ${completion ? 'bg-green-100 hover:bg-green-200' : ''}
                  `}
                >
                  <span className="absolute top-1 left-1">{format(day, 'd')}</span>
                  {typeof completion === 'number' && (
                    <span className="absolute bottom-1 right-1 text-xs font-medium">
                      {completion}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderAnnualView = () => {
    if (!goal) return null

    const {
      percentComplete,
      currentValue,
      target,
      unit
    } = calculateProjection(goal)

    const isOverachieving = percentComplete > 100
    const numberFormatter = new Intl.NumberFormat('en-US')

    // Calculate projection message for lifetime goals
    let projectionMessage = null
    
    if (goal.timeHorizon === 'lifetime') {
      // Get historical data from countHistory
      const historyByYear: Record<string, number> = {}
      
      // Group entries by year
      goal.tracking.countHistory?.forEach(entry => {
        // Extract year from date format
        let year: string | undefined
        if (entry.date.length === 4) {
          year = entry.date
        } else if (entry.date.includes('-')) {
          const parts = entry.date.split('-')
          if (parts[1]?.length === 4) year = parts[1]
          else if (parts[0]?.length === 4) year = parts[0]
        }
        
        if (year) {
          historyByYear[year] = (historyByYear[year] || 0) + entry.value
        }
      })
      
      // Get yearly totals for the last 5 years
      const yearlyTotals = Object.entries(historyByYear)
        .sort((a, b) => b[0].localeCompare(a[0])) // Sort newest first
        .slice(0, 5) // Take last 5 years
        .map(([_, value]) => value)
      
      const avgPerYear = yearlyTotals.length > 0
        ? yearlyTotals.reduce((sum, val) => sum + val, 0) / yearlyTotals.length
        : 0
      
      const remainingToTarget = target - currentValue
      const yearsToComplete = avgPerYear > 0 ? Math.ceil(remainingToTarget / avgPerYear) : 0
      const projectedCompletionYear = new Date().getFullYear() + yearsToComplete
      
      if (currentValue >= target) {
        projectionMessage = "🎉 Congratulations! You've already reached your goal!"
      } else if (avgPerYear <= 0) {
        projectionMessage = "Add more historical data to see a projection."
      } else {
        const roundedAvg = Math.round(avgPerYear)
        
        projectionMessage = (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="flex items-center flex-wrap">
              <span className="mr-2">🚀</span>
              At your current pace, you'll achieve your goal in{' '}
              <span className="text-xl font-bold text-primary mx-1">
                {projectedCompletionYear}
              </span>{' '}
              based on your average of {roundedAvg} {unit} per year over the past {Math.min(5, yearlyTotals.length)} years!
            </p>
          </div>
        )
      }
    }

    console.log('Goal data for projection:', {
      countHistory: goal.tracking.countHistory,
      progress: goal.tracking.progress
    })

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Progress Overview</h2>
          
          {/* Projection message now appears here, above the progress bar */}
          {projectionMessage}
          
          <div className="flex justify-between mb-2">
            <div>
              <p className="text-text-secondary">Current</p>
              <p className="text-3xl font-bold">{numberFormatter.format(currentValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-text-secondary">Target</p>
              <p className="text-3xl font-bold">{numberFormatter.format(target)}</p>
            </div>
          </div>
          
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-primary rounded-full"
              style={{ width: `${Math.min(percentComplete, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-1">
            <p className="text-sm text-text-secondary">{Math.round(percentComplete)}% complete</p>
            <p className="text-sm text-text-secondary">
              Projected: {Math.round(percentComplete)}%
              {isOverachieving ? " (Exceeding Target)" : ""}
            </p>
          </div>
        </div>

        {linkedWeeklyGoals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Contributing Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkedWeeklyGoals.map(weeklyGoal => {
                const weeklyContribution = weeklyGoal.tracking.progress || 0
                const contributionPercent = (weeklyContribution / currentValue) * 100

                return (
                  <div 
                    key={weeklyGoal.id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <h3 
                      onClick={() => navigate(`/goals/${weeklyGoal.id}`)}
                      className="font-medium cursor-pointer hover:underline"
                    >
                      {weeklyGoal.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{weeklyGoal.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{numberFormatter.format(weeklyContribution)} {unit}</span>
                        <span className="text-gray-600">{numberFormatter.format(Math.round(contributionPercent))}% of total</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${contributionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {goal.timeHorizon === 'lifetime' ? 'Lifetime Progress' : 'Monthly Progress'}
          </h2>
          
          {/* Chart comes first now */}
          <MonthlyProgressChart goal={goal} />
          
          {/* Historical data table moved below the chart */}
          {goal.timeHorizon === 'lifetime' && goal.trackingType === 'count' && renderHistoricalDataTable()}
          
          {/* Show historical input for both good_enough goals and lifetime count goals */}
          {(goal.type === 'good_enough' || (goal.timeHorizon === 'lifetime' && goal.trackingType === 'count')) && renderHistoricalInput()}
        </div>
      </div>
    )
  }

  const renderHistoricalInput = () => {
    // Add debug log
    console.log('Rendering historical input:', {
      goalType: goal.type,
      timeHorizon: goal.timeHorizon,
      trackingType: goal.trackingType
    })

    return (
      <div className="mb-6">
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={() => setIsAddingHistorical(true)}
            className="btn-primary"
          >
            Add Historical Data
          </button>
        </div>

        {isAddingHistorical && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Add Historical Data</h3>
              <form onSubmit={handleAddHistorical}>
                {goal.type === 'good_enough' ? (
                  // Quarterly input for good_enough goals
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Quarter</label>
                      <select
                        value={historicalQuarter}
                        onChange={e => setHistoricalQuarter(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Year</label>
                      <select
                        value={historicalYear}
                        onChange={e => setHistoricalYear(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                      >
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  // Yearly input for lifetime goals
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <select
                      value={historicalYear}
                      onChange={e => setHistoricalYear(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    >
                      {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {goal.type === 'good_enough' ? 'Quarterly Value' : 'Total for Year'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={historicalValue}
                    onChange={e => setHistoricalValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    placeholder={`Enter ${goal.type === 'good_enough' ? 'quarterly' : 'yearly'} value`}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingHistorical(false)
                      setHistoricalValue('')
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderHistoricalDataTable = () => {
    // Only show for lifetime goals with count tracking
    if (goal.timeHorizon !== 'lifetime' || goal.trackingType !== 'count') {
      return null;
    }

    // Get the current progress values from calculateProjection
    const { currentValue, unit } = calculateProjection(goal)

    // Get historical data from countHistory
    const historyByYear: Record<string, number> = {};
    
    // Group entries by year
    goal.tracking.countHistory?.forEach(entry => {
      // Handle both year-only format and other formats (like quarterly Q1-2023)
      let year: string | undefined;
      if (entry.date.length === 4) {
        // It's already just a year
        year = entry.date;
      } else if (entry.date.includes('-')) {
        // It might be a quarterly format or other date format
        const parts = entry.date.split('-');
        // Check if the second part looks like a year
        if (parts[1]?.length === 4 && !isNaN(Number(parts[1]))) {
          year = parts[1];
        } else if (parts[0]?.length === 4 && !isNaN(Number(parts[0]))) {
          year = parts[0];
        }
      }

      if (year) {
        historyByYear[year] = (historyByYear[year] || 0) + entry.value;
      }
    });

    // Convert to array and sort by year (newest first)
    const yearlyData = Object.entries(historyByYear)
      .map(([year, value]) => ({ year, value: value as number }))
      .sort((a, b) => b.year.localeCompare(a.year));

    console.log('Historical data:', goal.tracking.countHistory)

    return (
      <div className="mb-6">
        {yearlyData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left border">Year</th>
                  <th className="px-4 py-2 text-right border">{goal.tracking.target?.unit || 'Count'}</th>
                </tr>
              </thead>
              <tbody>
                {yearlyData.map(({ year, value }) => (
                  <tr key={year} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{year}</td>
                    <td className="px-4 py-2 text-right border">
                      {numberFormatter.format(Number(value))} {goal.tracking.target?.unit || ''}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-medium">
                  <td className="px-4 py-2 border">Total</td>
                  <td className="px-4 py-2 text-right border">
                    {numberFormatter.format(Number(currentValue))} {unit}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No historical data available. Add some using the "Add Historical Data" button above.</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        <span>Back</span>
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{goal.title}</h1>
        <p className="text-gray-600">{goal.description}</p>
      </div>

      {goal.timeHorizon === 'weekly' ? renderWeeklyView() : renderAnnualView()}

      {selectedDate && (
        <CompletionModal
          isOpen={true}
          onClose={() => setSelectedDate(null)}
          goal={goal}
          date={selectedDate}
        />
      )}
    </div>
  )
}