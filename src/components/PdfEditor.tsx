'use client';

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

/* ─────────────────────────────── Types ─────────────────────────────── */
interface PdfEditorProps { onClose: () => void; }

type Tool = 'select' | 'pen' | 'highlighter' | 'text' | 'rect' | 'circle' | 'line' | 'arrow' | 'eraser';

interface Pt { x: number; y: number; }
interface Annotation {
    id: string; tool: Tool; color: string; lineWidth: number;
    points?: Pt[];
    x?: number; y?: number; w?: number; h?: number;
    x1?: number; y1?: number; x2?: number; y2?: number;
    text?: string; fontSize?: number;
    opacity?: number;
}
type PageAnnotations = Record<number, Annotation[]>;
type UndoEntry = { page: number; snap: Annotation[] };

/* ─────────────────────────────── Constants ─────────────────────────── */
const TOOLS: { id: Tool; icon: string; label: string; shortcut: string }[] = [
    { id: 'select', icon: '↖', label: 'Select', shortcut: 'V' },
    { id: 'pen', icon: '✏️', label: 'Pen', shortcut: 'P' },
    { id: 'highlighter', icon: '▌', label: 'Highlighter', shortcut: 'H' },
    { id: 'text', icon: 'T', label: 'Text', shortcut: 'T' },
    { id: 'rect', icon: '▢', label: 'Rectangle', shortcut: 'R' },
    { id: 'circle', icon: '◯', label: 'Ellipse', shortcut: 'E' },
    { id: 'line', icon: '╱', label: 'Line', shortcut: 'L' },
    { id: 'arrow', icon: '→', label: 'Arrow', shortcut: 'A' },
    { id: 'eraser', icon: '⌫', label: 'Eraser', shortcut: 'X' },
];

const COLORS = [
    '#ffffff', '#ff6b6b', '#ffd93d', '#6bcb77',
    '#4fc3f7', '#ce93d8', '#ff8a65', '#ff6bdf',
    '#00e5ff', '#ffe082', '#a5d6a7', '#ef9a9a',
];

const uid = () => Math.random().toString(36).slice(2, 10);

/* ─────────────────────────────── Canvas Drawing ────────────────────── */
function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len = 16;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - len * Math.cos(angle - Math.PI / 6), y2 - len * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - len * Math.cos(angle + Math.PI / 6), y2 - len * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

