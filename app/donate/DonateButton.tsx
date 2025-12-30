'use client';

import { useState } from 'react';
import { Heart, X } from 'lucide-react';

export default function DonateButton() {
  const [showQR, setShowQR] = useState(false);

  const upiId = process.env.NEXT_PUBLIC_UPI_ID || '';
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || '';
  const upiNote = process.env.NEXT_PUBLIC_UPI_NOTE || '';

  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(upiNote)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(upiLink)}`;

  const handleDonate = () => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = upiLink;
    } else {
      setShowQR(true);
    }
  };

  return (
    <>
      <button
        onClick={handleDonate}
        className="w-full bg-black text-white py-4 px-4 font-mono text-sm tracking-wide hover:bg-gray-800 transition-all duration-300 mb-8 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
      >
        <Heart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
        DONATE NOW
      </button>

      {/* QR Code Modal */}
      {showQR && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowQR(false)}
        >
          <div 
            className="bg-white shadow-2xl p-6 sm:p-8 max-w-sm w-full border border-black"
            style={{ animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                DONATE
              </h3>
              <button 
                onClick={() => setShowQR(false)} 
                className="text-white bg-black hover:bg-gray-800 p-2 transition-all duration-200"
                aria-label="Close QR modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center mb-6 p-4 bg-gray-50 border border-black">
              <img
                src={qrCodeUrl}
                alt="UPI QR Code for donation"
                className="w-56 h-56 sm:w-64 sm:h-64"
                loading="lazy"
              />
            </div>

            <div className="bg-black text-white p-4 text-center">
              <p className="text-sm font-mono tracking-wide uppercase">
                THANK YOU FOR YOUR SUPPORT
              </p>
              <p className="text-xs font-mono mt-2 opacity-80">
                Scan with any UPI app
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}