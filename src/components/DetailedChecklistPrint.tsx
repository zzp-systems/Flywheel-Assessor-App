import React from 'react';
import { AssessmentData } from '../types';

export function DetailedChecklistPrint({ data }: { data: AssessmentData }) {
  const tiers = [
    { id: 'Red', name: 'RED LIGHT TIER (CRITICAL)', color: '#DC2626', bg: '#fef2f2' },
    { id: 'Yellow', name: 'YELLOW LIGHT TIER (MODERATE)', color: '#F59E0B', bg: '#fffbeb' },
    { id: 'Green', name: 'GREEN LIGHT TIER (MINOR/COSMETIC)', color: '#059669', bg: '#ecfdf5' },
    { id: 'Slate', name: 'ACCESS CREDENTIALS & ISSUED ITEMS', color: '#1F2937', bg: '#f3f4f6' }
  ];

  return (
    <div className="print-only page-break mt-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold bg-brand-navy text-white p-2 mb-1 font-display">DETAILED ASSESSMENT CHECKLIST</h3>
        <p className="text-sm font-bold text-gray-600 px-2 italic">Complete Item-by-Assessment Results</p>
      </div>

      <div className="space-y-6">
        {tiers.map(tier => {
          const items = Object.values(data.items).filter(item => item.tier === tier.id);
          if (items.length === 0) return null;

          return (
            <div key={tier.id} className="page-break-inside-avoid">
              <h4 
                className="font-bold p-2 text-white text-sm tracking-wider uppercase mb-2" 
                style={{ backgroundColor: tier.color }}
              >
                {tier.name}
              </h4>
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left w-1/2">Item Name</th>
                    <th className="border border-gray-300 p-2 text-center w-24">Status</th>
                    <th className="border border-gray-300 p-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const itemNameMatch = item.text.split('—');
                    const itemName = itemNameMatch.length > 1 ? itemNameMatch[0].trim() : item.text;
                    const itemDesc = itemNameMatch.length > 1 ? itemNameMatch[1].trim() : '';

                    return (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-2">
                          <strong className="block">{itemName}</strong>
                          {itemDesc && <span className="text-xs text-gray-600 block mt-1">{itemDesc}</span>}
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-bold">
                          {item.status === 'Pass' && <span className="text-brand-green">✓ Pass</span>}
                          {item.status === 'Fail' && <span className="text-brand-red">✗ Fail</span>}
                          {item.status === 'N/A' && <span className="text-gray-400">N/A</span>}
                          {item.status === 'Pending' && <span className="text-gray-300">—</span>}
                        </td>
                        <td className="border border-gray-300 p-2 italic text-gray-700">
                          {item.note || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
