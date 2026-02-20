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
        <div className="min-h-screen bg-slate-900">
            {children}
        </div>
    );
}
