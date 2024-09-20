import { Router } from "express";
import AlbumController from "../controllers/AlbumController";

const router = Router();

router.get("/", AlbumController.listAll);
router.get("/:id", AlbumController.listAll);

router.post("/:id/add-song", AlbumController.addAlbumSong)

router.post("/create", AlbumController.create);
router.delete("/delete/:id", AlbumController.delete);
router.post("/update/:id", AlbumController.update)

export default router;

