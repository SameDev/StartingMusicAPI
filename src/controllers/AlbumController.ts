import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";
import { Prisma } from "@prisma/client";

class AlbumController {
  async listAll(req: Request, res: Response) {
    const search = req.query.search;

    try {
      let albums;

      if (search) {
        albums = await prisma.album.findMany({
          where: {
            OR: [
              { nome: { contains: search.toString(), mode: "insensitive" } },
              { artista: { contains: search.toString(), mode: "insensitive" } },
              { id: { equals: parseInt(search.toString(), 10) } },
            ],
          },
          include: {
            playlist: true,
            artistaId: true,
            tags: true,
            musicas: true,
            usuarioGostou: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        });
      } else {
        albums = await prisma.album.findMany({
          include: {
            playlist: true,
            artistaId: true,
            tags: true,
            musicas: true,
            usuarioGostou: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        });
      }

      res.status(200).json({ albums });
    } catch (error) {
      console.error(error);
      new ApiError("Ocorreu um erro interno na API!", 500, res);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        throw new UnauthorizedError("Token não fornecido", res);
      }

      jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
        if (err) {
          console.error(err);
          throw new UnauthorizedError("Token inválido", res);
        }

        if (!decoded || decoded.cargo === "USUARIO") {
          throw new UnauthorizedError(
            "Você não possui permissões para esta ação!",
            res
          );
        }

        const {
          nome,
          artista,
          imageUrl,
          date,
          artistaId,
          tags,
          musicas,
          desc,
          lancamento,
        } = req.body;

        if (!nome || !artista || !imageUrl || !date || !artistaId || !tags || !musicas || !desc) {
          throw new BadRequestError("Todos os campos são obrigatórios", res);
        }

        const musicasCriadas = await Promise.all(
          musicas.map(async (musicaInfo: any) => {
            const novaMusica = await prisma.music.create({
              data: {
                nome: musicaInfo.nome,
                url: musicaInfo.url,
                artista: artista,
                image_url: imageUrl,
                duracao: musicaInfo.duracao,
                data_lanc: musicaInfo.data_lanc,
                tags: {
                  connect: tags.map((tagId: number) => ({ id: tagId })),
                },
                artistaId: {
                  connect: {
                    id: artistaId,
                  },
                },
              },
            });
            return novaMusica;
          })
        );

        const novoAlbum = await prisma.album.create({
          data: {
            nome,
            artista,
            image_url: imageUrl,
            data_lanc: date,
            desc,
            lancamento,
            artistaId: {
              connect: { id: artistaId },
            },
            tags: {
              connect: tags.map((tagId: number) => ({ id: tagId })),
            },
            musicas: {
              connect: musicasCriadas.map((musica: any) => ({ id: musica.id })),
            },
          },
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
                email: true,
              },
            },
          },
        });

        res.status(201).json({ album: novoAlbum });
      });
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        new ApiError("Ocorreu um erro interno na API!", 500, res);
      }
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        throw new UnauthorizedError("Token não fornecido", res);
      }

      jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
        if (err) {
          console.error(err);
          throw new UnauthorizedError("Token inválido", res);
        }

        if (!decoded || decoded.cargo === "USUARIO") {
          throw new UnauthorizedError(
            "Você não possui permissões para esta ação!",
            res
          );
        }

        const albumId = parseInt(req.params.id);
        if (isNaN(albumId)) {
          throw new BadRequestError("ID do álbum inválido", res);
        }

        const album = await prisma.album.findUnique({
          where: { id: albumId },
        });

        if (!album) {
          throw new NotFoundError("Álbum não encontrado", res);
        }

        await prisma.album.delete({
          where: { id: albumId },
        });

        res.status(200).json({ message: "Álbum deletado com sucesso" });
      });
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        new ApiError("Ocorreu um erro interno na API!", 500, res);
      }
    }
  }

  async update(req: Request, res: Response) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        throw new UnauthorizedError("Token não fornecido", res);
      }

      jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
        if (err) {
          console.error(err);
          throw new UnauthorizedError("Token inválido", res);
        }

        if (!decoded || decoded.cargo === "USUARIO") {
          throw new UnauthorizedError(
            "Você não possui permissões para esta ação!",
            res
          );
        }

        const albumId = parseInt(req.params.id);
        if (isNaN(albumId)) {
          throw new BadRequestError("ID do álbum inválido", res);
        }

        const {
          nome,
          artista,
          imageUrl,
          date,
          artistaId,
          tags,
          musicas,
          desc,
          lancamento,
        } = req.body;

        if (!nome || !artista || !imageUrl || !date || !artistaId || !tags || !musicas || !desc) {
          throw new BadRequestError("Todos os campos são obrigatórios", res);
        }

        const album = await prisma.album.findUnique({
          where: { id: albumId },
        });

        if (!album) {
          throw new NotFoundError("Álbum não encontrado", res);
        }

        const musicasCriadas = await Promise.all(
          musicas.map(async (musicaInfo: any) => {
            let novaMusica;
            if (musicaInfo.id) {
              // Update existing music
              novaMusica = await prisma.music.update({
                where: { id: musicaInfo.id },
                data: {
                  nome: musicaInfo.nome,
                  url: musicaInfo.url,
                  artista: artista,
                  image_url: imageUrl,
                  duracao: musicaInfo.duracao,
                  data_lanc: musicaInfo.data_lanc,
                  tags: {
                    connect: tags.map((tagId: number) => ({ id: tagId })),
                  },
                  artistaId: {
                    connect: {
                      id: artistaId,
                    },
                  },
                },
              });
            } else {
              // Create new music
              novaMusica = await prisma.music.create({
                data: {
                  nome: musicaInfo.nome,
                  url: musicaInfo.url,
                  artista: artista,
                  image_url: imageUrl,
                  duracao: musicaInfo.duracao,
                  data_lanc: musicaInfo.data_lanc,
                  tags: {
                    connect: tags.map((tagId: number) => ({ id: tagId })),
                  },
                  artistaId: {
                    connect: {
                      id: artistaId,
                    },
                  },
                },
              });
            }
            return novaMusica;
          })
        );

        const updatedAlbum = await prisma.album.update({
          where: { id: albumId },
          data: {
            nome,
            artista,
            image_url: imageUrl,
            data_lanc: date,
            desc,
            lancamento,
            artistaId: {
              connect: { id: artistaId },
            },
            tags: {
              set: [],
              connect: tags.map((tagId: number) => ({ id: tagId })),
            },
            musicas: {
              set: [],
              connect: musicasCriadas.map((musica: any) => ({ id: musica.id })),
            },
          },
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
                email: true,
              },
            },
          },
        });

        res.status(200).json({ album: updatedAlbum });
      });
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        new ApiError("Ocorreu um erro interno na API!", 500, res);
      }
    }
  }
}

export default new AlbumController();
