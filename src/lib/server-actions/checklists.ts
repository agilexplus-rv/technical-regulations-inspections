"use server";

import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { getCurrentUser } from "@/lib/auth/auth";
import { Checklist, ChecklistStatus } from "@/types";
import { revalidatePath } from "next/cache";

export async function createChecklist(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions
    if (!["officer", "manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to create checklists");
    }

    const supabase = createSupabaseAdminClient();

    const checklistData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      json_schema: JSON.parse(formData.get("jsonSchema") as string),
      version: formData.get("version") as string || "1.0.0",
      status: "draft" as ChecklistStatus,
      created_by: user.id,
    };

    const { data: checklist, error } = await supabase
      .from("checklists")
      .insert(checklistData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create checklist: ${error.message}`);
    }

    revalidatePath("/dashboard/checklists");
    return { success: true, checklist };
  } catch (error) {
    console.error("Error creating checklist:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateChecklist(
  checklistId: string, 
  formData: FormData
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const updateData: any = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      json_schema: JSON.parse(formData.get("jsonSchema") as string),
      version: formData.get("version") as string,
      updated_at: new Date().toISOString(),
    };

    // Only allow status updates if user has permission
    const newStatus = formData.get("status") as ChecklistStatus;
    if (newStatus && ["manager", "admin"].includes(user.role)) {
      updateData.status = newStatus;
      if (newStatus === "published") {
        updateData.published_by = user.id;
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: checklist, error } = await supabase
      .from("checklists")
      .update(updateData)
      .eq("id", checklistId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update checklist: ${error.message}`);
    }

    revalidatePath("/dashboard/checklists");
    return { success: true, checklist };
  } catch (error) {
    console.error("Error updating checklist:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function publishChecklist(checklistId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions
    if (!["manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to publish checklists");
    }

    const supabase = createSupabaseAdminClient();

    const { data: checklist, error } = await supabase
      .from("checklists")
      .update({
        status: "published",
        published_by: user.id,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", checklistId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to publish checklist: ${error.message}`);
    }

    revalidatePath("/dashboard/checklists");
    return { success: true, checklist };
  } catch (error) {
    console.error("Error publishing checklist:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getChecklist(checklistId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: checklist, error } = await supabase
      .from("checklists")
      .select("*")
      .eq("id", checklistId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch checklist: ${error.message}`);
    }

    return { success: true, checklist };
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getPublishedChecklists(userId: string) {
  try {
    if (!userId) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: checklists, error } = await supabase
      .from("checklists")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch published checklists: ${error.message}`);
    }

    return { success: true, checklists };
  } catch (error) {
    console.error("Error fetching published checklists:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getAllChecklists(userId: string, userRole: string) {
  try {
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Check permissions
    if (!["officer", "manager", "admin"].includes(userRole)) {
      throw new Error("Insufficient permissions to view all checklists");
    }

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("checklists")
      .select("*")
      .order("created_at", { ascending: false });

    // Officers can only see their own drafts, but all published
    if (userRole === "officer") {
      query = query.or("status.eq.published,created_by.eq." + userId);
    }

    const { data: checklists, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch checklists: ${error.message}`);
    }

    return { success: true, checklists };
  } catch (error) {
    console.error("Error fetching checklists:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function deleteChecklist(checklistId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions
    if (!["manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to delete checklists");
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("checklists")
      .delete()
      .eq("id", checklistId);

    if (error) {
      throw new Error(`Failed to delete checklist: ${error.message}`);
    }

    revalidatePath("/dashboard/checklists");
    return { success: true };
  } catch (error) {
    console.error("Error deleting checklist:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
