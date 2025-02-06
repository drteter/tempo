import { PlusIcon } from '@heroicons/react/24/outline'
import { useCategories } from '../contexts/CategoryContext'

type Category = {
  id: string
  name: string
  icon: any // Heroicon component
  color: string
  goalCount: number
  habitCount: number
}

function CategoryCard({ category }: { category: Category }) {
  const Icon = category.icon

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center gap-4">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <Icon
            className="h-6 w-6"
            style={{ color: category.color }}
          />
        </div>
        <div>
          <h3 className="font-medium text-text-primary">{category.name}</h3>
          <p className="text-sm text-text-secondary">
            {category.goalCount} goals · {category.habitCount} habits
          </p>
        </div>
      </div>
    </div>
  )
}

function Categories() {
  const { categories } = useCategories()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Categories</h1>
          <p className="text-text-secondary mt-1">Organize your goals and habits.</p>
        </div>
        <button
          onClick={() => {/* TODO: Open modal or navigate to form */}}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  )
}

export default Categories 