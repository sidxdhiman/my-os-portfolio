'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LabUser, AppId } from '@/hooks/useOS';

interface TerminalProps {
    isOpen: boolean;
    user: LabUser | null;
    onClose: () => void;
    pushApp: (id: AppId) => void;
}

type TermLine = {
    id: number;
    type: 'input' | 'output' | 'error' | 'system';
    text: string;
};

const MENU_MODULES = [
    { label: 'Whiteboard', id: 'whiteboard' as AppId, desc: 'Collaborative digital canvas' },
    { label: 'Neural Eraser', id: 'neural-eraser' as AppId, desc: 'AI watermark removal' },
    { label: 'PDF Editor', id: 'pdf-editor' as AppId, desc: 'Full-featured PDF editing suite' },
];

let idCounter = 0;
function mkId() { return ++idCounter; }
function makeLines(texts: string[], type: TermLine['type'] = 'output'): TermLine[] {
    return texts.map(t => ({ id: mkId(), type, text: t }));
}

function getNeofetch(user: LabUser | null): TermLine[] {
    const name = user?.name ?? 'UNKNOWN';
    const level = user?.accessLevel ?? 'GUEST';
    const date = new Date().toLocaleString();
    return [
        { id: mkId(), type: 'output', text: '  ██████╗ ███████╗██╗   ██╗' },
        { id: mkId(), type: 'output', text: '  ██╔══██╗██╔════╝██║   ██║  \x1b[35mDev Lab OS\x1b[0m' },
        { id: mkId(), type: 'output', text: '  ██║  ██║█████╗  ██║   ██║  \x1b[35mUser:\x1b[0m    ' + name },
        { id: mkId(), type: 'output', text: '  ██║  ██║██╔══╝  ╚██╗ ██╔╝  \x1b[35mLevel:\x1b[0m   ' + level },
        { id: mkId(), type: 'output', text: '  ██████╔╝███████╗ ╚████╔╝   \x1b[35mKernel:\x1b[0m  lab-os v3.7' },
        { id: mkId(), type: 'output', text: '  ╚═════╝ ╚══════╝  ╚═══╝    \x1b[35mDate:\x1b[0m    ' + date },
        { id: mkId(), type: 'output', text: '' },
    ];
}

