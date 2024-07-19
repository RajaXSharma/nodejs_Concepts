import mongoose, { Schema } from "mongoose";
import { User } from "./user.model";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //user who is the subscriber
        ref: "User",
    },
    channel: {
        type: Schema.Types.ObjectId, //one who subcriber is subscribing to
        ref: "User",
    }
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export { Subscription };
