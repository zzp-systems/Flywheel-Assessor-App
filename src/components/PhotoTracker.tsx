import React, { useRef, useState } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { ChecklistItem } from '../types';

interface PhotoTrackerProps {
  photos: { id: string, dataUri: string, linkedItemId?: string, unitNumber?: string }[];
  items: Record<string, ChecklistItem>;
  facilityName: string;
  unitNumber: string;
  building: string;
  onAddPhoto: (uri: string, linkedItemId: string, metadata: { facilityName: string, unitNumber: string, buildingFloor: string }) => void;
  onRemovePhoto: (id: string) => void;
}

const applyWatermark = (base64Image: string, facilityName: string, unitNumber: string, building: string, timestamp: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Image); // Safety fallback

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(16, Math.floor(img.width * 0.04));
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      const dateStr = new Date(timestamp).toLocaleString();
      const lines = [
        facilityName || 'Facility Not Set',
        unitNumber ? `Unit ${unitNumber}` : 'Unit Not Set',
        building || 'Bldg Not Set',
        dateStr
      ];

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      let maxTextWidth = 0;
      lines.forEach(line => {
         const metrics = ctx.measureText(line);
         if (metrics.width > maxTextWidth) maxTextWidth = metrics.width;
      });

      const padding = fontSize * 0.6;
      const boxWidth = maxTextWidth + padding * 2;
      const boxHeight = (lines.length * fontSize * 1.4) + padding;
      const xPos = canvas.width - boxWidth;
      const yPos = canvas.height - boxHeight;

      ctx.fillRect(xPos, yPos, boxWidth, boxHeight);

      ctx.fillStyle = '#FFFFFF';
      lines.forEach((line, index) => {
         const lineY = canvas.height - padding - ((lines.length - 1 - index) * fontSize * 1.4);
         ctx.fillText(line, canvas.width - padding, lineY);
      });

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(base64Image);
    img.src = base64Image;
  });
};

