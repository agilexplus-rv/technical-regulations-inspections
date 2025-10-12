import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { verifyMFAToken } from "@/lib/auth/auth";

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { error: "User ID and OTP are required" },
        { status: 400 }
      );
    }

    // Verify MFA token
    const isValid = await verifyMFAToken(userId, otp);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired MFA token" },
        { status: 401 }
      );
    }

    const adminSupabase = createSupabaseAdminClient();

    // Get user data using admin client to bypass RLS
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('MFA verification: User not found', userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update last login time using admin client
    await adminSupabase
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    // MFA verification successful - return user data
    return NextResponse.json({
      success: true,
      message: "MFA verification successful",
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        firstName: userData.first_name,
        lastName: userData.last_name,
        mfaEnabled: userData.mfa_enabled,
        lastLoginAt: userData.last_login_at,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      }
    });
  } catch (error) {
    console.error("MFA verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
