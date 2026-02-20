"use client";
import { useState, useEffect } from "react";
import { useOS, AppID } from "@/hooks/useOS";
import Terminal from "@/components/os/Terminal";
import Whiteboard from "@/components/lab/Whiteboard";
import MatrixRain from "@/components/os/MatrixRain";
import LoginSequence from "@/components/os/LoginSequence";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { openApps, launchApp, closeApp } = useOS();
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("DEVELOPER"); // Captured from Login

  // Global Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Terminal: Ctrl + ~
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      }
      // Close Terminal: Escape
      if (e.key === "Escape" && terminalOpen) {
        setTerminalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [terminalOpen]);

  // Listen for app launches from Terminal
  useEffect(() => {
    const handleLaunch = (e: any) => launchApp(e.detail as AppID);
    window.addEventListener("launch-app", handleLaunch);
    return () => window.removeEventListener("launch-app", handleLaunch);
  }, [launchApp]);

  return (
    <main className="fixed inset-0 bg-[#050505] text-white overflow-hidden font-sans select-none w-screen h-screen">
      {/* 1. Permanent Matrix Rain (Layer 0) */}
      <MatrixRain />

      {/* 2. Background Glow (Layer 1) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#831B8412_0%,_transparent_70%)] pointer-events-none z-0" />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* PHASE 1: Biometric Login */
          <LoginSequence
            onLogin={(name) => {
              setUserName(name || "SIDHARTH");
              setIsAuthenticated(true);
            }}
          />
        ) : (
          /* PHASE 2: Main Dashboard */
          <motion.div
            key="dashboard-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative h-full w-full"
          >
            {/* LOCKED CENTER CONTENT: Mathematically centered so it never jumps */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full px-6 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="pointer-events-auto"
              >
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase">
                  WELCOME TO <br />
                  <span className="text-[#831B84] drop-shadow-[0_0_45px_rgba(131,27,132,0.45)]">
                    Sidharth's Lab
                  </span>
                </h1>
                <p className="mt-8 text-zinc-500 font-medium tracking-widest text-[10px] uppercase max-w-sm mx-auto opacity-70">
                  Authentication Successful. Lab is active for {userName}.
                </p>

                <button
                  onClick={() => setDrawerOpen(true)}
                  className="mt-14 px-14 py-4 bg-[#831B84] rounded-full font-bold tracking-[0.25em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_60px_rgba(131,27,132,0.4)] border border-white/10"
                >
                  LAB ACCESS HERE
                </button>
              </motion.div>
            </div>

            {/* FLOATING TERMINAL ISLAND (Layer 100) */}
            <AnimatePresence>
              {terminalOpen && (
                <div className="absolute inset-x-0 bottom-24 z-[100] flex justify-center pointer-events-none">
                  <motion.div
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="w-[90%] max-w-5xl h-[45vh] pointer-events-auto bg-black/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden"
                  >
                    <Terminal
                      user={userName}
                      onClose={() => setTerminalOpen(false)}
                    />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* BOTTOM HINT BAR */}
            <div className="absolute bottom-10 left-0 right-0 z-[50] flex justify-center pointer-events-none">
              <div className="flex items-center gap-10 px-10 py-3.5 bg-white/5 backdrop-blur-md rounded-full border border-white/5 pointer-events-auto shadow-2xl">
                <span className="text-[9px] font-bold tracking-[0.4em] text-zinc-600 uppercase">
                  CTRL + ~
                </span>
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                <button
                  onClick={() => setTerminalOpen(true)}
                  className="text-[9px] font-bold tracking-[0.4em] text-zinc-400 hover:text-[#831B84] transition-colors uppercase"
                >
                  Terminal Link
                </button>
              </div>
            </div>

            {/* APP DRAWER OVERLAY (Layer 200) */}
            <AnimatePresence>
              {drawerOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-2xl"
                  onClick={() => setDrawerOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-zinc-900/30 p-14 rounded-[4.5rem] border border-white/10 grid grid-cols-2 gap-12 shadow-3xl"
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

            {/* FULLSCREEN LAB APPS (Layer 300) */}
            <AnimatePresence>
              {openApps.includes("whiteboard") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[300] bg-black"
                >
                  <Whiteboard onClose={() => closeApp("whiteboard")} />
                </motion.div>
              )}
            </AnimatePresence>
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
      className="flex flex-col items-center gap-5 group"
    >
      <div className="w-28 h-28 bg-white/5 rounded-[3rem] flex items-center justify-center text-5xl group-hover:bg-[#831B84]/25 group-hover:border-[#831B84]/60 border border-white/5 transition-all shadow-3xl">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-zinc-500 group-hover:text-white tracking-[0.3em] uppercase">
        {label}
      </span>
    </button>
  );
}
