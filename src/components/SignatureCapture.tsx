import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Upload, Type, PenTool } from 'lucide-react';

interface SignatureCaptureProps {
  onSave: (base64String: string, timestamp: string) => void;
  onCancel: () => void;
  initialName?: string;
}

type TabType = 'Type' | 'Draw' | 'Upload';

export function SignatureCapture({ onSave, onCancel, initialName = '' }: SignatureCaptureProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Draw');
  
  // Type state
  const [typedName, setTypedName] = useState(initialName);
  const [selectedFont, setSelectedFont] = useState('Dancing Script');
  const typeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw state
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'Draw') {
      initDrawCanvas();
    } else if (activeTab === 'Type') {
      renderTypedSignature();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Type') {
      renderTypedSignature();
    }
  }, [typedName, selectedFont]);

  const clearCanvasArea = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const renderTypedSignature = () => {
    const canvas = typeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    clearCanvasArea(canvas, ctx);
    
    if (typedName.trim()) {
      ctx.font = `40px "${selectedFont}"`;
      ctx.fillStyle = '#0F1C2E'; // brand-navy-dark
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
    }
  };

  const initDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!hasDrawn) {
      clearCanvasArea(canvas, ctx);
    }

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F1C2E';
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getCoordinates(e);
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const clearDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      clearCanvasArea(canvas, ctx);
      setHasDrawn(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUpload = () => {
    setUploadedImage(null);
  };

  const handleSave = () => {
    let dataUrl = '';
    if (activeTab === 'Draw') {
      if (!hasDrawn) {
        alert("Please draw a signature before saving.");
        return;
      }
      dataUrl = drawCanvasRef.current!.toDataURL('image/png');
    } else if (activeTab === 'Type') {
      if (!typedName.trim()) {
        alert("Please type a name before saving.");
        return;
      }
      dataUrl = typeCanvasRef.current!.toDataURL('image/png');
    } else if (activeTab === 'Upload') {
      if (!uploadedImage) {
        alert("Please upload an image before saving.");
        return;
      }
      dataUrl = uploadedImage;
    }
    
    onSave(dataUrl, new Date().toISOString());
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-brand-navy flex justify-between items-center text-white">
          <h2 className="font-display font-bold text-lg">E-Signature Capture</h2>
          <button onClick={onCancel} className="p-1 hover:bg-white/20 rounded transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button 
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'Draw' ? 'text-brand-navy border-b-2 border-brand-navy bg-brand-navy/5' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('Draw')}
          >
            <PenTool size={16} /> Draw
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'Type' ? 'text-brand-navy border-b-2 border-brand-navy bg-brand-navy/5' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('Type')}
          >
            <Type size={16} /> Type
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'Upload' ? 'text-brand-navy border-b-2 border-brand-navy bg-brand-navy/5' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('Upload')}
          >
            <Upload size={16} /> Upload
          </button>
        </div>

        <div className="p-6 bg-gray-50 min-h-[300px] flex flex-col">
          {activeTab === 'Draw' && (
            <div className="flex-1 flex flex-col">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg flex-1 relative overflow-hidden touch-none">
                <canvas 
                  ref={drawCanvasRef}
                  width={400}
                  height={200}
                  className="w-full h-full cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400 font-medium">
                    Sign Here
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={clearDrawing} className="text-sm flex items-center gap-1 text-gray-500 hover:text-red-500 font-medium">
                  <Eraser size={14} /> Clear Canvas
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Type' && (
            <div className="flex-1 flex flex-col gap-4">
              <input 
                type="text" 
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                placeholder="Type your name..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20 outline-none text-lg"
              />
              <div className="flex gap-2">
                {['Dancing Script', 'Caveat', 'Pacifico'].map(font => (
                  <button 
                    key={font}
                    onClick={() => setSelectedFont(font)}
                    className={`flex-1 py-2 border rounded font-medium ${selectedFont === font ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg flex-1 flex items-center justify-center p-4 min-h-[120px]">
                <canvas 
                  ref={typeCanvasRef}
                  width={400}
                  height={150}
                  className="max-w-full hidden"
                />
                {typedName ? (
                   <div style={{ fontFamily: selectedFont }} className="text-4xl text-brand-navy-dark text-center select-none">
                     {typedName}
                   </div>
                ) : (
                  <div className="text-gray-400 font-medium">Preview will appear here</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Upload' && (
            <div className="flex-1 flex flex-col justify-center">
              {uploadedImage ? (
                <div className="relative bg-white border border-gray-300 rounded-lg p-4 flex items-center justify-center mb-4 min-h-[150px]">
                  <img src={uploadedImage} alt="Uploaded signature" className="max-h-32 object-contain" />
                  <button onClick={clearUpload} className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="bg-white border-2 border-dashed border-gray-300 rounded-lg flex-1 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                   <Upload size={32} className="text-gray-400 mb-2" />
                   <span className="text-sm font-bold text-gray-600">Click to upload image</span>
                   <span className="text-xs text-gray-400 mt-1">PNG or JPG (transparent bg recommended)</span>
                   <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileUpload} />
                </label>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white">
          <button onClick={onCancel} className="px-5 py-2 font-bold text-gray-600 rounded bg-gray-100 hover:bg-gray-200">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 font-bold text-white rounded bg-brand-navy shadow hover:bg-brand-navy-light">
            Insert Signature
          </button>
        </div>
      </div>
    </div>
  );
}
