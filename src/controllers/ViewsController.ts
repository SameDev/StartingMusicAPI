import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";

import {
  UnauthorizedError,
  ApiError,
  NotFoundError,
} from "../helpers/api-erros";

class ViewsController {
  async listView(req: Request, res: Response) {
    try {
      const token = req.headers.authorization;

      if (!token) {
        throw new UnauthorizedError("Token não fornecido", res);
      }

      jwt.verify(
        token,
        process.env.JWT_PASS ?? "",
        async (err, decoded: any) => {
          if (err) {
            console.error(err);
            throw new UnauthorizedError("Token inválido", res);
          }

          if (!decoded || !decoded.id) {
            throw new UnauthorizedError("Usuário não autenticado", res);
          }

          const userId = decoded.id;
          
          const views = await prisma.visualizacao.findMany({
            include: {
              musica: {
                include: {
                  usuarioGostou: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          });

          const response = views.map((view) => {
            const usuarioGostou = view.musica.usuarioGostou.some(
              (user) => user.id === userId
            );

            return {
              ...view,
              usuarioGostou,
            };
          });

          res.status(200).json({ views: response });
        }
      );
    } catch (error) {
      console.error(error);
      throw new ApiError("Erro de requisição", 500, res);
    }
  }

  createView(req: Request, res: Response) {
    try {
      const { userId, songId, data } = req.body;

      const token = req.headers.authorization;
      if (!token) {
        throw new UnauthorizedError("Token não fornecido", res);
      }

      jwt.verify(
        token,
        process.env.JWT_PASS ?? "",
        async (err, decoded: any) => {
          if (err) {
            console.error(err);
            throw new UnauthorizedError("Token inválido", res);
          }

          const date = new Date(data).toISOString();

          const likedSong = await prisma.music.findUnique({
            where: {
              id: songId,
            },
            include: {
              usuarioGostou: {
                select: {
                  id: true,
                },
              },
            },
          });

          if (!likedSong) {
            throw new NotFoundError("Música não encontrada", res);
          }

          const usuarioGostou = likedSong.usuarioGostou.some(
            (user) => user.id === userId
          );

          const view = await prisma.visualizacao.create({
            data: {
              userId,
              songId,
              dataVisualizacao: date,
            },
          });

          res.status(201).json({
            message: "Visualização criada!",
            visualizacao: view,
            usuarioGostou, 
          });
        }
      );
    } catch (error: any) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          message: error.message,
          maisInfo: error.message,
        });
      }

      return res.status(500).json({
        message: "Erro interno do servidor",
        maisInfo: error.message,
      });
    }
  }
}

export default new ViewsController();
