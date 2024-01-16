import { Router } from "express";
import MusicController from "../controllers/MusicController";

const router = Router();

router.get("/", MusicController.listSongs);

router.post("/create", MusicController.uploadMusic);
router.post("/update/:id", MusicController.updateMusic);

router.delete("/delete/:id", MusicController.deleteMusic);
// router.delete("/deleter/", MusicController.deleteAll) USE APENAS SE SOUBER OQ ESTÀ FAZENDO!

export default router;
