import { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';

export default function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const correctPin = localStorage.getItem('whisper_pin');

  const handlePress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'];

  return (
    <div className="fixed inset-0 z-[100] bg-[#08010f] flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-end pb-12">
        <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
          <Lock className="w-7 h-7 text-accent-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Enter Passcode</h2>
        <p className="text-sm text-white/40 mb-10">Unlock your Whisper diary</p>

        {/* Pin Dots */}
        <div className={`flex gap-5 mb-8 ${error ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                pin.length > i 
                  ? error ? 'bg-red-500 border-red-500' : 'bg-accent-400 border-accent-400 scale-110'
                  : 'border-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-[280px] w-full mb-16">
        {numbers.map((num, idx) => {
          if (num === '') return <div key={idx} />;
          if (num === 'del') {
            return (
              <button 
                key={idx}
                onClick={handleDelete}
                disabled={pin.length === 0}
                className="h-[72px] flex items-center justify-center text-white/50 hover:bg-white/5 rounded-full active:bg-white/10 transition-colors"
              >
                <Delete className="w-7 h-7" />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handlePress(num.toString())}
              className="h-[72px] flex items-center justify-center text-[28px] font-medium text-white hover:bg-white/5 rounded-full active:bg-white/10 transition-colors"
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}
