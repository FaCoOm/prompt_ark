export const CATEGORIES = [
  'All',
  'Productivity',
  'Writing', 
  'Coding',
  'Education',
  'Creative',
  'Analysis',
] as const

export type Category = 'all' | 'productivity' | 'writing' | 'coding' | 'education' | 'creative' | 'analysis'

interface CategoryTabsProps {
  activeCategory: Category
  onChange: (category: Category) => void
}

export function CategoryTabs({ activeCategory, onChange }: CategoryTabsProps) {
  return (
    <div className="hub-categories" id="categoryTabs">
      {CATEGORIES.map((cat) => {
        const catValue = cat === 'All' ? 'all' : cat.toLowerCase() as Category
        return (
          <button
            key={cat}
            className={`hub-cat-btn ${activeCategory === catValue ? 'active' : ''}`}
            onClick={() => onChange(catValue)}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
