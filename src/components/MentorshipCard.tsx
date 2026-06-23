"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { BorderBeam } from "@/components/magicui/border-beam";
import AnimatedPrice from "./AnimatedPrice";

interface MentorshipCardProps {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  features: string[];
  price: number;
  popular?: boolean;
  images?: string[];
  index: number;
}

export default function MentorshipCard({
  id,
  title,
  subtitle,
  features,
  price,
  popular = false,
  images = [],
}: MentorshipCardProps) {
  const { convertPrice, symbol } = useCurrency();
  const cover = images.length > 0 ? images[0] : null;

  return (
    <Link
      href={`/packages/${id}`}
      className={`card card-hover group relative flex h-full flex-col overflow-hidden ${
        popular ? "ring-1 ring-accent" : ""
      }`}
    >
      {popular && (
        <>
          <span className="absolute left-4 top-4 z-10 chip !bg-accent !text-white">
            Most popular
          </span>
          <BorderBeam duration={8} size={80} borderWidth={1.5} />
        </>
      )}

      {/* Media */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#efe7d9] to-[#e3d8c4]">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-5xl font-semibold text-accent-ink/30">
              {title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-muted">{subtitle}</p>

        <div className="mt-4 flex items-baseline gap-1.5">
          <AnimatedPrice
            value={convertPrice(price)}
            symbol={symbol}
            className="font-display text-3xl font-semibold text-ink"
          />
          <span className="text-xs text-faint">/ package</span>
        </div>

        <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5">
          {features.slice(0, 3).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-muted">
              <Check className="mt-0.5 h-4 w-4 flex-none text-positive" strokeWidth={2.5} />
              <span className="line-clamp-1">{feature}</span>
            </li>
          ))}
          {features.length > 3 && (
            <li className="pl-[26px] text-xs text-faint">+ {features.length - 3} more included</li>
          )}
        </ul>

        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
          View details
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
