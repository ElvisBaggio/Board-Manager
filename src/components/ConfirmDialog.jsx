import { X, Trash2, AlertTriangle } from 'lucide-react';

/**
 * Reusable confirmation dialog.
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState(null);
 *
 *   // Trigger:
 *   setConfirmState({
 *     message: 'Excluir este item?',
 *     onConfirm: () => { deleteItem(id); setConfirmState(null); }
 *   });
 *
 *   // In JSX:
 *   {confirmState && (
 *     <ConfirmDialog
 *       message={confirmState.message}
 *       onConfirm={confirmState.onConfirm}
 *       onCancel={() => setConfirmState(null)}
 *     />
 *   )}
 */
export default function ConfirmDialog({
    title = 'Confirmar exclusão',
    message,
    confirmLabel = 'Excluir',
    onConfirm,
    onCancel,
    danger = true,
}) {
    return (
        <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1001 }}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '420px' }}
            >
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {danger && <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />}
                        {title}
                    </h2>
                    <button className="modal-close" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                        {message}
                    </p>
                </div>
                <div className="modal-footer">
                    <div />
                    <div className="modal-footer-right">
                        <button className="btn btn-glass" onClick={onCancel}>Cancelar</button>
                        <button
                            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                            onClick={onConfirm}
                            autoFocus
                        >
                            {danger && <Trash2 size={16} />}
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
