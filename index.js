import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";    
import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import riderRouter from "./routes/riderRouter.js";
import supplierRouter from "./routes/supplierRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import deliveryRouter from "./routes/deliveryRouter.js";
import faqRouter from "./routes/faqRouter.js";
import orderRouter from "./routes/orderRouter.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import trackingRouter from "./routes/tracking.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app); //  create HTTP server for socket.io

/* ---------------- Socket.IO setup ---------------- */
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTENDURL, // your React dev server
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// attach io to app so controllers can emit events
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

/* ---------------- Middlewares ---------------- */
app.use(
  cors({
    origin: process.env.FRONTENDURL, // React dev server
    credentials: true, // allow cookies / headers
  })
);
app.use(bodyParser.json());

app.use((req, res, next) => {
  const tokenString = req.header("Authorization");
  if (tokenString != null) {
    const token = tokenString.replace("Bearer ", "");

    jwt.verify(token, process.env.JWTKEY, (err, decoded) => {
      if (decoded != null) {
        req.user = decoded;
        next();
      } else {
        console.log("invalid token");
        res.status(403).json({
          message: "Invalid token",
        });
      }
    });
  } else {
    next();
  }
});

/* ---------------- Database ---------------- */
mongoose
  .connect(
    process.env.MONGODB_URL
  )
  .then(() => console.log("Connected to the database"))
  .catch((e) => {
    console.error(e);
    console.log("❌ Database connection failed");
  });

app.use("/api/users",userRouter)
app.use("/api/products",productRouter)  
app.use("/api/riders",riderRouter)  
app.use("/api/suppliers",supplierRouter)  
app.use("/api/reviews",reviewRouter)  
app.use("/api/delivery",deliveryRouter)  
app.use("/api/faqs",faqRouter)
app.use("/api/orders",orderRouter)    
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/tracking", trackingRouter);
/* ---------------- Start Server ---------------- */
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});


 
