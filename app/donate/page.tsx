'use client';

import { useState, useEffect } from 'react';
import { Heart, Users, Target, QrCode, X, ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
}

interface DonationData {
  donations: Donation[];
  totalAmount: number;
  donorCount: number;
  goal: number;
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-100 border border-gray-200 p-4 space-y-2">
            <div className="h-3 bg-gray-200 w-12"></div>
            <div className="h-6 bg-gray-200 w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonationsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-100 border border-gray-200 p-3 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 w-24"></div>
              <div className="h-3 bg-gray-200 w-12"></div>
            </div>
            <div className="h-2 bg-gray-200 w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DonationsPage() {
  const [data, setData] = useState<DonationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const router = useRouter();

  const upiId = process.env.NEXT_PUBLIC_UPI_ID || '';
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || '';
  const upiNote = process.env.NEXT_PUBLIC_UPI_NOTE || '';

  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(upiNote)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(upiLink)}`;

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/get/donate', {
        cache: 'force-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      try {
        const result = JSON.parse(text);
        if (result.success) {
          setData(result);
        } else {
          console.error('API returned error:', result.message);
        }
      } catch (parseError) {
        console.error('Failed to parse JSON:', text);
        console.error('Parse error:', parseError);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleDonate = () => {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = upiLink;
    } else {
      setShowQR(true);
    }
  };

  const progress = data ? Math.min((data.totalAmount / data.goal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-black bg-white sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-black hover:opacity-60 transition-opacity duration-300"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-lg sm:text-xl font-black tracking-tight uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                DEADLINE
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">
        {/* Hero Section */}
        <div className="mb-6 space-y-2">
          <h1 
            className="text-2xl sm:text-3xl font-bold tracking-tight text-black leading-tight"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Support Our Mission
          </h1>
          <p className="text-black font-mono text-xs sm:text-sm leading-relaxed">
            Help us document stories the world forgot.
          </p>
        </div>

        {loading ? (
          <>
            <StatsSkeleton />
            <div className="mb-6 animate-pulse">
              <div className="h-10 bg-gray-200 w-full mb-3"></div>
              <div className="h-2 bg-gray-200 w-full mb-4"></div>
            </div>
            <DonationsSkeleton />
          </>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-black p-4 sm:p-5 hover:shadow-lg transition-all duration-300 group">
                <Heart className="w-5 h-5 text-black mb-3 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-xs font-mono text-gray-600 mb-1 tracking-wide">RAISED</div>
                <div className="text-lg sm:text-2xl font-bold text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  ₹{data?.totalAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-white border border-black p-4 sm:p-5 hover:shadow-lg transition-all duration-300 group">
                <Target className="w-5 h-5 text-black mb-3 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-xs font-mono text-gray-600 mb-1 tracking-wide">GOAL</div>
                <div className="text-lg sm:text-2xl font-bold text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  ₹{data?.goal.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-white border border-black p-4 sm:p-5 hover:shadow-lg transition-all duration-300 group">
                <Users className="w-5 h-5 text-black mb-3 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-xs font-mono text-gray-600 mb-1 tracking-wide">DONORS</div>
                <div className="text-lg sm:text-2xl font-bold text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {data?.donorCount}
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="mb-8">
              <div className="bg-white border border-black p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-mono text-gray-600 tracking-wide">PROGRESS</span>
                  <span className="text-2xl font-bold text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3 border border-black bg-gray-50 overflow-hidden mb-4">
                  <div
                    className="h-full bg-black transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs font-mono text-gray-600">
                  ₹{((data?.goal ?? 0) - (data?.totalAmount ?? 0)).toLocaleString('en-IN')} remaining
                </div>
              </div>
            </div>

            {/* Donate Button */}
            <button
              onClick={handleDonate}
              className="w-full bg-black text-white py-4 px-4 font-mono text-sm tracking-wide hover:bg-gray-800 transition-all duration-300 mb-8 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
            >
              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              DONATE NOW
            </button>

            {/* Update Notice */}
            <div className="bg-gray-50 border border-black p-4 mb-8 flex items-start gap-3">
              <Clock className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-mono text-gray-600 leading-relaxed">
                Donations may take a few minutes to appear. Please refresh to see updates.
              </p>
            </div>

            {/* Recent Donations */}
            <div>
              <h2 
                className="text-xl sm:text-2xl font-bold text-black mb-6 tracking-tight"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                Recent Supporters
              </h2>

              {data?.donations && data.donations.length > 0 ? (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  {data.donations.map((donation, index) => (
                    <div
                      key={donation.id}
                      className="bg-white border border-black p-4 hover:shadow-lg transition-all duration-300"
                      style={{
                        animation: `fadeIn 0.5s ease-out ${index * 0.05}s both`
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-sm sm:text-base text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {donation.is_anonymous ? 'Anonymous' : donation.donor_name}
                        </div>
                        <div className="font-bold text-base sm:text-lg text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                          ₹{Number(donation.amount).toLocaleString('en-IN')}
                        </div>
                      </div>
                      {donation.message && (
                        <p className="text-xs sm:text-sm font-mono text-gray-700 mb-2 leading-relaxed">
                          "{donation.message}"
                        </p>
                      )}
                      <div className="text-xs font-mono text-gray-500">
                        {new Date(donation.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-black p-12 text-center">
                  <Heart className="w-10 h-10 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm font-mono text-gray-600">Be the first to support</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-6 border-t-2 border-black mt-8">
        <div className="px-4 sm:px-6">
          <div className="text-center mb-4 max-w-5xl mx-auto">
            <h2 className="text-base sm:text-lg font-black tracking-tight uppercase mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              DEADLINE
            </h2>
            <p className="text-white text-xs sm:text-sm font-mono">
              Museum of Temporary Truths
            </p>
          </div>
          <nav className="flex justify-center space-x-4 sm:space-x-6 max-w-5xl mx-auto">
            <a href="/about" className="text-xs font-mono text-white hover:underline transition-all duration-300">About</a>
            <a href="/report" className="text-xs font-mono text-white hover:underline transition-all duration-300">Report</a>
            <a href="/policies" className="text-xs font-mono text-white hover:underline transition-all duration-300">Policies</a>
          </nav>
        </div>
      </footer>

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
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

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
    </div>
  );
}