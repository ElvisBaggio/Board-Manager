import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all risks for a plan
router.get('/', async (req, res) => {
    const { planId } = req.query;
    if (!planId) return res.status(400).json({ error: 'planId obrigatório' });

    try {
        const rows = await db('risks')
            .where('plan_id', planId)
            .orderBy('created_at', 'asc');

        const risks = rows.map(r => ({
            ...r,
            planId: r.plan_id,
            createdAt: r.created_at,
            score: r.impact * r.probability,
        }));
        res.json(risks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar riscos' });
    }
});

// Create a risk
router.post('/', async (req, res) => {
    const { id, planId, title, description, impact, probability, status, mitigation, owner } = req.body;
    if (!id || !planId || !title) {
        return res.status(400).json({ error: 'id, planId e title obrigatórios' });
    }

    try {
        await db('risks').insert({
            id,
            plan_id: planId,
            title,
            description: description || '',
            impact: impact || 1,
            probability: probability || 1,
            status: status || 'Open',
            mitigation: mitigation || '',
            owner: owner || '',
        });
        res.status(201).json({
            id, planId, title, description, impact, probability, status, mitigation, owner,
            score: (impact || 1) * (probability || 1),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar risco' });
    }
});

// Update a risk
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, impact, probability, status, mitigation, owner } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (impact !== undefined) updateData.impact = impact;
    if (probability !== undefined) updateData.probability = probability;
    if (status !== undefined) updateData.status = status;
    if (mitigation !== undefined) updateData.mitigation = mitigation;
    if (owner !== undefined) updateData.owner = owner;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nada para atualizar' });
    }

    try {
        const count = await db('risks').where('id', id).update(updateData);
        if (count === 0) return res.status(404).json({ error: 'Risco não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar risco' });
    }
});

// Delete a risk
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('risks').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Risco não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar risco' });
    }
});

export default router;
