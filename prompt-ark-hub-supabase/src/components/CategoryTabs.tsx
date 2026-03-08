interface CategoryTabsProps {
  categories: string[]
  activeCategory: string
  onChange: (category: string) => void
}

export function CategoryTabs({ categories, activeCategory, onChange }: CategoryTabsProps) {
  return (
    <div className="hub-categories" id="categoryTabs">
      {categories.map((cat) => {
        const catLower = cat.toLowerCase()
        return (
          <button
            key={cat}
            className={`hub-cat-btn ${activeCategory === catLower ? 'active' : ''}`}
            onClick={() => onChange(catLower)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        )
      })}
    </div>
  )
}
