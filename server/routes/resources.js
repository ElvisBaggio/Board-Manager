import express from 'express';
import db from '../db.js';

const router = express.Router();

// ——— Team Members ———

// Get all members for a plan
router.get('/members', async (req, res) => {
    const { planId } = req.query;
    if (!planId) return res.status(400).json({ error: 'planId obrigatório' });

    try {
        const rows = await db('team_members')
            .where('plan_id', planId)
            .orderBy('name', 'asc');

        const members = rows.map(m => ({
            ...m,
            planId: m.plan_id,
            roleTitle: m.role_title,
            avatarColor: m.avatar_color,
            capacityHoursPerQuarter: m.capacity_hours_per_quarter,
            createdAt: m.created_at,
        }));
        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar membros' });
    }
});

// Create a member
router.post('/members', async (req, res) => {
    const { id, planId, name, roleTitle, avatarColor, capacityHoursPerQuarter } = req.body;
    if (!id || !planId || !name) {
        return res.status(400).json({ error: 'id, planId e name obrigatórios' });
    }

    try {
        await db('team_members').insert({
            id,
            plan_id: planId,
            name,
            role_title: roleTitle || '',
            avatar_color: avatarColor || '#3498db',
            capacity_hours_per_quarter: capacityHoursPerQuarter || 480,
        });
        res.status(201).json({ id, planId, name, roleTitle, avatarColor, capacityHoursPerQuarter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar membro' });
    }
});

// Update a member
router.put('/members/:id', async (req, res) => {
    const { id } = req.params;
    const { name, roleTitle, avatarColor, capacityHoursPerQuarter } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (roleTitle !== undefined) updateData.role_title = roleTitle;
    if (avatarColor !== undefined) updateData.avatar_color = avatarColor;
    if (capacityHoursPerQuarter !== undefined) updateData.capacity_hours_per_quarter = capacityHoursPerQuarter;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nada para atualizar' });
    }

    try {
        const count = await db('team_members').where('id', id).update(updateData);
        if (count === 0) return res.status(404).json({ error: 'Membro não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar membro' });
    }
});

// Delete a member
router.delete('/members/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('team_members').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Membro não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar membro' });
    }
});

// ——— Resource Allocations ———

// Get allocations for a board or feature
router.get('/allocations', async (req, res) => {
    const { planId, featureId } = req.query;

    try {
        let query = db('resource_allocations')
            .join('team_members', 'resource_allocations.member_id', 'team_members.id');

        if (featureId) {
            query = query.where('resource_allocations.feature_id', featureId);
        } else if (planId) {
            query = query.where('team_members.plan_id', planId);
        } else {
            return res.status(400).json({ error: 'planId ou featureId obrigatório' });
        }

        const rows = await query
            .select(
                'resource_allocations.*',
                'team_members.name as member_name',
                'team_members.avatar_color as member_color'
            )
            .orderBy('resource_allocations.created_at', 'asc');

        const allocations = rows.map(a => ({
            ...a,
            memberId: a.member_id,
            featureId: a.feature_id,
            hoursAllocated: a.hours_allocated,
            memberName: a.member_name,
            memberColor: a.member_color,
            createdAt: a.created_at,
        }));
        res.json(allocations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar alocações' });
    }
});

// Create an allocation
router.post('/allocations', async (req, res) => {
    const { id, memberId, featureId, hoursAllocated, quarter, year } = req.body;
    if (!id || !memberId || !featureId) {
        return res.status(400).json({ error: 'id, memberId e featureId obrigatórios' });
    }

    try {
        await db('resource_allocations').insert({
            id,
            member_id: memberId,
            feature_id: featureId,
            hours_allocated: hoursAllocated || 0,
            quarter: quarter || null,
            year: year || null,
        });
        res.status(201).json({ id, memberId, featureId, hoursAllocated, quarter, year });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar alocação' });
    }
});

// Update an allocation
router.put('/allocations/:id', async (req, res) => {
    const { id } = req.params;
    const { hoursAllocated, quarter, year } = req.body;

    const updateData = {};
    if (hoursAllocated !== undefined) updateData.hours_allocated = hoursAllocated;
    if (quarter !== undefined) updateData.quarter = quarter;
    if (year !== undefined) updateData.year = year;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nada para atualizar' });
    }

    try {
        const count = await db('resource_allocations').where('id', id).update(updateData);
        if (count === 0) return res.status(404).json({ error: 'Alocação não encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar alocação' });
    }
});

// Delete an allocation
router.delete('/allocations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await db('resource_allocations').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Alocação não encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar alocação' });
    }
});

export default router;
