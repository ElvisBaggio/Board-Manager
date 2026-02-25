import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get key results for a lane
router.get('/', async (req, res) => {
    const { laneId } = req.query;
    if (!laneId) return res.status(400).json({ error: 'laneId obrigatório' });

    try {
        const rows = await db('key_results')
            .where('lane_id', laneId)
            .orderBy('created_at', 'asc');

        const krs = rows.map(kr => ({
            ...kr,
            laneId: kr.lane_id,
            targetValue: kr.target_value,
            currentValue: kr.current_value,
            createdAt: kr.created_at,
        }));
        res.json(krs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar key results' });
    }
});

// Get all key results for a board (aggregated across lanes)
router.get('/board', async (req, res) => {
    const { boardId } = req.query;
    if (!boardId) return res.status(400).json({ error: 'boardId obrigatório' });

    try {
        const rows = await db('key_results')
            .join('lanes', 'key_results.lane_id', 'lanes.id')
            .where('lanes.board_id', boardId)
            .select('key_results.*', 'lanes.title as lane_title')
            .orderBy('key_results.created_at', 'asc');

        const krs = rows.map(kr => ({
            ...kr,
            laneId: kr.lane_id,
            laneTitle: kr.lane_title,
            targetValue: kr.target_value,
            currentValue: kr.current_value,
            createdAt: kr.created_at,
        }));
        res.json(krs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar key results do board' });
    }
});

// Create a key result
router.post('/', async (req, res) => {
    const { id, laneId, title, targetValue, currentValue, unit } = req.body;
    if (!id || !laneId || !title) {
        return res.status(400).json({ error: 'id, laneId e title obrigatórios' });
    }

    try {
        await db('key_results').insert({
            id,
            lane_id: laneId,
            title,
            target_value: targetValue || 100,
            current_value: currentValue || 0,
            unit: unit || '%',
        });
        res.status(201).json({ id, laneId, title, targetValue, currentValue, unit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar key result' });
    }
});

// Update a key result
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, targetValue, currentValue, unit } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (targetValue !== undefined) updateData.target_value = targetValue;
    if (currentValue !== undefined) updateData.current_value = currentValue;
    if (unit !== undefined) updateData.unit = unit;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nada para atualizar' });
    }

    try {
        const count = await db('key_results').where('id', id).update(updateData);
        if (count === 0) return res.status(404).json({ error: 'Key result não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar key result' });
    }
});

// Delete a key result
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('key_results').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Key result não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar key result' });
    }
});

export default router;
