const express = require("express");
const multer = require('multer');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // setting up
const db = require("../connection");
const router = express.Router();
const axios = require("axios").default;
const nodemailer = require('nodemailer');
const CryptoJS = require("crypto-js");

// encrypt decrypt with AES
// const encrypt = (text) => {
//     const passphrase = process.env.passphrase;
//     return CryptoJS.AES.encrypt(text, passphrase);
// };
//
// const decrypt= (ciphertext) => {
//     const passphrase = process.env.passphrase;
//     const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
//     const originalText = bytes.toString(CryptoJS.enc.Utf8);
//     return originalText;
// };


// multer config
const storage = multer.diskStorage({
    destination:function(req, file, callback){
        callback(null,'./public/photos');
    },
    filename:async function(req, file, callback){
        const extension = file.originalname.split('.')[file.originalname.split('.').length-1];
        let filename = req.body.name;
        callback(null, (filename +'.'+extension));
    }
});
function checkFileType(file,cb){
    const filetypes= /jpg|png|jpeg/;
    const extname=filetypes.test(file.originalname.split('.')[file.originalname.split('.').length-1]);
    const mimetype=filetypes.test(file.mimetype);
    if(mimetype && extname){
        return cb(null,true);
    }else{
        cb(error = 'Error : foto only!');
    }
}
const upload = multer({
    storage:storage,
    fileFilter: function(req,file,cb){
        checkFileType(file,cb);
    }
});


//fungsi middleware
const {
    cekJWT,
    verifyOTP
} = require("../middleware");


// add in function
// 1 -> alphanum, genid
// 2 -> only num, otp
const genID = (length, mode) => {
    const alphabets= 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    let key= '';

    for (let i= 0; i < length; i++) {
        let hash= Math.floor(Math.random()*2)+1;
        let model= Math.floor(Math.random()*2)+1;
        let randAlpha= Math.floor(Math.random()*alphabets.length);

        if (hash === 1 || mode == 2) {
            key += Math.floor(Math.random()*10);
        } else if(mode != 2) {
            if (model === 1) key+= alphabets[randAlpha];
            else key += alphabets[randAlpha];
        }
    }

    return key;
};


