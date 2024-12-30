import { Router } from "express";
import PlaylistController from "../controllers/PlaylistController";

const router = Router();

router.get("/:id", PlaylistController.listPlaylist);

router.post("/create", PlaylistController.createPlaylist);
router.post("/update/:id", PlaylistController.updatePlaylist);

router.delete("/delete/:id", PlaylistController.deletePlaylit);

router.post("/add/song/:id", PlaylistController.addSong);
router.delete("/delete/song/:id", PlaylistController.removeSong); 

export default router;
