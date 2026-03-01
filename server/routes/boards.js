import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all boards for a user
router.get('/', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId obrigatório' });

    try {
        const rows = await db('boards')
            .where('user_id', userId)
            .orderBy('created_at', 'desc');

        const boards = rows.map(b => ({
            ...b,
            userId: b.user_id,
            justCause: b.just_cause,
            createdAt: b.created_at,
        }));
        res.json(boards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar boards' });
    }
});

// Create a new board
router.post('/', async (req, res) => {
    const { id, userId, title, visibility, justCause, vision, mission } = req.body;
    try {
        await db('boards').insert({
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
        res.status(500).json({ error: 'Erro ao criar board' });
    }
});

// Update a board
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

        const count = await db('boards')
            .where('id', id)
            .update(updateData);

        if (count === 0) return res.status(404).json({ error: 'Board não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar board' });
    }
});

// Delete a board
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('boards').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Board não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar board' });
    }
});

export default router;
