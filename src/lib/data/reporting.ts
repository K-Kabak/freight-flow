import { carriers as demoCarriers } from "@/data/mock-data";
import { getShipments } from "@/lib/data/shipments";
import {
  aggregateReportingData,
  type MonthlyPoint,
  type ReportingSummary,
} from "@/lib/reporting-calculations";
import { createClient } from "@/lib/supabase/server";
import type { Currency } from "@/types";

export type { MonthlyPoint };
export type ReportData = ReportingSummary & { isDemo: boolean; currency: Currency };

export async function getProfile() {
  const supabase = await createClient();
  if (!supabase) {
    return {
      isDemo: true,
      fullName: "Alex Kowalski",
      email: "demo@freightflow.app",
      reportingCurrency: "PLN" as Currency,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { isDemo: false, fullName: "", email: "", reportingCurrency: "PLN" as Currency };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name,email,reporting_currency")
    .eq("id", user.id)
    .single();
  if (error) throw new Error("Unable to load profile");

  return {
    isDemo: false,
    fullName: data.full_name,
    email: data.email,
    reportingCurrency: data.reporting_currency as Currency,
  };
}

export async function getReportingData(): Promise<ReportData> {
  const [profile, result] = await Promise.all([getProfile(), getShipments()]);
  const carrierNames = result.isDemo
    ? demoCarriers.map((carrier) => carrier.companyName)
    : [...new Set(result.shipments.map((shipment) => shipment.carrier))];

  return {
    isDemo: result.isDemo,
    currency: profile.reportingCurrency,
    ...aggregateReportingData(result.shipments, new Date(), carrierNames),
  };
}

export async function canCreateSampleWorkspace() {
  const supabase = await createClient();
  if (!supabase) return false;
  const [clients, carriers] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("carriers").select("id", { count: "exact", head: true }),
  ]);
  if (clients.error || carriers.error) throw new Error("Unable to inspect sample workspace");
  return clients.count === 0 && carriers.count === 0;
}
