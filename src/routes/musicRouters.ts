import { Router } from "express";
import MusicController from "../controllers/MusicController";

const router = Router();

// Exemplo de rotas de música
router.get("/", MusicController.listAllSongs);
router.get("/:id", MusicController.getMusicById);

router.post("/create", MusicController.uploadMusic);
router.post("/update/:id", MusicController.updateMusic);

router.delete("/delete/:id", MusicController.deleteMusic);

export default router;
