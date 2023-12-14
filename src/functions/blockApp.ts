import express, { Request, Response, NextFunction } from "express";
import prisma from "../database";



const blockApp = async (req: Request, res: Response, next: NextFunction) => {
  const origem = req.get('origin') ?? "";
  await prisma.servidores.create({
    data: {
      url: origem
    }
  }).then(() => {
    console.log("certo!")
  })

  const servidoresPermitidos = await prisma.servidores.findMany({
    select: { url: true },
  });

  const urlsPermitidas = servidoresPermitidos.map((servidor) => servidor.url);

  if (urlsPermitidas.includes(origem)) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    next();
  } else {
    // Se a origem não estiver na lista, bloqueie a requisição
    res.status(403).json({ error: 'Acesso proibido para esta origem.' });
  }
};


export default blockApp;