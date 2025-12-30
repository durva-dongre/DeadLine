import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

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
  slug: string;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Fetch events with pagination, including slug field
    const { data: events, error, count } = await supabase
      .from('events')
      .select('event_id, title, image_url, status, tags, query, summary, last_updated, incident_date, slug', { count: 'exact' })
      .order('incident_date', { ascending: false, nullsFirst: false })
      .order('last_updated', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events', events: [] },
        { status: 500 }
      );
    }
    
    const hasMore = count ? (offset + limit) < count : false;
    
    return NextResponse.json(
      { 
        events: events || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'CDN-Cache-Control': 'public, s-maxage=3600',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
        },
      }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', events: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { revalidate, secret } = body;
    
    if (process.env.REVALIDATION_SECRET && secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }
    
    if (revalidate) {
      revalidatePath('/api/get/events');
      
      return NextResponse.json(
        { 
          revalidated: true, 
          timestamp: new Date().toISOString() 
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { error: 'No revalidate parameter provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}