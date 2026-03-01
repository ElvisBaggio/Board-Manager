import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ═══════════════════════════════════════════
// EXECUTION ITEMS (sub-items of Initiatives/Features)
// ═══════════════════════════════════════════

// GET all items for a feature/initiative
router.get('/', async (req, res) => {
    const { featureId } = req.query;
    if (!featureId) return res.status(400).json({ error: 'featureId obrigatório' });
    try {
        const items = await db('execution_items')
            .where('feature_id', featureId)
            .leftJoin('team_members', 'execution_items.assignee_id', 'team_members.id')
            .select('execution_items.*', 'team_members.name as assignee_name', 'team_members.avatar_color as assignee_color')
            .orderBy('execution_items.sort_order', 'asc');
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET aggregate counts by feature for a board (for roadmap badges)
router.get('/counts', async (req, res) => {
    const { boardId } = req.query;
    if (!boardId) return res.status(400).json({ error: 'boardId obrigatório' });
    try {
        const counts = await db('execution_items')
            .join('features', 'execution_items.feature_id', 'features.id')
            .join('lanes', 'features.lane_id', 'lanes.id')
            .where('lanes.board_id', boardId)
            .select('execution_items.feature_id')
            .count('execution_items.id as total')
            .select(db.raw("SUM(CASE WHEN execution_items.status = 'Done' THEN 1 ELSE 0 END) as done"))
            .groupBy('execution_items.feature_id');
        res.json(counts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create item
router.post('/', async (req, res) => {
    const { featureId, title, description, itemType, assigneeId, effortHours } = req.body;
    if (!featureId || !title) return res.status(400).json({ error: 'featureId e title obrigatórios' });
    try {
        const id = crypto.randomUUID();
        const maxOrder = await db('execution_items').where('feature_id', featureId).max('sort_order as max').first();
        await db('execution_items').insert({
            id, feature_id: featureId, title,
            description: description || '',
            item_type: itemType || 'Feature',
            status: 'Not Started',
            assignee_id: assigneeId || null,
            effort_hours: effortHours || 0,
            sort_order: (maxOrder?.max ?? -1) + 1,
        });
        const created = await db('execution_items').where('id', id).first();
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update item
router.put('/:id', async (req, res) => {
    const { title, description, itemType, status, assigneeId, effortHours, sortOrder } = req.body;
    try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (itemType !== undefined) updateData.item_type = itemType;
        if (status !== undefined) updateData.status = status;
        if (assigneeId !== undefined) updateData.assignee_id = assigneeId;
        if (effortHours !== undefined) updateData.effort_hours = effortHours;
        if (sortOrder !== undefined) updateData.sort_order = sortOrder;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Nada para atualizar' });
        }
        await db('execution_items').where('id', req.params.id).update(updateData);
        const updated = await db('execution_items').where('id', req.params.id).first();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT batch reorder
router.put('/reorder/batch', async (req, res) => {
    const { items } = req.body; // [{ id, sortOrder }]
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'items array obrigatório' });
    try {
        for (const item of items) {
            await db('execution_items').where('id', item.id).update({ sort_order: item.sortOrder });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE item
router.delete('/:id', async (req, res) => {
    try {
        const count = await db('execution_items').where('id', req.params.id).del();
        if (count === 0) return res.status(404).json({ error: 'Não encontrado' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
