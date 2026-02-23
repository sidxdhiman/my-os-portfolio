'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import type { LabUser, AppId, OSState } from '@/hooks/useOS';

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

const NEOFETCH_ASCII_S = `
  ███████
 ██
 ██
  ██████
       ██
       ██
 ███████
`.trim();

function getNeofetch(user: LabUser | null): TermLine[] {
    const name = user?.name ?? 'UNKNOWN';
    const level = user?.accessLevel ?? 'GUEST';
    const date = new Date().toLocaleString();
    return [
        { id: mkId(), type: 'output', text: '                    ██' },
        { id: mkId(), type: 'output', text: '  ███████     ██  ██' },
        { id: mkId(), type: 'output', text: '  ██          ██  ██     ' + '\x1b[35mLAB-OS\x1b[0m' },
        { id: mkId(), type: 'output', text: '   ██████      ████      ' + `\x1b[35mUser:\x1b[0m ${name}` },
        { id: mkId(), type: 'output', text: '        ██    ██  ██     ' + `\x1b[35mLevel:\x1b[0m ${level}` },
        { id: mkId(), type: 'output', text: '        ██   ██    ██    ' + `\x1b[35mKernel:\x1b[0m lab-os v3.7.1` },
        { id: mkId(), type: 'output', text: '  ███████    ██      ██  ' + `\x1b[35mShell:\x1b[0m lab-shell 2.1` },
        { id: mkId(), type: 'output', text: '                         ' + `\x1b[35mDate:\x1b[0m ${date}` },
        { id: mkId(), type: 'output', text: '                         ' + `\x1b[35mTheme:\x1b[0m Dark Purple Lab` },
        { id: mkId(), type: 'output', text: '' },
        { id: mkId(), type: 'output', text: '  ████   ████   ████   ████   ████' },
    ];
}

