import React, { useState, useEffect } from 'react';
import { InspectionData } from '../types';
import { FileDown, RefreshCcw } from 'lucide-react';

interface DeltaReportProps {
  data: InspectionData;
  onImportBaseline: (json: string) => void;
  onUpdateCost: (id: string, cost: number) => void;
}

export function DeltaReport({ data, onImportBaseline, onUpdateCost }: DeltaReportProps) {
  const [localCosts, setLocalCosts] = useState<Record<string, string>>({});
  const [inputErrors, setInputErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Sync local state when external data changes
    if (data.deltaItems) {
      const costs: Record<string, string> = {};
      Object.keys(data.deltaItems).forEach(key => {
        const val = data.deltaItems![key].repairCostEstimate;
        if (!localCosts[key] || (parseFloat(localCosts[key]) !== val)) {
          costs[key] = val ? val.toString() : '';
        } else {
          costs[key] = localCosts[key];
        }
      });
      setLocalCosts(prev => ({...prev, ...costs}));
    }
  }, [data.deltaItems]);

  if (data.type !== 'Move-Out') return null;

  const handleImport = () => {
    const userInput = prompt('Paste the Move-In Baseline JSON output here:');
    if (userInput) {
      onImportBaseline(userInput);
    }
  };

  const handleCostChange = (id: string, value: string) => {
    setLocalCosts(prev => ({ ...prev, [id]: value }));
    if (value === '') {
      onUpdateCost(id, 0);
      setInputErrors(prev => ({ ...prev, [id]: false }));
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      onUpdateCost(id, num);
      setInputErrors(prev => ({ ...prev, [id]: false }));
    } else {
      setInputErrors(prev => ({ ...prev, [id]: true }));
    }
  };

  const totalDeteriorated = data.deltaItems ? Object.values(data.deltaItems).filter(i => i.isDeteriorated).length : 0;
  const totalClaim = data.deltaItems 
    ? Object.values(data.deltaItems).reduce((sum, item) => sum + (item.repairCostEstimate || 0), 0)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 mb-8 no-print">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b-4 border-gray-100">
        <div>
          <h3 className="text-2xl font-display font-black text-brand-navy flex items-center gap-3 uppercase tracking-widest">
            <RefreshCcw size={24} strokeWidth={3} /> Move-Out Delta Report
          </h3>
          <p className="text-sm font-bold text-gray-500 mt-1">Compare against Move-In Baseline to calculate damage claims.</p>
        </div>
        
        <button 
          onClick={handleImport}
          className="bg-brand-navy text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-brand-navy-light flex items-center gap-2 transform transition-all hover:-translate-y-1 shadow-md"
        >
          <FileDown size={18} strokeWidth={2.5} /> IMPORT BASELINE JSON
        </button>
      </div>

      {!data.deltaItems ? (
        <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold text-sm">
          No baseline data imported yet. Import a previous JSON report to see condition changes.
        </div>
      ) : (
        <div>
          <div className="bg-red-50 text-brand-red p-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center text-sm md:text-base font-black uppercase tracking-wider border-2 border-red-200 shadow-sm gap-2">
            <span>Deteriorated Items: {totalDeteriorated}</span>
            <span className="bg-brand-red text-white px-4 py-1.5 rounded shadow-inner">Total Claim Est: ${totalClaim.toFixed(2)}</span>
          </div>

          <div className="space-y-4">
            {Object.values(data.deltaItems).filter(i => i.isDeteriorated).map(item => (
              <div key={item.id} className="border-l-4 border-l-brand-red border-y-2 border-r-2 border-gray-200 rounded-r-lg p-5 bg-white flex flex-col md:flex-row justify-between md:items-center gap-5 shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-brand-red text-white text-[11px] font-black px-2.5 py-1 rounded uppercase tracking-widest shadow-sm">Deteriorated</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">From {item.baselineStatus} to {item.status}</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">{item.text}</p>
                </div>
                <div className="w-full md:w-40 flex-shrink-0 bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wide">Repair Est. ($)</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={localCosts[item.id] !== undefined ? localCosts[item.id] : ''}
                    onChange={(e) => handleCostChange(item.id, e.target.value)}
                    className={`w-full bg-white border-2 rounded-md px-3 py-2 text-base font-bold focus:ring-4 focus:outline-none transition-all ${
                      inputErrors[item.id] 
                        ? 'border-red-500 focus:ring-red-500/20 text-red-600' 
                        : 'border-gray-300 focus:ring-brand-navy/10 focus:border-brand-navy'
                    }`}
                  />
                  {inputErrors[item.id] && (
                    <p className="text-[10px] text-red-500 font-bold mt-1.5 uppercase leading-tight">Must be positive number</p>
                  )}
                </div>
              </div>
            ))}

            {totalDeteriorated === 0 && (
              <div className="text-center py-6 text-brand-green font-black uppercase tracking-widest bg-green-50 rounded-lg border-2 border-green-200 shadow-sm">
                No deteriorated items found based on identical item text matches.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
