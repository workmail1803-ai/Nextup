"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";
import ChatBot from "@/components/ChatBot";
import { ScrollProgress } from "@/components/magicui/scroll-progress";

/** Route prefixes that render their own internal chrome (no public nav/footer). */
const INTERNAL_PREFIXES = ["/admin", "/staff_portal"];

/** Public-site chrome. Suppressed on the internal dashboards. */
function usePublicRoute() {
  const pathname = usePathname();
  return !INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function TopChrome() {
  if (!usePublicRoute()) return null;
  return (
    <>
      <ScrollProgress />
      <Navbar />
    </>
  );
}

export function BottomChrome() {
  if (!usePublicRoute()) return null;
  return (
    <>
      <Footer />
      <FloatingContact />
      <ChatBot />
    </>
  );
}
