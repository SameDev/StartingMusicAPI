import { Response } from "express";
import prisma from "../database";

const getUserById = async (userId: number, res: Response) => {
  try {
    if (isNaN(userId)) {
      throw new Error("ID de usuário inválido");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cargo: true,
        foto_perfil: true,
        data_nasc: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado" });
    } else {
      return user;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar o usuário" });
  }
};

export default getUserById;
