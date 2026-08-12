import React from 'react';
import { X, Bell, Calendar, Sparkles, BookOpen, ArrowLeft } from 'lucide-react';
import { ChangeLog, Paragraph } from '../types';
import { DBStore } from '../data/dbStore';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ChangeLog[];
  paragraphs: Paragraph[];
  onSelectParagraph: (paragraphId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  paragraphs,
  onSelectParagraph,
}) => {
  if (!isOpen) return null;

  const visits = DBStore.getLastVisitedParagraphs();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 left-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-r border-pink-100 flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base">سجل التحديثات والتعديلات</h2>
                <p className="text-xs text-white/80">آخر التعديلات المضافة للأسئلة والفقرات</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Bell className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-medium">لا يوجد إشعارات سابقة حتى الآن</p>
              </div>
            ) : (
              logs.map(log => {
                const para = paragraphs.find(p => p.id === log.paragraphId);
                const lastVisit = visits[log.paragraphId];
                const isNew = !lastVisit || new Date(log.timestamp) > new Date(lastVisit);

                return (
                  <div
                    key={log.id}
                    onClick={() => {
                      onSelectParagraph(log.paragraphId);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer btn-press ${
                      isNew
                        ? 'bg-pink-50/60 border-pink-200 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-pink-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        {log.subjectName}
                      </span>
                      {isNew && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" /> جديد
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">
                      {log.paragraphTitle}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      {log.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-pink-600 font-bold flex items-center gap-1">
                        الانتقال للفقرة <ArrowLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
