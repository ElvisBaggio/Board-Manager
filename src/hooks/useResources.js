import { useState, useCallback, useEffect } from 'react';

const API = 'http://localhost:3001/api/resources';

export function useTeamMembers(boardId) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchMembers = useCallback(async () => {
        if (!boardId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/members?boardId=${boardId}`);
            if (res.ok) setMembers(await res.json());
        } catch (err) {
            console.error('Erro ao buscar membros:', err);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const createMember = useCallback(async (data) => {
        const id = 'member-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const member = { id, boardId, ...data };

        setMembers(prev => [...prev, member]);

        try {
            const res = await fetch(`${API}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(member),
            });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchMembers();
        }
    }, [boardId, fetchMembers]);

    const updateMember = useCallback(async (id, data) => {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));

        try {
            const res = await fetch(`${API}/members/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchMembers();
        }
    }, [fetchMembers]);

    const deleteMember = useCallback(async (id) => {
        setMembers(prev => prev.filter(m => m.id !== id));

        try {
            const res = await fetch(`${API}/members/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchMembers();
        }
    }, [fetchMembers]);

    return { members, loading, createMember, updateMember, deleteMember, refetch: fetchMembers };
}

export function useAllocations(boardId) {
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAllocations = useCallback(async () => {
        if (!boardId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/allocations?boardId=${boardId}`);
            if (res.ok) setAllocations(await res.json());
        } catch (err) {
            console.error('Erro ao buscar alocações:', err);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    useEffect(() => { fetchAllocations(); }, [fetchAllocations]);

    const createAllocation = useCallback(async (data) => {
        const id = 'alloc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const alloc = { id, ...data };

        setAllocations(prev => [...prev, alloc]);

        try {
            const res = await fetch(`${API}/allocations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alloc),
            });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchAllocations();
        }
    }, [fetchAllocations]);

    const updateAllocation = useCallback(async (id, data) => {
        setAllocations(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));

        try {
            const res = await fetch(`${API}/allocations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchAllocations();
        }
    }, [fetchAllocations]);

    const deleteAllocation = useCallback(async (id) => {
        setAllocations(prev => prev.filter(a => a.id !== id));

        try {
            const res = await fetch(`${API}/allocations/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            console.error(err);
            fetchAllocations();
        }
    }, [fetchAllocations]);

    return { allocations, loading, createAllocation, updateAllocation, deleteAllocation, refetch: fetchAllocations };
}
