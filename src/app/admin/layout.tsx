import type { Metadata } from "next";
import { StaffAuthProvider } from "@/lib/auth/StaffAuthContext";
import { AdminGate } from "./AdminGate";

export const metadata: Metadata = {
    title: "Admin Dashboard | NextUp Mentor",
    description: "Admin dashboard for managing enrollments and messages",
    // The panel was previously indexable. It should never have been.
    robots: { index: false, follow: false },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="admin-panel relative min-h-screen" style={{ background: "var(--ad-bg)" }}>
            <div className="relative z-10">
                <StaffAuthProvider>
                    <AdminGate>{children}</AdminGate>
                </StaffAuthProvider>
            </div>
        </div>
    );
}
