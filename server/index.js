import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import boardsRoutes from './routes/boards.js';
import lanesRoutes from './routes/lanes.js';
import featuresRoutes from './routes/features.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/lanes', lanesRoutes);
app.use('/api/features', featuresRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
