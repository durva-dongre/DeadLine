import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <h1 
          className="text-6xl md:text-8xl font-black tracking-tight text-black mb-8" 
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          DEADLINE
        </h1>
        
        <div className="mb-4">
          <p className="text-8xl md:text-9xl font-black text-black mb-4">
            404
          </p>
        </div>
        
        <div className="mb-12">
          <p className="text-2xl md:text-3xl font-bold text-black mb-4">
            Not Found
          </p>
          <p className="text-lg font-normal text-black tracking-wide font-mono max-w-md mx-auto">
            Like justice in this country, the page you're looking for doesn't exist.
          </p>
        </div>
        
        <Link 
          href="/"
          className="inline-block px-8 py-3 border-2 border-black text-black font-mono text-sm hover:bg-black hover:text-white transition-colors duration-200"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}