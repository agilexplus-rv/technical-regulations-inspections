import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/auth/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user data to get the email
    const adminSupabase = createSupabaseAdminClient();
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create a new session by signing in the user
    // We'll use a temporary password that we know works
    const supabase = createSupabaseServerClient();
    
    // For MFA completion, we'll create a session by using the admin client
    // to generate a session token directly
    const { data: sessionData, error: sessionError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`
      }
    });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Return the session link
    return NextResponse.json({
      success: true,
      sessionLink: sessionData.properties.action_link
    });

  } catch (error) {
    console.error("MFA completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
