import dotenv from "dotenv";
import DB_CONN from "./db/DBConnect.js";

dotenv.config({
    path: "./env",
});

DB_CONN();
