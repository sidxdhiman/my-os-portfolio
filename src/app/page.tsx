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
    <main className="fixed inset-0 bg-[#050505] text-white overflow-hidden font-sans select-none">
      {/* 1. Permanent Matrix Rain */}
      <MatrixRain />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* 2. Fake Login Sequence */
          <LoginSequence onLogin={() => setIsAuthenticated(true)} />
        ) : (
          /* 3. Main Dashboard */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative h-full w-full"
          >
            {/* Center Content */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full px-6">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase">
                WELCOME TO <br />
                <span className="text-[#831B84] drop-shadow-[0_0_45px_rgba(131,27,132,0.45)]">
                  Sidharth's Lab
                </span>
              </h1>
              <p className="mt-8 text-zinc-500 font-medium tracking-widest text-[10px] uppercase max-w-sm mx-auto opacity-70">
                Authentication Successful. Lab is active.
              </p>
              <button
                onClick={() => setDrawerOpen(true)}
                className="mt-14 px-14 py-4 bg-[#831B84] rounded-full font-bold tracking-[0.25em] text-[10px] shadow-[0_0_60px_rgba(131,27,132,0.4)] border border-white/10"
              >
                LAB ACCESS HERE
              </button>
            </div>

            {/* Terminal and Apps logic remains the same */}
            <AnimatePresence>
              {terminalOpen && (
                <div className="absolute inset-x-0 bottom-24 z-[100] flex justify-center pointer-events-none">
                  <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="w-[90%] max-w-5xl h-[45vh] pointer-events-auto bg-black/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <Terminal onClose={() => setTerminalOpen(false)} />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
