import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all plans for a user
router.get('/', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId obrigatório' });

    try {
        const rows = await db('plans')
            .where('user_id', userId)
            .orderBy('created_at', 'desc');

        const plans = rows.map(b => ({
            ...b,
            userId: b.user_id,
            justCause: b.just_cause,
            createdAt: b.created_at,
        }));
        res.json(plans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar planejamentos' });
    }
});

// Create a new plan
router.post('/', async (req, res) => {
    const { id, userId, title, visibility, justCause, vision, mission } = req.body;
    try {
        await db('plans').insert({
            id,
            user_id: userId,
            title,
            visibility: visibility || 'private',
            just_cause: justCause || '',
            vision: vision || '',
            mission: mission || '',
        });
        res.status(201).json({ id, userId, title, visibility, justCause, vision, mission });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar planejamento' });
    }
});

// Update a plan
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, visibility, justCause, vision, mission } = req.body;
    try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (visibility !== undefined) updateData.visibility = visibility;
        if (justCause !== undefined) updateData.just_cause = justCause;
        if (vision !== undefined) updateData.vision = vision;
        if (mission !== undefined) updateData.mission = mission;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Nada para atualizar' });
        }

        const count = await db('plans')
            .where('id', id)
            .update(updateData);

        if (count === 0) return res.status(404).json({ error: 'Planejamento não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar planejamento' });
    }
});

// Delete a plan
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('plans').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Planejamento não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar planejamento' });
    }
});

export default router;
