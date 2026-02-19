"use client";
import { useState, useEffect } from "react";
import { useOS, AppID } from "@/hooks/useOS";
import Terminal from "@/components/os/Terminal";
import Whiteboard from "@/components/lab/Whiteboard";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { openApps, launchApp, closeApp } = useOS();
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keyboard shortcut: Ctrl + ~
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="relative h-screen w-screen bg-[#050505] text-white overflow-hidden font-sans select-none">
      {/* Google-level Background depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#831B8410_0%,_transparent_70%)]" />

      {/* 1. Center Text & Branding */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-black tracking-tighter leading-none"
        >
          WELCOME TO <br />
          <span className="text-[#831B84] drop-shadow-[0_0_30px_rgba(131,27,132,0.4)]">
            SIDHARTH'S LAB
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-zinc-500 font-medium tracking-wide max-w-md"
        >
          Make sure to explore it to the core, you might also find some easter
          eggs.
        </motion.p>

        {/* 2. Lab Access Button (Triggers Drawer) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDrawerOpen(true)}
          className="mt-12 px-10 py-4 bg-[#831B84] rounded-full font-bold tracking-widest text-sm hover:shadow-[0_0_40px_rgba(131,27,132,0.5)] transition-all"
        >
          LAB ACCESS HERE
        </motion.button>
      </div>

      {/* 3. App Drawer (Smartphone Folder Style) */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900/80 p-10 rounded-[3rem] border border-white/10 grid grid-cols-3 gap-8"
              onClick={(e) => e.stopPropagation()}
            >
              <AppIcon
                label="Whiteboard"
                icon="🎨"
                onClick={() => {
                  launchApp("whiteboard");
                  setDrawerOpen(false);
                }}
              />
              <AppIcon
                label="Terminal"
                icon="📟"
                onClick={() => {
                  setTerminalOpen(true);
                  setDrawerOpen(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Full Screen Whiteboard */}
      <AnimatePresence>
        {openApps.includes("whiteboard") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black"
          >
            <Whiteboard onClose={() => closeApp("whiteboard")} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Terminal Bottom Hint & Trigger */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-[10px] tracking-[0.3em] text-zinc-600 uppercase flex items-center gap-4">
        CLICK
        <span className="text-zinc-400 font-bold border border-zinc-800 px-2 py-1 rounded">
          CTRL + ~
        </span>
        TO OPEN
        <button
          onClick={() => setTerminalOpen(true)}
          className="text-zinc-500 hover:text-white hover:font-bold transition-all cursor-pointer"
        >
          TERMINAL
        </button>
      </div>

      {/* 6. Slide-up Terminal */}
      <AnimatePresence>
        {terminalOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 h-[50vh] z-[60] border-t border-white/10"
          >
            <Terminal onClose={() => setTerminalOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function AppIcon({ label, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl group-hover:bg-[#831B84]/20 transition-all border border-white/5 group-hover:border-[#831B84]/50">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-zinc-500 group-hover:text-white uppercase tracking-tighter">
        {label}
      </span>
    </button>
  );
}
