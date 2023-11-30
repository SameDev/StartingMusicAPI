/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

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
  async listPlaylist(req: Request, res: Response) {
    const search = req.query.search;
    const idPlaylist = req.query.id;

    if (idPlaylist) {
    const id = parseInt(idPlaylist.toString(), 10);
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
                id: true,
              },
            },
          },
          where: {
            nome: {
              contains: search.toString(),
              mode: "insensitive",
            },
          },
        });
      } else if (id) {
        playlists = await prisma.playlist.findUnique({
          include: {
            tags: true,
            musicas: true,
            criador: {
              select: {
                nome: true,
                id: true,
              },
            },
          },
          where: {
            id,
          },
        });
      } else {
        playlists = await prisma.playlist.findMany({
          include: {
            tags: true,
            musicas: true,
            criador: {
              select: {
                nome: true,
                id: true,
              },
            },
          },
        });
      }

      const resultQuery = Object.assign({}, playlists);
      res.send({ playlists: resultQuery });
    } catch (error) {
      throw new NotFoundError("Ocorreu um erro!", res);
      console.error(error);
    }
  }
  }

  async createPlaylist(req: Request, res: Response) {
    const { nome, descricao, foto, tags } = req.body;

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      const userId = decoded.id;
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }
      if (decoded && decoded.cargo) {
        const userCargo = decoded.cargo;
        console.log(userCargo);

        if (userCargo === "USUARIO") {
          throw new UnauthorizedError(
            "Você não possui permissões para esta ação!", res
          );
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido", res);
      }

      const dateNow = Date.now();
      const dataAtual = new Date(dateNow);

      if (typeof tags != "object") {
        throw new BadRequestError(
          "Tipo de dado incorreto para tags, use um array", res
        );
      }

      await prisma.playlist
        .create({
          data: {
            nome,
            descricao,
            foto,
            data: dataAtual.toISOString(),
            tags: {
              connect: tags.map((tagId: object) => ({ id: tagId })),
            },
            criador: {
              connect: {
                id: userId,
              },
            },
          },
        })
        .then((playlist) => {
          res
            .status(201)
            .json({
              message: "Playlist criada com sucesso!",
              playlist: playlist,
            });
        })
        .catch((error) => {
          console.error(error);
          throw new ApiError("Não foi possível criar a playlist", 500, res);
        });
    });
  }

  async updatePlaylist(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      const playlistId = req.params.id;
      const id = parseInt(playlistId, 10);

      const userId = decoded.id;
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }
      if (decoded && decoded.cargo) {
        const userCargo = decoded.cargo;
        console.log(userCargo);

        if (userCargo === "USUARIO") {
          throw new UnauthorizedError(
            "Você não possui permissões para esta ação!", res
          );
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido", res);
      }

      try {
        const playlist = await prisma.playlist.findUnique({
          where: {
            id,
          },
          include: {
            tags: true,
          },
        });

        if (!playlist) {
          throw new NotFoundError(
            "Playlist não encontrada, verifique se passou o ID corretamente!", res
          );
        }

        const { nome, descricao, foto, tags } = req.body;

        const dataToUpdate: Record<string, any> = {};

        if (nome) dataToUpdate.nome = nome;
        if (descricao) dataToUpdate.descricao = descricao;
        if (foto) dataToUpdate.foto = foto;
        if (tags)
          dataToUpdate.tags = {
            connect: tags.map((tagId: object) => ({ id: tagId })),
          };

        const updatedPlaylist = await prisma.playlist.update({
          where: { id },
          data: dataToUpdate,
          include: {
            tags: true,
            musicas: true,
          },
        });

        res
          .status(201)
          .json({
            message: "Playlist atualizada com sucesso!",
            playlist: updatedPlaylist,
          });
      } catch (error) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ message: error.message });
        } else {
          console.error(error);
          throw new ApiError("Não foi possível atualizar a playlist", 500, res);
        }
      }
    });
  }

  async addSong(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      const playlistId = req.params.id;
      const id = parseInt(playlistId, 10);

      if (err) {
        console.error(err);
        throw new ApiError(err.toString(), 500, res);
      }
      if (decoded && decoded.cargo) {
        const userCargo = decoded.cargo;
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido", res);
      }

      try {
        const playlist = await prisma.playlist.findUnique({
          where: {
            id,
          },
          include: {
            tags: true,
            musicas: true,
          },
        });

        if (!playlist) {
          throw new NotFoundError(
            "Playlist não encontrada, verifique se passou o ID corretamente!", res
          );
        }

        const { musicas } = req.body;

        if (!Array.isArray(musicas)) {
          return res.send("Por favor, passe um array de IDs de músicas!");
        }

        const verificarMusicas = await prisma.music.findMany({
          where: {
            id: {
              in: musicas,
            },
          },
          select: {
            id: true
          },
        });

        const foundMusicIds = verificarMusicas.map((musica) => musica.id);
        const missingMusicIds = musicas.filter(
          (id) => !foundMusicIds.includes(id)
        );

        if (missingMusicIds.length > 0) {
          return res.send(
            `As seguintes músicas não foram encontradas: ${missingMusicIds.join(
              ", "
            )}`
          );
        }

        const adicionarPlaylist = await prisma.playlist.update({
          where: { id },
          data: {
            musicas: {
              connect: musicas.map((idMusica: any) => ({
                id: idMusica,
              })),
            },
          },
          include: {
            tags: true,
            musicas: true,
          },
        });
        

        res
          .status(201)
          .json({
            message: "Música(s) adicionado com sucesso!",
            playlist: adicionarPlaylist,
          });
      } catch (error) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ message: error.message });
        } else {
          console.error(error);
          throw new ApiError("Não foi possível atualizar a playlist", 500, res);
        }
      }
    });
  }
}

export default new PlaylistController();
