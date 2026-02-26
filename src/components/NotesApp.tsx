'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NotesAppProps {
    onClose: () => void;
    userName: string;
}

type Tab = 'notes' | 'kanban';
type Status = 'backlog' | 'in-progress' | 'on-hold' | 'review' | 'ready' | 'done';

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

interface KanbanBoard {
    id: string;
    name: string;
    tasks: Todo[];
}

const STATUSES: { value: Status; label: string; color: string }[] = [
    { value: 'backlog', label: 'Backlog', color: '#94a3b8' },
    { value: 'in-progress', label: 'In Progress', color: '#3b82f6' },
    { value: 'on-hold', label: 'On Hold', color: '#f59e0b' },
    { value: 'review', label: 'Review', color: '#8b5cf6' },
    { value: 'ready', label: 'Ready', color: '#14b8a6' },
    { value: 'done', label: 'Done', color: '#10b981' }
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

    const [activeBoardId, setActiveBoardId] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const savedTodos = localStorage.getItem(TODOS_KEY);
            if (savedTodos) {
                try {
                    const parsed = JSON.parse(savedTodos);
                    if (parsed.activeBoardId) return parsed.activeBoardId;
                    if (parsed.boards && parsed.boards.length > 0) return parsed.boards[0].id;
                } catch { }
            }
        }
        return 'default';
    });

    const [newTodo, setNewTodo] = useState('');
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);

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
            id: Date.now().toString(),
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

    function deleteActiveNote() {
        if (!activeNoteId) return;
        const updated = notes.filter(n => n.id !== activeNoteId);
        setNotes(updated);
        if (updated.length > 0) {
            selectNote(updated[0].id);
        } else {
            setActiveNoteId(null);
            setNoteTitle('');
            setNoteContent('');
        }
    }

    // Kanban actions
    const activeBoardIndex = boards.findIndex(b => b.id === activeBoardId);
    const activeBoard = boards[activeBoardIndex] || boards[0];

    function createBoard(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && newBoardName.trim()) {
            const newBoard: KanbanBoard = { id: Date.now().toString(), name: newBoardName.trim(), tasks: [] };
            setBoards([...boards, newBoard]);
            setActiveBoardId(newBoard.id);
            setNewBoardName('');
            setIsCreatingBoard(false);
        } else if (e.key === 'Escape') {
            setIsCreatingBoard(false);
            setNewBoardName('');
        }
    }

    function addTodo(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && newTodo.trim() && activeBoard) {
            const newTask: Todo = { id: Date.now().toString(), text: newTodo.trim(), status: 'backlog' };
            setBoards(prev => {
                const updated = [...prev];
                updated[activeBoardIndex] = { ...activeBoard, tasks: [newTask, ...activeBoard.tasks] };
                return updated;
            });
            setNewTodo('');
        }
    }

    function deleteTodo(id: string) {
        setBoards(prev => {
            const updated = [...prev];
            updated[activeBoardIndex] = { ...activeBoard, tasks: activeBoard.tasks.filter(t => t.id !== id) };
            return updated;
        });
    }

    // Drag and Drop implementation
    function handleDragStart(e: React.DragEvent, id: string) {
        e.dataTransfer.setData('text/plain', id);
        // Optional: Add some visual feedback to the element being dragged
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    }

    function handleDragEnd(e: React.DragEvent) {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
    }

    function handleDrop(e: React.DragEvent, status: Status) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        setBoards(prev => {
            const updated = [...prev];
            updated[activeBoardIndex] = {
                ...activeBoard,
                tasks: activeBoard.tasks.map(t => t.id === id ? { ...t, status } : t)
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
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {note.title || 'Untitled'}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note.date}</div>
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
                                        <button
                                            onClick={deleteActiveNote}
                                            style={{
                                                padding: '8px 16px', background: 'var(--bg-subtle)', color: '#d32f2f',
                                                border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <textarea
                                        placeholder="Start typing your note here... (Markdown supported mentally)"
                                        value={noteContent}
                                        onChange={e => { setNoteContent(e.target.value); saveActiveNote(); }}
                                        onBlur={saveActiveNote}
                                        style={{
                                            flex: 1, background: 'transparent', border: 'none', resize: 'none', outline: 'none',
                                            color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, fontFamily: 'var(--body)'
                                        }}
                                    />
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

                        {/* Boards Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>PROJECTS</span>
                            {boards.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setActiveBoardId(b.id)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 100, border: '1px solid var(--border)',
                                        background: activeBoardId === b.id ? 'var(--bg-card)' : 'transparent',
                                        color: activeBoardId === b.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                        fontWeight: activeBoardId === b.id ? 600 : 500, fontSize: 13,
                                        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                                        boxShadow: activeBoardId === b.id ? 'var(--shadow-sm)' : 'none',
                                    }}
                                >
                                    {b.name}
                                </button>
                            ))}

                            {isCreatingBoard ? (
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Board Name (Enter)"
                                    value={newBoardName}
                                    onChange={e => setNewBoardName(e.target.value)}
                                    onKeyDown={createBoard}
                                    onBlur={() => { setIsCreatingBoard(false); setNewBoardName(''); }}
                                    style={{
                                        padding: '6px 14px', borderRadius: 100, border: '1px dashed var(--brand)',
                                        background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: 140
                                    }}
                                />
                            ) : (
                                <button
                                    onClick={() => setIsCreatingBoard(true)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 100, border: '1px dashed var(--border-strong)',
                                        background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                >
                                    + New Board
                                </button>
                            )}
                        </div>

                        {/* Kanban Columns */}
                        <div style={{ flex: 1, display: 'flex', padding: 24, gap: 24, overflowX: 'auto', alignItems: 'flex-start' }}>
                            {STATUSES.map(stat => (
                                <div
                                    key={stat.value}
                                    onDrop={e => handleDrop(e, stat.value)}
                                    onDragOver={handleDragOver}
                                    style={{
                                        flex: '0 0 300px', background: 'var(--bg-card)', borderRadius: 12,
                                        border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                                        maxHeight: '100%', boxShadow: 'var(--shadow-sm)',
                                    }}
                                >
                                    <div style={{
                                        padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)', flexShrink: 0
                                    }}>
                                        <div style={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: stat.color
                                        }} />
                                        {stat.label}
                                        <span style={{ marginLeft: 'auto', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 100, fontSize: 11 }}>
                                            {activeBoard?.tasks.filter(t => t.status === stat.value).length || 0}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                                        {stat.value === 'backlog' && (
                                            <input
                                                type="text"
                                                placeholder="+ Add new card..."
                                                value={newTodo}
                                                onChange={e => setNewTodo(e.target.value)}
                                                onKeyDown={addTodo}
                                                style={{
                                                    padding: '12px', borderRadius: 8, border: '1px dashed var(--border-strong)',
                                                    background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: 13,
                                                    transition: 'all 0.15s', flexShrink: 0
                                                }}
                                                onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.background = 'var(--bg-subtle)'; }}
                                                onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.background = 'transparent'; }}
                                            />
                                        )}
                                        {activeBoard?.tasks.filter(t => t.status === stat.value).map(todo => (
                                            <div
                                                key={todo.id}
                                                draggable
                                                onDragStart={e => handleDragStart(e, todo.id)}
                                                onDragEnd={handleDragEnd}
                                                style={{
                                                    padding: '14px', background: 'var(--bg)', borderRadius: 8,
                                                    border: '1px solid var(--border)', cursor: 'grab',
                                                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                                    boxShadow: 'var(--shadow-sm)', transition: 'transform 0.15s', flexShrink: 0
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                                            >
                                                <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, wordBreak: 'break-word', paddingRight: 8 }}>{todo.text}</span>
                                                <button
                                                    onClick={() => deleteTodo(todo.id)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, marginTop: 2, padding: 4 }}
                                                    title="Delete task"
                                                >✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
