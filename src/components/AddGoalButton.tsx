import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import GoalModal from './GoalModal'

export default function AddGoalButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 p-4 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90"
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