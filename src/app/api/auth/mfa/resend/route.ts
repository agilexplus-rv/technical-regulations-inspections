import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { generateMFAToken, storeMFASession } from "@/lib/auth/auth";
import { sendMFATokenEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json();

    console.log('Resend MFA: Received request with:', { userId, userEmail });

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "User ID and email are required" },
        { status: 400 }
      );
    }

    const adminSupabase = createSupabaseAdminClient();

    // First, let's check if the user exists at all (without MFA filter)
    const { data: userExists, error: userExistsError } = await adminSupabase
      .from('users')
      .select('id, email, mfa_enabled')
      .eq('id', userId)
      .eq('email', userEmail)
      .single();

    console.log('Resend MFA: User exists check:', { userExists, userExistsError });

    if (userExistsError || !userExists) {
      console.error('Resend MFA: User not found', userExistsError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if MFA is enabled
    if (!userExists.mfa_enabled) {
      console.error('Resend MFA: MFA not enabled for user');
      return NextResponse.json(
        { error: "MFA not enabled for this user" },
        { status: 400 }
      );
    }

    const userData = userExists;

    // Generate and store new MFA token
    // This will automatically invalidate any existing MFA sessions for this user
    const newMfaToken = await generateMFAToken();
    await storeMFASession(userId, newMfaToken, request);
    
    console.log('Resend MFA: New token generated and old sessions invalidated for user:', userId);

    // Send new MFA token via email
    try {
      await sendMFATokenEmail(userEmail, newMfaToken);
      console.log(`New MFA token sent to user ${userEmail}`);
    } catch (emailError) {
      console.error("Failed to send MFA token email:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "New verification code sent to your email"
    });

  } catch (error) {
    console.error('Resend MFA error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
