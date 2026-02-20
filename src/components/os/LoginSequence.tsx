"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cpu, Fingerprint, Unlock } from "lucide-react";

export default function LoginSequence({
  onLogin,
}: {
  onLogin: (name: string) => void;
}) {
  const [step, setStep] = useState<"id_input" | "auth_check" | "entry">(
    "id_input",
  );
  const [name, setName] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step === "auth_check") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep("entry"), 600);
            return 100;
          }
          return prev + 2;
        });
      }, 40);
      return () => clearInterval(interval);
    }
    if (step === "entry") {
      // Passes the user's name back to the main dashboard
      const timer = setTimeout(() => onLogin(name || "SIDHARTH"), 2800);
      return () => clearTimeout(timer);
    }
  }, [step, name, onLogin]);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#050505] overflow-hidden">
      <AnimatePresence mode="wait">
        {/* PHASE 1: TECHY DATA ENTRY */}
        {step === "id_input" && (
          <motion.div
            key="id_input"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-[450px] p-[1px] bg-gradient-to-b from-[#831B84]/40 to-transparent rounded-sm relative"
          >
            <div className="p-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 m-[1px] relative">
              <div className="absolute top-0 right-0 p-3 text-[7px] font-mono text-zinc-700 tracking-[0.3em]">
                SEC_LINK_V16
              </div>
              <h2 className="text-[#831B84] text-[10px] font-black tracking-[0.6em] uppercase mb-12 flex items-center gap-4">
                <Cpu size={14} className="animate-pulse" /> Identity_Buffer
              </h2>

              <div className="space-y-10">
                <div className="relative group">
                  <div className="text-[8px] text-zinc-600 mb-3 font-bold tracking-[0.2em] uppercase">
                    User_Registry_Name
                  </div>
                  <input
                    autoFocus
                    className="w-full bg-transparent border-b border-zinc-800 pb-2 font-mono text-sm text-white focus:border-[#831B84] outline-none transition-all placeholder:text-zinc-900"
                    placeholder="ENTER_UID..."
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="bg-black/40 p-5 border-l-2 border-[#831B84] space-y-2">
                  <p className="text-[8px] text-zinc-600 leading-relaxed font-mono">
                    {">"} Initializing LabOS Kernels...
                    <br />
                    {">"} Access Protocol: #831B84
                    <br />
                    {">"} Status: Awaiting_Input...
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep("auth_check")}
                className="w-full mt-12 py-4 border border-[#831B84]/40 hover:bg-[#831B84]/10 text-[#831B84] text-[9px] font-black tracking-[0.5em] transition-all uppercase"
              >
                Execute_Handshake
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: AUTHENTICATION STORYLINE */}
        {step === "auth_check" && (
          <motion.div
            key="auth_check"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center w-full max-w-sm px-10"
          >
            <div className="w-full h-[2px] bg-zinc-900 rounded-full mb-6 overflow-hidden">
              <motion.div
                className="h-full bg-[#831B84] shadow-[0_0_20px_#831B84]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 w-full text-[8px] font-mono uppercase tracking-widest">
              <div
                className={progress > 20 ? "text-[#831B84]" : "text-zinc-800"}
              >
                [ OK ] SCR_FETCH_REC
              </div>
              <div
                className={progress > 50 ? "text-[#831B84]" : "text-zinc-800"}
              >
                [ OK ] DECRYPT_RSA_2048
              </div>
              <div
                className={progress > 80 ? "text-[#831B84]" : "text-zinc-800"}
              >
                [ OK ] BIOMETRIC_MATCH_FOUND
              </div>
            </div>
            <Fingerprint
              size={48}
              className="mt-16 text-[#831B84] animate-pulse opacity-50"
            />
          </motion.div>
        )}

        {/* PHASE 3: THE "HEAVY DOOR" LAB OPENING */}
        {step === "entry" && (
          <motion.div
            key="entry"
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* Left Industrial Door */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "-100%" }}
              transition={{
                duration: 1.2,
                delay: 0.8,
                ease: [0.82, 0, 0.18, 1],
              }}
              className="absolute left-0 top-0 w-1/2 h-full bg-[#0a0a0a] z-50 border-r border-white/5 flex items-center justify-end"
            >
              <div className="w-16 h-full bg-zinc-900/50 flex flex-col justify-center gap-10 items-center opacity-40">
                <div className="w-1 h-32 bg-white/5" />
                <div className="w-1 h-32 bg-white/5" />
              </div>
            </motion.div>

            {/* Right Industrial Door */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.2,
                delay: 0.8,
                ease: [0.82, 0, 0.18, 1],
              }}
              className="absolute right-0 top-0 w-1/2 h-full bg-[#0a0a0a] z-50 border-l border-white/5 flex items-center justify-start"
            >
              <div className="w-16 h-full bg-zinc-900/50 flex flex-col justify-center gap-10 items-center opacity-40">
                <div className="w-1 h-32 bg-white/5" />
                <div className="w-1 h-32 bg-white/5" />
              </div>
            </motion.div>

            {/* Central Success Reveal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
              className="text-center z-10"
            >
              <Unlock
                size={32}
                className="text-[#831B84] mx-auto mb-8 opacity-80"
              />
              <h2 className="text-3xl font-black tracking-[0.4em] uppercase text-white">
                ACCESS_GRANTED
              </h2>
              <p className="text-zinc-500 text-[9px] mt-4 tracking-[0.6em] font-mono uppercase">
                Welcome back, {name || "Developer"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
