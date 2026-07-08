import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Dashboard | NextUp Mentor",
    description: "Admin dashboard for managing enrollments and messages",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="admin-panel relative min-h-screen" style={{ background: "var(--ad-bg)" }}>
            <div className="relative z-10">{children}</div>
        </div>
    );
}
