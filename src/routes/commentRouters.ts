import { Router } from "express";
import CommentController from "../controllers/CommentController";

const router = Router();

router.get("/", CommentController.listComments);
router.post("/", CommentController.createComment);
router.put("/:id", CommentController.updateComment);
router.delete("/:id", CommentController.deleteComment);

export default router;
