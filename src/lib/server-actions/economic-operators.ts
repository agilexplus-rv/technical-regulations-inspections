"use server";

import { createSupabaseAdminClient } from "@/lib/auth/server-auth";
import { getCurrentUser } from "@/lib/auth/auth";
import { EconomicOperator } from "@/types";
import { revalidatePath } from "next/cache";

export async function createEconomicOperator(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const operatorData = {
      name: formData.get("name") as string,
      vat_number: formData.get("vatNumber") as string || null,
      email: formData.get("email") as string || null,
      address: formData.get("address") as string || null,
      phone: formData.get("phone") as string || null,
    };

    const { data: operator, error } = await supabase
      .from("economic_operators")
      .insert(operatorData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create economic operator: ${error.message}`);
    }

    revalidatePath("/dashboard");
    return { success: true, operator };
  } catch (error) {
    console.error("Error creating economic operator:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateEconomicOperator(
  operatorId: string, 
  formData: FormData
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const updateData = {
      name: formData.get("name") as string,
      vat_number: formData.get("vatNumber") as string || null,
      email: formData.get("email") as string || null,
      address: formData.get("address") as string || null,
      phone: formData.get("phone") as string || null,
      updated_at: new Date().toISOString(),
    };

    const { data: operator, error } = await supabase
      .from("economic_operators")
      .update(updateData)
      .eq("id", operatorId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update economic operator: ${error.message}`);
    }

    revalidatePath("/dashboard");
    return { success: true, operator };
  } catch (error) {
    console.error("Error updating economic operator:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getEconomicOperator(operatorId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: operator, error } = await supabase
      .from("economic_operators")
      .select("*")
      .eq("id", operatorId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch economic operator: ${error.message}`);
    }

    return { success: true, operator };
  } catch (error) {
    console.error("Error fetching economic operator:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function searchEconomicOperators(searchTerm: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("economic_operators")
      .select("id, name, vat_number, email")
      .order("name");

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,vat_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data: operators, error } = await query.limit(10);

    if (error) {
      throw new Error(`Failed to search economic operators: ${error.message}`);
    }

    return { success: true, operators };
  } catch (error) {
    console.error("Error searching economic operators:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getEconomicOperatorsByVAT(vatNumber: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const supabase = createSupabaseAdminClient();

    const { data: operator, error } = await supabase
      .from("economic_operators")
      .select("*")
      .eq("vat_number", vatNumber)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
      throw new Error(`Failed to fetch economic operator by VAT: ${error.message}`);
    }

    return { success: true, operator: operator || null };
  } catch (error) {
    console.error("Error fetching economic operator by VAT:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
