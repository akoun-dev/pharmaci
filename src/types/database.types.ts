// Types générés à la main à partir de supabase/migrations/*.sql.
//
// À REMPLACER par la sortie de la commande officielle dès qu'un projet est
// lié (elle capture aussi les types des fonctions RPC et des vues) :
//
//   npx supabase gen types typescript --linked > src/types/database.types.ts
//
// Gardé synchronisé à la main pour l'instant pour ne pas bloquer le reste de
// la migration sur la disponibilité d'un projet Supabase distant.

export type UserRole = "PATIENT" | "PHARMACIST" | "ADMIN";
export type OrderStatus = "PENDING" | "CONFIRMED" | "READY" | "PICKED_UP" | "CANCELLED";
export type StockChangeType = "ADD" | "REMOVE" | "UPDATE";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          name: string;
          role: UserRole;
          address: string | null;
          city: string | null;
          district: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      pharmacies: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          address: string;
          city: string;
          district: string | null;
          latitude: number;
          longitude: number;
          phone: string;
          email: string | null;
          opening_time: string;
          closing_time: string;
          is_open_24h: boolean;
          is_on_guard: boolean;
          is_verified: boolean;
          image_url: string | null;
          rating: number;
          review_count: number;
          services: string[];
          payments: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pharmacies"]["Row"]> & {
          name: string;
          owner_id: string;
          address: string;
          city: string;
          latitude: number;
          longitude: number;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["pharmacies"]["Row"]>;
      };
      medications: {
        Row: {
          id: string;
          name: string;
          active_ingredient: string;
          category: string;
          dosage: string;
          form: string;
          description: string;
          prescription_required: boolean;
          image_url: string | null;
          side_effects: string;
          contraindications: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["medications"]["Row"]> & {
          name: string;
          active_ingredient: string;
          dosage: string;
        };
        Update: Partial<Database["public"]["Tables"]["medications"]["Row"]>;
      };
      pharmacy_stock: {
        Row: {
          id: string;
          pharmacy_id: string;
          medication_id: string;
          price: number;
          stock: number;
          low_stock_threshold: number;
          expiry_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pharmacy_stock"]["Row"]> & {
          pharmacy_id: string;
          medication_id: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["pharmacy_stock"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          code: string;
          patient_id: string;
          pharmacy_id: string;
          status: OrderStatus;
          total_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never; // création exclusive via la RPC place_order()
        Update: Partial<Pick<Database["public"]["Tables"]["orders"]["Row"], "status">>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          medication_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: never; // créés uniquement par place_order()
        Update: never;
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          pharmacy_id: string;
          rating: number;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & {
          user_id: string;
          pharmacy_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          pharmacy_id: string;
          created_at: string;
        };
        Insert: { user_id: string; pharmacy_id: string };
        Update: never;
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: { sender_id: string; receiver_id: string; content: string };
        Update: { is_read: boolean };
      };
      stock_history: {
        Row: {
          id: string;
          pharmacy_id: string;
          medication_id: string;
          change_type: StockChangeType;
          quantity: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          pharmacy_id: string;
          medication_id: string;
          change_type: StockChangeType;
          quantity: number;
          note?: string | null;
        };
        Update: never;
      };
    };
    Functions: {
      place_order: {
        Args: { p_pharmacy_id: string; p_items: { medication_id: string; quantity: number }[]; p_notes?: string | null };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      cancel_order: {
        Args: { p_order_id: string };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      anonymize_profile: {
        Args: { p_user_id: string };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      stock_change_type: StockChangeType;
    };
  };
}
