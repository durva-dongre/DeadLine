 import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
      { success: false, message: 'event_id is required' },
      { status: 400 }
    );
  }

  try {
    revalidateTag(`event-${event_id}`);
    revalidateTag(`event-updates-${event_id}`);

    return NextResponse.json({
      success: true,
      message: `Cache revalidated for event ${event_id}`,
      revalidated: true,
      now: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Error revalidating cache', error: String(err) },
      { status: 500 }
    );
  }
}
