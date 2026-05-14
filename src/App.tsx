import React, { useState } from 'react';
import { useInspection } from './hooks';
import { ChecklistView } from './components/ChecklistView';
import { PhotoTracker } from './components/PhotoTracker';
import { DeltaReport } from './components/DeltaReport';
import { ForensicSummary } from './components/ForensicSummary';
import { JsonOutput } from './components/JsonOutput';
import { DocumentGenerator } from './components/DocumentGenerator';
import { DetailedChecklistPrint } from './components/DetailedChecklistPrint';
import { SignatureCapture } from './components/SignatureCapture';
import { Printer, WifiOff, RefreshCcw, FileText, PenTool, ClipboardCheck, X } from 'lucide-react';
import { InspectionType } from './types';

export default function App() {
  const { data, isLoaded, isOnline, isSyncing, pendingSyncCount, updateField, changeType, updateItemStatus, updateItemNote, addPhoto, removePhoto, toggleFollowUp, importBaseline, updateDeltaCost, queueInspection } = useInspection();

  const [docGenOpen, setDocGenOpen] = useState(false);
  const [docGenType, setDocGenType] = useState<'Entry' | 'Claim' | 'Formal'>('Formal');
  const [signOpen, setSignOpen] = useState(false);
  const [tenantSignOpen, setTenantSignOpen] = useState(false);
  const [showSyncedToast, setShowSyncedToast] = useState(false);
  const [missionBriefOpen, setMissionBriefOpen] = useState(false);

  // Watch for isSyncing transitioning from true -> false
  React.useEffect(() => {
    if (!isSyncing && pendingSyncCount === 0) {
      // It's tricky to know if it just finished syncing without a ref.
    }
  }, [isSyncing, pendingSyncCount]);

  // A better way is to track previous value.
  const prevSyncingRef = React.useRef(isSyncing);
  React.useEffect(() => {
    if (prevSyncingRef.current === true && isSyncing === false && pendingSyncCount === 0 && isOnline) {
      setShowSyncedToast(true);
      setTimeout(() => setShowSyncedToast(false), 3000);
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing, pendingSyncCount, isOnline]);

  const openDocumentGenerator = (type: 'Entry' | 'Claim' | 'Formal') => {
    setDocGenType(type);
    setDocGenOpen(true);
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center font-display font-bold text-gray-500">Loading data...</div>;
  }

  const dt = new Date(data.date);
  const formattedDate = dt.toLocaleString();

  return (
    <div className="min-h-screen bg-[#F3F4F6] print:bg-transparent text-gray-900 font-sans pb-24 print:pb-0">
      <div className={docGenOpen ? 'no-print' : ''}>
      {/* Offline/Sync Indicator */}
      <div className="fixed top-4 left-4 z-50 no-print flex items-center gap-2">
        {!isOnline ? (
          <span className="bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-2 shadow-lg border border-gray-700">
            <WifiOff size={14} className="text-red-400" />
            <span className="hidden sm:inline">Offline Mode</span>
          </span>
        ) : isSyncing ? (
          <span className="bg-brand-amber text-brand-navy text-xs font-bold px-3 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <RefreshCcw size={14} className="animate-spin" />
            Syncing...
          </span>
        ) : showSyncedToast ? (
          <span className="bg-brand-green text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-2 shadow-lg transition-opacity duration-500">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            Synced
          </span>
        ) : null}
        
        {pendingSyncCount > 0 && (
          <span className="bg-brand-amber text-brand-navy text-xs font-bold px-3 py-2 rounded-full flex items-center shadow-lg">
            {pendingSyncCount} offline
          </span>
        )}
      </div>

      {/* Print Footer Header (Only visible when printing) */}
      <div className="print-only fixed bottom-0 left-0 w-full text-center text-[10px] text-gray-500 pb-2 border-t pt-2 bg-white">
        Flywheel Investors — Texas Property Code Chapter 59 — Inspection Report — {data.facilityName || 'Facility'} — {formattedDate}
      </div>

      {/* Main Header */}
      <header className="bg-brand-navy border-b-[6px] border-brand-amber text-white text-center py-8 shadow-xl flex justify-center items-center flex-col relative print:bg-white print:text-black print:pb-2 print:border-b-2 print:shadow-none">
        <h1 className="text-4xl md:text-5xl text-white font-display font-bold tracking-tight uppercase print:text-xl">FLYWHEEL INVESTORS</h1>
        <p className="text-sm md:text-base font-display font-bold tracking-[0.2em] text-brand-amber uppercase mt-2 print:text-gray-600">Texas Self-Storage Special Ops</p>
        
        <button 
          onClick={() => openDocumentGenerator('Formal')}
          className="absolute right-4 top-4 bg-white/10 hover:bg-white/20 p-3 lg:px-4 rounded-lg transition-colors border-2 border-transparent hover:border-white/30 no-print text-white flex items-center gap-2"
          title="Print Formal Report"
        >
          <Printer size={20} /> <span className="hidden sm:inline font-bold">Formal Report</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        {/* Dedicated Print Title */}
        <div className="print-only text-center mt-4 border-b-2 border-black pb-4 mb-8">
          <h2 className="text-3xl font-display font-black uppercase tracking-widest text-black">Self-Storage Inspection Report</h2>
        </div>
        
        {/* Inspection Details Card */}
        <section className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 print:border-none print:shadow-none print:p-0">
          <div className="mb-8">
             <div className="flex justify-between items-end mb-3">
               <label className="block text-sm font-display font-bold text-brand-navy uppercase tracking-widest print:text-black">Inspection Type</label>
               <button 
                 onClick={() => setMissionBriefOpen(true)}
                 className="no-print bg-brand-navy/10 hover:bg-brand-navy/20 text-brand-navy px-3 py-1 rounded shadow-sm transition-colors text-xs font-bold flex items-center gap-2"
                 title="View Mission Brief SOP"
               >
                 <ClipboardCheck size={14} /> Mission Brief
               </button>
             </div>
             <select 
               value={data.type}
               onChange={(e) => changeType(e.target.value as InspectionType)}
               className="w-full md:w-auto min-w-[300px] bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-navy/20 focus:border-brand-navy transition-all no-print"
             >
               <option value="Move-In Baseline">Move-In Baseline</option>
               <option value="Mid-Tenancy">Mid-Tenancy / Health & Safety (3-Day Notice Req.)</option>
               <option value="Move-Out">Move-Out / Turnover</option>
             </select>
             <div className="print-only text-xl font-black text-black">
               {data.type}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-display font-bold text-gray-500 tracking-wider uppercase mb-2 print:text-gray-800">Facility Name</label>
              <input type="text" value={data.facilityName} onChange={e => updateField('facilityName', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print" placeholder="e.g. Austin South Peak" />
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.facilityName || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-display font-bold text-gray-500 tracking-wider uppercase mb-2 print:text-gray-800">Unit Number</label>
              <input type="text" value={data.unitNumber} onChange={e => updateField('unitNumber', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-black text-gray-900 transition-all outline-none no-print" placeholder="e.g. A105" />
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.unitNumber || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-xs font-display font-bold text-gray-500 tracking-wider uppercase mb-2 print:text-gray-800">Building/Floor</label>
              <input type="text" value={data.building} onChange={e => updateField('building', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print" placeholder="e.g. Bldg 1" />
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.building || 'N/A'}</div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-display font-bold text-gray-500 tracking-wider uppercase mb-2 print:text-gray-800">Unit Type</label>
              <select value={data.unitType} onChange={e => updateField('unitType', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print">
                <option>Climate-Controlled</option>
                <option>Non-Climate Drive-Up</option>
                <option>RV-Boat-Covered</option>
                <option>RV-Boat-Enclosed</option>
              </select>
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.unitType}</div>
            </div>
            
            <div>
              <label className="block text-xs font-display font-bold text-gray-500 tracking-wider uppercase mb-2 print:text-gray-800">Inspector</label>
              <input type="text" value={data.inspectorName} onChange={e => updateField('inspectorName', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print" placeholder="Full Name" />
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.inspectorName || 'N/A'}</div>
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-gray-500 tracking-wider uppercase mb-2 print:text-gray-800">Weather (°F)</label>
              <input type="text" value={data.weather} onChange={e => updateField('weather', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print" placeholder="e.g. 102°F Sunny" />
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.weather || 'N/A'}</div>
            </div>

            {data.type === 'Move-In Baseline' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-display font-bold text-gray-500 tracking-wider uppercase mb-2 print:text-gray-800">Tenant Name</label>
                <input type="text" value={data.tenantName || ''} onChange={e => updateField('tenantName', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print" placeholder="Tenant Full Name" />
                <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.tenantName || 'N/A'}</div>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t-2 border-gray-100 text-sm text-gray-500 font-bold print:border-gray-300 print:text-black">
             Auto-generated timestamp: {formattedDate}
          </div>
        </section>

        {/* Document Actions */}
        {(data.type === 'Mid-Tenancy' || data.type === 'Move-Out') && (
          <div className="flex flex-col sm:flex-row gap-3 no-print">
            {data.type === 'Mid-Tenancy' && (
              <button 
                onClick={() => openDocumentGenerator('Entry')}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-amber text-brand-navy font-bold py-3 px-4 rounded-lg shadow uppercase tracking-wider hover:bg-yellow-400 transition-colors border-2 border-brand-amber"
              >
                <FileText size={18} /> Generate Entry Notice
              </button>
            )}
            {data.type === 'Move-Out' && (
              <button 
                onClick={() => openDocumentGenerator('Claim')}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-red text-white font-bold py-3 px-4 rounded-lg shadow uppercase tracking-wider hover:bg-red-700 transition-colors border-2 border-brand-red"
              >
                <FileText size={18} /> Generate Lien Notice
              </button>
            )}
          </div>
        )}

        {/* Forensic Summary */}
        <ForensicSummary data={data} updateField={updateField} toggleFollowUp={toggleFollowUp} />

        {/* Delta Report */}
        <DeltaReport data={data} onImportBaseline={importBaseline} onUpdateCost={updateDeltaCost} />
        
        {/* Checklists */}
        <ChecklistView data={data} updateStatus={updateItemStatus} updateNote={updateItemNote} />

        {/* Print-only Detailed Checklist */}
        <DetailedChecklistPrint data={data} />

        {/* Photo Evidence */}
        <PhotoTracker 
          photos={data.photos} 
          items={data.items} 
          facilityName={data.facilityName}
          unitNumber={data.unitNumber}
          building={data.building}
          onAddPhoto={addPhoto} 
          onRemovePhoto={removePhoto} 
        />

        {/* Signature Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 no-print">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-xl font-display font-black text-brand-navy uppercase tracking-widest">Inspector Signature</h3>
              <button 
                onClick={() => setSignOpen(true)}
                className="px-4 py-2 bg-brand-navy hover:bg-brand-navy-light text-white font-bold rounded-lg shadow transition-colors flex items-center gap-2"
              >
                <PenTool size={16} />
                {data.inspectorSignature ? 'Update' : 'Capture'}
              </button>
            </div>
            {data.inspectorSignature ? (
              <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                <img src={data.inspectorSignature} alt="Inspector Signature" className="max-h-24 object-contain mb-2 mix-blend-multiply" />
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Signed on: {new Date(data.signatureTimestamp!).toLocaleString()}</p>
              </div>
            ) : (
              <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400">
                <p className="font-bold text-sm">No signature yet</p>
              </div>
            )}
          </section>

          {data.type === 'Move-In Baseline' && (
            <section className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 no-print animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-xl font-display font-black text-brand-navy uppercase tracking-widest">Tenant Signature</h3>
                <button 
                  onClick={() => setTenantSignOpen(true)}
                  className="px-4 py-2 bg-brand-amber hover:bg-yellow-500 text-brand-navy font-bold rounded-lg shadow transition-colors flex items-center gap-2"
                >
                  <PenTool size={16} />
                  {data.tenantSignature ? 'Update' : 'Capture'}
                </button>
              </div>
              {data.tenantSignature ? (
                <div className="p-4 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg flex flex-col items-center justify-center">
                  <img src={data.tenantSignature} alt="Tenant Signature" className="max-h-24 object-contain mb-2 mix-blend-multiply" />
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">{data.tenantName || 'Tenant Signature'}</p>
                </div>
              ) : (
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400">
                  <p className="font-bold text-sm">No signature yet</p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Printed Signature Block */}
        {(data.inspectorSignature || data.tenantSignature) && (
          <div className="print-only flex page-break justify-around items-center mt-12 page-break-inside-avoid">
             {data.tenantSignature && data.type === 'Move-In Baseline' && (
               <div className="flex flex-col items-center justify-center pt-8">
                  <img src={data.tenantSignature} alt="Tenant Signature" className="max-h-[80px] object-contain mb-1 mix-blend-multiply" style={{ printColorAdjust: 'exact' }} />
                  <div className="w-64 border-t border-black pt-1 text-center">
                     <p className="font-bold text-sm">{data.tenantName || 'Tenant Signature'}</p>
                  </div>
               </div>
             )}
             {data.inspectorSignature && (
               <div className="flex flex-col items-center justify-center pt-8">
                  <img src={data.inspectorSignature} alt="Inspector Signature" className="max-h-[80px] object-contain mb-1 mix-blend-multiply" style={{ printColorAdjust: 'exact' }} />
                  <div className="w-64 border-t border-black pt-1 text-center">
                     <p className="font-bold text-sm">{data.inspectorName || 'Inspector Signature'}</p>
                     <p className="text-xs text-gray-600">Signed: {new Date(data.signatureTimestamp!).toLocaleString()}</p>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* Sync Queue Actions */}
        <div className="mt-8 no-print border-t border-gray-300 pt-8 flex justify-center">
           <button 
             onClick={queueInspection}
             className="px-8 py-4 bg-brand-green hover:bg-green-600 text-white font-black uppercase tracking-widest text-lg rounded-xl shadow-xl transition-all"
           >
             Complete & Verify Inspection
           </button>
        </div>

        {/* JSON Interface */}
        <JsonOutput data={data} />
        
      </main>
      </div>

      {docGenOpen && (
        <DocumentGenerator 
          data={data} 
          initialType={docGenType} 
          onClose={() => setDocGenOpen(false)} 
          onSaveSignature={(b64, ts) => {
            updateField('inspectorSignature', b64);
            updateField('signatureTimestamp', ts);
          }}
        />
      )}

      {signOpen && (
        <SignatureCapture 
          initialName={data.inspectorName}
          onCancel={() => setSignOpen(false)}
          onSave={(b64, ts) => {
            updateField('inspectorSignature', b64);
            updateField('signatureTimestamp', ts);
            setSignOpen(false);
          }}
        />
      )}

      {tenantSignOpen && (
        <SignatureCapture 
          initialName={data.tenantName}
          onCancel={() => setTenantSignOpen(false)}
          onSave={(b64) => {
            updateField('tenantSignature', b64);
            setTenantSignOpen(false);
          }}
        />
      )}

      {missionBriefOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-brand-navy p-4 flex justify-between items-center text-white">
              <h2 className="text-xl font-display font-black uppercase tracking-widest flex items-center gap-2">
                <ClipboardCheck size={20} className="text-brand-amber" /> Mission Brief
              </h2>
              <button 
                onClick={() => setMissionBriefOpen(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <h3 className="font-bold text-gray-500 uppercase tracking-widest text-sm border-b pb-2">{data.type} SOP</h3>
              <ul className="space-y-4">
                {data.type === 'Move-In Baseline' && (
                  <>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Document every pre-existing scratch, stain, or dent.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> This report is the legal baseline for all future damage claims.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Photograph all required shot list items.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Ensure the tenant signs the report before handing over keys.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Set HVAC to 65-80°F if climate-controlled.</li>
                  </>
                )}
                {data.type === 'Mid-Tenancy' && (
                  <>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Only inspect what is visible from the unit doorway.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Do not touch or move tenant property.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Check for prohibited items (hazardous materials, food, habitation).</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Document any pest activity or water intrusion immediately.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Generate a 3-Day Notice of Entry and post it on the unit.</li>
                  </>
                )}
                {data.type === 'Move-Out' && (
                  <>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Import the Move-In Baseline JSON before starting.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Run the Delta Report to flag all deteriorated items.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Photograph all new damage with the linked item.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Enter accurate repair cost estimates (no negatives).</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Generate a Move-Out Inspection Report and Lien Notice if applicable.</li>
                  </>
                )}
              </ul>
              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setMissionBriefOpen(false)}
                  className="px-6 py-2 bg-brand-navy hover:bg-brand-navy-light text-white font-bold rounded shadow transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
