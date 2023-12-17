import { Router } from "express";
import MusicController from "../controllers/MusicController";
import upload from "../functions/uploadSong"

const router = Router();

router.get("/", MusicController.listSongs);

router.post("/create", upload.single('song'), MusicController.uploadMusic);
router.post("/update/:id", MusicController.updateMusic);

router.delete("/delete/:id", MusicController.deleteMusic);

export default router;
