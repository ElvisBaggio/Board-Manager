import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get features for a lane or all features for a board
router.get('/', (req, res) => {
    const { laneId, boardId } = req.query;
    if (!laneId && !boardId) return res.status(400).json({ error: 'laneId ou boardId obrigatório' });

    try {
        let stmt;
        let rows;
        if (laneId) {
            stmt = db.prepare('SELECT * FROM features WHERE lane_id = ? ORDER BY start_date ASC');
            rows = stmt.all(laneId);
        } else {
            stmt = db.prepare(`
                SELECT f.* FROM features f
                JOIN lanes l ON f.lane_id = l.id
                WHERE l.board_id = ?
                ORDER BY f.start_date ASC
            `);
            rows = stmt.all(boardId);
        }

        // Parse JSON tags and map snake_case to camelCase
        const features = rows.map(f => ({
            ...f,
            laneId: f.lane_id,
            startDate: f.start_date,
            endDate: f.end_date,
            tags: JSON.parse(f.tags_json || '[]')
        }));

        res.json(features);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar features' });
    }
});

// Create a feature
router.post('/', (req, res) => {
    const { id, laneId, title, description, status, tags, startDate, endDate } = req.body;
    try {
        const stmt = db.prepare(`
            INSERT INTO features (id, lane_id, title, description, status, tags_json, start_date, end_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, laneId, title, description || '', status || 'Not Started', JSON.stringify(tags || []), startDate, endDate);
        res.status(201).json({ id, laneId, title, description, status, tags, startDate, endDate });
    } catch (error) {
        console.error('Feature create error:', error);
        res.status(500).json({ error: 'Erro ao criar feature' });
    }
});

// Update a feature (including move/resize)
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, status, tags, startDate, endDate, laneId } = req.body;
    try {
        const updates = [];
        const params = [];

        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (tags !== undefined) { updates.push('tags_json = ?'); params.push(JSON.stringify(tags)); }
        if (startDate !== undefined) { updates.push('start_date = ?'); params.push(startDate); }
        if (endDate !== undefined) { updates.push('end_date = ?'); params.push(endDate); }
        if (laneId !== undefined) { updates.push('lane_id = ?'); params.push(laneId); } // For drag & drop between lanes

        if (updates.length === 0) return res.status(400).json({ error: 'Nada para atualizar' });

        params.push(id);
        const stmt = db.prepare(`UPDATE features SET ${updates.join(', ')} WHERE id = ?`);
        const result = stmt.run(...params);

        if (result.changes === 0) return res.status(404).json({ error: 'Feature não encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar feature' });
    }
});

// Delete a feature
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare('DELETE FROM features WHERE id = ?');
        const result = stmt.run(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Feature não encontrada' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar feature' });
    }
});

export default router;
