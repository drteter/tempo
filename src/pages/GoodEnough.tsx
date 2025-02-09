import { HandThumbUpIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline'
import { useGoals } from '../contexts/GoalContext'
import { useCategories } from '../contexts/CategoryContext'
import { useState, Fragment } from 'react'
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

    // Use the year total for comparison
    const meetsThreshold = (() => {
      switch (relationship) {
        case '>=': return yearTotal >= threshold
        case '<=': return yearTotal <= threshold
        case '>': return yearTotal > threshold
        case '<': return yearTotal < threshold
        case '=': return yearTotal === threshold
        default: return false
      }
    })()

    const closeToThreshold = (() => {
      const tolerance = threshold * 0.1 // 10% tolerance
      switch (relationship) {
        case '>=': return yearTotal >= threshold - tolerance
        case '<=': return yearTotal <= threshold + tolerance
        case '>': return yearTotal > threshold - tolerance
        case '<': return yearTotal < threshold + tolerance
        case '=': return Math.abs(yearTotal - threshold) <= tolerance
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

function getQuarterNumber(quarter: Quarter): number {
  switch (quarter) {
    case 'Q1': return 1
    case 'Q2': return 2
    case 'Q3': return 3
    case 'Q4': return 4
  }
}

function formatValue(value: number | undefined, unit: string | undefined): string {
  if (value === undefined) return ''
  if (unit === '$') return `$${value.toLocaleString()}`
  if (unit === '%') return `${value}%`
  return value.toString()
}

export default function GoodEnough() {
  const { goals, updateGoal, updateGoalProgress } = useGoals()
  const { categories } = useCategories()
  const goodEnoughGoals = goals.filter(goal => goal.type === 'good_enough')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingValue, setEditingValue] = useState<{
    goalId: string
    quarter: Quarter
    year: number
  } | null>(null)
  const [newValue, setNewValue] = useState('')
  const [showAllYears, setShowAllYears] = useState(false)

  const handleValueSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingValue || !newValue) return

    const goal = goals.find(g => g.id === editingValue.goalId)
    if (!goal) return

    const quarterKey = getQuarterKey(editingValue.quarter, editingValue.year)
    const updatedGoal = {
      ...goal,
      tracking: {
        ...goal.tracking,
        quarterlyValues: {
          ...goal.tracking.quarterlyValues,
          [quarterKey]: parseFloat(newValue)
        }
      }
    }

    updateGoal(updatedGoal)
    setEditingValue(null)
    setNewValue('')
  }

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
            <p className="text-text-secondary">Track your good enough thresholds</p>
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
                          aria-label={showAllYears ? 'Show less years' : 'Show more years'}
                        >
                          <span className="relative top-[-1px]">
                            {showAllYears ? '\u203A' : '\u2039'}
                          </span>
                        </button>
                      </div>
                    )}
                  </th>
                  {Array.from(new Set(quarters.map(q => q.year))).map((year, yearIndex) => {
                    const yearQuarters = quarters.filter(q => q.year === year)
                    return (
                      <th
                        key={year}
                        colSpan={yearQuarters.length}
                        className={`text-center px-4 pb-1 ${
                          yearIndex > 0 ? 'border-l-2 border-gray-200' : ''
                        }`}
                      >
                        <div className="text-lg font-bold text-gray-700">{year}</div>
                      </th>
                    )
                  })}
                </tr>
                <tr className="border-b border-gray-200">
                  {quarters.map(({ quarter, year }, index) => (
                    <th 
                      key={`${quarter}-${year}`} 
                      className={`text-center px-4 py-0.5 text-sm text-gray-500 ${
                        index > 0 && quarters[index - 1].year !== year ? 'border-l-2 border-gray-200' : ''
                      }`}
                    >
                      {quarter}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(goalsByCategory).map(([categoryName, { goals: categoryGoals, icon: Icon, color }], categoryIndex) => (
                  <Fragment key={categoryName}>
                    <tr>
                      <td 
                        className={`px-4 py-1.5 bg-gray-50 sticky left-0 ${categoryIndex > 0 ? 'border-t' : ''}`}
                      >
                        <div className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <div 
                              className="p-1.5 rounded-lg"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <Icon 
                                className="h-4 w-4"
                                style={{ color }}
                              />
                            </div>
                            <span className="font-semibold text-text-primary">{categoryName}</span>
                          </div>
                        </div>
                      </td>
                      <td 
                        colSpan={quarters.length}
                        className={`bg-gray-50 ${categoryIndex > 0 ? 'border-t' : ''}`}
                      />
                    </tr>
                    {categoryGoals.map(goal => (
                      <Fragment key={goal.id}>
                        <tr className="border-t">
                          <td className="px-4 py-1.5 sticky left-0 bg-white">
                            <div className="text-right whitespace-nowrap">
                              <div className="font-medium">{goal.title}</div>
                              <div className="text-xs italic text-gray-500">
                                {goal.relationship} {formatValue(goal.threshold, goal.unit)}
                              </div>
                            </div>
                          </td>
                          {quarters.map(({ quarter, year }, index) => {
                            const quarterKey = getQuarterKey(quarter, year)
                            const value = goal.tracking.quarterlyValues?.[quarterKey]
                            const isEditing = editingValue?.goalId === goal.id && 
                                           editingValue.quarter === quarter && 
                                           editingValue.year === year

                            return (
                              <td 
                                key={quarterKey} 
                                className={`px-4 py-1.5 ${
                                  index > 0 && quarters[index - 1].year !== year ? 'border-l-2 border-gray-200' : ''
                                }`}
                              >
                                {isEditing ? (
                                  <form onSubmit={handleValueSubmit} className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      step="any"
                                      value={newValue}
                                      onChange={(e) => setNewValue(e.target.value)}
                                      className="w-20 rounded-md border border-gray-300 px-2 py-1"
                                      autoFocus
                                    />
                                    <button type="submit" className="text-primary hover:text-primary/80">
                                      Save
                                    </button>
                                  </form>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingValue({ goalId: goal.id, quarter, year })
                                      setNewValue(value?.toString() || '')
                                    }}
                                    className={`w-full px-3 py-1 rounded-full text-sm ${getStatusColor(
                                      value, 
                                      goal.threshold || 0, 
                                      goal.relationship || '>=',
                                      goal.timeframe,
                                      goal.tracking.quarterlyValues,
                                      quarter,
                                      year
                                    )}`}
                                  >
                                    {value !== undefined ? formatValue(value, goal.unit) : (
                                      <PencilIcon className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                        <tr>
                          <td className="px-4 py-1.5 sticky left-0 bg-white">
                            <div className="text-right whitespace-nowrap">
                              <GoalProgress 
                                goalId={goal.id} 
                                onProgressUpdate={(amount: number) => {
                                  if (goal.linkedGoalId) {
                                    updateGoalProgress(goal.linkedGoalId, amount)
                                  }
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <GoodEnoughModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
} 