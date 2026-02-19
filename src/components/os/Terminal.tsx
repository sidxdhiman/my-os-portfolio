"use client";
import { useState, useRef, useEffect } from "react";

const LAB_APPS = ["whiteboard", "pdf_viewer", "terminal_settings"];

export default function Terminal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    'System Ready. Type "help" to start.',
  ]);
  const [mode, setMode] = useState<"normal" | "lab">("normal");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView(), [history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode === "lab") {
      if (e.key === "ArrowDown")
        setSelectedIndex((p) => (p + 1) % LAB_APPS.length);
      if (e.key === "ArrowUp")
        setSelectedIndex((p) => (p - 1 + LAB_APPS.length) % LAB_APPS.length);
      if (e.key === "Enter") {
        const app = LAB_APPS[selectedIndex];
        window.dispatchEvent(new CustomEvent("launch-app", { detail: app }));
        setHistory((prev) => [
          ...prev,
          `❯ Selected: ${app}`,
          `System: Booting ${app}...`,
        ]);
        setMode("normal");
      }
      if (e.key === "Escape") setMode("normal");
      return;
    }

    if (e.key === "Enter") {
      const cmd = input.toLowerCase().trim();
      if (cmd === "help") {
        setHistory((prev) => [
          ...prev,
          "❯ help",
          "COMMANDS: help, lab, clear, exit",
        ]);
      } else if (cmd === "lab") {
        setMode("lab");
        setHistory((prev) => [
          ...prev,
          "❯ lab",
          "Entering interactive Lab Selector (Use Arrows + Enter)",
        ]);
      } else if (cmd === "clear") {
        setHistory([]);
      } else if (cmd === "exit") {
        onClose();
      } else {
        setHistory((prev) => [
          ...prev,
          `❯ ${input}`,
          `Error: '${cmd}' not found.`,
        ]);
      }
      setInput("");
    }
  };

  return (
    <div className="h-full bg-[#0a0a0a]/95 backdrop-blur-3xl p-10 font-mono text-sm">
      <div className="max-w-5xl mx-auto h-full flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-1">
          {history.map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith("❯") ? "text-[#831B84]" : "text-zinc-500"
              }
            >
              {line}
            </div>
          ))}

          {mode === "lab" && (
            <div className="mt-4 p-4 border border-[#831B84]/30 bg-[#831B84]/5 rounded-xl">
              <p className="text-[10px] text-[#831B84] mb-2 font-bold uppercase tracking-widest">
                Interactive Lab Selector
              </p>
              {LAB_APPS.map((app, i) => (
                <div
                  key={app}
                  className={`px-2 py-1 ${selectedIndex === i ? "bg-[#831B84] text-white font-bold" : "text-zinc-600"}`}
                >
                  {selectedIndex === i ? "➔ " : "  "} {app.toUpperCase()}
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {mode === "normal" && (
          <div className="flex items-center mt-4 border-t border-white/5 pt-6">
            <span className="text-[#831B84] font-bold mr-4 animate-pulse">
              ❯
            </span>
            <input
              autoFocus
              className="bg-transparent outline-none flex-1 text-white placeholder:text-zinc-800"
              placeholder="Enter command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}
      </div>
    </div>
  );
}
