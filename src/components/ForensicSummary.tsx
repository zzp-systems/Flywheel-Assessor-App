import React, { useState, useRef } from 'react';
import { InspectionData } from '../types';
import { Mic, Square } from 'lucide-react';

interface ForensicSummaryProps {
  data: InspectionData;
  updateField: (field: string, value: any) => void;
  toggleFollowUp: (key: string) => void;
}

export function ForensicSummary({ data, updateField, toggleFollowUp }: ForensicSummaryProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [micSupported] = useState('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognitionRef = useRef<any>(null);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
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
        const currentNote = data.runnerNotes || '';
        updateField('runnerNotes', currentNote + (currentNote ? ' ' : '') + finalTranscript);
        finalTranscript = '';
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const items = Object.values(data.items);
  const redFailed = items.some(i => i.tier === 'Red' && i.status === 'Fail');
  const yellowFailed = items.some(i => i.tier === 'Yellow' && i.status === 'Fail');
  const allRedPassed = items.filter(i => i.tier === 'Red').every(i => i.status === 'Pass');
  
  let statusBanner = null;
  
  if (redFailed) {
    statusBanner = (
      <div className="bg-brand-red text-white p-6 rounded-xl shadow-2xl sm:text-center animate-pulse border-4 border-red-900 border-opacity-20 transform scale-[1.02] transition-transform">
        <h2 className="text-3xl md:text-4xl font-display font-black uppercase tracking-widest mb-2 shadow-red-900/50 drop-shadow-md">🔴 UNSAFE — DO NOT RENT</h2>
        <p className="text-base md:text-lg font-bold opacity-95 tracking-wide">Life safety issue detected. Management notification required.</p>
      </div>
    );
  } else if (allRedPassed && yellowFailed) {
    statusBanner = (
      <div className="bg-brand-amber text-brand-navy-dark p-6 rounded-xl shadow-xl sm:text-center border-4 border-brand-amber border-opacity-50">
        <h2 className="text-3xl md:text-4xl font-display font-black uppercase tracking-widest mb-2">🟡 NOT RENT-READY</h2>
        <p className="text-base md:text-lg font-bold opacity-90 tracking-wide">Maintenance required before occupancy.</p>
      </div>
    );
  } else {
    // Note: Assuming RENT-READY if no red/yellow fail, even if pending. Better logic might check if everything is 'Pass'
    const hasPending = items.some(i => i.status === 'Pending');
    if (hasPending) {
      statusBanner = (
        <div className="bg-gray-100 text-brand-navy p-6 rounded-xl shadow-md sm:text-center border-4 border-gray-300 border-dashed">
          <h2 className="text-2xl font-display font-black uppercase tracking-widest mb-2">⚪ INSPECTION IN PROGRESS</h2>
          <p className="text-base font-bold text-gray-600">Complete all items to see final status.</p>
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
  }

  const failedItems = items.filter(i => i.status === 'Fail');

  return (
    <div className="mb-8 space-y-6 page-break">
      {statusBanner}
      
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 overflow-hidden">
        <h3 className="text-2xl font-display font-black text-brand-navy uppercase tracking-widest border-b-4 border-gray-100 pb-4 mb-6">Forensic Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 divide-x-0 md:divide-x-4 divide-gray-100">
          
          <div className="space-y-5 pr-0 md:pr-4">
            <h4 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded">Failed Items Log</h4>
            {failedItems.length === 0 ? (
              <p className="text-sm text-gray-500 font-medium italic bg-gray-50 border-2 border-gray-100 p-4 rounded-lg">No failed items recorded.</p>
            ) : (
              <ul className="space-y-4">
                {failedItems.map(item => (
                  <li key={item.id} className="text-sm bg-red-50 border-2 border-red-200 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-3 h-3 rounded-full shadow-inner ${item.tier === 'Red' ? 'bg-brand-red' : item.tier === 'Yellow' ? 'bg-brand-amber' : 'bg-brand-green'}`}></span>
                      <span className="font-bold text-gray-900 text-base">{item.text.split('—')[0]}</span>
                    </div>
                    {item.note && <p className="text-gray-700 mt-2 pl-6 border-l-4 border-red-300 ml-1.5 font-medium">{item.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="space-y-8 md:pl-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded">Runner Notes / Deficiencies</h4>
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
              <textarea 
                className="w-full text-base font-medium border-2 border-gray-200 bg-gray-50 rounded-lg p-4 focus:bg-white focus:ring-4 focus:ring-brand-navy/10 focus:border-brand-navy focus:outline-none min-h-[120px] transition-all no-print"
                placeholder="Log overall context, oddities, or immediate action steps..."
                value={data.runnerNotes}
                onChange={(e) => updateField('runnerNotes', e.target.value)}
              />
              <div className="print-only text-sm font-bold text-gray-900 border-2 border-gray-200 p-4 rounded-lg bg-gray-50 whitespace-pre-wrap">
                {data.runnerNotes || 'None'}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded mb-4">Manager Follow-Up Tasks</h4>
              <div className="space-y-3">
                {Object.entries(data.managerFollowUp).map(([task, checked]) => (
                  <label key={task} className="flex flex-row items-center gap-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-all border-2 border-transparent hover:border-gray-200 print:bg-transparent print:border-none print:p-1 print:gap-2">
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
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
