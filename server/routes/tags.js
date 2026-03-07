import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all tags for a plan
router.get('/', async (req, res) => {
    const { planId } = req.query;
    if (!planId) return res.status(400).json({ error: 'planId obrigatório' });

    try {
        const rows = await db('tags')
            .where('plan_id', planId)
            .orderBy('name', 'asc');

        const tags = rows.map(t => ({
            ...t,
            planId: t.plan_id,
            createdAt: t.created_at,
        }));
        res.json(tags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar tags' });
    }
});

// Create a tag
router.post('/', async (req, res) => {
    let { id, planId, name, color } = req.body;
    if (!name || !planId) return res.status(400).json({ error: 'name e planId obrigatórios' });

    // Auto-generate id if not provided
    if (!id) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    try {
        // Check if tag with same name already exists for this board
        const existing = await db('tags')
            .where('plan_id', planId)
            .whereRaw('LOWER(name) = LOWER(?)', [name])
            .first();

        if (existing) {
            return res.json({ id: existing.id, planId, name, color: color || '#3498db', exists: true });
        }

        await db('tags').insert({
            id,
            plan_id: planId,
            name,
            color: color || '#3498db',
        });
        res.status(201).json({ id, planId, name, color: color || '#3498db' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar tag' });
    }
});

// Update a tag
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, color } = req.body;

    try {
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (color !== undefined) updateData.color = color;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Nada para atualizar' });
        }

        const count = await db('tags').where('id', id).update(updateData);
        if (count === 0) return res.status(404).json({ error: 'Tag não encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar tag' });
    }
});

// Delete a tag
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('tags').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Tag não encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar tag' });
    }
});

export default router;
