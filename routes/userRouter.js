import express from "express";
import {createUser, getAllUsers, loginUser} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/",createUser);
userRouter.post("/login",loginUser);
userRouter.get("/",getAllUsers);

export default userRouter;