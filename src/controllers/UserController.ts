import { Request, Response } from "express";
import getUserByIdDB from "../functions/userFunctions";
import prisma from "../database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class UserController {
  createUser(req: Request, res: Response) {
    const { nome, email, senha, data_nasc } = req.body;

    prisma.user.findUnique({
      where: {
        email
      },
    }).then((user) => {
      if(user) {
        throw new Error("Já existe um usuário com esse email!");
      } else {
        bcrypt.hash(senha, 10).then((hashPassword: string) => {
          prisma.user.create({
            data: {
              nome,
              email,
              senha: hashPassword,
              data_nasc
            }
          })
            .then(() => {
              res.send("Usuário criado com sucesso!");
            });
        }); 
      }
    });
  }

  login(req: Request, res: Response) {
    const { email, senha } = req.body;

    prisma.user.findUnique({where: {email}})
      .then((user) => {
        if (user) {
          bcrypt.compare(senha, user.senha).then((verifyPass) => {
            if(verifyPass) {
              const token = jwt.sign({ id: user.id }, process.env.JWT_PASS ?? "", {
                expiresIn: "8h",
              });

              const { senha: _, ...userLogin } = user;

              res.send({
                user: userLogin,
                token: token,
              });
            } else {
              res.send({ Error: "Senha incorreta"});
            }
          });
        }
      }).catch((error) => {
        console.log(error);
        res.send({ Error: "Já existe um usuário com este nome"});
      });

  }

  getUserById(req: Request, res: Response) {
    const idUser = req.params.id;
    const userId = parseInt(idUser, 10);
    console.log(userId);
  
    getUserByIdDB(userId, res)
      .then((user) => {
        if (user) {
          res.status(200).json(user);
        } else {
          res.status(404).json({ message: "Usuário não encontrado" });
        }
      })
      .catch((error) => {
        res.status(500).json({ message: "Erro ao buscar o usuário" });
        console.log(error);
      });
    
  }  
}

export default new UserController();
