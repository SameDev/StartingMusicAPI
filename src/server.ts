import express, { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const route = Router();
app.use(express.json());

const prisma = new PrismaClient();

route.get('/', (req: Request, res: Response) => {
  res.json({ message: 'hello world with TypeScript' });
});

route.post('/user', async (req: Request, res: Response) => {
  const { nome, post, email } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        name: nome,
        email: email,
        posts: {
          create: {
            title: post,
          },
        },
      },
    });
    console.log(user);
    await prisma.$disconnect();
    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta.target.includes('email')) {
      // Handle duplicate email error
      res.status(400).json({ error: 'Email address is already in use.' });
    } else {
      // Handle other errors
      console.error(error);
      await prisma.$disconnect();
      res.status(500).json({ error: 'An error occurred while creating the user.' });
    }
  }
});

app.use(route);
app.listen(3333, () => console.log('Server running on port 3333'));
