import { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://deadline.com';
  
  const title = 'Policies - DEADLINE Museum of Temporary Truths';
  const description = 'Our policies on data privacy, news documentation, and information transparency. DEADLINE does not store user data or require login. We document news from multiple verified sources.';
  const imageUrl = `${baseUrl}/og-default.png`;

  return {
    title,
    description,
    keywords: [
      'DEADLINE policies',
      'news documentation policy',
      'data privacy',
      'news archive policy',
      'no login policy',
      'news sources',
      'documentation transparency',
      'archived news policy',
      'news preservation ethics'
    ],
    authors: [{ name: 'DEADLINE', url: baseUrl }],
    creator: 'DEADLINE',
    publisher: 'DEADLINE',
    openGraph: {
      type: 'website',
      url: `${baseUrl}/policies`,
      title: 'Policies - DEADLINE Museum of Temporary Truths',
      description,
      siteName: 'DEADLINE - Museum of Temporary Truths',
      locale: 'en_US',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'DEADLINE Policies - Museum of Temporary Truths',
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Policies - DEADLINE',
      description,
      images: [imageUrl],
      creator: '@deadline',
      site: '@deadline',
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${baseUrl}/policies`,
    },
    metadataBase: new URL(baseUrl),
  };
}

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    if (window.history.length > 1 && document.referrer.includes(window.location.hostname)) {
                      window.history.back();
                    } else {
                      window.location.href = '/';
                    }
                  }
                }}
                className="text-black hover:opacity-70 transition-opacity flex items-center cursor-pointer"
                title="Go back"
                aria-label="Go back"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <Link
                href="/"
                className="text-xl font-black tracking-tight uppercase text-black hover:opacity-80 transition-opacity" 
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                title="DEADLINE - Museum of Temporary Truths"
                aria-label="DEADLINE - Museum of Temporary Truths Homepage"
              >
                DEADLINE
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-black mb-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          POLICIES
        </h1>

        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Data Privacy
            </h2>
            <div className="space-y-4 text-black font-mono text-base leading-relaxed">
              <p>
                DEADLINE does not store any personal user data. We do not have a login system, user accounts, or any form of user registration. Your privacy is inherently protected by our design.
              </p>
              <p>
                We use Vercel Analytics to understand how our platform is used. This analytics service collects anonymous usage data that helps us improve the documentation experience. No personally identifiable information is collected or stored through this service.
              </p>
              <p>
                We do not use cookies, tracking pixels, or any other data collection mechanisms beyond the anonymous analytics provided by Vercel.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              News Documentation Policy
            </h2>
            <div className="space-y-4 text-black font-mono text-base leading-relaxed">
              <p>
                DEADLINE is a news archival and documentation platform. We collect news from multiple verified sources, analyze the information, and maintain it in a structured format for public access and reference.
              </p>
              <p>
                Our documentation process involves gathering information from various news outlets, official reports, public records, and credible sources. We cross-reference information across multiple sources to ensure accuracy and completeness.
              </p>
              <p>
                Each documented event includes citations and links to original source materials, allowing users to verify information independently and access the primary sources.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              News Sources
            </h2>
            <div className="space-y-4 text-black font-mono text-base leading-relaxed">
              <p>
                We gather news and information from a wide range of sources including but not limited to:
              </p>
              <ul className="list-none space-y-2 pl-0">
                <li>• National and regional news publications</li>
                <li>• International news agencies</li>
                <li>• Government reports and official statements</li>
                <li>• Court documents and legal filings</li>
                <li>• Academic research and studies</li>
                <li>• Human rights organizations and NGO reports</li>
                <li>• Local news outlets and community journalism</li>
                <li>• Press releases and official communications</li>
                <li>• Public records and freedom of information requests</li>
              </ul>
              <p>
                All sources are cited and linked within each documented event. We prioritize credible, verifiable sources and maintain transparency about where information originates.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Disclaimer
            </h2>
            <div className="space-y-4 text-black font-mono text-base leading-relaxed">
              <p>
                DEADLINE presents news and information gathered from various sources. We do not take responsibility for the accuracy, completeness, or reliability of the original news sources.
              </p>
              <p>
                We are a documentation and archival platform. The information presented on DEADLINE is compiled from publicly available sources and is intended for informational and archival purposes only.
              </p>
              <p>
                Users should independently verify information and consult original sources before making decisions based on the content presented here.
              </p>
              <p>
                DEADLINE does not endorse, support, or oppose any individuals, organizations, or viewpoints mentioned in the documented events. We maintain neutrality in our documentation process.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Updates and Corrections
            </h2>
            <div className="space-y-4 text-black font-mono text-base leading-relaxed">
              <p>
                We maintain a comprehensive update log for each documented event. When new information becomes available or corrections are necessary, we update the relevant documentation and clearly mark the updates with timestamps.
              </p>
              <p>
                Update logs include the date of the update, the nature of the change, and the source of new information. This ensures transparency in our documentation process and allows users to track how information evolves over time.
              </p>
              <p>
                If you believe any documented information is inaccurate or incomplete, please contact us through our report page with supporting evidence and source citations.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Content Usage
            </h2>
            <div className="space-y-4 text-black font-mono text-base leading-relaxed">
              <p>
                The documentation and compilations on DEADLINE are provided for educational, research, and informational purposes. Users are encouraged to cite original sources when referencing information from this platform.
              </p>
              <p>
                While we organize and structure publicly available information, the underlying news content belongs to the original publishers and is subject to their respective copyrights and terms of use.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black tracking-tight text-black mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Contact
            </h2>
            <div className="space-y-4 text-black font-mono text-base leading-relaxed">
              <p>
                For questions, concerns, or submissions regarding our policies, documentation process, or specific documented events, please visit our report page or contact us through the channels listed on our about page.
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-black bg-white mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight mb-4 text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>DEADLINE</h2>
            <p className="text-sm font-normal text-black tracking-wide font-mono mb-6">
              Museum of Temporary Truths
            </p>
            <nav className="flex justify-center gap-8 text-sm font-mono mb-8" aria-label="Footer navigation">
              <a href="/about" className="text-black hover:underline" title="About DEADLINE - Our Mission">About</a>
              <a href="/report" className="text-black hover:underline" title="Report a Story">Report</a>
              <a href="/donate" className="text-black hover:underline" title="Support Our Work">Donate</a>
            </nav>
            <p className="text-xs text-gray-600 font-mono">
              © {new Date().getFullYear()} DEADLINE. Documenting lives that matter.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}