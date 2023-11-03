import { Router } from "express";
import UserController from "../controllers/UserController";

const router = Router();

router.post("/register", UserController.createUser);
router.post("/login", UserController.login);
router.post("/update/:id", UserController.updateUser);

router.get("/:id", UserController.getUserById);


export default router;
