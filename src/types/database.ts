export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type CurrencyCode = "PLN" | "EUR" | "USD";
export type ShipmentStatus = "New" | "Accepted" | "In Transit" | "Delivered" | "Cancelled" | "Issue";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id:string; email:string; full_name:string; reporting_currency:CurrencyCode; created_at:string; updated_at:string };
        Insert: { id:string; email:string; full_name?:string; reporting_currency?:CurrencyCode; created_at?:string; updated_at?:string };
        Update: { email?:string; full_name?:string; reporting_currency?:CurrencyCode; updated_at?:string };
        Relationships: [];
      };
      clients: {
        Row: { id:string; user_id:string; company_name:string; tax_id:string; contact_person:string; email:string; phone:string; created_at:string; updated_at:string };
        Insert: { id?:string; user_id:string; company_name:string; tax_id:string; contact_person:string; email:string; phone:string; created_at?:string; updated_at?:string };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [{ foreignKeyName:"clients_user_id_fkey"; columns:["user_id"]; isOneToOne:false; referencedRelation:"profiles"; referencedColumns:["id"] }];
      };
      carriers: {
        Row: { id:string; user_id:string; company_name:string; country:string; contact_person:string; email:string; phone:string; vehicle_type:string; rating:number; created_at:string; updated_at:string };
        Insert: { id?:string; user_id:string; company_name:string; country:string; contact_person:string; email:string; phone:string; vehicle_type:string; rating?:number; created_at?:string; updated_at?:string };
        Update: Partial<Database["public"]["Tables"]["carriers"]["Insert"]>;
        Relationships: [{ foreignKeyName:"carriers_user_id_fkey"; columns:["user_id"]; isOneToOne:false; referencedRelation:"profiles"; referencedColumns:["id"] }];
      };
      shipments: {
        Row: { id:string; user_id:string; client_id:string; carrier_id:string; reference_number:string; pickup_city:string; delivery_city:string; pickup_date:string; delivery_date:string; client_price:number; carrier_cost:number; additional_costs:number; profit:number; margin_percent:number; currency:CurrencyCode; exchange_rate_to_base:number; status:ShipmentStatus; notes:string|null; created_at:string; updated_at:string };
        Insert: { id?:string; user_id:string; client_id:string; carrier_id:string; reference_number:string; pickup_city:string; delivery_city:string; pickup_date:string; delivery_date:string; client_price:number; carrier_cost:number; additional_costs?:number; currency?:CurrencyCode; exchange_rate_to_base?:number; status?:ShipmentStatus; notes?:string|null; created_at?:string; updated_at?:string };
        Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
        Relationships: [
          { foreignKeyName:"shipments_user_id_fkey"; columns:["user_id"]; isOneToOne:false; referencedRelation:"profiles"; referencedColumns:["id"] },
          { foreignKeyName:"shipments_client_id_fkey"; columns:["client_id"]; isOneToOne:false; referencedRelation:"clients"; referencedColumns:["id"] },
          { foreignKeyName:"shipments_carrier_id_fkey"; columns:["carrier_id"]; isOneToOne:false; referencedRelation:"carriers"; referencedColumns:["id"] }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { currency_code:CurrencyCode; shipment_status:ShipmentStatus };
    CompositeTypes: { [_ in never]: never };
  };
};
