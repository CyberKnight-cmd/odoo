import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle, LogOut, Mail, Phone, Activity, Users, Settings, Briefcase, MapPin, Navigation, TrendingUp, ShieldCheck, Server, PlayCircle, Star } from 'lucide-react';
import NetworkScene from './components/NetworkScene';

// Single source of truth for backend API prefix!
// All backend routes will use this prefix.
const API_BASE = '';

// ─── AUTO-REFRESH FETCH WRAPPER ────────────────────────────────
// Use this function instead of fetch() for any protected API calls.
// It automatically handles 401/403 errors, refreshes the token, and retries the request!
export async function fetchWithAuth(url, options = {}, navigate) {
  let accessToken = localStorage.getItem('accessToken');
  
  if (!options.headers) options.headers = {};
  if (accessToken) options.headers['Authorization'] = `Bearer ${accessToken}`;
  
  let res = await fetch(url, options);
  
  // If token is expired or unauthorized
  if (res.status === 401 || res.status === 403) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          }
        });
        
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data.accesstoken) {
            localStorage.setItem('accessToken', data.accesstoken);
            if (data.refreshtoken) localStorage.setItem('refreshToken', data.refreshtoken);
            
            // Retry the original request with the NEW token
            options.headers['Authorization'] = `Bearer ${data.accesstoken}`;
            res = await fetch(url, options);
            return res;
          }
        }
      } catch (err) {
        console.error("Auto-refresh failed", err);
      }
    }
    // If refresh fails or no refresh token exists, boot them out
    localStorage.clear();
    if (navigate) navigate('/login');
  }
  
  return res;
}


// ─── LOGIN PAGE ──────────────────────────────────────────────
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [phno, setPhno] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phno, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.message || 'Login failed');
      if (!data.accesstoken) throw new Error('No access token received from server');

      localStorage.setItem('accessToken', data.accesstoken);
      localStorage.setItem('refreshToken', data.refreshtoken);
      if (data.role) localStorage.setItem('userRole', data.role.toLowerCase());
      
      navigate('/dashboard');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-slate-200 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-slate-400">Sign in to access your dashboard</p>
        </div>
        
        {status.message && (
          <div className="p-4 rounded-2xl mb-6 bg-red-500/10 text-red-400 border border-red-500/20 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" /></div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all" placeholder="Email Address" required />
            </div>
          </div>
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" /></div>
              <input type="text" value={phno} onChange={(e) => setPhno(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all" placeholder="Phone Number" required />
            </div>
          </div>
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" /></div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all" placeholder="Password" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-slate-200 py-4 rounded-2xl font-bold mt-8 transition-all disabled:opacity-50">
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link to="/signup" className="text-slate-400 hover:text-white text-sm transition-colors">Don't have an account? <span className="font-semibold text-blue-400">Sign up</span></Link>
        </div>
      </div>
    </div>
  );
}

// ─── SIGNUP PAGE ──────────────────────────────────────────────
function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phno, setPhno] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phno, email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.message || 'Signup failed');
      
      setStatus({ type: 'success', message: data.status || 'Entry successful! Please log in.' });
      setTimeout(() => navigate('/login'), 1500);
      
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-slate-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-slate-400">Join our platform today</p>
        </div>
        
        {status.message && (
          <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" /></div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all" placeholder="Full Name" required />
            </div>
          </div>
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" /></div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all" placeholder="Email Address" required />
            </div>
          </div>
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" /></div>
              <input type="text" value={phno} onChange={(e) => setPhno(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all" placeholder="Phone Number" required />
            </div>
          </div>
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" /></div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all" placeholder="Password" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold mt-8 transition-all disabled:opacity-50">
            {loading ? 'Creating...' : 'Sign Up'} <ArrowRight size={18} />
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Already have an account? <span className="font-semibold text-indigo-400">Log in</span></Link>
        </div>
      </div>
    </div>
  );
}

import { AdminDashboard } from './pages/AdminDashboard';
import { UserDashboard } from './pages/UserDashboard';
import { LandingPage } from './pages/Landing';

// ─── DASHBOARD ROUTER ─────────────────────────────────────────
// This component automatically picks the right dashboard based on role
function DashboardRouter() {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');
  const role = localStorage.getItem('userRole'); // 'admin' or 'user' (or missing)

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    // We use our awesome fetchWithAuth! If the access token is expired, 
    // it will seamlessly refresh the token FIRST, then hit /logout.
    await fetchWithAuth('/auth/logout', { method: 'POST' }, navigate).catch(() => {});
    
    // Always clear storage and redirect
    localStorage.clear();
    navigate('/login');
  };

  if (role === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }
  
  return <UserDashboard onLogout={handleLogout} />;
}

// ─── APP ROUTER ──────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* We now serve the LandingPage at the root instead of redirecting to login */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
