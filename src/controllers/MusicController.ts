import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";

import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";



class MusicController {
  async uploadMusic(req: Request, res: Response) {
    const { nome, artista,duracao, imageUrl, tags , artistaId } = req.body;
    const host = req.headers.host || "";
    const url = host+'/uploads/'+req.file?.filename || "";
    

    const artistaIdArray = Array.isArray(req.body.artistaId)
        ? req.body.artistaId
        : JSON.parse(req.body.artistaId);

    const tagsArray = Array.isArray(req.body.tags)
        ? req.body.tags
        : JSON.parse(req.body.tags);

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
          

          if (userCargo === "USUARIO") {
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

      const dateNow = Date.now();
      const dataAtual = new Date(dateNow);

      if (typeof artistaIdArray != "object") {
        throw new BadRequestError(
          "Tipo de dado incorreto para artistaId, use um array",
          res
        );
      }
      if (typeof tagsArray != "object") {
        throw new BadRequestError(
          "Tipo de dado incorreto para tags, use um array",
          res
        );
      }

      prisma.music
        .create({
          data: {
            nome,
            artista,
            url,
            duracao,
            data_lanc: dataAtual.toISOString(),
            image_url: imageUrl,
            artistaId: {
              connect: artistaIdArray.map((idArtista: object) => ({
                id: idArtista,
              })),
            },
            tags: {
              connect: tagsArray.map((tagId: object) => ({ id: tagId })),
            },
            
          },
        })
        .then((music) => {
          res
            .status(201)
            .json({ message: "Música criada com sucesso!", music: music });
        })
        .catch((error) => {
          console.error(error);
          throw new ApiError("Não foi possível criar a música", 500, res);
        });
    });
  }

  async updateMusic(req: Request, res: Response) {
    const songId = req.params.id;
    const id = parseInt(songId, 10);

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }

      if (decoded && decoded.cargo) {
        const userCargo = decoded.cargo;
        

        if (userCargo === "USUARIO") {
          throw new UnauthorizedError(
            "Você não possui permissões para esta ação!",
            res
          );
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido", res);
      }

      try {
        const music = await prisma.music.findUnique({
          where: {
            id,
          },
          include: {
            tags: true,
            artistaId: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!music) {
          throw new NotFoundError(
            "Música não encontrada, verifique se passou o ID corretamente!",
            res
          );
        }

        const {
          nome,
          artista,
          url,
          duracao,
          imageUrl,
          data_lanc,
          artistaId,
          tags,
        } = req.body;

        const dataToUpdate: Record<string, any> = {};

        if (nome) dataToUpdate.nome = nome;
        if (artista) dataToUpdate.artista = artista;
        if (url) dataToUpdate.url = url;
        if (duracao) dataToUpdate.duracao = duracao;
        if (imageUrl) dataToUpdate.image_url = imageUrl;
        if (data_lanc) dataToUpdate.data_lanc = data_lanc;
        if (artistaId)
          dataToUpdate.artistaId = {
            connect: artistaId.map((idArtista: object) => ({ id: idArtista })),
          };
        if (tags)
          dataToUpdate.tags = {
            connect: tags.map((tagId: object) => ({ id: tagId })),
          };

        const updatedMusic = await prisma.music.update({
          where: { id },
          data: dataToUpdate,
          include: {
            tags: true,
            playlist: true,
            usuarioGostou: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            },
            artistaId: {
              select: {
                id: true,
              },
            },
          },
        });

        res.status(201).json({
          message: "Música atualizada com sucesso!",
          music: updatedMusic,
        });
      } catch (error) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ message: error.message });
        } else {
          console.error(error);
          throw new ApiError("Não foi possível atualizar a música", 500, res);
        }
      }
    });
  }

  async deleteMusic(req: Request, res: Response) {
    const id = req.params.id;
    const musicId = parseInt(id, 10);

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }

      if (decoded && decoded.cargo) {
        const userCargo = decoded.cargo;
        

        if (userCargo === "USUARIO") {
          throw new UnauthorizedError(
            "Você não possui permissões para esta ação!",
            res
          );
        }
      } else {
        console.log(decoded);
        throw new UnauthorizedError("Token inválido", res);
      }

      try {
        const music = await prisma.music.findUnique({
          where: {
            id: musicId,
          },
        });

        if (!music) {
          throw new NotFoundError("Música não encontrada, verifique o ID", res);
        }

        await prisma.music.delete({
          where: {
            id: music.id,
          },
        });

        res.send({ message: "Música excluída com sucesso!" });
      } catch (error) {
        if (error instanceof NotFoundError) {
          res.status(404).json({ Error: error.message });
        } else if (error instanceof ApiError) {
          res.status(500).json({ Error: error.message });
        } else {
          console.error(error);
          res.status(500).json({ Error: "Erro de requisição" });
        }
      }
    });
  }

  async listSongs(req: Request, res: Response) {
    const search = req.query.search;
    const songsId = req.query.id;
    
      try {
        let songs;

        if (songsId) {
          const id = parseInt(songsId.toString(), 10);

          if (id) {
            songs = await prisma.music.findUnique({
              where: {
                id,
              },
              include: {
                playlist: true,
                artistaId: {
                  select: {
                    id: true,
                  },
                },
                usuarioGostou: {
                  select: {
                    id: true,
                    nome: true,
                    email: true
                  }
                },
                tags: true,
              },
            });
          }
        }

        if (search) {
          songs = await prisma.music.findMany({
            include: {
              playlist: true,
              artistaId: {
                select: {
                  id: true,
                },
              },
              tags: true,
              usuarioGostou: {
                select: {
                  id: true,
                  nome: true,
                  email: true
                }
              }
            },
            where: {
              nome: {
                contains: search.toString(),
                mode: "insensitive",
              },
            },
          });
        } else {
          songs = await prisma.music.findMany({
            include: {
              tags: true,
              artistaId: {
                select: {
                  id: true,
                },
              },
              playlist: true,
              usuarioGostou: {
                select: {
                  id: true,
                  nome: true,
                  email: true
                }
              }
            },
          });
        }

        res.status(200).json({ songs });
      } catch (error) {
        console.error(error);
        throw new ApiError("Erro de requisição", 500, res);
      }
    }
  }

export default new MusicController();
