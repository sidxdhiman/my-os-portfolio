"use client";
import { useState, useRef, useEffect } from "react";

const MODULES = ["whiteboard", "pdf_viewer", "system_monitor"];

export default function Terminal({
  onClose,
  onMatrixToggle,
}: {
  onClose: () => void;
  onMatrixToggle: () => void;
}) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    'System Ready. Type "help" or "neofetch" to begin.',
  ]);
  const [mode, setMode] = useState<"cmd" | "lab">("cmd");
  const [index, setIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => bottomRef.current?.scrollIntoView({ behavior: "auto" }),
    [history],
  );

  const getSNeofetch = () => {
    return [
      `      ⣴⣶⣶⣶⣶⣤⡀           sid@sidharth-lab`,
      `     ⣾⡿⠋⠁⠉⠙⢿⣷          ----------------`,
      `     ⣿⡇               OS: SidOS v1.0.0 (Laboratory Edition)`,
      `     ⠙⢿⣦⣄⡀           Host: Custom-React-Kernel-2026`,
      `       ⠉⠻⢿⣷⣄         Uptime: 420 days (Never Sleeps)`,
      `          ⢹⣿         Packages: Python, JS, React, MongoDB`,
      `     ⣄⣀⣠⣴⡿⠃         Shell: /bin/bash (Easter Egg: Type 'matrix')`,
      `     ⠈⠙⠛⠋⠁           Colors: #831B84 (The Purple Protocol)`,
      `                         Memory: 16GB / 128GB (Mostly Chrome Tabs)`,
    ].join("\n");
  };

  const handleInput = (e: React.KeyboardEvent) => {
    if (mode === "lab") {
      if (e.key === "ArrowDown") setIndex((p) => (p + 1) % MODULES.length);
      if (e.key === "ArrowUp")
        setIndex((p) => (p - 1 + MODULES.length) % MODULES.length);
      if (e.key === "Enter") {
        const target = MODULES[index];
        window.dispatchEvent(new CustomEvent("launch-app", { detail: target }));
        setHistory([
          ...history,
          `❯ launch ${target}`,
          `Initializing ${target} module...`,
        ]);
        setMode("cmd");
      }
      if (e.key === "Escape") setMode("cmd");
      return;
    }

    if (e.key === "Enter" && input.trim()) {
      const cmd = input.toLowerCase().trim();
      let response = "";

      if (cmd === "neofetch") response = getSNeofetch();
      else if (cmd === "matrix") {
        onMatrixToggle();
        response = "Bypassing visual sub-routines... Matrix engaged.";
      } else if (cmd === "help")
        response = "CMDS: lab, neofetch, matrix, clear, whoami, exit";
      else if (cmd === "clear") {
        setHistory([]);
        setInput("");
        return;
      } else if (cmd === "exit") {
        onClose();
        return;
      } else if (cmd === "whoami")
        response = "User: Sidharth Dhiman | Access: Architect";
      else response = `sh: command not found: ${cmd}`;

      setHistory([...history, `❯ ${input}`, response]);
      setInput("");
    }
  };

  return (
    <div className="h-full p-10 font-mono text-[13px] bg-transparent overflow-hidden flex flex-col relative group">
      {/* DRAG HANDLE: Top Right Corner */}
      <div className="absolute top-8 right-10 flex items-center gap-4">
        <span className="text-[9px] text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest font-bold">
          DRAG_RESIZE_READY
        </span>
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full cursor-grab active:cursor-grabbing hover:bg-[#831B84] transition-colors" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-4 terminal-scrollbar whitespace-pre">
        {history.map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith("❯")
                ? "text-[#831B84] font-bold"
                : "text-zinc-400 opacity-90"
            }
          >
            {line}
          </div>
        ))}
        {mode === "lab" && (
          <div className="mt-6 p-6 border border-[#831B84]/20 bg-[#831B84]/5 rounded-3xl max-w-sm">
            <p className="text-[10px] text-[#831B84] mb-4 font-bold tracking-[0.3em] uppercase">
              Module Selection
            </p>
            {MODULES.map((m, i) => (
              <div
                key={m}
                className={`px-4 py-2 rounded-xl transition-all ${index === i ? "bg-[#831B84] text-white shadow-lg translate-x-2" : "text-zinc-700"}`}
              >
                {index === i ? "► " : "  "} {m.toUpperCase()}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {mode === "cmd" && (
        <div className="flex items-center mt-6 border-t border-white/5 pt-8">
          <span className="text-[#831B84] font-black mr-4 text-xl">❯</span>
          <input
            autoFocus
            className="bg-transparent outline-none flex-1 text-white placeholder:text-zinc-900"
            placeholder="System call..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInput}
          />
        </div>
      )}
    </div>
  );
}
