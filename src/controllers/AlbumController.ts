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
    listAll(req: Request, res: Response) {
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
                        OR: [
                            {
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
                        ]
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
}

export default new AlbumController();