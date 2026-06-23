"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";
import ChatBot from "@/components/ChatBot";
import { ScrollProgress } from "@/components/magicui/scroll-progress";

/** Public-site chrome. Suppressed on the /admin dashboard. */
function usePublicRoute() {
  const pathname = usePathname();
  return !pathname.startsWith("/admin");
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
