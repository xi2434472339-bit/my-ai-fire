import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = '确认',
  variant = 'danger',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={
              variant === 'danger'
                ? 'mt-0.5 h-5 w-5 shrink-0 text-red-500'
                : 'mt-0.5 h-5 w-5 shrink-0 text-amber-500'
            }
          />
          <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'default'} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
