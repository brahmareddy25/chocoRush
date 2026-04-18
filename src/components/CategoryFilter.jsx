const categories = ['All', 'Dark', 'Milk', 'Premium', 'Imported'];

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="category-strip" aria-label="Chocolate categories">
      {categories.map((category) => (
        <button
          className={active === category ? 'active' : ''}
          key={category}
          onClick={() => onChange(category)}
          type="button"
        >
          {category}
        </button>
      ))}
    </div>
  );
}
