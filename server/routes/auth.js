import express from 'express';
import db from '../db.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    const { id, name, email, password } = req.body;
    try {
        // Check if this is the first user — auto-promote to admin
        const [{ count }] = await db('users').count('* as count');
        const role = parseInt(count) === 0 ? 'admin' : 'user';

        await db('users').insert({
            id,
            name,
            email,
            password_hash: password,
            role,
        });
        res.status(201).json({ user: { id, name, email, role } });
    } catch (error) {
        // Handle unique constraint across different databases
        const msg = error.message || '';
        if (msg.includes('UNIQUE') || msg.includes('unique') || msg.includes('duplicate') || error.code === '23505') {
            return res.status(400).json({ error: 'Email já está em uso.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db('users')
            .select('id', 'name', 'email', 'password_hash', 'role')
            .where('email', email)
            .first();

        if (!user || user.password_hash !== password) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        // Auto-promote to admin if no admin exists in the system
        let role = user.role || 'user';
        const [{ count }] = await db('users').where('role', 'admin').count('* as count');
        if (parseInt(count) === 0) {
            await db('users').where('id', user.id).update({ role: 'admin' });
            role = 'admin';
        }

        // Return user without password
        const { password_hash, ...safeUser } = user;
        safeUser.role = role;
        res.json({ user: safeUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});

export default router;
