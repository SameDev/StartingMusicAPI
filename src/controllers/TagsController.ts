/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";

import {
  UnauthorizedError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";

class TagsController {
  async createTag(req: Request, res: Response) {
    const { nome } = req.body;

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", (err, decoded: any) => {
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }
      if (decoded) {
        if (decoded.cargo) {
          const userCargo = decoded.cargo;
          

          if (userCargo !== "ADMIN") {
            throw new UnauthorizedError(
              "Você não possui permissões para esta ação!",
              res
            );
          }
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido", res);
      }

      prisma.tags.findUnique({
        where: {
          nome
        },
        })
        .then((existingTag) => {
          if (existingTag) {
            res.status(400).send("Você não pode adicionar uma tag que já existe!");
          } else {
            prisma.tags
              .create({
                data: {
                  nome,
                },
              })
              .then((tag) => {
                res.status(200).send({ Message: "Tag criada com sucesso!", tag: tag });
              })
              .catch((error) => {
                throw new ApiError(error, 400, res);
              });
          }
        })
        .catch((error) => {
          throw new ApiError("Ocorreu um erro!\n" + error, 500, res);
        });
    });
  }
  async updateTag(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const { nome } = req.body;

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", (err, decoded: any) => {
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }
      if (decoded) {
        if (decoded.cargo) {
          const userCargo = decoded.cargo;
          

          if (userCargo !== "ADMIN") {
            throw new UnauthorizedError(
              "Você não possui permissões para esta ação!",
              res
            );
          }
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido", res);
      }

      prisma.tags
        .findFirst({
          where: {
            id,
          },
        })
        .then((result) => {
          if (result) {
            prisma.tags
              .update({
                where: {
                  id,
                },
                data: {
                  nome,
                },
              })
              .then((tag) => {
                res.send({ Message: "Tag atualizada com sucesso!", tag: tag });
              })
              .catch((error) => {
                throw new ApiError(error, 400, res);
              });
          } else {
            res.send("Você não pode atualizar uma tag que não existe!");
          }
        })
        .catch((error) => {
          throw new ApiError("Ocorreu um erro!\n" + error, 500, res);
        });
    });
  }
  async deleteTag(req: Request, res: Response) {
    const tagId = req.params.id;

    console.log(tagId);

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", (err, decoded: any) => {
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }
      if (decoded) {
        if (decoded.cargo) {
          const userCargo = decoded.cargo;
          

          if (userCargo !== "ADMIN") {
            throw new UnauthorizedError(
              "Você não possui permissões para esta ação!",
              res
            );
          }
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido", res);
      }

      const id = parseInt(tagId, 10);

      prisma.tags
        .findFirst({
          where: {
            id,
          },
        })
        .then((result) => {
          if (result) {
            prisma.tags
              .delete({
                where: {
                  id,
                },
              })
              .then(() => {
                res.send({ Message: "Tag removida com sucesso!" });
              })
              .catch((error) => {
                throw new ApiError(error, 400, res);
              });
          } else {
            res.send("Você não remover uma tag que não existe!");
          }
        })
        .catch((error) => {
          throw new ApiError("Ocorreu um erro!\n" + error, 500, res);
        });
    });
  }

  async listTags(req: Request, res: Response) {
    const search = req.query.search;
    const idTags = req.query.id;
    const page = req.query.page ? parseInt(req.query.page.toString(), 10) : 1; // Página atual
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize.toString(), 10) : 10; // Tamanho da página

    try {
        let tags;
        let totalTags;

        if (idTags) {
            const id = parseInt(idTags.toString(), 10);

            if (id) {
                tags = await prisma.tags.findUnique({
                    include: {
                        musicas: true,
                        playlist: true,
                    },
                    where: {
                        id,
                    },
                });
            }
        }

        if (search) {
            tags = await prisma.tags.findMany({
                include: {
                    musicas: true,
                    playlist: true,
                },
                where: {
                    nome: {
                        contains: search.toString(),
                        mode: "insensitive",
                    },
                },
                skip: (page - 1) * pageSize, // Pular resultados para a paginação
                take: pageSize, // Tamanho da página
            });
            totalTags = await prisma.tags.count({
                where: {
                    nome: {
                        contains: search.toString(),
                        mode: "insensitive",
                    },
                },
            });
        } else {
            tags = await prisma.tags.findMany({
                include: {
                    musicas: true,
                    playlist: true,
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            });
            totalTags = await prisma.tags.count();
        }

        const totalPages = Math.ceil(totalTags / pageSize);

        res.status(200).json({ tags, total: totalTags, totalPages });
    } catch (error) {
        console.error(error);
        throw new NotFoundError("Ocorreu um erro!", res);
    }
  }
}

export default new TagsController();
