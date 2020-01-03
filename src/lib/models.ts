import mongoose, {Model} from "mongoose"
import { IUsers, userSchema, IEmailVerification, emailVerificationSchema, IEvents, eventsSchema } from "./schemas"

export let usersModel:Model<IUsers> = mongoose.model("users", userSchema);

export let emailVerificationModel:Model<IEmailVerification> = mongoose.model("emailverifications", emailVerificationSchema);

export let eventsModel:Model<IEvents> = mongoose.model("events", eventsSchema);