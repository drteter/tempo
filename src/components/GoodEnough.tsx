import React, { useState } from 'react'
import { Goal } from '../contexts/GoalContext'

interface Props {
  goal: Goal;
  quarter: string;
  year: string;
  updateGoal: (goal: Goal) => Promise<void>;
}

const GoodEnough: React.FC<Props> = ({ goal, quarter, year, updateGoal }) => {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const handleValueSubmit = async (newValue: number) => {
    console.log('Submitting value:', { goalId: goal.id, quarter, year, newValue })
    
    // Create a copy of the current quarterly values or initialize if not exists
    const updatedQuarterlyValues: { [key: string]: number } = {
      ...(goal.tracking.quarterlyValues || {}),
      [`${quarter} ${year}`]: newValue
    }
    
    // Calculate new total progress
    const totalProgress = Object.values(updatedQuarterlyValues).reduce((sum, val) => sum + val, 0)
    
    console.log('Updating goal with:', {
      quarterlyValues: updatedQuarterlyValues,
      totalProgress
    })

    // Update the goal with new quarterly values and total progress
    await updateGoal({
      ...goal,
      tracking: {
        ...goal.tracking,
        progress: totalProgress,
        quarterlyValues: updatedQuarterlyValues,
        countHistory: Object.entries(updatedQuarterlyValues).map(([q, value]) => ({
          date: q.replace(' ', '-'),
          value
        })).sort((a, b) => a.date.localeCompare(b.date))
      }
    })

    setEditing(false)
    setEditValue('')
  }

  return (
    <div>
      {/* Rest of the component code... */}
    </div>
  )
}

export default GoodEnough 