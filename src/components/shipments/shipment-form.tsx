"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Shipment } from "@/types";
import { currencies, shipmentStatuses } from "@/types";
import type { DirectoryOption } from "@/lib/data/shipments";
import { calculateMarginPercent, calculateProfit } from "@/lib/calculations";
import { createStarterDirectory,upsertShipment } from "@/app/actions";
import { Button } from "@/components/ui/button"; import { Input, Label, Select } from "@/components/ui/input"; import { Card, CardContent } from "@/components/ui/card"; import { formatMoney } from "@/lib/utils";

const Field=({label,name,children,error}:{label:string;name:string;children:React.ReactNode;error?:string})=><div><Label htmlFor={name}>{label}</Label>{children}{error&&<p className="mt-1 text-xs text-red-600">{error}</p>}</div>;
type Props={shipment?:Shipment;clients:DirectoryOption[];carriers:DirectoryOption[];reportingCurrency:"PLN"|"EUR"|"USD";isDemo:boolean};

export function ShipmentForm({shipment,clients,carriers,reportingCurrency,isDemo}:Props){
  const router=useRouter(); const[price,setPrice]=useState(shipment?.clientPrice??0); const[cost,setCost]=useState(shipment?.carrierCost??0); const[extra,setExtra]=useState(shipment?.additionalCosts??0); const[currency,setCurrency]=useState(shipment?.currency??"PLN"); const[saving,setSaving]=useState(false); const[errors,setErrors]=useState<Record<string,string[]>>({});
  const profit=useMemo(()=>calculateProfit(price,cost,extra),[price,cost,extra]); const margin=calculateMarginPercent(profit,price);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(isDemo)return;setSaving(true);setErrors({});const result=await upsertShipment(new FormData(event.currentTarget),shipment?.id);setSaving(false);if(!result.ok){setErrors(result.fieldErrors??{});toast.error(result.message);return}toast.success(shipment?"Shipment updated":"Shipment created");router.push("/shipments");router.refresh()}
  async function createStarter(){setSaving(true);const result=await createStarterDirectory();setSaving(false);if(!result.ok)return toast.error(result.message);toast.success("Starter directory created");router.refresh()}
  const error=(name:string)=>errors[name]?.[0];
  return <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_320px]">
    <Card><CardContent className="grid gap-5 sm:grid-cols-2">
      <Field label="Reference number" name="reference_number" error={error("reference_number")}><Input id="reference_number" name="reference_number" required defaultValue={shipment?.referenceNumber} placeholder="FR-007" disabled={isDemo}/></Field>
      <Field label="Status" name="status"><Select id="status" name="status" defaultValue={shipment?.status??"New"} disabled={isDemo}>{shipmentStatuses.map(s=><option key={s}>{s}</option>)}</Select></Field>
      <Field label="Client" name="client_id" error={error("client_id")}><Select id="client_id" name="client_id" required defaultValue={shipment?.clientId??""} disabled={isDemo}><option value="">Select client</option>{clients.map(c=><option value={c.id} key={c.id}>{c.companyName}</option>)}</Select></Field>
      <Field label="Carrier" name="carrier_id" error={error("carrier_id")}><Select id="carrier_id" name="carrier_id" required defaultValue={shipment?.carrierId??""} disabled={isDemo}><option value="">Select carrier</option>{carriers.map(c=><option value={c.id} key={c.id}>{c.companyName}</option>)}</Select></Field>
      <Field label="Pickup city" name="pickup_city" error={error("pickup_city")}><Input id="pickup_city" name="pickup_city" required defaultValue={shipment?.pickupCity} placeholder="Gdańsk" disabled={isDemo}/></Field>
      <Field label="Delivery city" name="delivery_city" error={error("delivery_city")}><Input id="delivery_city" name="delivery_city" required defaultValue={shipment?.deliveryCity} placeholder="Berlin" disabled={isDemo}/></Field>
      <Field label="Pickup date" name="pickup_date"><Input id="pickup_date" name="pickup_date" type="date" required defaultValue={shipment?.pickupDate} disabled={isDemo}/></Field>
      <Field label="Delivery date" name="delivery_date" error={error("delivery_date")}><Input id="delivery_date" name="delivery_date" type="date" required defaultValue={shipment?.deliveryDate} disabled={isDemo}/></Field>
      <Field label="Client price" name="client_price"><Input id="client_price" name="client_price" type="number" min="0" step="0.01" required value={price||""} onChange={e=>setPrice(+e.target.value)} disabled={isDemo}/></Field>
      <Field label="Carrier cost" name="carrier_cost"><Input id="carrier_cost" name="carrier_cost" type="number" min="0" step="0.01" required value={cost||""} onChange={e=>setCost(+e.target.value)} disabled={isDemo}/></Field>
      <Field label="Additional costs" name="additional_costs"><Input id="additional_costs" name="additional_costs" type="number" min="0" step="0.01" value={extra||""} onChange={e=>setExtra(+e.target.value)} disabled={isDemo}/></Field>
      <Field label="Currency" name="currency"><Select id="currency" name="currency" value={currency} onChange={e=>setCurrency(e.target.value as typeof currency)} disabled={isDemo}>{currencies.map(c=><option key={c}>{c}</option>)}</Select></Field>
      {currency!==reportingCurrency?<Field label={`1 ${currency} in reporting currency (${reportingCurrency})`} name="exchange_rate_to_base" error={error("exchange_rate_to_base")}><Input id="exchange_rate_to_base" name="exchange_rate_to_base" type="number" min="0.0001" step="0.0001" required defaultValue={shipment?.exchangeRateToBase} placeholder="Enter manual FX rate" disabled={isDemo}/></Field>:<input type="hidden" name="exchange_rate_to_base" value="1"/>}
      <div className="sm:col-span-2"><Field label="Notes" name="notes"><textarea id="notes" name="notes" defaultValue={shipment?.notes} rows={4} disabled={isDemo} placeholder="Pickup details, special requirements…" className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"/></Field></div>
    </CardContent></Card>
    <div className="space-y-5"><Card><CardContent><p className="text-sm font-semibold text-slate-900">Margin preview</p><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between text-slate-500"><span>Client price</span><span>{formatMoney(price,currency)}</span></div><div className="flex justify-between text-slate-500"><span>Total costs</span><span>− {formatMoney(cost+extra,currency)}</span></div><div className="border-t border-slate-100 pt-3"><div className="flex justify-between font-semibold"><span>Profit</span><span className={profit>=0?"text-emerald-700":"text-red-600"}>{formatMoney(profit,currency)}</span></div><div className="mt-2 flex justify-between"><span className="text-slate-500">Margin</span><span className="font-bold">{margin}%</span></div></div></div></CardContent></Card>
      {isDemo&&<p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">The public demo is read-only. Configure Supabase and sign in to manage shipments.</p>}
      {!isDemo&&(!clients.length||!carriers.length)&&<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><p>Create starter client and carrier records to complete your first shipment.</p><Button type="button" variant="outline" className="mt-3" disabled={saving} onClick={createStarter}>Create starter directory</Button></div>}
      <div className="flex gap-2"><Button type="button" variant="outline" className="flex-1" onClick={()=>router.back()}>Cancel</Button><Button type="submit" disabled={isDemo||saving||!clients.length||!carriers.length} className="flex-1">{saving?"Saving…":shipment?"Save changes":"Create shipment"}</Button></div>
    </div>
  </form>;
}
