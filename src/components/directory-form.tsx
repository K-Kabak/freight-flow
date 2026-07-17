"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertCarrier, upsertClient } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import type { Carrier, Client } from "@/types";

type Props={type:"client";item?:Client}|{type:"carrier";item?:Carrier};
const Field=({label,name,error,children}:{label:string;name:string;error?:string;children:React.ReactNode})=><div><Label htmlFor={name}>{label}</Label>{children}{error&&<p className="mt-1 text-xs text-red-600">{error}</p>}</div>;

export function DirectoryForm(props:Props){
  const router=useRouter();const[saving,setSaving]=useState(false);const[errors,setErrors]=useState<Record<string,string[]>>({});const item=props.item;
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);setErrors({});const result=props.type==="client"?await upsertClient(new FormData(event.currentTarget),item?.id):await upsertCarrier(new FormData(event.currentTarget),item?.id);setSaving(false);if(!result.ok){setErrors(result.fieldErrors??{});toast.error(result.message);return}toast.success(`${props.type==="client"?"Client":"Carrier"} ${item?"updated":"created"}`);router.push(`/${props.type}s`);router.refresh()}
  const error=(name:string)=>errors[name]?.[0];
  return <form onSubmit={submit}><Card className="max-w-4xl"><CardContent className="grid gap-5 sm:grid-cols-2">
    <Field label="Company name" name="company_name" error={error("company_name")}><Input id="company_name" name="company_name" required defaultValue={item?.companyName}/></Field>
    {props.type==="client"?<Field label="Tax / VAT ID" name="tax_id" error={error("tax_id")}><Input id="tax_id" name="tax_id" required defaultValue={props.item?.taxId}/></Field>:<Field label="Country" name="country" error={error("country")}><Input id="country" name="country" required defaultValue={props.item?.country}/></Field>}
    <Field label="Contact person" name="contact_person" error={error("contact_person")}><Input id="contact_person" name="contact_person" required defaultValue={item?.contactPerson}/></Field>
    <Field label="Email" name="email" error={error("email")}><Input id="email" name="email" type="email" required defaultValue={item?.email}/></Field>
    <Field label="Phone" name="phone" error={error("phone")}><Input id="phone" name="phone" type="tel" required defaultValue={item?.phone}/></Field>
    {props.type==="carrier"&&<><Field label="Vehicle type" name="vehicle_type" error={error("vehicle_type")}><Input id="vehicle_type" name="vehicle_type" required defaultValue={props.item?.vehicleType}/></Field><Field label="Rating" name="rating" error={error("rating")}><Select id="rating" name="rating" defaultValue={String(props.item?.rating??5)}>{[1,2,3,4,5].map(rating=><option key={rating} value={rating}>{rating} star{rating===1?"":"s"}</option>)}</Select></Field></>}
    <div className="flex gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={()=>router.back()}>Cancel</Button><Button disabled={saving}>{saving?"Saving…":item?"Save changes":`Create ${props.type}`}</Button></div>
  </CardContent></Card></form>;
}
