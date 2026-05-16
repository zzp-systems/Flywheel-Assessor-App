import React, { useState } from 'react';
import { useAssessment } from './hooks';
import { ChecklistView } from './components/ChecklistView';
import { PhotoTracker } from './components/PhotoTracker';
import { DeltaReport } from './components/DeltaReport';
import { ForensicSummary } from './components/ForensicSummary';
import { JsonOutput } from './components/JsonOutput';
import { DocumentGenerator } from './components/DocumentGenerator';
import { DetailedChecklistPrint } from './components/DetailedChecklistPrint';
import { SignatureCapture } from './components/SignatureCapture';
import { Printer, WifiOff, RefreshCcw, FileText, PenTool, ClipboardCheck, X, Mail } from 'lucide-react';
import { AssessmentType } from './types';

export default function App() {
  const { data, isLoaded, isOnline, isSyncing, pendingSyncCount, updateField, changeType, updateItemStatus, updateItemNote, addPhoto, removePhoto, toggleFollowUp, importBaseline, updateDeltaCost, pendingMappings, cancelMapping, confirmMapping, addWorkOrder, queueAssessment } = useAssessment();

  const [docGenOpen, setDocGenOpen] = useState(false);
  const [docGenType, setDocGenType] = useState<'Entry' | 'Claim' | 'Formal' | 'Habitation'>('Formal');
  const [signOpen, setSignOpen] = useState(false);
  const [tenantSignOpen, setTenantSignOpen] = useState(false);
  const [showSyncedToast, setShowSyncedToast] = useState(false);
  const [missionBriefOpen, setMissionBriefOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [attemptedComplete, setAttemptedComplete] = useState(false);
  const [isAssessmentCompleted, setIsAssessmentCompleted] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [scraModalOpen, setScraModalOpen] = useState(false);
  
  // Mapping state
  const [resolvedMappingDict, setResolvedMappingDict] = useState<Record<string, string>>({});

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

  const validateAndQueue = () => {
    setAttemptedComplete(true);
    const errors: string[] = [];

    // Header validation
    if (!data.facilityName) errors.push('Facility Name is required.');
    if (!data.unitNumber) errors.push('Unit Number is required.');
    if (!data.building) errors.push('Building/Floor is required.');
    if (!data.inspectorName) errors.push('Inspector Name is required.');
    if (!data.weather) errors.push('Weather conditions are required.');

    // Red light items validation
    const items = Object.values(data.items);
    const pendingRed = items.some((i: any) => i.tier === 'Red' && i.status === 'Pending');
    if (pendingRed) {
      errors.push('All Red Light items must be assessed before completing.');
    }

    // Photo tracker validation
    if (data.type === 'Move-In Assessment Report' || data.type === 'Move-Out Assessment Report') {
      const coveredRequiredShots = new Set(
        data.photos
          .filter(p => p.linkedItemId?.startsWith('required-shot-'))
          .map(p => p.linkedItemId)
      );
      if (coveredRequiredShots.size < 15) {
        errors.push(`All 15 Required Shots must be captured – currently have ${coveredRequiredShots.size}/15`);
      }
    }

    // Delta report costs
    if (data.deltaItems) {
      const hasNegative = Object.values(data.deltaItems).some((d: any) => d.repairCostEstimate < 0);
      if (hasNegative) {
        errors.push('Delta Report repair costs must be valid positive numbers.');
      }
    }

    setValidationErrors(errors);

    if (errors.length === 0) {
      queueAssessment();
      setIsAssessmentCompleted(true);
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' }); // Scroll near the summary to show errors
    }
  };

  useEffect(() => {
    const handleHabitationEvent = () => {
      openDocumentGenerator('Habitation');
    };
    window.addEventListener('open- habitation-report', handleHabitationEvent);
    return () => window.removeEventListener('open- habitation-report', handleHabitationEvent);
  }, []);

  const openDocumentGenerator = (type: 'Entry' | 'Claim' | 'Formal' | 'Habitation') => {
    if (type === 'Claim') {
      setDocGenType(type);
      setScraModalOpen(true);
    } else {
      setDocGenType(type);
      setDocGenOpen(true);
    }
  };

  const handleScraVerified = () => {
    setScraModalOpen(false);
    setDocGenOpen(true);
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center font-display font-bold text-gray-500">Loading data...</div>;
  }

  const dt = new Date(data.date);
  const formattedDate = dt.toLocaleString();

  return (
    <div className="min-h-screen bg-[#F3F4F6] print:bg-transparent text-gray-900 font-sans pb-24 print:pb-0">
      {!isOnline && (
        <div className="bg-gray-800 text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 no-print shadow-md">
          <WifiOff size={16} className="text-red-400" />
          You are offline – data will sync when connection is restored
          <button onClick={() => queueAssessment()} className="ml-4 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
            Sync Now
          </button>
        </div>
      )}
      <div className={docGenOpen ? 'no-print' : ''}>
      {/* Offline/Sync Indicator */}
      <div className="fixed top-20 left-4 z-50 no-print flex items-center gap-2">
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
        Flywheel Investors — Texas Property Code Chapter 59 — Assessment Report — {data.facilityName || 'Facility'} — {formattedDate}
      </div>

      {/* Main Header */}
      <header className="bg-brand-navy border-b-[6px] border-brand-amber text-white text-center py-8 shadow-xl flex justify-center items-center flex-col relative print:bg-white print:text-black print:pb-2 print:border-b-2 print:shadow-none">
        <h1 className="text-3xl md:text-5xl text-white font-display font-bold tracking-tight uppercase print:text-xl">FLYWHEEL ASSESSOR APP</h1>
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
          <h2 className="text-3xl font-display font-black uppercase tracking-widest text-black">Self-Storage Assessment Report</h2>
        </div>
        
        {/* Assessment Details Card */}
        <section className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 print:border-none print:shadow-none print:p-0">
          <div className="mb-8">
             <div className="flex justify-between items-end mb-3">
               <label className="block text-sm font-display font-bold text-brand-navy uppercase tracking-widest print:text-black">Assessment Type</label>
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
               onChange={(e) => changeType(e.target.value as AssessmentType)}
               className="w-full md:w-auto min-w-[300px] bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-navy/20 focus:border-brand-navy transition-all no-print"
             >
               <option value="Move-In Assessment Report">Move-In Assessment Report</option>
               <option value="Unit Health & Safety Assessment">Unit Health & Safety Assessment / Health & Safety (3-Day Notice Req.)</option>
               <option value="Move-Out Assessment Report">Move-Out Assessment Report / Turnover</option>
             </select>
             <div className="print-only text-xl font-black text-black">
               {data.type}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className={`block text-xs font-display font-bold tracking-wider uppercase mb-2 ${attemptedComplete && !data.facilityName ? 'text-red-500' : 'text-gray-500 print:text-gray-800'}`}>Facility Name</label>
              <input type="text" value={data.facilityName} onChange={e => updateField('facilityName', e.target.value)} className={`w-full bg-gray-50 border-2 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print ${attemptedComplete && !data.facilityName ? 'border-red-500 focus:ring-red-100' : 'border-gray-200'}`} placeholder="e.g. Austin South Peak" />
              {attemptedComplete && !data.facilityName && <span className="text-red-500 text-xs font-bold mt-1 block">Required</span>}
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.facilityName || 'N/A'}</div>
            </div>
            <div>
              <label className={`block text-xs font-display font-bold tracking-wider uppercase mb-2 ${attemptedComplete && !data.unitNumber ? 'text-red-500' : 'text-gray-500 print:text-gray-800'}`}>Unit Number</label>
              <input type="text" value={data.unitNumber} onChange={e => updateField('unitNumber', e.target.value)} className={`w-full bg-gray-50 border-2 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-black text-gray-900 transition-all outline-none no-print ${attemptedComplete && !data.unitNumber ? 'border-red-500 focus:ring-red-100' : 'border-gray-200'}`} placeholder="e.g. A105" />
              {attemptedComplete && !data.unitNumber && <span className="text-red-500 text-xs font-bold mt-1 block">Required</span>}
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.unitNumber || 'N/A'}</div>
            </div>
            <div>
              <label className={`block text-xs font-display font-bold tracking-wider uppercase mb-2 ${attemptedComplete && !data.building ? 'text-red-500' : 'text-gray-500 print:text-gray-800'}`}>Building/Floor</label>
              <input type="text" value={data.building} onChange={e => updateField('building', e.target.value)} className={`w-full bg-gray-50 border-2 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print ${attemptedComplete && !data.building ? 'border-red-500 focus:ring-red-100' : 'border-gray-200'}`} placeholder="e.g. Bldg 1" />
              {attemptedComplete && !data.building && <span className="text-red-500 text-xs font-bold mt-1 block">Required</span>}
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
              <label className={`block text-xs font-display font-bold tracking-wider uppercase mb-2 ${attemptedComplete && !data.inspectorName ? 'text-red-500' : 'text-gray-500 print:text-gray-800'}`}>Inspector</label>
              <input type="text" value={data.inspectorName} onChange={e => updateField('inspectorName', e.target.value)} className={`w-full bg-gray-50 border-2 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print ${attemptedComplete && !data.inspectorName ? 'border-red-500 focus:ring-red-100' : 'border-gray-200'}`} placeholder="Full Name" />
              {attemptedComplete && !data.inspectorName && <span className="text-red-500 text-xs font-bold mt-1 block">Required</span>}
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.inspectorName || 'N/A'}</div>
            </div>

            <div>
              <label className={`block text-xs font-display font-bold tracking-wider uppercase mb-2 ${attemptedComplete && !data.weather ? 'text-red-500' : 'text-gray-500 print:text-gray-800'}`}>Weather (°F)</label>
              <input type="text" value={data.weather} onChange={e => updateField('weather', e.target.value)} className={`w-full bg-gray-50 border-2 rounded-md focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10 px-3 py-2 text-sm font-bold text-gray-900 transition-all outline-none no-print ${attemptedComplete && !data.weather ? 'border-red-500 focus:ring-red-100' : 'border-gray-200'}`} placeholder="e.g. 102°F Sunny" />
              {attemptedComplete && !data.weather && <span className="text-red-500 text-xs font-bold mt-1 block">Required</span>}
              <div className="print-only font-bold text-black border-b border-gray-300 pb-1">{data.weather || 'N/A'}</div>
            </div>

            {data.type === 'Move-In Assessment Report' && (
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
        {(data.type === 'Unit Health & Safety Assessment' || data.type === 'Move-Out Assessment Report') && (
          <div className="flex flex-col sm:flex-row gap-3 no-print">
            {data.type === 'Unit Health & Safety Assessment' && (
              <button 
                onClick={() => openDocumentGenerator('Entry')}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-amber text-brand-navy font-bold py-3 px-4 rounded-lg shadow uppercase tracking-wider hover:bg-yellow-400 transition-colors border-2 border-brand-amber"
              >
                <FileText size={18} /> Generate Entry Notice
              </button>
            )}
            {data.type === 'Move-Out Assessment Report' && (
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
        <ForensicSummary data={data} updateField={updateField} toggleFollowUp={toggleFollowUp} addWorkOrder={addWorkOrder} />

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
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-display font-black text-brand-navy uppercase tracking-widest">Inspector Signature</h3>
                {data.inspectorSignature && (
                  <img src={data.inspectorSignature} alt="Signature Preview" className="h-10 object-contain mix-blend-multiply opacity-50" />
                )}
              </div>
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

          {data.type === 'Move-In Assessment Report' && (
            <section className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 no-print animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-display font-black text-brand-navy uppercase tracking-widest">Tenant Signature</h3>
                  {data.tenantSignature && (
                    <img src={data.tenantSignature} alt="Signature Preview" className="h-10 object-contain mix-blend-multiply opacity-50" />
                  )}
                </div>
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
             {data.tenantSignature && data.type === 'Move-In Assessment Report' && (
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
        <div className="mt-8 no-print border-t border-gray-300 pt-8 flex flex-col items-center">
           {validationErrors.length > 0 && (
             <div className="mb-6 w-full bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg shadow-sm">
               <h4 className="font-bold mb-2 uppercase tracking-wide text-sm flex items-center gap-2">
                 <X size={16} /> Cannot Complete Assessment
               </h4>
               <ul className="list-disc pl-5 text-sm font-medium space-y-1">
                 {validationErrors.map((err, i) => (
                   <li key={i}>{err}</li>
                 ))}
               </ul>
             </div>
           )}
           <div className="flex flex-col sm:flex-row items-center gap-4">
             <button 
               onClick={validateAndQueue}
               disabled={isAssessmentCompleted}
               className={`px-8 py-4 font-black uppercase tracking-widest text-lg rounded-xl shadow-xl transition-all ${isAssessmentCompleted ? 'bg-gray-400 text-white cursor-not-allowed shadow-none' : 'bg-brand-green hover:bg-green-600 text-white'}`}
             >
               {isAssessmentCompleted ? 'Assessment Completed ✓' : 'Complete & Verify Assessment'}
             </button>

             {isAssessmentCompleted && (
               <>
                 <button 
                   onClick={() => openDocumentGenerator('Formal')}
                   className="px-8 py-4 bg-brand-navy hover:bg-blue-900 text-white font-black uppercase tracking-widest text-lg rounded-xl shadow-xl transition-all flex items-center gap-2 animate-in fade-in zoom-in"
                 >
                   <FileText size={20} /> Formal Report
                 </button>
                 <button 
                   onClick={() => setEmailModalOpen(true)}
                   className="px-8 py-4 bg-brand-navy hover:bg-blue-900 text-white font-black uppercase tracking-widest text-lg rounded-xl shadow-xl transition-all flex items-center gap-2 animate-in fade-in zoom-in"
                 >
                   <Mail size={20} /> Share via Email
                 </button>
               </>
             )}
           </div>
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
                {data.type === 'Move-In Assessment Report' && (
                  <>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Document every pre-existing scratch, stain, or dent.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> This report is the legal baseline for all future damage claims.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Photograph all required shot list items.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Ensure the tenant signs the report before handing over keys.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Set HVAC to 65-80°F if climate-controlled.</li>
                  </>
                )}
                {data.type === 'Unit Health & Safety Assessment' && (
                  <>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Only inspect what is visible from the unit doorway.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Do not touch or move tenant property.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Check for prohibited items (hazardous materials, food, habitation).</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Document any pest activity or water intrusion immediately.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Generate a 3-Day Notice of Entry and post it on the unit.</li>
                  </>
                )}
                {data.type === 'Move-Out Assessment Report' && (
                  <>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Import the Move-In Assessment Report JSON before starting.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Run the Delta Report to flag all deteriorated items.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Photograph all new damage with the linked item.</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Enter accurate repair cost estimates (no negatives).</li>
                    <li className="flex gap-3 text-gray-800"><span className="text-brand-amber mt-1 flex-shrink-0">◆</span> Generate a Move-Out Assessment Report and Lien Notice if applicable.</li>
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
      {pendingMappings && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-brand-navy p-4 text-white">
              <h2 className="text-xl font-display font-black uppercase tracking-widest flex items-center gap-2">
                Resolve Ambiguous Items
              </h2>
              <p className="text-sm mt-1 text-gray-300">Please select the correct corresponding item from the Move-In report for each Move-Out item.</p>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50">
              {pendingMappings.ambiguous.map((amb: any, idx: number) => (
                <div key={amb.item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="font-bold text-gray-800 mb-2">{amb.item.text}</p>
                  <div className="space-y-2">
                    {amb.candidates.map((cand: any) => (
                      <label key={cand.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${resolvedMappingDict[amb.item.id] === cand.id ? 'border-brand-navy bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input 
                          type="radio" 
                          name={`map-${amb.item.id}`} 
                          className="hidden"
                          checked={resolvedMappingDict[amb.item.id] === cand.id} 
                          onChange={() => setResolvedMappingDict(prev => ({ ...prev, [amb.item.id]: cand.id }))} 
                        />
                        <span className="text-sm text-gray-700">{cand.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-4">
              <button onClick={() => { setResolvedMappingDict({}); cancelMapping(); }} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => confirmMapping(resolvedMappingDict)} className="px-6 py-2 bg-brand-green text-white font-bold rounded-lg shadow uppercase tracking-wider hover:bg-green-600 transition-colors">Confirm Setup</button>
            </div>
          </div>
        </div>
      )}
      {scraModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-brand-red p-4 flex justify-between items-center text-white">
              <h2 className="text-xl font-display font-black uppercase tracking-widest flex items-center gap-2">
                 SCRA Compliance Check Required
              </h2>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <p className="text-gray-800 font-medium">
                Before issuing a Notice of Claim or enforcing a lien, you must verify the tenant's military status under the Servicemembers Civil Relief Act (SCRA).
              </p>
              <p className="text-gray-800 font-medium">
                Please visit the DMDC SCRA website to perform the check now. <br/>Have you completed this verification?
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between gap-4">
              <button 
                onClick={() => setScraModalOpen(false)}
                className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded shadow transition-colors w-full"
              >
                Cancel
              </button>
              <a 
                href="https://www.dmdc.osd.mil/scra"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 bg-brand-navy hover:bg-brand-navy-light text-white text-center font-bold rounded shadow transition-colors w-full"
              >
                Check SCRA Now
              </a>
              <button 
                onClick={handleScraVerified}
                className="px-6 py-3 bg-brand-red hover:bg-red-700 text-white font-bold rounded shadow transition-colors w-full"
              >
                Yes, I have verified
              </button>
            </div>
          </div>
        </div>
      )}

      {emailModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col">
            <div className="bg-brand-navy p-4 flex justify-between items-center text-white">
              <h2 className="text-xl font-display font-black uppercase tracking-widest flex items-center gap-2">
                <Mail size={20} /> Share Assessment via Email
              </h2>
              <button 
                onClick={() => setEmailModalOpen(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[80vh]">
              <ul className="space-y-4 list-disc pl-5 text-gray-800 font-medium">
                <li><strong>Save the Formal Report</strong> – click below to download the report (HTML).</li>
                <li><strong>Save the Assessment Data</strong> – download as JSON or a readable Markdown summary.</li>
                <li><strong>Open Email</strong> – your email app will open with a pre-filled subject and summary. Attach the saved files manually.</li>
              </ul>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => openDocumentGenerator('Formal')}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-brand-navy font-bold rounded-lg shadow-sm transition-colors text-left flex items-center gap-2"
                >
                  <FileText size={18} /> Download Formal Report (HTML)
                </button>
                <button 
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `assessment_${data.unitNumber}.json`);
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-brand-navy font-bold rounded-lg shadow-sm transition-colors text-left flex items-center gap-2"
                >
                  <FileText size={18} /> Download Data (JSON)
                </button>
                <button 
                  onClick={() => {
                    const failedItems = Object.values(data.items).filter(i => i.status === 'Fail').map(i => `- ${i.text} (${i.tier} Tier): ${i.note || 'No notes'}`).join('\n');
                    const md = `# Assessment Summary: ${data.facilityName} - Unit ${data.unitNumber}
Type: ${data.type}
Date: ${new Date(data.date).toLocaleString()}
Inspector: ${data.inspectorName}
Total Repair Estimate: $${Object.values(data.deltaItems || {}).reduce((sum, item) => sum + (item.repairCostEstimate || 0), 0)}

## Failed Items
${failedItems || 'No failed items.'}`;
                    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `summary_${data.unitNumber}.md`);
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-brand-navy font-bold rounded-lg shadow-sm transition-colors text-left flex items-center gap-2"
                >
                  <FileText size={18} /> Download Summary (Markdown)
                </button>
                <button 
                  onClick={() => {
                    const failedItems = Object.values(data.items).filter(i => i.status === 'Fail').map(i => `- ${i.text} (${i.tier} Tier): ${i.note || 'No notes'}`).join('\n');
                    const md = `Assessment Summary: ${data.facilityName} - Unit ${data.unitNumber}\nType: ${data.type}\nDate: ${new Date(data.date).toLocaleString()}\nInspector: ${data.inspectorName}\n\nFailed Items:\n${failedItems || 'No failed items.'}`;
                    const subject = encodeURIComponent(`Assessment Completed - ${data.unitNumber} at ${data.facilityName}`);
                    const body = encodeURIComponent(md);
                    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                  }}
                  className="px-4 py-4 mt-2 bg-brand-navy hover:bg-blue-900 text-white font-black rounded-lg shadow uppercase tracking-widest transition-colors text-center flex items-center justify-center gap-2"
                >
                  <Mail size={20} /> Open Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
