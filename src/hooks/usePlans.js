import { useState, useCallback, useEffect } from 'react';
import { generateId } from '../utils/data';
import { useToast } from '../context/ToastContext';

// Custom hook to manage fetching and optimistic updates
export function usePlans(userId) {
    const [data, setData] = useState({ plans: [], lanes: [], features: [] });
    const { addToast } = useToast();

    // Load initial plans for user
    useEffect(() => {
        if (!userId) return;
        fetch(`/api/plans?userId=${userId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Erro ao carregar planejamentos: ${res.status}`);
                return res.json();
            })
            .then(plans => setData(prev => ({ ...prev, plans })))
            .catch(err => {
                console.error(err);
                addToast('Falha ao carregar os planejamentos. Verifique sua conexão.', 'error');
            });
    }, [userId]);

    // ── Plans ──────────────────────────────────
    const createPlan = useCallback(async (title, visibility = 'Privado') => {
        const tempId = generateId();
        const payload = { id: tempId, userId, title, visibility };

        // Optimistic
        setData(prev => ({ ...prev, plans: [{ ...payload, createdAt: new Date().toISOString() }, ...prev.plans] }));

        await fetch('/api/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return payload;
    }, [userId]);

    const updatePlan = useCallback(async (planId, updates) => {
        setData(prev => ({
            ...prev,
            plans: prev.plans.map(b => b.id === planId ? { ...b, ...updates } : b),
        }));

        await fetch(`/api/plans/${planId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }, []);

    const deletePlan = useCallback(async (planId) => {
        setData(prev => ({
            ...prev,
            plans: prev.plans.filter(b => b.id !== planId),
        }));

        await fetch(`/api/plans/${planId}`, {
            method: 'DELETE'
        });
    }, []);

    const getPlan = useCallback((planId) => {
        return data.plans.find(b => b.id === planId) || null;
    }, [data.plans]);

    const getPlanByNumericId = useCallback((numId) => {
        const idx = parseInt(numId, 10) - 1;
        if (idx >= 0 && idx < data.plans.length) {
            return data.plans[idx];
        }
        return null;
    }, [data.plans]);

    // ── Roadmap Data Loading (Lanes & Features) ─────
    // To be called by Roadmap component to ensure we have timeline data
    const loadPlanData = useCallback(async (planId) => {
        if (!planId) return;
        try {
            const [lanesRes, featuresRes] = await Promise.all([
                fetch(`/api/lanes?planId=${planId}`),
                fetch(`/api/features?planId=${planId}`)
            ]);
            const lanes = await lanesRes.json();
            const features = await featuresRes.json();

            setData(prev => {
                // Remove old lanes/features for this plan, add new ones
                const safePrevLanes = prev.lanes.filter(l => l.planId !== planId);
                const laneIds = lanes.map(l => l.id);
                const safePrevFeatures = prev.features.filter(f => !laneIds.includes(f.laneId));
                return {
                    ...prev,
                    lanes: [...safePrevLanes, ...lanes],
                    features: [...safePrevFeatures, ...features]
                };
            });
        } catch (error) {
            console.error('Error loading plan data:', error);
            addToast('Falha ao carregar dados do planejamento. Verifique sua conexão.', 'error');
        }
    }, []);

    // ── Lanes ───────────────────────────────────
    const getLanes = useCallback((planId) => {
        return data.lanes
            .filter(l => l.planId === planId)
            .sort((a, b) => a.sort_order - b.sort_order);
    }, [data.lanes]);

    const createLane = useCallback(async (planId, title, strategicChoiceId = null) => {
        const tempId = generateId();
        const existing = data.lanes.filter(l => l.planId === planId);
        const lane = { id: tempId, planId, title, strategicChoiceId, sort_order: existing.length };

        setData(prev => ({ ...prev, lanes: [...prev.lanes, lane] }));

        await fetch('/api/lanes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...lane, strategicChoiceId })
        });
        return lane;
    }, [data.lanes]);

    const updateLane = useCallback(async (laneId, updates) => {
        setData(prev => ({
            ...prev,
            lanes: prev.lanes.map(l => l.id === laneId ? { ...l, ...updates } : l),
        }));

        await fetch(`/api/lanes/${laneId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }, []);

    const deleteLane = useCallback(async (laneId) => {
        setData(prev => ({
            ...prev,
            lanes: prev.lanes.filter(l => l.id !== laneId),
            features: prev.features.filter(f => f.laneId !== laneId),
        }));

        await fetch(`/api/lanes/${laneId}`, {
            method: 'DELETE'
        });
    }, []);

    // ── Features ────────────────────────────────
    const getFeatures = useCallback((laneId) => {
        return data.features.filter(f => f.laneId === laneId);
    }, [data.features]);

    const getFeaturesForPlan = useCallback((planId) => {
        const laneIds = data.lanes.filter(l => l.planId === planId).map(l => l.id);
        return data.features.filter(f => laneIds.includes(f.laneId));
    }, [data.lanes, data.features]);

    const createFeature = useCallback(async (laneId, feature) => {
        const newFeature = {
            id: generateId(),
            laneId,
            title: feature.title,
            description: feature.description || '',
            status: feature.status || 'Not Started',
            tags: feature.tags || [],
            startDate: feature.startDate,
            endDate: feature.endDate,
        };

        setData(prev => ({ ...prev, features: [...prev.features, newFeature] }));

        await fetch('/api/features', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFeature)
        });
        return newFeature;
    }, []);

    const updateFeature = useCallback(async (featureId, updates) => {
        setData(prev => ({
            ...prev,
            features: prev.features.map(f => f.id === featureId ? { ...f, ...updates } : f),
        }));

        await fetch(`/api/features/${featureId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }, []);

    const deleteFeature = useCallback(async (featureId) => {
        setData(prev => ({
            ...prev,
            features: prev.features.filter(f => f.id !== featureId),
        }));

        await fetch(`/api/features/${featureId}`, {
            method: 'DELETE'
        });
    }, []);

    return {
        plans: data.plans,
        loadPlanData,
        createPlan,
        updatePlan,
        deletePlan,
        getPlan,
        getPlanByNumericId,
        getLanes,
        createLane,
        updateLane,
        deleteLane,
        getFeatures,
        getFeaturesForPlan,
        createFeature,
        updateFeature,
        deleteFeature,
    };
}
