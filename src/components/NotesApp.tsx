'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';
import { asBlob } from 'html-docx-js-typescript';
import { Cloud, Link as LinkIcon, Download, FileText, Mail, ArrowLeft, Settings, Image as ImageIcon, Palette, Check, Plus } from 'lucide-react';
import 'suneditor/dist/css/suneditor.min.css';

(pdfMake as any).vfs = pdfFonts;

const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false });

interface NotesAppProps {
    onClose: () => void;
    userName: string;
}

type Tab = 'notes' | 'kanban';
type Status = string;

interface Note {
    id: string;
    title: string;
    content: string;
    date: string;
}

interface Todo {
    id: string;
    text: string;
    status: Status;
}

interface Column {
    id: string;
    label: string;
    color: string;
}

interface KanbanBoard {
    id: string;
    name: string;
    tasks: Todo[];
    bgImage?: string;
    columns?: Column[];
}

const DEFAULT_STATUSES: Column[] = [
    { id: 'backlog', label: 'Backlog', color: '#94a3b8' },
    { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
    { id: 'on-hold', label: 'On Hold', color: '#f59e0b' },
    { id: 'review', label: 'Review', color: '#8b5cf6' },
    { id: 'ready', label: 'Ready', color: '#14b8a6' },
    { id: 'done', label: 'Done', color: '#10b981' }
];

const PREBUILT_BGS = [
    'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506744626753-dba37c1fb41a?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80'
];

export function NotesApp({ onClose, userName }: NotesAppProps) {
    const [activeTab, setActiveTab] = useState<Tab>('notes');

    const NOTES_KEY = `lab_notes_${userName}`;
    const TODOS_KEY = `lab_todos_${userName}`;

    // Notes state
    const [notes, setNotes] = useState<Note[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(NOTES_KEY);
            if (saved) {
                try { return JSON.parse(saved); } catch { }
            }
        }
        return [];
    });

    // We derive active note state down below but need to store the IDs
    const [activeNoteId, setActiveNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null);
    const [noteTitle, setNoteTitle] = useState(notes.length > 0 ? notes[0].title : '');
    const [noteContent, setNoteContent] = useState(notes.length > 0 ? notes[0].content : '');

    // Kanban state
    const [boards, setBoards] = useState<KanbanBoard[]>(() => {
        if (typeof window !== 'undefined') {
            const savedTodos = localStorage.getItem(TODOS_KEY);
            if (savedTodos) {
                try {
                    const parsed = JSON.parse(savedTodos);
                    if (parsed.boards && Array.isArray(parsed.boards)) return parsed.boards;
                    if (Array.isArray(parsed)) {
                        return [{
                            id: 'default', name: 'Main Project', tasks: parsed.map((t: any) => ({
                                ...t, status: t.status === 'todo' ? 'backlog' : (t.status || (t.done ? 'done' : 'backlog'))
                            }))
                        }];
                    }
                } catch { }
            }
        }
        return [{ id: 'default', name: 'Main Project', tasks: [] }];
    });

    const [activeBoardId, setActiveBoardId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            const savedTodos = localStorage.getItem(TODOS_KEY);
            if (savedTodos) {
                try {
                    const parsed = JSON.parse(savedTodos);
                    if (parsed.activeBoardId !== undefined) return parsed.activeBoardId;
                } catch { }
            }
        }
        return null;
    });

    const [newTodo, setNewTodo] = useState('');
    const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardBg, setNewBoardBg] = useState(PREBUILT_BGS[0]);
    const [newBoardColsType, setNewBoardColsType] = useState<'default' | 'custom'>('default');
    const [newBoardCustomCols, setNewBoardCustomCols] = useState('To Do, Doing, Done');

    const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
    const [editBoardName, setEditBoardName] = useState('');
    const [editBoardBg, setEditBoardBg] = useState('');
    const [editBoardColsType, setEditBoardColsType] = useState<'default' | 'custom'>('default');
    const [editBoardCustomCols, setEditBoardCustomCols] = useState('');
    const [deleteBoardConfirm, setDeleteBoardConfirm] = useState('');

    // Share Modal state
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Download Modal state
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

    // Auto-save state
    const [isSaving, setIsSaving] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Save data whenever it changes
    useEffect(() => {
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    }, [notes, NOTES_KEY]);

    useEffect(() => {
        localStorage.setItem(TODOS_KEY, JSON.stringify({ activeBoardId, boards }));
    }, [boards, activeBoardId, TODOS_KEY]);

    // Note actions
    function createNote() {
        // Find if there's an already empty untitled note to avoid spamming
        const existingEmpty = notes.find(n => n.title === '' && n.content === '');
        if (existingEmpty) {
            selectNote(existingEmpty.id);
            return;
        }


        const newNote: Note = {

            id: crypto.randomUUID(),
            title: '', // explicitly start empty
            content: '',

            date: new Date().toLocaleDateString()
        };
        setNotes([newNote, ...notes]);
        selectNote(newNote.id);
    }

    function selectNote(id: string) {
        const note = notes.find(n => n.id === id);
        if (note) {
            setActiveNoteId(id);
            setNoteTitle(note.title);
            setNoteContent(note.content);
        }
    }

    function saveActiveNote() {
        if (!activeNoteId) return;
        setNotes(prev => prev.map(n =>
            n.id === activeNoteId ? { ...n, title: noteTitle, content: noteContent } : n
        ));
    }

    const handleAutoSave = useCallback((content: string, title: string, id: string | null) => {
        if (!id) return;
        setIsSaving(true);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            setNotes(prev => prev.map(n =>
                n.id === id ? { ...n, title: title, content: content } : n
            ));
            setIsSaving(false);
        }, 1000);
    }, []);

    function deleteNote(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        const updated = notes.filter(n => n.id !== id);
        setNotes(updated);
        if (activeNoteId === id) {
            if (updated.length > 0) {
                selectNote(updated[0].id);
            } else {
                setActiveNoteId(null);
                setNoteTitle('');
                setNoteContent('');
            }
        }
    }

    const handleDownloadPdf = () => {
        if (!activeNoteId) return;
        const note = notes.find(n => n.id === activeNoteId);
        if (!note) return;

        const html = htmlToPdfmake(noteContent, { window: window as any });
        const docDefinition = {
            content: [
                { text: note.title || 'Untitled', fontSize: 24, bold: true, margin: [0, 0, 0, 20] },
                html
            ]
        };

        pdfMake.createPdf(docDefinition as any).download(`${note.title || 'note'}.pdf`);
        setIsDownloadModalOpen(false);
        setIsShareModalOpen(false);
    };

    const handleDownloadDocx = () => {
        if (!activeNoteId) return;
        const note = notes.find(n => n.id === activeNoteId);
        if (!note) return;

        const htmlString = `
            <!DOCTYPE html>
            <html>
                <head><title>${note.title || 'Untitled'}</title></head>
                <body>
                    <h1>${note.title || 'Untitled'}</h1>
                    ${noteContent}
                </body>
            </html>
        `;

        asBlob(htmlString).then(data => {
            const url = URL.createObjectURL(data as Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${note.title || 'note'}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        setIsDownloadModalOpen(false);
        setIsShareModalOpen(false);
    };

    const handleShareEmail = () => {
        if (!activeNoteId) return;
        saveActiveNote();
        const note = notes.find(n => n.id === activeNoteId);
        if (!note) return;
        const stripHtml = (html: string) => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        };
        const textContent = stripHtml(noteContent);
        window.location.href = `mailto:?subject=${encodeURIComponent(note.title)}&body=${encodeURIComponent(textContent)}`;
        setIsShareModalOpen(false);
    };

    const handleShareLink = () => {
        if (!activeNoteId) return;
        navigator.clipboard.writeText(`${window.location.origin}?note=${activeNoteId}`);
        alert('Link copied to clipboard!');
        setIsShareModalOpen(false);
    };

    // Kanban actions
    const activeBoardIndex = activeBoardId ? boards.findIndex(b => b.id === activeBoardId) : -1;
    const activeBoard = activeBoardIndex >= 0 ? boards[activeBoardIndex] : null;
    const activeColumns = activeBoard?.columns || DEFAULT_STATUSES;

    function handleCreateBoard() {
        if (!newBoardName.trim()) return;
        let cols: Column[] | undefined = undefined;
        if (newBoardColsType === 'custom') {
            const labels = newBoardCustomCols.split(',').map(s => s.trim()).filter(Boolean);
            if (labels.length > 0) {
                const colors = ['#94a3b8', '#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6', '#10b981', '#ef4444', '#ec4899'];
                cols = labels.map((label, i) => ({
                    id: label.toLowerCase().replace(/\s+/g, '-'),
                    label,
                    color: colors[i % colors.length]
                }));
            }
        }

        const newBoard: KanbanBoard = {

            id: crypto.randomUUID(),
            name: newBoardName.trim(),
            tasks: [],
            bgImage: newBoardBg,
            columns: cols
        };
        setBoards([...boards, newBoard]);
        setActiveBoardId(newBoard.id);
        setNewBoardName('');
        setIsCreateBoardModalOpen(false);
    }

    function openEditBoardModal() {
        if (!activeBoard) return;
        setEditBoardName(activeBoard.name);
        setEditBoardBg(activeBoard.bgImage || '');
        if (activeBoard.columns === undefined || activeBoard.columns.length === 0 || activeBoard.columns.every((c, i) => DEFAULT_STATUSES[i] && c.id === DEFAULT_STATUSES[i].id)) {
            setEditBoardColsType('default');
            setEditBoardCustomCols('To Do, Doing, Done');
        } else {
            setEditBoardColsType('custom');
            setEditBoardCustomCols(activeBoard.columns.map(c => c.label).join(', '));
        }
        setDeleteBoardConfirm('');
        setIsEditBoardModalOpen(true);
    }

    function handleEditBoard() {
        if (!editBoardName.trim() || !activeBoardId) return;
        let cols: Column[] | undefined = undefined;
        if (editBoardColsType === 'custom') {
            const labels = editBoardCustomCols.split(',').map(s => s.trim()).filter(Boolean);
            if (labels.length > 0) {
                const colors = ['#94a3b8', '#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6', '#10b981', '#ef4444', '#ec4899'];
                cols = labels.map((label, i) => ({
                    id: label.toLowerCase().replace(/\s+/g, '-'),
                    label,
                    color: colors[i % colors.length]
                }));
            }
        }
        setBoards(prev => prev.map(b => b.id === activeBoardId ? {
            ...b,
            name: editBoardName.trim(),
            bgImage: editBoardBg,
            columns: cols
        } : b));
        setIsEditBoardModalOpen(false);
    }

    function handleDeleteBoard() {
        if (!activeBoardId || deleteBoardConfirm !== activeBoard?.name) return;
        setBoards(prev => prev.filter(b => b.id !== activeBoardId));
        setActiveBoardId(null);
        setIsEditBoardModalOpen(false);
    }

    function addTodo(e: React.KeyboardEvent, statusId: string) {
        if (e.key === 'Enter' && newTodo.trim() && activeBoard) {

            const newTask: Todo = { id: crypto.randomUUID(), text: newTodo.trim(), status: statusId };
            setBoards(prev => {
                const updated = [...prev];
                updated[activeBoardIndex] = { ...activeBoard, tasks: [newTask, ...activeBoard.tasks] };
                return updated;
            });
            setNewTodo('');
        }
    }

    function deleteTodo(id: string) {
        if (activeBoardIndex < 0) return;
        setBoards(prev => {
            const updated = [...prev];
            updated[activeBoardIndex] = { ...activeBoard!, tasks: activeBoard!.tasks.filter(t => t.id !== id) };
            return updated;
        });
    }

    // Drag and Drop implementation
    function handleDragStart(e: React.DragEvent, id: string) {
        e.dataTransfer.setData('text/plain', id);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    }

    function handleDragEnd(e: React.DragEvent) {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
    }

    function handleDrop(e: React.DragEvent, statusId: string) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (activeBoardIndex < 0) return;
        setBoards(prev => {
            const updated = [...prev];
            updated[activeBoardIndex] = {
                ...activeBoard!,
                tasks: activeBoard!.tasks.map(t => t.id === id ? { ...t, status: statusId } : t)
            };
            return updated;
        });
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault(); // Necessary to allow dropping
    }

    const tabBtn = (tab: Tab, label: string, icon: string) => (
        <button
            onClick={() => setActiveTab(tab)}
            style={{
                padding: '8px 16px', background: activeTab === tab ? 'var(--brand)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: activeTab === tab ? 600 : 500,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
        >
            <span>{icon}</span> {label}
        </button>
    );

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
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', height: 60, flexShrink: 0,
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                    }}>🛹</div>
                    <div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>Broski Board</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>Synched to local memory</span>
                    </div>
                </div>

                {/* Centered Tabs */}
                <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'center' }}>
                    {tabBtn('notes', 'Notes', '📝')}
                    {tabBtn('kanban', 'Kanban', '📋')}
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

            {/* Main Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {activeTab === 'notes' && (
                    <>
                        {/* Sidebar for Notes */}
                        <div style={{ width: 300, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                                <button
                                    onClick={createNote}
                                    style={{
                                        width: '100%', padding: '12px', background: 'var(--bg-subtle)',
                                        border: '1px dashed var(--border-strong)', borderRadius: 8,
                                        color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        marginBottom: 16, transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                >
                                    + Create Note
                                </button>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {notes.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>No notes yet.</div>
                                    ) : (
                                        notes.map(note => (
                                            <div
                                                key={note.id}
                                                onClick={() => selectNote(note.id)}
                                                style={{
                                                    padding: '12px', borderRadius: 8, cursor: 'pointer',
                                                    background: activeNoteId === note.id ? 'var(--bg-card)' : 'transparent',
                                                    border: `1px solid ${activeNoteId === note.id ? 'var(--brand)' : 'transparent'}`,
                                                    boxShadow: activeNoteId === note.id ? 'var(--shadow-sm)' : 'none',
                                                    transition: 'all 0.15s',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}
                                            >
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {note.title || 'Untitled'}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note.date}</div>
                                                </div>
                                                <button
                                                    onClick={(e) => deleteNote(note.id, e)}
                                                    style={{
                                                        background: 'transparent', border: 'none', color: '#d32f2f',
                                                        cursor: 'pointer', fontSize: 16, padding: '4px', opacity: activeNoteId === note.id ? 1 : 0.4
                                                    }}
                                                    title="Delete this note"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Editor for Notes */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
                            {activeNoteId ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 40px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <input
                                            type="text"
                                            placeholder="Note Title"
                                            value={noteTitle}
                                            onChange={e => { setNoteTitle(e.target.value); saveActiveNote(); }}
                                            onBlur={saveActiveNote}
                                            style={{
                                                fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
                                                background: 'transparent', border: 'none', outline: 'none', width: '100%'
                                            }}
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
                                            {/* Save Status */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isSaving ? 1 : 0.6, transition: 'all 0.2s' }}>
                                                {isSaving ? (
                                                    <div style={{ width: 80, height: 4, background: 'var(--bg-subtle)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                                                        <motion.div
                                                            initial={{ x: '-100%' }}
                                                            animate={{ x: '100%' }}
                                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                            style={{ width: '100%', height: '100%', background: 'var(--brand)', position: 'absolute', top: 0, left: 0 }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <Cloud size={16} color="var(--text-muted)" />
                                                )}
                                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                                                    {isSaving ? 'Saving...' : 'Saved'}
                                                </span>
                                            </div>

                                            {/* Share Button & Modal Wrapper */}
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={() => setIsShareModalOpen(!isShareModalOpen)}
                                                    style={{
                                                        padding: '8px 16px', background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                                                        border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                                >
                                                    <LinkIcon size={14} /> Share
                                                </button>

                                                <AnimatePresence>
                                                    {isShareModalOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            transition={{ duration: 0.15 }}
                                                            style={{
                                                                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                                                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                                                borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                                                                width: 200, zIndex: 100
                                                            }}
                                                        >
                                                            <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column' }}>
                                                                <div style={{ position: 'relative' }}>
                                                                    <button onClick={() => setIsDownloadModalOpen(!isDownloadModalOpen)} style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                        <Download size={14} /> Download
                                                                    </button>
                                                                    <AnimatePresence>
                                                                        {isDownloadModalOpen && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, x: -10 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                exit={{ opacity: 0, x: -10 }}
                                                                                transition={{ duration: 0.15 }}
                                                                                style={{
                                                                                    position: 'absolute', top: 0, right: '100%', marginRight: 8,
                                                                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                                                                    borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                                                                                    width: 160, zIndex: 110, overflow: 'hidden'
                                                                                }}
                                                                            >
                                                                                <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column' }}>
                                                                                    <button onClick={handleDownloadPdf} style={{ padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                                        <FileText size={14} /> .PDF
                                                                                    </button>
                                                                                    <button onClick={handleDownloadDocx} style={{ padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                                        <FileText size={14} /> .DOCX
                                                                                    </button>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                                <button onClick={handleShareEmail} style={{ padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                    <Mail size={14} /> Share via Email
                                                                </button>
                                                                <button onClick={handleShareLink} style={{ padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                    <LinkIcon size={14} /> Copy Link
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', padding: '12px' }}>
                                        <SunEditor
                                            key={activeNoteId}
                                            defaultValue={noteContent}
                                            onChange={(content) => { setNoteContent(content); handleAutoSave(content, noteTitle, activeNoteId); }}
                                            height="100%"
                                            setDefaultStyle="font-family: inherit; font-size: 15px; background: transparent; color: var(--text-primary);"
                                            setOptions={{
                                                buttonList: [
                                                    ['undo', 'redo'],
                                                    ['formatBlock', 'font', 'fontSize'],
                                                    ['bold', 'underline', 'italic', 'strike', 'fontColor', 'hiliteColor'],
                                                    ['removeFormat'],
                                                    ['outdent', 'indent', 'align', 'list', 'horizontalRule'],
                                                    ['table', 'link']
                                                ],
                                                minHeight: '400px',
                                                resizingBar: false
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, flexDirection: 'column', gap: 12 }}>
                                    <div style={{ fontSize: 40 }}>🖊️</div>
                                    Select a note or create a new one to begin typing.
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'kanban' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
                        {!activeBoardId ? (
                            // LAUNCHPAD UI
                            <div style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                    <div>
                                        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>Launchpad</h2>
                                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Select a board to get started or create a new one.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCreateBoardModalOpen(true)}
                                        style={{ padding: '8px 16px', background: 'var(--brand)', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(57, 224, 121, 0.25)' }}
                                    >
                                        <Plus size={16} /> New Board
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                                    {boards.map(b => (
                                        <div
                                            key={b.id}
                                            onClick={() => setActiveBoardId(b.id)}
                                            style={{
                                                height: 160, borderRadius: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                                background: b.bgImage ? `url(${b.bgImage}) center/cover no-repeat` : 'var(--bg-card)',
                                                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                                        >
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1))' }} />
                                            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                                                <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{b.name}</h3>
                                                <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 100, marginTop: 8 }}>
                                                    {b.tasks.length} Task{b.tasks.length !== 1 && 's'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <AnimatePresence>
                                    {isCreateBoardModalOpen && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} style={{ background: 'var(--bg-card)', padding: '32px 40px', borderRadius: 24, width: '100%', maxWidth: 540, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                                                <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Create New Board</h2>

                                                <label style={{ display: 'block', marginBottom: 20 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Board Name</div>
                                                    <input type="text" value={newBoardName} onChange={e => setNewBoardName(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} placeholder="e.g. Project Alpha" onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                                </label>

                                                <label style={{ display: 'block', marginBottom: 20 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}><ImageIcon size={14} /> Background Details</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                                                        {PREBUILT_BGS.map(bg => (
                                                            <div key={bg} onClick={() => setNewBoardBg(bg)} style={{ height: 64, borderRadius: 8, background: `url(${bg}) center/cover`, cursor: 'pointer', border: newBoardBg === bg ? '2px solid var(--brand)' : '2px solid transparent', boxShadow: newBoardBg === bg ? '0 0 0 2px var(--bg-card) inset' : 'none', opacity: newBoardBg === bg ? 1 : 0.6, transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => { if (newBoardBg !== bg) e.currentTarget.style.opacity = '0.6'; }} />
                                                        ))}
                                                    </div>
                                                    <input type="text" value={newBoardBg} onChange={e => setNewBoardBg(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} placeholder="Or paste an image web URL..." onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                                </label>

                                                <label style={{ display: 'block', marginBottom: 32 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}><Palette size={14} /> Workflow Columns</div>
                                                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}><input type="radio" checked={newBoardColsType === 'default'} onChange={() => setNewBoardColsType('default')} style={{ accentColor: 'var(--brand)' }} /> Default (Agile)</label>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}><input type="radio" checked={newBoardColsType === 'custom'} onChange={() => setNewBoardColsType('custom')} style={{ accentColor: 'var(--brand)' }} /> Custom Steps</label>
                                                    </div>
                                                    {newBoardColsType === 'custom' && (
                                                        <input type="text" value={newBoardCustomCols} onChange={e => setNewBoardCustomCols(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} placeholder="Comma separated strings: To Do, Doing, Done" onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                                    )}
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
                            // ACTIVE BOARD UI
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: activeBoard?.bgImage ? `url(${activeBoard?.bgImage}) center/cover fixed` : 'var(--bg)', position: 'relative' }}>
                                {/* Top Bar overlay */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: activeBoard?.bgImage ? 'rgba(0,0,0,0.6)' : 'var(--bg)', backdropFilter: activeBoard?.bgImage ? 'blur(12px)' : 'none', borderBottom: activeBoard?.bgImage ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)', zIndex: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <button onClick={() => setActiveBoardId(null)} style={{ background: activeBoard?.bgImage ? 'rgba(255,255,255,0.15)' : 'var(--bg-subtle)', color: activeBoard?.bgImage ? '#fff' : 'var(--text-primary)', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = activeBoard?.bgImage ? 'rgba(255,255,255,0.25)' : 'var(--border)'} onMouseLeave={e => e.currentTarget.style.background = activeBoard?.bgImage ? 'rgba(255,255,255,0.15)' : 'var(--bg-subtle)'}>
                                            <ArrowLeft size={16} /> Back
                                        </button>
                                        <h2 style={{ margin: 0, color: activeBoard?.bgImage ? '#fff' : 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>{activeBoard?.name}</h2>
                                    </div>
                                    <button onClick={openEditBoardModal} style={{ background: 'transparent', color: activeBoard?.bgImage ? '#fff' : 'var(--text-primary)', border: activeBoard?.bgImage ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--border)', padding: '8px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = activeBoard?.bgImage ? 'rgba(255,255,255,0.1)' : 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Edit Board">
                                        <Settings size={16} />
                                    </button>
                                </div>
                                {/* Board Columns */}
                                <div style={{ flex: 1, display: 'flex', padding: 24, gap: 24, overflowX: 'auto', alignItems: 'flex-start' }}>
                                    {activeColumns.map((col, index) => (
                                        <div
                                            key={col.id}
                                            onDrop={e => handleDrop(e, col.id)}
                                            onDragOver={handleDragOver}
                                            style={{
                                                flex: '0 0 300px', background: activeBoard?.bgImage ? 'rgba(18, 18, 18, 0.75)' : 'var(--bg-card)', backdropFilter: activeBoard?.bgImage ? 'blur(16px)' : 'none', borderRadius: 16,
                                                border: activeBoard?.bgImage ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                                                maxHeight: '100%', boxShadow: 'var(--shadow-md)',
                                            }}
                                        >
                                            <div style={{ padding: '16px', borderBottom: activeBoard?.bgImage ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: activeBoard?.bgImage ? '#fff' : 'var(--text-primary)', flexShrink: 0 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                                                {col.label}
                                                <span style={{ marginLeft: 'auto', background: activeBoard?.bgImage ? 'rgba(255,255,255,0.15)' : 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 100, fontSize: 11, color: activeBoard?.bgImage ? '#e0e0e0' : 'var(--text-secondary)' }}>
                                                    {activeBoard?.tasks.filter(t => t.status === col.id).length || 0}
                                                </span>
                                            </div>
                                            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                                                {index === 0 && (
                                                    <input
                                                        type="text"
                                                        placeholder="+ Add new task..."
                                                        value={newTodo}
                                                        onChange={e => setNewTodo(e.target.value)}
                                                        onKeyDown={e => addTodo(e, col.id)}
                                                        style={{
                                                            padding: '12px', borderRadius: 8, border: activeBoard?.bgImage ? '1px dashed rgba(255,255,255,0.3)' : '1px dashed var(--border-strong)',
                                                            background: 'transparent', outline: 'none', color: activeBoard?.bgImage ? '#fff' : 'var(--text-primary)', fontSize: 13, flexShrink: 0, transition: 'all 0.15s'
                                                        }}
                                                        onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.background = activeBoard?.bgImage ? 'rgba(255,255,255,0.05)' : 'var(--bg-subtle)'; }}
                                                        onBlur={e => { e.target.style.borderColor = activeBoard?.bgImage ? 'rgba(255,255,255,0.3)' : 'var(--border-strong)'; e.target.style.background = 'transparent'; }}
                                                    />
                                                )}
                                                {activeBoard?.tasks.filter(t => t.status === col.id).map(todo => (
                                                    <div
                                                        key={todo.id}
                                                        draggable
                                                        onDragStart={e => handleDragStart(e, todo.id)}
                                                        onDragEnd={handleDragEnd}
                                                        style={{
                                                            padding: '14px', background: activeBoard?.bgImage ? 'rgba(255,255,255,0.05)' : 'var(--bg)', borderRadius: 8,
                                                            border: activeBoard?.bgImage ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)', cursor: 'grab',
                                                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                                            boxShadow: 'var(--shadow-sm)', transition: 'transform 0.15s', flexShrink: 0
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; if (activeBoard?.bgImage) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; if (activeBoard?.bgImage) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                                    >
                                                        <span style={{ fontSize: 13, color: activeBoard?.bgImage ? '#fff' : 'var(--text-primary)', lineHeight: 1.4, wordBreak: 'break-word', paddingRight: 8 }}>{todo.text}</span>
                                                        <button onClick={() => deleteTodo(todo.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeBoard?.bgImage ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', fontSize: 12 }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = activeBoard?.bgImage ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)'}>✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <AnimatePresence>
                                    {isEditBoardModalOpen && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} style={{ background: 'var(--bg-card)', padding: '32px 40px', borderRadius: 24, width: '100%', maxWidth: 540, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                                                <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Board</h2>

                                                <label style={{ display: 'block', marginBottom: 20 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Board Name</div>
                                                    <input type="text" value={editBoardName} onChange={e => setEditBoardName(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} placeholder="e.g. Project Alpha" onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                                </label>

                                                <label style={{ display: 'block', marginBottom: 20 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}><ImageIcon size={14} /> Background Details</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                                                        {PREBUILT_BGS.map(bg => (
                                                            <div key={bg} onClick={() => setEditBoardBg(bg)} style={{ height: 64, borderRadius: 8, background: `url(${bg}) center/cover`, cursor: 'pointer', border: editBoardBg === bg ? '2px solid var(--brand)' : '2px solid transparent', boxShadow: editBoardBg === bg ? '0 0 0 2px var(--bg-card) inset' : 'none', opacity: editBoardBg === bg ? 1 : 0.6, transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => { if (editBoardBg !== bg) e.currentTarget.style.opacity = '0.6'; }} />
                                                        ))}
                                                    </div>
                                                    <input type="text" value={editBoardBg} onChange={e => setEditBoardBg(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} placeholder="Or paste an image web URL..." onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                                </label>

                                                <label style={{ display: 'block', marginBottom: 24 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}><Palette size={14} /> Workflow Columns</div>
                                                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}><input type="radio" checked={editBoardColsType === 'default'} onChange={() => setEditBoardColsType('default')} style={{ accentColor: 'var(--brand)' }} /> Default (Agile)</label>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}><input type="radio" checked={editBoardColsType === 'custom'} onChange={() => setEditBoardColsType('custom')} style={{ accentColor: 'var(--brand)' }} /> Custom Steps</label>
                                                    </div>
                                                    {editBoardColsType === 'custom' && (
                                                        <input type="text" value={editBoardCustomCols} onChange={e => setEditBoardCustomCols(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} placeholder="Comma separated strings: To Do, Doing, Done" onFocus={e => e.target.style.borderColor = 'var(--brand)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                                    )}
                                                </label>

                                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginBottom: 32 }}>
                                                    <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#ef4444' }}>Danger Zone</h3>
                                                    <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>To delete this board and all its tasks, type exactly <strong style={{ color: 'var(--text-primary)' }}>{activeBoard?.name}</strong> below:</p>
                                                    <input type="text" value={deleteBoardConfirm} onChange={e => setDeleteBoardConfirm(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} placeholder="Type board name to confirm" onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                                    <button onClick={handleDeleteBoard} disabled={deleteBoardConfirm !== activeBoard?.name} style={{ padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#ef4444', opacity: deleteBoardConfirm === activeBoard?.name ? 1 : 0.4 }}>Delete Board</button>
                                                    <div style={{ display: 'flex', gap: 12 }}>
                                                        <button onClick={() => setIsEditBoardModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>Cancel</button>
                                                        <button onClick={handleEditBoard} disabled={!editBoardName.trim()} style={{ padding: '10px 24px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, opacity: editBoardName.trim() ? 1 : 0.5, boxShadow: '0 4px 12px rgba(57, 224, 121, 0.25)' }}>Save Changes</button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
