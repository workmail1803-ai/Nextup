"use client";

import { motion } from "framer-motion";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { db } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import FloatingContact from "@/components/FloatingContact";
import SpotlightCursor from "@/components/SpotlightCursor";

function ContactContent() {
    return (
        <main className="min-h-screen relative">
            {/* Spotlight Cursor Effect */}
            <SpotlightCursor />

            <Navbar />

            {/* Hero Section for Contact */}
            <section className="pt-32 pb-16 px-6 md:px-12">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-6">
                            💬 Get In Touch
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Start Your <span className="text-gradient">Journey Today</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Book a free consultation and let&apos;s discuss your European education goals.
                            Our experienced mentors are here to guide you every step of the way.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Contact Form & Info Section */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <form
                                className="glass-card rounded-2xl p-8 space-y-6 glow-gold"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const formData = new FormData(form);
                                    try {
                                        await db.messages.create({
                                            name: formData.get("name") as string,
                                            email: formData.get("email") as string,
                                            phone: (formData.get("phone") as string) || null,
                                            destination: (formData.get("destination") as string) || null,
                                            message: formData.get("message") as string,
                                            status: "unread",
                                            replied_at: null,
                                        });
                                        alert("Message sent successfully! We'll contact you soon.");
                                        form.reset();
                                    } catch (error) {
                                        console.error("Error sending message:", error);
                                        alert("Failed to send message. Please try again.");
                                    }
                                }}
                            >
                                <h2 className="text-2xl font-bold text-white mb-4">Send Us a Message</h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Your name"
                                            required
                                            className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="your@email.com"
                                            required
                                            className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="+880 1XXX-XXXXXX"
                                            className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2">Preferred Destination</label>
                                        <select
                                            name="destination"
                                            className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                                        >
                                            <option value="">Select a country</option>
                                            <option value="Italy">Italy</option>
                                            <option value="Lithuania">Lithuania</option>
                                            <option value="Germany">Germany</option>
                                            <option value="Poland">Poland</option>
                                            <option value="Hungary">Hungary</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Your Message</label>
                                    <textarea
                                        rows={4}
                                        name="message"
                                        placeholder="Tell us about your academic background and goals..."
                                        required
                                        className="w-full bg-slate-800/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl font-semibold text-slate-900 hover:scale-102 transition-transform duration-200"
                                >
                                    Request Free Consultation
                                </button>
                            </form>
                        </motion.div>

                        {/* Contact Information */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
                                <p className="text-slate-400 mb-8">
                                    We&apos;re here to answer any questions you might have. Get in touch with us through
                                    any of the following channels.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    {
                                        icon: "📍",
                                        title: "Our Office",
                                        details: ["Dhaka, Bangladesh", "Gulshan-2, Road 45"],
                                    },
                                    {
                                        icon: "📧",
                                        title: "Email Us",
                                        details: ["nextupmentor@gmail.com"],
                                    },
                                    {
                                        icon: "📞",
                                        title: "Call Us",
                                        details: ["+8801726867991", "Available 10 AM - 8 PM (BST)"],
                                    },
                                    {
                                        icon: "🌐",
                                        title: "Follow Us",
                                        details: [] as string[],
                                        links: [
                                            { label: "Facebook: @NextUpMentor", url: "https://www.facebook.com/profile.php?id=61585820771768" },
                                            { label: "Instagram: @nextup_mentor", url: "https://www.instagram.com/nextup_mentor?igsh=MTNyZmprYjYwYjRtNw==" },
                                        ],
                                    },
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.title}
                                        className="glass-card rounded-xl p-5 flex gap-4 hover:scale-102 hover:translate-x-1 transition-transform duration-200"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                    >
                                        <div className="text-3xl">{item.icon}</div>
                                        <div>
                                            <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                                            {item.details.map((detail) => (
                                                <p key={detail} className="text-sm text-slate-400">
                                                    {detail}
                                                </p>
                                            ))}
                                            {"links" in item && item.links?.map((link) => (
                                                <a
                                                    key={link.url}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-sm text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                                                >
                                                    {link.label}
                                                </a>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Office Hours */}
                            <motion.div
                                className="glass-card rounded-xl p-6 mt-8"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <span className="text-xl">🕐</span> Office Hours
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Saturday - Thursday</span>
                                        <span className="text-amber-400">10:00 AM - 8:00 PM</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Friday</span>
                                        <span className="text-slate-500">Closed</span>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-6 bg-slate-900/30">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-6">
                            ❓ FAQ
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            Frequently Asked <span className="text-gradient">Questions</span>
                        </h2>
                    </motion.div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "How soon should I start my application?",
                                a: "We recommend starting at least 6-8 months before your intended intake. This gives ample time for document preparation, university applications, and visa processing.",
                            },
                            {
                                q: "Do I need to know the local language?",
                                a: "Many European universities offer programs entirely in English. However, learning the local language can enhance your experience and job prospects.",
                            },
                            {
                                q: "What are the costs involved?",
                                a: "Costs vary by country and university. Many European countries offer free or low-cost education. We'll help you find options that fit your budget.",
                            },
                            {
                                q: "Can I work while studying?",
                                a: "Yes! Most European countries allow international students to work part-time (typically 20 hours/week) during their studies.",
                            },
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                className="glass-card rounded-xl p-6"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                                <p className="text-slate-400 text-sm">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Floating Contact Buttons */}
            <FloatingContact />
        </main>
    );
}

export default function ContactPage() {
    return (
        <CurrencyProvider>
            <ContactContent />
        </CurrencyProvider>
    );
}