// user register
router.post('/register', async (req,res)=> {
    // let isUpperLowerNumber = /^(?![A-Z]+$)(?![a-z]+$)(?![0-9]+$)(?![A-Z0-9]+$)(?![a-z0-9]+$)[0-9A-Za-z]+$/.test(req.body.test);
    // let tgl = req.body.tanggal_peminjaman.split("-");
    // await db.query(`INSERT INTO PEMINJAMAN VALUES('${}','${}',STR_TO_DATE('${(tgl[0] + " " + tgl[1] + " " + tgl[2])}','%d %m %Y'),'${}')`);
    if(req.body.username && req.body.name && req.body.email
        && req.body.description && req.body.password && req.body.confirm_password
    ){
        // cek no telp angka saja
        // let num = /^\d+$/.test(req.body.telephone_number);
        // if(!num) {
        //     return res.status(400).json({
        //         'error msg': 'No telepon harus angka semua!'
        //     });
        // }

        // // no telp length = 12
        // if(req.body.telephone_number.length > 12){
        //     return res.status(400).json({
        //         'error msg': 'No telepon kelebihan!'
        //     });
        // }else if(req.body.telephone_number.length < 12){
        //     return res.status(400).json({
        //         'error msg': 'No telepon kekurangan!'
        //     });
        // }

        // cek cpass dan pass
        if(req.body.password != req.body.confirm_password){
            return res.status(400).json({
                'error msg': 'Password dan Confirm password harus sama!'
            });
        }

        // cek tidak ada email kembar
        let resu = await db.query(`SELECT * FROM users WHERE email='${req.body.email}'`);
        if(resu.length > 0){
            return res.status(400).json({
                'error msg': 'Email telah digunakan!'
            });
        }


        // cek tidak ada username kembar
        let resu = await db.query(`SELECT * FROM users WHERE username='${req.body.username}'`);
        if(resu.length > 0){
            return res.status(400).json({
                'error msg': 'Username telah digunakan!'
            });
        }

        // gen id
        // let flag = false;
        // let id = '';
        // do{
        //     flag = false;
        //     id = genID(9,1);
        //     resu = await db.query(`SELECT * FROM users WHERE id='${id}'`);
        //     if(resu.length > 0){
        //         flag = true;
        //     }
        // } while(flag)
        

        // gen unique code
        let imageId = '-';
        do{
            flag = false;
            imageId = genID(255, 1);
            resu = await db.query(`SELECT * FROM users WHERE image_id='${imageId}'`);
            if(resu.length > 0){
                flag = true;
            }
        } while(flag)

        // insert
        await db.query(`INSERT INTO users VALUES(null, '${req.body.username}', '${CryptoJS.SHA3(req.body.password, { outputLength: 256 })}', '${req.body.email}', null, '${req.body.name}', '${req.body.description}', '${imageId}', 1, CURRENT_TIMESTAMP, null)`);

        return res.status(201).json({
            'message': 'Register Berhasil!',
            'data':{
                'username': req.body.username,
                'email': req.body.email,
                'name': req.body.name,
                'description': req.body.description,
                'image_id': imageId,
            },
            'status': 'Success'
        });
    }else{
        return res.status(400).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// user login
router.post('/login', async (req,res)=> {
    if(req.body.emailUsername && req.body.password){
        let resu = await db.query(`SELECT * FROM users WHERE email='${req.body.emailUsername}'`);
        if(resu.length == 0) {
            resu = await db.query(`SELECT * FROM users WHERE username='${req.body.emailUsername}'`);
            if(resu.length == 0) {
                return res.status(404).json({
                    'error msg': `Username/Email tidak ditemukan!`
                });
            }
        }

        resu = await db.query(`SELECT * FROM users WHERE email='${req.body.email}' AND password='${CryptoJS.SHA3(req.body.password, { outputLength: 256 })}'`);
        if(resu.length == 0) {
            return res.status(400).json({
                'error msg': 'Password salah!'
            });
        }

        // membuat token dari jwt
        let token = jwt.sign({
                'username': resu[0].username,
                'email':resu[0].email,
                'password':resu[0].password
            },
            process.env.secret
        );

        return res.status(200).json({
            'message': 'Login Berhasil!',
            'data':{
                'username': resu[0].username,
                'email': resu[0].email,
                'name': resu[0].name,
                'token' : token
            },
            'Status': 'Success',
        });
    }else{
        return res.status(400).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
});

// request user reset password
router.get('/profile/resetPassword/request', async(req,res)=>{
    if(req.body.email){
        let resu = await db.query(`SELECT * FROM users WHERE email='${req.body.email}'`);
        if(resu.length == 0) {
            return res.status(404).json({
                'error msg': `Email tidak ditemukan!`
            });
        }

        let otp = genID(6, 2);
        const mailOptions = {
            from: process.env.email,
            to: req.body.email,
            subject: 'Reset Password',
            text: 'Your OTP : ' + otp + '\n' + 'Do not share this with anyone!'
        };

        await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        // update OTP
        await db.query(`UPDATE users SET otp='${otp}' WHERE id='${resu[0].id}'`);

        return res.status(200).json({
            'message': 'Request Berhasil!',
            'data':{
                'email': req.body.email,
                'OTP' : otp
            },
            'Status': 'Success',
        });
    }else{
        return res.status(400).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// reset user password
router.patch('/profile/password/reset', verifyOTP, async(req,res)=>{
    if(req.body.email && req.body.new_password && req.body.confirm_password){
        // cek cpass dan pass
        if(req.body.new_password != req.body.confirm_password){
            return res.status(400).json({
                'message': 'New password dan confirm password harus sama!',
                'data':{
                },
                'status': 'Error'
            });
        }

        // update
        await db.query(`UPDATE users SET password='${CryptoJS.SHA3(req.body.new_password, { outputLength: 256 })}', otp='-' WHERE email='${req.body.email}'`);

        return res.status(200).json({
            'message': 'Success ganti password!',
            'data':{
                'email': req.body.email,
            },
            'status' : 'Success'
        });
    }else{
        return res.status(400).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// get user profile
router.get('/profile', cekJWT, async(req,res)=>{
    return res.status(200).json({
        'message': 'User profile!',
        'data': req.user,
        'status' : 'Success'
    });
});

//updating user profile
router.patch('/profile/update', cekJWT, async(req,res)=>{
    if(req.body.name && req.body.telephone_number && req.body.age && req.body.height && req.body.weight){
        // cek no telp angka saja
        let num = /^\d+$/.test(req.body.telephone_number);
        if(!num) {
            return res.status(400).json({
                'error msg': 'No telepon harus angka semua!'
            });
        }

        // update
        await db.query(`UPDATE users SET name='${req.body.name}', telephone_number='${req.body.telephone_number}', age=${req.body.age}, height=${req.body.height}, weight=${req.body.weight} WHERE id='${req.user.id}'`);

        return res.status(200).json({
            'message': 'Success update profile!',
            'data':{
                'email': req.user.email,
            },
            'status' : 'Success'
        });
    }else{
        return res.status(400).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// updating user password
router.patch('/profile/password/udpate', cekJWT, async(req,res)=>{
    if(req.body.old_password && req.body.new_password && req.body.confirm_password){
        // cek old password
        let resu = await db.query(`SELECT * FROM users WHERE password='${CryptoJS.SHA3(req.body.old_password, { outputLength: 256 })}'`);
        if(resu.length == 0) {
            return res.status(404).json({
                'error msg': `Old password salah!`
            });
        }

        // cek cpass dan pass
        if(req.body.new_password != req.body.confirm_password){
            return res.status(400).json({
                'error msg': 'New Password dan Confirm password harus sama!'
            });
        }

        // update
        await db.query(`UPDATE users SET password='${CryptoJS.SHA3(req.body.new_password, { outputLength: 256 })}' WHERE id='${req.user.id}'`);

        return res.status(200).json({
            'message': 'Success update password!',
            'data':{
                'email': req.user.email,
            },
            'status' : 'Success'
        });
    }else{
        return res.status(400).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});


module.exports = router;