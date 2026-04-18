const fieldConfig = [
  { key: 'doorNo', label: 'D.No' },
  { key: 'street', label: 'Street name', wide: true },
  { key: 'city', label: 'Village or city name' },
  { key: 'mandal', label: 'Mandal' },
  { key: 'district', label: 'District' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pincode', wide: true }
];

export default function AddressFields({ value, onChange, required = false }) {
  return (
    <div className="address-grid">
      {fieldConfig.map((field) => (
        <label className={field.wide ? 'address-field wide' : 'address-field'} key={field.key}>
          {field.label}
          <input
            name={field.key}
            onChange={(event) => onChange(event.target.name, event.target.value)}
            required={required}
            value={value[field.key] || ''}
          />
        </label>
      ))}
    </div>
  );
}
