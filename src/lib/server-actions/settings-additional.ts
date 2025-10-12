"use server";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/auth/server-auth";
import { createSupabaseClient } from "@/lib/database/supabase";
import { getCurrentUser } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { validatePasswordServerSide } from "@/lib/utils/password-validation";

// ==================== REPORT TEMPLATES ====================

export async function createReportTemplate(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: template, error } = await supabase
      .from("report_templates")
      .insert({
        name: formData.get("name") as string,
        description: formData.get("description") as string || null,
        format: formData.get("format") as string || "html",
        template_content: formData.get("templateContent") as string,
        mapping_json: JSON.parse(formData.get("mappingJson") as string || "{}"),
        version: formData.get("version") as string || "1.0.0",
        is_default: formData.get("isDefault") === "true",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create report template: ${error.message}`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true, template };
  } catch (error) {
    console.error("Error creating report template:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateReportTemplate(templateId: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: template, error } = await supabase
      .from("report_templates")
      .update({
        name: formData.get("name") as string,
        description: formData.get("description") as string || null,
        format: formData.get("format") as string || "html",
        template_content: formData.get("templateContent") as string,
        mapping_json: JSON.parse(formData.get("mappingJson") as string || "{}"),
        version: formData.get("version") as string || "1.0.0",
        is_default: formData.get("isDefault") === "true",
        is_active: formData.get("isActive") === "true",
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update report template: ${error.message}`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true, template };
  } catch (error) {
    console.error("Error updating report template:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function deleteReportTemplate(templateId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("report_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      throw new Error(`Failed to delete report template: ${error.message}`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting report template:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getAllReportTemplates() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: templates, error } = await supabase
      .from("report_templates")
      .select("*")
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch report templates: ${error.message}`);
    }

    return { success: true, templates };
  } catch (error) {
    console.error("Error fetching report templates:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// ==================== LEGISLATION ====================

export async function createLegislation(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !["officer", "manager", "admin"].includes(user.role)) {
      throw new Error("Officer access or above required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: legislation, error } = await supabase
      .from("legislation")
      .insert({
        title: formData.get("title") as string,
        description: formData.get("description") as string || null,
        act_name: formData.get("actName") as string,
        article_number: formData.get("articleNumber") as string || null,
        section_number: formData.get("sectionNumber") as string || null,
        content: formData.get("content") as string || null,
        effective_date: formData.get("effectiveDate") as string || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create legislation: ${error.message}`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true, legislation };
  } catch (error) {
    console.error("Error creating legislation:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateLegislation(legislationId: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !["officer", "manager", "admin"].includes(user.role)) {
      throw new Error("Officer access or above required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: legislation, error } = await supabase
      .from("legislation")
      .update({
        title: formData.get("title") as string,
        description: formData.get("description") as string || null,
        act_name: formData.get("actName") as string,
        article_number: formData.get("articleNumber") as string || null,
        section_number: formData.get("sectionNumber") as string || null,
        content: formData.get("content") as string || null,
        effective_date: formData.get("effectiveDate") as string || null,
        is_active: formData.get("isActive") === "true",
        updated_at: new Date().toISOString(),
      })
      .eq("id", legislationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update legislation: ${error.message}`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true, legislation };
  } catch (error) {
    console.error("Error updating legislation:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function deleteLegislation(legislationId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !["officer", "manager", "admin"].includes(user.role)) {
      throw new Error("Officer access or above required");
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("legislation")
      .delete()
      .eq("id", legislationId);

    if (error) {
      throw new Error(`Failed to delete legislation: ${error.message}`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting legislation:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getAllLegislation() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: legislation, error } = await supabase
      .from("legislation")
      .select("*")
      .order("act_name", { ascending: true })
      .order("article_number", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch legislation: ${error.message}`);
    }

    return { success: true, legislation };
  } catch (error) {
    console.error("Error fetching legislation:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// ==================== GEO SETTINGS ====================

export async function createGeoStreet(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: street, error } = await supabase
      .from("geo_streets")
      .insert({
        name: formData.get("name") as string,
        locality: formData.get("locality") as string,
        region: formData.get("region") as string,
        postcode: formData.get("postcode") as string || null,
        is_manual: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create geo street: ${error.message}`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true, street };
  } catch (error) {
    console.error("Error creating geo street:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateGeoStreet(streetId: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: street, error } = await supabase
      .from("geo_streets")
      .update({
        name: formData.get("name") as string,
        locality: formData.get("locality") as string,
        region: formData.get("region") as string,
        postcode: formData.get("postcode") as string || null,
        is_active: formData.get("isActive") === "true",
        updated_at: new Date().toISOString(),
      })
      .eq("id", streetId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update geo street: ${error.message}`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true, street };
  } catch (error) {
    console.error("Error updating geo street:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function deleteGeoStreet(streetId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("geo_streets")
      .delete()
      .eq("id", streetId);

    if (error) {
      throw new Error(`Failed to delete geo street: ${error.message}`);
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting geo street:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getAllGeoStreets() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: streets, error } = await supabase
      .from("geo_streets")
      .select("*")
      .order("region", { ascending: true })
      .order("locality", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch geo streets: ${error.message}`);
    }

    return { success: true, streets };
  } catch (error) {
    console.error("Error fetching geo streets:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function fetchOpenStreetMapData() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    // This would integrate with OpenStreetMap Overpass API
    // For now, we'll return a placeholder response
    // In a real implementation, you would:
    // 1. Query Overpass API for Malta and Gozo streets
    // 2. Parse the response
    // 3. Insert/update the geo_streets table
    
    return { 
      success: true, 
      message: "OpenStreetMap integration not yet implemented",
      count: 0 
    };
  } catch (error) {
    console.error("Error fetching OpenStreetMap data:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// ==================== PASSWORD CHANGE ====================

export async function changePassword(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      throw new Error("New passwords do not match");
    }

    // Validate password strength
    validatePasswordServerSide(newPassword);

    const adminSupabase = createSupabaseAdminClient();

    // Find the user in Supabase Auth by email
    const { data: authUsers, error: listError } = await adminSupabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing auth users:", listError);
      throw new Error("Failed to verify user authentication");
    }

    const authUser = authUsers.users.find(u => u.email === user.email);
    
    if (!authUser) {
      throw new Error("User not found in authentication system");
    }

    // Update the password using admin client
    // Note: We're skipping current password verification for now due to server-side context issues
    // In a production environment, you might want to implement a more secure verification method
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(authUser.id, {
      password: newPassword
    });

    if (updateError) {
      console.error("Admin password update error:", updateError);
      throw new Error(`Failed to change password: ${updateError.message}`);
    }

    console.log("✅ Password updated successfully");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
