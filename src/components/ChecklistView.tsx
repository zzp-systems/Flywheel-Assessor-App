import React from 'react';
import { AssessmentData, ChecklistItem, Status, Tier } from '../types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ChecklistViewProps {
  data: AssessmentData;
  updateStatus: (id: string, status: Status) => void;
  updateNote: (id: string, note: string) => void;
}

export function ChecklistView({ data, updateStatus, updateNote }: ChecklistViewProps) {
  const itemsArray = Object.values(data.items);
  
  const redItems = itemsArray.filter(i => i.tier === 'Red');
  const yellowItems = itemsArray.filter(i => i.tier === 'Yellow');
  const greenItems = itemsArray.filter(i => i.tier === 'Green');
  const slateItems = itemsArray.filter(i => i.tier === 'Slate');

  const renderTier = (title: string, items: ChecklistItem[], colorClass: string, bgColor: string, borderClass: string, desc: string, icon: React.ReactNode) => {
    if (items.length === 0) return null;
    return (
      <div className={`mb-8 bg-white rounded-xl shadow-lg border-2 overflow-hidden ${borderClass}`}>
        <div className={`${bgColor} ${colorClass} p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/10`}>
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider">{title}</h2>
          </div>
          <p className="text-sm opacity-90 font-bold uppercase tracking-wider">{desc}</p>
        </div>
        
        <div className="divide-y-2 divide-gray-100">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`p-5 transition-all ${item.status === 'Fail' ? 'bg-red-50/80' : 'hover:bg-gray-50'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <p className={`text-[15px] sm:text-base font-bold text-gray-900 ${item.tier === 'Red' && item.status === 'Pending' ? 'animate-pulse text-brand-red' : ''}`}>
                    {item.text}
                  </p>
                </div>
                
                <div className="flex bg-gray-200 rounded-lg p-1 w-full sm:w-auto overflow-x-auto flex-shrink-0 shadow-inner no-print">
                  {(['Pass', 'Fail', 'N/A'] as Status[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateStatus(item.id, opt)}
                      className={`flex-1 sm:flex-none px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all border-2 ${
                        item.status === opt 
                          ? opt === 'Pass' ? 'bg-brand-green border-brand-green text-white shadow-md transform scale-[1.02]'
                          : opt === 'Fail' ? 'bg-brand-red border-brand-red text-white shadow-md transform scale-[1.02]'
                          : 'bg-gray-700 border-gray-700 text-white shadow-md transform scale-[1.02]'
                          : 'border-transparent text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="print-only sm:w-24 text-right flex-shrink-0">
                  <span className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded border-2 ${
                    item.status === 'Pass' ? 'border-brand-green text-brand-green' :
                    item.status === 'Fail' ? 'border-brand-red text-brand-red' :
                    'border-gray-500 text-gray-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
              
              {/* Note field, auto expanding on click or if text exists */}
              <div className="mt-4 no-print">
                <input
                  type="text"
                  placeholder="Add note or description (required if failed)..."
                  value={item.note}
                  onChange={(e) => updateNote(item.id, e.target.value)}
                  className={`w-full text-sm font-medium border-2 rounded-lg px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/20 transition-all ${item.status === 'Fail' && !item.note ? 'border-red-400 focus:border-red-500 placeholder-red-400 bg-red-50' : 'border-gray-200 focus:border-brand-navy'}`}
                />
              </div>
              
              {item.note && (
                <div className="print-only mt-3 text-sm font-bold text-gray-800 bg-gray-50 border-l-4 border-gray-300 p-2 pl-4">
                  Note: {item.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderTier(
        "🔴 RED LIGHT", 
        redItems, 
        "text-white", 
        "bg-brand-red", 
        "border-brand-red",
        "LIFE SAFETY - IF ANY ITEM HERE FAILS, NOTIFY MANAGEMENT IMMEDIATELY.",
        <AlertTriangle size={28} strokeWidth={3} className="animate-pulse" />
      )}
      {renderTier(
        "🟡 YELLOW LIGHT", 
        yellowItems, 
        "text-brand-navy-dark", 
        "bg-brand-amber", 
        "border-brand-amber",
        "CONDITION & HABITABILITY - Documentation focus.",
        <div className="w-7 h-7 rounded-full bg-brand-navy-dark text-brand-amber flex items-center justify-center font-black text-xl">!</div>
      )}
      {renderTier(
        "🟢 GREEN LIGHT", 
        greenItems, 
        "text-white", 
        "bg-brand-green", 
        "border-brand-green",
        "RENT-READY VISUALS - Cleanliness & Basics.",
        <CheckCircle2 size={28} strokeWidth={3} />
      )}
      {renderTier(
        "🔑 Access Credentials & Issued Items", 
        slateItems, 
        "text-white", 
        "bg-gray-800", 
        "border-gray-800",
        "Security & Hardware Management.",
        <span className="text-xl">🔑</span>
      )}
    </div>
  );
}
