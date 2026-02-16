"use client";
import { useState, useEffect, useRef } from "react";

export default function Terminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    "LAB_OS v1.0.0 Ready...",
    'Type "help" to begin.',
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const cmd = input.toLowerCase().trim();
      let response = "";

      switch (cmd) {
        case "help":
          response = "COMMANDS: about, lab, clear, whoami";
          break;
        case "whoami":
          response = "guest@lab-os:~$ Authorized Developer";
          break;
        case "about":
          response = "Building interactive tools for the modern web.";
          break;
        case "clear":
          setHistory([]);
          setInput("");
          return;
        default:
          response = `Command not found: ${cmd}`;
      }

      setHistory([...history, `> ${input}`, response]);
      setInput("");
    }
  };

  return (
    <div className="font-mono text-sm text-green-500 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-1 mb-2">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith(">") ? "text-blue-400" : ""}>
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex border-t border-zinc-800 pt-2">
        <span className="mr-2 text-blue-500">guest@lab-os:~$</span>
        <input
          autoFocus
          className="bg-transparent outline-none flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
        />
      </div>
    </div>
  );
}
