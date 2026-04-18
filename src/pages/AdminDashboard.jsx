import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { adminGetDashboardData, adminUpdateOrderStatus, adminUpsertProduct } from '../api/admin.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

const defaultProduct = {
  id: '',
  name: '',
  category: 'Dark',
  price: '',
  image: '',
  rating: '4.5',
  isActive: true,
  description: ''
};

function toInputDate(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function filterOrdersByRange(orders, range, customStart, customEnd) {
  const now = new Date();
  const start = new Date(now);
  if (range === 'today') start.setHours(0, 0, 0, 0);
  if (range === 'week') start.setDate(now.getDate() - 6);
  if (range === 'month') start.setDate(now.getDate() - 29);

  return orders.filter((order) => {
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime())) return false;
    if (range === 'custom') {
      if (!customStart || !customEnd) return true;
      return createdAt >= new Date(customStart) && createdAt <= new Date(`${customEnd}T23:59:59`);
    }
    return createdAt >= start && createdAt <= now;
  });
}

function buildSalesByDay(orders) {
  const map = new Map();
  for (const order of orders) {
    const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    const key = createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + Number(order.total || 0));
  }
  return [...map.entries()].map(([day, total]) => ({ day, total })).slice(-7);
}

function buildStatusBuckets(orders) {
  return ['Placed', 'Accepted', 'Preparing', 'Delivered'].map((status) => ({
    status,
    count: orders.filter((order) => (order.status || 'Placed') === status).length
  }));
}

