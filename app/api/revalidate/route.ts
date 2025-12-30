import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Define all available cache tags
const ALL_CACHE_TAGS = {
  events: ['events-list'],
  eventDetails: (id: string) => [`event-${id}`, `event-details-${id}`, `event-updates-${id}`],
  donations: ['donations-cache'],
};

// Helper to get all tags
function getAllTags(): string[] {
  return [
    ...ALL_CACHE_TAGS.events,
    ...ALL_CACHE_TAGS.donations,
  ];
}

// Helper to calculate cache info
function getCacheInfo(tags: string[]) {
  return {
    tagsCount: tags.length,
    tags: tags,
    estimatedSize: `${(tags.length * 0.5).toFixed(2)} KB`, // Rough estimate
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      api_key, 
      event_id, 
      revalidate_main, 
      revalidate_donations,
      revalidate_all 
    } = body;

    if (!api_key || api_key !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Invalid API key' },
        { status: 401 }
      );
    }

    const tagsToRevalidate: string[] = [];
    let message = '';

    // Handle revalidate all option
    if (revalidate_all) {
      const allTags = getAllTags();
      tagsToRevalidate.push(...allTags);
      message = 'All caches revalidated successfully';
    } else {
      // Handle event revalidation
      if (event_id) {
        const eventTags = ALL_CACHE_TAGS.eventDetails(event_id);
        tagsToRevalidate.push(...eventTags);
        message = `Cache revalidated for event ${event_id}`;
      }

      // Handle main events list revalidation
      if (revalidate_main) {
        tagsToRevalidate.push(...ALL_CACHE_TAGS.events);
        message = event_id 
          ? `${message} and main events list`
          : 'Cache revalidated for main events list';
      }

      // Handle donations revalidation
      if (revalidate_donations) {
        tagsToRevalidate.push(...ALL_CACHE_TAGS.donations);
        message = message 
          ? `${message} and donations`
          : 'Cache revalidated for donations';
      }
    }

    if (tagsToRevalidate.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No revalidation parameters provided' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    await fetch(`${baseUrl}/api/internal/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: tagsToRevalidate
      }),
    });

    return NextResponse.json({
      success: true,
      message,
      revalidated: true,
      tags: tagsToRevalidate,
      cacheInfo: getCacheInfo(tagsToRevalidate),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const api_key = searchParams.get('api_key');
    const event_id = searchParams.get('event_id');
    const revalidate_main = searchParams.get('revalidate_main') === 'true';
    const revalidate_donations = searchParams.get('revalidate_donations') === 'true';
    const revalidate_all = searchParams.get('revalidate_all') === 'true';

    if (!api_key || api_key !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Invalid API key' },
        { status: 401 }
      );
    }

    const tagsToRevalidate: string[] = [];
    let message = '';

    // Handle revalidate all option
    if (revalidate_all) {
      const allTags = getAllTags();
      tagsToRevalidate.push(...allTags);
      message = 'All caches revalidated successfully';
    } else {
      if (event_id) {
        const eventTags = ALL_CACHE_TAGS.eventDetails(event_id);
        tagsToRevalidate.push(...eventTags);
        message = `Cache revalidated for event ${event_id}`;
      }

      if (revalidate_main) {
        tagsToRevalidate.push(...ALL_CACHE_TAGS.events);
        message = event_id 
          ? `${message} and main events list`
          : 'Cache revalidated for main events list';
      }

      if (revalidate_donations) {
        tagsToRevalidate.push(...ALL_CACHE_TAGS.donations);
        message = message 
          ? `${message} and donations`
          : 'Cache revalidated for donations';
      }
    }

    if (tagsToRevalidate.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No revalidation parameters provided' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    await fetch(`${baseUrl}/api/internal/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: tagsToRevalidate
      }),
    });

    return NextResponse.json({
      success: true,
      message,
      revalidated: true,
      tags: tagsToRevalidate,
      cacheInfo: getCacheInfo(tagsToRevalidate),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}