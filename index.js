import express from 'express';
// import mongoose from 'mongoose';
import cors from 'cors';
import router from "./routes/short.js";
import dotenv from 'dotenv';
import connectDB from './connectDB.js';

const app = express();
dotenv.config()

//use cors to allow cross origin resource sharing
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/", router);

let PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("listening for requests at port: " + PORT);
  })
})