'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

interface PdfEditorProps {
    onClose: () => void;
}

type Tool = 'select' | 'pen' | 'highlighter' | 'text' | 'rect' | 'circle' | 'line' | 'eraser';

interface Annotation {
    id: string;
    tool: Tool;
    color: string;
    lineWidth: number;
    points?: { x: number; y: number }[];       // pen / highlighter / eraser
    x?: number; y?: number; w?: number; h?: number; // rect / circle
    x1?: number; y1?: number; x2?: number; y2?: number; // line
    text?: string;                               // text
    fontSize?: number;
}

interface PageAnnotations {
    [page: number]: Annotation[];
}

const TOOLS: { id: Tool; icon: string; label: string }[] = [
    { id: 'select', icon: '↖', label: 'Select' },
    { id: 'pen', icon: '✏', label: 'Pen' },
    { id: 'highlighter', icon: '▌', label: 'Highlight' },
    { id: 'text', icon: 'T', label: 'Text' },
    { id: 'rect', icon: '▢', label: 'Rectangle' },
    { id: 'circle', icon: '◯', label: 'Ellipse' },
    { id: 'line', icon: '╱', label: 'Line' },
    { id: 'eraser', icon: '⌫', label: 'Eraser' },
];

const PRESET_COLORS = [
    '#e8e8f0', '#ff6b6b', '#ffd93d', '#6bcb77',
    '#4fc3f7', '#ce93d8', '#ff8a65', '#831B84',
];

function uid() { return Math.random().toString(36).slice(2); }

// ── Redraw annotations onto a canvas context ──────────────────────────────────
function drawAnnotations(ctx: CanvasRenderingContext2D, annotations: Annotation[]) {
    annotations.forEach(ann => {
        ctx.save();
        ctx.strokeStyle = ann.color;
        ctx.fillStyle = ann.color;
        ctx.lineWidth = ann.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if ((ann.tool === 'pen' || ann.tool === 'eraser') && ann.points && ann.points.length > 1) {
            if (ann.tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            }
            ctx.beginPath();
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            ann.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        }

        if (ann.tool === 'highlighter' && ann.points && ann.points.length > 1) {
            ctx.globalAlpha = 0.38;
            ctx.lineWidth = ann.lineWidth * 5;
            ctx.beginPath();
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            ann.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        }

        if (ann.tool === 'rect' && ann.w !== undefined && ann.h !== undefined) {
            ctx.globalAlpha = 0.15;
            ctx.fillRect(ann.x!, ann.y!, ann.w, ann.h);
            ctx.globalAlpha = 1;
            ctx.strokeRect(ann.x!, ann.y!, ann.w, ann.h);
        }

        if (ann.tool === 'circle' && ann.w !== undefined && ann.h !== undefined) {
            const cx = ann.x! + ann.w / 2, cy = ann.y! + ann.h / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, Math.abs(ann.w / 2), Math.abs(ann.h / 2), 0, 0, Math.PI * 2);
            ctx.globalAlpha = 0.15;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.stroke();
        }

        if (ann.tool === 'line') {
            ctx.beginPath();
            ctx.moveTo(ann.x1!, ann.y1!);
            ctx.lineTo(ann.x2!, ann.y2!);
            ctx.stroke();
        }

        if (ann.tool === 'text' && ann.text) {
            ctx.font = `${ann.fontSize ?? 16}px 'Space Grotesk', sans-serif`;
            ctx.globalAlpha = 1;
            ctx.fillText(ann.text, ann.x!, ann.y!);
        }

        ctx.restore();
    });
}


