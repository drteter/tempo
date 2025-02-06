import { PlusIcon } from '@heroicons/react/24/outline'
import { Menu } from '@headlessui/react'
import { useNavigate } from 'react-router-dom'

function Header() {
  const navigate = useNavigate();

  const handleAddGoal = () => {
    navigate('/goals/new');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="btn-primary flex items-center gap-2"
          onClick={handleAddGoal}
        >
          <PlusIcon className="h-5 w-5" />
          Add Goal
        </button>
      </div>

      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <span className="text-sm font-medium text-text-primary">John Doe</span>
        </Menu.Button>

        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                className={`${
                  active ? 'bg-gray-50' : ''
                } block w-full text-left px-4 py-2 text-sm text-text-primary`}
              >
                Profile Settings
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                className={`${
                  active ? 'bg-gray-50' : ''
                } block w-full text-left px-4 py-2 text-sm text-text-primary`}
              >
                Sign Out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </header>
  )
}

export default Header 