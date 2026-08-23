"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft, BarChart3, Calendar, Images, ClipboardList, FolderKanban, Globe, LayoutDashboard,
    Loader2, MessageSquare, Package, Quote, RefreshCw, Users, Wallet,
} from "lucide-react";
import { db, Package as PackageType, Enrollment, Message, Destination } from "@/lib/supabase";
import { StaffSection } from "./_sections/StaffSection";
import { ClientsSection } from "./_sections/ClientsSection";
import { AppointmentsSection } from "./_sections/AppointmentsSection";
import { FinanceSection } from "./_sections/FinanceSection";
import { SiteStatsSection } from "./_sections/SiteStatsSection";
import { FeaturePhotosSection } from "./_sections/FeaturePhotosSection";
import { TestimonialsSection } from "./_sections/TestimonialsSection";
import { AnimatedNumber } from "@/components/internal";

type Tab = "overview" | "staff" | "clients" | "appointments" | "finance" | "enrollments" | "messages" | "packages" | "destinations" | "sitestats" | "photos" | "reviews";

const NAV_ICONS: Record<Tab, typeof LayoutDashboard> = {
    overview: LayoutDashboard, staff: Users, clients: FolderKanban,
    appointments: Calendar, finance: Wallet, enrollments: ClipboardList,
    messages: MessageSquare, packages: Package, destinations: Globe,
    sitestats: BarChart3,
    photos: Images,
    reviews: Quote,
};

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } };

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [packages, setPackages] = useState<PackageType[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Package Form State
    const [isEditingPackage, setIsEditingPackage] = useState(false);
    const [currentPackage, setCurrentPackage] = useState<Partial<PackageType>>({});

    // Destination Form State
    const [isEditingDestination, setIsEditingDestination] = useState(false);
    const [currentDestination, setCurrentDestination] = useState<Partial<Destination>>({});

    // Auth is handled by <AdminGate> in layout.tsx — this component only ever
    // renders for a signed-in admin, so it can load immediately.
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [packagesData, enrollmentsData, messagesData, destinationsData] = await Promise.all([
                db.packages.getAll(),
                db.enrollments.getAll(),
                db.messages.getAll(),
                db.destinations.getAll(),
            ]);
            setPackages(packagesData);
            setEnrollments(enrollmentsData);
            setMessages(messagesData);
            setDestinations(destinationsData);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Make sure the database tables are created.");
        } finally {
            setLoading(false);
        }
    };

    const updateEnrollmentStatus = async (id: string, status: Enrollment["status"]) => {
        try {
            await db.enrollments.updateStatus(id, status);
            setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
        } catch (err) {
            console.error("Error updating enrollment:", err);
            alert("Failed to update enrollment status");
        }
    };

    const updateMessageStatus = async (id: string, status: Message["status"]) => {
        try {
            await db.messages.updateStatus(id, status);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
        } catch (err) {
            console.error("Error updating message:", err);
            alert("Failed to update message status");
        }
    };

    const handleSaveDestination = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentDestination.id) {
                const updated = await db.destinations.update(currentDestination.id, {
                    country: currentDestination.country,
                    flag: currentDestination.flag,
                    university_count: currentDestination.university_count,
                    description: currentDestination.description,
                    highlights: currentDestination.highlights || [],
                });
                setDestinations(prev => prev.map(d => d.id === updated.id ? updated : d));
            } else {
                const created = await db.destinations.create({
                    country: currentDestination.country!,
                    flag: currentDestination.flag!,
                    university_count: currentDestination.university_count!,
                    description: currentDestination.description!,
                    highlights: currentDestination.highlights || [],
                });
                setDestinations(prev => [...prev, created]);
            }
            setIsEditingDestination(false);
            setCurrentDestination({});
        } catch (err: unknown) {
            console.error("Error saving destination:", err);
            alert("Failed to save destination: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    const deleteDestination = async (id: string) => {
        if (confirm("Are you sure you want to delete this destination?")) {
            try {
                await db.destinations.delete(id);
                setDestinations(prev => prev.filter(d => d.id !== id));
            } catch (err) {
                console.error("Error deleting destination:", err);
                alert("Failed to delete destination");
            }
        }
    };

    // Helper for destination array inputs
    const handleDestinationArrayInput = (value: string) => {
        setCurrentDestination(prev => ({
            ...prev,
            highlights: value.split('\n').filter(line => line.trim() !== '')
        }));
    };

    const handleSavePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentPackage.id) {
                // Update existing
                const updated = await db.packages.update(currentPackage.id, {
                    title: currentPackage.title,
                    subtitle: currentPackage.subtitle,
                    icon: currentPackage.icon || "📚",
                    price: currentPackage.price,
                    features: (currentPackage.features || []).filter(f => f.trim() !== ''),
                    images: currentPackage.images || [],
                    is_popular: currentPackage.is_popular || false,
                });
                setPackages(prev => prev.map(p => p.id === updated.id ? updated : p));
            } else {
                // Create new
                const created = await db.packages.create({
                    title: currentPackage.title!,
                    subtitle: currentPackage.subtitle || null,
                    icon: currentPackage.icon || "📚",
                    price: currentPackage.price!,
                    features: (currentPackage.features || []).filter(f => f.trim() !== ''),
                    images: currentPackage.images || [],
                    is_popular: currentPackage.is_popular || false,
                    is_active: true,
                    display_order: packages.length + 1,
                });
                setPackages(prev => [...prev, created]);
            }
            setIsEditingPackage(false);
            setCurrentPackage({});
        } catch (err: unknown) {
            console.error("Error saving package:", err);
            alert("Failed to save package: " + (err instanceof Error ? err.message : "Check console for details"));
        }
    };

    const deletePackage = async (id: string) => {
        if (confirm("Are you sure you want to delete this package?")) {
            try {
                await db.packages.delete(id);
                setPackages(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                console.error("Error deleting package:", err);
                alert("Failed to delete package");
            }
        }
    };

    // Helper to handle array inputs (features, images)
    const handleArrayInput = (field: 'features' | 'images', value: string) => {
        setCurrentPackage(prev => ({
            ...prev,
            [field]: value.split('\n')
        }));
    };

    const stats = {
        totalEnrollments: enrollments.length,
        pendingEnrollments: enrollments.filter((e) => e.status === "pending").length,
        unreadMessages: messages.filter((m) => m.status === "unread").length,
        totalPackages: packages.length,
        totalDestinations: destinations.length,
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--ad-text-tertiary)] mx-auto mb-3" />
                    <p className="text-[13px] text-[var(--ad-text-tertiary)]">Loading dashboard…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="admin-card p-8 max-w-md text-center">
                    <h2 className="text-[15px] font-semibold text-[var(--ad-text)] mb-2">Connection Error</h2>
                    <p className="text-[13px] text-[var(--ad-text-tertiary)] mb-5">{error}</p>
                    <button
                        onClick={fetchAllData}
                        className="px-4 py-2 bg-[var(--ad-accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--ad-accent-hover)] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const navItems = [
        { id: "overview" as Tab, label: "Overview", badge: undefined },
        { id: "staff" as Tab, label: "Staff", badge: undefined },
        { id: "clients" as Tab, label: "Clients", badge: undefined },
        { id: "appointments" as Tab, label: "Appointments", badge: undefined },
        { id: "finance" as Tab, label: "Finance", badge: undefined },
        { id: "enrollments" as Tab, label: "Enrollments", badge: stats.pendingEnrollments },
        { id: "messages" as Tab, label: "Messages", badge: stats.unreadMessages },
        { id: "packages" as Tab, label: "Packages", badge: stats.totalPackages },
        { id: "destinations" as Tab, label: "Destinations", badge: stats.totalDestinations },
        { id: "sitestats" as Tab, label: "Home figures", badge: undefined },
        { id: "photos" as Tab, label: "Home photos", badge: undefined },
        { id: "reviews" as Tab, label: "Reviews", badge: undefined },
    ];

    const inputCls = "w-full rounded-lg bg-[var(--ad-bg-raised)] px-3 py-2.5 text-[13px] text-[var(--ad-text)] border border-[var(--ad-border)] focus:border-[var(--ad-accent)] focus:outline-none transition-colors placeholder:text-[var(--ad-text-quaternary)]";
    const labelCls = "block text-[12px] font-medium text-[var(--ad-text-tertiary)] mb-1.5";

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside
                className="w-56 fixed h-full overflow-y-auto border-r flex flex-col"
                style={{ background: "var(--ad-bg-raised)", borderColor: "var(--ad-border)" }}
            >
                <div className="px-4 pt-5 pb-4">
                    <h1 className="text-[14px] font-semibold text-[var(--ad-text)]">
                        NextUp <span className="text-[var(--ad-text-tertiary)] font-normal">Admin</span>
                    </h1>
                </div>

                <nav className="flex-1 px-2 space-y-0.5">
                    {navItems.map((item) => {
                        const active = activeTab === item.id;
                        const Icon = NAV_ICONS[item.id];
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`relative w-full flex items-center justify-between gap-2 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors ${
                                    active
                                        ? "bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]"
                                        : "text-[var(--ad-text-tertiary)] hover:text-[var(--ad-text-secondary)] hover:bg-[var(--ad-surface)]"
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <Icon className="h-4 w-4" />
                                    <span className={active ? "font-medium" : ""}>{item.label}</span>
                                </span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span
                                        className="min-w-[18px] px-1.5 py-px text-center text-[11px] font-medium rounded-full"
                                        style={{
                                            background: "var(--ad-border)",
                                            color: "var(--ad-text-secondary)",
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="px-2 pb-4 pt-2 space-y-0.5 border-t" style={{ borderColor: "var(--ad-border)" }}>
                    <button
                        onClick={fetchAllData}
                        className="flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] text-[var(--ad-text-tertiary)] hover:text-[var(--ad-text-secondary)] transition-colors w-full rounded-lg hover:bg-[var(--ad-surface)]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                    </button>
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] text-[var(--ad-text-tertiary)] hover:text-[var(--ad-text-secondary)] transition-colors rounded-lg hover:bg-[var(--ad-surface)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to site</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-56 p-6 lg:p-8">
                <AnimatePresence mode="wait">
                    {activeTab === "staff" && (
                        <motion.div key="staff" {...fade}><StaffSection /></motion.div>
                    )}

                    {activeTab === "clients" && (
                        <motion.div key="clients" {...fade}><ClientsSection /></motion.div>
                    )}

                    {activeTab === "appointments" && (
                        <motion.div key="appointments" {...fade}><AppointmentsSection /></motion.div>
                    )}

                    {activeTab === "finance" && (
                        <motion.div key="finance" {...fade}><FinanceSection /></motion.div>
                    )}

                    {activeTab === "sitestats" && (
                        <motion.div key="sitestats" {...fade}><SiteStatsSection /></motion.div>
                    )}

                    {activeTab === "photos" && (
                        <motion.div key="photos" {...fade}><FeaturePhotosSection /></motion.div>
                    )}

                    {activeTab === "reviews" && (
                        <motion.div key="reviews" {...fade}><TestimonialsSection /></motion.div>
                    )}

                    {activeTab === "overview" && (
                        <motion.div key="overview" {...fade}>
                            <h2 className="text-[15px] font-semibold text-[var(--ad-text)] mb-5">Overview</h2>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                                {[
                                    { label: "Enrollments", value: stats.totalEnrollments },
                                    { label: "Pending", value: stats.pendingEnrollments },
                                    { label: "Unread messages", value: stats.unreadMessages },
                                    { label: "Packages", value: stats.totalPackages },
                                    { label: "Destinations", value: stats.totalDestinations },
                                ].map((stat) => (
                                    <div key={stat.label} className="admin-card rounded-xl px-4 py-3.5">
                                        <p className="text-[22px] font-semibold text-[var(--ad-text)] leading-tight">
                                            <AnimatedNumber value={stat.value} />
                                        </p>
                                        <p className="text-[12px] text-[var(--ad-text-tertiary)] mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Activity */}
                            <div className="admin-card rounded-xl">
                                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ad-border)" }}>
                                    <h3 className="text-[13px] font-medium text-[var(--ad-text)]">Recent Activity</h3>
                                </div>
                                <div className="divide-y" style={{ borderColor: "var(--ad-border)" }}>
                                    {[...enrollments.slice(0, 3), ...messages.slice(0, 2)]
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .slice(0, 5)
                                        .map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px]"
                                                        style={{
                                                            background: "student_name" in item ? "var(--ad-accent-soft)" : "rgba(168,85,247,0.08)",
                                                            color: "student_name" in item ? "var(--ad-accent)" : "#a855f7",
                                                        }}
                                                    >
                                                        {"student_name" in item ? <ClipboardList className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-medium text-[var(--ad-text)] truncate">
                                                            {"student_name" in item ? item.student_name : item.name}
                                                        </p>
                                                        <p className="text-[12px] text-[var(--ad-text-quaternary)] truncate">
                                                            {"student_name" in item
                                                                ? `Enrolled in ${item.package_title}`
                                                                : `Message about ${item.destination || "inquiry"}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] text-[var(--ad-text-quaternary)] shrink-0 ml-4">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    {enrollments.length === 0 && messages.length === 0 && (
                                        <p className="text-center text-[13px] text-[var(--ad-text-quaternary)] py-10">No recent activity</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "packages" && (
                        <motion.div key="packages" {...fade}>
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-[15px] font-semibold text-[var(--ad-text)]">Packages</h2>
                                <button
                                    onClick={() => {
                                        setCurrentPackage({ features: [], images: [] });
                                        setIsEditingPackage(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--ad-accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--ad-accent-hover)] transition-colors"
                                >
                                    Add package
                                </button>
                            </div>

                            {isEditingPackage ? (
                                <div className="admin-card rounded-xl p-6 max-w-2xl">
                                    <h3 className="text-[14px] font-semibold text-[var(--ad-text)] mb-5">
                                        {currentPackage.id ? "Edit Package" : "New Package"}
                                    </h3>
                                    <form onSubmit={handleSavePackage} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>Title</label>
                                                <input type="text" value={currentPackage.title || ""} onChange={e => setCurrentPackage({ ...currentPackage, title: e.target.value })} className={inputCls} required />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Icon (emoji)</label>
                                                <input type="text" value={currentPackage.icon || "📚"} onChange={e => setCurrentPackage({ ...currentPackage, icon: e.target.value })} className={inputCls} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Subtitle</label>
                                            <input type="text" value={currentPackage.subtitle || ""} onChange={e => setCurrentPackage({ ...currentPackage, subtitle: e.target.value })} className={inputCls} required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>Price (BDT)</label>
                                                <input type="number" value={currentPackage.price || ""} step="1" onChange={e => setCurrentPackage({ ...currentPackage, price: Math.floor(Number(e.target.value)) })} className={inputCls} required />
                                            </div>
                                            <div className="flex items-center gap-2.5 pt-6">
                                                <input type="checkbox" id="is_popular" checked={currentPackage.is_popular || false} onChange={e => setCurrentPackage({ ...currentPackage, is_popular: e.target.checked })} className="w-4 h-4 rounded accent-[var(--ad-accent)]" />
                                                <label htmlFor="is_popular" className="text-[13px] text-[var(--ad-text-secondary)]">Mark as popular</label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Features (one per line)</label>
                                            <textarea rows={4} value={currentPackage.features?.join('\n') || ""} onChange={e => handleArrayInput('features', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.stopPropagation(); }} className={inputCls} placeholder={"Feature 1\nFeature 2\nFeature 3"} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Images</label>
                                            {currentPackage.images && currentPackage.images.length > 0 && (
                                                <div className="grid grid-cols-4 gap-2 mb-3">
                                                    {currentPackage.images.map((img, idx) => (
                                                        <div key={idx} className="relative group">
                                                            <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-16 object-cover rounded-lg border border-[var(--ad-border)]" />
                                                            <button type="button" onClick={() => { const newImages = [...(currentPackage.images || [])]; newImages.splice(idx, 1); setCurrentPackage({ ...currentPackage, images: newImages }); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="border border-dashed rounded-lg p-5 text-center transition-colors" style={{ borderColor: "var(--ad-border)" }}>
                                                <input type="file" id="image-upload" accept="image/*" multiple className="hidden" onChange={async (e) => {
                                                    const files = e.target.files;
                                                    if (!files || files.length === 0) return;
                                                    const uploadedUrls: string[] = [];
                                                    for (const file of Array.from(files)) {
                                                        try {
                                                            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                                                            const url = await db.storage.uploadImage(file, fileName);
                                                            uploadedUrls.push(url);
                                                        } catch (err) {
                                                            console.error("Upload failed:", err);
                                                            alert(`Failed to upload ${file.name}. Make sure the 'package-images' bucket exists in Supabase Storage.`);
                                                        }
                                                    }
                                                    if (uploadedUrls.length > 0) {
                                                        setCurrentPackage(prev => ({ ...prev, images: [...(prev.images || []), ...uploadedUrls] }));
                                                    }
                                                    e.target.value = '';
                                                }} />
                                                <label htmlFor="image-upload" className="cursor-pointer">
                                                    <p className="text-[13px] text-[var(--ad-text-tertiary)]">Click to upload images</p>
                                                    <p className="text-[11px] text-[var(--ad-text-quaternary)] mt-1">PNG, JPG, WebP up to 5MB each</p>
                                                </label>
                                            </div>
                                            <div className="mt-3">
                                                <details className="text-[12px] text-[var(--ad-text-quaternary)]">
                                                    <summary className="cursor-pointer hover:text-[var(--ad-text-tertiary)]">Or add image URL manually</summary>
                                                    <input type="url" placeholder="https://example.com/image.jpg" className={`${inputCls} mt-2`} onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const input = e.target as HTMLInputElement;
                                                            if (input.value) {
                                                                setCurrentPackage(prev => ({ ...prev, images: [...(prev.images || []), input.value] }));
                                                                input.value = '';
                                                            }
                                                        }
                                                    }} />
                                                    <p className="text-[11px] text-[var(--ad-text-quaternary)] mt-1">Press Enter to add</p>
                                                </details>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button type="submit" className="flex-1 py-2.5 bg-[var(--ad-accent)] rounded-lg text-[13px] font-medium text-white hover:bg-[var(--ad-accent-hover)] transition-colors">Save Package</button>
                                            <button type="button" onClick={() => setIsEditingPackage(false)} className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-[var(--ad-text-secondary)] border border-[var(--ad-border)] hover:bg-[var(--ad-surface-hover)] transition-colors">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {packages.map(pkg => (
                                        <div key={pkg.id} className="admin-card rounded-xl px-4 py-3.5 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                {pkg.images && pkg.images.length > 0 ? (
                                                    <img src={pkg.images[0]} alt={pkg.title} className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: "var(--ad-bg-raised)" }}>{pkg.icon}</div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-[13px] font-medium text-[var(--ad-text)]">{pkg.title}</h4>
                                                        {pkg.is_popular && (
                                                            <span className="px-1.5 py-px text-[10px] font-medium rounded bg-amber-500/10 text-amber-400">Popular</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[12px] text-[var(--ad-text-tertiary)]">{pkg.subtitle} · ৳{pkg.price.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => { setCurrentPackage(pkg); setIsEditingPackage(true); }} className="px-2.5 py-1.5 text-[12px] text-[var(--ad-text-tertiary)] rounded-md hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)] transition-colors">Edit</button>
                                                <button onClick={() => deletePackage(pkg.id)} className="px-2.5 py-1.5 text-[12px] text-red-400 rounded-md hover:bg-red-500/10 transition-colors">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                    {packages.length === 0 && (
                                        <div className="text-center py-12 text-[13px] text-[var(--ad-text-quaternary)]">No packages yet.</div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "enrollments" && (
                        <motion.div key="enrollments" {...fade}>
                            <h2 className="text-[15px] font-semibold text-[var(--ad-text)] mb-5">Enrollments</h2>

                            <div className="admin-card rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[13px]">
                                        <thead>
                                            <tr style={{ background: "var(--ad-bg-raised)" }}>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[var(--ad-text-tertiary)] uppercase tracking-wider">Student</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[var(--ad-text-tertiary)] uppercase tracking-wider">Email</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[var(--ad-text-tertiary)] uppercase tracking-wider">Package</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[var(--ad-text-tertiary)] uppercase tracking-wider">TrxID</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[var(--ad-text-tertiary)] uppercase tracking-wider">Screenshot</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[var(--ad-text-tertiary)] uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[var(--ad-text-tertiary)] uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[var(--ad-text-tertiary)] uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {enrollments.map((enrollment) => (
                                                <tr key={enrollment.id} className="border-t border-[var(--ad-border)]">
                                                    <td className="px-4 py-3">
                                                        <p className="text-[var(--ad-text)] font-medium">{enrollment.student_name}</p>
                                                        <p className="text-[11px] text-[var(--ad-text-quaternary)]">{new Date(enrollment.created_at).toLocaleString()}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-[var(--ad-text-secondary)]">{enrollment.student_email || "-"}</td>
                                                    <td className="px-4 py-3 text-[var(--ad-text-secondary)]">{enrollment.package_title}</td>
                                                    <td className="px-4 py-3 font-mono text-[12px] text-[var(--ad-text-tertiary)]">{enrollment.transaction_id}</td>
                                                    <td className="px-4 py-3">
                                                        {enrollment.payment_screenshot ? (
                                                            <a href={enrollment.payment_screenshot} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[var(--ad-accent)] hover:underline">View</a>
                                                        ) : (
                                                            <span className="text-[var(--ad-text-quaternary)]">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-[var(--ad-text)]">৳{enrollment.amount.toLocaleString()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${enrollment.status === "verified" ? "bg-emerald-500/10 text-emerald-400" : enrollment.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                                                            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {enrollment.status === "pending" && (
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => updateEnrollmentStatus(enrollment.id, "verified")} className="px-2 py-1 text-[11px] font-medium text-emerald-400 rounded-md hover:bg-emerald-500/10 transition-colors">Verify</button>
                                                                <button onClick={() => updateEnrollmentStatus(enrollment.id, "rejected")} className="px-2 py-1 text-[11px] font-medium text-red-400 rounded-md hover:bg-red-500/10 transition-colors">Reject</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {enrollments.length === 0 && (
                                                <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[var(--ad-text-quaternary)]">No enrollments yet</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "messages" && (
                        <motion.div key="messages" {...fade}>
                            <h2 className="text-[15px] font-semibold text-[var(--ad-text)] mb-5">Messages</h2>

                            <div className="space-y-2">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`admin-card rounded-xl px-4 py-4 ${msg.status === "unread" ? "border-l-2 !border-l-[var(--ad-accent)]" : ""}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="text-[13px] font-medium text-[var(--ad-text)]">{msg.name}</h4>
                                                    <span className={`px-1.5 py-px rounded text-[10px] font-medium ${msg.status === "unread" ? "bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]" : msg.status === "replied" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"}`}>
                                                        {msg.status}
                                                    </span>
                                                </div>
                                                <p className="text-[12px] text-[var(--ad-text-tertiary)]">{msg.email} · {msg.phone}</p>
                                                {msg.destination && <p className="text-[12px] text-[var(--ad-accent)] mt-0.5">Interested in: {msg.destination}</p>}
                                            </div>
                                            <span className="text-[11px] text-[var(--ad-text-quaternary)]">{new Date(msg.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-[13px] text-[var(--ad-text-secondary)] mb-3">{msg.message}</p>
                                        <div className="flex gap-2">
                                            {msg.status === "unread" && (
                                                <button onClick={() => updateMessageStatus(msg.id, "read")} className="px-2.5 py-1.5 text-[12px] text-[var(--ad-text-tertiary)] rounded-md border border-[var(--ad-border)] hover:bg-[var(--ad-surface-hover)] transition-colors">Mark read</button>
                                            )}
                                            <a href={`mailto:${msg.email}`} onClick={() => updateMessageStatus(msg.id, "replied")} className="px-2.5 py-1.5 text-[12px] text-[var(--ad-accent)] rounded-md hover:bg-[var(--ad-accent-soft)] transition-colors">Reply via email</a>
                                            {msg.phone && (
                                                <a href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 text-[12px] text-emerald-400 rounded-md hover:bg-emerald-500/10 transition-colors">WhatsApp</a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <div className="text-center py-12 text-[13px] text-[var(--ad-text-quaternary)] admin-card rounded-xl">No messages yet</div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "destinations" && (
                        <motion.div key="destinations" {...fade}>
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-[15px] font-semibold text-[var(--ad-text)]">Destinations</h2>
                                <button
                                    onClick={() => { setCurrentDestination({ highlights: [] }); setIsEditingDestination(true); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--ad-accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--ad-accent-hover)] transition-colors"
                                >
                                    Add destination
                                </button>
                            </div>

                            {isEditingDestination ? (
                                <div className="admin-card rounded-xl p-6 max-w-2xl">
                                    <h3 className="text-[14px] font-semibold text-[var(--ad-text)] mb-5">
                                        {currentDestination.id ? "Edit Destination" : "New Destination"}
                                    </h3>
                                    <form onSubmit={handleSaveDestination} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={labelCls}>Country</label>
                                                <input type="text" value={currentDestination.country || ""} onChange={e => setCurrentDestination({ ...currentDestination, country: e.target.value })} className={inputCls} required />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Flag (emoji)</label>
                                                <input type="text" value={currentDestination.flag || ""} onChange={e => setCurrentDestination({ ...currentDestination, flag: e.target.value })} className={inputCls} placeholder="e.g. 🇮🇹" required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Description</label>
                                            <textarea value={currentDestination.description || ""} onChange={e => setCurrentDestination({ ...currentDestination, description: e.target.value })} className={inputCls} rows={3} required />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Partner universities</label>
                                            <input type="number" value={currentDestination.university_count || ""} onChange={e => setCurrentDestination({ ...currentDestination, university_count: Number(e.target.value) })} className={inputCls} required />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Highlights (one per line)</label>
                                            <textarea rows={4} value={currentDestination.highlights?.join('\n') || ""} onChange={e => handleDestinationArrayInput(e.target.value)} className={inputCls} placeholder={"Low tuition fees\nRich history\nWork permit"} />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button type="submit" className="flex-1 py-2.5 bg-[var(--ad-accent)] rounded-lg text-[13px] font-medium text-white hover:bg-[var(--ad-accent-hover)] transition-colors">Save</button>
                                            <button type="button" onClick={() => setIsEditingDestination(false)} className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-[var(--ad-text-secondary)] border border-[var(--ad-border)] hover:bg-[var(--ad-surface-hover)] transition-colors">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-3">
                                    {destinations.map(dest => (
                                        <div key={dest.id} className="admin-card rounded-xl px-4 py-4">
                                            <div className="flex justify-between items-start mb-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-xl">{dest.flag}</span>
                                                    <div>
                                                        <h3 className="text-[13px] font-medium text-[var(--ad-text)]">{dest.country}</h3>
                                                        <p className="text-[11px] text-[var(--ad-text-tertiary)]">{dest.university_count}+ universities</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setCurrentDestination(dest); setIsEditingDestination(true); }} className="p-1.5 rounded-md text-[var(--ad-text-tertiary)] hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)] transition-colors text-[12px]">Edit</button>
                                                    <button onClick={() => deleteDestination(dest.id)} className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors text-[12px]">Delete</button>
                                                </div>
                                            </div>
                                            <p className="text-[12px] text-[var(--ad-text-tertiary)] mb-2.5 line-clamp-2">{dest.description}</p>
                                            <div className="space-y-1">
                                                {dest.highlights.slice(0, 3).map((h, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--ad-text-quaternary)]">
                                                        <span className="text-emerald-400">✓</span> {h}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {destinations.length === 0 && (
                                        <div className="col-span-2 text-center py-12 text-[13px] text-[var(--ad-text-quaternary)]">No destinations yet.</div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
