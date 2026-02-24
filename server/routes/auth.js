import express from 'express';
import db from '../db.js';

const router = express.Router();

router.post('/register', (req, res) => {
    const { id, name, email, password } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)');
        // In a real app we'd hash the password here, but we will keep it simple for now as requested
        stmt.run(id, name, email, password);
        res.status(201).json({ user: { id, name, email } });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Email já está em uso.' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const stmt = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
        const user = stmt.get(email);

        if (!user || user.password_hash !== password) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        // Return user without password
        const { password_hash, ...safeUser } = user;
        res.json({ user: safeUser });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});

export default router;
