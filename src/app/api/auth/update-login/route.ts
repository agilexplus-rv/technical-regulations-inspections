import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/auth/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Update last login time
    const { error } = await supabase
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error("Error updating last login:", error);
      return NextResponse.json(
        { error: "Failed to update last login time" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Last login time updated successfully",
    });
  } catch (error) {
    console.error("Update login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