export function Terminal({ isOpen, user, onClose, pushApp }: TerminalProps) {
    const [lines, setLines] = useState<TermLine[]>([
        ...makeLines([
            'Dev Lab Shell v3.7.1',
            `Signed in as ${user?.name ?? 'Guest'} · ${user?.accessLevel ?? 'No access'}`,
            'Type "help" for available commands.',
            '',
        ], 'system'),
    ]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [histIdx, setHistIdx] = useState(-1);
    const [showMenu, setShowMenu] = useState(false);
    const [menuIdx, setMenuIdx] = useState(0);
    const [height, setHeight] = useState(380);

    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const dragStartY = useRef(0);
    const dragStartH = useRef(0);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
    }, [isOpen]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    const addLines = useCallback((newLines: TermLine[]) => {
        setLines(prev => [...prev, ...newLines]);
    }, []);

    function processCommand(cmd: string) {
        const trimmed = cmd.trim().toLowerCase();
        const raw = cmd.trim();
        setHistory(h => [raw, ...h]);
        setHistIdx(-1);
        addLines([{ id: mkId(), type: 'input', text: `$ ${raw}` }]);
        if (!trimmed) return;

        if (trimmed === 'help') {
            addLines(makeLines([
                '',
                '  Commands:',
                '  help          Show this help',
                '  lab           Browse lab modules',
                '  neofetch      System information',
                '  clear         Clear terminal',
                '  whoami        Current user',
                '  ls            List modules',
                '  about         About Dev Lab',
                '  open [name]   Open a module',
                '',
            ]));
        } else if (trimmed === 'lab') {
            setShowMenu(true); setMenuIdx(0);
            addLines(makeLines(['', '  Lab Modules  (↑↓ navigate · Enter launch · Esc cancel)', '']));
        } else if (trimmed === 'neofetch') {
            addLines(getNeofetch(user));
        } else if (trimmed === 'clear') {
            setLines([]);
        } else if (trimmed === 'whoami') {
            addLines(makeLines(['', `  ${user?.name ?? 'guest'} · ${user?.accessLevel ?? 'none'}`, '']));
        } else if (trimmed === 'ls') {
            addLines(makeLines(['', '  whiteboard/    Collaborative digital canvas', '  neural-eraser/ AI watermark removal engine', '  pdf-editor/    Full PDF editing suite', '']));
        } else if (trimmed === 'about') {
            addLines(makeLines(['', '  Dev Lab — interactive developer portfolio.', '  Built with Next.js + Framer Motion + TypeScript.', '  © 2026 Sidharth', '']));
        } else if (trimmed.startsWith('open ')) {
            const n = trimmed.slice(5).trim();
            const found = MENU_MODULES.find(m => m.id === n || m.label.toLowerCase() === n || m.id.includes(n));
            if (found) { pushApp(found.id); addLines(makeLines(['', `  Launching ${found.label}…`, ''])); }
            else addLines(makeLines([`  Not found: ${n}. Try 'ls'.`], 'error'));
        } else {
            addLines(makeLines([`  command not found: ${raw}. Try 'help'.`], 'error'));
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (showMenu) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setMenuIdx(i => Math.min(i + 1, MENU_MODULES.length - 1)); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setMenuIdx(i => Math.max(i - 1, 0)); return; }
            if (e.key === 'Enter') { e.preventDefault(); const m = MENU_MODULES[menuIdx]; pushApp(m.id); addLines(makeLines([`  ✓ Launching ${m.label}…`, ''])); setShowMenu(false); setInput(''); return; }
            if (e.key === 'Escape') { setShowMenu(false); addLines(makeLines(['  [closed]', ''])); return; }
        }
        if (e.key === 'Enter') { processCommand(input); setInput(''); setShowMenu(false); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); const ni = Math.min(histIdx + 1, history.length - 1); setHistIdx(ni); setInput(history[ni] ?? ''); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); const ni = Math.max(histIdx - 1, -1); setHistIdx(ni); setInput(ni === -1 ? '' : history[ni]); }
    }

    function renderText(text: string) {
        const parts = text.split(/(\x1b\[\d+m)/);
        let col = 'inherit';
        return parts.map((p, i) => {
            if (p === '\x1b[35m') { col = '#a78bfa'; return null; }
            if (p === '\x1b[0m') { col = 'inherit'; return null; }
            return <span key={i} style={{ color: col }}>{p}</span>;
        });
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    id="terminal-island"
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'min(860px, 92vw)',
                        height,
                        zIndex: 100,
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            background: '#1e1e2e',
                            border: '1px solid #3d3d5c',
                            borderRadius: 14,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)',
                            overflow: 'hidden',
                            fontFamily: 'var(--mono)',
                        }}
                        onClick={() => inputRef.current?.focus()}
                    >
                        {/* Title bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0 14px',
                            height: 38,
                            background: '#16162a',
                            borderBottom: '1px solid #2e2e48',
                            flexShrink: 0,
                            userSelect: 'none',
                        }}>
                            {/* Traffic lights */}
                            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                                <button style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', border: 'none', cursor: 'pointer', padding: 0 }} onClick={onClose} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28ca41' }} />
                            </div>

                            {/* Tab label */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, color: '#6c6c8a' }}>zsh</span>
                                <span style={{ fontSize: 12, color: '#a0a0c0', fontWeight: 500 }}>
                                    {user?.name?.toLowerCase() ?? 'guest'}@devlab
                                </span>
                            </div>

                            {/* Resize handle */}
                            <div
                                title="Drag to resize"
                                style={{ width: 28, height: 4, borderRadius: 2, background: '#3d3d5c', cursor: 'ns-resize' }}
                                onMouseDown={e => {
                                    e.preventDefault();
                                    dragStartY.current = e.clientY;
                                    dragStartH.current = height;
                                    function onMove(ev: MouseEvent) {
                                        const delta = dragStartY.current - ev.clientY;
                                        setHeight(Math.max(200, Math.min(window.innerHeight * 0.85, dragStartH.current + delta)));
                                    }
                                    function onUp() {
                                        window.removeEventListener('mousemove', onMove);
                                        window.removeEventListener('mouseup', onUp);
                                    }
                                    window.addEventListener('mousemove', onMove);
                                    window.addEventListener('mouseup', onUp);
                                }}
                            />
                        </div>

                        {/* Output */}
                        <div
                            style={{
                                flex: 1, overflowY: 'auto',
                                padding: '12px 18px',
                                fontSize: 13, lineHeight: 1.75,
                            }}
                            onClick={() => inputRef.current?.focus()}
                        >
                            {lines.map((line, i) => (
                                <div
                                    key={line.id}
                                    className="term-line"
                                    style={{
                                        animationDelay: `${Math.min(i * 8, 80)}ms`,
                                        color: line.type === 'input' ? '#a78bfa'
                                            : line.type === 'error' ? '#f87171'
                                                : line.type === 'system' ? '#6c6c8a'
                                                    : '#cdd6f4',
                                        whiteSpace: 'pre',
                                    }}
                                >
                                    {renderText(line.text)}
                                </div>
                            ))}

                            {/* Interactive menu */}
                            {showMenu && (
                                <div style={{
                                    background: '#252540', border: '1px solid #3d3d5c',
                                    borderRadius: 8, overflow: 'hidden', margin: '4px 0',
                                }}>
                                    {MENU_MODULES.map((mod, i) => (
                                        <div
                                            key={mod.id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '7px 14px',
                                                background: i === menuIdx ? '#3730a3' : 'transparent',
                                                cursor: 'pointer', transition: 'background 0.1s',
                                            }}
                                            onClick={() => { pushApp(mod.id); addLines(makeLines([`  ✓ Launching ${mod.label}…`, ''])); setShowMenu(false); setInput(''); }}
                                        >
                                            <span style={{ color: i === menuIdx ? '#c4b5fd' : '#6c6c8a', width: 10 }}>
                                                {i === menuIdx ? '▶' : ' '}
                                            </span>
                                            <span style={{ color: i === menuIdx ? '#e2e8f0' : '#a0a0c0', fontWeight: i === menuIdx ? 600 : 400, minWidth: 120 }}>
                                                {mod.label}
                                            </span>
                                            <span style={{ color: '#6c6c8a', fontSize: 11 }}>{mod.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {/* Input row */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 18px',
                            borderTop: '1px solid #2e2e48',
                            background: '#16162a',
                            flexShrink: 0,
                        }}>
                            <span style={{ fontSize: 13, color: '#a78bfa', flexShrink: 0 }}>
                                {user?.name?.toLowerCase() ?? 'guest'}@devlab
                            </span>
                            <span style={{ color: '#4c4c6c', fontSize: 13 }}>~</span>
                            <span style={{ color: '#6c6c8a', fontSize: 13, marginRight: 4 }}>$</span>
                            <input
                                ref={inputRef}
                                id="terminal-input"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{
                                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                    color: '#cdd6f4', fontFamily: 'var(--mono)', fontSize: 13,
                                    caretColor: '#a78bfa',
                                }}
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
