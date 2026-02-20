"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, Package, Enrollment, Message, Destination } from "@/lib/supabase";

type Tab = "overview" | "enrollments" | "messages" | "packages" | "destinations";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Package Form State
    const [isEditingPackage, setIsEditingPackage] = useState(false);
    const [currentPackage, setCurrentPackage] = useState<Partial<Package>>({});

    // Destination Form State
    const [isEditingDestination, setIsEditingDestination] = useState(false);
    const [currentDestination, setCurrentDestination] = useState<Partial<Destination>>({});

    // Simple Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");

    // Fetch data from Supabase on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchAllData();
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900">
                <div className="glass-card p-8 rounded-2xl w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (password === "admin123") {
                            setIsAuthenticated(true);
                        } else {
                            alert("Incorrect password");
                        }
                    }}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Admin Password"
                            className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors mb-4"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl font-semibold text-slate-900"
                        >
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

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
        } catch (err: any) {
            console.error("Error saving destination:", err);
            alert("Failed to save destination: " + err.message);
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
                    features: currentPackage.features || [],
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
                    features: currentPackage.features || [],
                    images: currentPackage.images || [],
                    is_popular: currentPackage.is_popular || false,
                    is_active: true,
                    display_order: packages.length + 1,
                });
                setPackages(prev => [...prev, created]);
            }
            setIsEditingPackage(false);
            setCurrentPackage({});
        } catch (err: any) {
            console.error("Error saving package:", err);
            alert("Failed to save package: " + (err.message || "Check console for details"));
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
            [field]: value.split('\n').filter(line => line.trim() !== '')
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
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="glass-card rounded-2xl p-8 max-w-lg text-center">
                    <p className="text-4xl mb-4">⚠️</p>
                    <h2 className="text-xl font-bold text-white mb-2">Database Connection Error</h2>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={fetchAllData}
                        className="px-6 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800/50 border-r border-slate-700/50 p-6 fixed h-full overflow-y-auto">
                <div className="mb-8">
                    <h1 className="text-xl font-bold">
                        <span className="text-white">NextUp</span>
                        <span className="text-gradient"> Admin</span>
                    </h1>
                </div>

                <nav className="space-y-2">
                    {[
                        { id: "overview" as Tab, label: "Overview", icon: "📊" },
                        { id: "enrollments" as Tab, label: "Enrollments", icon: "📝", badge: stats.pendingEnrollments },
                        { id: "messages" as Tab, label: "Messages", icon: "💬", badge: stats.unreadMessages },
                        { id: "packages" as Tab, label: "Packages", icon: "📦", badge: stats.totalPackages },
                        { id: "destinations" as Tab, label: "Destinations", icon: "🌍", badge: stats.totalDestinations },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeTab === item.id
                                ? "bg-amber-500/20 text-amber-400"
                                : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                                }`}
                        >
                            <span className="flex items-center gap-3">
                                <span>{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="px-2 py-0.5 bg-amber-500 text-slate-900 text-xs font-bold rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-8 pt-8 border-t border-slate-700/50 space-y-2">
                    <button
                        onClick={fetchAllData}
                        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors w-full"
                    >
                        <span>🔄</span>
                        <span>Refresh Data</span>
                    </button>
                    <a
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors"
                    >
                        <span>🏠</span>
                        <span>Back to Website</span>
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 ml-64">
                <AnimatePresence mode="wait">
                    {activeTab === "overview" && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {[
                                    { label: "Total Enrollments", value: stats.totalEnrollments, icon: "📝" },
                                    { label: "Pending Verification", value: stats.pendingEnrollments, icon: "⏳" },
                                    { label: "Unread Messages", value: stats.unreadMessages, icon: "📬" },
                                    { label: "Active Packages", value: stats.totalPackages, icon: "📦" },
                                    { label: "Destinations", value: stats.totalDestinations, icon: "🌍" },
                                ].map((stat) => (
                                    <div key={stat.label} className="glass-card rounded-2xl p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="text-3xl">{stat.icon}</div>
                                            <div>
                                                <p className="text-3xl font-bold text-white">{stat.value}</p>
                                                <p className="text-sm text-slate-400">{stat.label}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Activity */}
                            <div className="glass-card rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                                <div className="space-y-4">
                                    {[...enrollments.slice(0, 3), ...messages.slice(0, 2)]
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .slice(0, 5)
                                        .map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">
                                                        {"student_name" in item ? "📝" : "💬"}
                                                    </span>
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {"student_name" in item ? item.student_name : item.name}
                                                        </p>
                                                        <p className="text-sm text-slate-400">
                                                            {"student_name" in item
                                                                ? `Enrolled in ${item.package_title}`
                                                                : `Message about ${item.destination || "inquiry"}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    {enrollments.length === 0 && messages.length === 0 && (
                                        <p className="text-center text-slate-500 py-8">No recent activity</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "packages" && (
                        <motion.div
                            key="packages"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Package Management</h2>
                                <button
                                    onClick={() => {
                                        setCurrentPackage({ features: [], images: [] });
                                        setIsEditingPackage(true);
                                    }}
                                    className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
                                >
                                    + Add New Package
                                </button>
                            </div>

                            {isEditingPackage ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-card rounded-2xl p-8 max-w-2xl mx-auto"
                                >
                                    <h3 className="text-xl font-bold text-white mb-6">
                                        {currentPackage.id ? "Edit Package" : "Create New Package"}
                                    </h3>
                                    <form onSubmit={handleSavePackage} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">Package Title</label>
                                                <input
                                                    type="text"
                                                    value={currentPackage.title || ""}
                                                    onChange={e => setCurrentPackage({ ...currentPackage, title: e.target.value })}
                                                    className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">Icon (emoji)</label>
                                                <input
                                                    type="text"
                                                    value={currentPackage.icon || "📚"}
                                                    onChange={e => setCurrentPackage({ ...currentPackage, icon: e.target.value })}
                                                    className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-2">Subtitle</label>
                                            <input
                                                type="text"
                                                value={currentPackage.subtitle || ""}
                                                onChange={e => setCurrentPackage({ ...currentPackage, subtitle: e.target.value })}
                                                className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">Price (BDT)</label>
                                                <input
                                                    type="number"
                                                    value={currentPackage.price || ""}
                                                    step="1"
                                                    onChange={e => setCurrentPackage({ ...currentPackage, price: Math.floor(Number(e.target.value)) })}
                                                    className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 pt-8">
                                                <input
                                                    type="checkbox"
                                                    id="is_popular"
                                                    checked={currentPackage.is_popular || false}
                                                    onChange={e => setCurrentPackage({ ...currentPackage, is_popular: e.target.checked })}
                                                    className="w-5 h-5 rounded accent-amber-500"
                                                />
                                                <label htmlFor="is_popular" className="text-slate-300">Mark as Popular</label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-2">Features (One per line)</label>
                                            <textarea
                                                rows={5}
                                                value={currentPackage.features?.join('\n') || ""}
                                                onChange={e => handleArrayInput('features', e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.stopPropagation();
                                                    }
                                                }}
                                                className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                placeholder={"Feature 1\nFeature 2\nFeature 3"}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-2">Package Images</label>

                                            {/* Image Preview Grid */}
                                            {currentPackage.images && currentPackage.images.length > 0 && (
                                                <div className="grid grid-cols-4 gap-3 mb-4">
                                                    {currentPackage.images.map((img, idx) => (
                                                        <div key={idx} className="relative group">
                                                            <img
                                                                src={img}
                                                                alt={`Preview ${idx + 1}`}
                                                                className="w-full h-20 object-cover rounded-lg border border-slate-700"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newImages = [...(currentPackage.images || [])];
                                                                    newImages.splice(idx, 1);
                                                                    setCurrentPackage({ ...currentPackage, images: newImages });
                                                                }}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* File Upload Input */}
                                            <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-amber-500 transition-colors">
                                                <input
                                                    type="file"
                                                    id="image-upload"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const files = e.target.files;
                                                        if (!files || files.length === 0) return;

                                                        const uploadedUrls: string[] = [];

                                                        for (const file of Array.from(files)) {
                                                            try {
                                                                // Generate unique filename
                                                                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                                                                const url = await db.storage.uploadImage(file, fileName);
                                                                uploadedUrls.push(url);
                                                            } catch (err) {
                                                                console.error("Upload failed:", err);
                                                                alert(`Failed to upload ${file.name}. Make sure the 'package-images' bucket exists in Supabase Storage.`);
                                                            }
                                                        }

                                                        if (uploadedUrls.length > 0) {
                                                            setCurrentPackage(prev => ({
                                                                ...prev,
                                                                images: [...(prev.images || []), ...uploadedUrls]
                                                            }));
                                                        }

                                                        // Reset input
                                                        e.target.value = '';
                                                    }}
                                                />
                                                <label htmlFor="image-upload" className="cursor-pointer">
                                                    <div className="text-4xl mb-2">📷</div>
                                                    <p className="text-slate-400 text-sm">Click to upload images</p>
                                                    <p className="text-slate-500 text-xs mt-1">PNG, JPG, WebP up to 5MB each</p>
                                                </label>
                                            </div>

                                            {/* Or add URL manually */}
                                            <div className="mt-4">
                                                <details className="text-slate-500 text-sm">
                                                    <summary className="cursor-pointer hover:text-slate-300">Or add image URL manually</summary>
                                                    <input
                                                        type="url"
                                                        placeholder="https://example.com/image.jpg"
                                                        className="w-full mt-2 bg-slate-800/80 rounded-xl px-4 py-2 text-white text-sm border border-slate-700 focus:border-amber-500 transition-colors"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const input = e.target as HTMLInputElement;
                                                                if (input.value) {
                                                                    setCurrentPackage(prev => ({
                                                                        ...prev,
                                                                        images: [...(prev.images || []), input.value]
                                                                    }));
                                                                    input.value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <p className="text-xs text-slate-600 mt-1">Press Enter to add</p>
                                                </details>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="submit"
                                                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl font-semibold text-slate-900"
                                            >
                                                Save Package
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingPackage(false)}
                                                className="px-6 py-3 glass rounded-xl font-semibold text-slate-400 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            ) : (
                                <div className="grid gap-6">
                                    {packages.map(pkg => (
                                        <div key={pkg.id} className="glass-card rounded-xl p-6 flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                {pkg.images && pkg.images.length > 0 ? (
                                                    <img src={pkg.images[0]} alt={pkg.title} className="w-16 h-16 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center text-2xl">{pkg.icon}</div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-xl font-bold text-white">{pkg.title}</h4>
                                                        {pkg.is_popular && (
                                                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Popular</span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-400">{pkg.subtitle}</p>
                                                    <p className="text-amber-400 font-semibold mt-1">৳{pkg.price.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setCurrentPackage(pkg);
                                                        setIsEditingPackage(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deletePackage(pkg.id)}
                                                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {packages.length === 0 && (
                                        <div className="text-center py-12 text-slate-500">
                                            No packages found. Click &quot;Add New Package&quot; to create one.
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "enrollments" && (
                        <motion.div
                            key="enrollments"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Enrollment Management</h2>

                            <div className="glass-card rounded-2xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Student</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Email</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Package</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">TrxID</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Screenshot</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Amount</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Status</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrollments.map((enrollment) => (
                                            <tr key={enrollment.id} className="border-t border-slate-700/50">
                                                <td className="px-6 py-4">
                                                    <p className="text-white font-medium">{enrollment.student_name}</p>
                                                    <p className="text-xs text-slate-500">{new Date(enrollment.created_at).toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-4 text-slate-300 text-sm">{enrollment.student_email || "-"}</td>
                                                <td className="px-6 py-4 text-slate-300">{enrollment.package_title}</td>
                                                <td className="px-6 py-4 text-slate-400 font-mono text-sm">{enrollment.transaction_id}</td>
                                                <td className="px-6 py-4">
                                                    {enrollment.payment_screenshot ? (
                                                        <a
                                                            href={enrollment.payment_screenshot}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-lg text-sm hover:bg-pink-500/30 transition-colors inline-flex items-center gap-1"
                                                        >
                                                            📷 View
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-500 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-amber-400 font-semibold">৳{enrollment.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${enrollment.status === "verified"
                                                            ? "bg-green-500/20 text-green-400"
                                                            : enrollment.status === "rejected"
                                                                ? "bg-red-500/20 text-red-400"
                                                                : "bg-yellow-500/20 text-yellow-400"
                                                            }`}
                                                    >
                                                        {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {enrollment.status === "pending" && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => updateEnrollmentStatus(enrollment.id, "verified")}
                                                                className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                                                            >
                                                                Verify
                                                            </button>
                                                            <button
                                                                onClick={() => updateEnrollmentStatus(enrollment.id, "rejected")}
                                                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {enrollments.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                                    No enrollments yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "messages" && (
                        <motion.div
                            key="messages"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Messages</h2>

                            <div className="grid gap-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`glass-card rounded-xl p-6 ${msg.status === "unread" ? "border-l-4 border-amber-500" : ""}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="text-lg font-semibold text-white">{msg.name}</h4>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs ${msg.status === "unread"
                                                            ? "bg-amber-500/20 text-amber-400"
                                                            : msg.status === "replied"
                                                                ? "bg-green-500/20 text-green-400"
                                                                : "bg-slate-500/20 text-slate-400"
                                                            }`}
                                                    >
                                                        {msg.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400">{msg.email} • {msg.phone}</p>
                                                {msg.destination && <p className="text-sm text-amber-400">Interested in: {msg.destination}</p>}
                                            </div>
                                            <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-slate-300 mb-4">{msg.message}</p>
                                        <div className="flex gap-3">
                                            {msg.status === "unread" && (
                                                <button
                                                    onClick={() => updateMessageStatus(msg.id, "read")}
                                                    className="px-4 py-2 bg-slate-500/20 text-slate-300 rounded-lg text-sm hover:bg-slate-500/30"
                                                >
                                                    Mark as Read
                                                </button>
                                            )}
                                            <a
                                                href={`mailto:${msg.email}`}
                                                onClick={() => updateMessageStatus(msg.id, "replied")}
                                                className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30"
                                            >
                                                Reply via Email
                                            </a>
                                            {msg.phone && (
                                                <a
                                                    href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, "")}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30"
                                                >
                                                    WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <div className="text-center py-12 text-slate-500 glass-card rounded-xl">
                                        No messages yet
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "destinations" && (
                        <motion.div
                            key="destinations"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Destinations Management</h2>
                                <button
                                    onClick={() => {
                                        setCurrentDestination({ highlights: [] });
                                        setIsEditingDestination(true);
                                    }}
                                    className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
                                >
                                    + Add New Destination
                                </button>
                            </div>

                            {isEditingDestination ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-card rounded-2xl p-8 max-w-2xl mx-auto"
                                >
                                    <h3 className="text-xl font-bold text-white mb-6">
                                        {currentDestination.id ? "Edit Destination" : "Add New Destination"}
                                    </h3>
                                    <form onSubmit={handleSaveDestination} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">Country Name</label>
                                                <input
                                                    type="text"
                                                    value={currentDestination.country || ""}
                                                    onChange={e => setCurrentDestination({ ...currentDestination, country: e.target.value })}
                                                    className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">Flag (Emoji)</label>
                                                <input
                                                    type="text"
                                                    value={currentDestination.flag || ""}
                                                    onChange={e => setCurrentDestination({ ...currentDestination, flag: e.target.value })}
                                                    className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                    placeholder="e.g. 🇮🇹"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-2">Description</label>
                                            <textarea
                                                value={currentDestination.description || ""}
                                                onChange={e => setCurrentDestination({ ...currentDestination, description: e.target.value })}
                                                className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                rows={3}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">Partner Universities Count</label>
                                                <input
                                                    type="number"
                                                    value={currentDestination.university_count || ""}
                                                    onChange={e => setCurrentDestination({ ...currentDestination, university_count: Number(e.target.value) })}
                                                    className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-2">Highlights (One per line)</label>
                                            <textarea
                                                rows={4}
                                                value={currentDestination.highlights?.join('\n') || ""}
                                                onChange={e => handleDestinationArrayInput(e.target.value)}
                                                className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 transition-colors"
                                                placeholder="Low tuition fees&#10;Rich history&#10;Work permit"
                                            />
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="submit"
                                                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl font-semibold text-slate-900"
                                            >
                                                Save Destination
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingDestination(false)}
                                                className="px-6 py-3 glass rounded-xl font-semibold text-slate-400 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {destinations.map(dest => (
                                        <div key={dest.id} className="glass-card rounded-xl p-6 relative group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-4xl">{dest.flag}</span>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">{dest.country}</h3>
                                                        <p className="text-sm text-amber-400">{dest.university_count}+ Universities</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentDestination(dest);
                                                            setIsEditingDestination(true);
                                                        }}
                                                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => deleteDestination(dest.id)}
                                                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{dest.description}</p>
                                            <div className="space-y-1">
                                                {dest.highlights.slice(0, 3).map((h, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="text-amber-500">✓</span> {h}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {destinations.length === 0 && (
                                        <div className="col-span-2 text-center py-12 text-slate-500">
                                            No destinations found. Add one to get started.
                                        </div>
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
