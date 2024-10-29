import { Router } from "express";
import DynamicSearchController from "../controllers/SearchController";

const router = Router();

router.get("/", DynamicSearchController.dynamicSearch);

export default router;
