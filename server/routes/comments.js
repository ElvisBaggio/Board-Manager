import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET comments for a feature (with user name)
router.get('/', async (req, res) => {
    const { featureId } = req.query;
    if (!featureId) return res.status(400).json({ error: 'featureId obrigatório' });
    try {
        const rows = await db('comments')
            .join('users', 'comments.user_id', 'users.id')
            .where('comments.feature_id', featureId)
            .orderBy('comments.created_at', 'asc')
            .select('comments.*', 'users.name as user_name');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
});

// POST create comment
router.post('/', async (req, res) => {
    const { featureId, userId, content } = req.body;
    if (!featureId || !userId || !content?.trim()) {
        return res.status(400).json({ error: 'featureId, userId e content são obrigatórios' });
    }
    try {
        const id = crypto.randomUUID();
        await db('comments').insert({ id, feature_id: featureId, user_id: userId, content: content.trim() });
        const created = await db('comments')
            .join('users', 'comments.user_id', 'users.id')
            .where('comments.id', id)
            .select('comments.*', 'users.name as user_name')
            .first();
        res.status(201).json(created);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar comentário' });
    }
});

// DELETE comment
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('comments').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Comentário não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar comentário' });
    }
});

export default router;
