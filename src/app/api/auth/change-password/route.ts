import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/database/supabase";
import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { validatePasswordServerSide } from "@/lib/utils/password-validation";

export async function POST(request: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await request.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Email, current password, and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    try {
      validatePasswordServerSide(newPassword);
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : "Password validation failed" },
        { status: 400 }
      );
    }

    const supabaseClient = createSupabaseClient();
    const adminSupabase = createSupabaseAdminClient();

    // First, verify the current password by attempting to sign in
    try {
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 401 }
        );
      }

      // Sign out immediately after verification
      await supabaseClient.auth.signOut();

      // Now update the password using admin client
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(signInData.user.id, {
        password: newPassword
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        return NextResponse.json(
          { success: false, error: `Failed to update password: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });

    } catch (error) {
      console.error("Password change error:", error);
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
