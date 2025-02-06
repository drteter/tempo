import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import AddGoalButton from './components/AddGoalButton'
import Dashboard from './pages/Dashboard'
import WeeklyPlan from './pages/WeeklyPlan'
import QuarterlyBaseline from './pages/QuarterlyBaseline'
import AnnualGoals from './pages/AnnualGoals'
import LifetimeGoals from './pages/LifetimeGoals'
import Settings from './pages/Settings'
import GoalForm from './pages/GoalForm'
import GoalDetail from './pages/GoalDetail'
import { CategoryProvider } from './contexts/CategoryContext'
import { GoalProvider } from './contexts/GoalContext'
import { HabitProvider } from './contexts/HabitContext'

function App() {
  return (
    <CategoryProvider>
      <GoalProvider>
        <HabitProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/weekly" element={<WeeklyPlan />} />
                <Route path="/quarterly" element={<QuarterlyBaseline />} />
                <Route path="/annual" element={<AnnualGoals />} />
                <Route path="/lifetime" element={<LifetimeGoals />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/goals/new" element={<GoalForm />} />
                <Route path="/goals/:id" element={<GoalDetail />} />
              </Routes>
            </main>
            <AddGoalButton />
          </div>
        </HabitProvider>
      </GoalProvider>
    </CategoryProvider>
  )
}

export default App 