import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useCategories } from '../contexts/CategoryContext'
import { useGoals } from '../contexts/GoalContext'

type GoodEnoughModalProps = {
  isOpen: boolean
  onClose: () => void
}

const RELATIONSHIPS = ['>=', '<=', '>', '<', '=']
const TIMEFRAMES = ['quarterly', 'annual'] as const
const UNITS = ['', '$', '%'] as const

export default function GoodEnoughModal({ isOpen, onClose }: GoodEnoughModalProps) {
  const { categories } = useCategories()
  const { addGoal } = useGoals()
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    threshold: '',
    relationship: '>=',
    timeframe: 'quarterly' as typeof TIMEFRAMES[number],
    unit: '' as typeof UNITS[number]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    addGoal({
      title: formData.title,
      type: 'good_enough',
      category: formData.category,
      threshold: parseFloat(formData.threshold),
      relationship: formData.relationship as '>=' | '<=' | '>' | '<' | '=',
      timeframe: formData.timeframe,
      unit: formData.unit,
      timeHorizon: 'ongoing',
      description: `${formData.title} should be ${formData.relationship} ${formData.unit}${formData.threshold}${formData.unit === '%' ? '%' : ''} ${formData.timeframe}`,
      tracking: {
        scheduledDays: [],
        completedDates: [],
        target: {
          value: parseFloat(formData.threshold),
          unit: formData.unit
        }
      }
    })
    
    onClose()
    setFormData({
      title: '',
      category: '',
      threshold: '',
      relationship: '>=',
      timeframe: 'quarterly',
      unit: ''
    })
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Add Good Enough Goal
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Goal Name
                        </label>
                        <input
                          type="text"
                          id="title"
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                          Category
                        </label>
                        <select
                          id="category"
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
                            Relationship
                          </label>
                          <select
                            id="relationship"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                            value={formData.relationship}
                            onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                          >
                            {RELATIONSHIPS.map(rel => (
                              <option key={rel} value={rel}>
                                {rel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                            Unit
                          </label>
                          <select
                            id="unit"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                            value={formData.unit}
                            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as typeof UNITS[number] }))}
                          >
                            <option value="">None</option>
                            <option value="$">$</option>
                            <option value="%">%</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">
                            Threshold
                          </label>
                          <input
                            type="number"
                            id="threshold"
                            required
                            step="any"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                            value={formData.threshold}
                            onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
                            Timeframe
                          </label>
                          <select
                            id="timeframe"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                            value={formData.timeframe}
                            onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value as typeof TIMEFRAMES[number] }))}
                          >
                            {TIMEFRAMES.map(timeframe => (
                              <option key={timeframe} value={timeframe}>
                                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 sm:ml-3 sm:w-auto"
                        >
                          Add Goal
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 