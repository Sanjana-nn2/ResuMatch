import React, { useState } from 'react';
import {
  User,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import api, { getFriendlyErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ initialRegisterMode = false, onAuthSuccess = null }) {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(initialRegisterMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode ? { email, password, fullName } : { email, password };

    try {
      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto space-y-6 pb-24">
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 mx-auto flex items-center justify-center text-[#10B981]">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-heading font-bold text-xl text-[#F9FAFB]">
              {user.fullName || user.full_name || 'Member'}
            </h3>
            <p className="text-xs text-[#9CA3AF] font-mono mt-0.5">
              {user.email}
            </p>
          </div>

          <div className="bg-[#0B0F19] rounded-xl p-3.5 border border-[#1E293B] text-xs text-left space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">
              Active Account Benefits
            </span>
            <div className="space-y-1.5 text-[#E5E7EB]">
              <p className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Unlimited ATS Match Analyses</span>
              </p>
              <p className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Saved Match History & Score Progression</span>
              </p>
              <p className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>PDF Summary Report Exports</span>
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-xs font-semibold text-[#EF4444] border border-[#374151] flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24">
      <div className="text-center space-y-1">
        <h2 className="font-heading font-bold text-2xl text-[#F9FAFB]">
          {isRegisterMode ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-xs text-[#9CA3AF]">
          {isRegisterMode
            ? 'Sign up to store resumes, save analyses, and track your score trends.'
            : 'Sign in to access your saved resume analyses and score history.'}
        </p>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 text-[#F87171] shadow-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 shadow-xl space-y-4">
        {isRegisterMode && (
          <div>
            <label className="text-xs font-medium text-[#9CA3AF] block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#10B981] rounded-xl px-3 py-2.5 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-[#9CA3AF] block mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#10B981] rounded-xl px-3 py-2.5 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[#9CA3AF] block mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#10B981] rounded-xl px-3 py-2.5 text-xs text-[#F9FAFB] placeholder-[#4B5563] outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] py-3 rounded-xl font-heading font-bold text-sm bg-[#10B981] hover:bg-[#059669] text-[#0B0F19] flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#10B981]/20"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRegisterMode ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
            }}
            className="text-xs text-[#10B981] hover:underline cursor-pointer"
          >
            {isRegisterMode
              ? 'Already have an account? Sign in'
              : "Don't have an account yet? Create one"}
          </button>
        </div>
      </form>
    </div>
  );
}
