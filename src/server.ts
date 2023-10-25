import express, { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// ROUTES
import userRouters from './routes/musicRouters'
import musicRouters from './routes/userRouters'

const app = express();
const route = Router();
app.use(express.json());
const prisma = new PrismaClient();

route.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Servidor Ativo' });
});

app.use('/user', userRouters);
app.use('/music', musicRouters)

app.use(route);
app.listen(3333, () => console.log('Server running on port 3333'));
