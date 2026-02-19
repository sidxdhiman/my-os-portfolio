"use client";
import { useState, useRef, useEffect } from "react";

export default function Terminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    'Terminal Linked. Type "help" for commands.',
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView(), [history]);

  const handleExec = () => {
    const [cmd, arg] = input.toLowerCase().trim().split(" ");
    let res = "";

    if (cmd === "help")
      res = "AVAILABLE: open [whiteboard], close, clear, status";
    else if (cmd === "open") {
      if (arg === "whiteboard") {
        window.dispatchEvent(
          new CustomEvent("os-command", {
            detail: { action: "navigate", target: "whiteboard" },
          }),
        );
        res = "Navigating to Lab Board...";
      } else res = `Unknown module: ${arg}`;
    } else if (cmd === "close") {
      window.dispatchEvent(
        new CustomEvent("os-command", { detail: { action: "close_terminal" } }),
      );
      return;
    } else if (cmd === "clear") {
      setHistory([]);
      setInput("");
      return;
    } else res = `Command not recognized: ${cmd}`;

    setHistory([...history, `❯ ${input}`, res]);
    setInput("");
  };

  return (
    <div className="h-full bg-black/80 backdrop-blur-2xl p-8 font-mono text-sm text-zinc-400 overflow-y-auto">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <div className="flex-1 space-y-1">
          {history.map((line, i) => (
            <div
              key={i}
              className={line.startsWith("❯") ? "text-[#831B84]" : ""}
            >
              {line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex items-center mt-4 border-t border-white/5 pt-4">
          <span className="text-[#831B84] mr-3 font-bold">❯</span>
          <input
            autoFocus
            className="bg-transparent outline-none flex-1 text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExec()}
          />
        </div>
      </div>
    </div>
  );
}
