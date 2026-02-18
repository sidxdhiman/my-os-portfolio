"use client";
import { useState, useRef, useEffect } from 'react';

export default function Terminal() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'LabOS(tm) Kernel v4.2.0-release',
    'Authenticated as root_developer_sid',
    'Type "help" for a list of system commands.',
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [history]);

  const processCommand = () => {
    const [cmd, arg] = input.toLowerCase().trim().split(' ');
    let output = '';

    switch (cmd) {
      case 'help': output = 'AVAILABLE: ls, open [app], clear, whoami, exit'; break;
      case 'whoami': output = 'User: sid | Access: Developer | Location: /root'; break;
      case 'ls': output = 'apps/  whiteboard.lab  terminal.sys  pdf_editor.lab'; break;
      case 'open':
        if (arg === 'whiteboard') {
          window.dispatchEvent(new CustomEvent('launch-app', { detail: 'whiteboard' }));
          output = 'Executing: lab_board.init()... DONE';
        } else {
          output = `Error: Cannot find module "${arg}"`;
        }
        break;
      case 'clear': setHistory([]); setInput(''); return;
      default: output = `sh: command not found: ${cmd}`;
    }

    setHistory([...history, `❯ ${input}`, output]);
    setInput('');
  };

  return (
    <div className="p-8 font-mono text-[13px] text-zinc-300 h-full flex flex-col bg-black/40 terminal-scrollbar overflow-y-auto">
      <div className="flex-1 space-y-1.5">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith('❯') ? 'text-[#831B84]' : 'text-zinc-400 opacity-90'}>
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex mt-6 items-center group">
        <span className="text-[#831B84] mr-3 font-bold">❯</span>
        <input
          autoFocus
          className="bg-transparent outline-none flex-1 text-white border-none focus:ring-0 p-0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && processCommand()}
        />
      </div>
    </div>
  );
}
