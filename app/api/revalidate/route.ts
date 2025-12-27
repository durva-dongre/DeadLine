import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key, event_id } = body;

    if (!api_key || api_key !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (!event_id) {
      return NextResponse.json(
        { success: false, message: 'Missing event_id' },
        { status: 400 }
      );
    }

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/internal/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: [
          `event-${event_id}`,
          `event-details-${event_id}`,
          `event-updates-${event_id}`
        ]
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Cache revalidated for event ${event_id}`,
      revalidated: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const api_key = searchParams.get('api_key');
    const event_id = searchParams.get('event_id');

    if (!api_key || api_key !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (!event_id) {
      return NextResponse.json(
        { success: false, message: 'Missing event_id' },
        { status: 400 }
      );
    }

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/internal/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: [
          `event-${event_id}`,
          `event-details-${event_id}`,
          `event-updates-${event_id}`
        ]
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Cache revalidated for event ${event_id}`,
      revalidated: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}