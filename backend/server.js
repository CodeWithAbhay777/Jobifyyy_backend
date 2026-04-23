import express from "express";
const app = express();
import "dotenv/config";
import cors from "cors";
import main from "./libs/db.js";
import cookieParser from "cookie-parser";
import userRoutes from './routes/user.route.js';
import emailVerification from './routes/emailVerification.route.js';
import { redisConnection } from "./libs/redisConnection.js";
import profileRoutes from './routes/profile.route.js'; 
import {errorHandler} from './middlewares/errorHandler.middleware.js';
import jobRoutes from './routes/jobs.route.js';
import applicationRoutes from './routes/application.route.js';
import interviewRoutes from './routes/interview.route.js';
import roomRoutes from './routes/room.routes.js';
import reportRoutes from './routes/report.route.js';
import { createServer } from "http";
import { Server } from "socket.io";


const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
});

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cookieParser());
app.use(express.static("uploads"))

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

//db connection
main()
  .then((res) => console.log("Db connected"))
  .catch((err) => console.log("Error in Db connection"));

//redis connection
redisConnection();


  //HEALTH CHECK ROUTE
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/user' , userRoutes);
  app.use('/api/v1/email' , emailVerification);
  app.use('/api/v1/profile', profileRoutes); 
  app.use('/api/v1/jobs' , jobRoutes);
  app.use('/api/v1/application' , applicationRoutes);
  app.use('/api/v1/interview' , interviewRoutes);
  app.use('/api/v1/room' , roomRoutes);
  app.use('/api/v1/report', reportRoutes);



  //jobs import
  import "./Jobs/index.js";
import registerSocketHandlers from "./utils/socket.js";

  //socket handlers
  registerSocketHandlers(io);


//Error handling response
app.use(errorHandler);


httpServer.listen(PORT, () => console.log("server is running"));