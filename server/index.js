import express from 'express';
import cors from 'cors';
import db, { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import boardsRoutes from './routes/boards.js';
import lanesRoutes from './routes/lanes.js';
import featuresRoutes from './routes/features.js';
import tagsRoutes from './routes/tags.js';
import usersRoutes from './routes/users.js';
import okrsRoutes from './routes/okrs.js';
import resourcesRoutes from './routes/resources.js';
import risksRoutes from './routes/risks.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/lanes', lanesRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/okrs', okrsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/risks', risksRoutes);

// Initialize database then start server
initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
