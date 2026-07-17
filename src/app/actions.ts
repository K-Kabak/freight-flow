"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { carrierFormSchema, clientFormSchema } from "@/lib/validation/directory";
import { shipmentFormSchema } from "@/lib/validation/shipment";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const idSchema = z.string().uuid();

function logActionError(operation: string, error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error && typeof error.code === "string"
      ? error.code
      : "unexpected";
  console.error(`[${operation}] failed`, { code });
}

async function safely(operation: string, action: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await action();
  } catch (error) {
    logActionError(operation, error);
    return { ok: false, message: "The request could not be completed. Please try again." };
  }
}

async function auth() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) logActionError("auth", error);
  return user ? { supabase, user } : null;
}

function refreshShipments() {
  revalidatePath("/shipments");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

function refreshDirectory(type: "clients" | "carriers") {
  revalidatePath(`/${type}`);
  revalidatePath("/shipments");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function upsertShipment(
  formData: FormData,
  shipmentId?: string,
): Promise<ActionResult> {
  return safely("upsertShipment", async () => {
    const parsed = shipmentFormSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const id = shipmentId ? idSchema.safeParse(shipmentId) : null;
    if (id && !id.success) return { ok: false, message: "Invalid shipment." };

    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const { data: profile, error: profileError } = await session.supabase
      .from("profiles")
      .select("reporting_currency")
      .eq("id", session.user.id)
      .single();
    if (profileError) {
      logActionError("upsertShipment.profile", profileError);
      return { ok: false, message: "Unable to load reporting settings." };
    }

    const payload = {
      ...parsed.data,
      exchange_rate_to_base:
        parsed.data.currency === profile.reporting_currency ? 1 : parsed.data.exchange_rate_to_base,
      notes: parsed.data.notes || null,
    };
    const result = id
      ? await session.supabase
          .from("shipments")
          .update(payload)
          .eq("id", id.data)
          .select("id")
          .maybeSingle()
      : await session.supabase
          .from("shipments")
          .insert({ ...payload, user_id: session.user.id })
          .select("id")
          .single();

    if (result.error) {
      logActionError("upsertShipment.mutation", result.error);
      return {
        ok: false,
        message:
          result.error.code === "23505"
            ? "This reference number already exists."
            : "The shipment could not be saved.",
      };
    }
    if (!result.data) return { ok: false, message: "The shipment is unavailable." };

    refreshShipments();
    return { ok: true };
  });
}

export async function deleteShipment(shipmentId: string): Promise<ActionResult> {
  return safely("deleteShipment", async () => {
    const parsed = idSchema.safeParse(shipmentId);
    if (!parsed.success) return { ok: false, message: "Invalid shipment." };
    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const { data, error } = await session.supabase
      .from("shipments")
      .delete()
      .eq("id", parsed.data)
      .select("id")
      .maybeSingle();
    if (error) {
      logActionError("deleteShipment.mutation", error);
      return { ok: false, message: "The shipment could not be deleted." };
    }
    if (!data) return { ok: false, message: "The shipment is unavailable." };
    refreshShipments();
    return { ok: true };
  });
}

export async function updateShipmentStatus(
  shipmentId: string,
  status: string,
): Promise<ActionResult> {
  return safely("updateShipmentStatus", async () => {
    const parsed = z
      .object({
        id: idSchema,
        status: z.enum(["New", "Accepted", "In Transit", "Delivered", "Cancelled", "Issue"]),
      })
      .safeParse({ id: shipmentId, status });
    if (!parsed.success) return { ok: false, message: "Invalid status." };
    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const { data, error } = await session.supabase
      .from("shipments")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();
    if (error) {
      logActionError("updateShipmentStatus.mutation", error);
      return { ok: false, message: "The status could not be updated." };
    }
    if (!data) return { ok: false, message: "The shipment is unavailable." };
    refreshShipments();
    return { ok: true };
  });
}

export async function createStarterDirectory(): Promise<ActionResult> {
  return safely("createStarterDirectory", async () => {
    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const [clientResult, carrierResult] = await Promise.all([
      session.supabase.from("clients").select("id").limit(1),
      session.supabase.from("carriers").select("id").limit(1),
    ]);
    if (clientResult.error || carrierResult.error) {
      logActionError(
        "createStarterDirectory.read",
        clientResult.error ?? carrierResult.error,
      );
      return { ok: false, message: "Could not inspect the starter directory." };
    }
    if (!clientResult.data?.length) {
      const { error } = await session.supabase.from("clients").insert({
        user_id: session.user.id,
        company_name: "Starter Client",
        tax_id: "PL0000000000",
        contact_person: "Demo Contact",
        email: "client@example.com",
        phone: "+48000000000",
      });
      if (error) {
        logActionError("createStarterDirectory.client", error);
        return { ok: false, message: "Could not create the starter client." };
      }
    }
    if (!carrierResult.data?.length) {
      const { error } = await session.supabase.from("carriers").insert({
        user_id: session.user.id,
        company_name: "Starter Carrier",
        country: "Poland",
        contact_person: "Demo Dispatcher",
        email: "carrier@example.com",
        phone: "+48000000001",
        vehicle_type: "Curtainsider",
        rating: 5,
      });
      if (error) {
        logActionError("createStarterDirectory.carrier", error);
        return { ok: false, message: "Could not create the starter carrier." };
      }
    }
    revalidatePath("/shipments/new");
    refreshDirectory("clients");
    refreshDirectory("carriers");
    return { ok: true };
  });
}

export async function createSampleWorkspace(): Promise<ActionResult> {
  return safely("createSampleWorkspace", async () => {
    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const { error } = await session.supabase.rpc("create_sample_workspace");
    if (error) {
      logActionError("createSampleWorkspace.mutation", error);
      return {
        ok: false,
        message:
          error.code === "23514"
            ? "Sample data can only be added to an empty workspace."
            : "The sample workspace could not be created.",
      };
    }
    revalidatePath("/", "layout");
    refreshDirectory("clients");
    refreshDirectory("carriers");
    return { ok: true };
  });
}

export async function upsertClient(formData: FormData, clientId?: string): Promise<ActionResult> {
  return safely("upsertClient", async () => {
    const parsed = clientFormSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const id = clientId ? idSchema.safeParse(clientId) : null;
    if (id && !id.success) return { ok: false, message: "Invalid client." };
    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const result = id
      ? await session.supabase
          .from("clients")
          .update(parsed.data)
          .eq("id", id.data)
          .select("id")
          .maybeSingle()
      : await session.supabase
          .from("clients")
          .insert({ ...parsed.data, user_id: session.user.id })
          .select("id")
          .single();
    if (result.error) {
      logActionError("upsertClient.mutation", result.error);
      return { ok: false, message: "The client could not be saved." };
    }
    if (!result.data) return { ok: false, message: "The client is unavailable." };
    refreshDirectory("clients");
    return { ok: true };
  });
}

export async function deleteClient(clientId: string): Promise<ActionResult> {
  return safely("deleteClient", async () => {
    const id = idSchema.safeParse(clientId);
    if (!id.success) return { ok: false, message: "Invalid client." };
    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const { data, error } = await session.supabase
      .from("clients")
      .delete()
      .eq("id", id.data)
      .select("id")
      .maybeSingle();
    if (error?.code === "23503") {
      return { ok: false, message: "Reassign or delete this client's shipments first." };
    }
    if (error) {
      logActionError("deleteClient.mutation", error);
      return { ok: false, message: "The client could not be deleted." };
    }
    if (!data) return { ok: false, message: "The client is unavailable." };
    refreshDirectory("clients");
    return { ok: true };
  });
}

export async function upsertCarrier(
  formData: FormData,
  carrierId?: string,
): Promise<ActionResult> {
  return safely("upsertCarrier", async () => {
    const parsed = carrierFormSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const id = carrierId ? idSchema.safeParse(carrierId) : null;
    if (id && !id.success) return { ok: false, message: "Invalid carrier." };
    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const result = id
      ? await session.supabase
          .from("carriers")
          .update(parsed.data)
          .eq("id", id.data)
          .select("id")
          .maybeSingle()
      : await session.supabase
          .from("carriers")
          .insert({ ...parsed.data, user_id: session.user.id })
          .select("id")
          .single();
    if (result.error) {
      logActionError("upsertCarrier.mutation", result.error);
      return { ok: false, message: "The carrier could not be saved." };
    }
    if (!result.data) return { ok: false, message: "The carrier is unavailable." };
    refreshDirectory("carriers");
    return { ok: true };
  });
}

export async function deleteCarrier(carrierId: string): Promise<ActionResult> {
  return safely("deleteCarrier", async () => {
    const id = idSchema.safeParse(carrierId);
    if (!id.success) return { ok: false, message: "Invalid carrier." };
    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const { data, error } = await session.supabase
      .from("carriers")
      .delete()
      .eq("id", id.data)
      .select("id")
      .maybeSingle();
    if (error?.code === "23503") {
      return { ok: false, message: "Reassign or delete this carrier's shipments first." };
    }
    if (error) {
      logActionError("deleteCarrier.mutation", error);
      return { ok: false, message: "The carrier could not be deleted." };
    }
    if (!data) return { ok: false, message: "The carrier is unavailable." };
    refreshDirectory("carriers");
    return { ok: true };
  });
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  return safely("updateProfile", async () => {
    const parsed = z
      .object({
        full_name: z.string().trim().min(2).max(120),
        reporting_currency: z.enum(["PLN", "EUR", "USD"]),
      })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const session = await auth();
    if (!session) return { ok: false, message: "Your session expired. Sign in again." };
    const { data: profile, error: profileError } = await session.supabase
      .from("profiles")
      .select("reporting_currency")
      .eq("id", session.user.id)
      .single();
    if (profileError) {
      logActionError("updateProfile.read", profileError);
      return { ok: false, message: "Unable to load profile settings." };
    }
    if (profile.reporting_currency !== parsed.data.reporting_currency) {
      const { count, error: countError } = await session.supabase
        .from("shipments")
        .select("id", { count: "exact", head: true });
      if (countError) {
        logActionError("updateProfile.shipments", countError);
        return { ok: false, message: "Unable to verify reporting currency." };
      }
      if (count) {
        return {
          ok: false,
          message:
            "Reporting currency cannot be changed after shipments are created because saved FX snapshots must remain stable.",
        };
      }
    }
    const { data, error } = await session.supabase
      .from("profiles")
      .update(parsed.data)
      .eq("id", session.user.id)
      .select("id")
      .maybeSingle();
    if (error) {
      logActionError("updateProfile.mutation", error);
      return { ok: false, message: "Profile settings could not be saved." };
    }
    if (!data) return { ok: false, message: "The profile is unavailable." };
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath("/shipments/new");
    return { ok: true };
  });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/login");
}
