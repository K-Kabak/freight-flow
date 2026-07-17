"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertCarrier, upsertClient } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/input";
import type { Carrier, Client } from "@/types";

type Props={type:"client";item?:Client}|{type:"carrier";item?:Carrier};

export function DirectoryForm(props:Props){
  const router=useRouter();const[saving,setSaving]=useState(false);const[errors,setErrors]=useState<Record<string,string[]>>({});const[formError,setFormError]=useState("");const item=props.item;
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;setSaving(true);setErrors({});setFormError("");try{const result=props.type==="client"?await upsertClient(new FormData(form),item?.id):await upsertCarrier(new FormData(form),item?.id);if(!result.ok){const nextErrors=result.fieldErrors??{};setErrors(nextErrors);setFormError(result.message);toast.error(result.message);const firstField=Object.keys(nextErrors)[0];if(firstField)(form.elements.namedItem(firstField) as HTMLElement|null)?.focus();return}toast.success(`${props.type==="client"?"Client":"Carrier"} ${item?"updated":"created"}`);router.push(`/${props.type}s`);router.refresh()}catch{const message="The request could not be completed. Please try again.";setFormError(message);toast.error(message)}finally{setSaving(false)}}
  const error=(name:string)=>errors[name]?.[0];
  return <form onSubmit={submit}><Card className="max-w-4xl"><CardContent className="grid gap-5 sm:grid-cols-2">
    {formError&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{formError}</p>}
    <FormField label="Company name" name="company_name" error={error("company_name")}><Input id="company_name" name="company_name" required defaultValue={item?.companyName}/></FormField>
    {props.type==="client"?<FormField label="Tax / VAT ID" name="tax_id" error={error("tax_id")}><Input id="tax_id" name="tax_id" required defaultValue={props.item?.taxId}/></FormField>:<FormField label="Country" name="country" error={error("country")}><Input id="country" name="country" required defaultValue={props.item?.country}/></FormField>}
    <FormField label="Contact person" name="contact_person" error={error("contact_person")}><Input id="contact_person" name="contact_person" required defaultValue={item?.contactPerson}/></FormField>
    <FormField label="Email" name="email" error={error("email")}><Input id="email" name="email" type="email" required defaultValue={item?.email}/></FormField>
    <FormField label="Phone" name="phone" error={error("phone")}><Input id="phone" name="phone" type="tel" required defaultValue={item?.phone}/></FormField>
    {props.type==="carrier"&&<><FormField label="Vehicle type" name="vehicle_type" error={error("vehicle_type")}><Input id="vehicle_type" name="vehicle_type" required defaultValue={props.item?.vehicleType}/></FormField><FormField label="Rating" name="rating" error={error("rating")}><Select id="rating" name="rating" defaultValue={String(props.item?.rating??5)}>{[1,2,3,4,5].map(rating=><option key={rating} value={rating}>{rating} star{rating===1?"":"s"}</option>)}</Select></FormField></>}
    <div className="flex gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={()=>router.back()}>Cancel</Button><Button disabled={saving}>{saving?"Saving…":item?"Save changes":`Create ${props.type}`}</Button></div>
  </CardContent></Card></form>;
}
