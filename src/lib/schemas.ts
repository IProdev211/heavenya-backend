import {Schema, Document} from "mongoose"
import { Timestamp } from "bson";

export interface IUsers extends Document{
    email:string,
    password:string,
    username:string,
    phone?:string,
    job?:string,
    type:"SU"|"ADMIN"|"NORMAL",
    publicIPs?:Array<string>,
    passworResetCode?:string,
    education?: string,
    bio?:string,
    name?:string,
    birthday?:string,
    gender?:boolean,
    photo?:string
}

export interface IUsersN{
    email:string,
    password:string,
    username:string,
    phone?:string,
    job?:string,
    type:"SU"|"ADMIN"|"NORMAL",
    publicIPs?:Array<string>,
    passworResetCode?:string,
    education?: string,
    bio?:string,
    name?:string,
    birthday?:Date,
    gender?:boolean,
    photo?:string
}

export let userSchema:Schema = new Schema({
    email:{type:String, unique:true, required:true},
    password:{type:String, required:true},
    username:{type:String, required:true, unique:true},
    phone:{type:String, required:false},
    job:{type:String, required:false},
    type:{type:String, required:true},
    publicIPs:{type:Array, required:false},
    passworResetCode:{type:String, required:false},
    education: {type:String, required:false},
    bio: {type:String, required:false},
    name: {type:String, required:false},
    birthday: {type:Date, required:false},
    gender: {type:Boolean, required:false},
    photo:{type:String, required:false}
})

export interface IEmailVerification extends Document{
    user:IUsers,
    createdAt:Date,
    verificationLink:string,
    status:"VERFIED"|"NOT VERIFIED"
}

export let emailVerificationSchema:Schema = new Schema({
    user:{type:{
        email:String,
        password:String,
        username:String,
        phone:String,
        job:String
    }, required:true},
    createdAt:{type:Date, required:true},
    verificationLink:{type:String, required:true, unique:true},
    status:{type:String, required:true}
});

export interface IEvents extends Document{
    userId:string,
    photo:string,
    date:Date,
    startTime:Date,
    endTime:Date,
    publish:boolean,
    going?:Array<any>,
    type:"EVENT"|"GROUP"|"RETREAT"
    location:string,
    details:string,
    numberOfSpots:number,
    status:"PRIVATE"|"PUBLIC",
    eventuality:"ONE DAY"|"MULTIPLE DAYS"|"DAILY"|"WEEKLY"|"MONTHLY"|"YEARLY",
    name:string
}

export interface IEventsN{
    userId:string,
    photo:string,
    date:Date,
    startTime:Date,
    endTime:Date,
    publish:boolean,
    going?:Array<any>,
    type:"EVENT"|"GROUP"|"RETREAT"
    location:string,
    details:string,
    numberOfSpots:number,
    status:"PRIVATE"|"PUBLIC",
    eventuality:"ONE DAY"|"MULTIPLE DAYS"|"DAILY"|"WEEKLY"|"MONTHLY"|"YEARLY",
    name:string
}

export let eventsSchema:Schema = new Schema({
    userId:{type: String, required: true},
    photo:{type: String, required: true},
    date:{type: Date, required: true},
    startTime:{type: Date, required: true},
    endTime:{type: Date, required: true},
    publish:{type: Boolean, required: true},
    going:{type: Array, required:false},
    type: {type: String, required: true},
    location: {type: String, required: true},
    details: {type: String, required: true},
    numberOfSpots: {type: Number, required: true},
    status: {type: String, required: true},
    eventuality: {type: String, required: true},
    name: {type: String, required: true},
})