import { Request, Response } from 'express';

class MusicController {
  uploadMusic(req: Request, res: Response) {
    const a = req.body;
    res.send("ow")
    console.dir(a)
  }

  getMusicById(req: Request, res: Response) {
    const userId = req.params.id;
    const a = req.body;
    res.send("ow "+userId)
    console.dir(a)
    console.log(userId)
  }
}

export default new MusicController();
