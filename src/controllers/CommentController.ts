import { Request, Response } from "express";
import prisma from "../database";
import jwt, { JwtPayload } from "jsonwebtoken";

import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";

interface DecodedToken extends JwtPayload {
  id: number;
}

class CommentController {
  async listComments(req: Request, res: Response): Promise<Response> {
    try {
      const comments = await prisma.comments.findMany({
        include: { autor: true, musicas: true },
      });
      return res.status(200).json({ comments });
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      } else if (error instanceof Error) {
        return res.status(500).json({
          message: "Erro interno do servidor",
          maisInfo: error.message,
        });
      } else {
        return res.status(500).json({
          message: "Erro interno do servidor",
          maisInfo: "Erro desconhecido",
        });
      }
    }
  }

  async createComment(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, songId, conteudo } = req.body;
      const token = req.headers.authorization;

      if (!token) {
        throw new UnauthorizedError("Token não fornecido", res);
      }

      const decoded = jwt.verify(token, process.env.JWT_PASS ?? "") as DecodedToken;

      if (!decoded || !decoded.id) {
        throw new UnauthorizedError("Token inválido", res);
      }

      const comment = await prisma.comments.create({
        data: {
          userId: decoded.id,
          conteudo,
          nome,
          musicas: {
            connect: { id: songId },
          },
        },
      });

      return res.status(201).json({ comment });
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      } else if (error instanceof Error) {
        return res.status(500).json({
          message: "Erro interno do servidor",
          maisInfo: error.message,
        });
      } else {
        return res.status(500).json({
          message: "Erro interno do servidor",
          maisInfo: "Erro desconhecido",
        });
      }
    }
  }

  async updateComment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params as { id: string };
      const { conteudo } = req.body as { conteudo: string };
      const token = req.headers.authorization;

      if (!token) {
        throw new UnauthorizedError("Token não fornecido", res);
      }

      const decoded = jwt.verify(token, process.env.JWT_PASS ?? "") as DecodedToken;

      if (!decoded || !decoded.id) {
        throw new UnauthorizedError("Token inválido", res);
      }

      const comment = await prisma.comments.update({
        where: { id: Number(id) },
        data: { conteudo },
      });

      return res.status(200).json({ comment });
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      } else if (error instanceof Error) {
        return res.status(500).json({
          message: "Erro interno do servidor",
          maisInfo: error.message,
        });
      } else {
        return res.status(500).json({
          message: "Erro interno do servidor",
          maisInfo: "Erro desconhecido",
        });
      }
    }
  }

  async deleteComment(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params as { id: string };
      const token = req.headers.authorization;

      if (!token) {
        throw new UnauthorizedError("Token não fornecido", res);
      }

      const decoded = jwt.verify(token, process.env.JWT_PASS ?? "") as DecodedToken;

      if (!decoded || !decoded.id) {
        throw new UnauthorizedError("Token inválido", res);
      }

      await prisma.comments.delete({
        where: { id: Number(id) },
      });

      return res.status(204).send();
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      } else if (error instanceof Error) {
        return res.status(500).json({
          message: "Erro interno do servidor",
          maisInfo: error.message,
        });
      } else {
        return res.status(500).json({
          message: "Erro interno do servidor",
          maisInfo: "Erro desconhecido",
        });
      }
    }
  }
}

export default new CommentController();
