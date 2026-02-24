import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all lanes for a board
router.get('/', (req, res) => {
    const boardId = req.query.boardId;
    if (!boardId) return res.status(400).json({ error: 'boardId obrigatório' });

    try {
        const stmt = db.prepare('SELECT * FROM lanes WHERE board_id = ? ORDER BY sort_order ASC, created_at ASC');
        const rows = stmt.all(boardId);
        const lanes = rows.map(l => ({
            ...l,
            boardId: l.board_id,
            sortOrder: l.sort_order,
        }));
        res.json(lanes);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar lanes' });
    }
});

// Create a lane
router.post('/', (req, res) => {
    const { id, boardId, title } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO lanes (id, board_id, title) VALUES (?, ?, ?)');
        stmt.run(id, boardId, title);
        res.status(201).json({ id, boardId, title });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar lane' });
    }
});

// Update a lane
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, sort_order } = req.body;
    try {
        // Build dynamic query
        const updates = [];
        const params = [];
        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }

        if (updates.length === 0) return res.status(400).json({ error: 'Nada para atualizar' });

        params.push(id);
        const stmt = db.prepare(`UPDATE lanes SET ${updates.join(', ')} WHERE id = ?`);
        const result = stmt.run(...params);

        if (result.changes === 0) return res.status(404).json({ error: 'Lane não encontrada' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar lane' });
    }
});

// Delete a lane
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM lanes WHERE id = ?');
        const result = stmt.run(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Lane não encontrada' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar lane' });
    }
});

export default router;
