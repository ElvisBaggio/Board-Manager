import { useState, useCallback } from 'react';

export function useIndicators(planId) {
    const [productIndicators, setProductIndicators] = useState([]);
    const [efficiencyIndicators, setEfficiencyIndicators] = useState([]);
    const [boardProductIndicators, setBoardProductIndicators] = useState([]);
    const [indicatorKrLinks, setIndicatorKrLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // === Product Indicators ===

    const fetchProductIndicators = useCallback(async (featureId) => {
        if (!featureId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/indicators/product?featureId=${featureId}`);
            if (!res.ok) throw new Error('Falha ao buscar indicadores');
            const data = await res.json();
            setProductIndicators(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBoardProductIndicators = useCallback(async () => {
        if (!planId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/indicators/product/plan/${planId}`);
            if (!res.ok) throw new Error('Falha ao buscar indicadores do board');
            const data = await res.json();
            setBoardProductIndicators(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [planId]);

    const fetchBoardKrLinks = useCallback(async () => {
        if (!planId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/indicators/plan-kr-links/${planId}`);
            if (!res.ok) throw new Error('Falha ao buscar links de KRs');
            const data = await res.json();
            setIndicatorKrLinks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [planId]);

    const addProductIndicator = async (indicatorData) => {
        try {
            const res = await fetch('/api/indicators/product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(indicatorData),
            });
            if (!res.ok) throw new Error('Falha ao salvar');
            const saved = await res.json();
            setProductIndicators(prev => [...prev, saved]);
            return saved;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const updateProductIndicator = async (id, updates) => {
        setProductIndicators(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
        setBoardProductIndicators(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
        try {
            const res = await fetch(`/api/indicators/product/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Falha ao atualizar');
            return await res.json();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const deleteProductIndicator = async (id) => {
        setProductIndicators(prev => prev.filter(i => i.id !== id));
        setBoardProductIndicators(prev => prev.filter(i => i.id !== id));
        try {
            const res = await fetch(`/api/indicators/product/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao deletar');
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const linkIndicatorToKr = async (indicatorId, krId) => {
        try {
            const res = await fetch(`/api/indicators/product/${indicatorId}/kr-links`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ krId })
            });
            if (!res.ok) throw new Error('Falha ao vincular');
            const saved = await res.json();
            setIndicatorKrLinks(prev => [...prev, saved]);
            return saved;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const unlinkIndicatorFromKr = async (linkId) => {
        setIndicatorKrLinks(prev => prev.filter(l => l.id !== linkId));
        try {
            const res = await fetch(`/api/indicators/kr-links/${linkId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao desvincular');
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // === Efficiency Indicators ===

    const fetchEfficiencyIndicators = useCallback(async () => {
        if (!planId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/indicators/efficiency?planId=${planId}`);
            if (!res.ok) throw new Error('Falha ao buscar indicadores');
            const data = await res.json();
            setEfficiencyIndicators(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [planId]);

    const addEfficiencyIndicator = async (indicatorData) => {
        try {
            const res = await fetch('/api/indicators/efficiency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...indicatorData, planId }),
            });
            if (!res.ok) throw new Error('Falha ao salvar');
            const saved = await res.json();
            setEfficiencyIndicators(prev => [...prev, saved]);
            return saved;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const updateEfficiencyIndicator = async (id, updates) => {
        setEfficiencyIndicators(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
        try {
            const res = await fetch(`/api/indicators/efficiency/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Falha ao atualizar');
            return await res.json();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const deleteEfficiencyIndicator = async (id) => {
        setEfficiencyIndicators(prev => prev.filter(i => i.id !== id));
        try {
            const res = await fetch(`/api/indicators/efficiency/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao deletar');
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        productIndicators, boardProductIndicators, efficiencyIndicators, indicatorKrLinks, loading, error,
        fetchProductIndicators, fetchBoardProductIndicators, fetchBoardKrLinks, fetchEfficiencyIndicators,
        addProductIndicator, updateProductIndicator, deleteProductIndicator,
        linkIndicatorToKr, unlinkIndicatorFromKr,
        addEfficiencyIndicator, updateEfficiencyIndicator, deleteEfficiencyIndicator
    };
}