function buildTopProducts(orders) {
  const counts = new Map();
  for (const order of orders) {
    for (const item of order.items || []) {
      counts.set(item.name, (counts.get(item.name) || 0) + Number(item.quantity || 0));
    }
  }
  return [...counts.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

export default function AdminDashboard() {
  const { session, logoutAdmin } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('All');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productAvailabilityFilter, setProductAvailabilityFilter] = useState('All');
  const [productForm, setProductForm] = useState(defaultProduct);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const response = await adminGetDashboardData(session?.token);
        setOrders(response.orders || []);
        setProducts(response.products || []);
      } catch (err) {
        setError(err.message || 'Could not load admin data.');
      } finally {
        setLoading(false);
      }
    }

    if (session?.token) {
      loadDashboard();
    }
  }, [session]);

  const rangedOrders = useMemo(
    () => filterOrdersByRange(orders, range, customRange.start, customRange.end),
    [orders, range, customRange]
  );

  const visibleOrders = useMemo(() => {
    if (statusFilter === 'All') return rangedOrders;
    return rangedOrders.filter((order) => (order.status || 'Placed') === statusFilter);
  }, [rangedOrders, statusFilter]);

  const productCategories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      const matchesCategory = productCategoryFilter === 'All' || product.category === productCategoryFilter;
      const matchesAvailability =
        productAvailabilityFilter === 'All' ||
        (productAvailabilityFilter === 'Active' ? product.isActive !== false : product.isActive === false);

      return matchesQuery && matchesCategory && matchesAvailability;
    });
  }, [productAvailabilityFilter, productCategoryFilter, productSearch, products]);

  const summary = useMemo(
    () => ({
      totalOrders: visibleOrders.length,
      totalSales: visibleOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    }),
    [visibleOrders]
  );

  const salesByDay = useMemo(() => buildSalesByDay(visibleOrders), [visibleOrders]);
  const statusBuckets = useMemo(() => buildStatusBuckets(visibleOrders), [visibleOrders]);
  const topProducts = useMemo(() => buildTopProducts(visibleOrders), [visibleOrders]);

  function setProductField(event) {
    const { name, value, type, checked } = event.target;
    setProductForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSubmittingProduct(true);
    setError('');

    try {
      await adminUpsertProduct({
        sessionToken: session?.token,
        product: {
          ...productForm,
          price: Number(productForm.price),
          rating: Number(productForm.rating)
        }
      });
      const response = await adminGetDashboardData(session?.token);
      setOrders(response.orders || []);
      setProducts(response.products || []);
      setProductForm(defaultProduct);
    } catch (err) {
      setError(err.message || 'Could not save product.');
    } finally {
      setSubmittingProduct(false);
    }
  }

  async function changeOrderStatus(order, updates) {
    setSavingOrderId(order.id);
    setError('');

    try {
      await adminUpdateOrderStatus({
        sessionToken: session?.token,
        orderId: order.id,
        status: updates.status,
        expectedDeliveryDate: updates.expectedDeliveryDate || '',
        note: updates.note || ''
      });
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                status: updates.status,
                expectedDeliveryDate: updates.expectedDeliveryDate || item.expectedDeliveryDate,
                adminNote: updates.note || item.adminNote
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || 'Could not update order.');
    } finally {
      setSavingOrderId('');
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="admin-topbar">
          <div className="section-title">
            <div>
              <p>Admin control room</p>
              <h1>Orders, products, and sales</h1>
            </div>
          </div>
          <button className="ghost-btn" onClick={logoutAdmin} type="button">
            Logout admin
          </button>
        </div>

        {error && <p className="notice">{error}</p>}
        {loading ? (
          <div className="orders-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="order-skeleton" key={index} />
            ))}
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <article className="stat-card">
                <ShoppingCart size={18} />
                <span>Total orders</span>
                <strong>{summary.totalOrders}</strong>
              </article>
              <article className="stat-card">
                <TrendingUp size={18} />
                <span>Total sales</span>
                <strong>{formatCurrency(summary.totalSales)}</strong>
              </article>
              <article className="stat-card">
                <Package size={18} />
                <span>Visible products</span>
                <strong>{filteredProducts.filter((product) => product.isActive !== false).length}</strong>
              </article>
              <article className="stat-card">
                <BarChart3 size={18} />
                <span>Delivered orders</span>
                <strong>{visibleOrders.filter((order) => order.status === 'Delivered').length}</strong>
              </article>
            </div>

            <div className="admin-filters">
              <label>
                Range
                <select onChange={(event) => setRange(event.target.value)} value={range}>
                  <option value="today">Today</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              {range === 'custom' && (
                <>
                  <label>
                    Start
                    <input
                      name="start"
                      onChange={(event) =>
                        setCustomRange((current) => ({ ...current, start: event.target.value }))
                      }
                      type="date"
                      value={customRange.start}
                    />
                  </label>
                  <label>
                    End
                    <input
                      name="end"
                      onChange={(event) =>
                        setCustomRange((current) => ({ ...current, end: event.target.value }))
                      }
                      type="date"
                      value={customRange.end}
                    />
                  </label>
                </>
              )}
              <label>
                Order status
                <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                  <option value="All">All</option>
                  <option value="Placed">Placed</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </label>
            </div>

            <div className="charts-grid">
              <article className="chart-card">
                <h2>Sales by day</h2>
                <div className="bars-chart">
                  {salesByDay.map((entry) => (
                    <div className="bar-col" key={entry.day}>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            height: `${summary.totalSales ? (entry.total / summary.totalSales) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span>{entry.day.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="chart-card">
                <h2>Orders by status</h2>
                <div className="chart-list">
                  {statusBuckets.map((entry) => (
                    <div className="chart-row" key={entry.status}>
                      <span>{entry.status}</span>
                      <div className="chart-row-track">
                        <div
                          className="chart-row-fill"
                          style={{
                            width: `${visibleOrders.length ? (entry.count / visibleOrders.length) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <strong>{entry.count}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="chart-card">
                <h2>Top products</h2>
                <div className="chart-list">
                  {topProducts.map((entry) => (
                    <div className="chart-row" key={entry.name}>
                      <span>{entry.name}</span>
                      <div className="chart-row-track">
                        <div
                          className="chart-row-fill mint"
                          style={{
                            width: `${topProducts[0]?.quantity ? (entry.quantity / topProducts[0].quantity) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <strong>{entry.quantity}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="admin-columns">
              <section className="admin-panel">
                <h2>Products</h2>
                <div className="admin-filters admin-product-filters">
                  <label>
                    Search product
                    <input
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search by product or category"
                      value={productSearch}
                    />
                  </label>
                  <label>
                    Category
                    <select
                      onChange={(event) => setProductCategoryFilter(event.target.value)}
                      value={productCategoryFilter}
                    >
                      {productCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Availability
                    <select
                      onChange={(event) => setProductAvailabilityFilter(event.target.value)}
                      value={productAvailabilityFilter}
                    >
                      <option value="All">All</option>
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </label>
                </div>
                <p className="password-hint">
                  Showing {filteredProducts.length} of {products.length} products.
                </p>
                <form className="product-form" onSubmit={saveProduct}>
                  <label>
                    Product name
                    <input name="name" onChange={setProductField} required value={productForm.name} />
                  </label>
                  <label>
                    Category
                    <input name="category" onChange={setProductField} required value={productForm.category} />
                  </label>
                  <label>
                    Price
                    <input name="price" onChange={setProductField} required type="number" value={productForm.price} />
                  </label>
                  <label>
                    Image URL
                    <input name="image" onChange={setProductField} required value={productForm.image} />
                  </label>
                  <label>
                    Rating
                    <input
                      max="5"
                      min="1"
                      name="rating"
                      onChange={setProductField}
                      required
                      step="0.1"
                      type="number"
                      value={productForm.rating}
                    />
                  </label>
                  <label className="checkbox-row">
                    <input checked={productForm.isActive} name="isActive" onChange={setProductField} type="checkbox" />
                    Available in shop
                  </label>
                  <button className="wide-btn" disabled={submittingProduct} type="submit">
                    {submittingProduct ? 'Saving...' : productForm.id ? 'Update product' : 'Add product'}
                  </button>
                </form>

                <div className="admin-list">
                  {filteredProducts.map((product) => (
                    <article className="admin-list-card" key={product.id}>
                      <div>
                        <strong>{product.name}</strong>
                        <p>{formatCurrency(product.price)}</p>
                      </div>
                      <div className="inline-actions">
                        <span className={`status-pill ${product.isActive === false ? 'placed' : 'delivered'}`}>
                          {product.isActive === false ? 'Off' : 'On'}
                        </span>
                        <button
                          className="ghost-btn admin-action-btn"
                          onClick={() =>
                            setProductForm({
                              id: product.id,
                              name: product.name,
                              category: product.category,
                              price: String(product.price),
                              image: product.image,
                              rating: String(product.rating || 4.5),
                              isActive: product.isActive !== false,
                              description: product.description || ''
                            })
                          }
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="ghost-btn admin-action-btn"
                          onClick={() =>
                            adminUpsertProduct({
                              sessionToken: session?.token,
                              product: { ...product, isActive: product.isActive === false }
                            }).then(async () => {
                              const response = await adminGetDashboardData(session?.token);
                              setOrders(response.orders || []);
                              setProducts(response.products || []);
                            })
                          }
                          type="button"
                        >
                          {product.isActive === false ? 'Turn on' : 'Turn off'}
                        </button>
                      </div>
                    </article>
                  ))}
                  {!filteredProducts.length && <p className="password-hint">No products match the current filters.</p>}
                </div>
              </section>

              <section className="admin-panel">
                <h2>Orders</h2>
                <div className="admin-list">
                  {visibleOrders.map((order) => (
                    <article className="admin-order-card" key={order.id}>
                      <div className="order-title">
                        <div>
                          <strong>#{order.id.slice(0, 8)}</strong>
                          <p>{formatDate(order.createdAt)}</p>
                        </div>
                        <span className={`status-pill ${String(order.status || 'Placed').toLowerCase()}`}>
                          {order.status || 'Placed'}
                        </span>
                      </div>
                      <p>{order.address}</p>
                      <p>{formatCurrency(order.total)}</p>
                      <ul>
                        {(order.items || []).map((item) => (
                          <li key={item.id}>
                            <span>{item.name}</span>
                            <strong>x{item.quantity}</strong>
                          </li>
                        ))}
                      </ul>
                      <div className="order-actions-grid">
                        <label>
                          Status
                          <select
                            defaultValue={order.status || 'Placed'}
                            onChange={(event) =>
                              changeOrderStatus(order, {
                                status: event.target.value,
                                expectedDeliveryDate: order.expectedDeliveryDate
                                  ? toInputDate(order.expectedDeliveryDate)
                                  : '',
                                note: order.adminNote || ''
                              })
                            }
                          >
                            <option value="Placed">Placed</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </label>
                        <label>
                          Expected delivery
                          <input
                            defaultValue={toInputDate(order.expectedDeliveryDate)}
                            onBlur={(event) =>
                              event.target.value &&
                              changeOrderStatus(order, {
                                status: order.status || 'Placed',
                                expectedDeliveryDate: event.target.value,
                                note: order.adminNote || ''
                              })
                            }
                            type="date"
                          />
                        </label>
                      </div>
                      {savingOrderId === order.id && <p className="password-hint">Saving order update...</p>}
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
