import {
  HomeIcon,
  CalendarIcon,
  ChartBarIcon,
  FlagIcon,
  SparklesIcon,
  Cog6ToothIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Weekly Plan', href: '/weekly', icon: CalendarIcon },
  { name: 'Quarterly Baseline', href: '/quarterly', icon: ChartBarIcon },
  { name: 'Good Enough', href: '/good-enough', icon: HandThumbUpIcon },
  { name: 'Annual Goals', href: '/annual', icon: FlagIcon },
  { name: 'Lifetime Goals', href: '/lifetime', icon: SparklesIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon }
]

function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-y-5 bg-white px-6 py-4">
      <div className="flex h-16 items-center">
        <h1 className="text-2xl font-bold text-primary">Tempo</h1>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                      }`
                    }
                  >
                    <item.icon
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar 