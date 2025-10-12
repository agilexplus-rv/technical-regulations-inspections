"use server";

import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { getCurrentUser } from "@/lib/auth/auth";
import { Finding, FindingStatus } from "@/types";
import { revalidatePath } from "next/cache";

export async function createFinding(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const findingData = {
      inspection_id: formData.get("inspectionId") as string,
      question_id: formData.get("questionId") as string || null,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      severity: formData.get("severity") as string,
      status: "draft" as FindingStatus,
      legal_basis: formData.get("legalBasis") as string || null,
      corrective_action: formData.get("correctiveAction") as string || null,
      drafted_by: user.id,
    };

    const { data: finding, error } = await supabase
      .from("findings")
      .insert(findingData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create finding: ${error.message}`);
    }

    revalidatePath(`/inspections/${findingData.inspection_id}`);
    return { success: true, finding };
  } catch (error) {
    console.error("Error creating finding:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateFinding(
  findingId: string,
  formData: FormData
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const updateData: any = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      severity: formData.get("severity") as string,
      legal_basis: formData.get("legalBasis") as string || null,
      corrective_action: formData.get("correctiveAction") as string || null,
      updated_at: new Date().toISOString(),
    };

    // Handle status updates with proper permissions
    const newStatus = formData.get("status") as FindingStatus;
    if (newStatus) {
      if (newStatus === "approved_officer" && ["officer", "manager", "admin"].includes(user.role)) {
        updateData.status = newStatus;
        updateData.approved_by_officer_id = user.id;
        updateData.approved_by_officer_at = new Date().toISOString();
      } else if (newStatus === "approved_manager" && ["manager", "admin"].includes(user.role)) {
        updateData.status = newStatus;
        updateData.approved_by_manager_id = user.id;
        updateData.approved_by_manager_at = new Date().toISOString();
      } else if (newStatus === "rejected" && ["officer", "manager", "admin"].includes(user.role)) {
        updateData.status = newStatus;
        updateData.rejection_reason = formData.get("rejectionReason") as string || null;
      }
    }

    const { data: finding, error } = await supabase
      .from("findings")
      .update(updateData)
      .eq("id", findingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update finding: ${error.message}`);
    }

    revalidatePath(`/inspections/${finding.inspection_id}`);
    return { success: true, finding };
  } catch (error) {
    console.error("Error updating finding:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function approveFinding(
  findingId: string,
  approvalLevel: "officer" | "manager"
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions
    if (approvalLevel === "officer" && !["officer", "manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to approve as officer");
    }
    if (approvalLevel === "manager" && !["manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to approve as manager");
    }

    const supabase = createSupabaseAdminClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (approvalLevel === "officer") {
      updateData.status = "approved_officer";
      updateData.approved_by_officer_id = user.id;
      updateData.approved_by_officer_at = new Date().toISOString();
    } else {
      updateData.status = "approved_manager";
      updateData.approved_by_manager_id = user.id;
      updateData.approved_by_manager_at = new Date().toISOString();
    }

    const { data: finding, error } = await supabase
      .from("findings")
      .update(updateData)
      .eq("id", findingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve finding: ${error.message}`);
    }

    revalidatePath(`/inspections/${finding.inspection_id}`);
    return { success: true, finding };
  } catch (error) {
    console.error("Error approving finding:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function rejectFinding(
  findingId: string,
  rejectionReason: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions
    if (!["officer", "manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to reject findings");
    }

    const supabase = createSupabaseAdminClient();

    const { data: finding, error } = await supabase
      .from("findings")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", findingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reject finding: ${error.message}`);
    }

    revalidatePath(`/inspections/${finding.inspection_id}`);
    return { success: true, finding };
  } catch (error) {
    console.error("Error rejecting finding:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getFinding(findingId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: finding, error } = await supabase
      .from("findings")
      .select(`
        *,
        inspections (
          id,
          vat_number,
          status
        )
      `)
      .eq("id", findingId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch finding: ${error.message}`);
    }

    return { success: true, finding };
  } catch (error) {
    console.error("Error fetching finding:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getInspectionFindings(inspectionId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: findings, error } = await supabase
      .from("findings")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch inspection findings: ${error.message}`);
    }

    return { success: true, findings };
  } catch (error) {
    console.error("Error fetching inspection findings:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function deleteFinding(findingId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions - only allow deletion of draft findings
    if (!["manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to delete findings");
    }

    const supabase = createSupabaseAdminClient();

    // First get the finding to check its status and get inspection_id
    const { data: finding, error: fetchError } = await supabase
      .from("findings")
      .select("id, status, inspection_id")
      .eq("id", findingId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch finding: ${fetchError.message}`);
    }

    if (finding.status !== "draft") {
      throw new Error("Only draft findings can be deleted");
    }

    const { error } = await supabase
      .from("findings")
      .delete()
      .eq("id", findingId);

    if (error) {
      throw new Error(`Failed to delete finding: ${error.message}`);
    }

    revalidatePath(`/inspections/${finding.inspection_id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting finding:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
