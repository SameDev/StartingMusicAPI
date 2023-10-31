import { Router } from "express";
import MusicController from "../controllers/MusicController";

const router = Router();

// Exemplo de rotas de música
router.get("/", MusicController.listAllSongs);
router.get("/:id", MusicController.getMusicById);
router.post("/create", MusicController.uploadMusic);

export default router;
