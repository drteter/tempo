import { format, eachMonthOfInterval, startOfYear, endOfYear, differenceInDays } from 'date-fns'
import type { Goal } from '../contexts/GoalContext'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'

// Add annotation plugin for the goal line
import annotationPlugin from 'chartjs-plugin-annotation'

// Add this after the other imports
const customLegendPlugin = {
  id: 'customLegend',
  afterDraw: (chart: any) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    
    // Get the datasets
    const progressData = chart.data.datasets[0];
    const projectedData = chart.data.datasets[1];
    
    // Find the last non-null value in progress data
    const lastProgressIndex = progressData.data.findLastIndex((d: number | null) => d !== null);
    const progressValue = progressData.data[lastProgressIndex];
    
    // For Progress label - use the last actual progress point
    const progressY = chart.scales.y.getPixelForValue(progressValue);
    const progressX = chartArea.left + (chartArea.width * (lastProgressIndex / 11));
    
    // For Projected label - use the December value (last point)
    const decemberValue = projectedData.data[11]; // December is index 11
    const projectedY = chart.scales.y.getPixelForValue(decemberValue);
    const projectedX = chartArea.right - 70; // Offset from right edge
    
    // Draw Progress label with bold font
    ctx.fillStyle = 'rgb(59, 130, 246)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Progress', progressX + 10, progressY);
    
    // Draw Projected label with bold font
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fillText('Projected', projectedX, projectedY);
  }
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin,
  customLegendPlugin
)

export default function MonthlyProgressChart({ goal }: { goal: Goal }) {
  const today = new Date()
  const yearStart = startOfYear(today)
  const yearEnd = endOfYear(today)
  const allMonths = eachMonthOfInterval({ start: yearStart, end: yearEnd })

  // Use the official progress value
  const currentProgress = goal.tracking.progress || 0
  const target = goal.tracking.target?.value || 0
  const daysPassed = differenceInDays(today, yearStart)
  const totalDays = differenceInDays(yearEnd, yearStart)
  const percentOfYearPassed = daysPassed / totalDays
  const projectedValue = (currentProgress / percentOfYearPassed) || 0

  // Calculate monthly progress based on countHistory for visualization
  const monthlyData = allMonths.map(month => {
    const monthStr = format(month, 'yyyy-MM')
    const monthlyEntries = goal.tracking.countHistory
      ?.filter(entry => entry.date.startsWith(monthStr))
    
    if (!monthlyEntries?.length) return 0
    return monthlyEntries.reduce((sum, entry) => sum + entry.value, 0)
  })

  // Ensure the sum matches the official progress
  const totalFromMonths = monthlyData.reduce((sum, val) => sum + val, 0)
  const scaleFactor = totalFromMonths > 0 ? currentProgress / totalFromMonths : 1

  // Scale monthly values to match the official progress
  const scaledMonthlyData = monthlyData.map(val => val * scaleFactor)

  // Calculate cumulative progress
  const actualProgress = scaledMonthlyData.map((_, index) => 
    scaledMonthlyData.slice(0, index + 1).reduce((sum, val) => sum + val, 0)
  )

  const projectedData = allMonths.map((month, index) => {
    // Use actual data for past months
    if (month <= today) {
      return actualProgress[index]
    }

    // For future months, calculate based on projected annual total
    const daysToMonth = differenceInDays(month, yearStart)
    const monthPercentOfYear = daysToMonth / totalDays
    return projectedValue * monthPercentOfYear
  })

  const data = {
    labels: allMonths.map(month => format(month, 'MMM')),
    datasets: [
      {
        label: 'Actual Progress',
        data: actualProgress.map((progress, i) => 
          allMonths[i] <= today ? progress : null
        ),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      },
      {
        label: 'Projected',
        data: projectedData,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderDash: [5, 5],
        tension: 0.3
      }
    ]
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        suggestedMax: Math.max(target * 1.1, ...projectedData)
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y} ${goal.tracking.target?.unit || ''}`
          }
        }
      },
      annotation: {
        annotations: {
          goalLine: {
            type: 'line' as const,
            yMin: target,
            yMax: target,
            borderColor: 'rgba(75, 85, 99, 0.5)',
            borderWidth: 1,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'Goal',
              position: 'end'
            }
          }
        }
      }
    }
  }

  return (
    <div className="h-[300px]">
      <Line data={data} options={options} />
    </div>
  )
} 