"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, supabase } from "@/lib/supabase";

// TODO: Future integration with SSL Commerz for international students.

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    packageId?: string;
    packageTitle: string;
    packagePrice: string;
    packageAmount: number;
}

type PaymentMethod = "bkash" | "nagad" | "bank";

interface PaymentInfo {
    name: string;
    number: string;
    color: string;
    bgColor: string;
    icon: string;
    label: string;
}

const paymentMethods: Record<PaymentMethod, PaymentInfo> = {
    bkash: {
        name: "bKash",
        number: "01883-913491",
        color: "text-pink-400",
        bgColor: "from-pink-500 to-pink-600",
        icon: "💳",
        label: "bKash Personal Number",
    },
    nagad: {
        name: "Nagad",
        number: "01883-913491",
        color: "text-orange-400",
        bgColor: "from-orange-500 to-orange-600",
        icon: "📱",
        label: "Nagad Personal Number",
    },
    bank: {
        name: "Bank Transfer",
        number: "2304144638001",
        color: "text-blue-400",
        bgColor: "from-blue-500 to-blue-600",
        icon: "🏦",
        label: "Account Number",
    },
};

export default function PaymentModal({
    isOpen,
    onClose,
    packageId,
    packageTitle,
    packagePrice,
    packageAmount,
}: PaymentModalProps) {
    const [studentName, setStudentName] = useState("");
    const [studentEmail, setStudentEmail] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [copied, setCopied] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bkash");

    const currentPayment = paymentMethods[paymentMethod];

    // Handle escape key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    const handleCopyNumber = async () => {
        try {
            await navigator.clipboard.writeText(currentPayment.number.replace("-", ""));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (studentName.trim() && studentEmail.trim() && transactionId.trim() && screenshot) {
            setIsSubmitting(true);
            try {
                let screenshotUrl: string | null = null;

                // Upload screenshot if provided
                if (screenshot) {
                    const fileExt = screenshot.name.split('.').pop()?.toLowerCase() || 'jpg';
                    const fileName = `${Date.now()}.${fileExt}`;
                    const mimeTypes: Record<string, string> = {
                        'jpg': 'image/jpeg',
                        'jpeg': 'image/jpeg',
                        'png': 'image/png',
                        'gif': 'image/gif',
                        'webp': 'image/webp'
                    };
                    const contentType = screenshot.type || mimeTypes[fileExt] || 'image/jpeg';

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from("payment-screenshots")
                        .upload(fileName, screenshot, {
                            contentType,
                            upsert: true
                        });
                    if (uploadError) {
                        console.error('Upload error:', uploadError);
                        console.error('Error details:', JSON.stringify(uploadError, null, 2));
                        console.error('File info:', { name: screenshot.name, size: screenshot.size, type: screenshot.type });
                        throw new Error(`Upload failed: ${uploadError.message || 'Unknown error'}`);
                    }
                    screenshotUrl = supabase.storage.from("payment-screenshots").getPublicUrl(uploadData.path).data.publicUrl;
                    console.log('Screenshot uploaded:', screenshotUrl);
                }

                await db.enrollments.create({
                    student_name: studentName.trim(),
                    student_email: studentEmail.trim(),
                    student_phone: null,
                    package_id: packageId || null,
                    package_title: packageTitle,
                    amount: packageAmount,
                    transaction_id: transactionId.trim(),
                    payment_screenshot: screenshotUrl,
                    status: "pending",
                    admin_notes: null,
                });
                setSubmitted(true);
                setTimeout(() => {
                    onClose();
                    setSubmitted(false);
                    setStudentName("");
                    setStudentEmail("");
                    setTransactionId("");
                    setScreenshot(null);
                }, 2500);
            } catch (error) {
                console.error("Error submitting enrollment:", error);
                alert("Failed to submit enrollment. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-6 glow-gold"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Academic icon */}
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🎓</span>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-center text-white mb-1">
                            Confirm Your Consultancy Slot
                        </h2>
                        <p className="text-slate-400 text-center text-sm mb-4">
                            {packageTitle} • {packagePrice}
                        </p>

                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6"
                            >
                                <div className="w-12 h-12 mx-auto mb-3 bg-amber-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">Enrollment Submitted!</h3>
                                <p className="text-slate-400 text-sm">We'll verify your payment within 24 hours.</p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Payment Method Selector */}
                                <div className="flex gap-2 mb-4">
                                    {(Object.keys(paymentMethods) as PaymentMethod[]).map((method) => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentMethod(method)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${paymentMethod === method
                                                ? `bg-gradient-to-r ${paymentMethods[method].bgColor} text-white shadow-lg scale-105`
                                                : "bg-slate-800/80 text-slate-400 hover:bg-slate-700"
                                                }`}
                                        >
                                            <span className="mr-1">{paymentMethods[method].icon}</span>
                                            {paymentMethods[method].name}
                                        </button>
                                    ))}
                                </div>

                                {/* Info message */}
                                <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
                                    <p className="text-slate-300 text-sm">
                                        Pay via <span className={`${currentPayment.color} font-semibold`}>{currentPayment.name}</span> to secure your slot.
                                    </p>
                                    {paymentMethod === "bank" && (
                                        <div className="mt-2 text-xs text-slate-400">
                                            <p><strong>Bank:</strong> City Bank</p>
                                            <p><strong>Branch:</strong> Khulna</p>
                                            <p><strong>Account Name:</strong> Md Fahim Harun</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Number */}
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-400 mb-1">{currentPayment.label}</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-800/80 rounded-lg px-3 py-2 font-mono text-base text-white">
                                            {currentPayment.number}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCopyNumber}
                                            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${copied
                                                ? "bg-amber-500 text-slate-900"
                                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                                }`}
                                        >
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </div>

                                {/* Student Details Form */}
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Student Name</label>
                                        <input
                                            type="text"
                                            value={studentName}
                                            onChange={(e) => setStudentName(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="w-full bg-slate-800/80 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Student Email</label>
                                        <input
                                            type="email"
                                            value={studentEmail}
                                            onChange={(e) => setStudentEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full bg-slate-800/80 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Transaction ID (TrxID)</label>
                                        <input
                                            type="text"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            placeholder={`Enter your ${currentPayment.name} Transaction ID`}
                                            className="w-full bg-slate-800/80 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">
                                            {paymentMethod === "bank" ? "Payment Copy" : "Payment Screenshot"} <span className="text-red-400">*</span>
                                        </label>
                                        <div className={`w-full bg-slate-800/80 rounded-xl px-4 py-3 border ${screenshot ? 'border-amber-500' : 'border-slate-700'} transition-colors`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                                                className="w-full text-slate-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 cursor-pointer"
                                                required
                                            />
                                        </div>
                                        {screenshot && (
                                            <p className="text-xs text-amber-400 mt-1">✓ {screenshot.name}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl font-semibold text-slate-900 hover:scale-102 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? "Submitting..." : "Confirm Enrollment"}
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

