import { PlusIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

function AddGoalButton() {
  return (
    <Link
      to="/goals/new"
      className="fixed bottom-8 right-8 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
      aria-label="Add new goal"
    >
      <PlusIcon className="h-6 w-6" />
    </Link>
  )
}

export default AddGoalButton 