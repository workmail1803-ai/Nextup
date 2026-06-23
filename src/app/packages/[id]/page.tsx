"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, ShieldCheck } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { db, Package } from "@/lib/supabase";
import AnimatedPrice from "@/components/AnimatedPrice";
import PaymentModal from "@/components/PaymentModal";
import Button from "@/components/ui/Button";

export default function PackageDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const { convertPrice, symbol, formatPrice } = useCurrency();

  useEffect(() => {
    if (!id) return;
    db.packages
      .getById(id)
      .then(setPkg)
      .catch((e) => console.error("Error fetching package:", e))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <h1 className="h2 text-ink">Package not found</h1>
        <p className="mt-3 text-muted">This package may have been moved or unpublished.</p>
        <Button href="/services" className="mt-8" withArrow>
          Back to packages
        </Button>
      </div>
    );
  }

  return (
    <>
      <section className="bg-paper pt-28 pb-20 md:pt-36">
        <div className="container-edge">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-faint" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-ink">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/services" className="transition-colors hover:text-ink">Packages</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink">{pkg.title}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Media */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#efe7d9] to-[#e3d8c4]"
              >
                {pkg.images && pkg.images.length > 0 ? (
                  <Image
                    src={pkg.images[activeImage]}
                    alt={pkg.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-display text-7xl font-semibold text-accent-ink/25">
                      {pkg.title.charAt(0)}
                    </span>
                  </div>
                )}
                {pkg.is_popular && (
                  <span className="absolute left-4 top-4 chip !bg-accent !text-white">Most popular</span>
                )}
              </motion.div>

              {pkg.images && pkg.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {pkg.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={`relative h-20 w-20 flex-none overflow-hidden rounded-lg border-2 transition-all ${
                        activeImage === idx ? "border-accent" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image src={img} alt={`View ${idx + 1}`} fill sizes="80px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="h1 text-ink">{pkg.title}</h1>
              {pkg.subtitle && <p className="lede mt-4">{pkg.subtitle}</p>}

              <div className="mt-7 rounded-2xl border border-line bg-paper-2 p-6">
                <AnimatedPrice
                  value={convertPrice(pkg.price)}
                  symbol={symbol}
                  className="font-display text-4xl font-semibold text-ink"
                />
                <p className="mt-2 text-sm text-faint">
                  Ask our team about installment options and available discounts.
                </p>
              </div>

              <h2 className="mt-8 font-display text-lg font-semibold text-ink">What&apos;s included</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#eaf3ed] text-positive">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-muted">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full rounded-full bg-ink py-4 text-lg font-semibold text-on-ink transition-[transform,background-color] hover:bg-[#2a241c] active:scale-[0.99]"
                >
                  Book now — {formatPrice(pkg.price)}
                </button>
                <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-faint">
                  <ShieldCheck className="h-4 w-4 text-positive" />
                  You pay the university and visa fees directly. No hidden charges.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        packageId={pkg.id}
        packageTitle={pkg.title}
        packagePrice={formatPrice(pkg.price)}
        packageAmount={pkg.price}
      />
    </>
  );
}
