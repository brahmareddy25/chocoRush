import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { passwordValidationMessage } from '../utils/profile.js';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
};

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  if (user) return <Navigate replace to={redirectTo} />;

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function switchMode() {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
    setError('');
    setForm(initialForm);
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const validationMessage = passwordValidationMessage(form.password);
        if (validationMessage) {
          throw new Error(validationMessage);
        }
        if (form.password !== form.confirmPassword) {
          throw new Error('Password and confirm password must match.');
        }

        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-wide">
        <p>Welcome back</p>
        <h1>{mode === 'login' ? 'Login to keep your cart warm.' : 'Create your NutBliss account.'}</h1>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label>
                Name
                <input name="name" onChange={updateField} required value={form.name} />
              </label>
              <label>
                Email
                <input name="email" onChange={updateField} required type="email" value={form.email} />
              </label>
            </>
          )}
          {mode === 'login' && (
            <label>
              Email
              <input name="email" onChange={updateField} required type="email" value={form.email} />
            </label>
          )}
          <label>
            Password
            <input name="password" onChange={updateField} required type="password" value={form.password} />
          </label>
          {mode === 'register' && (
            <>
              <label>
                Confirm password
                <input
                  name="confirmPassword"
                  onChange={updateField}
                  required
                  type="password"
                  value={form.confirmPassword}
                />
              </label>
              <p className="password-hint">Minimum 8 characters with lowercase, uppercase, number, and special character.</p>
            </>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="wide-btn" disabled={loading} type="submit">
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
        <button className="text-btn" onClick={switchMode} type="button">
          {mode === 'login' ? 'New here? Create account' : 'Already have an account? Login'}
        </button>
      </section>
    </main>
  );
}
