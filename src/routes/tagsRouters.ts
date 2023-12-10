import { Router } from "express";
import TagsController from "../controllers/TagsController";

const router = Router();

router.get("/", TagsController.listTags);

router.post("/create", TagsController.createTag);
router.post("/update/:id", TagsController.updateTag);

router.delete("/delete/:id", TagsController.deleteTag); 

export default router;
