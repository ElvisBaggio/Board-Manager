import { useState, useCallback } from 'react';

export function useComments() {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchComments = useCallback(async (featureId) => {
        if (!featureId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/comments?featureId=${featureId}`);
            if (!res.ok) throw new Error('Falha ao buscar comentários');
            setComments(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const addComment = async (featureId, userId, content) => {
        if (!content?.trim()) return;
        // Optimistic placeholder
        const temp = { id: `temp-${Date.now()}`, feature_id: featureId, user_id: userId, content, created_at: new Date().toISOString(), user_name: '...' };
        setComments(prev => [...prev, temp]);
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureId, userId, content }),
            });
            if (!res.ok) throw new Error('Falha ao criar comentário');
            const saved = await res.json();
            setComments(prev => prev.map(c => c.id === temp.id ? saved : c));
            return saved;
        } catch (err) {
            setComments(prev => prev.filter(c => c.id !== temp.id));
            console.error(err);
        }
    };

    const deleteComment = async (id) => {
        setComments(prev => prev.filter(c => c.id !== id));
        try {
            const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao deletar');
        } catch (err) {
            console.error(err);
        }
    };

    return { comments, loading, fetchComments, addComment, deleteComment };
}
