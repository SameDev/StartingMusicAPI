import { Request, Response } from "express";
import prisma from "../database";
import jwt from "jsonwebtoken";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";

class AlbumController {
    async listAll(req: Request, res: Response) {
        const search = req.query.search;
        try {
            let views;

            if (search) {
                views = prisma.album.findMany({
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
                            mode: 'insensitive'
                        },
                        artista: {
                            contains: search.toString(),
                            mode: 'insensitive'
                        },
                        id: {
                            equals: parseInt(search.toString(), 10)
                        }
                    }
                })
            } else {
                views = prisma.album.findMany({
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
                })

                res.status(200).json({ views });
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
            
                if (!decoded || decoded.cargo !== "ADMINISTRADOR") {
                    throw new UnauthorizedError("Você não possui permissões para esta ação!", res);
                }
    
                const {
                    nome,
                    artista,
                    url,
                    duracao,
                    image_url,
                    data_lanc,
                    artistaId,
                    tags,
                    musicasInfo,
                } = req.body;
    
                if (!nome || !artista || !url || !duracao || !image_url || !data_lanc || !artistaId || !musicasInfo) {
                    throw new BadRequestError("Todos os campos são obrigatórios", res);
                }

                const musicasIds: number[] = [];
    
                for (const musicaInfo of musicasInfo) {
                    const novaMusica = await prisma.music.create({
                        data: {
                            nome: musicaInfo.nome,
                            artista,
                            url: musicaInfo.url,
                            duracao: musicaInfo.duracao,
                            data_lanc: musicaInfo.data_lanc,
                            image_url: musicaInfo.image_url,
                            albumId: null as unknown as number
                        },
                    });
    
                    musicasIds.push(novaMusica.id);
                }
    
                const novoAlbum = await prisma.album.create({
                    data: {
                        nome,
                        artista,
                        image_url,
                        data_lanc,
                        artistaId: {
                            connect: { id: artistaId },
                        },
                        tags: {
                            connect: tags.map((tagId: number) => ({ id: tagId })),
                        },
                        musicas: {
                            connect: musicasIds.map((musicId: number) => ({ id: musicId })),
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