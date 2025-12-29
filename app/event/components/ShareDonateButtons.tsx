'use client';

import { useState } from 'react';

interface ShareDonateButtonsProps {
  eventId: string;
  headline: string;
  upiId: string;
  upiName: string;
  upiNote: string;
  baseUrl: string;
}

export default function ShareDonateButtons({ 
  eventId, 
  headline, 
  upiId, 
  upiName, 
  upiNote,
  baseUrl 
}: ShareDonateButtonsProps) {
  const [showQR, setShowQR] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const eventUrl = `${baseUrl}/event/${eventId}`;
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(upiNote)}`;

  const handleDonate = () => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = upiLink;
    } else {
      setShowQR(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: headline,
          text: `Check out this event: ${headline}`,
          url: eventUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setShowShareMenu(true);
        }
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      alert('Link copied to clipboard!');
      setShowShareMenu(false);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(headline)}&url=${encodeURIComponent(eventUrl)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareOnWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(headline + ' ' + eventUrl)}`, '_blank');
    setShowShareMenu(false);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleShare}
          className="p-2 bg-white text-black hover:bg-gray-200 transition-colors border border-white rounded"
          aria-label="Share"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>

        <button
          onClick={handleDonate}
          className="p-2 bg-white text-black hover:bg-gray-200 transition-colors border border-white rounded"
          aria-label="Donate"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {showShareMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowShareMenu(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-black">Share this event</h3>
              <button onClick={() => setShowShareMenu(false)} className="text-black hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <button onClick={copyToClipboard} className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded text-black font-mono text-sm">
                Copy Link
              </button>
              <button onClick={shareOnTwitter} className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded text-black font-mono text-sm">
                Share on Twitter
              </button>
              <button onClick={shareOnFacebook} className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded text-black font-mono text-sm">
                Share on Facebook
              </button>
              <button onClick={shareOnWhatsApp} className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded text-black font-mono text-sm">
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-black">Scan to Donate</h3>
              <button onClick={() => setShowQR(false)} className="text-black hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(upiLink)}`}
                alt="UPI QR Code"
                className="w-64 h-64"
              />
            </div>
            <p className="text-center text-sm text-gray-600 font-mono">Scan this QR code with your phone to donate via UPI</p>
          </div>
        </div>
      )}
    </>
  );
}