const fs = require('fs');

const code = `'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Settings, Palette, Download, Trash2 } from 'lucide-react';

interface WhiteboardProps { onClose: () => void; }
type Tool = 'pen' | 'eraser';

const COLORS = [
    '#1a1d2e', '#6200ea', '#d32f2f', '#1976d2',
    '#00897b', '#f57f17', '#e91e63', '#ffffff',
];

interface BoardMeta {
    id: string;
    name: string;
    preview: string | null;
}

export function Whiteboard({ onClose }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState('#1a1d2e');
    const [size, setSize] = useState(3);
    const [drawing, setDrawing] = useState(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    // Launchpad states
    const [boards, setBoards] = useState<BoardMeta[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('lab_whiteboard_boards');
            if (saved) {
                try { return JSON.parse(saved); } catch {}
            }
            const oldData = localStorage.getItem('lab_whiteboard_data');
            if (oldData) {
                const defaultBoard = { id: 'default', name: 'My Canvas', preview: oldData };
                localStorage.setItem('lab_whiteboard_data_default', oldData);
                localStorage.setItem('lab_whiteboard_boards', JSON.stringify([defaultBoard]));
                return [defaultBoard];
            }
        }
        return [];
    });
    
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [showHelpModal, setShowHelpModal] = useState(true);
    const [colorMenuPos, setColorMenuPos] = useState<{x: number, y: number} | null>(null);

    const lastShiftTime = useRef<number>(0);

    useEffect(() => {
        localStorage.setItem('lab_whiteboard_boards', JSON.stringify(boards));
    }, [boards]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Shift') {
                const now = Date.now();
                if (now - lastShiftTime.current < 300) {
                    setTool(t => t === 'pen' ? 'eraser' : 'pen');
                    lastShiftTime.current = 0;
                } else {
                    lastShiftTime.current = now;
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const initCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const saved = localStorage.getItem(\`lab_whiteboard_data_\${activeBoardId}\`);
        if (saved) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = saved;
        } else {
            clearCanvasInternal(canvas, ctx);
        }
    };

    useEffect(() => {
        if (activeBoardId) {
            const t = setTimeout(initCanvas, 50);
            return () => clearTimeout(t);
        }
    }, [activeBoardId]);

    function clearCanvasInternal(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#f8f9fc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let x = 0; x < canvas.width; x += 28)
            for (let y = 0; y < canvas.height; y += 28) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
    }

    function getPos(e: React.MouseEvent) {
        const r = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    
    function onMouseDown(e: React.MouseEvent) { 
        if (colorMenuPos) setColorMenuPos(null);
        setDrawing(true); 
        lastPos.current = getPos(e); 
    }
    
    function onMouseMove(e: React.MouseEvent) {
        if (!drawing) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const pos = getPos(e);
        const last = lastPos.current ?? pos;
        ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(pos.x, pos.y);
        if (tool === 'eraser') {
            ctx.strokeStyle = '#f8f9fc'; ctx.lineWidth = size * 5;
        } else {
            ctx.strokeStyle = color; ctx.lineWidth = size;
        }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        lastPos.current = pos;
    }
    
    function updatePreview() {
        const canvas = canvasRef.current;
        if (!canvas || !activeBoardId) return;
        // save high quality
        const hqData = canvas.toDataURL('image/png');
        localStorage.setItem(\`lab_whiteboard_data_\${activeBoardId}\`, hqData);
        
        // save preview downscaled a bit for memory if we want, but letting dataURL suffice
        setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, preview: hqData } : b));
    }

    function onMouseUp() {
        if (!drawing) return;
        setDrawing(false);
        lastPos.current = null;
        updatePreview();
    }

    function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
        if (e.shiftKey) {
            if (tool === 'pen') {
                setColorMenuPos({ x: e.clientX, y: e.clientY });
            }
        } else {
            if (e.deltaY > 0) {
                setSize(s => Math.max(1, s - 1));
            } else {
                setSize(s => Math.min(24, s + 1));
            }
        }
    }

    function clearCanvas() {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        clearCanvasInternal(canvas, ctx);
        updatePreview();
    }

    function exportCanvas() {
        if (!activeBoardId) return;
        const b = boards.find(b => b.id === activeBoardId);
        const name = b ? b.name : 'whiteboard';
        const canvas = canvasRef.current; if (!canvas) return;
        canvas.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement('a'), { href: url, download: \`\${name}.png\` });
            a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
        }, 'image/png');
    }

    function handleCreateBoard() {
        if (!newBoardName.trim()) return;
        // eslint-disable-next-line react-hooks/purity
        const id = crypto.randomUUID();
        const newBoard: BoardMeta = {
            id,
            name: newBoardName.trim(),
            preview: null
        };
        setBoards(prev => [...prev, newBoard]);
        setActiveBoardId(id);
        setNewBoardName('');
        setIsCreateBoardModalOpen(false);
        setShowHelpModal(true); // show help when entering a new board too
    }

    function handleDeleteBoard(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        if (confirm('Delete this canvas?')) {
            setBoards(prev => prev.filter(b => b.id !== id));
            localStorage.removeItem(\`lab_whiteboard_data_\${id}\`);
        }
    }

    const toolBtn = (active: boolean) => ({
        padding: '6px 14px',
        background: active ? 'var(--brand-xlight)' : 'transparent',
        border: \`1px solid \${active ? 'var(--brand)' : 'var(--border)'}\`,
        borderRadius: 8,
        color: active ? 'var(--brand)' : 'var(--text-secondary)',
        fontFamily: 'var(--body)', fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 6,
    } as React.CSSProperties);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            style={{
                position: 'fixed', inset: '4%', zIndex: 80,
                display: 'flex', flexDirection: 'column',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 60, flexShrink: 0, borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6200ea, #9c27b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✍️</div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>Whiteboard</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flex: 1 }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.color = '#e53e3e'; e.currentTarget.style.borderColor = '#fed7d7'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                {!activeBoardId ? (
                    <div style={{ flex: 1, padding: 40, overflowY: 'auto', background: 'var(--bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>Canvas Launchpad</h2>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Select a canvas to get started or create a new one.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateBoardModalOpen(true)}
                                style={{ padding: '8px 16px', background: 'var(--brand)', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(57, 224, 121, 0.25)' }}
                            >
                                <Plus size={16} /> New Canvas
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                            {boards.map(b => (
                                <div
                                    key={b.id}
                                    onClick={() => setActiveBoardId(b.id)}
                                    style={{
                                        height: 180, borderRadius: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                        background: b.preview ? \`url(\${b.preview}) center/contain no-repeat\` : '#f8f9fc',
                                        backgroundColor: '#fff',
                                        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                                >
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)' }} />
                                    <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{b.name}</h3>
                                        <button onClick={(e) => handleDeleteBoard(e, b.id)} style={{ background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', borderRadius: 6, padding: 6, cursor: 'pointer', backdropFilter: 'blur(4px)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <AnimatePresence>
                            {isCreateBoardModalOpen && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} style={{ background: 'var(--bg-card)', padding: '32px 40px', borderRadius: 24, width: '100%', maxWidth: 440, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                                        <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Create New Canvas</h2>

                                        <label style={{ display: 'block', marginBottom: 32 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Canvas Name</div>
                                            <input type="text" value={newBoardName} onChange={e => setNewBoardName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} placeholder="e.g. Brainstorming" onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} autoFocus />
                                        </label>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                            <button onClick={() => setIsCreateBoardModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>Cancel</button>
                                            <button onClick={handleCreateBoard} disabled={!newBoardName.trim()} style={{ padding: '10px 24px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, opacity: newBoardName.trim() ? 1 : 0.5, boxShadow: '0 4px 12px rgba(57, 224, 121, 0.25)' }}>Finish Creation</button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                            <button onClick={() => { setActiveBoardId(null); setShowHelpModal(false); }} style={{ background: 'transparent', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <ArrowLeft size={14} /> Back
                            </button>
                            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
                            
                            <button style={toolBtn(tool === 'pen')} onClick={() => setTool('pen')}>
                                <span>✏</span> Pen
                            </button>
                            <button style={toolBtn(tool === 'eraser')} onClick={() => setTool('eraser')}>
                                <span>⌫</span> Eraser
                            </button>

                            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />

                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setColor(c); setTool('pen'); }}
                                        style={{ width: 20, height: 20, borderRadius: 5, background: c, cursor: 'pointer', border: color === c ? '2.5px solid var(--brand)' : \`2px solid \${c === '#ffffff' ? 'var(--border)' : 'transparent'}\`, transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.12s' }}
                                    />
                                ))}
                                <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool('pen'); }} title="Custom color" style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid var(--border)', cursor: 'pointer', padding: 0 }} />
                            </div>

                            <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Size</span>
                                <input type="range" min={1} max={24} value={size} onChange={e => setSize(+e.target.value)} style={{ width: 80, accentColor: 'var(--brand)', cursor: 'pointer' }} />
                                <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-secondary)', minWidth: 20 }}>{size}</span>
                            </div>

                            <div style={{ flex: 1 }} />
                            
                            <button onClick={() => setShowHelpModal(true)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }}>Help</button>

                            <button onClick={exportCanvas} style={{ padding: '6px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                <Download size={14} /> Export
                            </button>
                            <button onClick={clearCanvas} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #fed7d7', borderRadius: 8, fontSize: 13, color: '#e53e3e', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                ✕ Clear
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, position: 'relative' }}>
                            <canvas
                                ref={canvasRef}
                                style={{
                                    display: 'block', width: '100%', height: '100%',
                                    cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                                }}
                                onMouseDown={onMouseDown}
                                onMouseMove={onMouseMove}
                                onMouseUp={onMouseUp}
                                onMouseLeave={onMouseUp}
                                onWheel={onWheel}
                            />

                            {/* Shift+Scroll Color Menu Modal at Cursor */}
                            <AnimatePresence>
                                {colorMenuPos && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                        style={{
                                            position: 'absolute', left: Math.min(colorMenuPos.x, (canvasRef.current?.offsetWidth || 1000) - 130), top: Math.min(colorMenuPos.y, (canvasRef.current?.offsetHeight || 1000) - 100), 
                                            background: 'var(--bg-card)', padding: 12, borderRadius: 12, boxShadow: 'var(--shadow-xl)',
                                            border: '1px solid var(--border)', zIndex: 100, width: 130
                                        }}
                                        onMouseLeave={() => setColorMenuPos(null)}
                                    >
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textAlign: 'center' }}>Select Color</div>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => { setColor(c); setColorMenuPos(null); }}
                                                    style={{ width: 24, height: 24, borderRadius: 6, background: c, cursor: 'pointer', border: color === c ? '2px solid var(--brand)' : \`1px solid \${c==='#ffffff'?'var(--border)':'transparent'}\`, transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.1s' }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <AnimatePresence>
                            {showHelpModal && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} style={{ background: 'var(--bg-card)', padding: '32px 40px', borderRadius: 24, width: '100%', maxWidth: 440, border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                                        <h2 style={{ margin: '0 0 20px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Whiteboard Guide 💡</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: 20 }}>🖱️</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Scroll Mouse</div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dynamically adjust brush/eraser size.</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: 20 }}>🎨</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Shift + Scroll</div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Open quick color menu precisely at your cursor.</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: 20 }}>⚡</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Double-tap Shift</div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Instantly switch between Pen and Eraser.</div>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowHelpModal(false)} style={{ width: '100%', padding: '14px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 15, marginTop: 24, boxShadow: '0 4px 12px rgba(57, 224, 121, 0.25)' }}>Got it, let's draw!</button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
'

fs.writeFileSync('src/components/Whiteboard.tsx', code);
