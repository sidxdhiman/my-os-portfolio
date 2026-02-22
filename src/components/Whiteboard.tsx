'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WhiteboardProps {
    onClose: () => void;
}

type Tool = 'pen' | 'eraser' | 'line';

export function Whiteboard({ onClose }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState('#a020a2');
    const [size, setSize] = useState(3);
    const [drawing, setDrawing] = useState(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    const COLORS = ['#a020a2', '#831B84', '#ff88ff', '#e8e8f0', '#ff6b6b', '#28ca41', '#ffbd2e', '#60a0ff'];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.fillStyle = '#060812';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = 'rgba(131,27,132,0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
    }, []);

    function getPos(e: React.MouseEvent) {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onMouseDown(e: React.MouseEvent) {
        setDrawing(true);
        lastPos.current = getPos(e);
    }

    function onMouseMove(e: React.MouseEvent) {
        if (!drawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pos = getPos(e);
        const last = lastPos.current ?? pos;

        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pos.x, pos.y);

        if (tool === 'eraser') {
            ctx.strokeStyle = '#060812';
            ctx.lineWidth = size * 4;
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.shadowBlur = 0;

        lastPos.current = pos;
    }

    function onMouseUp() { setDrawing(false); lastPos.current = null; }

    function clearCanvas() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#060812';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Redraw grid
        ctx.strokeStyle = 'rgba(131,27,132,0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            style={{
                position: 'fixed',
                inset: '5%',
                zIndex: 80,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(6, 8, 18, 0.99)',
                border: '1px solid rgba(131, 27, 132, 0.4)',
                borderRadius: 16,
                boxShadow: '0 0 80px rgba(131,27,132,0.2)',
                overflow: 'hidden',
            }}
        >
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                background: 'rgba(131,27,132,0.06)',
                borderBottom: '1px solid rgba(131,27,132,0.2)',
                flexShrink: 0,
                flexWrap: 'wrap',
            }}>
                {/* Traffic lights */}
                <div style={{ display: 'flex', gap: 6, marginRight: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', cursor: 'pointer' }} onClick={onClose} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28ca41' }} />
                </div>

                <div style={{ height: 14, width: 1, background: 'rgba(131,27,132,0.3)' }} />
                <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 700, color: '#e8e8f0', letterSpacing: 2 }}>WHITEBOARD</span>
                <div style={{ height: 14, width: 1, background: 'rgba(131,27,132,0.3)', marginLeft: 4 }} />

                {/* Tools */}
                {(['pen', 'eraser'] as Tool[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTool(t)}
                        style={{
                            background: tool === t ? 'rgba(131,27,132,0.3)' : 'transparent',
                            border: `1px solid ${tool === t ? 'rgba(131,27,132,0.7)' : 'rgba(131,27,132,0.2)'}`,
                            borderRadius: 6,
                            padding: '4px 10px',
                            color: tool === t ? '#e8e8f0' : 'var(--text-muted)',
                            fontFamily: 'var(--mono)',
                            fontSize: 11,
                            cursor: 'pointer',
                            letterSpacing: 1,
                        }}
                    >
                        {t === 'pen' ? '✏ PEN' : '◻ ERASER'}
                    </button>
                ))}

                {/* Colors */}
                <div style={{ display: 'flex', gap: 5, marginLeft: 4 }}>
                    {COLORS.map(c => (
                        <div
                            key={c}
                            onClick={() => { setColor(c); setTool('pen'); }}
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: c,
                                cursor: 'pointer',
                                border: color === c ? '2px solid #fff' : '2px solid transparent',
                                boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                                transition: 'all 0.15s',
                            }}
                        />
                    ))}
                </div>

                {/* Size */}
                <input
                    type="range"
                    min={1}
                    max={20}
                    value={size}
                    onChange={e => setSize(Number(e.target.value))}
                    style={{ width: 80, accentColor: '#831B84' }}
                />

                <button
                    onClick={clearCanvas}
                    style={{
                        background: 'rgba(255,100,100,0.1)',
                        border: '1px solid rgba(255,100,100,0.3)',
                        borderRadius: 6,
                        padding: '4px 10px',
                        color: '#ff6b6b',
                        fontFamily: 'var(--mono)',
                        fontSize: 11,
                        cursor: 'pointer',
                        marginLeft: 'auto',
                    }}
                >
                    ✕ CLEAR
                </button>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)',
                        fontSize: 14,
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                id="whiteboard-canvas"
                style={{ flex: 1, cursor: tool === 'eraser' ? 'cell' : 'crosshair', display: 'block', width: '100%', height: '100%' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            />
        </motion.div>
    );
}
