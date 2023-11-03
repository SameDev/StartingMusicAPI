import { Response } from "express";
import prisma from "../database";
import {
  UnauthorizedError,
  NotFoundError,
  ApiError,
} from "../helpers/api-erros";


const getUserById = async (userId: number, res: Response) => {
  try {
    if (isNaN(userId)) {
      throw new UnauthorizedError("ID de usuário inválido");
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
      throw new NotFoundError("Não foi encontrado esse usuário");
    } else {
      return user;
    }
  } catch (error) {
    console.error(error);
    throw new ApiError("Erro de requisição", 500);
  }
};

export default getUserById;
