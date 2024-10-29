import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";

import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";

class ViewsController {
  async listView(req: Request, res: Response) {
    try {
      const views = await prisma.visualizacao.findMany();

      res.status(200).json({ views });
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
          if (decoded) {
            if (decoded.cargo) {
              console.log(decoded.cargo);
            }
          } else {
            console.log(decoded);
            throw new UnauthorizedError("Token inválido", res);
          }

          const date = new Date(data).toISOString();

          prisma.visualizacao
            .create({
              data: {
                userId,
                songId,
                dataVisualizacao: date,
              },
            })
            .then((view) => {
              res
                .status(201)
                .json({ message: "Visualização criada!", visualizacao: view });
            })
            .catch((error) => {
              console.error(error);
              throw new ApiError(
                "Não foi possível criar a visualização!",
                500,
                res
              );
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
