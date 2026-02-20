import { createClient } from "@supabase/supabase-js";

// Database types based on our schema
export interface Package {
    id: string;
    title: string;
    subtitle: string | null;
    icon: string;
    price: number;
    features: string[];
    images: string[];
    is_popular: boolean;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface Enrollment {
    id: string;
    student_name: string;
    student_email: string | null;
    student_phone: string | null;
    package_id: string | null;
    package_title: string;
    amount: number;
    transaction_id: string;
    payment_screenshot: string | null;
    status: "pending" | "verified" | "rejected";
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    destination: string | null;
    message: string;
    status: "unread" | "read" | "replied";
    replied_at: string | null;
    created_at: string;
}

export interface Destination {
    id: string;
    country: string;
    flag: string; // Emoji or URL
    university_count: number;
    description: string;
    highlights: string[];
    created_at: string;
}

// Insert types (omit auto-generated fields)
export type PackageInsert = Omit<Package, "id" | "created_at" | "updated_at">;
export type PackageUpdate = Partial<PackageInsert>;
export type EnrollmentInsert = Omit<Enrollment, "id" | "created_at" | "updated_at">;
export type EnrollmentUpdate = Partial<EnrollmentInsert>;
export type MessageInsert = Omit<Message, "id" | "created_at">;
export type MessageUpdate = Partial<MessageInsert>;
export type DestinationInsert = Omit<Destination, "id" | "created_at">;
export type DestinationUpdate = Partial<DestinationInsert>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

// Create untyped client for flexibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const db = {
    // Packages
    packages: {
        async getAll(): Promise<Package[]> {
            const { data, error } = await supabase
                .from("packages")
                .select("*")
                .eq("is_active", true)
                .order("display_order");
            if (error) throw error;
            return data as Package[];
        },
        async getById(id: string): Promise<Package | null> {
            const { data, error } = await supabase
                .from("packages")
                .select("*")
                .eq("id", id)
                .single();
            if (error) throw error;
            return data as Package;
        },
        async create(pkg: PackageInsert): Promise<Package> {
            const { data, error } = await supabase
                .from("packages")
                .insert(pkg)
                .select()
                .single();
            if (error) throw error;
            return data as Package;
        },
        async update(id: string, pkg: PackageUpdate): Promise<Package> {
            const { data, error } = await supabase
                .from("packages")
                .update(pkg)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data as Package;
        },
        async delete(id: string): Promise<void> {
            const { error } = await supabase
                .from("packages")
                .update({ is_active: false })
                .eq("id", id);
            if (error) throw error;
        },
    },

    // Enrollments
    enrollments: {
        async getAll(): Promise<Enrollment[]> {
            const { data, error } = await supabase
                .from("enrollments")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as Enrollment[];
        },
        async create(enrollment: EnrollmentInsert): Promise<Enrollment> {
            const { data, error } = await supabase
                .from("enrollments")
                .insert(enrollment)
                .select()
                .single();
            if (error) throw error;
            return data as Enrollment;
        },
        async updateStatus(id: string, status: Enrollment["status"], notes?: string): Promise<Enrollment> {
            const { data, error } = await supabase
                .from("enrollments")
                .update({ status, admin_notes: notes })
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data as Enrollment;
        },
    },

    // Destinations
    destinations: {
        async getAll(): Promise<Destination[]> {
            const { data, error } = await supabase
                .from("destinations")
                .select("*")
                .order("country");
            if (error) throw error;
            return data as Destination[];
        },
        async create(destination: DestinationInsert): Promise<Destination> {
            const { data, error } = await supabase
                .from("destinations")
                .insert(destination)
                .select()
                .single();
            if (error) throw error;
            return data as Destination;
        },
        async update(id: string, destination: DestinationUpdate): Promise<Destination> {
            const { data, error } = await supabase
                .from("destinations")
                .update(destination)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data as Destination;
        },
        async delete(id: string): Promise<void> {
            const { error } = await supabase
                .from("destinations")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
    },

    // Messages
    messages: {
        async getAll(): Promise<Message[]> {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as Message[];
        },
        async create(message: MessageInsert): Promise<Message> {
            const { data, error } = await supabase
                .from("messages")
                .insert(message)
                .select()
                .single();
            if (error) throw error;
            return data as Message;
        },
        async updateStatus(id: string, status: Message["status"]): Promise<Message> {
            const update: MessageUpdate = { status };
            if (status === "replied") {
                update.replied_at = new Date().toISOString();
            }
            const { data, error } = await supabase
                .from("messages")
                .update(update)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data as Message;
        },
    },

    // Storage helpers for package images
    storage: {
        async uploadImage(file: File, path: string): Promise<string> {
            const { data, error } = await supabase.storage
                .from("package-images")
                .upload(path, file, { upsert: true });
            if (error) throw error;
            return supabase.storage.from("package-images").getPublicUrl(data.path).data.publicUrl;
        },
        async deleteImage(path: string): Promise<void> {
            const { error } = await supabase.storage
                .from("package-images")
                .remove([path]);
            if (error) throw error;
        },
    },
};