export function Terminal({ isOpen, user, onClose, pushApp }: TerminalProps) {
    const [lines, setLines] = useState<TermLine[]>([
        ...makeLines([
            'Laboratory OS Shell v3.7.1',
            `Connected as: ${user?.name ?? 'GUEST'} [${user?.accessLevel ?? 'NONE'}]`,
            'Type "help" for available commands.',
            '',
        ], 'system'),
    ]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [histIdx, setHistIdx] = useState(-1);
    const [showMenu, setShowMenu] = useState(false);
    const [menuIdx, setMenuIdx] = useState(0);
    const [height, setHeight] = useState(460);
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();
    const dragStartY = useRef(0);
    const dragStartH = useRef(0);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
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
        addLines([{ id: mkId(), type: 'input', text: `lab@os:~$ ${raw}` }]);

        if (!trimmed) return;

        if (trimmed === 'help') {
            addLines(makeLines([
                '',
                '  Available commands:',
                '  help          — Show this message',
                '  lab           — Browse & launch lab modules',
                '  neofetch      — Display system info',
                '  clear         — Clear terminal',
                '  whoami        — Display current user',
                '  ls            — List lab modules',
                '  about         — About Laboratory OS',
                '  open [name]   — Open a module directly',
                '',
            ]));
        } else if (trimmed === 'lab') {
            setShowMenu(true);
            setMenuIdx(0);
            addLines(makeLines([
                '',
                '  ◈ Lab Modules — Use ↑↓ to navigate, Enter to launch',
                '',
            ]));
        } else if (trimmed === 'neofetch') {
            addLines(getNeofetch(user));
        } else if (trimmed === 'clear') {
            setLines([]);
        } else if (trimmed === 'whoami') {
            addLines(makeLines([
                '',
                `  Subject: ${user?.name ?? 'UNKNOWN'}`,
                `  Level:   ${user?.accessLevel ?? 'NONE'}`,
                `  Hash:    LAB-${Math.abs((user?.name ?? 'X').split('').reduce((a, c) => a + c.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(6, '0')}`,
                '',
            ]));
        } else if (trimmed === 'ls') {
            addLines(makeLines([
                '',
                '  drwxr-x  whiteboard/      Collaborative digital canvas',
                '  drwxr-x  neural-eraser/   AI watermark removal engine',
                '  drwxr-x  pdf-editor/      Full-featured PDF editing suite',
                '',
            ]));
        } else if (trimmed === 'about') {
            addLines(makeLines([
                '',
                '  Laboratory OS — An immersive developer portfolio environment.',
                '  Built with Next.js, Framer Motion, and caffeine.',
                '  © 2026 Lab Systems Division',
                '',
            ]));
        } else if (trimmed.startsWith('open ')) {
            const appName = trimmed.slice(5).trim();
            if (appName === 'neural-eraser' || appName === 'neural') {
                pushApp('neural-eraser');
                addLines(makeLines(['', '  Launching Neural Eraser...', '']));
            } else if (appName === 'whiteboard') {
                pushApp('whiteboard');
                addLines(makeLines(['', '  Launching Whiteboard...', '']));
            } else if (appName === 'pdf-editor' || appName === 'pdf') {
                pushApp('pdf-editor');
                addLines(makeLines(['', '  Launching PDF Editor...', '']));
            } else {
                addLines(makeLines([`  Module '${appName}' not found.`], 'error'));
            }
        } else {
            addLines(makeLines([`  command not found: ${raw}. Try 'help'.`], 'error'));
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (showMenu) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMenuIdx(i => Math.min(i + 1, MENU_MODULES.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMenuIdx(i => Math.max(i - 1, 0));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const selected = MENU_MODULES[menuIdx];
                pushApp(selected.id);
                addLines(makeLines([`  ✓ Launching ${selected.label}...`, '']));
                setShowMenu(false);
                setInput('');
                return;
            }
            if (e.key === 'Escape') {
                setShowMenu(false);
                addLines(makeLines(['  [Menu closed]', '']));
                return;
            }
        }

        if (e.key === 'Enter') {
            processCommand(input);
            setInput('');
            setShowMenu(false);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIdx = Math.min(histIdx + 1, history.length - 1);
            setHistIdx(newIdx);
            setInput(history[newIdx] ?? '');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIdx = Math.max(histIdx - 1, -1);
            setHistIdx(newIdx);
            setInput(newIdx === -1 ? '' : history[newIdx]);
        }
    }

    function renderText(text: string) {
        // Simple ANSI color handling for \x1b[35m = purple, \x1b[0m = reset
        const parts = text.split(/(\x1b\[\d+m)/);
        let currentColor = 'inherit';
        return parts.map((part, i) => {
            if (part === '\x1b[35m') { currentColor = '#a020a2'; return null; }
            if (part === '\x1b[0m') { currentColor = 'inherit'; return null; }
            return <span key={i} style={{ color: currentColor }}>{part}</span>;
        });
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    id="terminal-island"
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'fixed',
                        bottom: 28,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'min(900px, 92vw)',
                        height: height,
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'rgba(7, 7, 14, 0.97)',
                        border: '1px solid rgba(131, 27, 132, 0.35)',
                        borderRadius: 14,
                        boxShadow: '0 0 60px rgba(131,27,132,0.18), 0 24px 80px rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(28px)',
                        overflow: 'hidden',
                    }}
                    onClick={() => inputRef.current?.focus()}
                >
                    {/* Title bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        background: 'rgba(131, 27, 132, 0.07)',
                        borderBottom: '1px solid rgba(131, 27, 132, 0.18)',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f57', border: 'none', cursor: 'pointer', padding: 0 }} onClick={onClose} />
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e' }} />
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#28ca41' }} />
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: '#831B84', letterSpacing: 1.5, marginLeft: 10 }}>
                                LAB-SHELL — {user?.name ?? 'GUEST'}
                            </span>
                        </div>

                        {/* Drag handle to resize height */}
                        <div
                            title="Drag to resize"
                            style={{
                                width: 32,
                                height: 6,
                                borderRadius: 3,
                                background: 'rgba(131, 27, 132, 0.4)',
                                cursor: 'ns-resize',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onMouseDown={e => {
                                e.preventDefault();
                                dragStartY.current = e.clientY;
                                dragStartH.current = height;
                                function onMove(ev: MouseEvent) {
                                    const delta = dragStartY.current - ev.clientY;
                                    setHeight(Math.max(200, Math.min(window.innerHeight * 0.8, dragStartH.current + delta)));
                                }
                                function onUp() {
                                    window.removeEventListener('mousemove', onMove);
                                    window.removeEventListener('mouseup', onUp);
                                }
                                window.addEventListener('mousemove', onMove);
                                window.addEventListener('mouseup', onUp);
                            }}
                        >
                            <div style={{ width: 20, height: 2, borderRadius: 1, background: 'rgba(131,27,132,0.8)' }} />
                        </div>
                    </div>

                    {/* Output */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '14px 20px',
                            fontFamily: 'var(--mono)',
                            fontSize: 14,
                            lineHeight: 1.8,
                        }}
                        onClick={() => inputRef.current?.focus()}
                    >
                        {lines.map((line, i) => (
                            <div
                                key={line.id}
                                className="term-line"
                                style={{
                                    animationDelay: `${Math.min(i * 10, 100)}ms`,
                                    color: line.type === 'input'
                                        ? '#a060c0'
                                        : line.type === 'error'
                                            ? '#ff6b6b'
                                            : line.type === 'system'
                                                ? 'rgba(131,27,132,0.8)'
                                                : 'var(--text-secondary)',
                                    whiteSpace: 'pre',
                                }}
                            >
                                {renderText(line.text)}
                            </div>
                        ))}

                        {/* Interactive menu overlay */}
                        {showMenu && (
                            <div style={{
                                background: 'rgba(131, 27, 132, 0.08)',
                                border: '1px solid rgba(131, 27, 132, 0.3)',
                                borderRadius: 6,
                                overflow: 'hidden',
                                margin: '4px 0',
                            }}>
                                {MENU_MODULES.map((mod, i) => (
                                    <div
                                        key={mod.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '8px 14px',
                                            background: i === menuIdx ? 'rgba(131, 27, 132, 0.25)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        onClick={() => {
                                            pushApp(mod.id);
                                            addLines(makeLines([`  ✓ Launching ${mod.label}...`, '']));
                                            setShowMenu(false);
                                            setInput('');
                                        }}
                                    >
                                        <span style={{ color: i === menuIdx ? '#ff88ff' : '#831B84' }}>
                                            {i === menuIdx ? '▶' : ' '}
                                        </span>
                                        <span style={{ color: i === menuIdx ? '#e8e8f0' : 'var(--text-secondary)', fontWeight: i === menuIdx ? 600 : 400 }}>
                                            {mod.label}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{mod.desc}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input row */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 20px',
                        borderTop: '1px solid rgba(131, 27, 132, 0.18)',
                        background: 'rgba(131, 27, 132, 0.04)',
                        flexShrink: 0,
                    }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: '#831B84' }}>lab@os:~$</span>
                        <input
                            ref={inputRef}
                            id="terminal-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: '#e8e8f0',
                                fontFamily: 'var(--mono)',
                                fontSize: 14,
                                caretColor: '#831B84',
                            }}
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
