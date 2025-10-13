import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/database/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Get all legislations from the database
    const { data: legislations, error } = await supabase
      .from('legislation')
      .select('id, title')
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching legislations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch legislations' },
        { status: 500 }
      );
    }

    // Map title to name for frontend compatibility
    const formattedLegislations = (legislations || []).map(leg => ({
      id: leg.id,
      name: leg.title
    }));

    return NextResponse.json({
      legislations: formattedLegislations
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
