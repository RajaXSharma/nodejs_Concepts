import { Router } from "express";
import {
    loginUser,
    logOutUser,
    refreshAccessToken,
    registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post(
    "/register",
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

userRouter.post("/login", loginUser);

//secure route
userRouter.post("/logout", verifyJWT, logOutUser);
userRouter.post("/refresh-token", refreshAccessToken);

export default userRouter;
