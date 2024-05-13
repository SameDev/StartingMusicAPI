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
      let album;

      if (search) {
        album = await prisma.album.findMany({
          include: {
            playlist: true,
            artistaId: {
              select: {
                id: true,
              },
            },
            musicas: true,
            tags: true,
            usuarioGostou: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          where: {
            OR: [
              { nome: { contains: search.toString(), mode: "insensitive" } },
              { artista: { contains: search.toString(), mode: "insensitive" } },
              { id: { equals: parseInt(search.toString(), 10) } },
            ],
          },
        });
      } else {
        album = await prisma.album.findMany({
          include: {
            playlist: true,
            artistaId: {
              select: {
                id: true,
              },
            },
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

        res.status(200).json({ album });
      }
    } catch (error) {
      console.log(error);
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
          lancamento
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
                    id: artistaId
                  }
                }
              },
            });
            return novaMusica;
          })
        );        
        
        // Obtém o ID do álbum após a criação
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
      console.log(error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        new ApiError("Ocorreu um erro interno na API!", 500, res);
      }
    }
  }
}

export default new AlbumController();
