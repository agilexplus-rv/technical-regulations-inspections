import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server-auth";
import { generateMFAToken, storeMFASession, isMFAEnabled } from "@/lib/auth/auth";
import { sendMFATokenEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Sign in with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Check if MFA is enabled for this user
    const mfaEnabled = await isMFAEnabled(authData.user.id);
    console.log('🔍 Login API: MFA check for user', authData.user.email, 'MFA enabled:', mfaEnabled);

    if (mfaEnabled) {
      // Generate and store MFA token
      const mfaToken = await generateMFAToken();
      await storeMFASession(authData.user.id, mfaToken, request);

      // Store the session information temporarily for after MFA verification
      // We'll return it in the response so the frontend can store it

      // Send MFA token via email
      try {
        await sendMFATokenEmail(authData.user.email!, mfaToken);
        console.log(`MFA token sent to user ${authData.user.email}`);
      } catch (emailError) {
        console.warn("Failed to send MFA token email:", emailError);
        // Don't fail the entire operation if email fails, but log the issue
      }

      return NextResponse.json({
        success: true,
        requiresMFA: true,
        userId: authData.user.id,
        message: "MFA token sent to your email",
        sessionData: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        }
      });
    }

    // Update last login time
    await supabase
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id);

    return NextResponse.json({
      success: true,
      user: authData.user,
      session: authData.session,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
