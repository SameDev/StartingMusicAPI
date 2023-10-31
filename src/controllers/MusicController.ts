import { Request, Response } from "express";
import getUserByIdDB  from "../functions/userFunctions";
import prisma from "../database";

class MusicController {
  uploadMusic(req: Request, res: Response) {
    const { userId, nome, artista, artistaId, url, duracao, tags, imageUrl } = req.body;

    getUserByIdDB(userId, res)
      .then((user) => {
        if (user?.cargo == "USUARIO") {
          res.send({ Error: "Você não Possui permissões para esta ação!" });
        } else {
          const dateNow = Date.now();
          const dataAtual = new Date(dateNow);

          if( typeof artistaId != "object") {
            return res.status(406).json({ Error: "Tipo de dado incorreto, use um array" });
          }

          prisma.music.create({
            data: {
              nome,
              artista,
              url,
              duracao,
              data_lanc: dataAtual.toISOString(),
              image_url: imageUrl,
              artistaId: {
                connect: artistaId.map((idArtista: object) => ({ id: idArtista })) 
              },
              tags: {
                connect: tags.map((tagId: object) => ({ id: tagId }))
              }
            }
          })
            .then((music) => {
              res.status(201).json({ message: "Musica criada com sucesso!", music: music });
              console.dir(music);
            })
            .catch((Error)=>{
              res.send({ Error: "Não foi possivel criar a música"});
              console.log(Error);
            });
        }
      })
      .catch((error) => {
      // Lide com erros, se houver algum.
        console.error(error);
        res.status(500).json({ Error: "Erro interno" });
      });
  }

  listAllSongs(req: Request, res: Response) {
    prisma.music.findMany({
      include: {
        tags: true,
        artistaId: {
          select: {
            id: true
          }
        },
        playlist: true
      }
    })
      .then((songs) => {
        const musicas = Object.assign({}, songs);
        res.send({ songs: musicas});
        console.dir(songs);
      });
  }

  getMusicById(req: Request, res: Response) {
    const id = req.params.id;
    const musicId = parseInt(id, 10);


    prisma.music.findUnique({
      where: {
        id: musicId
      },
      include: {
        playlist: true,
        artistaId: {
          select: {
            id: true
          }
        },
        tags: true
      }
    }).then((music) => {
      if (music) {
        res.send({ Message: "Música encontrada com sucesso", Musica: music });
      } else {
        res.status(400).json({ Error: "Música não encontrada" });
      }
    }).catch((error) => {
      res.status(400).json({ Error: "Erro de requisição" });
      console.error(error);
    });
  }
}

export default new MusicController();
