'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useOS } from '@/hooks/useOS';
import type { LabUser } from '@/hooks/useOS';

import { IdEntry } from '@/components/IdEntry';
import { IdScan } from '@/components/IdScan';
import { LabDoor } from '@/components/LabDoor';
import { Dashboard } from '@/components/Dashboard';
import { Terminal } from '@/components/Terminal';
import { NeuralEraser } from '@/components/NeuralEraser';
import { Whiteboard } from '@/components/Whiteboard';
import { PdfEditor } from '@/components/PdfEditor';


export default function LabOS() {
  const os = useOS();
  const initialized = useRef(false);

  // ── Persistence: check localStorage on mount ──────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const saved = localStorage.getItem('lab_user');
      if (saved) {
        const parsed: LabUser = JSON.parse(saved);
        if (parsed.name && parsed.accessLevel) {
          os.setUser(parsed);
          os.setPhase('door-open'); // skip entry + scan, go right to door
          return;
        }
      }
    } catch {
      localStorage.removeItem('lab_user');
    }

    os.setPhase('id-entry');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Ctrl + ~ shortcut for terminal ────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        os.toggleTerminal();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [os]);

  const isDashboard = os.phase === 'dashboard';

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* ── Subtle grid background ────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(131,27,132,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(131,27,132,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Layer 2: Center content (mathematically locked) ───────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
        }}
      >
        <AnimatePresence mode="wait">
          {/* INIT phase — blank while checking localStorage */}
          {os.phase === 'init' && null}

          {/* ID ENTRY */}
          {os.phase === 'id-entry' && (
            <IdEntry
              key="id-entry"
              setUser={os.setUser}
              setPhase={os.setPhase}
            />
          )}

          {/* ID SCAN */}
          {os.phase === 'id-scan' && os.user && (
            <IdScan
              key="id-scan"
              user={os.user}
              setPhase={os.setPhase}
            />
          )}
        </AnimatePresence>

        {/* DASHBOARD — rendered persistently, revealed after door */}
        {isDashboard && os.user && (
          <Dashboard
            user={os.user}
            pushApp={os.pushApp}
            openTerminal={os.openTerminal}
            logout={os.logout}
          />
        )}
      </div>

      {/* ── Layer 3: Door animation (overlays everything during transition) ── */}
      <AnimatePresence>
        {(os.phase === 'door-open') && os.user && (
          <LabDoor
            key="lab-door"
            user={os.user}
            setPhase={os.setPhase}
          />
        )}
      </AnimatePresence>

      {/* ── Layer 4: App windows ──────────────────────────────────────────── */}
      <AnimatePresence>
        {os.openApps.includes('neural-eraser') && (
          <NeuralEraser
            key="neural-eraser"
            onClose={() => os.closeApp('neural-eraser')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {os.openApps.includes('whiteboard') && (
          <Whiteboard
            key="whiteboard"
            onClose={() => os.closeApp('whiteboard')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {os.openApps.includes('pdf-editor') && (
          <PdfEditor
            key="pdf-editor"
            onClose={() => os.closeApp('pdf-editor')}
          />
        )}
      </AnimatePresence>

      {/* ── Layer 5: Terminal (always on top) ────────────────────────────── */}
      <Terminal
        isOpen={os.terminalOpen}
        user={os.user}
        onClose={os.toggleTerminal}
        pushApp={os.pushApp}
      />
    </main>
  );
}
