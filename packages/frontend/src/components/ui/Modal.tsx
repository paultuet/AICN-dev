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
 * Modal/Dialog component with configurable size and actions
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
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          aria-hidden="true"
        />
        
        <div
          ref={modalRef}
          className={`transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all ${sizeClasses[size]}`}
        >
          {title && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
          )}
          
          <div className="px-4 py-4 sm:px-6">
            {children}
          </div>
          
          {actions && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-end space-x-2">
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