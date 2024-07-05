import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const DB_CONN = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("connected");
    } catch (error) {
        console.log("error on connecting error", error);
        process.exit(1);
    }
};

export default DB_CONN;
