import { Router } from "express";
import AlbumController from "../controllers/AlbumController";

const router = Router();

router.get("/", AlbumController.listAll);

router.post("/create", AlbumController.create);

export default router;

