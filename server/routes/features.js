import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get features for a lane or all features for a board
router.get('/', async (req, res) => {
    const { laneId, boardId } = req.query;
    if (!laneId && !boardId) return res.status(400).json({ error: 'laneId ou boardId obrigatório' });

    try {
        let rows;
        if (laneId) {
            rows = await db('features')
                .where('lane_id', laneId)
                .orderBy('start_date', 'asc');
        } else {
            rows = await db('features')
                .join('lanes', 'features.lane_id', 'lanes.id')
                .where('lanes.board_id', boardId)
                .select('features.*')
                .orderBy('features.start_date', 'asc');
        }

        // Parse JSON tags and map snake_case to camelCase
        const features = rows.map(f => ({
            ...f,
            laneId: f.lane_id,
            startDate: f.start_date,
            endDate: f.end_date,
            effortHours: f.effort_hours || 0,
            tags: JSON.parse(f.tags_json || '[]'),
        }));

        res.json(features);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar features' });
    }
});

// Create a feature
router.post('/', async (req, res) => {
    const { id, laneId, title, description, status, tags, startDate, endDate, effortHours } = req.body;
    try {
        await db('features').insert({
            id,
            lane_id: laneId,
            title,
            description: description || '',
            status: status || 'Not Started',
            tags_json: JSON.stringify(tags || []),
            start_date: startDate,
            end_date: endDate,
            effort_hours: effortHours || 0,
        });
        res.status(201).json({ id, laneId, title, description, status, tags, startDate, endDate, effortHours });
    } catch (error) {
        console.error('Feature create error:', error);
        res.status(500).json({ error: 'Erro ao criar feature' });
    }
});

// Update a feature (including move/resize)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, status, tags, startDate, endDate, laneId, effortHours } = req.body;
    try {
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (tags !== undefined) updateData.tags_json = JSON.stringify(tags);
        if (startDate !== undefined) updateData.start_date = startDate;
        if (endDate !== undefined) updateData.end_date = endDate;
        if (laneId !== undefined) updateData.lane_id = laneId;
        if (effortHours !== undefined) updateData.effort_hours = effortHours;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Nada para atualizar' });
        }

        const count = await db('features').where('id', id).update(updateData);
        if (count === 0) return res.status(404).json({ error: 'Feature não encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar feature' });
    }
});

// Delete a feature
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('features').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Feature não encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar feature' });
    }
});

export default router;
