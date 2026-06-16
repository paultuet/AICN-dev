import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Modal/Dialog component with configurable size and actions.
 * Uses the design-system tokens (panel/hair/ink) and an explicit z-index on the
 * panel so it always paints above the backdrop.
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling of background
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" />

      {/* Centering container */}
      <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
        <div
          ref={modalRef}
          className={`relative z-10 my-4 w-full ${sizeClasses[size]} overflow-hidden rounded-lg border border-hair bg-panel text-left shadow-pop`}
        >
          {title && (
            <div className="bg-panel-2 px-4 py-3 sm:px-6 border-b border-hair">
              <h3 className="text-lg font-semibold text-ink">{title}</h3>
            </div>
          )}

          <div className="px-4 py-4 sm:px-6">
            {children}
          </div>

          {actions && (
            <div className="bg-panel-2 px-4 py-3 sm:px-6 border-t border-hair flex justify-end gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default React.memo(Modal);
