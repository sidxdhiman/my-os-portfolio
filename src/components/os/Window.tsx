"use client";
import { motion } from 'framer-motion';

export default function Window({ title, children, onClose, isActive, onFocus }: any) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      onPointerDown={onFocus}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`absolute w-[800px] h-[550px] flex flex-col rounded-2xl overflow-hidden glass-window transition-all ${
        isActive ? 'ring-1 ring-white/30 shadow-2xl scale-[1.01]' : 'opacity-70 shadow-lg'
      }`}
      style={{ zIndex: isActive ? 50 : 10 }}
    >
      {/* Google-Style Title Bar */}
      <div className="h-12 bg-white/5 flex items-center justify-between px-5 border-b border-white/5 cursor-grab active:cursor-grabbing">
        <div className="flex gap-2.5">
          <div onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:bg-[#ff4b40] transition-colors cursor-pointer" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] opacity-40" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] opacity-40" />
        </div>
        <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase select-none">{title}</span>
        <div className="w-14" />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-black/30 backdrop-blur-md">
        {children}
      </div>
    </motion.div>
  );
}
