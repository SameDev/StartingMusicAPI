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
    const id = req.params.id;
    const userId = parseInt(id)
    try {
      const playlists = await prisma.playlist.findMany({
        where: {
          userId
        },
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
      })
  
      res.send({ playlists });
    } catch (error) {
      console.error(error);
      throw new NotFoundError("Ocorreu um erro!", res);
      
    }
  }

  async createPlaylist(req: Request, res: Response) {
    const { nome, descricao, foto, tags, userId } = req.body;

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      if (err) {
        console.error(err);
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

  async deletePlaylit(req: Request, res: Response) {
    const playlistId = req.params.id;
    const id = parseInt(playlistId, 10);

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }

      prisma.playlist.delete({
        where: {
          id
        }
      }).then(() => {
        res.send("Playlist deletada com sucesso!");
      }).catch((error) => {
        throw new ApiError(error, 400, res);
      })
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

  async removeSong(req: Request, res: Response) {
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
        const { musicas } = req.body;
      
        const verificarPlaylist = await prisma.playlist.findUnique({
          where: {
            id,
          },
          include: {
            tags: true,
            musicas: true,
          },
        });
      
        if (!verificarPlaylist) {
          throw new NotFoundError(
            "Playlist não encontrada, verifique se passou o ID corretamente!",
            res
          );
        }
      
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
            id: true,
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
      
        const removerMusicasDaPlaylist = await prisma.playlist.update({
          where: {
            id,
          },
          data: {
            musicas: {
              disconnect: foundMusicIds.map((id) => ({ id })),
            },
          },
        });
      
        res.status(201).json({
          message: "Música(s) removida(s) com sucesso da playlist!",
          playlist: removerMusicasDaPlaylist,
        });
      } catch (error) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ message: error.message });
        } else {
          console.error(error);
          throw new ApiError(
            "Não foi possível remover a(s) música(s) da playlist",
            500,
            res
          );
        }
      }
      
    });
  }
}

export default new PlaylistController();
