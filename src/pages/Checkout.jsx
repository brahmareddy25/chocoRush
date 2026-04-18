import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { createOrder } from '../api/orders.js';
import AddressFields from '../components/AddressFields.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/format.js';
import {
  calculateCheckoutSummary,
  createAddressRecord,
  emptyAddress,
  formatFullAddress,
  normalizeAddressBook
} from '../utils/profile.js';

const emptyAddressForm = {
  ...emptyAddress,
  label: ''
};

export default function Checkout() {
  const { profile, saveAddresses } = useAuth();
  const { items, total, clearCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedAddresses = normalizeAddressBook(profile?.addresses || []);
    setAddresses(savedAddresses);
    setSelectedAddressId(profile?.defaultAddressId || savedAddresses[0]?.id || '');
    setPhone(profile?.phone || '');
  }, [profile]);

  const normalizedItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
    [items]
  );

  const pricing = useMemo(() => calculateCheckoutSummary(total, paymentMethod), [total, paymentMethod]);
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  if (!items.length) return <Navigate replace to="/" />;

  function updateAddressField(field, value) {
    setAddressForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function resolveAddressForOrder() {
    if (!phone.trim()) {
      throw new Error('Phone number is required.');
    }

    if (!useNewAddress) {
      if (!selectedAddress) {
        throw new Error('Select a saved address or add a new address.');
      }
      await saveAddresses({
        addresses,
        defaultAddressId: selectedAddress.id,
        phone
      });
      return selectedAddress;
    }

    const nextAddress = createAddressRecord(addressForm);
    const nextAddresses = addresses.concat(nextAddress);
    await saveAddresses({
      addresses: nextAddresses,
      defaultAddressId: nextAddress.id,
      phone
    });
    setAddresses(nextAddresses);
    setSelectedAddressId(nextAddress.id);
    setUseNewAddress(false);
    setAddressForm(emptyAddressForm);
    return nextAddress;
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resolvedAddress = await resolveAddressForOrder();
      const fullAddress = resolvedAddress.fullAddress || formatFullAddress(resolvedAddress);

      const response = await createOrder({
        items: normalizedItems,
        pricing,
        addressFields: resolvedAddress,
        address: fullAddress,
        phone,
        paymentMethod,
      });

      clearCart();
      navigate(`/success/${response.orderId}`);
    } catch (err) {
      setError(err.message || 'Unable to place order right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="checkout-page">
      <section className="checkout-form">
        <p>Secure checkout</p>
        <h1>Finish your chocolate run</h1>
        <form onSubmit={placeOrder}>
          <div className="payment-toggle">
            <button
              className={paymentMethod === 'online' ? 'active' : ''}
              onClick={() => setPaymentMethod('online')}
              type="button"
            >
              Pay online
            </button>
            <button
              className={paymentMethod === 'cod' ? 'active' : ''}
              onClick={() => setPaymentMethod('cod')}
              type="button"
            >
              Cash on delivery
            </button>
          </div>

          <label>
            Phone
            <input onChange={(event) => setPhone(event.target.value)} minLength="10" required value={phone} />
          </label>

          <div className="address-choice">
            <label className="checkbox-row">
              <input
                checked={!useNewAddress}
                name="savedAddress"
                onChange={() => setUseNewAddress(false)}
                type="radio"
              />
              Use saved address
            </label>
            <label className="checkbox-row">
              <input
                checked={useNewAddress}
                name="savedAddress"
                onChange={() => setUseNewAddress(true)}
                type="radio"
              />
              Add new address
            </label>
          </div>

          {!useNewAddress ? (
            <div className="admin-list">
              {addresses.length ? (
                addresses.map((address) => (
                  <label className="saved-address-card" key={address.id}>
                    <input
                      checked={selectedAddressId === address.id}
                      name="selectedAddress"
                      onChange={() => setSelectedAddressId(address.id)}
                      type="radio"
                    />
                    <div>
                      <strong>{address.label}</strong>
                      <p>{address.fullAddress}</p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="password-hint">No saved addresses yet. Add one now for this order.</p>
              )}
            </div>
          ) : (
            <>
              <label>
                Address label
                <input
                  name="label"
                  onChange={(event) => updateAddressField('label', event.target.value)}
                  placeholder="Home, Office, Hostel"
                  required
                  value={addressForm.label}
                />
              </label>
              <AddressFields onChange={updateAddressField} required value={addressForm} />
            </>
          )}

          {error && <p className="form-error">{error}</p>}
          <button className="wide-btn" disabled={loading} type="submit">
            {loading
              ? paymentMethod === 'cod'
                ? 'Placing order...'
                : 'Starting payment...'
              : paymentMethod === 'cod'
                ? `Place COD order for ${formatCurrency(pricing.finalAmount)}`
                : `Pay ${formatCurrency(pricing.finalAmount)}`}
          </button>
        </form>
        <span className="secure-note">
          <ShieldCheck size={18} />
          Local checkout is enabled for testing, with both COD and online orders saved directly in Django.
        </span>
      </section>

      <aside className="checkout-summary">
        <h2>Order summary</h2>
        {items.map((item) => (
          <div className="summary-line" key={item.id}>
            <span>
              {item.name} x {item.quantity}
            </span>
            <strong>{formatCurrency(item.price * item.quantity)}</strong>
          </div>
        ))}
        <div className="summary-line">
          <span>Subtotal</span>
          <strong>{formatCurrency(pricing.subtotal)}</strong>
        </div>
        <div className="summary-line">
          <span>GST 1.8%</span>
          <strong>{formatCurrency(pricing.gst)}</strong>
        </div>
        <div className="summary-line">
          <span>Delivery charges</span>
          <strong>{formatCurrency(pricing.deliveryCharge)}</strong>
        </div>
        {paymentMethod === 'cod' && (
          <div className="summary-line">
            <span>Cash on delivery fee</span>
            <strong>{formatCurrency(pricing.codCharge)}</strong>
          </div>
        )}
        <div className="summary-total">
          <span>Final amount</span>
          <strong>{formatCurrency(pricing.finalAmount)}</strong>
        </div>
      </aside>
    </main>
  );
}