export function PhotoTracker({ photos, items, facilityName, unitNumber, building, onAddPhoto, onRemovePhoto }: PhotoTrackerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setPendingPhoto(event.target.result);
          setSelectedItemId(''); // reset selection
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submitPhoto = async () => {
    if (pendingPhoto && selectedItemId) {
      const timestamp = new Date().toISOString();
      const watermarkedUri = await applyWatermark(pendingPhoto, facilityName, unitNumber, building, timestamp);
      onAddPhoto(watermarkedUri, selectedItemId, {
        facilityName,
        unitNumber,
        buildingFloor: building
      });
      setPendingPhoto(null);
    }
  };

  const cancelPhoto = () => {
    setPendingPhoto(null);
  };

  const redItems = Object.values(items).filter(i => i.tier === 'Red');
  const yellowItems = Object.values(items).filter(i => i.tier === 'Yellow');
  const greenItems = Object.values(items).filter(i => i.tier === 'Green');

  const requiredShots = [
    'Exterior front', 'Unit door', 'Wide interior', 'Thermostat/HVAC', 
    'Electrical panel', 'Under sinks', 'Gate control panel', 'Damage/pest evidence', 
    'Hallway condition'
  ];

  return (
    <>
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 mb-8 no-print">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b-2 border-gray-100 pb-4">
        <h3 className="text-2xl font-display font-black text-brand-navy uppercase tracking-widest">Photo Evidence Tracker</h3>
        <div className="text-sm font-bold bg-brand-navy text-white px-4 py-1.5 rounded-full shadow-inner">
          {photos.length} / 15 Minimum
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 md:border-r-4 border-gray-100 pr-4">
          <p className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded mb-4">Required Shots</p>
          <ul className="text-sm space-y-2 text-gray-700 font-medium">
            {requiredShots.map((shot, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-amber shadow-sm"></div>
                {shot}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <div className="flex flex-wrap gap-4">
            {photos.map(p => {
              const linkedItem = p.linkedItemId ? items[p.linkedItemId] : null;
              return (
                <div key={p.id} className="relative group w-28 flex-shrink-0 flex flex-col items-center">
                  <div className="w-28 h-28 rounded-lg overflow-hidden border-4 border-brand-navy bg-gray-50 shadow-md relative">
                    <img src={p.dataUri} className="w-full h-full object-cover" alt="Evidence" />
                    <button 
                      onClick={() => onRemovePhoto(p.id)}
                      className="absolute top-1 right-1 bg-brand-red text-white p-1.5 rounded-full opacity-90 hover:opacity-100 shadow-md transform hover:scale-110 transition-transform"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>
                  {linkedItem && (
                    <div className="mt-2 text-center w-full">
                      <p className="text-[10px] font-bold text-brand-navy-dark line-clamp-2 uppercase leading-tight">
                        {linkedItem.text.split('—')[0]}
                      </p>
                      {p.unitNumber && (
                        <p className="text-[9px] font-black text-gray-500 uppercase mt-0.5">
                          Unit {p.unitNumber}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 rounded-lg border-4 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:text-brand-navy hover:border-brand-navy hover:bg-gray-50 transition-all flex-shrink-0 self-start"
            >
              <Camera size={32} strokeWidth={2} className="mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-center">Add Photo</span>
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {pendingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/90 sm:bg-black/80 backdrop-blur-sm">
          <div className="bg-white sm:rounded-xl shadow-2xl overflow-hidden max-w-md w-full sm:border-4 border-brand-navy animate-in zoom-in-95 duration-200 flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
            <div className="p-4 bg-brand-navy text-white flex justify-between items-center shrink-0">
              <h3 className="text-lg font-display font-black uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={20} /> Link Photo
              </h3>
              <button onClick={cancelPhoto} className="p-1 hover:bg-white/20 rounded transition-colors text-white">
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto shrink grow">
              <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider text-center">
                Which item is this photo for?
              </p>
              
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border-4 border-brand-navy shadow-md">
                  <img src={pendingPhoto} className="w-full h-full object-cover" alt="Preview" />
                </div>
              </div>

              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-display font-black text-brand-red uppercase tracking-widest border-b-2 border-red-100 pb-1">Red Light / Life Safety</h4>
                  {redItems.map(item => (
                    <label key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedItemId === item.id ? 'border-brand-red bg-red-50 text-brand-red font-bold' : 'border-gray-200 hover:border-red-300'}`}>
                      <input type="radio" name="linkedItem" value={item.id} checked={selectedItemId === item.id} onChange={(e) => setSelectedItemId(e.target.value)} className="hidden" />
                      <span className="text-sm line-clamp-2">{item.text}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-display font-black text-brand-amber uppercase tracking-widest border-b-2 border-amber-100 pb-1">Yellow Light</h4>
                  {yellowItems.map(item => (
                    <label key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedItemId === item.id ? 'border-brand-amber bg-amber-50 text-brand-amber font-bold' : 'border-gray-200 hover:border-amber-300'}`}>
                      <input type="radio" name="linkedItem" value={item.id} checked={selectedItemId === item.id} onChange={(e) => setSelectedItemId(e.target.value)} className="hidden" />
                      <span className="text-sm line-clamp-2">{item.text}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-display font-black text-brand-green uppercase tracking-widest border-b-2 border-green-100 pb-1">Green Light</h4>
                  {greenItems.map(item => (
                    <label key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedItemId === item.id ? 'border-brand-green bg-green-50 text-brand-green font-bold' : 'border-gray-200 hover:border-green-300'}`}>
                      <input type="radio" name="linkedItem" value={item.id} checked={selectedItemId === item.id} onChange={(e) => setSelectedItemId(e.target.value)} className="hidden" />
                      <span className="text-sm line-clamp-2">{item.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t-2 border-gray-200 flex gap-3 shrink-0 pb-safe">
              <button 
                onClick={cancelPhoto} 
                className="flex-1 px-4 py-4 sm:py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!selectedItemId}
                onClick={submitPhoto} 
                className="flex-1 px-4 py-4 sm:py-3 bg-brand-navy rounded-lg text-white font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-navy-light transition-colors shadow-md"
              >
                Link Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {photos.length > 0 && (
      <div className="print-only page-break mt-8">
        <h3 className="text-xl font-bold bg-brand-navy text-white p-2 mb-4 font-display">PHOTOGRAPHIC EVIDENCE</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {photos.map(p => {
            const linkedItem = p.linkedItemId ? items[p.linkedItemId] : null;
            // Best effort timestamp detection. Ideally stored with photo, but watermark happens at creation.
            // We'll just show the linked text and unit info.
            return (
              <div key={p.id} className="border-2 border-gray-300 p-4 rounded-lg page-break-inside-avoid">
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center mb-4 overflow-hidden border border-gray-200">
                  <img src={p.dataUri} className="max-w-full max-h-full object-contain" alt="Evidence" />
                </div>
                <div className="text-sm text-gray-800 font-medium space-y-1">
                  <p><strong>Item:</strong> {linkedItem ? linkedItem.text.split('—')[0] : 'Unlinked'}</p>
                  <p><strong>Location:</strong> {p.facilityName || facilityName} - Unit {p.unitNumber || unitNumber}</p>
                </div>
                <div className="mt-3">
                  <a href={p.dataUri} target="_blank" rel="noreferrer" className="text-brand-navy font-bold text-sm underline pb-1">
                    View Full Size
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
    </>
  );
}
