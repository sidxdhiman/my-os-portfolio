"use client";
import { useState } from "react";

export type AppID = "terminal" | "pdf" | "whiteboard" | "settings";

export function useOS() {
  const [openApps, setOpenApps] = useState<AppID[]>([]);
  const [activeApp, setActiveApp] = useState<AppID | null>(null);

  const launchApp = (id: AppID) => {
    if (!openApps.includes(id)) {
      setOpenApps([...openApps, id]);
    }
    setActiveApp(id);
  };

  const closeApp = (id: AppID) => {
    setOpenApps(openApps.filter((app) => app !== id));
    if (activeApp === id) setActiveApp(null);
  };

  return { openApps, activeApp, launchApp, closeApp, setActiveApp };
}
