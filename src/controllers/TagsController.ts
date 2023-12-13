import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";

import {
  UnauthorizedError,
  BadRequestError,
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
        .then((existingTag: any) => {
          if (existingTag) {
            res.status(400).send("Você não pode adicionar uma tag que já existe!");
          } else {
            prisma.tags
              .create({
                data: {
                  nome,
                },
              })
              .then((tag: any) => {
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
    const nome = req.params.nome;

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

      const { newNome } = req.body;

      prisma.tags
        .findFirst({
          where: {
            nome,
          },
        })
        .then((result: any) => {
          if (result) {
            if (result.nome == newNome) {
              res.send("Você não pode atualizar para o mesmo nome!");
            }
            prisma.tags
              .update({
                where: {
                  nome,
                },
                data: {
                  nome,
                },
              })
              .then((tag: any) => {
                res.send({ Message: "Tag atualizada com sucesso!", tag: tag });
              })
              .catch((error) => {
                throw new ApiError(error, 400, res);
              });
          } else {
            res.send("Você não atualizar uma tag que não existe!");
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
        .then((result: any) => {
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

    try {
      let tags;

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
        });
      } else {
        tags = await prisma.tags.findMany({
          include: {
            musicas: true,
            playlist: true,
          },
        });
      }
      res.status(200).json({ tags });
    } catch (error) {
      throw new NotFoundError("Ocorreu um erro!", res);
      console.error(error);
    }
  }
}

export default new TagsController();
