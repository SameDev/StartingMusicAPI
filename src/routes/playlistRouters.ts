import { Router } from "express";
import PlaylistController from "../controllers/PlaylistController";

const router = Router();

router.get("/", PlaylistController.listAllPlaylists);
/* router.get("/:id", PlaylistController.getPlaylistById);

router.post("/create", PlaylistController.createPlaylist);
router.post("/update/:id", PlaylistController.updatePlaylist);

router.delete("/delete/:id", PlaylistController.deletePlaylist); */

export default router;
