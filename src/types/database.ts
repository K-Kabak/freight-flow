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
      shipment_status_events: {
        Row: { id:string; shipment_id:string; user_id:string; changed_by:string|null; from_status:ShipmentStatus|null; to_status:ShipmentStatus; event_kind:"created"|"changed"|"baseline"; changed_at:string };
        Insert: { id?:string; shipment_id:string; user_id:string; changed_by?:string|null; from_status?:ShipmentStatus|null; to_status:ShipmentStatus; event_kind:"created"|"changed"|"baseline"; changed_at?:string };
        Update: Partial<Database["public"]["Tables"]["shipment_status_events"]["Insert"]>;
        Relationships: [
          { foreignKeyName:"shipment_status_events_owner_fkey"; columns:["shipment_id","user_id"]; isOneToOne:false; referencedRelation:"shipments"; referencedColumns:["id","user_id"] },
          { foreignKeyName:"shipment_status_events_user_id_fkey"; columns:["user_id"]; isOneToOne:false; referencedRelation:"profiles"; referencedColumns:["id"] },
          { foreignKeyName:"shipment_status_events_changed_by_fkey"; columns:["changed_by"]; isOneToOne:false; referencedRelation:"profiles"; referencedColumns:["id"] }
        ];
      };
      shipment_documents: {
        Row: { id:string; shipment_id:string; storage_path:string; original_name:string; mime_type:"application/pdf"|"image/jpeg"|"image/png"; size_bytes:number; upload_status:"pending"|"ready"; created_at:string; uploaded_at:string|null };
        Insert: { id?:string; shipment_id:string; storage_path:string; original_name:string; mime_type:"application/pdf"|"image/jpeg"|"image/png"; size_bytes:number; upload_status?:"pending"|"ready"; created_at?:string; uploaded_at?:string|null };
        Update: Partial<Database["public"]["Tables"]["shipment_documents"]["Insert"]>;
        Relationships: [
          { foreignKeyName:"shipment_documents_shipment_id_fkey"; columns:["shipment_id"]; isOneToOne:false; referencedRelation:"shipments"; referencedColumns:["id"] }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_sample_workspace: { Args: Record<PropertyKey, never>; Returns: Json };
      delete_shipment_document_metadata: { Args: { document_id:string }; Returns: undefined };
      finalize_shipment_document: { Args: { document_id:string }; Returns: undefined };
    };
    Enums: { currency_code:CurrencyCode; shipment_status:ShipmentStatus };
    CompositeTypes: { [_ in never]: never };
  };
};
