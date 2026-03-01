import { useState, useCallback } from 'react';

export function useStrategicChoices(boardId) {
    const [choices, setChoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchChoices = useCallback(async () => {
        if (!boardId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/strategic-choices?boardId=${boardId}`);
            if (!res.ok) throw new Error('Falha ao buscar escolhas estratégicas');
            const data = await res.json();
            setChoices(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    const addChoice = async (choiceData) => {
        try {
            const res = await fetch('/api/strategic-choices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...choiceData, boardId }),
            });
            if (!res.ok) throw new Error('Falha ao salvar');
            const saved = await res.json();
            setChoices(prev => [...prev, saved].sort((a, b) => a.sort_order - b.sort_order));
            return saved;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const updateChoice = async (id, updates) => {
        const original = choices;
        setChoices(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        try {
            const res = await fetch(`/api/strategic-choices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Falha ao atualizar');
            return await res.json();
        } catch (err) {
            setChoices(original);
            setError(err.message);
            throw err;
        }
    };

    const deleteChoice = async (id) => {
        const original = choices;
        setChoices(prev => prev.filter(c => c.id !== id));
        try {
            const res = await fetch(`/api/strategic-choices/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao deletar');
        } catch (err) {
            setChoices(original);
            setError(err.message);
            throw err;
        }
    };

    return { choices, loading, error, fetchChoices, addChoice, updateChoice, deleteChoice };
}