function drawAnnotations(ctx: CanvasRenderingContext2D, annotations: Annotation[]) {
    annotations.forEach(ann => {
        ctx.save();
        ctx.strokeStyle = ann.color;
        ctx.fillStyle = ann.color;
        ctx.lineWidth = ann.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = ann.opacity ?? 1;

        switch (ann.tool) {
            case 'pen':
                if (ann.points && ann.points.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(ann.points[0].x, ann.points[0].y);
                    for (let i = 1; i < ann.points.length - 1; i++) {
                        const mx = (ann.points[i].x + ann.points[i + 1].x) / 2;
                        const my = (ann.points[i].y + ann.points[i + 1].y) / 2;
                        ctx.quadraticCurveTo(ann.points[i].x, ann.points[i].y, mx, my);
                    }
                    ctx.lineTo(ann.points[ann.points.length - 1].x, ann.points[ann.points.length - 1].y);
                    ctx.stroke();
                } else if (ann.points && ann.points.length === 1) {
                    ctx.beginPath();
                    ctx.arc(ann.points[0].x, ann.points[0].y, ann.lineWidth / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'highlighter':
                if (ann.points && ann.points.length > 1) {
                    ctx.globalAlpha = 0.35;
                    ctx.lineWidth = ann.lineWidth * 6;
                    ctx.beginPath();
                    ctx.moveTo(ann.points[0].x, ann.points[0].y);
                    ann.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
                    ctx.stroke();
                }
                break;

            case 'eraser':
                if (ann.points && ann.points.length > 1) {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.strokeStyle = 'rgba(0,0,0,1)';
                    ctx.lineWidth = ann.lineWidth * 4;
                    ctx.beginPath();
                    ctx.moveTo(ann.points[0].x, ann.points[0].y);
                    ann.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
                    ctx.stroke();
                }
                break;

            case 'rect':
                if (ann.w !== undefined && ann.h !== undefined) {
                    ctx.globalAlpha = 0.12;
                    ctx.fillRect(ann.x!, ann.y!, ann.w, ann.h);
                    ctx.globalAlpha = ann.opacity ?? 1;
                    ctx.strokeRect(ann.x!, ann.y!, ann.w, ann.h);
                }
                break;

            case 'circle':
                if (ann.w !== undefined && ann.h !== undefined) {
                    const cx = ann.x! + ann.w / 2, cy = ann.y! + ann.h / 2;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, Math.abs(ann.w / 2), Math.abs(ann.h / 2), 0, 0, Math.PI * 2);
                    ctx.globalAlpha = 0.12;
                    ctx.fill();
                    ctx.globalAlpha = ann.opacity ?? 1;
                    ctx.stroke();
                }
                break;

            case 'line':
                ctx.beginPath();
                ctx.moveTo(ann.x1!, ann.y1!);
                ctx.lineTo(ann.x2!, ann.y2!);
                ctx.stroke();
                break;

            case 'arrow':
                drawArrow(ctx, ann.x1!, ann.y1!, ann.x2!, ann.y2!);
                break;

            case 'text':
                if (ann.text) {
                    ctx.globalAlpha = ann.opacity ?? 1;
                    ctx.font = `${ann.fontSize ?? 18}px 'Space Grotesk', sans-serif`;
                    ctx.fillText(ann.text, ann.x!, ann.y!);
                }
                break;
        }
        ctx.restore();
    });
}

/* ─────────────────────────────── Component ─────────────────────────── */
export function PdfEditor({ onClose }: PdfEditorProps) {
    /* PDF state */
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1.3);
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [showThumbs, setShowThumbs] = useState(true);

    /* Editor state */
    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState('#ffffff');
    const [lineWidth, setLineWidth] = useState(3);
    const [fontSize, setFontSize] = useState(18);
    const [annotations, setAnnotations] = useState<PageAnnotations>({});
    const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
    const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentAnn, setCurrentAnn] = useState<Annotation | null>(null);
    const [textPos, setTextPos] = useState<Pt | null>(null);
    const [textInput, setTextInput] = useState('');
    const [exportMsg, setExportMsg] = useState('');

    /* Refs */
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
    const annCanvasRef = useRef<HTMLCanvasElement>(null);
    const thumbRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const renderTask = useRef<{ cancel: () => void } | null>(null);
    const annRef = useRef<PageAnnotations>({});

    // keep annRef in sync
    useEffect(() => { annRef.current = annotations; }, [annotations]);

    /* ─── Load PDF ─────────────────────────────────────────────────── */
    const loadPdf = useCallback(async (file: File) => {
        if (file.type !== 'application/pdf') {
            setLoadError('Only PDF files are supported.');
            return;
        }
        setLoading(true);
        setLoadError('');
        setFileName(file.name);
        try {
            const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
            GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

            renderTask.current?.cancel();
            if (pdfDoc) {
                try { await (pdfDoc as PDFDocumentProxy & { destroy(): Promise<void> }).destroy(); } catch {/* ok */ }
            }

            const buf = await file.arrayBuffer();
            const doc = await getDocument({ data: buf }).promise;
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setCurrentPage(1);
            setAnnotations({});
            setUndoStack([]);
            setRedoStack([]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setLoadError('Failed to load PDF: ' + msg);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Render page ──────────────────────────────────────────────── */
    const renderPage = useCallback(async (pageNum: number, scale: number, doc: PDFDocumentProxy) => {
        const pdfCanvas = pdfCanvasRef.current;
        const annCanvas = annCanvasRef.current;
        if (!pdfCanvas || !annCanvas) return;

        renderTask.current?.cancel();

        let page: PDFPageProxy;
        try { page = await doc.getPage(pageNum); }
        catch { return; }

        const vp = page.getViewport({ scale });
        pdfCanvas.width = vp.width;
        pdfCanvas.height = vp.height;
        annCanvas.width = vp.width;
        annCanvas.height = vp.height;

        const pdfCtx = pdfCanvas.getContext('2d')!;
        pdfCtx.fillStyle = '#ffffff';
        pdfCtx.fillRect(0, 0, vp.width, vp.height);

        const task = page.render({ canvasContext: pdfCtx, canvas: pdfCanvas, viewport: vp });
        renderTask.current = task;
        try {
            await task.promise;
        } catch (e: unknown) {
            const name = e instanceof Error ? e.name : '';
            if (name === 'RenderingCancelledException') return;
        }

        // Re-draw annotations for this page
        const annCtx = annCanvas.getContext('2d')!;
        annCtx.clearRect(0, 0, annCanvas.width, annCanvas.height);
        drawAnnotations(annCtx, annRef.current[pageNum] ?? []);
    }, []);

    useEffect(() => {
        if (pdfDoc) renderPage(currentPage, zoom, pdfDoc);
    }, [pdfDoc, currentPage, zoom, renderPage]);

    // Re-draw annotations when they change (without re-rendering PDF)
    useEffect(() => {
        const annCanvas = annCanvasRef.current;
        if (!annCanvas) return;
        const ctx = annCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, annCanvas.width, annCanvas.height);
        drawAnnotations(ctx, annotations[currentPage] ?? []);
    }, [annotations, currentPage]);

    /* ─── Thumbnails ───────────────────────────────────────────────── */
    useEffect(() => {
        if (!pdfDoc || !showThumbs) return;
        let cancelled = false;
        (async () => {
            for (let i = 1; i <= numPages; i++) {
                if (cancelled) break;
                const canvas = thumbRefs.current[i - 1];
                if (!canvas) continue;
                try {
                    const pg = await pdfDoc.getPage(i);
                    const vp = pg.getViewport({ scale: 0.2 });
                    canvas.width = vp.width;
                    canvas.height = vp.height;
                    const ctx = canvas.getContext('2d')!;
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, vp.width, vp.height);
                    await pg.render({ canvasContext: ctx, canvas, viewport: vp }).promise;
                } catch {/* ignore */ }
            }
        })();
        return () => { cancelled = true; };
    }, [pdfDoc, numPages, showThumbs]);

    /* ─── Keyboard shortcuts ───────────────────────────────────────── */
    useEffect(() => {
        const map: Record<string, () => void> = {
            v: () => setTool('select'),
            p: () => setTool('pen'),
            h: () => setTool('highlighter'),
            t: () => setTool('text'),
            r: () => setTool('rect'),
            e: () => setTool('circle'),
            l: () => setTool('line'),
            a: () => setTool('arrow'),
            x: () => setTool('eraser'),
        };
        const handler = (ev: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((ev.target as HTMLElement)?.tagName)) return;
            if (ev.ctrlKey && ev.key === 'z') { ev.preventDefault(); undo(); return; }
            if (ev.ctrlKey && ev.key === 'y') { ev.preventDefault(); redo(); return; }
            const fn = map[ev.key.toLowerCase()];
            if (fn) fn();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Undo / Redo ──────────────────────────────────────────────── */
    function pushUndo(pageNum: number) {
        const snap = [...(annRef.current[pageNum] ?? [])];
        setUndoStack(prev => [...prev.slice(-49), { page: pageNum, snap }]);
        setRedoStack([]);
    }

    function undo() {
        setUndoStack(prev => {
            if (!prev.length) return prev;
            const last = prev[prev.length - 1];
            setRedoStack(r => [...r.slice(-49), { page: last.page, snap: annRef.current[last.page] ?? [] }]);
            setAnnotations(a => ({ ...a, [last.page]: last.snap }));
            return prev.slice(0, -1);
        });
    }

    function redo() {
        setRedoStack(prev => {
            if (!prev.length) return prev;
            const last = prev[prev.length - 1];
            setUndoStack(u => [...u.slice(-49), { page: last.page, snap: annRef.current[last.page] ?? [] }]);
            setAnnotations(a => ({ ...a, [last.page]: last.snap }));
            return prev.slice(0, -1);
        });
    }

    /* ─── Pointer helpers ──────────────────────────────────────────── */
    function getPos(e: React.MouseEvent<HTMLCanvasElement>): Pt {
        const r = annCanvasRef.current!.getBoundingClientRect();
        const scaleX = annCanvasRef.current!.width / r.width;
        const scaleY = annCanvasRef.current!.height / r.height;
        return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
    }

    function onPointerDown(e: React.MouseEvent<HTMLCanvasElement>) {
        if (!pdfDoc) return;
        e.preventDefault();
        const pos = getPos(e);

        if (tool === 'text') {
            setTextPos(pos);
            setTextInput('');
            return;
        }

        pushUndo(currentPage);
        setIsDrawing(true);
        let ann: Annotation;

        if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
            ann = { id: uid(), tool, color, lineWidth, points: [pos], opacity: 1 };
        } else if (tool === 'rect' || tool === 'circle') {
            ann = { id: uid(), tool, color, lineWidth, x: pos.x, y: pos.y, w: 0, h: 0, opacity: 1 };
        } else if (tool === 'line' || tool === 'arrow') {
            ann = { id: uid(), tool, color, lineWidth, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, opacity: 1 };
        } else {
            return;
        }
        setCurrentAnn(ann);
    }

    function onPointerMove(e: React.MouseEvent<HTMLCanvasElement>) {
        if (!isDrawing || !currentAnn) return;
        const pos = getPos(e);
        let updated: Annotation;

        if ((currentAnn.tool === 'pen' || currentAnn.tool === 'highlighter' || currentAnn.tool === 'eraser') && currentAnn.points) {
            updated = { ...currentAnn, points: [...currentAnn.points, pos] };
        } else if (currentAnn.tool === 'rect' || currentAnn.tool === 'circle') {
            updated = { ...currentAnn, w: pos.x - currentAnn.x!, h: pos.y - currentAnn.y! };
        } else if (currentAnn.tool === 'line' || currentAnn.tool === 'arrow') {
            updated = { ...currentAnn, x2: pos.x, y2: pos.y };
        } else { return; }

        setCurrentAnn(updated);

        const annCanvas = annCanvasRef.current;
        if (!annCanvas) return;
        const ctx = annCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, annCanvas.width, annCanvas.height);
        drawAnnotations(ctx, annRef.current[currentPage] ?? []);
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
        pushUndo(currentPage);
        const ann: Annotation = {
            id: uid(), tool: 'text', color, lineWidth,
            text: textInput, x: textPos.x, y: textPos.y, fontSize, opacity: 1,
        };
        setAnnotations(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] ?? []), ann] }));
        setTextPos(null);
        setTextInput('');
    }

    function clearPage() {
        pushUndo(currentPage);
        setAnnotations(prev => ({ ...prev, [currentPage]: [] }));
    }

    /* ─── Export ───────────────────────────────────────────────────── */
    function exportCurrentPage() {
        const pdfC = pdfCanvasRef.current;
        const annC = annCanvasRef.current;
        if (!pdfC || !annC) return;

        const merged = document.createElement('canvas');
        merged.width = pdfC.width;
        merged.height = pdfC.height;
        const ctx = merged.getContext('2d')!;
        ctx.drawImage(pdfC, 0, 0);
        ctx.drawImage(annC, 0, 0);

        merged.toBlob(blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement('a'), {
                href: url,
                download: `${fileName.replace(/\.pdf$/i, '')}_page${currentPage}.png`,
            });
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            setExportMsg('Page exported as PNG ✓');
            setTimeout(() => setExportMsg(''), 2500);
        }, 'image/png');
    }

    async function exportAllPages() {
        if (!pdfDoc) return;
        setExportMsg('Preparing export…');
        const pages: HTMLCanvasElement[] = [];

        for (let i = 1; i <= numPages; i++) {
            const pdfC = document.createElement('canvas');
            const annC = document.createElement('canvas');
            const pg = await pdfDoc.getPage(i);
            const vp = pg.getViewport({ scale: zoom });
            pdfC.width = annC.width = vp.width;
            pdfC.height = annC.height = vp.height;
            const pdfCtx = pdfC.getContext('2d')!;
            pdfCtx.fillStyle = '#fff';
            pdfCtx.fillRect(0, 0, vp.width, vp.height);
            await pg.render({ canvasContext: pdfCtx, canvas: pdfC, viewport: vp }).promise;
            const annCtx = annC.getContext('2d')!;
            drawAnnotations(annCtx, annRef.current[i] ?? []);

            const merged = document.createElement('canvas');
            merged.width = pdfC.width;
            merged.height = pdfC.height;
            const mCtx = merged.getContext('2d')!;
            mCtx.drawImage(pdfC, 0, 0);
            mCtx.drawImage(annC, 0, 0);
            pages.push(merged);
        }

        // Create a print window
        const w = window.open('', '_blank')!;
        w.document.write(`<html><head><title>${fileName}</title><style>
            body { margin: 0; background: #222; }
            img  { display: block; width: 100%; page-break-after: always; }
        </style></head><body>`);
        pages.forEach(c => w.document.write(`<img src="${c.toDataURL('image/png')}" />`));
        w.document.write('</body></html>');
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 600);
        setExportMsg('Print dialog opened ✓');
        setTimeout(() => setExportMsg(''), 3000);
    }

    /* ─── Styles ───────────────────────────────────────────────────── */
    function toolBtnStyle(active: boolean): React.CSSProperties {
        return {
            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: active ? 'rgba(131,27,132,0.4)' : 'rgba(255,255,255,0.04)',
            color: active ? '#e8e8f2' : 'rgba(180,180,200,0.65)',
            fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            outline: active ? '1.5px solid rgba(131,27,132,0.7)' : 'none',
            transition: 'all 0.15s',
            flexShrink: 0,
            position: 'relative' as const,
        };
    }

    function actionBtn(danger = false): React.CSSProperties {
        return {
            padding: '6px 12px', borderRadius: 8,
            border: `1px solid ${danger ? 'rgba(255,70,70,0.25)' : 'rgba(255,255,255,0.08)'}`,
            background: danger ? 'rgba(255,60,60,0.07)' : 'rgba(255,255,255,0.04)',
            color: danger ? '#ff8888' : 'rgba(180,180,210,0.8)',
            fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
            whiteSpace: 'nowrap' as const,
        };
    }

    /* ─── Cursor ───────────────────────────────────────────────────── */
    function canvasCursor(): string {
        if (!pdfDoc) return 'default';
        switch (tool) {
            case 'text': return 'text';
            case 'eraser': return 'cell';
            case 'select': return 'default';
            default: return 'crosshair';
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: 'fixed', inset: '2%', zIndex: 80,
                display: 'flex', flexDirection: 'column',
                background: 'rgba(8, 8, 15, 0.99)',
                border: '1px solid rgba(131,27,132,0.25)',
                borderRadius: 18, overflow: 'hidden',
                boxShadow: '0 0 100px rgba(131,27,132,0.15), 0 50px 150px rgba(0,0,0,0.95)',
                backdropFilter: 'blur(30px)',
            }}
        >
            {/* ── Title bar ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', padding: '12px 20px', flexShrink: 0,
                borderBottom: '1px solid rgba(131,27,132,0.15)',
                background: 'rgba(131,27,132,0.04)',
                gap: 14,
            }}>
                {/* macOS traffic lights */}
                <div style={{ display: 'flex', gap: 6 }}>
                    {[['#ff5f57', onClose], ['#ffbd2e', null], ['#28ca41', null]].map(([bg, action], i) => (
                        <button
                            key={i}
                            onClick={action as (() => void) || undefined}
                            style={{
                                width: 13, height: 13, borderRadius: '50%',
                                background: bg as string, border: 'none',
                                cursor: action ? 'pointer' : 'default', padding: 0,
                            }}
                        />
                    ))}
                </div>

                <div style={{ width: 1, height: 18, background: 'rgba(131,27,132,0.2)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>📄</span>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: '#e0e0f0', letterSpacing: 1 }}>
                        PDF Editor
                    </span>
                    {fileName && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(131,27,132,0.6)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            — {fileName}
                        </span>
                    )}
                </div>

                {numPages > 0 && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(131,27,132,0.5)', marginLeft: 4 }}>
                        {numPages} pages
                    </span>
                )}

                {/* Export message */}
                <AnimatePresence>
                    {exportMsg && (
                        <motion.span
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#6bcb77', marginLeft: 8 }}
                        >
                            {exportMsg}
                        </motion.span>
                    )}
                </AnimatePresence>

                <div style={{ flex: 1 }} />

                {/* Keyboard shortcut hint */}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(131,27,132,0.35)' }}>
                    Ctrl+Z undo · Ctrl+Y redo
                </span>

                {/* Close X */}
                <button
                    onClick={onClose}
                    style={{
                        width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)',
                        background: 'transparent', color: 'rgba(180,180,200,0.5)',
                        cursor: 'pointer', fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.15)'; e.currentTarget.style.color = '#ff7070'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(180,180,200,0.5)'; }}
                >✕</button>
            </div>

            {/* ── Drop zone (no PDF loaded) ──────────────────────────── */}
            {!pdfDoc && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div
                        animate={isDragOver ? { scale: 1.03, borderColor: '#831B84' } : { scale: 1, borderColor: 'rgba(131,27,132,0.3)' }}
                        transition={{ duration: 0.2 }}
                        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={e => {
                            e.preventDefault(); setIsDragOver(false);
                            const f = e.dataTransfer.files[0];
                            if (f) loadPdf(f);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: 500, maxWidth: '90%',
                            padding: '70px 50px',
                            border: '2px dashed rgba(131,27,132,0.3)',
                            borderRadius: 20, cursor: 'pointer', textAlign: 'center',
                            background: isDragOver ? 'rgba(131,27,132,0.06)' : 'transparent',
                            transition: 'background 0.2s',
                        }}
                    >
                        <input
                            ref={fileInputRef} type="file" accept="application/pdf"
                            style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) loadPdf(f); }}
                        />
                        {loading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                style={{ fontSize: 48, display: 'inline-block', marginBottom: 20 }}
                            >⟳</motion.div>
                        ) : (
                            <div style={{ fontSize: 64, marginBottom: 20, opacity: isDragOver ? 0.9 : 0.4 }}>📄</div>
                        )}
                        <div style={{ fontSize: 20, color: isDragOver ? '#e0e0f2' : 'rgba(180,180,210,0.8)', fontWeight: 600, marginBottom: 10 }}>
                            {loading ? 'Loading PDF…' : 'Drop a PDF here or click to browse'}
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'rgba(131,27,132,0.45)' }}>
                            Supports multi-page PDFs · All editing is in-browser · No upload required
                        </div>
                        {loadError && (
                            <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 12, color: '#ff8888', background: 'rgba(255,80,80,0.07)', padding: '8px 14px', borderRadius: 8 }}>
                                {loadError}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* ── Main editor layout ────────────────────────────────── */}
            {pdfDoc && (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

                    {/* ── Left tool sidebar ── */}
                    <div style={{
                        width: 56, borderRight: '1px solid rgba(131,27,132,0.12)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '12px 8px', gap: 6, background: 'rgba(5,5,12,0.8)',
                        flexShrink: 0, overflowY: 'auto',
                    }}>
                        {TOOLS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTool(t.id)}
                                style={toolBtnStyle(tool === t.id)}
                                title={`${t.label} (${t.shortcut})`}
                            >
                                {t.icon}
                            </button>
                        ))}

                        {/* Divider */}
                        <div style={{ width: 28, height: 1, background: 'rgba(131,27,132,0.2)', margin: '6px 0' }} />

                        {/* Color dots */}
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                style={{
                                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                                    background: c, border: color === c ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.12)',
                                    cursor: 'pointer', transition: 'transform 0.12s',
                                    transform: color === c ? 'scale(1.18)' : 'scale(1)',
                                }}
                            />
                        ))}

                        {/* Custom color */}
                        <input
                            type="color" value={color} onChange={e => setColor(e.target.value)}
                            title="Custom color"
                            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                        />

                        {/* Divider */}
                        <div style={{ width: 28, height: 1, background: 'rgba(131,27,132,0.2)', margin: '4px 0' }} />

                        {/* Stroke width indicator */}
                        <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(131,27,132,0.5)', fontFamily: 'var(--mono)' }}>W</div>
                        <input
                            type="range" min={1} max={24} value={lineWidth}
                            onChange={e => setLineWidth(+e.target.value)}
                            style={{
                                writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
                                direction: 'rtl',
                                width: 6, height: 80,
                                accentColor: '#831B84', cursor: 'pointer',
                            }}
                            title={`Stroke width: ${lineWidth}`}
                        />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#831B84' }}>{lineWidth}</span>

                        {tool === 'text' && (
                            <>
                                <div style={{ width: 28, height: 1, background: 'rgba(131,27,132,0.2)', margin: '4px 0' }} />
                                <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(131,27,132,0.5)', fontFamily: 'var(--mono)' }}>Sz</div>
                                <input
                                    type="range" min={10} max={72} value={fontSize}
                                    onChange={e => setFontSize(+e.target.value)}
                                    style={{
                                        writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
                                        direction: 'rtl',
                                        width: 6, height: 70,
                                        accentColor: '#831B84', cursor: 'pointer',
                                    }}
                                />
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#831B84' }}>{fontSize}</span>
                            </>
                        )}
                    </div>

                    {/* ── Thumbnail sidebar ── */}
                    {showThumbs && (
                        <div style={{
                            width: 120, borderRight: '1px solid rgba(131,27,132,0.1)',
                            overflowY: 'auto', padding: '10px 8px',
                            display: 'flex', flexDirection: 'column', gap: 8,
                            flexShrink: 0, background: 'rgba(4,4,10,0.7)',
                        }}>
                            {Array.from({ length: numPages }, (_, idx) => idx + 1).map(n => (
                                <div
                                    key={n}
                                    onClick={() => setCurrentPage(n)}
                                    style={{
                                        cursor: 'pointer', borderRadius: 6, overflow: 'hidden',
                                        border: `2px solid ${n === currentPage ? '#831B84' : 'rgba(131,27,132,0.1)'}`,
                                        transition: 'border-color 0.15s',
                                        background: '#111', position: 'relative', flexShrink: 0,
                                        boxShadow: n === currentPage ? '0 0 12px rgba(131,27,132,0.3)' : 'none',
                                    }}
                                >
                                    <canvas ref={el => { thumbRefs.current[n - 1] = el; }} style={{ width: '100%', display: 'block' }} />
                                    <div style={{
                                        position: 'absolute', bottom: 2, right: 3,
                                        fontFamily: 'var(--mono)', fontSize: 8,
                                        color: n === currentPage ? '#c060d0' : 'rgba(150,150,170,0.5)',
                                        background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: 3,
                                    }}>{n}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Center canvas area ── */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                        {/* Top toolbar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 14px', flexShrink: 0,
                            borderBottom: '1px solid rgba(131,27,132,0.12)',
                            background: 'rgba(6,6,14,0.95)',
                            overflowX: 'auto',
                        }}>
                            {/* Page nav */}
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                                style={{ ...actionBtn(), opacity: currentPage <= 1 ? 0.3 : 1 }}
                            >‹ Prev</button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input
                                    type="number" min={1} max={numPages} value={currentPage}
                                    onChange={e => setCurrentPage(Math.max(1, Math.min(numPages, +e.target.value)))}
                                    style={{
                                        width: 44, textAlign: 'center',
                                        background: 'rgba(131,27,132,0.1)',
                                        border: '1px solid rgba(131,27,132,0.22)',
                                        borderRadius: 7, padding: '4px 6px',
                                        color: '#e0e0f0', fontFamily: 'var(--mono)',
                                        fontSize: 12, outline: 'none',
                                    }}
                                />
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'rgba(131,27,132,0.55)' }}>/ {numPages}</span>
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                                disabled={currentPage >= numPages}
                                style={{ ...actionBtn(), opacity: currentPage >= numPages ? 0.3 : 1 }}
                            >Next ›</button>

                            <div style={{ width: 1, height: 24, background: 'rgba(131,27,132,0.18)', flexShrink: 0 }} />

                            {/* Zoom */}
                            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} style={actionBtn()}>−</button>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(131,27,132,0.6)', minWidth: 40, textAlign: 'center' }}>
                                {Math.round(zoom * 100)}%
                            </span>
                            <button onClick={() => setZoom(z => Math.min(4, z + 0.15))} style={actionBtn()}>+</button>
                            <button onClick={() => setZoom(1.3)} style={actionBtn()} title="Reset zoom">⟳</button>

                            <div style={{ width: 1, height: 24, background: 'rgba(131,27,132,0.18)', flexShrink: 0 }} />

                            {/* Undo / Redo */}
                            <button onClick={undo} disabled={!undoStack.length} style={{ ...actionBtn(), opacity: !undoStack.length ? 0.3 : 1 }} title="Undo (Ctrl+Z)">↩ Undo</button>
                            <button onClick={redo} disabled={!redoStack.length} style={{ ...actionBtn(), opacity: !redoStack.length ? 0.3 : 1 }} title="Redo (Ctrl+Y)">↪ Redo</button>
                            <button onClick={clearPage} style={actionBtn(true)} title="Clear all annotations on this page">🗑 Clear</button>

                            <div style={{ width: 1, height: 24, background: 'rgba(131,27,132,0.18)', flexShrink: 0 }} />

                            {/* Export */}
                            <button onClick={exportCurrentPage} style={actionBtn()} title="Export this page as PNG">⬇ Page PNG</button>
                            <button onClick={exportAllPages} style={actionBtn()} title="Print all pages as PDF">🖨 Print PDF</button>

                            {/* Load new file */}
                            <button onClick={() => fileInputRef.current?.click()} style={actionBtn()} title="Open another PDF">📂 Open</button>
                            <input
                                ref={fileInputRef} type="file" accept="application/pdf"
                                style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) loadPdf(f); }}
                            />

                            <div style={{ width: 1, height: 24, background: 'rgba(131,27,132,0.18)', flexShrink: 0 }} />

                            {/* Toggle thumbnails */}
                            <button onClick={() => setShowThumbs(v => !v)} style={actionBtn()}>
                                {showThumbs ? '◧ Hide' : '◧ Pages'}
                            </button>
                        </div>

                        {/* Canvas scroll area */}
                        <div style={{
                            flex: 1, overflow: 'auto',
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                            padding: '24px',
                            background: 'rgba(4,4,10,0.7)',
                        }}>
                            <div style={{ position: 'relative', boxShadow: '0 12px 60px rgba(0,0,0,0.8)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                                {/* PDF layer */}
                                <canvas
                                    ref={pdfCanvasRef}
                                    style={{ display: 'block', userSelect: 'none', maxWidth: '100%' }}
                                />
                                {/* Annotation layer */}
                                <canvas
                                    ref={annCanvasRef}
                                    style={{
                                        position: 'absolute', inset: 0, display: 'block',
                                        cursor: canvasCursor(),
                                        touchAction: 'none',
                                    }}
                                    onMouseDown={onPointerDown}
                                    onMouseMove={onPointerMove}
                                    onMouseUp={onPointerUp}
                                    onMouseLeave={onPointerUp}
                                />
                                {/* Text input overlay */}
                                {textPos && (
                                    <div style={{ position: 'absolute', left: textPos.x, top: textPos.y - fontSize, zIndex: 30 }}>
                                        <input
                                            autoFocus
                                            value={textInput}
                                            onChange={e => setTextInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextPos(null); }}
                                            onBlur={commitText}
                                            placeholder="Type text…"
                                            style={{
                                                background: 'rgba(0,0,0,0.75)',
                                                border: '1px solid #831B84',
                                                color: color, fontSize: fontSize,
                                                fontFamily: "'Space Grotesk', sans-serif",
                                                padding: '4px 8px', outline: 'none',
                                                borderRadius: 5, minWidth: 140,
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status bar */}
                        <div style={{
                            padding: '6px 16px',
                            display: 'flex', alignItems: 'center', gap: 16,
                            borderTop: '1px solid rgba(131,27,132,0.1)',
                            background: 'rgba(4,4,10,0.9)',
                            fontSize: 11, fontFamily: 'var(--mono)',
                            color: 'rgba(131,27,132,0.45)',
                            flexShrink: 0,
                        }}>
                            <span>Tool: <span style={{ color: '#9040a8' }}>{tool.toUpperCase()}</span></span>
                            <span>Color: <span style={{ color }}>{color}</span></span>
                            <span>Stroke: <span style={{ color: '#9040a8' }}>{lineWidth}px</span></span>
                            {tool === 'text' && <span>Font: <span style={{ color: '#9040a8' }}>{fontSize}px</span></span>}
                            <span>Zoom: <span style={{ color: '#9040a8' }}>{Math.round(zoom * 100)}%</span></span>
                            <span>Page: <span style={{ color: '#9040a8' }}>{currentPage}/{numPages}</span></span>
                            <span style={{ marginLeft: 'auto' }}>Annotations on page: <span style={{ color: '#9040a8' }}>{(annotations[currentPage] ?? []).length}</span></span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
