import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', async (req, res) => {
    const requestingUserRole = req.headers['x-user-role'];
    if (requestingUserRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Somente administradores.' });
    }

    try {
        const rows = await db('users')
            .select('id', 'name', 'email', 'role', 'created_at')
            .orderBy('created_at', 'asc');

        const users = rows.map(u => ({
            ...u,
            createdAt: u.created_at,
        }));
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

// Create user (admin only)
router.post('/', async (req, res) => {
    const requestingUserRole = req.headers['x-user-role'];
    if (requestingUserRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    const userRole = ['admin', 'user'].includes(role) ? role : 'user';
    const id = 'usr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    try {
        await db('users').insert({
            id,
            name,
            email,
            password_hash: password,
            role: userRole,
        });
        res.status(201).json({ id, name, email, role: userRole });
    } catch (error) {
        const msg = error.message || '';
        if (msg.includes('UNIQUE') || msg.includes('unique') || msg.includes('duplicate') || error.code === '23505') {
            return res.status(409).json({ error: 'Email já cadastrado.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
});

// Update user role (admin only)
router.put('/:id/role', async (req, res) => {
    const requestingUserRole = req.headers['x-user-role'];
    if (requestingUserRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Role inválida. Use "admin" ou "user".' });
    }

    try {
        const count = await db('users').where('id', id).update({ role });
        if (count === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar role' });
    }
});

// Delete user (admin only)
router.delete('/:id', async (req, res) => {
    const requestingUserRole = req.headers['x-user-role'];
    const requestingUserId = req.headers['x-user-id'];

    if (requestingUserRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { id } = req.params;

    // Prevent self-deletion
    if (id === requestingUserId) {
        return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    }

    try {
        const count = await db('users').where('id', id).del();
        if (count === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
});

export default router;
