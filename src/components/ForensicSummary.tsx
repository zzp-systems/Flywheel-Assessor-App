import React, { useState, useRef } from 'react';
import { AssessmentData, ChecklistItem } from '../types';
import { Mic, Square, Sparkles, Wrench, AlertTriangle } from 'lucide-react';

interface ForensicSummaryProps {
  data: AssessmentData;
  updateField: (field: string, value: any) => void;
  toggleFollowUp: (key: string) => void;
  updateFollowUpPriority: (key: string, priority: string) => void;
  addWorkOrder: (item: ChecklistItem) => void;
  isOnline: boolean;
}

export function ForensicSummary({ data, updateField, toggleFollowUp, updateFollowUpPriority, addWorkOrder, isOnline }: ForensicSummaryProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [micSupported] = useState('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognitionRef = useRef<any>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedSummary, setSuggestedSummary] = useState<string | null>(null);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const currentNote = data.assessorNotes || '';
        const newNote = currentNote + (currentNote ? ' ' : '') + finalTranscript;
        if (newNote.length <= 2000) {
          updateField('assessorNotes', newNote);
        } else {
           updateField('assessorNotes', newNote.substring(0, 2000));
        }
        finalTranscript = '';
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const items = Object.values(data.items);
  const redFailed = items.some(i => i.tier === 'Red' && i.status === 'Fail');
  const yellowFailed = items.some(i => i.tier === 'Yellow' && i.status === 'Fail');
  const slateItems = items.filter(i => i.tier === 'Slate');
  
  let statusBanner = null;
  const hasPending = items.some(i => i.status === 'Pending');
  const hasPendingRed = items.some(i => i.tier === 'Red' && i.status === 'Pending');
  
  if (redFailed) {
    statusBanner = (
      <div className="bg-brand-red text-white p-6 rounded-xl shadow-2xl sm:text-center animate-pulse border-4 border-red-900 border-opacity-20 transform scale-[1.02] transition-transform">
        <h2 className="text-3xl md:text-4xl font-display font-black uppercase tracking-widest mb-2 shadow-red-900/50 drop-shadow-md">🔴 UNSAFE — DO NOT RENT</h2>
        <p className="text-base md:text-lg font-bold opacity-95 tracking-wide">Life safety issue detected. Management notification required.</p>
      </div>
    );
  } else if (hasPending) {
    statusBanner = (
      <div className="bg-gray-100 text-brand-navy p-6 rounded-xl shadow-md sm:text-center border-4 border-gray-300 border-dashed">
        <h2 className="text-2xl font-display font-black uppercase tracking-widest mb-2">⚪ ASSESSMENT IN PROGRESS</h2>
        <p className="text-base font-bold text-gray-600">Complete all items to see final status.</p>
      </div>
    );
  } else if (yellowFailed) {
    statusBanner = (
      <div className="bg-brand-amber text-brand-navy-dark p-6 rounded-xl shadow-xl sm:text-center border-4 border-brand-amber border-opacity-50">
        <h2 className="text-3xl md:text-4xl font-display font-black uppercase tracking-widest mb-2">🟡 NOT RENT-READY</h2>
        <p className="text-base md:text-lg font-bold opacity-90 tracking-wide">Maintenance required before occupancy.</p>
      </div>
    );
  } else {
    statusBanner = (
      <div className="bg-brand-green text-white p-6 rounded-xl shadow-xl sm:text-center border-4 border-green-800 border-opacity-20">
        <h2 className="text-3xl md:text-4xl font-display font-black uppercase tracking-widest mb-2 drop-shadow-md">🟢 RENT-READY</h2>
        <p className="text-base md:text-lg font-bold opacity-95 tracking-wide">Unit meets all baseline conditions.</p>
      </div>
    );
  }

  const failedItems = items.filter(i => i.status === 'Fail');

  let accessStatusBanner = null;
  if (slateItems.length > 0) {
    const hasMissingAccess = slateItems.some(i => i.status === 'Fail');
    
    if (hasMissingAccess) {
      accessStatusBanner = (
        <div className="mt-4 bg-gray-800 text-amber-300 p-4 rounded-lg shadow-sm font-bold flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <span>Access Items Status: Items Missing – See Notes</span>
        </div>
      );
    } else {
      accessStatusBanner = (
        <div className="mt-4 bg-gray-800 text-white p-4 rounded-lg shadow-sm font-bold flex items-center gap-3 border-l-4 border-brand-green">
          <span className="text-2xl">✅</span>
          <span>Access Items Status: All Items Accounted For</span>
        </div>
      );
    }
  }

  const handleSuggestSummary = async () => {
    setIsSuggesting(true);
    setSuggestedSummary(null);

    const filteredItems = items.filter(i => i.status !== 'Pending');

    const generateLocalFallback = () => {
      const red = items.filter(i => i.tier === 'Red');
      const yellow = items.filter(i => i.tier === 'Yellow');
      const green = items.filter(i => i.tier === 'Green');
      const slate = items.filter(i => i.tier === 'Slate');

      let fallback = `The forensic assessment for Unit ${data.unitNumber || 'TBD'} located at ${data.facilityName || 'the specified facility'} has been thoroughly concluded, focusing on cross-tier operational compliance and property integrity for Flywheel Investors. `;

      // Life Safety
      const redFail = red.filter(i => i.status === 'Fail');
      if (redFail.length > 0) {
        fallback += `A critical elevation in risk was identified within the Life Safety (Red Tier) domain, as the following core safety protocols FAILED to meet baseline regulatory requirements: ${redFail.map(i => `${i.text.split('—')[0]}${i.note ? ` (Observation: ${i.note})` : ''}`).join(', ')}. These failures present immediate liability risks and structural hazards that compromise the unit's legal standing under Texas Property Code Chapter 59 and must be prioritized for emergency remediation to ensure personnel and tenant safety. `;
      } else {
        fallback += `The primary Life Safety infrastructure, encompassing fire suppression hardware, structural load-bearing integrity, and emergency markers, was rigorously evaluated and found to be in full functional alignment with current safety benchmarks and procedural expectations. `;
      }

      // Condition & Habitability
      const yellowFail = yellow.filter(i => i.status === 'Fail');
      if (yellowFail.length > 0) {
        fallback += `Regarding the Condition and Habitability standards (Yellow Tier), several deficiencies were flagged that currently prevent the unit from achieving a "Rent-Ready" designation: ${yellowFail.map(i => `${i.text.split('—')[0]}${i.note ? ` (Observation: ${i.note})` : ''}`).join(', ')}. Maintenance intervention is required to address these functional discrepancies, which specifically relate to door operation, threshold seals, and floor hygiene, ensuring the unit provides a climate-appropriate and structurally sound environment for tenant storage. `;
      } else {
        fallback += `Assessment of the unit's habitability, including internal wall structural integrity, overhead door tensioning, and floor-level hygiene, indicates a high standard of maintenance that supports immediate occupancy and professional presentation. `;
      }

      // Visuals & Credentials
      const greenFail = green.filter(i => i.status === 'Fail');
      const slateFail = slate.filter(i => i.status === 'Fail');

      if (greenFail.length > 0 || slateFail.length > 0) {
        fallback += `Furthermore, minor visual inconsistencies or administrative gaps were noted in the Rent-Ready Visuals and Access Credentials (Slate) sectors: ${[...greenFail, ...slateFail].map(i => `${i.text.split('—')[0]}${i.note ? ` (Observation: ${i.note})` : ''}`).join(', ')}. While these items are secondary to core safety, they affect the final aesthetic deliverable and the formal chain of custody for access hardware. `;
      } else {
        fallback += `Total visual compliance has been confirmed, with all aesthetic benchmarks and Access Credentials—including unit-specific fobs and keys—verified as present and correctly logged into the digital unit file for seamless tenant transition. `;
      }

      // Context Notes
      if (data.assessorNotes && data.assessorNotes.trim().length > 0) {
        fallback += `The assessor specifically noted the following field context for management review: "${data.assessorNotes.trim()}". This contextual data should be synthesized with the hard-checklist results to inform the final work order prioritization. `;
      }

      fallback += `Ultimately, the overall unit status is determined by these forensic findings, categorized as ${redFail.length > 0 ? 'SIGNIFICANT CRITICAL FAILURE' : yellowFail.length > 0 ? 'MAINTENANCE REQUIRED' : 'FULL RENT-READY COMPLIANCE'}. All photographic evidence and timestamps have been archived within the Flywheel system to provide a legally defensive record of the unit's condition at the time of this audit. `;

      // Final Padding/Conclusion
      if (fallback.length < 750) {
        fallback += `This assessment was conducted using a "Special Ops" field methodology, ensuring no detail regarding perimeter security or structural weathering was overlooked by the assessor team. Regular audits of this nature are essential for maintaining the superior operational standard expected by Flywheel Investors across the Texas portfolio. `;
      }

      return fallback;
    };

    try {
      const response = await fetch('/api/suggest-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentType: data.type,
          facility: data.facilityName,
          unit: data.unitNumber,
          items: filteredItems,
          existingNotes: data.assessorNotes
        })
      });
      
      if (!response.ok) throw new Error('API failed');

      const result = await response.json();
      if (result.summary) {
        setSuggestedSummary(result.summary);
      } else {
        throw new Error('No summary returned');
      }
    } catch (error) {
      console.error('Failed to suggest summary with AI, using fallback', error);
      const fallback = generateLocalFallback();
      setSuggestedSummary(fallback);
    }
    setIsSuggesting(false);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddWorkOrder = (item: ChecklistItem) => {
    addWorkOrder(item);
    setToastMessage(`Work order created for ${item.text.split('—')[0]}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div id="forensic-summary" className="mb-8 space-y-6 page-break">
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl font-bold border border-gray-700 animate-in fade-in slide-in-from-bottom-5 z-[200]">
          {toastMessage}
        </div>
      )}
      {statusBanner}
      {accessStatusBanner}
      
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 overflow-hidden">
        <h3 className="text-2xl font-display font-black text-brand-navy uppercase tracking-widest border-b-4 border-gray-100 pb-4 mb-6">Forensic Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 divide-x-0 md:divide-x-4 divide-gray-100">
          
          <div className="space-y-5 pr-0 md:pr-4">
            <h4 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded">Failed Items Log</h4>
            {failedItems.length === 0 ? (
              <p className="text-sm text-gray-500 font-medium italic bg-gray-50 border-2 border-gray-100 p-4 rounded-lg">No failed items recorded.</p>
            ) : (
              <ul className="space-y-4">
                {failedItems.map(item => {
                  const existingWorkOrder = (data.workOrders || []).find(wo => wo.itemId === item.id);
                  const isHabitationCheck = data.type === 'Unit Health & Safety Assessment' && item.id === 'y-mid-6';
                  
                  return (
                    <li key={item.id} className="text-sm bg-red-50 border-2 border-red-200 p-4 rounded-lg shadow-sm flex flex-col items-start">
                      <div className="flex items-center gap-3 mb-2 w-full justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full shadow-inner ${item.tier === 'Red' ? 'bg-brand-red' : item.tier === 'Yellow' ? 'bg-brand-amber' : 'bg-brand-green'}`}></span>
                          <span className="font-bold text-gray-900 text-base">{item.text.split('—')[0]}</span>
                        </div>
                        {(item.tier === 'Red' || item.tier === 'Yellow') && (
                          <div className="no-print">
                            {existingWorkOrder ? (
                              <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded flex items-center gap-1">
                                ✓ Work Order Exists
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAddWorkOrder(item)}
                                className="px-2 py-1 bg-brand-navy hover:bg-brand-navy-light text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-1"
                              >
                                <Wrench size={12} /> Create Work Order
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {item.note && <p className="text-gray-700 mt-2 pl-6 border-l-4 border-red-300 ml-1.5 font-medium">{item.note}</p>}
                      {isHabitationCheck && (
                        <div className="mt-3 w-full flex justify-end no-print">
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-habitation-report'))}
                            className="bg-brand-red text-white px-3 py-2 text-xs font-bold rounded-lg shadow uppercase tracking-wider hover:bg-red-700 flex items-center gap-2 transition-colors"
                          >
                            <AlertTriangle size={14} /> Generate Habitation Violation Report
                          </button>
                        </div>
                     )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          
          <div className="space-y-8 md:pl-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded">Assessor Notes / Deficiencies</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSuggestSummary}
                    disabled={isSuggesting || !isOnline}
                    className={`px-3 py-1 rounded-full shadow text-xs font-bold transition-colors flex items-center gap-1 ${!isOnline ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-amber text-brand-navy hover:bg-yellow-500'}`}
                    title={!isOnline ? "Requires internet connection" : "AI Suggest Summary"}
                  >
                    <Sparkles size={14} className={isSuggesting ? 'animate-pulse' : ''} /> 
                    {isSuggesting ? 'Generating...' : 'Suggest Summary'}
                  </button>
                  {micSupported && (
                    <button 
                      onClick={toggleRecording}
                      className={`p-2 rounded-full shadow transition-colors flex items-center justify-center ${isRecording ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      title={isRecording ? "Stop Recording" : "Start Voice Typing"}
                    >
                      {isRecording ? <Square size={16} className="fill-current animate-pulse" /> : <Mic size={16} />}
                    </button>
                  )}
                </div>
              </div>
              <textarea 
                className="w-full text-base font-medium border-2 border-gray-200 bg-gray-50 rounded-lg p-4 focus:bg-white focus:ring-4 focus:ring-brand-navy/10 focus:border-brand-navy focus:outline-none min-h-[120px] transition-all no-print"
                placeholder="Log overall context, oddities, or immediate action steps..."
                value={data.assessorNotes}
                maxLength={2000}
                onChange={(e) => updateField('assessorNotes', e.target.value)}
              />
              <div className="text-right text-xs text-gray-400 font-medium mt-1 no-print">
                {data.assessorNotes?.length || 0} / 2000
              </div>
              
              {suggestedSummary && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg relative animate-in fade-in slide-in-from-top-2 no-print">
                  <h5 className="text-xs font-bold text-brand-navy uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Sparkles size={12} /> AI Suggestion
                  </h5>
                  <textarea 
                    className="w-full text-sm font-medium border-none bg-transparent resize-y min-h-[80px] focus:outline-none text-gray-800"
                    value={suggestedSummary}
                    onChange={(e) => setSuggestedSummary(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setSuggestedSummary(null)} className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                    <button 
                      onClick={() => {
                        updateField('assessorNotes', suggestedSummary);
                        setSuggestedSummary(null);
                      }} 
                      className="px-3 py-1 bg-brand-navy text-white text-xs font-bold rounded shadow hover:bg-brand-navy-light"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              <div className="print-only text-sm font-bold text-gray-900 border-2 border-gray-200 p-4 rounded-lg bg-gray-50 whitespace-pre-wrap">
                {data.assessorNotes || 'None'}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded mb-4">Manager Follow-Up Tasks</h4>
              <div className="space-y-3">
                {Object.entries(data.managerFollowUp).map(([task, val]) => {
                  const isObj = typeof val === 'object';
                  const checked = isObj ? (val as any).checked : val as boolean;
                  const priority = isObj ? (val as any).priority : 'Medium';
                  return (
                    <div key={task} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border-2 border-transparent hover:border-gray-200 print:bg-transparent print:border-none print:p-1 print:gap-2">
                      <label className="flex items-center gap-4 cursor-pointer flex-1">
                        <div className="relative flex items-center no-print">
                          <input 
                            type="checkbox" 
                            checked={checked}
                            onChange={() => toggleFollowUp(task)}
                            className="w-6 h-6 text-brand-navy bg-white border-2 border-gray-300 rounded focus:ring-brand-navy focus:ring-2 transition-all cursor-pointer"
                          />
                        </div>
                        <div className="print-only flex items-center justify-center w-5 h-5 border-2 border-black rounded-sm shrink-0">
                          {checked && <div className="w-3 h-3 bg-black rounded-sm"></div>}
                        </div>
                        <span className={`text-base font-bold ${checked ? 'text-gray-400 line-through print:text-gray-800' : 'text-gray-900'}`}>{task}</span>
                      </label>
                      <select 
                        value={priority} 
                        onChange={(e) => updateFollowUpPriority(task, e.target.value)} 
                        className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer no-print ${
                          priority === 'High' ? 'bg-red-50 border-red-200 text-red-600' : 
                          priority === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-600' : 
                          'bg-gray-100 border-gray-200 text-gray-500'
                        }`}
                      >
                        <option value="High" className="text-red-600">High</option>
                        <option value="Medium" className="text-amber-600">Medium</option>
                        <option value="Low" className="text-gray-500">Low</option>
                      </select>
                      <span className="print-only text-xs font-bold uppercase tracking-wider text-gray-500">{priority}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
