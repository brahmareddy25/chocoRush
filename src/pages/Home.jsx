import { useEffect, useMemo, useState } from 'react';
import { getProducts } from '../api/products.js';
import CategoryFilter from '../components/CategoryFilter.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { sampleChocolates } from '../data/sampleChocolates.js';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [queryText, setQueryText] = useState('');
  const [sort, setSort] = useState('recommended');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await getProducts();
        const remoteProducts = response.products || [];
        setProducts(remoteProducts.length ? remoteProducts : sampleChocolates);
      } catch {
        setError('Local products API is unavailable right now. Showing starter chocolates.');
        setProducts(sampleChocolates);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const search = queryText.trim().toLowerCase();
    const visible = products.filter((product) => {
      if (product.isActive === false) return false;
      const matchesCategory = category === 'All' || product.category === category;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });

    return visible.sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'low') return a.price - b.price;
      if (sort === 'high') return b.price - a.price;
      return b.rating * 100 - a.price - (b.price - a.price);
    });
  }, [products, category, queryText, sort]);

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p>Fresh drops near you</p>
          <h1>Craft chocolate, midnight cravings, and gift boxes at rush speed.</h1>
          <span>Curated bars, truffles, imported picks, and premium bites from trusted makers.</span>
        </div>
      </section>

      <section className="shop-shell">
        <div className="section-title">
          <div>
            <p>Chocolate menu</p>
            <h2>Top picks for today</h2>
          </div>
          <strong>{filteredProducts.length} choices</strong>
        </div>

        <SearchBar query={queryText} setQuery={setQueryText} sort={sort} setSort={setSort} />
        <CategoryFilter active={category} onChange={setCategory} />

        {error && <p className="notice">{error}</p>}

        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="skeleton-card" key={index} />
            ))}
          </div>
        ) : filteredProducts.length ? (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No chocolates found</h3>
            <p>Try a different search or category.</p>
          </div>
        )}
      </section>
    </main>
  );
}
