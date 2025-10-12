"use server";

import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { getCurrentUser } from "@/lib/auth/auth";
import { Inspection, InspectionStatus } from "@/types";
import { revalidatePath } from "next/cache";

export async function createInspection(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Extract form data
    const vatNumber = formData.get("vatNumber") as string;
    const locationLat = parseFloat(formData.get("locationLat") as string);
    const locationLng = parseFloat(formData.get("locationLng") as string);
    const addressSuggested = formData.get("addressSuggested") as string;
    const addressFinal = formData.get("addressFinal") as string;
    const addressAccuracy = parseFloat(formData.get("addressAccuracy") as string) || null;
    const investigationId = formData.get("investigationId") as string || null;

    const supabase = createSupabaseAdminClient();

    // Create the inspection
    const { data: inspection, error } = await supabase
      .from("inspections")
      .insert({
        status: "draft" as InspectionStatus,
        created_by: user.id,
        assigned_to: user.id,
        vat_number: vatNumber,
        location_lat: locationLat,
        location_lng: locationLng,
        address_suggested: addressSuggested,
        address_final: addressFinal,
        address_accuracy_m: addressAccuracy,
        investigation_id: investigationId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create inspection: ${error.message}`);
    }

    revalidatePath("/dashboard");
    return { success: true, inspection };
  } catch (error) {
    console.error("Error creating inspection:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateInspectionStatus(
  inspectionId: string, 
  status: InspectionStatus
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set timestamps based on status
    if (status === "in_progress") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("inspections")
      .update(updateData)
      .eq("id", inspectionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update inspection: ${error.message}`);
    }

    revalidatePath("/dashboard");
    revalidatePath(`/inspections/${inspectionId}`);
    return { success: true, inspection: data };
  } catch (error) {
    console.error("Error updating inspection:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function assignInspection(
  inspectionId: string, 
  assignedTo: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("inspections")
      .update({
        assigned_to: assignedTo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inspectionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign inspection: ${error.message}`);
    }

    revalidatePath("/dashboard");
    return { success: true, inspection: data };
  } catch (error) {
    console.error("Error assigning inspection:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getInspection(inspectionId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: inspection, error } = await supabase
      .from("inspections")
      .select(`
        *,
        economic_operators (
          id,
          name,
          vat_number,
          email,
          address,
          phone
        )
      `)
      .eq("id", inspectionId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch inspection: ${error.message}`);
    }

    return { success: true, inspection };
  } catch (error) {
    console.error("Error fetching inspection:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getUserInspections(userId: string, userRole: string) {
  try {
    if (!userId) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("inspections")
      .select(`
        *,
        economic_operators (
          id,
          name,
          vat_number
        )
      `)
      .order("created_at", { ascending: false });

    // Apply role-based filtering
    if (userRole === "inspector") {
      query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
    } else if (userRole === "officer") {
      // Officers can see team inspections
      query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
    }
    // Managers and Admins can see all inspections (no additional filter)

    const { data: inspections, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch inspections: ${error.message}`);
    }

    return { success: true, inspections };
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
