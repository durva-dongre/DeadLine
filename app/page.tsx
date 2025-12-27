import { Metadata } from 'next';
import { EventsClient } from './events-client';

interface Event {
  event_id: number;
  title: string;
  image_url: string | null;
  status: string;
  tags: string[] | null;
  query: string | null;
  summary: string | null;
  last_updated: string | null;
  incident_date: string | null;
}

async function getEvents(): Promise<Event[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/get/events`, {
      next: { 
        tags: ['events-list'],
        revalidate: false
      },
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch events:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    const events = data.events || [];
    
    return events.sort((a: Event, b: Event) => {
      const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
      const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export async function generateMetadata(): Promise<Metadata> {
  const events = await getEvents();
  const latestEvent = events.length > 0 ? events[0] : null;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://deadline.com';
  
  const title = latestEvent 
    ? `${latestEvent.title} | DEADLINE - Museum of Temporary Truths`
    : 'DEADLINE - Museum of Temporary Truths';
  
  const description = latestEvent && latestEvent.summary
    ? truncateText(latestEvent.summary, 200)
    : 'DEADLINE: A Museum of Temporary Truths. Documenting stories of justice and injustice as they unfold.';
  
  const imageUrl = latestEvent && latestEvent.image_url
    ? latestEvent.image_url
    : `${baseUrl}/og-default.png`;

  return {
    title,
    description,
    keywords: ['deadline', 'news', 'investigation', 'justice', 'injustice', 'events', 'stories'],
    authors: [{ name: 'DEADLINE' }],
    creator: 'DEADLINE',
    publisher: 'DEADLINE',
    applicationName: 'DEADLINE',
    openGraph: {
      type: 'website',
      url: baseUrl,
      title,
      description,
      siteName: 'DEADLINE',
      locale: 'en_US',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: latestEvent ? latestEvent.title : 'DEADLINE - Museum of Temporary Truths',
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@deadline',
      site: '@deadline',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: baseUrl,
    },
    metadataBase: new URL(baseUrl),
  };
}

export const dynamic = 'force-static';
export const revalidate = false;
export const fetchCache = 'force-cache';

export default async function DeadlineEventsPage() {
  const events = await getEvents();
  const latestEvent = events.length > 0 ? events[0] : null;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://deadline.com';
  const imageUrl = latestEvent && latestEvent.image_url
    ? latestEvent.image_url
    : `${baseUrl}/og-default.png`;
  const description = latestEvent && latestEvent.summary
    ? truncateText(latestEvent.summary, 200)
    : 'DEADLINE: A Museum of Temporary Truths. Documenting stories of justice and injustice as they unfold.';
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DEADLINE',
    description: 'Museum of Temporary Truths',
    url: baseUrl,
    publisher: {
      '@type': 'Organization',
      name: 'DEADLINE',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <meta name="description" content={description} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@deadline" />
      <meta name="twitter:creator" content="@deadline" />
      <meta name="twitter:title" content={latestEvent ? latestEvent.title : 'DEADLINE - Museum of Temporary Truths'} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={latestEvent ? latestEvent.title : 'DEADLINE'} />
      
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="DEADLINE" />
      <meta property="og:title" content={latestEvent ? latestEvent.title : 'DEADLINE - Museum of Temporary Truths'} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={latestEvent ? latestEvent.title : 'DEADLINE'} />
      <meta property="og:url" content={baseUrl} />
      <meta property="og:locale" content="en_US" />
      
      <link rel="canonical" href={baseUrl} />
      
      <div className="min-h-screen bg-white">
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-16 text-center">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-black mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              DEADLINE
            </h1>
            <p className="text-lg font-normal text-black tracking-wide font-mono">
              Museum of Temporary Truths
            </p>
          </div>
        </section>
        <EventsClient initialEvents={events} />
        <footer className="border-t border-black bg-white mt-24">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center">
              <h3 className="text-2xl font-black tracking-tight mb-4 text-black" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>DEADLINE</h3>
              <p className="text-sm font-normal text-black tracking-wide font-mono">
                Museum of Temporary Truths
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
