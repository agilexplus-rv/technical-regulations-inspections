"use server";

import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { getCurrentUser } from "@/lib/auth/auth";
import { InspectionMedia } from "@/types";
import { revalidatePath } from "next/cache";

export async function uploadInspectionMedia(
  inspectionId: string,
  formData: FormData
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const file = formData.get("file") as File;
    const mediaType = formData.get("mediaType") as string;
    const description = formData.get("description") as string || "";
    const questionId = formData.get("questionId") as string || null;

    if (!file) {
      throw new Error("No file provided");
    }

    const supabase = createSupabaseAdminClient();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${inspectionId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("evidence")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("evidence")
      .getPublicUrl(fileName);

    // Save media record to database
    const { data: mediaRecord, error: dbError } = await supabase
      .from("inspection_media")
      .insert({
        inspection_id: inspectionId,
        question_id: questionId,
        file_name: file.name,
        file_path: fileName,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        media_type: mediaType,
        description: description,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("evidence").remove([fileName]);
      throw new Error(`Failed to save media record: ${dbError.message}`);
    }

    revalidatePath(`/inspections/${inspectionId}`);
    return { success: true, media: mediaRecord };
  } catch (error) {
    console.error("Error uploading media:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function deleteInspectionMedia(mediaId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    // First get the media record to get the file path
    const { data: mediaRecord, error: fetchError } = await supabase
      .from("inspection_media")
      .select("file_path, inspection_id")
      .eq("id", mediaId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch media record: ${fetchError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("evidence")
      .remove([mediaRecord.file_path]);

    if (storageError) {
      console.warn(`Failed to delete file from storage: ${storageError.message}`);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("inspection_media")
      .delete()
      .eq("id", mediaId);

    if (dbError) {
      throw new Error(`Failed to delete media record: ${dbError.message}`);
    }

    revalidatePath(`/inspections/${mediaRecord.inspection_id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting media:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getInspectionMedia(inspectionId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: media, error } = await supabase
      .from("inspection_media")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch inspection media: ${error.message}`);
    }

    return { success: true, media };
  } catch (error) {
    console.error("Error fetching inspection media:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getMediaByQuestion(inspectionId: string, questionId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: media, error } = await supabase
      .from("inspection_media")
      .select("*")
      .eq("inspection_id", inspectionId)
      .eq("question_id", questionId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch media by question: ${error.message}`);
    }

    return { success: true, media };
  } catch (error) {
    console.error("Error fetching media by question:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateMediaDescription(
  mediaId: string,
  description: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: media, error } = await supabase
      .from("inspection_media")
      .update({
        description: description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update media description: ${error.message}`);
    }

    revalidatePath(`/inspections/${media.inspection_id}`);
    return { success: true, media };
  } catch (error) {
    console.error("Error updating media description:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
