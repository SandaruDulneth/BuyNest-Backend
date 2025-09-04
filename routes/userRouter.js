import express from "express";
import {toggleBlockUser, createUser, editUser, getAllUsers, loginUser} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/",createUser);
userRouter.post("/login",loginUser);
userRouter.get("/",getAllUsers);
userRouter.put("/:userId",editUser);
userRouter.put("/block/:userId",toggleBlockUser);


export default userRouter;