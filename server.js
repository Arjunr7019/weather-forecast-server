const express = require('express');
const fs = require('fs');
const jsonErrors = require('express-json-errors');
const otpGenerator = require('otp-generator');
const nodemailer = require("nodemailer");
const app = express()


let users = JSON.parse(fs.readFileSync('./Data/Users.json'));

app.use(jsonErrors());
app.use(express.json())

app.get("/api", (req, res) => {
    res.json(users);
})
app.post("/api/login", (req, res) => {

    const user = users.find(user => user.email === req.body.email && user.password === req.body.password);

    if (user) {
        res.status(200).json({
            status: "success",
            data: {
                name: user.name,
                email: user.email,
                password: user.password
            }
        })
    } else {
        res.status(404).json({ error: 'Not Found' });
    }
})
app.post("/api/register", (req, res) => {

    const user = users.find(user => user.email === req.body.email);

    if (user) {
        res.json('email already registered')
    } else {
        const newId = users[users.length - 1].id + 1;

        const newUser = Object.assign({ id: newId }, req.body)

        users.push(newUser);
        fs.writeFile('./Data/Users.json', JSON.stringify(users), (err) => {
            res.status(201).json({
                status: "success",
                data: {
                    user: newUser
                }
            })
        })
    }

})

const transporter = nodemailer.createTransport({
    host: "smtp.elasticemail.com",
    port: 2525,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: "arjun.rdell@gmail.com",
        pass: "1C494D1DBB38318F292187BBEB0BB958C9CD",
    },
});

app.post("/api/generateOTP", async (req, res) => {
    const user = users.find(user => user.email === req.body.email);

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

        user.token = otp;
        fs.writeFile(`./Data/Users.json`, JSON.stringify(users), (err) => {
            res.status(201).json({
                status: "success",
                data: {
                    user: user
                }
            })
        })
    } else {
        res.status(404).json({ error: 'email not registered' });
    }
})

app.post("/api/verifyOTP", (req, res) => {
    const user = users.find(user => user.email === req.body.email);
    if (req.body.otp === user.token) {
        res.status(200).json({ status: "success" });

        // delete user.token;
        // fs.writeFile(`./Data/Users.json`, JSON.stringify(users), (err) => {
        //     res.status(201).json({
        //         status: "success",
        //         data: {
        //             user: user
        //         }
        //     })
        // })
    } else {
        res.status(404).json({ error: 'OTP not valid' });
    }
})
app.post("/api/forgotPassword", (req, res) => {
    const user = users.find(user => user.email === req.body.email);
    if (user && req.body.otp === user.token) {
        delete user.token;
        user.password = req.body.password;
        fs.writeFile(`./Data/Users.json`, JSON.stringify(users), (err) => {
            res.status(201).json({
                status: "success",
                data: {
                    user: user
                }
            })
        })
    } else {
        res.status(404).json({ error: 'Given email and OTP not matching! try again.' });
    }
})

app.post("/api/test", (req, res) => {
    console.log(req.body)
    res.json(req.body)
})

app.listen(5000, () => console.log("server started at port 5000"))