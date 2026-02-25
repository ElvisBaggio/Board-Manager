import { useState, useCallback, useEffect } from 'react';

const API = 'http://localhost:3001/api/okrs';

export function useOKRs(laneId) {
    const [keyResults, setKeyResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchKeyResults = useCallback(async () => {
        if (!laneId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}?laneId=${laneId}`);
            if (res.ok) setKeyResults(await res.json());
        } catch (err) {
            console.error('Erro ao buscar key results:', err);
        } finally {
            setLoading(false);
        }
    }, [laneId]);

    useEffect(() => { fetchKeyResults(); }, [fetchKeyResults]);

    const createKeyResult = useCallback(async (data) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const kr = { id, laneId, ...data };

        // Optimistic update
        setKeyResults(prev => [...prev, kr]);

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kr),
            });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchKeyResults();
        }
    }, [laneId, fetchKeyResults]);

    const updateKeyResult = useCallback(async (id, data) => {
        setKeyResults(prev => prev.map(kr => kr.id === id ? { ...kr, ...data } : kr));

        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchKeyResults();
        }
    }, [fetchKeyResults]);

    const deleteKeyResult = useCallback(async (id) => {
        setKeyResults(prev => prev.filter(kr => kr.id !== id));

        try {
            const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchKeyResults();
        }
    }, [fetchKeyResults]);

    return { keyResults, loading, createKeyResult, updateKeyResult, deleteKeyResult, refetch: fetchKeyResults };
}

// Board-level hook (aggregates all KRs across lanes)
export function useBoardOKRs(boardId) {
    const [allKeyResults, setAllKeyResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAll = useCallback(async () => {
        if (!boardId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/board?boardId=${boardId}`);
            if (res.ok) setAllKeyResults(await res.json());
        } catch (err) {
            console.error('Erro ao buscar board OKRs:', err);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return { allKeyResults, loading, refetch: fetchAll };
}
