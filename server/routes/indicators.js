import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ═══════════════════════════════════════════
// PRODUCT INDICATORS (measure Initiatives)
// ═══════════════════════════════════════════

// GET indicators for a feature/initiative
router.get('/product', async (req, res) => {
    const { featureId } = req.query;
    if (!featureId) return res.status(400).json({ error: 'featureId obrigatório' });
    try {
        const indicators = await db('product_indicators')
            .where('feature_id', featureId)
            .orderBy('created_at', 'asc');
        res.json(indicators);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all product indicators for a board
router.get('/product/plan/:planId', async (req, res) => {
    try {
        const indicators = await db('product_indicators')
            .join('features', 'product_indicators.feature_id', 'features.id')
            .join('lanes', 'features.lane_id', 'lanes.id')
            .where('lanes.plan_id', req.params.planId)
            .select('product_indicators.*', 'features.title as feature_title', 'lanes.title as objective_title')
            .orderBy('product_indicators.created_at', 'asc');
        res.json(indicators);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create product indicator
router.post('/product', async (req, res) => {
    const { featureId, title, targetValue, unit, lowerIsBetter } = req.body;
    if (!featureId || !title) return res.status(400).json({ error: 'featureId e title obrigatórios' });
    try {
        const id = crypto.randomUUID();
        await db('product_indicators').insert({
            id, feature_id: featureId, title,
            target_value: targetValue || 100,
            current_value: 0,
            unit: unit || '%',
            lower_is_better: lowerIsBetter ? 1 : 0,
        });
        const created = await db('product_indicators').where('id', id).first();
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update product indicator
router.put('/product/:id', async (req, res) => {
    const { title, targetValue, currentValue, unit, lowerIsBetter } = req.body;
    try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (targetValue !== undefined) updateData.target_value = targetValue;
        if (currentValue !== undefined) updateData.current_value = currentValue;
        if (unit !== undefined) updateData.unit = unit;
        if (lowerIsBetter !== undefined) updateData.lower_is_better = lowerIsBetter ? 1 : 0;

        await db('product_indicators').where('id', req.params.id).update(updateData);
        const updated = await db('product_indicators').where('id', req.params.id).first();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE product indicator
router.delete('/product/:id', async (req, res) => {
    try {
        const count = await db('product_indicators').where('id', req.params.id).del();
        if (count === 0) return res.status(404).json({ error: 'Não encontrado' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════
// INDICATOR ↔ KEY RESULT LINKS (N:N)
// ═══════════════════════════════════════════

// GET links for an indicator
router.get('/product/:indicatorId/kr-links', async (req, res) => {
    try {
        const links = await db('indicator_kr_links')
            .join('key_results', 'indicator_kr_links.kr_id', 'key_results.id')
            .where('indicator_kr_links.indicator_id', req.params.indicatorId)
            .select('indicator_kr_links.*', 'key_results.title as kr_title');
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all kr links for a board
router.get('/plan-kr-links/:planId', async (req, res) => {
    try {
        const links = await db('indicator_kr_links')
            .join('product_indicators', 'indicator_kr_links.indicator_id', 'product_indicators.id')
            .join('features', 'product_indicators.feature_id', 'features.id')
            .join('lanes', 'features.lane_id', 'lanes.id')
            .where('lanes.plan_id', req.params.planId)
            .select('indicator_kr_links.*');
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST link indicator to KR
router.post('/product/:indicatorId/kr-links', async (req, res) => {
    const { krId } = req.body;
    if (!krId) return res.status(400).json({ error: 'krId obrigatório' });
    try {
        const id = crypto.randomUUID();
        await db('indicator_kr_links').insert({ id, indicator_id: req.params.indicatorId, kr_id: krId });
        res.status(201).json({ id, indicator_id: req.params.indicatorId, kr_id: krId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE unlink
router.delete('/kr-links/:id', async (req, res) => {
    try {
        await db('indicator_kr_links').where('id', req.params.id).del();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════
// EFFICIENCY INDICATORS (measure Execution)
// ═══════════════════════════════════════════

// GET efficiency indicators for a board
router.get('/efficiency', async (req, res) => {
    const { planId } = req.query;
    if (!planId) return res.status(400).json({ error: 'planId obrigatório' });
    try {
        const indicators = await db('efficiency_indicators')
            .where('plan_id', planId)
            .orderBy('created_at', 'asc');
        res.json(indicators);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create efficiency indicator
router.post('/efficiency', async (req, res) => {
    const { planId, title, value, unit, period } = req.body;
    if (!planId || !title) return res.status(400).json({ error: 'planId e title obrigatórios' });
    try {
        const id = crypto.randomUUID();
        await db('efficiency_indicators').insert({
            id, plan_id: planId, title,
            value: value || 0,
            unit: unit || '',
            period: period || '',
        });
        const created = await db('efficiency_indicators').where('id', id).first();
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update efficiency indicator
router.put('/efficiency/:id', async (req, res) => {
    const { title, value, unit, period } = req.body;
    try {
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (value !== undefined) updateData.value = value;
        if (unit !== undefined) updateData.unit = unit;
        if (period !== undefined) updateData.period = period;

        await db('efficiency_indicators').where('id', req.params.id).update(updateData);
        const updated = await db('efficiency_indicators').where('id', req.params.id).first();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE efficiency indicator
router.delete('/efficiency/:id', async (req, res) => {
    try {
        const count = await db('efficiency_indicators').where('id', req.params.id).del();
        if (count === 0) return res.status(404).json({ error: 'Não encontrado' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
