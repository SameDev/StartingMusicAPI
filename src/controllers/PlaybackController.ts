/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";

class PlaybackController {
  async listPlayback(req: Request, res: Response) {
    try {
      const playback = await prisma.reproducao.findMany();

      res.status(200).json({playback});
    }
    catch (error) {
      console.error(error);
      throw new ApiError("Erro de requisição", 500, res);
    }
  }
  async createPlayback(req: Request, res: Response) {
    const { userId, songId, dataReproducao, tempoEscutado } = req.body;

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }
      if (decoded) {
        if (decoded.cargo) {
          console.log(decoded.cargo);
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido", res);
      }

      const duracao = await prisma.music.findUnique({
        where: {
          id: songId
        },
        select: {
          duracao: true
        }
      });

      const tempoMax = duracao?.duracao || "00:00";

      prisma.reproducao.create({
        data: {
          userId,
          songId,
          dataReproducao,
          tempoEscutado,
          tempoMax
        }
      })
        .then((playback) => {
          res
            .status(201)
            .json({ message: "Reprodução criada!", reproducao: playback });
        })
        .catch((error) => {
          console.error(error);
          throw new ApiError("Não foi possível criar a reprodução", 500, res);
        });
    });
  }
}

export default new PlaybackController();
