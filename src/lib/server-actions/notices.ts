"use server";

import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { getCurrentUser } from "@/lib/auth/auth";
import { Notice, NoticeStatus } from "@/types";
import { revalidatePath } from "next/cache";

export async function createNotice(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions - only officers, managers, and admins can create notices
    if (!["officer", "manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to create notices");
    }

    const supabase = createSupabaseAdminClient();

    const noticeData = {
      inspection_id: formData.get("inspectionId") as string,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      notice_type: formData.get("noticeType") as string,
      status: "draft" as NoticeStatus,
      legal_basis: formData.get("legalBasis") as string || null,
      corrective_actions: formData.get("correctiveActions") as string || null,
      compliance_deadline: formData.get("complianceDeadline") as string || null,
      drafted_by_officer_id: user.role === "officer" ? user.id : null,
    };

    const { data: notice, error } = await supabase
      .from("notices")
      .insert(noticeData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notice: ${error.message}`);
    }

    revalidatePath(`/inspections/${noticeData.inspection_id}`);
    return { success: true, notice };
  } catch (error) {
    console.error("Error creating notice:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateNotice(
  noticeId: string,
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
      content: formData.get("content") as string,
      notice_type: formData.get("noticeType") as string,
      legal_basis: formData.get("legalBasis") as string || null,
      corrective_actions: formData.get("correctiveActions") as string || null,
      compliance_deadline: formData.get("complianceDeadline") as string || null,
      updated_at: new Date().toISOString(),
    };

    // Handle status updates with proper permissions
    const newStatus = formData.get("status") as NoticeStatus;
    if (newStatus) {
      if (newStatus === "signed" && ["manager", "admin"].includes(user.role)) {
        updateData.status = newStatus;
        updateData.signed_by_manager_id = user.id;
        updateData.signed_at = new Date().toISOString();
      } else if (newStatus === "issued" && ["officer", "manager", "admin"].includes(user.role)) {
        updateData.status = newStatus;
        updateData.issued_at = new Date().toISOString();
      }
    }

    const { data: notice, error } = await supabase
      .from("notices")
      .update(updateData)
      .eq("id", noticeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update notice: ${error.message}`);
    }

    revalidatePath(`/inspections/${notice.inspection_id}`);
    return { success: true, notice };
  } catch (error) {
    console.error("Error updating notice:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function signNotice(noticeId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions - only managers and admins can sign notices
    if (!["manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to sign notices");
    }

    const supabase = createSupabaseAdminClient();

    const { data: notice, error } = await supabase
      .from("notices")
      .update({
        status: "signed",
        signed_by_manager_id: user.id,
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", noticeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to sign notice: ${error.message}`);
    }

    revalidatePath(`/inspections/${notice.inspection_id}`);
    return { success: true, notice };
  } catch (error) {
    console.error("Error signing notice:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function issueNotice(noticeId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions - officers, managers, and admins can issue notices
    if (!["officer", "manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to issue notices");
    }

    const supabase = createSupabaseAdminClient();

    const { data: notice, error } = await supabase
      .from("notices")
      .update({
        status: "issued",
        issued_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", noticeId)
      .eq("status", "signed") // Only issue signed notices
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to issue notice: ${error.message}`);
    }

    revalidatePath(`/inspections/${notice.inspection_id}`);
    return { success: true, notice };
  } catch (error) {
    console.error("Error issuing notice:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getNotice(noticeId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: notice, error } = await supabase
      .from("notices")
      .select(`
        *,
        inspections (
          id,
          vat_number,
          status,
          economic_operators (
            name,
            vat_number,
            address
          )
        )
      `)
      .eq("id", noticeId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch notice: ${error.message}`);
    }

    return { success: true, notice };
  } catch (error) {
    console.error("Error fetching notice:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getInspectionNotices(inspectionId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: notices, error } = await supabase
      .from("notices")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch inspection notices: ${error.message}`);
    }

    return { success: true, notices };
  } catch (error) {
    console.error("Error fetching inspection notices:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function deleteNotice(noticeId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permissions - only managers and admins can delete notices
    if (!["manager", "admin"].includes(user.role)) {
      throw new Error("Insufficient permissions to delete notices");
    }

    const supabase = createSupabaseAdminClient();

    // First get the notice to check its status and get inspection_id
    const { data: notice, error: fetchError } = await supabase
      .from("notices")
      .select("id, status, inspection_id")
      .eq("id", noticeId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch notice: ${fetchError.message}`);
    }

    if (notice.status !== "draft") {
      throw new Error("Only draft notices can be deleted");
    }

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", noticeId);

    if (error) {
      throw new Error(`Failed to delete notice: ${error.message}`);
    }

    revalidatePath(`/inspections/${notice.inspection_id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting notice:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function generateNoticePDF(noticeId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    // Get notice with all related data
    const { data: notice, error } = await supabase
      .from("notices")
      .select(`
        *,
        inspections (
          id,
          vat_number,
          status,
          economic_operators (
            name,
            vat_number,
            address,
            email
          )
        )
      `)
      .eq("id", noticeId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch notice: ${error.message}`);
    }

    // TODO: Implement PDF generation logic
    // This would typically involve:
    // 1. Creating HTML template with notice data
    // 2. Converting to PDF using a library like puppeteer
    // 3. Storing the PDF in Supabase Storage
    // 4. Returning the PDF URL

    // For now, return success with a placeholder
    return { 
      success: true, 
      message: "PDF generation not yet implemented",
      notice 
    };
  } catch (error) {
    console.error("Error generating notice PDF:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
