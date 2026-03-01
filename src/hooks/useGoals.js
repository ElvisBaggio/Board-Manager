import { useState, useCallback } from 'react';

export function useGoals(boardId) {
    const [boardGoals, setBoardGoals] = useState([]);
    const [choiceGoals, setChoiceGoals] = useState([]);
    const [goalObjectiveLinks, setGoalObjectiveLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBoardGoals = useCallback(async () => {
        if (!boardId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/strategic-choices/board-goals/${boardId}`);
            if (!res.ok) throw new Error('Falha ao buscar goals');
            const data = await res.json();
            setBoardGoals(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    const fetchBoardGoalLinks = useCallback(async () => {
        if (!boardId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/strategic-choices/board-goal-links/${boardId}`);
            if (!res.ok) throw new Error('Falha ao buscar links de goals');
            const data = await res.json();
            setGoalObjectiveLinks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    const fetchGoalsByChoice = useCallback(async (choiceId) => {
        if (!choiceId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/strategic-choices/${choiceId}/goals`);
            if (!res.ok) throw new Error('Falha ao buscar goals');
            const data = await res.json();
            setChoiceGoals(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addGoal = async (choiceId, goalData) => {
        try {
            const res = await fetch(`/api/strategic-choices/${choiceId}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalData),
            });
            if (!res.ok) throw new Error('Falha ao salvar');
            const saved = await res.json();
            setChoiceGoals(prev => [...prev, saved]);
            // fetchBoardGoals can be called by component if needed
            return saved;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const updateGoal = async (id, updates) => {
        setChoiceGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
        setBoardGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
        try {
            const res = await fetch(`/api/strategic-choices/goals/${id}`, {
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

    const deleteGoal = async (id) => {
        setChoiceGoals(prev => prev.filter(g => g.id !== id));
        setBoardGoals(prev => prev.filter(g => g.id !== id));
        try {
            const res = await fetch(`/api/strategic-choices/goals/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao deletar');
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const linkGoalToObjective = async (goalId, laneId) => {
        try {
            const res = await fetch(`/api/strategic-choices/goals/${goalId}/links`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ laneId })
            });
            if (!res.ok) throw new Error('Falha ao vincular');
            const saved = await res.json();
            setGoalObjectiveLinks(prev => [...prev, saved]);
            return saved;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const unlinkGoalFromObjective = async (linkId) => {
        setGoalObjectiveLinks(prev => prev.filter(l => l.id !== linkId));
        try {
            const res = await fetch(`/api/strategic-choices/links/${linkId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao desvincular');
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        boardGoals, choiceGoals, goalObjectiveLinks, loading, error,
        fetchBoardGoals, fetchGoalsByChoice, fetchBoardGoalLinks,
        addGoal, updateGoal, deleteGoal,
        linkGoalToObjective, unlinkGoalFromObjective
    };
}
