import { Router } from "express";
import UserController from "../controllers/UserController";

const router = Router();

router.post("/register", UserController.createUser);
router.post("/login", UserController.login);
router.post("/update/:id", UserController.updateUser);
router.delete("/delete/:id", UserController.deleteUser);
router.get("/", UserController.getAllUsers);
router.get("/songs/:id", UserController.getMusicUser);
router.get("/album/:id", UserController.getAlbumsUser);
router.get("/songs/liked/:id", UserController.getLikedSongs);
router.get("/artists", UserController.getArtists);
router.get("/:id", UserController.getUserById);


router.post("/add/like/:id", UserController.addLikedSong);
router.post("/remove/like/:id", UserController.removeLikedSong);

export default router;
