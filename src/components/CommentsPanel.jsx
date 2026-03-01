import { useState, useEffect, useRef } from 'react';
import { useComments } from '../hooks/useComments';
import { Trash2, Send, MessageSquare } from 'lucide-react';

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
}

export default function CommentsPanel({ featureId, user }) {
    const { comments, loading, fetchComments, addComment, deleteComment } = useComments();
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        if (featureId) fetchComments(featureId);
    }, [featureId, fetchComments]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await addComment(featureId, user.id, text.trim());
        setText('');
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Comment list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar min-h-[200px]">
                {loading && <div className="text-center text-muted text-sm py-8">Carregando...</div>}

                {!loading && comments.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 text-muted py-12 gap-3">
                        <MessageSquare size={36} className="opacity-30" />
                        <p className="text-sm italic">Nenhum comentário ainda. Seja o primeiro!</p>
                    </div>
                )}

                {comments.map(c => {
                    const isOwn = c.user_id === user?.id;
                    const initials = c.user_name?.slice(0, 2).toUpperCase() || '??';
                    return (
                        <div key={c.id} className="flex gap-3 group animate-fade-in-up">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                style={{ background: `hsl(${(c.user_name?.charCodeAt(0) || 0) * 17 % 360}, 60%, 45%)` }}
                            >
                                {initials}
                            </div>
                            <div className="flex-1 glass-surface rounded-lg p-3 relative">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-[var(--accent)]">{c.user_name}</span>
                                    <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap break-words m-0">{c.content}</p>
                                {isOwn && (
                                    <button
                                        className="absolute top-2 right-2 text-danger opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger/20 transition-all"
                                        onClick={() => confirm('Excluir comentário?') && deleteComment(c.id)}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end border-t border-[var(--border-color)] pt-4">
                <textarea
                    className="glass-input flex-1 text-sm resize-none"
                    placeholder="Escreva um comentário..."
                    rows={2}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                    }}
                />
                <button type="submit" className="btn btn-primary px-3 py-2 self-end" disabled={!text.trim()}>
                    <Send size={15} />
                </button>
            </form>
            <p className="text-xs text-muted -mt-2">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
    );
}
