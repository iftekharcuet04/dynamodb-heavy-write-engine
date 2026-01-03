import express from 'express';
import apiRouter from './routes/index.js'; // This is the file you just showed me

const app = express();
app.use(express.json());

// CORRECT: Pass the router directly
app.use('/api', apiRouter); 

app.listen(3000, () => console.log('Server running on port 3000'));