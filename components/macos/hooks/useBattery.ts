"use client";

import { useEffect, useState } from "react";

interface BatteryState {
  supported: boolean;
  level: number | null; // 0..1
  charging: boolean | null;
}

export function useBattery(): BatteryState {
  const [state, setState] = useState<BatteryState>({ supported: false, level: null, charging: null });

  useEffect(() => {
    type NavigatorWithBattery = Navigator & { getBattery?: () => Promise<BatteryLike> };
    const nav = typeof navigator !== "undefined" ? (navigator as NavigatorWithBattery) : undefined;
    if (!nav || typeof nav.getBattery !== "function") {
      setState({ supported: false, level: null, charging: null });
      return;
    }

    type BatteryLike = {
      level?: number;
      charging?: boolean;
      addEventListener?: (name: string, cb: () => void) => void;
      removeEventListener?: (name: string, cb: () => void) => void;
    };
    let batteryRef: BatteryLike | undefined;
    let mounted = true;

    nav.getBattery?.().then((battery: BatteryLike) => {
      if (!mounted) return;
      batteryRef = battery;

      const update = () => {
        setState({ supported: true, level: battery.level ?? null, charging: battery.charging ?? null });
      };

      update();
      battery.addEventListener?.("levelchange", update);
      battery.addEventListener?.("chargingchange", update);
    });

    return () => {
      mounted = false;
      if (batteryRef) {
        batteryRef.removeEventListener?.("levelchange", () => {});
        batteryRef.removeEventListener?.("chargingchange", () => {});
      }
    };
  }, []);

  return state;
}


