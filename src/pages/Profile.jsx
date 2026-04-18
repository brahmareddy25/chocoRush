import { useEffect, useMemo, useState } from 'react';
import AddressFields from '../components/AddressFields.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createAddressRecord, emptyAddress, normalizeAddressBook, passwordValidationMessage } from '../utils/profile.js';

const emptyAddressForm = {
  ...emptyAddress,
  label: ''
};

export default function Profile() {
  const { user, profile, refreshProfile, updateAccount, saveAddresses } = useAuth();
  const [accountForm, setAccountForm] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addresses, setAddresses] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const providerId = useMemo(() => user?.providerData?.[0]?.providerId || '', [user]);

  useEffect(() => {
    if (user?.uid) {
      refreshProfile(user.uid).catch(() => null);
    }
  }, [user?.uid]);

  useEffect(() => {
    const nextAddresses = normalizeAddressBook(profile?.addresses || []);
    setAccountForm((current) => ({
      ...current,
      name: profile?.name || user?.displayName || '',
      phone: profile?.phone || ''
    }));
    setAddresses(nextAddresses);
    setDefaultAddressId(profile?.defaultAddressId || nextAddresses[0]?.id || '');
  }, [profile, user]);

  function updateAccountField(event) {
    setAccountForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateAddressField(field, nextValue) {
    setAddressForm((current) => ({
      ...current,
      [field]: nextValue
    }));
  }

  function startEditAddress(address) {
    setAddressForm({
      ...emptyAddressForm,
      ...address
    });
    setMessage('');
    setError('');
  }

  function resetAddressForm() {
    setAddressForm(emptyAddressForm);
  }

  async function submitAccount(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (accountForm.newPassword || accountForm.confirmPassword) {
        const validationMessage = passwordValidationMessage(accountForm.newPassword);
        if (validationMessage) {
          throw new Error(validationMessage);
        }
        if (accountForm.newPassword !== accountForm.confirmPassword) {
          throw new Error('Password and confirm password must match.');
        }
      }

      await updateAccount(accountForm);
      setMessage('Profile updated successfully.');
      setAccountForm((current) => ({
        ...current,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      await refreshProfile();
    } catch (err) {
      setError(err.message || 'Could not update your profile.');
    } finally {
      setLoading(false);
    }
  }

  async function submitAddress(event) {
    event.preventDefault();
    setAddressLoading(true);
    setError('');
    setMessage('');

    try {
      const nextAddress = createAddressRecord(addressForm);
      const existingIndex = addresses.findIndex((address) => address.id === nextAddress.id);
      const nextAddresses =
        existingIndex >= 0
          ? addresses.map((address, index) => (index === existingIndex ? nextAddress : address))
          : addresses.concat(nextAddress);

      await saveAddresses({
        addresses: nextAddresses,
        defaultAddressId: defaultAddressId || nextAddress.id,
        phone: accountForm.phone
      });
      setAddresses(normalizeAddressBook(nextAddresses));
      setDefaultAddressId((current) => current || nextAddress.id);
      setMessage(existingIndex >= 0 ? 'Address updated.' : 'Address saved.');
      resetAddressForm();
      await refreshProfile();
    } catch (err) {
      setError(err.message || 'Could not save this address.');
    } finally {
      setAddressLoading(false);
    }
  }

  async function makeDefaultAddress(addressId) {
    setError('');
    setMessage('');
    try {
      await saveAddresses({
        addresses,
        defaultAddressId: addressId,
        phone: accountForm.phone
      });
      setDefaultAddressId(addressId);
      setMessage('Default address updated.');
    } catch (err) {
      setError(err.message || 'Could not update the default address.');
    }
  }

  return (
    <main className="profile-page">
      <section className="profile-shell">
        <div className="section-title">
          <div>
            <p>Your account</p>
            <h1>Profile settings</h1>
          </div>
        </div>

        <div className="admin-columns">
          <form className="profile-form" onSubmit={submitAccount}>
            <label>
              Name
              <input name="name" onChange={updateAccountField} required value={accountForm.name} />
            </label>
            <label>
              Email
              <input disabled value={user?.email || ''} />
            </label>
            <label>
              Phone
              <input name="phone" onChange={updateAccountField} required value={accountForm.phone} />
            </label>

            {providerId === 'password' && (
              <div className="password-panel">
                <h2>Change password</h2>
                <label>
                  Current password
                  <input
                    name="currentPassword"
                    onChange={updateAccountField}
                    type="password"
                    value={accountForm.currentPassword}
                  />
                </label>
                <label>
                  New password
                  <input
                    name="newPassword"
                    onChange={updateAccountField}
                    type="password"
                    value={accountForm.newPassword}
                  />
                </label>
                <label>
                  Confirm password
                  <input
                    name="confirmPassword"
                    onChange={updateAccountField}
                    type="password"
                    value={accountForm.confirmPassword}
                  />
                </label>
              </div>
            )}

            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            <button className="wide-btn" disabled={loading} type="submit">
              {loading ? 'Saving...' : 'Save profile'}
            </button>
          </form>

          <div className="admin-panel">
            <h2>Saved addresses</h2>
            <div className="admin-list">
              {addresses.length ? (
                addresses.map((address) => (
                  <article className="admin-list-card" key={address.id}>
                    <div>
                      <strong>{address.label || 'Address'}</strong>
                      <p>{address.fullAddress}</p>
                    </div>
                    <div className="inline-actions">
                      {defaultAddressId === address.id ? (
                        <span className="status-pill delivered">Default</span>
                      ) : (
                        <button className="ghost-btn" onClick={() => makeDefaultAddress(address.id)} type="button">
                          Make default
                        </button>
                      )}
                      <button className="ghost-btn" onClick={() => startEditAddress(address)} type="button">
                        Edit
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="password-hint">Add your first address. You can choose it during checkout later.</p>
              )}
            </div>

            <form className="profile-form" onSubmit={submitAddress}>
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
              <div className="inline-actions">
                <button className="wide-btn" disabled={addressLoading} type="submit">
                  {addressLoading ? 'Saving...' : addressForm.id ? 'Update address' : 'Add address'}
                </button>
                {addressForm.id && (
                  <button className="ghost-btn" onClick={resetAddressForm} type="button">
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
