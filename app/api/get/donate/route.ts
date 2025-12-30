import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getCachedDonations = unstable_cache(
  async () => {
    try {
      const { data: donations, error } = await supabase
        .from('donations')
        .select('id, donor_name, amount, message, is_anonymous, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const totalAmount = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const donorCount = donations?.length || 0;

      return {
        donations: donations || [],
        totalAmount,
        donorCount,
        goal: Number(process.env.NEXT_PUBLIC_DONATION_GOAL) || 100000,
      };
    } catch (err) {
      console.error('getCachedDonations error:', err);
      throw err;
    }
  },
  ['donations-data'],
  {
    tags: ['donations-cache'],
    revalidate: false,
  }
);

export async function GET() {
  try {
    const data = await getCachedDonations();
    
    return NextResponse.json(
      { success: true, ...data },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/donations error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch donations',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}