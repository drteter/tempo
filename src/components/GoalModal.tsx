import { Dialog } from '@headlessui/react'
import { useState } from 'react'
import { useGoals, type Goal, type TimeHorizon } from '../contexts/GoalContext'
import { useCategories } from '../contexts/CategoryContext'
import { useLocation } from 'react-router-dom'

type GoalModalProps = {
  isOpen: boolean
  onClose: () => void
  editGoal?: Goal
}

const RELATIONSHIPS = ['>=' , '<=' , '>' , '<' , '='] as const
type Relationship = typeof RELATIONSHIPS[number]

const TIMEFRAMES = ['quarterly', 'annual'] as const
type Timeframe = typeof TIMEFRAMES[number]

const UNITS = ['', '$', '%', 'miles', 'words', 'minutes'] as const
type Unit = typeof UNITS[number]

type FormData = {
  title: string
  description: string
  category: string
  timeHorizon: TimeHorizon
  daysPerWeek: number
  status: 'not_started' | 'in_progress' | 'completed' | 'archived'
  target: { value: number; unit: string }
  parentGoalId: string
  trackingType: 'boolean' | 'count'
  // Good enough specific fields
  threshold: string
  relationship: Relationship
  timeframe: Timeframe
  unit: Unit
}

export default function GoalModal({ isOpen, onClose, editGoal }: GoalModalProps) {
  const { addGoal, updateGoal, goals } = useGoals()
  const { categories } = useCategories()
  const location = useLocation()
  const isGoodEnoughPage = location.pathname === '/good-enough'

  const [formData, setFormData] = useState<FormData>({
    title: editGoal?.title || '',
    description: editGoal?.description || '',
    category: editGoal?.category || categories[0]?.name || '',
    timeHorizon: editGoal?.timeHorizon || (isGoodEnoughPage ? 'ongoing' : 'weekly'),
    daysPerWeek: editGoal?.daysPerWeek || 1,
    status: editGoal?.status || 'not_started',
    target: editGoal?.tracking.target || { value: 0, unit: '' },
    parentGoalId: editGoal?.parentGoalId || '',
    trackingType: editGoal?.trackingType || (isGoodEnoughPage ? 'count' : 'boolean'),
    // Good enough specific fields
    threshold: editGoal?.threshold?.toString() || '',
    relationship: editGoal?.relationship || '>=',
    timeframe: editGoal?.timeframe || 'quarterly',
    unit: editGoal?.unit || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const baseGoalData = {
      title: formData.title,
      category: formData.category,
      parentGoalId: formData.parentGoalId || undefined,
      tracking: {
        ...editGoal?.tracking,
        scheduledDays: editGoal?.tracking.scheduledDays || [],
        completedDates: editGoal?.tracking.completedDates || [],
        target: formData.target,
        progress: editGoal?.tracking.progress || 0,
        countHistory: editGoal?.tracking.countHistory || [],
        quarterlyValues: editGoal?.tracking.quarterlyValues || {}
      }
    }

    const goalData = isGoodEnoughPage ? {
      ...baseGoalData,
      type: 'good_enough' as const,
      threshold: parseFloat(formData.threshold),
      relationship: formData.relationship,
      timeframe: formData.timeframe,
      unit: formData.unit,
      timeHorizon: 'ongoing' as const,
      description: `${formData.title} should be ${formData.relationship} ${formData.unit}${formData.threshold}${formData.unit === '%' ? '%' : ''} ${formData.timeframe}`,
      trackingType: 'count' as const,
      status: 'not_started' as const,
    } : {
      ...baseGoalData,
      description: formData.description,
      timeHorizon: formData.timeHorizon,
      daysPerWeek: formData.daysPerWeek,
      status: formData.status,
      trackingType: formData.trackingType,
    }
    
    if (editGoal) {
      updateGoal({ ...editGoal, ...goalData })
    } else {
      addGoal(goalData)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {editGoal ? 'Edit Goal' : isGoodEnoughPage ? 'Add Good Enough Goal' : 'Create New Goal'}
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-md border p-2"
                required
              />
            </div>

            {!isGoodEnoughPage && (
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border p-2"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border p-2"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {isGoodEnoughPage ? (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Relationship</label>
                    <select
                      value={formData.relationship}
                      onChange={e => setFormData(prev => ({ ...prev, relationship: e.target.value as Relationship }))}
                      className="w-full rounded-md border p-2"
                      required
                    >
                      {RELATIONSHIPS.map(rel => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value as Unit }))}
                      className="w-full rounded-md border p-2"
                    >
                      <option value="">None</option>
                      <option value="$">$</option>
                      <option value="%">%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Threshold</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.threshold}
                      onChange={e => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                      className="w-full rounded-md border p-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Timeframe</label>
                    <select
                      value={formData.timeframe}
                      onChange={e => setFormData(prev => ({ ...prev, timeframe: e.target.value as Timeframe }))}
                      className="w-full rounded-md border p-2"
                      required
                    >
                      {TIMEFRAMES.map(timeframe => (
                        <option key={timeframe} value={timeframe}>
                          {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Time Horizon</label>
                  <select
                    value={formData.timeHorizon}
                    onChange={e => setFormData(prev => ({ 
                      ...prev, 
                      timeHorizon: e.target.value as TimeHorizon
                    }))}
                    className="w-full rounded-md border p-2"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Tracking Type</label>
                  <select
                    className="w-full rounded-md border p-2"
                    value={formData.trackingType}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      trackingType: e.target.value as 'boolean' | 'count'
                    }))}
                  >
                    <option value="boolean">Yes/No</option>
                    <option value="count">Count</option>
                  </select>

                  {formData.trackingType === 'count' && (
                    <>
                      <label className="block text-sm font-medium">Target</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="flex-1 px-3 py-2 border rounded"
                          placeholder="Target value"
                          value={formData.target?.value || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            target: {
                              value: parseFloat(e.target.value),
                              unit: prev.target?.unit || ''
                            }
                          }))}
                        />
                        <select
                          className="w-32 px-3 py-2 border rounded"
                          value={formData.target?.unit || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            target: {
                              value: prev.target?.value || 0,
                              unit: e.target.value
                            }
                          }))}
                        >
                          <option value="">No unit</option>
                          <option value="$">Dollars ($)</option>
                          <option value="%">Percent (%)</option>
                          <option value="miles">Miles</option>
                          <option value="words">Words</option>
                          <option value="minutes">Minutes</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {formData.timeHorizon === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Days per Week</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          daysPerWeek: Math.max(1, prev.daysPerWeek - 1) 
                        }))}
                        className="p-2 rounded-md border"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{formData.daysPerWeek}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          daysPerWeek: Math.min(7, prev.daysPerWeek + 1) 
                        }))}
                        className="p-2 rounded-md border"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {isGoodEnoughPage ? 'Link to Lifetime Goal (Optional)' : 'Link to Parent Goal (Optional)'}
              </label>
              <select
                className="w-full rounded-md border p-2"
                value={formData.parentGoalId}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parentGoalId: e.target.value
                }))}
              >
                <option value="">None</option>
                {goals
                  .filter(g => {
                    if (isGoodEnoughPage) {
                      return g.timeHorizon === 'annual' || g.timeHorizon === 'lifetime'
                    }
                    const timeHorizons = ['weekly', 'quarterly', 'annual', 'lifetime']
                    const currentIndex = timeHorizons.indexOf(formData.timeHorizon)
                    const goalIndex = timeHorizons.indexOf(g.timeHorizon)
                    return goalIndex > currentIndex && g.id !== editGoal?.id
                  })
                  .map(g => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.timeHorizon})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                {editGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 