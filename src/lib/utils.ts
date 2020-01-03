import { transporter } from "../server";

export function sendEmail(email:string, subject:string, html:string){
    return transporter.sendMail({
        from: '"Heavenya" <account@heavenya.com>', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        html: html // html body
    })
}