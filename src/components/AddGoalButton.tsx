import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useLocation } from 'react-router-dom'
import GoalModal from './GoalModal'

export default function AddGoalButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const location = useLocation()

  // Hide on the Good Enough page
  if (location.pathname === '/good-enough') {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed right-8 bottom-8 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
      
      <GoalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
} 