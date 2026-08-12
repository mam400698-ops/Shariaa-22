import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Sawa2026..') {
      onLoginSuccess();
      setPassword('');
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('كلمة السر غير صحيحة!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-pink-100 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 to-orange-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">
            تسجيل دخول لوحة التحكم (الإدمن)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            أدخل كلمة السر للوصول لإدارة المواد والفقرات واستيراد الأسئلة.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">كلمة المرور:</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة السر..."
                required
                className="w-full pr-10 pl-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all font-sans"
              />
              {/* SECTION 4.1: Password reveal eye icon toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-pink-600 transition-colors"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-center">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white rounded-2xl font-extrabold text-sm shadow-md btn-press"
          >
            دخول اللوحة
          </button>
        </form>
      </div>
    </div>
  );
};
