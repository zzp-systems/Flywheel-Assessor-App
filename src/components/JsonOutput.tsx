import React, { useState } from 'react';
import { InspectionData } from '../types';
import { Download, Copy, Code, Check } from 'lucide-react';

export function JsonOutput({ data }: { data: InspectionData }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const generateJson = () => {
    // Create a clean version without heavy UI state if needed, or just dump raw
    const exportData = {
      ...data,
      runTimestamp: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Flywheel-Inspection-${data.type.replace(/ /g, '-')}-${data.unitNumber}-${data.date.slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        className="w-full text-center py-4 text-sm font-medium text-gray-500 hover:text-brand-navy transition-colors flex items-center justify-center gap-2 no-print"
      >
        <Code size={16} /> Show JSON Output (Machine-Readable)
      </button>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 mt-8 mb-20 no-print">
      <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-gray-950">
        <h3 className="text-sm font-mono text-gray-300 flex items-center gap-2">
          <Code size={14} /> inspection_data.json
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded font-medium transition-colors"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1 bg-brand-navy hover:bg-blue-800 text-white text-xs rounded font-medium transition-colors"
          >
            <Download size={12} /> Export
          </button>
          <button 
            onClick={() => setOpen(false)}
            className="ml-2 text-gray-500 hover:text-gray-300 px-2"
          >
            Hide
          </button>
        </div>
      </div>
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
          {generateJson()}
        </pre>
      </div>
      <div className="bg-gray-950 p-2 text-center border-t border-gray-800">
        <p className="text-xs text-gray-500">JSON ready for Google Cloud Functions, Cloud Run, or Firebase ingestion</p>
      </div>
    </div>
  );
}
