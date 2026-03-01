import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ═══════════════════════════════════════════
// STRATEGIC CHOICES
// ═══════════════════════════════════════════

// GET all choices for a board
router.get('/', async (req, res) => {
    const { boardId } = req.query;
    if (!boardId) return res.status(400).json({ error: 'boardId obrigatório' });
    try {
        const choices = await db('strategic_choices')
            .where('board_id', boardId)
            .orderBy('sort_order', 'asc');
        res.json(choices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single choice with goals and objectives
router.get('/:id', async (req, res) => {
    try {
        const choice = await db('strategic_choices').where('id', req.params.id).first();
        if (!choice) return res.status(404).json({ error: 'Escolha não encontrada' });

        const goals = await db('goals_kpis')
            .where('strategic_choice_id', choice.id)
            .orderBy('created_at', 'asc');

        const objectives = await db('lanes')
            .where('strategic_choice_id', choice.id)
            .orderBy('sort_order', 'asc');

        res.json({ ...choice, goals, objectives });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create choice
router.post('/', async (req, res) => {
    const { boardId, title, description, color } = req.body;
    if (!boardId || !title) return res.status(400).json({ error: 'boardId e title obrigatórios' });
    try {
        const id = crypto.randomUUID();
        const maxOrder = await db('strategic_choices').where('board_id', boardId).max('sort_order as max').first();
        await db('strategic_choices').insert({
            id, board_id: boardId, title, description: description || '',
            color: color || '#ff9500', sort_order: (maxOrder?.max ?? -1) + 1,
        });
        const created = await db('strategic_choices').where('id', id).first();
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update choice
router.put('/:id', async (req, res) => {
    const { title, description, color, sort_order } = req.body;
    try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (color !== undefined) updateData.color = color;
        if (sort_order !== undefined) updateData.sort_order = sort_order;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Nada para atualizar' });
        }
        await db('strategic_choices').where('id', req.params.id).update(updateData);
        const updated = await db('strategic_choices').where('id', req.params.id).first();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE choice
router.delete('/:id', async (req, res) => {
    try {
        // Unlink objectives first (set null)
        await db('lanes').where('strategic_choice_id', req.params.id).update({ strategic_choice_id: null });
        const count = await db('strategic_choices').where('id', req.params.id).del();
        if (count === 0) return res.status(404).json({ error: 'Não encontrada' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════
// GOALS / KPIs
// ═══════════════════════════════════════════

// GET goals for a strategic choice
router.get('/:choiceId/goals', async (req, res) => {
    try {
        const goals = await db('goals_kpis')
            .where('strategic_choice_id', req.params.choiceId)
            .orderBy('created_at', 'asc');
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all goals for a board (aggregate across all choices)
router.get('/board-goals/:boardId', async (req, res) => {
    try {
        const goals = await db('goals_kpis')
            .join('strategic_choices', 'goals_kpis.strategic_choice_id', 'strategic_choices.id')
            .where('strategic_choices.board_id', req.params.boardId)
            .select('goals_kpis.*', 'strategic_choices.title as choice_title')
            .orderBy('goals_kpis.created_at', 'asc');
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create goal
router.post('/:choiceId/goals', async (req, res) => {
    const { title, targetValue, unit, frequency } = req.body;
    if (!title) return res.status(400).json({ error: 'title obrigatório' });
    try {
        const id = crypto.randomUUID();
        await db('goals_kpis').insert({
            id, strategic_choice_id: req.params.choiceId,
            title, target_value: targetValue || 100, current_value: 0,
            unit: unit || '%', frequency: frequency || 'quarterly',
        });
        const created = await db('goals_kpis').where('id', id).first();
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update goal
router.put('/goals/:id', async (req, res) => {
    const { title, targetValue, currentValue, unit, frequency } = req.body;
    try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (targetValue !== undefined) updateData.target_value = targetValue;
        if (currentValue !== undefined) updateData.current_value = currentValue;
        if (unit !== undefined) updateData.unit = unit;
        if (frequency !== undefined) updateData.frequency = frequency;

        await db('goals_kpis').where('id', req.params.id).update(updateData);
        const updated = await db('goals_kpis').where('id', req.params.id).first();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE goal
router.delete('/goals/:id', async (req, res) => {
    try {
        const count = await db('goals_kpis').where('id', req.params.id).del();
        if (count === 0) return res.status(404).json({ error: 'Não encontrado' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════
// GOAL ↔ OBJECTIVE LINKS
// ═══════════════════════════════════════════

// GET links for a goal
router.get('/goals/:goalId/links', async (req, res) => {
    try {
        const links = await db('goal_objective_links')
            .join('lanes', 'goal_objective_links.lane_id', 'lanes.id')
            .where('goal_objective_links.goal_id', req.params.goalId)
            .select('goal_objective_links.*', 'lanes.title as objective_title');
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all links for a board
router.get('/board-goal-links/:boardId', async (req, res) => {
    try {
        const links = await db('goal_objective_links')
            .join('lanes', 'goal_objective_links.lane_id', 'lanes.id')
            .where('lanes.board_id', req.params.boardId)
            .select('goal_objective_links.*');
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST link a goal to an objective
router.post('/goals/:goalId/links', async (req, res) => {
    const { laneId } = req.body;
    if (!laneId) return res.status(400).json({ error: 'laneId obrigatório' });
    try {
        const id = crypto.randomUUID();
        await db('goal_objective_links').insert({ id, goal_id: req.params.goalId, lane_id: laneId });
        res.status(201).json({ id, goal_id: req.params.goalId, lane_id: laneId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE unlink
router.delete('/links/:id', async (req, res) => {
    try {
        await db('goal_objective_links').where('id', req.params.id).del();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
