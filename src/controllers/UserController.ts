import { Request, Response, json } from "express";
import getUserByIdDB from "../functions/userFunctions";
import prisma from "../database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";
import { Album, Cargo, Music } from "@prisma/client";

class UserController {
  async updateUser(req: Request, res: Response) {
    try {
      const { nome, email, cargo, data_nasc, senha, url, tags, desc, banner } =
        req.body;
      const id = req.params.id;
      const userId = parseInt(id, 10);

      const token = req.headers.authorization;
      if (!token) {
        throw new UnauthorizedError("Token não fornecido", res);
      }

       const maxNameLength = 25; 
          if (nome.length > maxNameLength) {
            return res
              .status(400)
              .json(`O nome excede o limite de ${maxNameLength} caracteres.`);
          }

      const decoded = jwt.verify(token, process.env.JWT_PASS ?? "");

      const user = await getUserByIdDB(userId, res);
      const newEmail = email === user.email ? user.email : email;

      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestError("Já existe um usuário com este email", res);
      }

      const newName = nome || user.nome;
      const newDataNasc = data_nasc || user.data_nasc;
      const newSenha = senha ? await bcrypt.hash(senha, 10) : senha;
      const newUrl = url || user.foto_perfil;
      const newDesc = desc || user.desc;
      const newBanner = banner || user.banner_perfil;

      let newTags: any = [];
      if (Array.isArray(tags) && tags.length > 0) {
        newTags = tags.map((tagId: object) => ({ id: tagId }));
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          cargo,
          nome: newName,
          email: newEmail,
          data_nasc: newDataNasc,
          senha: newSenha,
          foto_perfil: newUrl,
          desc: newDesc,
          tags: {
            connect: newTags,
          },
          banner_perfil: newBanner,
        },
      });

      res.status(200).json({
        message: "Usuário atualizado com sucesso!",
        user: {
          id: userId,
          nome: newName,
          email: newEmail,
          cargo,
          data_nasc: newDataNasc,
          foto_perfil: newUrl,
          desc: newDesc,
          tags: newTags,
          banner_perfil: newBanner,
        },
      });
    } catch (error: any) {
      console.error(error);

      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          message: error.message,
          maisInfo: error.message,
        });
      }

      return res.status(500).json({
        message: "Erro interno do servidor",
        maisInfo: error.message,
      });
    }
  }

  async createUser(req: Request, res: Response) {
  const {
    nome,
    email,
    senha,
    data_nasc,
    cargo,
    tags,
    desc,
    banner,
    foto_perfil,
  } = req.body;

  const date = new Date(data_nasc);

  if (cargo === "ADMIN") {
    return res.status(501).json("Você não tem permissão para isso!");
  }

  const tagsArray = Array.isArray(tags) ? tags : JSON.parse(tags) || [];

  if (typeof tagsArray !== "object") {
    return res
      .status(400)
      .json("Tipo de dado incorreto para tags, use um array");
  }

  const maxNameLength = 25; 
  if (nome.length > maxNameLength) {
    return res
      .status(400)
      .json(`O nome excede o limite de ${maxNameLength} caracteres.`);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json("Já existe um usuário com esse email");
    }

    const hashPassword = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
      data: {
        nome,
        email,
        desc,
        senha: hashPassword,
        data_nasc: date.toISOString(),
        cargo,
        tags: {
          connect: tagsArray.map((tagId: string) => ({ id: tagId })),
        },
        banner_perfil: banner,
        foto_perfil,
      },
    });

    const token = jwt.sign(
      { id: user.id, cargo: user.cargo },
      process.env.JWT_PASS ?? "",
      {
        expiresIn: "8h",
      }
    );

    const { senha: _, ...userLogin } = user;

    res.setHeader("Authorization", `${token}`);

    return res.status(200).json({
      Messagem: "Token Criado!",
      user: userLogin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ Error: "Erro interno do servidor" });
  }
}

  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { tags: true },
      });

      if (user) {
        const verifyPass = await bcrypt.compare(senha, user.senha);

        if (verifyPass) {
          const token = jwt.sign(
            { id: user.id, cargo: user.cargo },
            process.env.JWT_PASS ?? "",
            {
              expiresIn: "8h",
            }
          );

          const { senha: _, ...userLogin } = user;

          res.setHeader("Authorization", `${token}`);

          return res.status(200).json({
            Messagem: "Token Criado!",
            user: userLogin,
          });
        } else {
          throw new BadRequestError("Senha incorreta", res);
        }
      } else {
        throw new NotFoundError("Usuário não encontrado", res);
      }
    } catch (error: any) {
      console.error(error);

      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          message: error.message,
          maisInfo: error.message,
        });
      }

      // Erro desconhecido, tratamento padrão
      return res.status(500).json({
        message: "Erro interno do servidor",
        maisInfo: error.message,
      });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    prisma.user
      .findMany({
        select: {
          id: true,
          email: true,
          nome: true,
          cargo: true,
          foto_perfil: true,
          data_nasc: true,
          gostei: true,
          playlist: true,
          tags: true,
          desc: true,
        },
      })
      .then((user) => {
        res.status(200).json({ user });
      })
      .catch((error: Error) => {
        throw new ApiError("Ocorreu um erro!\n" + error, 500, res);
      });
  }

  async getUserById(req: Request, res: Response) {
    const idUser = req.params.id;
    const userId = parseInt(idUser, 10);

    getUserByIdDB(userId, res)
      .then((user) => {
        if (user) {
          res.status(200).json({ user });
        } else {
          throw new NotFoundError("Usuário não encontrado", res);
        }
      })
      .catch((error) => {
        console.error(error);
        throw new ApiError("Erro ao buscar o usuário", 500, res);
      });
  }

  async deleteUser(req: Request, res: Response) {
    const id = req.params.id;
    const userId = parseInt(id, 10);

    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", (err) => {
      if (err) {
        console.error(err);
        throw new UnauthorizedError("Token inválido", res);
      }

      getUserByIdDB(userId, res).then((user) => {
        prisma.user
          .delete({
            where: {
              id: userId,
            },
          })
          .then(() => {
            res.status(200).json({
              message: "Usuário removido com sucesso!",
            });
          })
          .catch((error) => {
            console.error(error);
            throw new ApiError("Não foi possível remover o usuário", 500, res);
          });
      });
    });
  }

  async addLikedSong(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      const userId = req.params.id;
      const id = parseInt(userId, 10);

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
        prisma.user
          .findUnique({
            where: {
              id,
            },
          })
          .then((user) => {
            if (!user) {
              throw new NotFoundError(
                "Usuário não encontrado! Verifique o ID do usuário!",
                res
              );
            }
          });

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

        const adicionarMusica = await prisma.user.update({
          where: { id },
          data: {
            gostei: {
              connect: musicas.map((idMusica: any) => ({
                id: idMusica,
              })),
            },
          },
          select: {
            id: true,
            email: true,
            nome: true,
            cargo: true,
            foto_perfil: true,
            data_nasc: true,
            gostei: true,
            playlist: true,
          },
        });

        res.status(201).json({
          message: "Música(s) adicionado com sucesso!",
          user: adicionarMusica,
        });
      } catch (error) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ message: error.message });
        } else {
          console.error(error);
          throw new ApiError(
            "Não foi possível adicionar a música com gostei!",
            500,
            res
          );
        }
      }
    });
  }

  async removeLikedSong(req: Request, res: Response) {
    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedError("Token não fornecido", res);
    }

    jwt.verify(token, process.env.JWT_PASS ?? "", async (err, decoded: any) => {
      const userId = req.params.id;
      const id = parseInt(userId, 10);

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
        prisma.user
          .findUnique({
            where: {
              id,
            },
          })
          .then((user) => {
            if (!user) {
              throw new NotFoundError(
                "Usuário não encontrado! Verifique o ID do usuário!",
                res
              );
            }
          });

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

        const adicionarMusica = await prisma.user.update({
          where: { id },
          data: {
            gostei: {
              disconnect: musicas.map((idMusica: any) => ({
                id: idMusica,
              })),
            },
          },
          select: {
            id: true,
            email: true,
            nome: true,
            cargo: true,
            foto_perfil: true,
            data_nasc: true,
            gostei: true,
            playlist: true,
          },
        });

        res.status(201).json({
          message: "Música(s) removidas com sucesso!",
          user: adicionarMusica,
        });
      } catch (error) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ message: error.message });
        } else {
          console.error(error);
          throw new ApiError(
            "Não foi possível remover a música com gostei!",
            500,
            res
          );
        }
      }
    });
  }

  async getMusicUser(req: Request, res: Response) {
    const idParam = req.params.id;
    const id = parseInt(idParam);

    try {
      const userMusics = await prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          musica: {
            include: {
              tags: true,
            },
          },
        },
      });

      if (userMusics) {
        const musics: Music[] = userMusics.musica || {};
        res.json(musics);
      } else {
        res.status(404).json({ error: "Usuário não encontrado." });
      }
    } catch (error) {
      throw new ApiError("Ocorreu um erro!\n" + error, 500, res);
    }
  }

  async getAlbumsUser(req: Request, res: Response) {
    const idParam = req.params.id;
    const id = parseInt(idParam);

    try {
      const userAlbums = await prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          album: {
            include: {
              tags: true,
              musicas: {
                select: {
                  duracao: true,
                  nome: true,
                  data_lanc: true,
                  artista: true,
                  url: true,
                  image_url: true,
                  tags: true,
                  id: true,
                },
              },
            },
          },
        },
      });

      if (userAlbums) {
        const album: Album[] = userAlbums.album || {};
        res.json(album);
      } else {
        res.status(404).json({ error: "Usuário não encontrado." });
      }
    } catch (error) {
      throw new ApiError("Ocorreu um erro!\n" + error, 500, res);
    }
  }

  async getLikedSongs(req: Request, res: Response) {
    const idParam = req.params.id;
    const id = parseInt(idParam);

    try {
      const userLikedMusics = await prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          gostei: true,
        },
      });

      if (userLikedMusics) {
        const musics: Music[] = userLikedMusics.gostei || {};
        res.json(musics);
      }
    } catch (error) {
      throw new ApiError("Ocorreu um erro!\n" + error, 500, res);
    }
  }

  async getArtists(req: Request, res: Response) {
    try {
      const artists = await prisma.user.findMany({
        where: {
          cargo: 'ARTISTA',
        },
        select: {
          tags: true
        }
      });

      const sanitizedArtists = artists.map(({ senha, ...rest }) => rest);

      res.status(200).json(sanitizedArtists);
    } catch (error) {
      throw new ApiError("Ocorreu um erro!\n" + error, 500, res);
    }
  }
}

export default new UserController();
