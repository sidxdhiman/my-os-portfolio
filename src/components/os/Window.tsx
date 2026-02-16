"use client";
import { motion } from "framer-motion";
import { X, Minus, Square } from "lucide-react";

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  isActive: boolean;
  onFocus: () => void;
}

export default function Window({
  title,
  children,
  onClose,
  isActive,
  onFocus,
}: WindowProps) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      onPointerDown={onFocus}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`absolute w-[600px] h-[400px] bg-zinc-900 border ${
        isActive ? "border-blue-500 shadow-2xl" : "border-zinc-700 shadow-lg"
      } rounded-lg overflow-hidden flex flex-col`}
      style={{ zIndex: isActive ? 50 : 10 }}
    >
      {/* Title Bar */}
      <div className="bg-zinc-800 p-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none">
        <span className="text-xs font-mono px-2 text-zinc-400">{title}</span>
        <div className="flex gap-2 px-2">
          <Minus
            size={14}
            className="text-zinc-500 hover:text-white cursor-pointer"
          />
          <Square
            size={14}
            className="text-zinc-500 hover:text-white cursor-pointer"
          />
          <X
            size={14}
            onClick={onClose}
            className="text-red-500 hover:text-red-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-black p-4">{children}</div>
    </motion.div>
  );
}
