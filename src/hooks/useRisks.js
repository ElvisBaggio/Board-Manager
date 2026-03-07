import { useState, useCallback, useEffect } from 'react';

const API = 'http://localhost:3001/api/risks';

export function useRisks(planId) {
    const [risks, setRisks] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchRisks = useCallback(async () => {
        if (!planId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}?planId=${planId}`);
            if (res.ok) setRisks(await res.json());
        } catch (err) {
            console.error('Erro ao buscar riscos:', err);
        } finally {
            setLoading(false);
        }
    }, [planId]);

    useEffect(() => { fetchRisks(); }, [fetchRisks]);

    const createRisk = useCallback(async (data) => {
        const id = 'risk-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const risk = { id, planId, ...data, score: (data.impact || 1) * (data.probability || 1) };

        setRisks(prev => [...prev, risk]);

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(risk),
            });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchRisks();
        }
    }, [planId, fetchRisks]);

    const updateRisk = useCallback(async (id, data) => {
        setRisks(prev => prev.map(r => r.id === id ? { ...r, ...data, score: (data.impact ?? r.impact) * (data.probability ?? r.probability) } : r));

        try {
            const res = await fetch(`${API}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchRisks();
        }
    }, [fetchRisks]);

    const deleteRisk = useCallback(async (id) => {
        setRisks(prev => prev.filter(r => r.id !== id));

        try {
            const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchRisks();
        }
    }, [fetchRisks]);

    return { risks, loading, createRisk, updateRisk, deleteRisk, refetch: fetchRisks };
}
