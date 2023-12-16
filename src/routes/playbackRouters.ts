import { Router } from "express";
import PlaybackController from "../controllers/PlaybackController";

const router = Router();

router.get("/", PlaybackController.listPlayback);

router.post("/create", PlaybackController.createPlayback);

export default router;
