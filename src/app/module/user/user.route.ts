import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { UserController } from "./user.controller";

const router = Router();

router.get(
	"/all-users",
	auth(Role.ADMIN, Role.OPERATOR),
	UserController.getAllUsers,
);

router.get(
	"/:userId",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN, Role.CUSTOMER),
	UserController.getSingleUser,
);

router.patch(
	"/profile-image",
	auth(Role.ADMIN, Role.OPERATOR, Role.TECHNICIAN, Role.CUSTOMER),
	upload.single("profileImage"),
	UserController.uploadProfileImage,
);

export const UserRoutes = router;
