import { HandThumbUpIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline'
import { useGoals } from '../contexts/GoalContext'
import { useCategories } from '../contexts/CategoryContext'
import { useState, Fragment, useEffect } from 'react'
import GoodEnoughModal from '../components/GoodEnoughModal'
import GoalProgress from '../components/GoalProgress'

type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

function getQuarterKey(quarter: Quarter, year: number): string {
  return `${quarter} ${year}`
}

function getCurrentQuarter(): { quarter: Quarter; year: number } {
  const now = new Date()
  const month = now.getMonth()
  const quarter: Quarter = month < 3 ? 'Q1' : month < 6 ? 'Q2' : month < 9 ? 'Q3' : 'Q4'
  return { quarter, year: now.getFullYear() }
}

function getQuarterNumber(quarter: Quarter): number {
  switch (quarter) {
    case 'Q1': return 1
    case 'Q2': return 2
    case 'Q3': return 3
    case 'Q4': return 4
    default: return 0
  }
}

function getStatusColor(
  value: number | undefined, 
  threshold: number, 
  relationship: string, 
  timeframe: 'quarterly' | 'annual' | undefined,
  quarterlyValues: { [key: string]: number } | undefined,
  quarter: Quarter,
  year: number
): string {
  if (value === undefined) return 'bg-gray-100 text-gray-500'

  if (timeframe === 'annual') {
    // For annual goals, sum up all quarters in the year
    const yearTotal = Object.entries(quarterlyValues || {})
      .filter(([key]) => key.endsWith(` ${year}`))
      .reduce((sum, [_, val]) => sum + val, 0)

    // For quarters after the current one, don't show any color
    const currentQuarter = getCurrentQuarter()
    if (year > currentQuarter.year || 
        (year === currentQuarter.year && getQuarterNumber(quarter) > getQuarterNumber(currentQuarter.quarter))) {
      return 'bg-gray-100 text-gray-500'
    }

    // For annual goals, we compare the year-to-date total against a pro-rated target
    const currentQuarterNum = getQuarterNumber(currentQuarter.quarter)
    const quarterNum = getQuarterNumber(quarter)
    
    // If we're looking at a past year, use the full threshold
    let adjustedThreshold = threshold
    if (year === currentQuarter.year) {
      adjustedThreshold = (threshold / 4) * currentQuarterNum
    }

    // Use the year total for all quarters in the year
    const meetsThreshold = (() => {
      switch (relationship) {
        case '>=': return yearTotal >= adjustedThreshold
        case '<=': return yearTotal <= adjustedThreshold
        case '>': return yearTotal > adjustedThreshold
        case '<': return yearTotal < adjustedThreshold
        case '=': return yearTotal === adjustedThreshold
        default: return false
      }
    })()

    const closeToThreshold = (() => {
      const tolerance = adjustedThreshold * 0.1 // 10% tolerance
      switch (relationship) {
        case '>=': return yearTotal >= adjustedThreshold - tolerance && yearTotal < adjustedThreshold
        case '<=': return yearTotal <= adjustedThreshold + tolerance && yearTotal > adjustedThreshold
        case '>': return yearTotal > adjustedThreshold - tolerance && yearTotal <= adjustedThreshold
        case '<': return yearTotal < adjustedThreshold + tolerance && yearTotal >= adjustedThreshold
        case '=': return Math.abs(yearTotal - adjustedThreshold) <= tolerance && yearTotal !== adjustedThreshold
        default: return false
      }
    })()

    if (meetsThreshold) return 'bg-green-100 text-green-800'
    if (closeToThreshold) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  // For quarterly goals, use the individual value
  const meetsThreshold = (() => {
    switch (relationship) {
      case '>=': return value >= threshold
      case '<=': return value <= threshold
      case '>': return value > threshold
      case '<': return value < threshold
      case '=': return value === threshold
      default: return false
    }
  })()

  const closeToThreshold = (() => {
    const tolerance = threshold * 0.1 // 10% tolerance
    switch (relationship) {
      case '>=': return value >= threshold - tolerance
      case '<=': return value <= threshold + tolerance
      case '>': return value > threshold - tolerance
      case '<': return value < threshold + tolerance
      case '=': return Math.abs(value - threshold) <= tolerance
      default: return false
    }
  })()

  if (meetsThreshold) return 'bg-green-100 text-green-800'
  if (closeToThreshold) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function formatValue(value: number | undefined, unit: string | undefined): string {
  if (value === undefined) return ''
  if (unit === '$') return `$${value.toLocaleString()}`
  if (unit === '%') return `${value}%`
  return value.toString()
}

export default function GoodEnough() {
  const { goals, updateGoal, updateGoalProgress, syncGoalHistories, recalculateAllGoalsProgress } = useGoals()
  const { categories } = useCategories()
  const [refreshKey, setRefreshKey] = useState(0) // Add refresh key for forcing re-renders
  
  // Debug log for goals
  useEffect(() => {
    console.log('Goals updated:', goals.map(g => ({
      id: g.id,
      title: g.title,
      type: g.type,
      quarterlyValues: g.tracking.quarterlyValues
    })))
  }, [goals])
  
  const goodEnoughGoals = goals.filter(goal => goal.type === 'good_enough')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingValue, setEditingValue] = useState<{
    goalId: string
    quarter: Quarter
    year: number
  } | null>(null)
  const [newValue, setNewValue] = useState('')
  const [showAllYears, setShowAllYears] = useState(false)

  const handleValueSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleValueSubmit called with:', { editingValue, newValue })
    
    if (!editingValue || !newValue) {
      console.log('Missing required values:', { editingValue, newValue })
      return
    }

    const goal = goals.find(g => g.id === editingValue.goalId)
    if (!goal) {
      console.error('Goal not found:', editingValue.goalId)
      return
    }

    const quarterKey = getQuarterKey(editingValue.quarter, editingValue.year)
    const value = parseFloat(newValue)
    
    console.log('Submitting value:', {
      goalId: editingValue.goalId,
      goalTitle: goal.title,
      goalType: goal.type,
      quarterKey,
      value,
      currentQuarterlyValues: goal.tracking.quarterlyValues
    })
    
    try {
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
        type: 'good_enough' as const,
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

      // Update the goal
      await updateGoal(updatedGoal)
      
      // If there's a parent goal, update it as well
      if (goal.parentGoalId) {
        const parentGoal = goals.find(g => g.id === goal.parentGoalId)
        if (parentGoal) {
          const updatedParent = {
            ...parentGoal,
            tracking: {
              ...parentGoal.tracking,
              quarterlyValues: newQuarterlyValues,
              progress: totalProgress,
              countHistory: updatedGoal.tracking.countHistory
            }
          }
          await updateGoal(updatedParent)
        }
      }

      // Clear form state
      setEditingValue(null)
      setNewValue('')
      
      // Force a refresh of the component
      setRefreshKey(prev => prev + 1)
      
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  // Sync goals on mount and after updates
  useEffect(() => {
    const syncGoals = async () => {
      try {
        await syncGoalHistories()
        setRefreshKey(prev => prev + 1) // Force a refresh after sync
      } catch (error) {
        console.error('Error syncing goals:', error)
      }
    }
    
    syncGoals()
  }, []) // Only run on mount

  // Get quarters from 2021 to current
  const { quarter: currentQuarter, year: currentYear } = getCurrentQuarter()
  const allQuarters: { quarter: Quarter; year: number }[] = []
  let q: Quarter = currentQuarter
  let y = currentYear
  
  while (y >= 2021) {
    allQuarters.unshift({ quarter: q, year: y })
    if (q === 'Q1') {
      q = 'Q4'
      y--
    } else {
      q = q === 'Q4' ? 'Q3' : q === 'Q3' ? 'Q2' : 'Q1'
    }
  }

  // Get last 2 full years plus current year
  const lastTwoYearsStart = new Date().getFullYear() - 2
  const hasHistoricalData = allQuarters.some(q => q.year < lastTwoYearsStart)
  const quarters = showAllYears 
    ? allQuarters 
    : allQuarters.filter(q => q.year >= lastTwoYearsStart)

  // Group goals by category
  const goalsByCategory = categories.reduce((acc, category) => {
    const categoryGoals = goodEnoughGoals.filter(goal => goal.category === category.name)
    if (categoryGoals.length > 0) {
      acc[category.name] = {
        goals: categoryGoals,
        icon: category.icon,
        color: category.color
      }
    }
    return acc
  }, {} as Record<string, { goals: typeof goodEnoughGoals, icon: any, color: string }>)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <HandThumbUpIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Good Enough</h1>
            <p className="text-text-secondary">Close enough for government work.</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Good Enough Goal
        </button>
      </div>

      <div className="flex justify-center">
        <div className="card py-2 w-[70%] min-w-[1024px] relative">
          <div className="overflow-x-auto">
            <table className="w-full">
              <colgroup>
                <col className="w-[200px] min-w-[200px]" /> {/* Fixed width for goal column */}
                {quarters.map((_, index) => (
                  <col key={index} className="w-[100px] min-w-[100px]" /> /* Fixed width for quarter columns */
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className="text-right px-4 py-1 sticky left-0 bg-white z-10" rowSpan={2}>
                    {hasHistoricalData && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowAllYears(!showAllYears)}
                          className={`
                            flex items-center justify-center
                            w-5 h-5 rounded-full
                            bg-white shadow-lg border border-gray-200
                            text-primary hover:text-primary/80
                            transition-transform hover:scale-110
                            text-lg leading-none
                          `}
                        >
                          {showAllYears ? '−' : '+'}
                        </button>
                      </div>
                    )}
                  </th>
                  {quarters.map(({ quarter, year }) => (
                    <th
                      key={`${quarter}-${year}`}
                      className="text-center px-2 py-1 border-l"
                      colSpan={1}
                    >
                      {quarter} {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(goalsByCategory).map(([category, { goals: categoryGoals, icon: Icon, color }]) => (
                  <Fragment key={category}>
                    <tr className="bg-gray-50">
                      <td
                        className="sticky left-0 bg-gray-50 px-4 py-2 font-medium z-10 flex items-center gap-2"
                        colSpan={quarters.length + 1}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                        {category}
                      </td>
                    </tr>
                    {categoryGoals.map(goal => (
                      <tr key={goal.id} className="border-t">
                        <td className="sticky left-0 bg-white px-4 py-2 text-right z-10 flex items-center justify-end gap-2">
                          <span>{goal.title}</span>
                          <button
                            onClick={() => {
                              const currentQuarter = getCurrentQuarter()
                              console.log('Edit button clicked:', {
                                goalId: goal.id,
                                quarter: currentQuarter.quarter,
                                year: currentQuarter.year
                              })
                              setEditingValue({
                                goalId: goal.id,
                                quarter: currentQuarter.quarter,
                                year: currentQuarter.year
                              })
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </td>
                        {quarters.map(({ quarter, year }) => {
                          const quarterKey = getQuarterKey(quarter, year)
                          const value = goal.tracking.quarterlyValues?.[quarterKey]
                          const statusColor = getStatusColor(
                            value,
                            goal.threshold || 0,
                            goal.relationship || '>=',
                            goal.timeframe,
                            goal.tracking.quarterlyValues,
                            quarter,
                            year
                          )
                          
                          return (
                            <td
                              key={quarterKey}
                              className={`text-center px-2 py-2 border-l ${statusColor}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex-grow">
                                  {goal.tracking.quarterlyValues?.[quarterKey] !== undefined
                                    ? formatValue(goal.tracking.quarterlyValues[quarterKey], goal.unit)
                                    : '-'}
                                </span>
                                <button
                                  onClick={() => {
                                    console.log('Edit button clicked:', {
                                      goalId: goal.id,
                                      quarter: quarter,
                                      year: year
                                    })
                                    setEditingValue({
                                      goalId: goal.id,
                                      quarter: quarter,
                                      year: year
                                    })
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {editingValue && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Update Value</h3>
            <form onSubmit={handleValueSubmit}>
              <input
                type="number"
                step="any"
                value={newValue}
                onChange={e => {
                  console.log('Input changed:', e.target.value)
                  setNewValue(e.target.value)
                }}
                className="w-full px-3 py-2 border rounded mb-4"
                placeholder="Enter value"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingValue(null)
                    setNewValue('')
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

      <GoodEnoughModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}