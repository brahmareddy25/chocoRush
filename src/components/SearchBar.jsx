import { Search, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ query, setQuery, sort, setSort }) {
  return (
    <div className="search-row">
      <label className="search-box">
        <Search size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search dark truffles, pralines, wafers..."
        />
      </label>
      <label className="sort-box">
        <SlidersHorizontal size={18} />
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="recommended">Recommended</option>
          <option value="rating">Top rated</option>
          <option value="low">Price: Low to high</option>
          <option value="high">Price: High to low</option>
        </select>
      </label>
    </div>
  );
}
