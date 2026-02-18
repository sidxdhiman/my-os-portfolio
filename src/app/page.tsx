"use client";
import { useState, useEffect } from 'react';
import { useOS, AppID } from '@/hooks/useOS';
import Window from '@/components/os/Window';
import Terminal from '@/components/os/Terminal';
import Whiteboard from '@/components/lab/Whiteboard';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { openApps, activeApp, launchApp, closeApp, setActiveApp } = useOS();
  const [hackerMode, setHackerMode] = useState(false);

  useEffect(() => {
    const handleLaunch = (e: any) => launchApp(e.detail as AppID);
    window.addEventListener('launch-app', handleLaunch);
    return () => window.removeEventListener('launch-app', handleLaunch);
  }, [launchApp]);

  return (
    <main className={`relative h-screen w-screen overflow-hidden transition-colors duration-1000 ${hackerMode ? 'bg-black' : 'bg-[#050505]'}`}>

      {/* Google-Level Aesthetics: Subtle Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#831B84]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Interactive Icons */}
      <div className="relative z-10 p-12 flex flex-col gap-10 w-32">
        <AppIcon label="Terminal" icon="📟" onClick={() => launchApp('terminal')} color="border-zinc-800" />
        <AppIcon label="Lab Board" icon="🎨" onClick={() => launchApp('whiteboard')} color="border-[#831B84]/40" />
      </div>

      {/* Render Active Windows */}
      <AnimatePresence>
        {openApps.map((appId) => (
          <Window
            key={appId}
            title={appId === 'terminal' ? 'System Terminal' : 'Experimental Lab'}
            isActive={activeApp === appId}
            onFocus={() => setActiveApp(appId)}
            onClose={() => closeApp(appId)}
          >
            {appId === 'terminal' && <Terminal />}
            {appId === 'whiteboard' && <Whiteboard />}
          </Window>
        ))}
      </AnimatePresence>

      {/* The Hacker Mode Toggle */}
      <button
        onClick={() => setHackerMode(!hackerMode)}
        className={`absolute bottom-10 right-10 z-50 px-8 py-3 rounded-full font-mono text-[11px] tracking-widest transition-all duration-500 border ${
          hackerMode
          ? 'bg-green-500/10 border-green-500 text-green-500 shadow-[0_0_25px_rgba(34,197,94,0.4)]'
          : 'bg-[#831B84]/10 border-[#831B84] text-[#831B84] hover:bg-[#831B84]/20 shadow-xl'
        }`}
      >
        {hackerMode ? 'NEURAL_LINK_ESTABLISHED' : 'ENTER_HACKER_MODE'}
      </button>

      {/* Playful Detail: Animated Scanline */}
      {hackerMode && (
        <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-b from-transparent via-green-500/5 to-transparent h-[30%] w-full animate-scanline" />
      )}
    </main>
  );
}

function AppIcon({ label, icon, onClick, color }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onDoubleClick={onClick}
      className="flex flex-col items-center gap-3 group cursor-pointer"
    >
      <div className={`w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border ${color} flex items-center justify-center text-3xl group-hover:shadow-[0_0_30px_rgba(131,27,132,0.2)] transition-all`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 group-hover:text-white uppercase transition-colors">{label}</span>
    </motion.button>
  );
}
