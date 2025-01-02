import { Request, Response } from "express";
import prisma from "../database";
import { ApiError } from "../helpers/api-erros";

class DynamicSearchController {
  async dynamicSearch(req: Request, res: Response): Promise<Response> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        throw new ApiError("Parâmetro de pesquisa não especificado", 400, res);
      }

      const searchResults = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [{ nome: { contains: query, mode: "insensitive" } }],
          },
        }),
        prisma.playlist.findMany({
          where: {
            OR: [{ nome: { contains: query, mode: "insensitive" } }],
          },
          include: {
            musicas: true, // Incluir músicas na playlist
          },
        }),
        prisma.album.findMany({
          where: {
            OR: [{ nome: { contains: query, mode: "insensitive" } }],
          },
          include: {
            musicas: true, 
          },
        }),
        prisma.music.findMany({
          where: {
            OR: [
              { nome: { contains: query, mode: "insensitive" } },
              { artista: { contains: query, mode: "insensitive" } },
              {
                tags: {
                  some: { nome: { contains: query, mode: "insensitive" } },
                },
              },
            ],
          },
          include: { album: true },
        }),
      ]);

      const [userResults, playlistResults, albumResults, musicResults] = searchResults;

      const sanitizedUserResults = userResults.map(({ senha, ...rest }) => rest);

      const musicResultsWithAlbumNames = musicResults.map(music => ({
        ...music,
        albumNome: music.album ? music.album.nome : null, 
      }));

      const albumResultsWithMusics = albumResults.map(album => ({
        ...album,
        musicas: album.musicas || [],
      }));

      const playlistResultsWithMusics = playlistResults.map(playlist => ({
        ...playlist,
        musicas: playlist.musicas || [],
      }));

      return res.status(200).json({
        users: sanitizedUserResults,
        music: musicResultsWithAlbumNames,
        playlists: playlistResultsWithMusics,
        albums: albumResultsWithMusics,
      });
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}

export default new DynamicSearchController();
