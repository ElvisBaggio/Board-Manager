import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all tags for a board
router.get('/', async (req, res) => {
    const { boardId } = req.query;
    if (!boardId) return res.status(400).json({ error: 'boardId obrigatório' });

    try {
        const rows = await db('tags')
            .where('board_id', boardId)
            .orderBy('name', 'asc');

        const tags = rows.map(t => ({
            ...t,
            boardId: t.board_id,
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
    let { id, boardId, name, color } = req.body;
    if (!name || !boardId) return res.status(400).json({ error: 'name e boardId obrigatórios' });

    // Auto-generate id if not provided
    if (!id) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    try {
        // Check if tag with same name already exists for this board
        const existing = await db('tags')
            .where('board_id', boardId)
            .whereRaw('LOWER(name) = LOWER(?)', [name])
            .first();

        if (existing) {
            return res.json({ id: existing.id, boardId, name, color: color || '#3498db', exists: true });
        }

        await db('tags').insert({
            id,
            board_id: boardId,
            name,
            color: color || '#3498db',
        });
        res.status(201).json({ id, boardId, name, color: color || '#3498db' });
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
