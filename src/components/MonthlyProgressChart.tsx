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
    
    // Get meta data for the progress dataset
    const meta = chart.getDatasetMeta(0);
    
    // Calculate positions
    let progressX, progressY;
    
    // Use the actual point position from the meta data
    if (meta.data[lastProgressIndex]) {
      const point = meta.data[lastProgressIndex];
      progressX = point.x;
      progressY = point.y;
    } else {
      // Fallback if meta data isn't available
      progressX = chartArea.left;
      progressY = chartArea.top;
    }
    
    // For Projected label - use the last value
    const projectedValue = projectedData.data[projectedData.data.length - 1];
    const projectedY = chart.scales.y.getPixelForValue(projectedValue);
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
  const currentYear = today.getFullYear()

  // For lifetime goals, show yearly progress
  if (goal.timeHorizon === 'lifetime') {
    // Get all years from the quarterly data
    const allDates = goal.tracking.countHistory?.map(entry => entry.date) || [];

    // Extract years, handling both YYYY and YYYY-QN formats
    const years = [...new Set(allDates.map(date => {
      // If it's already just a year (YYYY format), return it
      if (date.length === 4) return date;
      // For quarterly entries (QN-YYYY format), get the year part
      if (date.includes('-20')) {
        return date.split('-')[1];
      }
      return date;
    }))];

    // Sort years numerically and remove any invalid entries
    years.sort((a, b) => parseInt(a) - parseInt(b));

    // Calculate yearly totals by summing quarterly values
    const yearlyData = years.map(year => {
      const yearEntries = goal.tracking.countHistory
        ?.filter(entry => {
          if (entry.date.length === 4) return entry.date === year;
          if (entry.date.includes('-20')) return entry.date.split('-')[1] === year;
          return false;
        }) || [];
      const total = yearEntries.reduce((sum, entry) => sum + entry.value, 0);
      return total;
    });

    // Calculate 5-year rolling average for projection
    const last5Years = yearlyData.slice(-5);
    const avgPerYear = last5Years.length > 0 
      ? last5Years.reduce((sum, val) => sum + val, 0) / last5Years.length 
      : 0;

    
    
    // Extend years array to 2080
    const extendedYears = [...years];
    const lastYear = years.length > 0 ? parseInt(years[years.length - 1]) : currentYear;
    for (let year = lastYear + 1; year <= 2080; year++) {
      extendedYears.push(year.toString());
    }

    // Calculate cumulative progress for actual years
    const cumulativeProgress = years.map((_, index) => 
      yearlyData.slice(0, index + 1).reduce((sum, val) => sum + val, 0)
    );

    // Calculate projected values for all years (including future)
    const projectedData = extendedYears.map((year, index) => {
      const yearNum = parseInt(year);
      
      // For past years with actual data
      if (index < years.length) {
        return cumulativeProgress[index];
      } 
      // For future years
      else {
        const yearsInFuture = yearNum - parseInt(years[years.length - 1]);
        const lastActualTotal = cumulativeProgress[cumulativeProgress.length - 1] || 0;
        return lastActualTotal + (avgPerYear * yearsInFuture);
      }
    });

    const data = {
      labels: extendedYears,
      datasets: [
        {
          label: 'Total Progress',
          data: projectedData.slice(0, years.length), // Only show actual data
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
          suggestedMax: Math.max((goal.tracking.target?.value || 0) * 1.1, ...projectedData)
        },
        x: {
          type: 'category',
          grid: {
            display: false
          },
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            callback: function(_value, index) {
              const year = parseInt(extendedYears[index]);
              if (isNaN(year)) return '';
              return year % 10 === 0 ? year.toString() : '';
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const yearIndex = context.dataIndex;
              const year = extendedYears[yearIndex];
              const yearNum = parseInt(year);
              
              // For actual years
              if (yearNum <= lastYear) {
                const yearDataIndex = years.indexOf(year);
                const cumulative = context.parsed.y;
                return [
                  `Total Progress: ${cumulative} ${goal.tracking.target?.unit || ''}`,
                  `This Year: ${yearDataIndex >= 0 ? yearlyData[yearDataIndex] : 0} ${goal.tracking.target?.unit || ''}`
                ];
              } 
              // For projected years
              else {
                return [
                  `Projected Total: ${Math.round(context.parsed.y)} ${goal.tracking.target?.unit || ''}`,
                  `Year: ${year}`
                ];
              }
            }
          }
        },
        annotation: {
          annotations: {
            goalLine: {
              type: 'line' as const,
              yMin: goal.tracking.target?.value || 0,
              yMax: goal.tracking.target?.value || 0,
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
      <div>
        <div className="h-[300px]">
          <Line data={data} options={options} />
        </div>
      </div>
    )
  }

  // Original monthly chart code for non-lifetime goals
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