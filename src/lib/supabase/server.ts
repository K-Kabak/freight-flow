import { createServerClient } from "@supabase/ssr"; import { cookies } from "next/headers";
import type { Database } from "@/types/database";
export async function createClient(){const store=await cookies();const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return null;return createServerClient<Database>(url,key,{cookies:{getAll:()=>store.getAll(),setAll(items){try{items.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}})}
