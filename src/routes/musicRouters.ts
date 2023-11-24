import { Router } from "express";
import MusicController from "../controllers/MusicController";

const router = Router();

router.get("/", MusicController.listSongs);

router.post("/create", MusicController.uploadMusic);
router.post("/update/:id", MusicController.updateMusic);

router.delete("/delete/:id", MusicController.deleteMusic);

export default router;
