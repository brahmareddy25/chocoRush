import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { adminLogin } from '../api/admin.js';
import { useAdmin } from '../context/AdminContext.jsx';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAdmin, loginAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/admin';

  if (isAdmin) return <Navigate replace to={redirectTo} />;

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminLogin(form);
      loginAdmin(response);
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p>Admin access</p>
        <h1>Sign in to manage ChocoRush.</h1>
        <form onSubmit={submit}>
          <label>
            Username
            <input name="username" onChange={updateField} required value={form.username} />
          </label>
          <label>
            Password
            <input name="password" onChange={updateField} required type="password" value={form.password} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="wide-btn" disabled={loading} type="submit">
            <LockKeyhole size={16} />
            {loading ? 'Checking...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
}
