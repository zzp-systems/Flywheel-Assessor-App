import React, { useRef, useState } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { ChecklistItem, Photo } from '../types';

interface PhotoTrackerProps {
  photos: Photo[];
  items: Record<string, ChecklistItem>;
  facilityName: string;
  unitNumber: string;
  building: string;
  onAddPhoto: (uri: string, linkedItemIds: string[], metadata: { facilityName: string, unitNumber: string, buildingFloor: string, caption?: string }, skipped?: boolean) => void;
  onRemovePhoto: (id: string) => void;
}

const applyWatermark = (base64Image: string, facilityName: string, unitNumber: string, building: string, timestamp: string, linkedSummary?: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Image); // Safety fallback

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(14, Math.floor(img.width * 0.03));
      ctx.font = `${fontSize}px sans-serif`;
      
      const padding = fontSize * 0.5;

      const dateStr = new Date(timestamp).toLocaleString();
      const lines = [
        facilityName || 'Facility Not Set',
        `${unitNumber ? `Unit ${unitNumber}` : 'Unit Not Set'} ${building ? `| ${building}` : ''}`
      ];
      
      if (linkedSummary) {
        lines.push(`Item(s): ${linkedSummary}`);
      }

      // Top Right:
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      
      let maxTextWidth = 0;
      lines.forEach(line => {
         const metrics = ctx.measureText(line);
         if (metrics.width > maxTextWidth) maxTextWidth = metrics.width;
      });

      const trBoxWidth = maxTextWidth + padding * 2;
      const trBoxHeight = (lines.length * fontSize * 1.4) + padding;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(canvas.width - trBoxWidth, 0, trBoxWidth, trBoxHeight);
      
      ctx.fillStyle = '#FFFFFF';
      lines.forEach((line, index) => {
         const lineY = padding / 2 + (index * fontSize * 1.4);
         ctx.fillText(line, canvas.width - padding, lineY);
      });

      // Bottom Left:
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      const blBoxWidth = ctx.measureText(dateStr).width + padding * 2;
      const blBoxHeight = fontSize * 1.4 + padding;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, canvas.height - blBoxHeight, blBoxWidth, blBoxHeight);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(dateStr, padding, canvas.height - padding / 2);

      resolve(canvas.toDataURL('image/png', 0.8));
    };
    img.onerror = () => resolve(base64Image);
    img.src = base64Image;
  });
};