// ── Component ─────────────────────────────────────────────────────────────────
export function PdfEditor({ onClose }: PdfEditorProps) {
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);

    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1.2);
    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState('#e8e8f0');
    const [lineWidth, setLineWidth] = useState(3);
    const [fontSize, setFontSize] = useState(16);
    const [annotations, setAnnotations] = useState<PageAnnotations>({});
    const [undoStack, setUndoStack] = useState<{ page: number; snap: Annotation[] }[]>([]);
    const [fileName, setFileName] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [showThumbs, setShowThumbs] = useState(true);
    const [textInput, setTextInput] = useState('');
    const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentAnn, setCurrentAnn] = useState<Annotation | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
    const annCanvasRef = useRef<HTMLCanvasElement>(null);
    const thumbRefs = useRef<(HTMLCanvasElement | null)[]>([]);

    // ── Load PDF.js lazily ───────────────────────────────────────────────────
    const loadPdf = useCallback(async (file: File) => {
        setFileName(file.name);
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const buf = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buf }).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setAnnotations({});
        setUndoStack([]);
    }, []);

    // ── Render a page onto the PDF canvas ────────────────────────────────────
    const renderPage = useCallback(async (pageNum: number, scale: number) => {
        if (!pdfDoc) return;
        const page: PDFPageProxy = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const pdfCanvas = pdfCanvasRef.current;
        const annCanvas = annCanvasRef.current;
        if (!pdfCanvas || !annCanvas) return;

        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        annCanvas.width = viewport.width;
        annCanvas.height = viewport.height;

        const ctx = pdfCanvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, canvas: pdfCanvas, viewport }).promise;

        // Redraw stored annotations for this page
        const annCtx = annCanvas.getContext('2d')!;
        annCtx.clearRect(0, 0, annCanvas.width, annCanvas.height);
        drawAnnotations(annCtx, annotations[pageNum] ?? []);
    }, [pdfDoc, annotations]);

    useEffect(() => { renderPage(currentPage, zoom); }, [pdfDoc, currentPage, zoom, renderPage]);

    // ── Render thumbnails ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!pdfDoc || !showThumbs) return;
        (async () => {
            for (let i = 1; i <= numPages; i++) {
                const canvas = thumbRefs.current[i - 1];
                if (!canvas) continue;
                const page: PDFPageProxy = await pdfDoc.getPage(i);
                const vp = page.getViewport({ scale: 0.22 });
                canvas.width = vp.width;
                canvas.height = vp.height;
                const ctx = canvas.getContext('2d')!;
                await page.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
            }
        })();
    }, [pdfDoc, numPages, showThumbs]);

    // ── Pointer events on annotation canvas ──────────────────────────────────
    function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
        const r = annCanvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function pushUndo() {
        const snap = [...(annotations[currentPage] ?? [])];
        setUndoStack(prev => [...prev.slice(-39), { page: currentPage, snap }]);
    }

    function undo() {
        setUndoStack(prev => {
            if (!prev.length) return prev;
            const last = prev[prev.length - 1];
            if (last.page === currentPage) {
                setAnnotations(a => ({ ...a, [currentPage]: last.snap }));
                return prev.slice(0, -1);
            }
            return prev;
        });
    }

    function onPointerDown(e: React.MouseEvent<HTMLCanvasElement>) {
        if (!pdfDoc) return;
        const pos = getPos(e);

        if (tool === 'text') {
            setTextPos(pos);
            setTextInput('');
            return;
        }

        pushUndo();
        setIsDrawing(true);

        if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
            const ann: Annotation = { id: uid(), tool, color, lineWidth, points: [pos] };
            setCurrentAnn(ann);
        } else if (tool === 'rect' || tool === 'circle') {
            const ann: Annotation = { id: uid(), tool, color, lineWidth, x: pos.x, y: pos.y, w: 0, h: 0 };
            setCurrentAnn(ann);
        } else if (tool === 'line') {
            const ann: Annotation = { id: uid(), tool, color, lineWidth, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
            setCurrentAnn(ann);
        }
    }

    function onPointerMove(e: React.MouseEvent<HTMLCanvasElement>) {
        if (!isDrawing || !currentAnn || !annCanvasRef.current) return;
        const pos = getPos(e);
        let updated: Annotation;

        if ((currentAnn.tool === 'pen' || currentAnn.tool === 'highlighter' || currentAnn.tool === 'eraser') && currentAnn.points) {
            updated = { ...currentAnn, points: [...currentAnn.points, pos] };
        } else if (currentAnn.tool === 'rect' || currentAnn.tool === 'circle') {
            updated = { ...currentAnn, w: pos.x - currentAnn.x!, h: pos.y - currentAnn.y! };
        } else if (currentAnn.tool === 'line') {
            updated = { ...currentAnn, x2: pos.x, y2: pos.y };
        } else {
            updated = currentAnn;
        }

        setCurrentAnn(updated);

        // Live preview
        const ctx = annCanvasRef.current.getContext('2d')!;
        ctx.clearRect(0, 0, annCanvasRef.current.width, annCanvasRef.current.height);
        drawAnnotations(ctx, annotations[currentPage] ?? []);
        drawAnnotations(ctx, [updated]);
    }

    function onPointerUp() {
        if (!isDrawing || !currentAnn) return;
        setIsDrawing(false);
        setAnnotations(prev => ({
            ...prev,
            [currentPage]: [...(prev[currentPage] ?? []), currentAnn],
        }));
        setCurrentAnn(null);
    }

    function commitText() {
        if (!textPos || !textInput.trim()) { setTextPos(null); return; }
        pushUndo();
        const ann: Annotation = {
            id: uid(), tool: 'text', color, lineWidth, text: textInput, x: textPos.x, y: textPos.y, fontSize,
        };
        setAnnotations(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] ?? []), ann] }));
        setTextPos(null);
        setTextInput('');
    }

    function clearPage() {
        pushUndo();
        setAnnotations(prev => ({ ...prev, [currentPage]: [] }));
        const ctx = annCanvasRef.current?.getContext('2d');
        if (ctx && annCanvasRef.current) ctx.clearRect(0, 0, annCanvasRef.current.width, annCanvasRef.current.height);
    }

    // ── Export ────────────────────────────────────────────────────────────────
    function exportPage() {
        const pdfC = pdfCanvasRef.current;
        const annC = annCanvasRef.current;
        if (!pdfC || !annC) return;
        const merged = document.createElement('canvas');
        merged.width = pdfC.width; merged.height = pdfC.height;
        const ctx = merged.getContext('2d')!;
        ctx.drawImage(pdfC, 0, 0);
        ctx.drawImage(annC, 0, 0);
        merged.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName.replace('.pdf', '')}_page${currentPage}_annotated.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
    }

    function printAll() { window.print(); }

    // ── Styles ────────────────────────────────────────────────────────────────
    const toolBtn = (active: boolean): React.CSSProperties => ({
        width: 42, height: 42, borderRadius: 9, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(131,27,132,0.35)' : 'rgba(255,255,255,0.04)',
        color: active ? '#e8e8f2' : 'var(--text-muted)',
        fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', outline: active ? '1px solid rgba(131,27,132,0.6)' : 'none',
    });

    const iconBtn = (danger = false): React.CSSProperties => ({
        padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
        background: danger ? 'rgba(255,80,80,0.08)' : 'rgba(255,255,255,0.04)',
        color: danger ? '#ff8080' : 'var(--text-secondary)',
        fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--body)',
        display: 'flex', alignItems: 'center', gap: 6,
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: 'fixed', inset: '3%', zIndex: 80,
                display: 'flex', flexDirection: 'column',
                background: 'rgba(9, 9, 16, 0.98)',
                border: '1px solid rgba(131,27,132,0.22)',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 0 80px rgba(131,27,132,0.12), 0 40px 120px rgba(0,0,0,0.9)',
                backdropFilter: 'blur(30px)',
            }}
        >
            {/* ── Title bar ── */}
            <div style={{
                display: 'flex', alignItems: 'center', padding: '14px 20px', flexShrink: 0,
                borderBottom: '1px solid rgba(131,27,132,0.14)',
                background: 'rgba(131,27,132,0.05)',
                gap: 16,
            }}>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                    <button onClick={onClose} style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f57', border: 'none', cursor: 'pointer', padding: 0 }} title="Close" />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e' }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#28ca41' }} />
                </div>
                <div style={{ width: 1, height: 18, background: 'rgba(131,27,132,0.2)' }} />
                <span style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 600, color: '#e8e8f2', letterSpacing: 1 }}>
                    PDF Editor
                </span>
                {fileName && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                        — {fileName}
                    </span>
                )}
                {numPages > 0 && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'rgba(131,27,132,0.6)', marginLeft: 'auto' }}>
                        {numPages} pages
                    </span>
                )}
                {/* big close */}
                <button onClick={onClose} style={{
                    width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
                    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                    fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                    marginLeft: fileName ? 0 : 'auto',
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.12)'; e.currentTarget.style.color = '#ff7070'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                    ✕
                </button>
            </div>

            {/* ── Empty state: file drop ── */}
            {!pdfDoc && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={e => {
                            e.preventDefault(); setIsDragOver(false);
                            const f = e.dataTransfer.files[0];
                            if (f?.type === 'application/pdf') loadPdf(f);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: 480, padding: '60px 40px',
                            border: `2px dashed ${isDragOver ? '#831B84' : 'rgba(131,27,132,0.28)'}`,
                            borderRadius: 18, cursor: 'pointer', textAlign: 'center',
                            background: isDragOver ? 'rgba(131,27,132,0.07)' : 'transparent',
                            transition: 'all 0.2s',
                        }}
                    >
                        <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) loadPdf(f); }} />
                        <div style={{ fontSize: 56, opacity: isDragOver ? 0.9 : 0.35, marginBottom: 20 }}>📄</div>
                        <div style={{ fontSize: 18, color: isDragOver ? '#e8e8f2' : 'var(--text-secondary)', marginBottom: 10, fontWeight: 500 }}>
                            Drop a PDF here or click to browse
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-muted)' }}>
                            Supports multi-page PDFs · All editing happens in-browser
                        </div>
                    </div>
                </div>
            )}

            {/* ── Editor layout ── */}
            {pdfDoc && (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Left: Thumbnail sidebar */}
                    {showThumbs && (
                        <div style={{
                            width: 140, borderRight: '1px solid rgba(131,27,132,0.12)',
                            overflow: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
                        }}>
                            {Array.from({ length: numPages }, (_, i) => i + 1).map(n => (
                                <div key={n} onClick={() => setCurrentPage(n)} style={{
                                    cursor: 'pointer', borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                                    border: `2px solid ${n === currentPage ? '#831B84' : 'rgba(131,27,132,0.1)'}`,
                                    transition: 'border-color 0.15s', position: 'relative', background: '#111',
                                }}>
                                    <canvas ref={el => { thumbRefs.current[n - 1] = el; }} style={{ width: '100%', display: 'block' }} />
                                    <div style={{
                                        position: 'absolute', bottom: 3, right: 4,
                                        fontFamily: 'var(--mono)', fontSize: 9, color: n === currentPage ? '#831B84' : 'var(--text-muted)',
                                    }}>{n}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Center: Canvas area */}
                    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: 16, background: 'rgba(5,5,10,0.6)' }}>
                        {/* Toolbar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                            padding: '10px 16px', background: 'rgba(12,12,22,0.95)',
                            border: '1px solid rgba(131,27,132,0.15)', borderRadius: 12,
                            position: 'sticky', top: 0, zIndex: 10, flexShrink: 0, maxWidth: '100%',
                        }}>
                            {/* Tool buttons */}
                            {TOOLS.map(t => (
                                <button key={t.id} onClick={() => setTool(t.id)} style={toolBtn(tool === t.id)} title={t.label}>
                                    {t.icon}
                                </button>
                            ))}

                            <div style={{ width: 1, height: 30, background: 'rgba(131,27,132,0.2)', margin: '0 4px' }} />

                            {/* Color swatches */}
                            {PRESET_COLORS.map(c => (
                                <button key={c} onClick={() => setColor(c)} style={{
                                    width: 22, height: 22, borderRadius: 5, border: color === c ? '2px solid #fff' : '2px solid transparent',
                                    background: c, cursor: 'pointer', flexShrink: 0,
                                }} />
                            ))}
                            <input type="color" value={color} onChange={e => setColor(e.target.value)}
                                style={{ width: 28, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                                title="Custom color" />

                            <div style={{ width: 1, height: 30, background: 'rgba(131,27,132,0.2)', margin: '0 4px' }} />

                            {/* Line width */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>W</span>
                                <input type="range" min={1} max={20} value={lineWidth} onChange={e => setLineWidth(+e.target.value)}
                                    style={{ width: 70, accentColor: '#831B84', cursor: 'pointer' }} />
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#831B84', minWidth: 16 }}>{lineWidth}</span>
                            </div>

                            {tool === 'text' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>Sz</span>
                                    <input type="range" min={10} max={72} value={fontSize} onChange={e => setFontSize(+e.target.value)}
                                        style={{ width: 60, accentColor: '#831B84', cursor: 'pointer' }} />
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#831B84' }}>{fontSize}</span>
                                </div>
                            )}

                            <div style={{ width: 1, height: 30, background: 'rgba(131,27,132,0.2)', margin: '0 4px' }} />

                            {/* Zoom */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} style={{ ...iconBtn(), padding: '5px 10px', fontSize: 16 }}>−</button>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', minWidth: 42, textAlign: 'center' }}>
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} style={{ ...iconBtn(), padding: '5px 10px', fontSize: 16 }}>+</button>
                            </div>

                            <div style={{ width: 1, height: 30, background: 'rgba(131,27,132,0.2)', margin: '0 4px' }} />

                            {/* Actions */}
                            <button onClick={undo} style={iconBtn()} title="Undo (last stroke)">↩ Undo</button>
                            <button onClick={clearPage} style={iconBtn(true)} title="Clear all annotations on page">🗑 Clear</button>
                            <button onClick={exportPage} style={iconBtn()} title="Export this page as PNG">⬇ Export Page</button>
                            <button onClick={printAll} style={iconBtn()} title="Print / Save as PDF">🖨 Print PDF</button>
                        </div>

                        {/* Page navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} style={{ ...iconBtn(), opacity: currentPage <= 1 ? 0.35 : 1, padding: '8px 16px', fontSize: 16 }}>‹ Prev</button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="number" min={1} max={numPages} value={currentPage}
                                    onChange={e => {
                                        const v = Math.max(1, Math.min(numPages, +e.target.value));
                                        setCurrentPage(v);
                                    }}
                                    style={{
                                        width: 52, textAlign: 'center', background: 'rgba(131,27,132,0.08)',
                                        border: '1px solid rgba(131,27,132,0.2)', borderRadius: 7, padding: '6px',
                                        color: '#e8e8f2', fontFamily: 'var(--mono)', fontSize: 13, outline: 'none',
                                    }}
                                />
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-muted)' }}>/ {numPages}</span>
                            </div>
                            <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(p => p + 1)} style={{ ...iconBtn(), opacity: currentPage >= numPages ? 0.35 : 1, padding: '8px 16px', fontSize: 16 }}>Next ›</button>
                            <button onClick={() => setShowThumbs(v => !v)} style={{ ...iconBtn(), marginLeft: 8 }} title="Toggle page panel">
                                {showThumbs ? '◧ Hide Pages' : '◧ Show Pages'}
                            </button>
                        </div>

                        {/* Canvas stack */}
                        <div style={{ position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.7)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                            <canvas ref={pdfCanvasRef} style={{ display: 'block', userSelect: 'none' }} />
                            <canvas
                                ref={annCanvasRef}
                                style={{
                                    position: 'absolute', inset: 0, display: 'block',
                                    cursor: tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair',
                                }}
                                onMouseDown={onPointerDown}
                                onMouseMove={onPointerMove}
                                onMouseUp={onPointerUp}
                                onMouseLeave={onPointerUp}
                            />
                            {/* Text input overlay */}
                            {textPos && (
                                <div style={{
                                    position: 'absolute',
                                    left: textPos.x, top: textPos.y,
                                    zIndex: 20,
                                }}>
                                    <input
                                        autoFocus
                                        value={textInput}
                                        onChange={e => setTextInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextPos(null); }}
                                        onBlur={commitText}
                                        placeholder="Type here…"
                                        style={{
                                            background: 'rgba(0,0,0,0.7)', border: '1px solid #831B84',
                                            color: color, fontFamily: 'var(--body)',
                                            fontSize: fontSize, padding: '3px 6px', outline: 'none',
                                            borderRadius: 4, minWidth: 120,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
