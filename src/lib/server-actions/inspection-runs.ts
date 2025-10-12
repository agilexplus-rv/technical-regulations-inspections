"use server";

import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { getCurrentUser } from "@/lib/auth/auth";
import { InspectionRun, InspectionRunStatus } from "@/types";
import { revalidatePath } from "next/cache";

export async function createInspectionRun(
  inspectionId: string,
  checklistId: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: inspectionRun, error } = await supabase
      .from("inspection_runs")
      .insert({
        inspection_id: inspectionId,
        checklist_id: checklistId,
        status: "in_progress" as InspectionRunStatus,
        started_by: user.id,
        responses_json: {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create inspection run: ${error.message}`);
    }

    revalidatePath(`/inspections/${inspectionId}`);
    return { success: true, inspectionRun };
  } catch (error) {
    console.error("Error creating inspection run:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateInspectionRunResponses(
  runId: string,
  responses: Record<string, any>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: inspectionRun, error } = await supabase
      .from("inspection_runs")
      .update({
        responses_json: responses,
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update inspection run: ${error.message}`);
    }

    revalidatePath(`/inspections/${inspectionRun.inspection_id}`);
    return { success: true, inspectionRun };
  } catch (error) {
    console.error("Error updating inspection run:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function completeInspectionRun(runId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: inspectionRun, error } = await supabase
      .from("inspection_runs")
      .update({
        status: "completed" as InspectionRunStatus,
        completed_by: user.id,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to complete inspection run: ${error.message}`);
    }

    revalidatePath(`/inspections/${inspectionRun.inspection_id}`);
    return { success: true, inspectionRun };
  } catch (error) {
    console.error("Error completing inspection run:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getInspectionRun(runId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: inspectionRun, error } = await supabase
      .from("inspection_runs")
      .select(`
        *,
        checklists (
          id,
          name,
          description,
          json_schema
        ),
        inspections (
          id,
          status,
          vat_number,
          location_lat,
          location_lng,
          address_final
        )
      `)
      .eq("id", runId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch inspection run: ${error.message}`);
    }

    return { success: true, inspectionRun };
  } catch (error) {
    console.error("Error fetching inspection run:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getInspectionRuns(inspectionId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: inspectionRuns, error } = await supabase
      .from("inspection_runs")
      .select(`
        *,
        checklists (
          id,
          name,
          description,
          version
        )
      `)
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch inspection runs: ${error.message}`);
    }

    return { success: true, inspectionRuns };
  } catch (error) {
    console.error("Error fetching inspection runs:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
