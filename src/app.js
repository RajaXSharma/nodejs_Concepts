import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

export const app = express();
//allow only specific hosts
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

//collect form data
app.use(express.json({ limit: "20kb" }));
//url form data
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
//public assests
app.use(express.static("public"));

//store cookies in clinet machine
app.use(cookieParser());
