"use server";

import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { getCurrentUser } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";

export async function getUserProfile(userId: string, userEmail: string) {
  try {
    console.log('🔍 getUserProfile server action called');
    console.log('User ID:', userId);
    console.log('User Email:', userEmail);
    
    // Use admin client to query database
    const adminSupabase = createSupabaseAdminClient();
    
    // First try by ID, then by email if that fails
    let { data: profile, error: profileError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Query by ID result:', { 
      found: !!profile, 
      error: profileError?.message,
      code: profileError?.code 
    });

    // If not found by ID, try by email (for cases where IDs don't match)
    if (profileError && profileError.code === 'PGRST116') {
      console.log('User not found by ID, trying by email...');
      const emailResult = await adminSupabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();
      
      console.log('Query by email result:', { 
        found: !!emailResult.data, 
        error: emailResult.error?.message,
        code: emailResult.error?.code 
      });
      
      if (!emailResult.error && emailResult.data) {
        profile = emailResult.data;
        profileError = null;
        console.log('✅ Found user by email:', profile.email);
      }
    }

    if (profileError || !profile) {
      console.log('❌ No profile found in database');
      return { success: false, error: "User profile not found" };
    }

    console.log('✅ Found user profile:', profile);

    return {
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        firstName: profile.first_name,
        lastName: profile.last_name,
        mfaEnabled: profile.mfa_enabled,
        lastLoginAt: profile.last_login_at ? new Date(profile.last_login_at) : undefined,
        createdAt: new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at),
      }
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateUserProfile(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();
    
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    // Validate required fields
    if (!firstName || !lastName) {
      throw new Error("First name and last name are required");
    }

    // Update user profile
    const { error } = await supabase
      .from("users")
      .update({
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentUser.id);

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    revalidatePath("/dashboard/settings/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function toggleMFA(enabled: boolean, userId?: string) {
  try {
    let targetUserId = userId;
    
    // If no userId provided, try to get current user
    if (!targetUserId) {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error("Authentication required");
      }
      targetUserId = currentUser.id;
    }

    const supabase = createSupabaseAdminClient();

    // Update MFA setting
    const { error } = await supabase
      .from("users")
      .update({
        mfa_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId);

    if (error) {
      throw new Error(`Failed to update MFA setting: ${error.message}`);
    }

    revalidatePath("/dashboard/settings/profile");
    revalidatePath("/dashboard/settings/users");
    return { success: true };
  } catch (error) {
    console.error("Error toggling MFA:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
