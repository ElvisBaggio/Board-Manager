import { useState, useCallback } from 'react';

export function useExecutionItems(planId) {
    const [items, setItems] = useState([]);
    const [featureCounts, setFeatureCounts] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchItemsByFeature = useCallback(async (featureId) => {
        if (!featureId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/execution-items?featureId=${featureId}`);
            if (!res.ok) throw new Error('Falha ao buscar itens');
            const data = await res.json();
            setItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBoardCounts = useCallback(async () => {
        if (!planId) return;
        try {
            const res = await fetch(`/api/execution-items/counts?planId=${planId}`);
            if (!res.ok) throw new Error('Falha ao buscar contagem');
            const data = await res.json();

            const countsMap = {};
            data.forEach(item => {
                countsMap[item.feature_id] = { total: item.total, done: item.done };
            });
            setFeatureCounts(countsMap);
        } catch (err) {
            console.error(err);
        }
    }, [planId]);

    const addItem = async (itemData) => {
        try {
            const res = await fetch('/api/execution-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData),
            });
            if (!res.ok) throw new Error('Falha ao salvar');
            const saved = await res.json();
            setItems(prev => [...prev, saved].sort((a, b) => a.sort_order - b.sort_order));
            return saved;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const updateItem = async (id, updates) => {
        const original = items;
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        try {
            const res = await fetch(`/api/execution-items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Falha ao atualizar');
            return await res.json();
        } catch (err) {
            setItems(original);
            setError(err.message);
            throw err;
        }
    };

    const reorderItems = async (reorderedArray) => {
        const original = items;
        setItems(reorderedArray);
        try {
            const payload = reorderedArray.map((item, index) => ({ id: item.id, sortOrder: index }));
            const res = await fetch('/api/execution-items/reorder/batch', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: payload }),
            });
            if (!res.ok) throw new Error('Falha ao reordenar');
        } catch (err) {
            setItems(original);
            setError(err.message);
            throw err;
        }
    };

    const deleteItem = async (id) => {
        const original = items;
        setItems(prev => prev.filter(item => item.id !== id));
        try {
            const res = await fetch(`/api/execution-items/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao deletar');
        } catch (err) {
            setItems(original);
            setError(err.message);
            throw err;
        }
    };

    return {
        items, featureCounts, loading, error,
        fetchItemsByFeature, fetchBoardCounts,
        addItem, updateItem, reorderItems, deleteItem
    };
}
