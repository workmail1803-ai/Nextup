"use client";

import type { ReactNode } from "react";
import { CurrencyProvider } from "@/context/CurrencyContext";

/** App-wide client providers, mounted once in the root layout. */
export default function Providers({ children }: { children: ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}
