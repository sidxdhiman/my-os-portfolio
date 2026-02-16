"use client";
import { useState } from "react";
import { useOS } from "@/hooks/useOS";
import Window from "@/components/os/Window";
import Terminal from "@/components/os/Terminal";
import Whiteboard from "@/components/lab/Whiteboard";

export default function Home() {
  const { openApps, activeApp, launchApp, closeApp, setActiveApp } = useOS();
  const [hackerMode, setHackerMode] = useState(false);

  return (
    <main className="relative h-screen w-screen bg-black text-white overflow-hidden font-mono">
      {/* SECURITY CHECK - If you see this, the file is loaded correctly */}
      <div className="absolute top-4 left-4 text-[10px] text-zinc-800">
        STATUS: OS_INITIALIZED
      </div>

      {/* 1. Desktop Icons */}
      <div className="p-10 flex flex-col gap-8 w-32">
        <button
          onDoubleClick={() => launchApp("terminal")}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-2xl group-hover:border-blue-500 transition-all">
            📟
          </div>
          <span className="text-[10px] mt-2 text-zinc-500 group-hover:text-white">
            TERMINAL
          </span>
        </button>

        <button
          onDoubleClick={() => launchApp("whiteboard")}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-2xl group-hover:border-purple-500 transition-all">
            🎨
          </div>
          <span className="text-[10px] mt-2 text-zinc-500 group-hover:text-white">
            LAB_BOARD
          </span>
        </button>
      </div>

      {/* 2. Window Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {openApps.map((appId) => (
          <div key={appId} className="pointer-events-auto">
            <Window
              title={appId.toUpperCase()}
              isActive={activeApp === appId}
              onFocus={() => setActiveApp(appId)}
              onClose={() => closeApp(appId)}
            >
              {appId === "terminal" && <Terminal />}
              {appId === "whiteboard" && <Whiteboard />}
            </Window>
          </div>
        ))}
      </div>

      {/* 3. The Hacker Mode Button */}
      <button
        onClick={() => setHackerMode(!hackerMode)}
        className={`absolute bottom-10 right-10 px-6 py-2 rounded-full border transition-all active:scale-95 z-50 ${
          hackerMode
            ? "border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
            : "border-zinc-700 text-zinc-500"
        }`}
      >
        {hackerMode ? "BYPASS_ENABLED" : "ENTER_HACKER_MODE"}
      </button>

      {/* Playful Hidden Detail: Scanner Line */}
      {hackerMode && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent h-20 w-full animate-scan" />
      )}
    </main>
  );
}
