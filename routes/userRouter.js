
import express from "express";
import {toggleBlockUser, createUser, editUser, getAllUsers, loginUser, getUser, sendOTP, resetPassword, updateUserProfile, loginWithGoogle} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/",createUser);
userRouter.post("/login",loginUser);
userRouter.get("/",getAllUsers);
userRouter.get("/req",getUser);
userRouter.put("/:userId",editUser);
userRouter.put("/block/:userId",toggleBlockUser);
userRouter.post("/send-otp", sendOTP)
userRouter.post("/reset-password", resetPassword);
userRouter.put("/profile/:userId", updateUserProfile);
userRouter.post("/login/google",loginWithGoogle)



export default userRouter;