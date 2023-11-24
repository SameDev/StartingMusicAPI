import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";

import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";

class PlaylistController {
  async listPlaylist (req: Request, res: Response) {
    const search = req.query.search;
    const idPlaylist = req.query.id;
    const id = parseInt(idPlaylist, 10);
    try {
      let playlists;
      if (search) {
        playlists = await prisma.playlist.findMany({
          include: {
            tags: true,
            musicas: true,
            criador: {
              select: {
                nome: true,
                id: true
              }
            }
          },
          where: {
            nome: {
              contains: search,
              mode: "insensitive"
            }
          }
        });
      } else if (id) {
        playlists = await prisma.playlist.findUnique({
          include: {
            tags: true,
            musicas: true,
            criador: {
              select: {
                nome: true,
                id: true
              }
            }
          },
          where: {
            id
          }
        });
      } else {
        playlists = await prisma.playlist.findMany({
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
      }

      const resultQuery = Object.assign({}, playlists);
      res.send({ playlists: resultQuery });
    }
    catch (error) {
      throw new NotFoundError("Ocorreu um erro!");
      console.error(error);
    }
  }

  async createPlaylist (req: Request, res: Response) {
    const { nome, descricao, foto, tags } = req.body;

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido");
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded) => {
      const userId = decoded.id;
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido");
      }
      if (decoded && decoded.cargo) {
        const userCargo = decoded.cargo;
        console.log(userCargo);

        if (userCargo === "USUARIO") {
          throw new UnauthorizedError("Você não possui permissões para esta ação!");
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido");
      }

      const dateNow = Date.now();
      const dataAtual = new Date(dateNow);

      if (typeof tags != "object") {
        throw new BadRequestError("Tipo de dado incorreto para tags, use um array");
      }

      await prisma.playlist.create({
        data: {
          nome,
          descricao,
          foto,
          data: dataAtual.toISOString(),
          tags: {
            connect: tags.map((tagId: object) => ({ id: tagId }))
          },
          criador: {
            connect: {
              id: userId
            }
          }
        }
      })
        .then((playlist) => {
          res
            .status(201)
            .json({ message: "Playlist criada com sucesso!", playlist: playlist });
        })
        .catch((error) => {
          console.error(error);
          throw new ApiError("Não foi possível criar a playlist", 500);
        });
    });
  }

  async updatePlaylist (req: Request, res: Response) {
    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido");
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded) => {
      const playlistId = req.params.id;
      const id = parseInt(playlistId, 10);

      const userId = decoded.id;
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido");
      }
      if (decoded && decoded.cargo) {
        const userCargo = decoded.cargo;
        console.log(userCargo);

        if (userCargo === "USUARIO") {
          throw new UnauthorizedError("Você não possui permissões para esta ação!");
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido");
      }

      try {
        const playlist = await prisma.playlist.findUnique({
          where: {
            id
          },
          include: {
            tags: true
          }
        });

        if (!playlist) {
          throw new NotFoundError("Música não encontrada, verifique se passou o ID corretamente!");
        }

        const { nome, descricao, foto, tags } = req.body;

        const dataToUpdate: Record<string, any> = {};

        if (nome) dataToUpdate.nome = nome;
        if (descricao) dataToUpdate.descricao = descricao;
        if (foto) dataToUpdate.foto = foto;
        if (tags) dataToUpdate.tags = { connect: tags.map((tagId: object) => ({ id: tagId })) };

        const updatedPlaylist = await prisma.playlist.update({
          where: { id },
          data: dataToUpdate,
          include: {
            tags: true,
            musicas: true
          }
        });

        res.status(201).json({ message: "Playlist atualizada com sucesso!", music: updatedPlaylist });
      } catch (error) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ message: error.message });
        } else {
          console.error(error);
          throw new ApiError("Não foi possível atualizar a playlist", 500);
        }
      }
    });
  }
}

export default new PlaylistController();