import { Router } from "express";
import PlaylistController from "../controllers/PlaylistController";

const router = Router();

router.get("/", PlaylistController.listPlaylist);

router.post("/create", PlaylistController.createPlaylist);
router.post("/update/:id", PlaylistController.updatePlaylist);

router.post("/add/:id", PlaylistController.addSong);

// router.delete("/delete/:id", PlaylistController.deletePlaylist); 

export default router;
