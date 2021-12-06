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

// 0 = payment gagal,
// 1 = payment berhasil,
// 2 = diinvite menjadi employee,
// 3 = berhasil assign,
// 4 = gagal assign,
// 5 = dipecat,
// 6 = pesanan ready,
// 7 = pesanan masuk,
// 8 = pesanan diproses
async function sendNotification(target_user_id, sender_user_id, msg, type){
    await db.query(`INSERT INTO notifications VALUES(null, '${target_user_id}', '${sender_user_id}', 1, ${type}, '${msg}', CURRENT_TIMESTAMP, NULL)`);
    let resu = await db.query(`SELECT * FROM notifications WHERE user_reciever_id='${target_user_id}' AND messagge='${msg}' ORDER BY id DESC`);
    return resu[0].id;
}






// user register
router.post('/register', upload.single("foto"), async (req,res)=> {
    // let isUpperLowerNumber = /^(?![A-Z]+$)(?![a-z]+$)(?![0-9]+$)(?![A-Z0-9]+$)(?![a-z0-9]+$)[0-9A-Za-z]+$/.test(req.body.test);
    // let tgl = req.body.tanggal_peminjaman.split("-");
    // await db.query(`INSERT INTO PEMINJAMAN VALUES('${}','${}',STR_TO_DATE('${(tgl[0] + " " + tgl[1] + " " + tgl[2])}','%d %m %Y'),'${}')`);
    try {
        if(req.body.role_name && req.body.name && req.body.telephone_number && req.body.email
            && req.body.age && req.body.height && req.body.weight && req.body.gender && req.body.password && req.body.confirm_password
        ){
            // cek no telp angka saja
            let num = /^\d+$/.test(req.body.telephone_number);
            if(!num) {
                return res.status(400).json({
                    'error msg': 'No telepon harus angka semua!'
                });
            }

            // no telp length = 12
            if(req.body.telephone_number.length > 12){
                return res.status(400).json({
                    'error msg': 'No telepon kelebihan!'
                });
            }else if(req.body.telephone_number.length < 12){
                return res.status(400).json({
                    'error msg': 'No telepon kekurangan!'
                });
            }

            // cek cpass dan pass
            if(req.body.password != req.body.confirm_password){
                return res.status(400).json({
                    'error msg': 'Password dan Confirm password harus sama!'
                });
            }

            // cek tidak email kembar
            let resu = await db.query(`SELECT * FROM users WHERE email='${req.body.email}'`);
            if(resu.length > 0){
                return res.status(400).json({
                    'error msg': 'Email telah digunakan!'
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
            let unique_code = '';
            do{
                flag = false;
                unique_code = genID(8,1);
                resu = await db.query(`SELECT * FROM users WHERE unique_code='${unique_code}'`);
                if(resu.length > 0){
                    flag = true;
                }
            } while(flag)

            // cek role
            resu = await db.query(`SELECT * FROM roles WHERE UPPER(name)=UPPER('${req.body.role_name}')`);
            if(resu.length == 0){
                return res.status(404).json({
                    'error msg': 'Role tidak ditemukan!'
                });
            }

            // insert
            await db.query(`INSERT INTO users VALUES(null, '${resu[0].id}', '${req.body.name}', '${req.body.telephone_number}', '${req.body.email}', ${req.body.age}, ${req.body.height}, ${req.body.weight}, '${req.body.gender}', '${CryptoJS.SHA3(req.body.password, { outputLength: 256 })}', '${unique_code}', null, CURRENT_TIMESTAMP, null)`);

            return res.status(201).json({
                'message': 'Register Berhasil!',
                'data':{
                    'Email': req.body.email,
                    'No Telepon': req.body.telephone_number,
                    'Nama User': req.body.name,
                    'age': req.body.age,
                    'height': req.body.height,
                    'weight': req.body.weight,
                    'unique_code': unique_code,
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
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            'error msg': 'File foto belum dimasukkan!'
        });
    }
});

// user login
router.post('/login', async (req,res)=> {
    if(req.body.email && req.body.password){
        let resu = await db.query(`SELECT * FROM users WHERE email='${req.body.email}'`);
        if(resu.length == 0) {
            return res.status(404).json({
                'error msg': `Email tidak ditemukan!`
            });
        }

        resu = await db.query(`SELECT * FROM users WHERE email='${req.body.email}' AND password='${CryptoJS.SHA3(req.body.password, { outputLength: 256 })}'`);
        if(resu.length == 0) {
            return res.status(400).json({
                'error msg': 'Password salah!'
            });
        }

        // membuat token dari jwt
        let token = jwt.sign({
                'email':resu[0].email,
                'password':resu[0].password
            },
            process.env.secret
        );

        return res.status(200).json({
            'message': 'Login Berhasil!',
            'data':{
                'nama_user': resu[0].name,
                'role': resu[0].role_id,
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

        let otp = genID(5, 2);
        const mailOptions = {
            from: process.env.email,
            to: req.body.email,
            subject: 'Reset Password',
            text: 'Your OTP : ' + otp
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


// list stall yang available
router.get('/stall/list', cekJWT, async(req,res)=>{
    let resu = await db.query(`SELECT * FROM stalls WHERE is_available=1`);
    return res.status(200).json({
        'message': 'List available stall!',
        'data': resu,
        'status' : 'Success'
    });
});

// stall schedule
router.get('/stall/schedules/list', cekJWT, async(req,res)=>{
    if(req.body.stall_id){
        let resu = await db.query(`SELECT * FROM stall_schedules WHERE stall_id=${req.body.stall_id}`);

        let date = new Date();
        let openCloseTime = [];
        let daysName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        for (let i = 0; i < resu.length; i++) {
            let days = resu[i].name.split(',');
            for (let j = 0; j < days.length; j++) {
                if(date.getDay() == days[j]){
                    openCloseTime.push(resu[i].open_time);
                    openCloseTime.push(resu[i].close_time);
                }
            }
        }

        return res.status(200).json({
            'message': 'List schedule stall!',
            'data': {
                'full_stall_schedule': resu,
                'today': {
                    'day': daysName[date.getDay()],
                    'open': openCloseTime[0],
                    'close': openCloseTime[1],
                }
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

// list notification yang status 1
router.get('/notifications/list', cekJWT, async(req,res)=>{
    let resu = await db.query(`SELECT * FROM notifications WHERE status=1 AND user_reciever_id='${req.user.id}'`);
    return res.status(200).json({
        'message': 'List notifications user!',
        'data': resu,
        'status' : 'Success'
    });
});


// accept invite stall admin assign
router.post('/assign/accept', cekJWT, async (req,res)=> {
    try{
        if(req.body.notification_id){
            let calon_employee = await db.query(`SELECT * FROM users WHERE id='${req.user.id}'`);

            // update status stall users from pending become active
            await db.query(`UPDATE stall_users SET status=1 WHERE user_id='${req.user.id}' AND notification_id='${req.body.notification_id}'`);
            let resu = await db.query(`SELECT * FROM stall_users WHERE user_id='${req.user.id}' AND notification_id='${req.body.notification_id}'`);
            let stall = await db.query(`SELECT * FROM stalls WHERE id='${resu[0].stall_id}'`);

            let admin_user = await db.query(`SELECT * FROM notifications WHERE id='${req.body.notification_id}'`);

            // send notification to admin
            let msg = `Assign employee ${calon_employee[0].name} untuk menjadi employee stall ${stall[0].name} berhasil!`;
            sendNotification(admin_user[0].id, req.user.id, msg, 3);

            return res.status(201).json({
                'message': 'Berhasil menjadi employee!',
                'data':{
                    'stall_admin_name': admin_user[0].name,
                    'employee_name': calon_employee[0].name,
                    'stall_name': stall[0].name,
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
    }catch (e) {
        console.log(e);
    }
});

// decline assign
router.delete('/assign/decline', cekJWT, async (req,res)=> {
    try{
        if(req.body.notification_id){
            let calon_employee = await db.query(`SELECT * FROM users WHERE id='${req.user.id}'`);

            // update status stall users from pending become not active
            await db.query(`UPDATE stall_users SET status=0 WHERE user_id='${req.user.id}' AND notification_id='${req.body.notification_id}'`);
            let resu = await db.query(`SELECT * FROM stall_users WHERE user_id='${req.user.id}' AND notification_id='${req.body.notification_id}'`);
            let stall = await db.query(`SELECT * FROM stalls WHERE id='${resu[0].stall_id}'`);

            let admin_user = await db.query(`SELECT * FROM notifications WHERE id='${req.body.notification_id}'`);

            // send notification to admin
            let msg = `Assign employee ${calon_employee[0].name} untuk menjadi employee stall ${stall[0].name} Gagal!`;
            sendNotification(admin_user[0].id, req.user.id, msg, 4);

            // delete category stall users
            resu = await db.query(`SELECT * FROM stall_users WHERE user_id='${req.user.id}' AND notification_id='${req.body.notification_id}'`);
            await db.query(`DELETE FROM category_stall_users WHERE stall_user_id='${resu[0].id}'`);

            return res.status(200).json({
                'message': 'Batal menjadi employee!',
                'data':{
                    'stall_admin_name': admin_user[0].name,
                    'employee_name': calon_employee[0].name,
                    'stall_name': stall[0].name,
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
    }catch (e) {
        console.log(e);
    }
});

module.exports = router;