"use client";
import { useState, useEffect } from "react";
import { useOS, AppID } from "@/hooks/useOS";
import Terminal from "@/components/os/Terminal";
import Whiteboard from "@/components/lab/Whiteboard";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { openApps, launchApp, closeApp } = useOS();
  const [terminalOpen, setTerminalOpen] = useState(false);

  // Global event listener for Terminal commands to navigate
  useEffect(() => {
    const handleCommand = (e: any) => {
      const { action, target } = e.detail;
      if (action === "navigate") launchApp(target as AppID);
      if (action === "close_terminal") setTerminalOpen(false);
    };
    window.addEventListener("os-command", handleCommand);
    return () => window.removeEventListener("os-command", handleCommand);
  }, [launchApp]);

  return (
    <main className="relative h-screen w-screen bg-[#050505] text-zinc-300 overflow-hidden font-sans">
      {/* Google-level Background depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_#831B8415_0%,_transparent_50%)]" />

      {/* Desktop Navigation */}
      <nav className="relative z-10 p-12 flex flex-col gap-12 w-40">
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-600 uppercase">
            System
          </p>
          <NavIcon
            label="Terminal"
            icon="📟"
            onClick={() => setTerminalOpen(!terminalOpen)}
            active={terminalOpen}
          />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-600 uppercase">
            Labs
          </p>
          <NavIcon
            label="Whiteboard"
            icon="🎨"
            onClick={() => launchApp("whiteboard")}
          />
        </div>
      </nav>

      {/* Main Viewport for Apps (Full Screen Lab Board) */}
      <AnimatePresence>
        {openApps.includes("whiteboard") && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black"
          >
            <Whiteboard onClose={() => closeApp("whiteboard")} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Slide-Up Terminal (Quake Style) */}
      <AnimatePresence>
        {terminalOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 h-[45vh] z-50 glass-window border-t border-white/10"
          >
            <Terminal />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function NavIcon({ label, icon, onClick, active }: any) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-4 transition-all ${active ? "translate-x-2" : ""}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all border ${
          active
            ? "bg-[#831B84] border-[#831B84] shadow-[0_0_20px_#831B8440]"
            : "bg-white/5 border-white/10 group-hover:border-white/20"
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-xs font-medium tracking-wide ${active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`}
      >
        {label}
      </span>
    </button>
  );
}
