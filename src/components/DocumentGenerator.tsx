import React, { useState, useEffect } from 'react';
import { InspectionData } from '../types';
import { X, Printer, Copy, PenTool } from 'lucide-react';
import { noticeOfEntryTemplate, noticeOfClaimTemplate, generateFormalReportHTML, processTemplate } from '../templates/notices';
import { SignatureCapture } from './SignatureCapture';

type DocType = 'Entry' | 'Claim' | 'Formal';

interface DocumentGeneratorProps {
  data: InspectionData;
  initialType?: DocType;
  onClose: () => void;
  onSaveSignature?: (base64: string, timestamp: string) => void;
}

export function DocumentGenerator({ data, initialType = 'Formal', onClose, onSaveSignature }: DocumentGeneratorProps) {
  const [docType, setDocType] = useState<DocType>(initialType);
  const [signOpen, setSignOpen] = useState(false);
  
  // Custom fields
  const [tenantName, setTenantName] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [reasonForEntry, setReasonForEntry] = useState('Routine Health & Safety Inspection');
  
  const [amountDue, setAmountDue] = useState('');
  
  const [dateOfEntry, setDateOfEntry] = useState('');
  const [timeWindow, setTimeWindow] = useState('9:00 AM – 12:00 PM');
  
  const [htmlContent, setHtmlContent] = useState('');
  const [printWarning, setPrintWarning] = useState(false);

  // Auto-calculate + 3 days for Entry Date
  useEffect(() => {
    const today = new Date();
    const entry = new Date(today);
    entry.setDate(entry.getDate() + 3);
    setDateOfEntry(entry.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    generateDoc();
  }, [docType, tenantName, leaseStartDate, reasonForEntry, amountDue, dateOfEntry, timeWindow, data]);

  const generateDoc = () => {
    const now = new Date();
    
    // 14 days out for Claim
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 14);

    const formatShortDate = (isoOrText: string) => {
      if (!isoOrText) return '';
      try {
        const d = new Date(isoOrText);
        if (!isNaN(d.getTime())) return d.toLocaleDateString();
      } catch (e) {}
      return isoOrText;
    };

    const templateData: Record<string, string> = {
      facilityName: data.facilityName || '[Facility Name]',
      unitNumber: data.unitNumber || '[Unit]',
      inspectorName: data.inspectorName || '[Inspector Name]',
      inspectionDate: now.toLocaleDateString(),
      generationTime: now.toLocaleString(),
      
      tenantName: tenantName || '[Tenant Name]',
      leaseStartDate: formatShortDate(leaseStartDate) || '[Date]',
      reasonForEntry: reasonForEntry,
      dateOfEntry: formatShortDate(dateOfEntry) || '[Date of Entry]',
      timeWindow: timeWindow,
      
      amountDue: amountDue || '[Amount]',
      deadlineDate: deadline.toLocaleDateString(),

      signatureImage: data.inspectorSignature || '',
      signatureTimestamp: data.signatureTimestamp ? `Signed: ${new Date(data.signatureTimestamp).toLocaleString()}` : '',
    };

    let result = '';
    if (docType === 'Entry') {
      result = processTemplate(noticeOfEntryTemplate, templateData);
    } else if (docType === 'Claim') {
      result = processTemplate(noticeOfClaimTemplate, templateData);
    } else {
      result = generateFormalReportHTML(data);
    }
    
    setHtmlContent(result);
  };

  const handlePrint = () => {
    if (window.self !== window.top) {
      setPrintWarning(true);
      setTimeout(() => setPrintWarning(false), 8000);
    }
    window.print();
  };

  const copyToClipboard = () => {
    const el = document.createElement('div');
    el.innerHTML = htmlContent;
    navigator.clipboard.writeText(el.innerText || el.textContent || '').then(() => {
      alert("Text copied successfully!");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-100 preview-modal print:static print:h-auto print:overflow-visible print:bg-transparent print:block print:p-0">
      
      {/* Left Panel: Data Entry (Hidden in print) */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col no-print h-full overflow-y-auto shrink-0 shadow-lg relative z-10">
        <div className="p-4 border-b border-gray-200 bg-brand-navy flex justify-between items-center text-white sticky top-0 z-20">
          <h2 className="font-display font-bold text-lg tracking-widest uppercase">Doc Generator</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors text-white" aria-label="Close">
             <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6 flex-1">
          {/* Document Type Selection */}
          <div>
            <label className="block text-xs font-display font-black text-gray-500 uppercase tracking-widest mb-2">Document Type</label>
            <div className="space-y-2">
              {(['Formal', 'Entry', 'Claim'] as DocType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-colors font-bold text-sm ${
                    docType === type 
                      ? 'border-brand-navy bg-brand-navy/5 text-brand-navy' 
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type === 'Formal' ? 'Formal Inspection Report' : 
                   type === 'Entry' ? 'Notice of Entry' : 
                   'Notice of Claim (Lien)'}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Fields */}
          {docType === 'Entry' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <h3 className="font-display font-bold text-brand-navy border-b-2 border-brand-navy/10 pb-1">Notice Details</h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tenant Name</label>
                <input type="text" value={tenantName} onChange={e => setTenantName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none" placeholder="e.g. John Doe" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lease Start Date</label>
                <input type="date" value={leaseStartDate} onChange={e => setLeaseStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Entry</label>
                <select value={reasonForEntry} onChange={e => setReasonForEntry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none">
                  <option>Routine Health & Safety Inspection</option>
                  <option>Pest Control</option>
                  <option>Maintenance</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Date of Entry</label>
                <input type="date" value={dateOfEntry} onChange={e => setDateOfEntry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Time Window</label>
                <select value={timeWindow} onChange={e => setTimeWindow(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none">
                  <option>9:00 AM – 12:00 PM</option>
                  <option>12:00 PM – 3:00 PM</option>
                  <option>3:00 PM – 5:00 PM</option>
                </select>
              </div>
            </div>
          )}

          {docType === 'Claim' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <h3 className="font-display font-bold text-brand-navy border-b-2 border-brand-navy/10 pb-1">Claim Details</h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tenant Name</label>
                <input type="text" value={tenantName} onChange={e => setTenantName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none" placeholder="e.g. Jane Smith" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount Due ($)</label>
                <input type="number" min="0" step="0.01" value={amountDue} onChange={e => setAmountDue(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none" placeholder="0.00" />
              </div>
            </div>
          )}
          
          {docType === 'Formal' && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
              This document auto-populates from your inspection data and forensics summary.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3 sticky bottom-0">
          <button 
            onClick={() => setSignOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-brand-navy text-brand-navy font-bold rounded hover:bg-brand-navy/5 transition-colors"
          >
            <PenTool size={16} /> Sign Document
          </button>
          
          {printWarning && (
            <div className="text-xs text-brand-red font-bold p-2 bg-red-50 border border-brand-red/30 rounded text-center animate-in fade-in zoom-in duration-300">
              Printing is blocked in this preview window. Please open the app in a <strong>New Tab</strong> (using the arrow icon top-right) and try again.
            </div>
          )}
          <button 
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-100 transition-colors"
          >
            <Copy size={16} /> Copy Text
          </button>
          <button 
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-navy text-white font-bold rounded shadow hover:bg-brand-navy-light transition-colors"
          >
            <Printer size={18} /> Print Document
          </button>
        </div>
      </div>

      {/* Right Panel: Preview */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:block print:overflow-visible print:h-auto">
        <div 
          className="print:w-full print:max-w-none print:shadow-none"
          style={{ width: '100%', maxWidth: '8.5in' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>

      {signOpen && (
        <SignatureCapture 
          initialName={data.inspectorName}
          onCancel={() => setSignOpen(false)}
          onSave={(b64, ts) => {
            onSaveSignature?.(b64, ts);
            setSignOpen(false);
          }}
        />
      )}

    </div>
  );
}
