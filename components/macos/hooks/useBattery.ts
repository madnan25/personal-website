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
    const nav: any = typeof navigator !== "undefined" ? navigator : undefined;
    if (!nav || typeof nav.getBattery !== "function") {
      setState({ supported: false, level: null, charging: null });
      return;
    }

    let batteryRef: any;
    let mounted = true;

    nav.getBattery().then((battery: any) => {
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


