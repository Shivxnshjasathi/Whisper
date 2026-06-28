import { useRef, useState, useEffect } from 'react';
import { X, Check, Undo2 } from 'lucide-react';

const COLORS = [
  '#f8fafc', // white
  '#f472b6', // rose
  '#38bdf8', // sky
  '#34d399', // emerald
  '#fbbf24', // amber
  '#a78bfa', // violet
];

export default function DoodleCanvas({ onSave, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [ctx, setCtx] = useState(null);
  
  // store image snapshots for undo
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set internal canvas resolution higher for retina displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 6;
    context.strokeStyle = color;
    
    setCtx(context);
    
    // Save initial blank state
    setHistory([canvas.toDataURL()]);
  }, []);

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = color;
    }
  }, [color, ctx]);

  const saveState = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    setHistory(prev => [...prev, dataUrl]);
  };

  const handleUndo = () => {
    if (history.length <= 1 || !ctx || !canvasRef.current) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    
    const img = new Image();
    img.src = newHistory[newHistory.length - 1];
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0, canvasRef.current.width / 2, canvasRef.current.height / 2);
    };
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // prevent scrolling
    const coords = getCoordinates(e);
    if (!coords || !ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || !ctx) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      ctx.closePath();
      setIsDrawing(false);
      saveState();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const file = new File([blob], `doodle-${Date.now()}.png`, { type: 'image/png' });
      onSave(file);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-plum-950 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 safe-top">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/50 active:scale-95">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white/80 font-medium">Draw a Doodle</span>
        <button onClick={handleSave} className="w-10 h-10 flex items-center justify-center text-accent-400 active:scale-95">
          <Check className="w-6 h-6" />
        </button>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 relative w-full touch-none bg-[#08010f]" >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      
      {/* Toolbar */}
      <div className="p-4 border-t border-white/10 bg-plum-950/80 backdrop-blur-xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
             <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="w-10 h-10 flex items-center justify-center text-white/50 disabled:opacity-30 active:scale-95"
            >
              <Undo2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