export function PhotoTracker({ photos, items, facilityName, unitNumber, building, onAddPhoto, onRemovePhoto }: PhotoTrackerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  React.useEffect(() => {
    const handleTrigger = (e: CustomEvent) => {
      setSelectedItemIds([e.detail.itemId]);
      fileInputRef.current?.click();
    };
    window.addEventListener('trigger-photo-capture', handleTrigger as EventListener);
    return () => window.removeEventListener('trigger-photo-capture', handleTrigger as EventListener);
  }, []);

  const requiredShots = [
    'Exterior front of facility (with signage)',
    'Unit exterior door (with unit number visible)',
    'Wide shot of unit interior (all corners if large)',
    'Thermostat / HVAC control reading (if climate‑controlled)',
    'Electrical panel interior',
    'Under sinks / near plumbing (if applicable)',
    'Gate access control panel',
    'Roll‑up door track & weather seal',
    'Overhead door spring assembly',
    'Fire extinguisher tag / date',
    'Any damage, safety issues, or pest evidence',
    'Hallway condition (both directions from unit)',
    'Trash area / dumpster',
    'General security camera overview',
    'Additional context shot'
  ];

  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setPendingPhoto(event.target.result);
          // Don't reset selectedItemIds if it was triggered via checklist camera icon
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
    if (pendingPhoto && selectedItemIds.length > 0) {
      const timestamp = new Date().toISOString();
      
      let captions: string[] = [];
      selectedItemIds.forEach(id => {
        if (id.startsWith('required-shot-')) {
          const shot = requiredShots.find(s => `required-shot-${slugify(s)}` === id);
          if (shot) captions.push(shot);
        } else if (items[id]) {
          captions.push(items[id].text.split('—')[0].trim());
        }
      });

      const linkedSummary = captions.join(', ');
      const watermarkedUri = await applyWatermark(pendingPhoto, facilityName, unitNumber, building, timestamp, linkedSummary);

      onAddPhoto(watermarkedUri, selectedItemIds, {
        facilityName,
        unitNumber,
        buildingFloor: building,
        caption: linkedSummary
      });
      setPendingPhoto(null);
      setSelectedItemIds([]);
    }
  };

  const cancelPhoto = () => {
    setPendingPhoto(null);
    setSelectedItemIds([]);
  };

  const toggleItemId = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const redItems = Object.values(items).filter(i => i.tier === 'Red');
  const yellowItems = Object.values(items).filter(i => i.tier === 'Yellow');
  const greenItems = Object.values(items).filter(i => i.tier === 'Green');
  const slateItems = Object.values(items).filter(i => i.tier === 'Slate');

  const coveredRequiredShots = new Set(
    photos
      .flatMap(p => p.linkedItemIds || (p.linkedItemId ? [p.linkedItemId] : []))
      .filter(id => id.startsWith('required-shot-'))
  );

  const totalRequired = requiredShots.length;
  const uniqueRequiredCaptured = coveredRequiredShots.size;

  const createSkippedImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N/A', canvas.width / 2, canvas.height / 2);
    }
    return canvas.toDataURL('image/png');
  };

  const skipRequiredShot = (shot: string) => {
    const slug = `required-shot-${slugify(shot)}`;
    onAddPhoto(createSkippedImage(), [slug], {
      facilityName,
      unitNumber,
      buildingFloor: building,
      caption: shot
    }, true);
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-5 md:p-8 mb-8 no-print">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 border-b-2 border-gray-100 pb-4">
        <h3 className="text-2xl font-display font-black text-brand-navy uppercase tracking-widest">Photo Evidence Tracker</h3>
        <div className={`text-sm font-bold px-4 py-1.5 rounded-full shadow-inner ${uniqueRequiredCaptured >= totalRequired ? 'bg-brand-green text-white' : 'bg-brand-navy text-white'}`}>
          Required Shots: {uniqueRequiredCaptured} / {totalRequired}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 md:border-r-4 border-gray-100 pr-4">
          <p className="text-xs font-display font-bold text-gray-500 uppercase tracking-widest bg-gray-100 inline-block px-3 py-1 rounded mb-4">Required Shots</p>
          <ul className="text-xs space-y-2 text-gray-700 font-medium">
            {requiredShots.map((shot, i) => {
              const slug = `required-shot-${slugify(shot)}`;
              const isCovered = coveredRequiredShots.has(slug);
              return (
                <li key={i} className={`flex items-start justify-between gap-2 ${isCovered ? 'text-brand-green' : 'text-gray-600'}`}>
                  <div className="flex items-start gap-2 flex-grow">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 shadow-sm ${isCovered ? 'bg-brand-green' : 'bg-gray-300'}`}></div>
                    <span className={isCovered ? 'line-through opacity-70' : ''}>{shot}</span>
                  </div>
                  {!isCovered && (
                    <button 
                      onClick={() => skipRequiredShot(shot)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0"
                      title="Skip this shot"
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <div className="flex flex-wrap gap-4">
            {photos.map(p => {
              const ids = (p.linkedItemIds && p.linkedItemIds.length > 0) ? p.linkedItemIds : (p.linkedItemId ? [p.linkedItemId] : []);
              const isRequiredShot = ids.some(id => id.startsWith('required-shot-'));
              
              let displayText = 'Unlinked';
              if (p.caption) {
                displayText = isRequiredShot ? `📸 ${p.caption.split('—')[0]}` : p.caption;
              } else if (ids.length > 0) {
                const names = ids.map(id => items[id]?.text?.split('—')[0] || id);
                displayText = names.join(', ');
              }

              return (
                <div key={p.id} className="relative group w-28 flex-shrink-0 flex flex-col items-center">
                  <div className={`w-28 h-28 rounded-lg overflow-hidden border-4 bg-gray-50 shadow-md relative ${p.skipped ? 'border-gray-400 grayscale' : 'border-brand-navy'}`}>
                    <img src={p.dataUri} className="w-full h-full object-cover" alt="Evidence" />
                    <button 
                      onClick={() => onRemovePhoto(p.id)}
                      className="absolute top-1 right-1 bg-brand-red text-white p-1.5 rounded-full opacity-90 hover:opacity-100 shadow-md transform hover:scale-110 transition-transform"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                    {p.skipped && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                        <span className="text-white font-black text-2xl tracking-tighter drop-shadow-md">N/A</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center w-full">
                    <p className={`text-[10px] font-bold line-clamp-3 uppercase leading-tight ${isRequiredShot ? 'text-brand-green' : 'text-brand-navy-dark'}`}>
                      {displayText}
                    </p>
                    {p.unitNumber && (
                      <p className="text-[9px] font-black text-gray-500 uppercase mt-0.5">
                        Unit {p.unitNumber}
                      </p>
                    )}
                  </div>
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

              <div className="space-y-6 pb-4">
                {(() => {
                  const failed = Object.values(items).filter(i => i.status === 'Fail');
                  if (failed.length === 0) return null;
                  return (
                    <div className="space-y-2 mb-6 bg-red-50 p-4 rounded-xl border border-red-200">
                      <h4 className="text-xs font-display font-black text-brand-red uppercase tracking-widest border-b border-brand-red/20 pb-1 mb-2">
                        Recent Failed Items
                      </h4>
                      {failed.slice(0, 3).map(item => {
                const count = photos.filter(p => (p.linkedItemIds || []).includes(item.id) || p.linkedItemId === item.id).length;
                const checked = selectedItemIds.includes(item.id);
                return (
                  <label key={`recent-${item.id}`} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all bg-white ${checked ? 'border-brand-red ring-2 ring-brand-red/20 text-brand-red font-bold' : 'border-gray-200 hover:border-red-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={checked} onChange={() => toggleItemId(item.id)} className="hidden" />
                      <span className="text-sm line-clamp-2">{item.text}</span>
                    </div>
                    <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full ml-3 transition-colors">
                      {count > 0 ? (
                        <span className="flex items-center justify-center w-full h-full rounded-full bg-brand-green text-[10px] font-bold text-white shadow-sm leading-none">{count}</span>
                      ) : (
                        <span className="w-full h-full rounded-full border-2 border-gray-200"></span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          );
        })()}

        <div className="space-y-2">
          <h4 className="text-xs font-display font-black text-brand-navy uppercase tracking-widest border-b-2 border-blue-100 pb-1 flex items-center gap-1">
            <Camera size={14} /> Required Shots
          </h4>
          {requiredShots.map(shot => {
            const slugId = `required-shot-${slugify(shot)}`;
            const count = photos.filter(p => (p.linkedItemIds || []).includes(slugId) || p.linkedItemId === slugId).length;
            const checked = selectedItemIds.includes(slugId);
            return (
              <label key={slugId} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${checked ? 'border-brand-navy bg-blue-50 text-brand-navy font-bold shadow-sm' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={checked} onChange={() => toggleItemId(slugId)} className="hidden" />
                  <span className="text-sm line-clamp-2">{shot}</span>
                </div>
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full ml-3 transition-colors">
                  {count > 0 ? (
                    <span className="flex items-center justify-center w-full h-full rounded-full bg-brand-green text-[10px] font-bold text-white shadow-sm leading-none">{count}</span>
                  ) : (
                    <span className="w-full h-full rounded-full border-2 border-gray-200"></span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-display font-black text-brand-red uppercase tracking-widest border-b-2 border-red-100 pb-1 mt-6">Red Light / Life Safety</h4>
          {redItems.map(item => {
            const count = photos.filter(p => (p.linkedItemIds || []).includes(item.id) || p.linkedItemId === item.id).length;
            const checked = selectedItemIds.includes(item.id);
            return (
              <label key={item.id} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${checked ? 'border-brand-red bg-red-50 text-brand-red font-bold' : 'border-gray-200 hover:border-red-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={checked} onChange={() => toggleItemId(item.id)} className="hidden" />
                  <span className="text-sm line-clamp-2">{item.text}</span>
                </div>
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full ml-3 transition-colors">
                  {count > 0 ? (
                    <span className="flex items-center justify-center w-full h-full rounded-full bg-brand-green text-[10px] font-bold text-white shadow-sm leading-none">{count}</span>
                  ) : (
                    <span className="w-full h-full rounded-full border-2 border-gray-200"></span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-display font-black text-brand-amber uppercase tracking-widest border-b-2 border-amber-100 pb-1">Yellow Light</h4>
          {yellowItems.map(item => {
            const count = photos.filter(p => (p.linkedItemIds || []).includes(item.id) || p.linkedItemId === item.id).length;
            const checked = selectedItemIds.includes(item.id);
            return (
              <label key={item.id} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${checked ? 'border-brand-amber bg-amber-50 text-brand-amber font-bold' : 'border-gray-200 hover:border-amber-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={checked} onChange={() => toggleItemId(item.id)} className="hidden" />
                  <span className="text-sm line-clamp-2">{item.text}</span>
                </div>
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full ml-3 transition-colors">
                  {count > 0 ? (
                    <span className="flex items-center justify-center w-full h-full rounded-full bg-brand-green text-[10px] font-bold text-white shadow-sm leading-none">{count}</span>
                  ) : (
                    <span className="w-full h-full rounded-full border-2 border-gray-200"></span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-display font-black text-brand-green uppercase tracking-widest border-b-2 border-green-100 pb-1">Green Light</h4>
          {greenItems.map(item => {
            const count = photos.filter(p => (p.linkedItemIds || []).includes(item.id) || p.linkedItemId === item.id).length;
            const checked = selectedItemIds.includes(item.id);
            return (
              <label key={item.id} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${checked ? 'border-brand-green bg-green-50 text-brand-green font-bold' : 'border-gray-200 hover:border-green-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={checked} onChange={() => toggleItemId(item.id)} className="hidden" />
                  <span className="text-sm line-clamp-2">{item.text}</span>
                </div>
                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full ml-3 transition-colors">
                  {count > 0 ? (
                    <span className="flex items-center justify-center w-full h-full rounded-full bg-brand-green text-[10px] font-bold text-white shadow-sm leading-none">{count}</span>
                  ) : (
                    <span className="w-full h-full rounded-full border-2 border-gray-200"></span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {slateItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-display font-black text-gray-800 uppercase tracking-widest border-b-2 border-gray-200 pb-1">🔑 Access Credentials</h4>
            {slateItems.map(item => {
              const count = photos.filter(p => (p.linkedItemIds || []).includes(item.id) || p.linkedItemId === item.id).length;
              const checked = selectedItemIds.includes(item.id);
              return (
                <label key={item.id} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${checked ? 'border-gray-800 bg-gray-100 text-gray-900 font-bold' : 'border-gray-200 hover:border-gray-400'}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={checked} onChange={() => toggleItemId(item.id)} className="hidden" />
                    <span className="text-sm line-clamp-2">{item.text}</span>
                  </div>
                  <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full ml-3 transition-colors">
                    {count > 0 ? (
                      <span className="flex items-center justify-center w-full h-full rounded-full bg-brand-green text-[10px] font-bold text-white shadow-sm leading-none">{count}</span>
                    ) : (
                      <span className="w-full h-full rounded-full border-2 border-gray-200"></span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
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
                disabled={selectedItemIds.length === 0}
                onClick={submitPhoto} 
                className="flex-1 px-4 py-4 sm:py-3 bg-brand-navy rounded-lg text-white font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-navy-light transition-colors shadow-md"
              >
                Link Photos ({selectedItemIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {photos.length > 0 && (
      <div className="print-only page-break mt-8">
        <h3 className="text-xl font-bold bg-brand-navy text-white p-2 mb-4 font-display">PHOTOGRAPHIC EVIDENCE</h3>
        
        {(() => {
          const reqPhotos = photos.filter(p => (p.linkedItemIds || [p.linkedItemId]).some(id => id?.startsWith('required-shot-')));
          const otherPhotos = photos.filter(p => !(p.linkedItemIds || [p.linkedItemId]).some(id => id?.startsWith('required-shot-')));

          const renderList = (list: typeof photos) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {list.map(p => {
                const ids = (p.linkedItemIds && p.linkedItemIds.length > 0) ? p.linkedItemIds : (p.linkedItemId ? [p.linkedItemId] : []);
                const isRequiredShot = ids.some(id => id.startsWith('required-shot-'));
                
                let displayText = 'Unlinked';
                if (p.caption) {
                  displayText = isRequiredShot ? `📸 ${p.caption.split('—')[0]}` : p.caption;
                } else if (ids.length > 0) {
                  const names = ids.map(id => items[id]?.text?.split('—')[0] || id);
                  displayText = names.join(', ');
                }

                return (
                  <div key={p.id} className="border-2 border-gray-300 p-4 rounded-lg page-break-inside-avoid relative">
                    <div className={`w-full h-48 bg-gray-100 flex items-center justify-center mb-4 overflow-hidden border border-gray-200 ${p.skipped ? 'grayscale' : ''}`}>
                      <img src={p.dataUri} className="max-w-full max-h-full object-contain" alt="Evidence" />
                      {p.skipped && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                           <span className="bg-white/90 text-gray-400 font-black px-4 py-2 rounded text-2xl border-2 border-gray-300">N/A</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-800 font-medium space-y-1">
                      <p><strong>Item:</strong> {displayText}</p>
                      <p><strong>Location:</strong> {p.facilityName || facilityName} - Unit {p.unitNumber || unitNumber}</p>
                    </div>
                    {!p.skipped && (
                      <div className="mt-3">
                        <a href={p.dataUri} target="_blank" rel="noreferrer" className="text-brand-navy font-bold text-sm underline pb-1">
                          View Full Size
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );

          return (
            <>
              {reqPhotos.length > 0 && (
                <>
                  <h4 className="text-lg font-bold text-brand-navy mb-3 border-b-2 border-gray-200 pb-1 flex items-center gap-2">
                    <Camera size={20} /> Required Shots
                  </h4>
                  {renderList(reqPhotos)}
                </>
              )}
              {otherPhotos.length > 0 && (
                <>
                  <h4 className="text-lg font-bold text-brand-navy mb-3 border-b-2 border-gray-200 pb-1">Assessment Items</h4>
                  {renderList(otherPhotos)}
                </>
              )}
            </>
          );
        })()}
      </div>
    )}
    </>
  );
}
