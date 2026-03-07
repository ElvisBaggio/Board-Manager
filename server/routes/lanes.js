import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all lanes for a plan
router.get('/', async (req, res) => {
    const planId = req.query.planId;
    if (!planId) return res.status(400).json({ error: 'planId obrigatório' });

    try {
        const rows = await db('lanes')
            .where('plan_id', planId)
            .orderBy('sort_order', 'asc')
            .orderBy('created_at', 'asc');

        const lanes = rows.map(l => ({
            ...l,
            planId: l.plan_id,
            sortOrder: l.sort_order,
            strategicChoiceId: l.strategic_choice_id,
            problemOpportunity: l.problem_opportunity,
        }));
        res.json(lanes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar lanes' });
    }
});

// Create a lane
router.post('/', async (req, res) => {
    const { id, planId, title, strategicChoiceId, problemOpportunity } = req.body;
    try {
        await db('lanes').insert({
            id,
            plan_id: planId,
            title,
            strategic_choice_id: strategicChoiceId || null,
            problem_opportunity: problemOpportunity || '',
        });
        res.status(201).json({ id, planId, title, strategicChoiceId, problemOpportunity });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar lane' });
    }
});

// Update a lane
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, sort_order, strategicChoiceId, problemOpportunity } = req.body;
    try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (sort_order !== undefined) updateData.sort_order = sort_order;
        if (strategicChoiceId !== undefined) updateData.strategic_choice_id = strategicChoiceId;
        if (problemOpportunity !== undefined) updateData.problem_opportunity = problemOpportunity;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Nada para atualizar' });
        }

        const count = await db('lanes').where('id', id).update(updateData);
        if (count === 0) return res.status(404).json({ error: 'Lane não encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar lane' });
    }
});

// Delete a lane
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('lanes').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Lane não encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar lane' });
    }
});

export default router;
