import dotenv from "dotenv";
import DB_CONN from "./db/DBConnect.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env",
});

DB_CONN()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`port is running on ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log("database connection failed:", err);
    });
