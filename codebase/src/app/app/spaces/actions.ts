"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_SPACE_ICON_KEY, isSpaceIconKey } from "@/lib/spaces/icons";

export type CreateSpaceState = {
  error?: string;
};

export type UpdateSpaceState = {
  error?: string;
  ok?: boolean;
};

function readName(formData: FormData): string {
  return String(formData.get("name") ?? "").trim();
}

function readPurpose(formData: FormData): string | null {
  const purpose = String(formData.get("purpose") ?? "").trim();
  return purpose.length > 0 ? purpose : null;
}

function readIcon(formData: FormData): string {
  const icon = String(formData.get("icon") ?? "").trim();
  return isSpaceIconKey(icon) ? icon : DEFAULT_SPACE_ICON_KEY;
}

export async function createSpace(
  _prevState: CreateSpaceState,
  formData: FormData,
): Promise<CreateSpaceState> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return { error: "Workspace storage is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const name = readName(formData);

  if (!name) {
    return { error: "Please enter a name for the space." };
  }

  const { data, error } = await supabase
    .from("spaces")
    .insert({
      owner_id: user.id,
      name,
      purpose: readPurpose(formData),
      icon: readIcon(formData),
      health_status: "healthy",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A space with that name already exists." };
    }

    return { error: "Could not create the space. Please try again." };
  }

  revalidatePath("/app");
  redirect(`/app/spaces/${data.id}`);
}

export async function updateSpace(
  _prevState: UpdateSpaceState,
  formData: FormData,
): Promise<UpdateSpaceState> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return { error: "Workspace storage is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const spaceId = String(formData.get("space_id") ?? "").trim();
  const name = readName(formData);

  if (!spaceId) {
    return { error: "Missing space." };
  }

  if (!name) {
    return { error: "Please enter a name for the space." };
  }

  const { error } = await supabase
    .from("spaces")
    .update({
      name,
      purpose: readPurpose(formData),
      icon: readIcon(formData),
    })
    .eq("id", spaceId);

  if (error) {
    if (error.code === "23505") {
      return { error: "A space with that name already exists." };
    }

    return { error: "Could not save changes. Please try again." };
  }

  revalidatePath("/app");
  revalidatePath(`/app/spaces/${spaceId}`);
  return { ok: true };
}

export async function deleteSpace(formData: FormData): Promise<void> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect("/app");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const spaceId = String(formData.get("space_id") ?? "").trim();
  const confirmName = String(formData.get("confirm_name") ?? "").trim();

  if (!spaceId) {
    redirect("/app");
  }

  // Defense-in-depth: only delete when the typed name matches the real name.
  const { data: space } = await supabase
    .from("spaces")
    .select("name")
    .eq("id", spaceId)
    .maybeSingle();

  if (!space || space.name !== confirmName) {
    redirect(`/app/spaces/${spaceId}`);
  }

  await supabase.from("spaces").delete().eq("id", spaceId);

  revalidatePath("/app");
  redirect("/app");
}
