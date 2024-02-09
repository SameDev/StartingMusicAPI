import { Router } from "express";
import AlbumController from "../controllers/AlbumController";

const router = Router();

router.get("/", AlbumController.listAll);

// router.post("/create", ViewsController.createView);

export default router;

