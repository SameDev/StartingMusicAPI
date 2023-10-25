import { Request, Response } from 'express';

class UserController {
  createUser(req: Request, res: Response) {
    const a = req.body;
    console.dir(a)
  }

  getUserById(req: Request, res: Response) {
    const a = req.body;
    console.dir(a)
  }
}

export default new UserController();
