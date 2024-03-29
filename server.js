const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

const express = require('express');
const fs = require('fs');
const jsonErrors = require('express-json-errors');
const otpGenerator = require('otp-generator');
const nodemailer = require("nodemailer");
const cors = require('cors');
const mongoose = require('mongoose');
const { error } = require('console');

const Users = require('./Model/userModel')

const app = express()
app.use(cors())

mongoose.connect(process.env.CON_STR, {
    useNewUrlParser: true
}).then((conn)=>{
    // console.log(conn);
    console.log("DB connected successful");
}).catch((error)=>{
    console.log(error);
})

let users = JSON.parse(fs.readFileSync('./Data/Users.json'));

app.use(jsonErrors());
app.use(express.json())


app.get("/api", async (req, res) => {
    try{
        const users = await Users.find();

        res.status(200).json({
            status: "welcome to weather forecast user data!!",
            totalUsers: users.length,
            users: users.map((user)=> user.name)
        })
    }catch(err){
        res.status(404).json({
            status: "fail!",
            message: err.message
        })
    }
})

app.post("/api/login", async (req, res) => {
    const user = await Users.findOne({ email:req.body.email, password:req.body.password }).exec();
    
    if(user){
        res.status(200).json({
            status: "Success",
            data: {
                user
            }
        })
    }else{
        res.status(404).json({
            status: "fail",
            data: req.body
        })
    }
})

app.post("/api/register", async (req, res) => {
    try{
        const user = await Users.create(req.body);
    
        res.status(201).json({
            status: "Success",
            data: {
                user
            }
        })
    }catch(err){
        res.status(409).json({
            status: "fail",
            message: err.message
        })
    }

})

const transporter = nodemailer.createTransport({
    host: "smtp.elasticemail.com",
    port: 2525,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

app.post("/api/generateOTP", async (req, res) => {
    const user = await Users.findOne({ email:req.body.email}).exec();

    if (user) {
        const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });


        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: '"Support Team" <arjun.rdell@gmail.com>', // sender address
            to: req.body.email, // list of receivers
            subject: "Password Reset OTP for Your Account", // Subject line
            text: "", // plain text body
            html: `Dear ${user.name},<br/><br/>
            We have received a request to reset the password for your account. To ensure the security of your account, please use the following One-Time Password (OTP) to complete the password reset process:<br/><br/>
            OTP: ${otp} <br/><br/>
            Please note that this OTP is valid for a limited time period only. If you did not request this password reset, please disregard this email.<br/><br/>
            Thank you for your attention to this matter.<br/><br/>
            Best regards,<br/>
            Weather Forecasting Team`
        });

        console.log("Message sent:", info.messageId);
        // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>

        const updateUser = await Users.findByIdAndUpdate(user._id,{ $set: { otpToken:otp }},{new: true, runValidators: true})
        res.status(200).json({
            status: "success",
            data: {
                updateUser
            }
        })
    } else {
        res.status(404).json({ error: 'email not registered' });
    }
})

app.post("/api/verifyOTP", async (req, res) => {
    const otpValid = await Users.findOne({ email:req.body.email, otpToken:req.body.otpToken }).exec();
    if (otpValid) {
        res.status(200).json({ status: "success" });
    } else {
        res.status(404).json({ error: 'OTP not valid' });
    }
})

app.post("/api/forgotPassword", async (req, res) => {
    const valid = await Users.findOne({ email:req.body.email, otpToken:req.body.otpToken }).exec();
    if(valid){
        try{
            const emailQuery = {email: req.body.email}
            const updateUser = await Users.findOneAndUpdate(emailQuery, {$set:{password: req.body.password}}, {new: true, runValidators: true})
            const otpTokenDelete = await Users.findOneAndUpdate(emailQuery, {$set:{otpToken: 0}}, {new: true, runValidators: true})
            res.status(200).json({
                status: "success",
                data: {
                    otpTokenDelete
                }
            })
        }catch(err){
            res.status(404).json({
                status: "fail",
                message: err.message
            })
        }
    }else{
        res.status(404).json({
            error: 'Given email and OTP not matching! try again.'
        })
    }
})

app.post("/api/test", async (req, res) => {
    
})

app.listen(5000, () => console.log("server started..."))