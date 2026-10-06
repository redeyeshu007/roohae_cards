/**
 * FILE PURPOSE:
 * Floating canvas right-click contextual action menu.
 *
 * MAIN RESPONSIBILITY:
 * Mounts at pointer coordinates upon right-click canvas events to provide quick operations:
 * Copy/Paste, Duplicate, Delete, Layer Ordering (Bring to Front, Send to Back),
 * Alignment, Flipping (horizontal/vertical), and Lock/Unlock toggling.
 *
 * CONNECTED SYSTEMS:
 * - packages/ui/src/editor/EditorWorkspace.tsx (listens to contextmenu event and mounts this component)
 * - packages/editor-sdk/src/RoohaeEditor.ts (executes manipulation actions on active canvas selection)
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Files,
  Trash2,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  Lock,
  Unlock,
  MoveUp,
  MoveDown,
  ArrowUpToLine,
  ArrowDownToLine,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  RefreshCcw,
  MousePointer2,
  ChevronRight,
  Image as ImageIcon,
  Type,
  Square,
  Minus
} from 'lucide-react';
import type { RoohaeEditor, SelectionState } from '@roohae/editor-sdk';
import { cn } from '../lib/cn';

export interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  editor: RoohaeEditor | null;
  selection: SelectionState;
}

// CONTEXT MENU COMPONENT:
// Rendered on canvas right-click for immediate layer manipulation actions.

export function ContextMenu({ x, y, isOpen, onClose, editor, selection }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  // Prevent menu going offscreen
  const safeX = Math.min(x, typeof window !== 'undefined' ? window.innerWidth - 260 : x);
  const safeY = Math.min(y, typeof window !== 'undefined' ? window.innerHeight - 400 : y);

  if (!isOpen || !editor || selection.count === 0) return null;

  const obj = selection.object;
  const isLocked = obj?.locked;
  const type = obj?.roohAssetType || obj?.type;

  const handle = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed z-[9999] w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15),_0_0_0_1px_rgba(0,0,0,0.05)] p-1.5 overflow-visible flex flex-col font-medium text-[13px] text-[#1F1F1F]"
          style={{ top: safeY, left: safeX }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Default Actions */}
          <MenuButton icon={<Copy />} label="Copy" shortcut="Ctrl+C" onClick={() => handle(() => editor.copy())} />
          <MenuButton icon={<Copy />} label="Copy Style" shortcut="Ctrl+Alt+C" onClick={() => {}} disabled />
          <MenuButton icon={<Files />} label="Paste" shortcut="Ctrl+V" onClick={() => handle(() => editor.paste())} />
          <MenuButton icon={<Files />} label="Duplicate" shortcut="Ctrl+D" onClick={() => handle(() => editor.duplicateSelection())} />
          <MenuButton icon={<Trash2 />} label="Delete" shortcut="Del" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handle(() => editor.deleteSelection())} />
          
          <MenuDivider />

          {/* Layer Submenu */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveSubmenu('layer')}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <MenuButton icon={<Layers />} label="Layer" hasSubmenu />
            
            {activeSubmenu === 'layer' && (
              <div className="absolute left-full top-0 ml-1 w-56 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] p-1.5 z-[10000]">
                <MenuButton icon={<ArrowUpToLine />} label="Bring to Front" shortcut="Ctrl+]" onClick={() => handle(() => editor.bringToFront())} />
                <MenuButton icon={<MoveUp />} label="Bring Forward" shortcut="Ctrl+Alt+]" onClick={() => handle(() => editor.bringForward())} />
                <MenuButton icon={<MoveDown />} label="Send Backward" shortcut="Ctrl+Alt+[" onClick={() => handle(() => editor.sendBackward())} />
                <MenuButton icon={<ArrowDownToLine />} label="Send to Back" shortcut="Ctrl+[" onClick={() => handle(() => editor.sendToBack())} />
              </div>
            )}
          </div>

          <MenuDivider />

          {/* Alignment */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveSubmenu('align')}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <MenuButton icon={<AlignCenter />} label="Align" hasSubmenu />
            
            {activeSubmenu === 'align' && (
              <div className="absolute left-full top-0 ml-1 w-48 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] p-1.5 z-[10000]">
                <MenuButton icon={<AlignLeft />} label="Align Left" onClick={() => {}} disabled />
                <MenuButton icon={<AlignCenter />} label="Align Center" onClick={() => {}} disabled />
                <MenuButton icon={<AlignRight />} label="Align Right" onClick={() => {}} disabled />
                <MenuDivider />
                <MenuButton icon={<AlignVerticalJustifyCenter />} label="Align Middle" onClick={() => {}} disabled />
                <MenuDivider />
                <MenuButton icon={<MousePointer2 />} label="Center on Page" onClick={() => handle(() => editor.centerOnPage())} />
              </div>
            )}
          </div>

          {isLocked ? (
            <MenuButton icon={<Unlock />} label="Unlock" onClick={() => handle(() => editor.unlock())} />
          ) : (
            <MenuButton icon={<Lock />} label="Lock" onClick={() => handle(() => editor.lock())} />
          )}

          <MenuDivider />

          {/* Transforms */}
          <MenuButton icon={<FlipHorizontal />} label="Flip Horizontal" onClick={() => handle(() => editor.flipHorizontal())} />
          <MenuButton icon={<FlipVertical />} label="Flip Vertical" onClick={() => handle(() => editor.flipVertical())} />
          <MenuButton icon={<RotateCw />} label="Rotate 90°" onClick={() => handle(() => editor.rotateSelection(90))} />
          <MenuButton icon={<RefreshCcw />} label="Reset Rotation" onClick={() => handle(() => editor.resetRotation())} />
          
          {/* Object specific info hint */}
          <MenuDivider />
          <div className="px-3 py-2 flex items-center justify-between text-[#8CA3B0] text-[11px] font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              {type === 'border' ? <Square className="w-3.5 h-3.5" /> :
               type === 'line' ? <Minus className="w-3.5 h-3.5" /> :
               type === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> :
               type === 'textbox' ? <Type className="w-3.5 h-3.5" /> :
               <Layers className="w-3.5 h-3.5" />}
              {selection.count > 1 ? 'Multiple' : (type || 'Object')}
            </span>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuButton({ 
  icon, 
  label, 
  shortcut, 
  onClick, 
  className,
  hasSubmenu,
  disabled
}: { 
  icon: React.ReactNode; 
  label: string; 
  shortcut?: string; 
  onClick?: () => void;
  className?: string;
  hasSubmenu?: boolean;
  disabled?: boolean;
}) {
  return (
    <button 
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left outline-none",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F3EFE9] focus:bg-[#F3EFE9] cursor-pointer",
        className
      )}
      onClick={(e) => {
        if (!disabled && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      disabled={disabled}
    >
      <div className="flex items-center gap-2.5">
        <div className="text-[#6B6B6B] [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </div>
        <span>{label}</span>
      </div>
      {(shortcut || hasSubmenu) && (
        <div className="flex items-center text-[#8CA3B0] text-[11px] font-medium tracking-wide">
          {shortcut}
          {hasSubmenu && <ChevronRight className="w-4 h-4 ml-1" />}
        </div>
      )}
    </button>
  );
}

function MenuDivider() {
  return <div className="h-px bg-[#E7DDD6]/50 my-1 mx-2" />;
}
