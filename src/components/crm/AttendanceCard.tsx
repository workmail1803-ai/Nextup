"use client";

// =============================================================================
// AttendanceCard — the WFH clock, self-contained.
//
// Moved out of /staff_portal/dashboard during the surface merge. The old page
// threaded active-session state, loading flags and both handlers down from a
// 454-line dashboard; here the card owns all of that, so dropping it into any
// CRM page costs one line.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/internal";
import { AttendanceControls } from "./AttendanceControls";
import { AttendanceService } from "@/lib/services/attendance.service";
import { useStaffAuth } from "@/lib/auth/StaffAuthContext";
import { sessionMinutes, localDateKey } from "@/lib/attendance/compute";
import type { AttendanceSession } from "@/lib/types/attendance";

export function AttendanceCard() {
  const { staff } = useStaffAuth();
  const toast = useToast();
  const staffId = staff?.id ?? null;

  const [active, setActive] = useState<AttendanceSession | null>(null);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  const load = useCallback(async (id: string) => {
    const [current, history] = await Promise.all([
      AttendanceService.getActiveSession(id),
      AttendanceService.historyForStaff(id, 60),
    ]);
    setActive(current);
    const today = localDateKey();
    setTodayMinutes(
      history
        .filter((s) => s.work_date === today)
        .reduce((sum, s) => sum + sessionMinutes(s), 0),
    );
  }, []);

  useEffect(() => {
    if (!staffId) return;
    // Deferred so the first paint isn't blocked on the round-trip.
    const t = setTimeout(() => {
      load(staffId).catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [staffId, load]);

  async function handleStart() {
    if (!staffId) return;
    setStarting(true);
    try {
      const s = await AttendanceService.startWork(staffId);
      setActive(s);
    } catch (err) {
      toast({
        title: "Couldn't start work",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    } finally {
      setStarting(false);
    }
  }

  async function handleEnd() {
    if (!active || !staffId) return;
    setEnding(true);
    try {
      await AttendanceService.endWork(active);
      await load(staffId);
    } catch (err) {
      toast({
        title: "Couldn't end work",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    } finally {
      setEnding(false);
    }
  }

  if (!staffId) return null;

  return (
    <AttendanceControls
      active={active}
      todayMinutes={todayMinutes}
      starting={starting}
      ending={ending}
      onStart={handleStart}
      onEnd={handleEnd}
    />
  );
}
