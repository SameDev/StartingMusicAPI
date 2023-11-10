import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";
/*
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros"; */

class PlaylistController {
  async listAllPlaylists (req: Request, res: Response) {
    const playlists =  await prisma.playlist.findMany({
      include: {
        tags: true,
        musicas: true,
        criador: {
          select: {
            nome: true,
            id: true
          }
        }
      }
    });
    const todasPlaylist = Object.assign({}, playlists);
    res.send({ playlists: todasPlaylist });
  }
}

export default new PlaylistController();