import React, { useState } from 'react';
import { BookOpen, Bell, Star, Shield, Sparkles, RefreshCw } from 'lucide-react';
import { DBStore } from '../data/dbStore';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onOpenNotifications: () => void;
  onOpenStarred: () => void;
  unreadCount: number;
  starredCount: number;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isAdmin,
  onOpenAdminLogin,
  onOpenNotifications,
  onOpenStarred,
  unreadCount,
  starredCount,
  onResetData,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div
            onClick={() => onNavigate('subjects')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-orange-400 p-0.5 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-pink-600">
                <BookOpen className="w-5 h-5 text-pink-500" />
              </div>
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-pink-600 via-rose-500 to-orange-500 bg-clip-text text-transparent">
                أسئلة كلية الشريعة
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                السنة الثالثة — الفصل الثاني
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Starred Questions Button */}
            <button
              onClick={onOpenStarred}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-pink-600 hover:bg-pink-50 border border-slate-200/80 hover:border-pink-200 transition-all btn-press"
              title="الأسئلة المميزة بنجمة"
            >
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              {starredCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {starredCount}
                </span>
              )}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-200 transition-all btn-press"
              title="الإشعارات والتحديثات"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Admin Panel Link */}
            <button
              onClick={isAdmin ? () => onNavigate('admin') : onOpenAdminLogin}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all btn-press border ${
                isAdmin
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white border-transparent shadow-md shadow-pink-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-pink-50 hover:text-pink-600 border-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{isAdmin ? 'لوحة التحكم' : 'دخول الإدمن'}</span>
            </button>

            {/* Reset App State */}
            <button
              onClick={() => setShowConfirmReset(true)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all text-xs"
              title="إعادة تعيين البيانات الافتراضية"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-pink-100 text-center space-y-4">
            <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">إعادة تعيين التطبيق؟</h3>
            <p className="text-xs text-slate-600">
              سيتم استعادة الأسئلة والمواد الافتراضية الأصلية للسنة الثالثة وإعادة تعيين التقدّم.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onResetData();
                  setShowConfirmReset(false);
                }}
                className="flex-1 py-2.5 bg-pink-600 text-white rounded-xl font-bold text-xs hover:bg-pink-700 btn-press"
              >
                تأكيد الاستعادة
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-xs hover:bg-slate-200 btn-press"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
