import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const isDanger = variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showClose={!loading}>
      <div className="flex items-start gap-4">
        <div
          className={`w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 border ${
            isDanger
              ? 'bg-[#9E3524]/10 text-[#9E3524] border-[#9E3524]/30'
              : 'bg-[#0F7B5F]/10 text-[#0F7B5F] border-[#0F7B5F]/30'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-serif font-bold text-[var(--text-primary)]">{title}</h4>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed font-sans">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={isDanger ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
