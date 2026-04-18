export const emptyAddress = {
  id: '',
  label: '',
  doorNo: '',
  street: '',
  city: '',
  mandal: '',
  district: '',
  state: '',
  pincode: ''
};

export function normalizeAddress(address = {}) {
  return {
    id: String(address.id || '').trim(),
    label: String(address.label || '').trim(),
    doorNo: String(address.doorNo || '').trim(),
    street: String(address.street || '').trim(),
    city: String(address.city || '').trim(),
    mandal: String(address.mandal || '').trim(),
    district: String(address.district || '').trim(),
    state: String(address.state || '').trim(),
    pincode: String(address.pincode || '').trim()
  };
}

export function formatFullAddress(address = {}) {
  const { id, label, ...addressWithoutMeta } = normalizeAddress(address);
  return Object.values(addressWithoutMeta)
    .filter(Boolean)
    .join(', ');
}

export function isAddressComplete(address = {}) {
  const { id, label, ...addressWithoutMeta } = normalizeAddress(address);
  return Object.values(addressWithoutMeta).every(Boolean);
}

export function createAddressRecord(address = {}) {
  const normalized = normalizeAddress(address);
  return {
    ...normalized,
    id: normalized.id || `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label: normalized.label || normalized.city || 'Saved address',
    fullAddress: formatFullAddress(normalized)
  };
}

export function normalizeAddressBook(addresses = []) {
  return Array.isArray(addresses) ? addresses.map((address) => createAddressRecord(address)) : [];
}

export function calculateCheckoutSummary(subtotal = 0, paymentMethod = 'online') {
  const gst = Number((subtotal * 0.018).toFixed(2));
  const deliveryCharge = 60;
  const codCharge = paymentMethod === 'cod' ? 10 : 0;
  const finalAmount = Number((subtotal + gst + deliveryCharge + codCharge).toFixed(2));

  return {
    subtotal,
    gst,
    deliveryCharge,
    codCharge,
    finalAmount
  };
}

export function passwordValidationMessage(password = '') {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/\d/.test(password)) return 'Password must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character.';
  return '';
}

export function isStrongPassword(password = '') {
  return passwordValidationMessage(password) === '';
}
