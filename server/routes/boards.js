import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all boards for a user
router.get('/', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId obrigatório' });

    try {
        const stmt = db.prepare('SELECT * FROM boards WHERE user_id = ? ORDER BY created_at DESC');
        const rows = stmt.all(userId);
        const boards = rows.map(b => ({
            ...b,
            userId: b.user_id,
            createdAt: b.created_at,
        }));
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar boards' });
    }
});

// Create a new board
router.post('/', (req, res) => {
    const { id, userId, title, visibility } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO boards (id, user_id, title, visibility) VALUES (?, ?, ?, ?)');
        stmt.run(id, userId, title, visibility || 'private');
        res.status(201).json({ id, userId, title, visibility });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar board' });
    }
});

// Update a board
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, visibility } = req.body;
    try {
        const stmt = db.prepare('UPDATE boards SET title = ?, visibility = ? WHERE id = ?');
        const result = stmt.run(title, visibility, id);
        if (result.changes === 0) return res.status(404).json({ error: 'Board não encontrado' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar board' });
    }
});

// Delete a board
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM boards WHERE id = ?');
        const result = stmt.run(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Board não encontrado' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar board' });
    }
});

export default router;
