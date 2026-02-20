"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CurrencyProvider } from "@/context/CurrencyContext";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PartnerMarquee from "@/components/PartnerMarquee";
import FloatingContact from "@/components/FloatingContact";
import SpotlightCursor from "@/components/SpotlightCursor";

function HomeContent() {
  return (
    <main className="min-h-screen relative">
      {/* Spotlight Cursor Effect */}
      <SpotlightCursor />

      <Navbar />
      <Hero />

      {/* Services Teaser */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-6">
              📋 Our Services
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              comprehensive <span className="text-gradient">Mentorship Packages</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              From university selection to visa processing, we provide end-to-end support for your
              study abroad journey. Choose the package that suits you best.
            </p>
            <Link href="/services">
              <button
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl font-semibold text-slate-900 avtive:scale-95 transition-transform duration-150 hover:scale-105"
              >
                View All Packages
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Destinations Teaser */}
      <section className="py-24 px-6 md:px-12 bg-slate-900/30 relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-6">
              🌍 Top Destinations
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Study in <span className="text-gradient">Europe</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Explore opportunities in Italy, Germany, Lithuania, Poland, and more. Top-ranked
              universities and vibrant cultures await you.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Italy", "Germany", "Lithuania", "Poland", "Hungary"].map((country) => (
                <span
                  key={country}
                  className="px-4 py-2 glass-card rounded-lg text-sm text-slate-300"
                >
                  {country}
                </span>
              ))}
            </div>
            <Link href="/destinations">
              <button
                className="px-8 py-4 border border-amber-500 text-amber-500 rounded-xl font-semibold hover:bg-amber-500 hover:text-slate-900 transition-all duration-300 hover:scale-105"
              >
                Explore Destinations
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: "🏛️", title: "Free Tuition", desc: "Available in Italy" },
              { icon: "🇪🇺", title: "Schengen", desc: "Travel 27 countries" },
              { icon: "💼", title: "Work Rights", desc: "Part-time allowed" },
              { icon: "🎓", title: "English", desc: "Taught programs" },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="glass-card rounded-2xl p-6 text-center"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-base font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About CTA */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Why <span className="text-gradient">NextUp Mentor?</span>
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              We are a team of European alumni dedicated to helping Bangladeshi students achieve
              their dreams. With a 95% visa success rate and personalized guidance, your future
              is in safe hands.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/about">
                <button
                  className="px-8 py-4 bg-slate-800 text-white border border-slate-700 rounded-xl font-semibold hover:border-amber-500 transition-all duration-300 hover:scale-105"
                >
                  Learn About Us
                </button>
              </Link>
              <Link href="/contact">
                <button
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl font-semibold text-slate-900 hover:scale-105 transition-transform duration-300"
                >
                  Book Consultation
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partner Universities Marquee */}
      <PartnerMarquee />

      {/* Floating Contact Buttons */}
      <FloatingContact />
    </main>
  );
}

export default function Home() {
  return (
    <CurrencyProvider>
      <HomeContent />
    </CurrencyProvider>
  );
}
