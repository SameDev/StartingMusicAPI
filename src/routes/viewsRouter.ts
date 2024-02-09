import { Router } from "express";
import ViewsController from "../controllers/ViewsController";

const router = Router();

router.get("/", ViewsController.listView);

router.post("/create", ViewsController.createView);

export default router;

