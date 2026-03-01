import { useState, useCallback, useEffect } from 'react';
import { generateId } from '../utils/data';

// Custom hook to manage fetching and optimistic updates
export function useBoards(userId) {
    const [data, setData] = useState({ boards: [], lanes: [], features: [] });

    // Load initial boards for user
    useEffect(() => {
        if (!userId) return;
        fetch(`/api/boards?userId=${userId}`)
            .then(res => res.json())
            .then(boards => setData(prev => ({ ...prev, boards })))
            .catch(console.error);
    }, [userId]);

    // ── Boards ──────────────────────────────────
    const createBoard = useCallback(async (title, visibility = 'Privado') => {
        const tempId = generateId();
        const payload = { id: tempId, userId, title, visibility };

        // Optimistic
        setData(prev => ({ ...prev, boards: [{ ...payload, createdAt: new Date().toISOString() }, ...prev.boards] }));

        await fetch('/api/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return payload;
    }, [userId]);

    const updateBoard = useCallback(async (boardId, updates) => {
        setData(prev => ({
            ...prev,
            boards: prev.boards.map(b => b.id === boardId ? { ...b, ...updates } : b),
        }));

        await fetch(`/api/boards/${boardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }, []);

    const deleteBoard = useCallback(async (boardId) => {
        setData(prev => ({
            ...prev,
            boards: prev.boards.filter(b => b.id !== boardId),
        }));

        await fetch(`/api/boards/${boardId}`, {
            method: 'DELETE'
        });
    }, []);

    const getBoard = useCallback((boardId) => {
        return data.boards.find(b => b.id === boardId) || null;
    }, [data.boards]);

    const getBoardByNumericId = useCallback((numId) => {
        const idx = parseInt(numId, 10) - 1;
        if (idx >= 0 && idx < data.boards.length) {
            return data.boards[idx];
        }
        return null;
    }, [data.boards]);

    // ── Roadmap Data Loading (Lanes & Features) ─────
    // To be called by Roadmap component to ensure we have timeline data
    const loadBoardData = useCallback(async (boardId) => {
        if (!boardId) return;
        try {
            const [lanesRes, featuresRes] = await Promise.all([
                fetch(`/api/lanes?boardId=${boardId}`),
                fetch(`/api/features?boardId=${boardId}`)
            ]);
            const lanes = await lanesRes.json();
            const features = await featuresRes.json();

            setData(prev => {
                // Remove old lanes/features for this board, add new ones
                const safePrevLanes = prev.lanes.filter(l => l.boardId !== boardId);
                const laneIds = lanes.map(l => l.id);
                const safePrevFeatures = prev.features.filter(f => !laneIds.includes(f.laneId));
                return {
                    ...prev,
                    lanes: [...safePrevLanes, ...lanes],
                    features: [...safePrevFeatures, ...features]
                };
            });
        } catch (error) {
            console.error('Error loading board data:', error);
        }
    }, []);

    // ── Lanes ───────────────────────────────────
    const getLanes = useCallback((boardId) => {
        return data.lanes
            .filter(l => l.boardId === boardId)
            .sort((a, b) => a.sort_order - b.sort_order);
    }, [data.lanes]);

    const createLane = useCallback(async (boardId, title, strategicChoiceId = null) => {
        const tempId = generateId();
        const existing = data.lanes.filter(l => l.boardId === boardId);
        const lane = { id: tempId, boardId, title, strategicChoiceId, sort_order: existing.length };

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

    const getFeaturesForBoard = useCallback((boardId) => {
        const laneIds = data.lanes.filter(l => l.boardId === boardId).map(l => l.id);
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
        boards: data.boards,
        loadBoardData,
        createBoard,
        updateBoard,
        deleteBoard,
        getBoard,
        getBoardByNumericId,
        getLanes,
        createLane,
        updateLane,
        deleteLane,
        getFeatures,
        getFeaturesForBoard,
        createFeature,
        updateFeature,
        deleteFeature,
    };
}
