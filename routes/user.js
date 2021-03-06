const express = require("express");
const multer = require('multer');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // setting up
const db = require("../connection");
const router = express.Router();
const axios = require("axios").default;
const nodemailer = require('nodemailer');
const CryptoJS = require("crypto-js");
const Pusher = require("pusher");
const moment = require('moment');

const pusher = new Pusher({
    appId: "1325352",
    key: "f1a87665adcea5a04ace",
    secret: "484dfaff8f3f3df24910",
    cluster: "ap1",
    useTLS: true
});

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
// const storage = multer.diskStorage({
//     destination:function(req, file, callback){
//         callback(null,'./public/photos');
//     },
//     filename:async function(req, file, callback){
//         const extension = file.originalname.split('.')[file.originalname.split('.').length-1];
//         let filename = req.body.name;
//         callback(null, (filename +'.'+extension));
//     }
// });
// function checkFileType(file,cb){
//     const filetypes= /jpg|png|jpeg/;
//     const extname=filetypes.test(file.originalname.split('.')[file.originalname.split('.').length-1]);
//     const mimetype=filetypes.test(file.mimetype);
//     if(mimetype && extname){
//         return cb(null,true);
//     }else{
//         cb(error = 'Error : foto only!');
//     }
// }
// const upload = multer({
//     storage:storage,
//     fileFilter: function(req,file,cb){
//         checkFileType(file,cb);
//     }
// });


//fungsi middleware
const {
    cekJWT,
    verifyCode
} = require("../middleware");
const { response } = require("express");


const kFormatter = (num) => {
    return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)
}


function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}
var aDay = 24*60*60*1000;
// console.log(timeSince(new Date(Date.now()-aDay)));
// console.log(timeSince(new Date(Date.now()-aDay*2)));


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

// Check Username
router.get('/check/username/:username', async(req, res) => {
    let resu = await db.query(`SELECT * FROM users WHERE username='${req.params.username}'`);
    if(resu.length > 0){
        return res.status(200).json({
            'error_msg': 'Username is already taken'
        });
    }
})

// Check Email
router.get('/check/email/:email', async(req, res) => {
    let resu = await db.query(`SELECT * FROM users WHERE email='${req.params.email}'`);
    if(resu.length > 0){
        return res.status(200).json({
            'error_msg': 'Email Address is already taken'
        });
    }
})


// user register
router.post('/register', async (req,res)=> {
    // let isUpperLowerNumber = /^(?![A-Z]+$)(?![a-z]+$)(?![0-9]+$)(?![A-Z0-9]+$)(?![a-z0-9]+$)[0-9A-Za-z]+$/.test(req.body.test);
    // let tgl = req.body.tanggal_peminjaman.split("-");
    // await db.query(`INSERT INTO PEMINJAMAN VALUES('${}','${}',STR_TO_DATE('${(tgl[0] + " " + tgl[1] + " " + tgl[2])}','%d %m %Y'),'${}')`);
    if(req.body.username && req.body.name && req.body.email
        && req.body.description && req.body.password && req.body.confirm_password
    ){
        // insert
        await db.query(`INSERT INTO users VALUES(null, '${req.body.username}', '${CryptoJS.SHA3(req.body.password, { outputLength: 256 })}', '${req.body.email}', null, '${req.body.name}', ${req.body.age}, '${req.body.description}', '-', 1, CURRENT_TIMESTAMP, null)`);

        return res.status(201).json({
            'message': 'Account created, Welcome to Polarogram!',
            'data':{
                'username': req.body.username,
                'email': req.body.email,
                'name': req.body.name,
                'age': req.body.age,
                'description': req.body.description,
                'image_id': 'default-user',
            },
            'status': 'Success'
        });
    }else{
        return res.status(200).json({
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
                return res.status(200).json({
                    'error_msg': `Username or Email Address doesn't exists`,
                    'target': 'username'
                });
            }
        }

        resu = await db.query(`SELECT * FROM users WHERE (email='${req.body.emailUsername}' OR username='${req.body.emailUsername}') AND password='${CryptoJS.SHA3(req.body.password, { outputLength: 256 })}'`);
        if(resu.length == 0) {
            return res.status(200).json({
                'error_msg': 'Wrong Password',
                'target': 'password'
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
                'id': resu[0].id,
                'username': resu[0].username,
                'email': resu[0].email,
                'name': resu[0].name,
                'token' : token,
                'image_id': resu[0].image_id
            },
            'status': 'Success',
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

router.post('/isAuthenticated', cekJWT, (req,res) => {
    if (req.user) {
        return res.status(200).json({
            'message': 'authenticated',
            'status': 'Success'
        })
    }
    
    return res.status(401).json({
        'message': 'unauthenticated',
    })
})


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
});

const sendOtp = async (emailReceiver) => {
    // Check jika user ada

    return response;
}

router.post('/profile/password/resendOtp', async(req,res) => {
    if (req.body.email) {
        let resu = await db.query(`SELECT verification_code FROM users WHERE email='${req.body.email}'`);
        if(resu.length == 0) {
            return res.status(200).json({
                'error_msg': `Email doesn't exists`
            });
        }

        const ver_code = resu[0].verification_code

        const mailOptions = {
            from: process.env.email,
            to: req.body.email,
            subject: 'Reset Password',
            text: 'Your Verification Code : ' + ver_code + '\n' + 'Do not share this with anyone!' + '\n' + 'Remember WICKED is good!'
        };

        await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error, 'error');
                return res.status(403).json({
                    'message': 'Auth Problem!',
                    'data':{
                        'email env': process.env.email,
                        'pass env': process.env.password,
                        'body email': req.body.email
                    },
                    'status': 'Error'
                });
            } else {
                //console.log('Email sent: ' + info.response);
                return res.status(200).json({
                    'message': 'Email sent!'
                });
            }
        });
    } else {
        return res.status(401).json({
            'error_msg': `Unauthorized`
        });
    }

})

// request user reset password
router.post('/profile/password/requestReset', async(req,res)=>{
    //console.log(process.env.email)
    if(req.body.email){
        let resu = await db.query(`SELECT * FROM users WHERE email='${req.body.email}'`);
        if(resu.length == 0) {
            return res.status(200).json({
                'error_msg': `Email doesn't exists`
            });
        }
        // update verification_code
        let ver_code = genID(6, 2);
        await db.query(`UPDATE users SET verification_code='${ver_code}' WHERE id='${resu[0].id}'`);

        // Kirim OTP ke email yang dituju
        const mailOptions = {
            from: process.env.email,
            to: req.body.email,
            subject: 'Reset Password',
            text: 'Your Verification Code : ' + ver_code + '\n' + 'Do not share this with anyone!' + '\n' + 'Remember WICKED is good!'
        };

        await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                //console.log(error, 'error');
                return res.status(403).json({
                    'message': 'Auth Problem!',
                    'data':{
                        'email env': process.env.email,
                        'pass env': process.env.password,
                        'body email': req.body.email
                    },
                    'status': 'Error'
                });
            } else {
                //console.log('Email sent: ' + info.response);
                return res.status(200).json({
                    'message': 'Email sent!'
                });
            }
        });

        return res.status(200).json({
            'message': 'Request Berhasil!',
            'data':{
                'email': req.body.email,
                'Verification code' : ver_code
            },
            'Status': 'Success',
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

router.post('/profile/password/verify', async(req, res) => {
    let resu = await db.query(`SELECT * FROM users WHERE email='${req.body.email}'`);
    if(resu[0].verification_code == '-'){
        return res.status(200).json({
            'error_msg': 'Request Verification code dulu!'
        });
    }

    if(req.body.verification_code != resu[0].verification_code){
        return res.status(200).json({
            'error_msg': 'Verification code yang dimasukan salah! Request Verification code dulu!'
        });
    }
    
    return res.status(200).json({
        'message': 'Verification success',
        'data':{
        },
        'status': 'Success'
    });
})

// reset user password
router.patch('/profile/password/reset', async(req,res)=>{
    if(req.body.email && req.body.new_password && req.body.confirm_password){
        // cek cpass dan pass
        if(req.body.new_password != req.body.confirm_password){
            return res.status(200).json({
                'message': 'New password dan confirm password harus sama!',
                'data':{
                },
                'status': 'Error'
            });
        }

        // update
        await db.query(`UPDATE users SET password='${CryptoJS.SHA3(req.body.new_password, { outputLength: 256 })}', verification_code='-' WHERE email='${req.body.email}'`);

        return res.status(200).json({
            'message': 'Success ganti password!',
            'data':{
                'email': req.body.email,
            },
            'status' : 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// get user profile
router.get('/profile/:username', cekJWT, async(req,res)=>{
    let user = await db.query(`SELECT * FROM users WHERE username='${req.params.username}' AND status!=0`);
    if(user.length == 0){
        return res.status(404).json({
            'error_msg': 'User not found!'
        });
    }

    // cek realtionship jika bukan diri 
    let relation = false // diri sendiri false
    if(req.params.username != req.user.username){
        let rel = await db.query(`SELECT * FROM user_relationships WHERE user_id='${req.user.id}' AND followed_user_id='${user[0].id}' AND status!=0 ORDER BY id DESC`);
        if(rel.length > 0 && parseInt(rel[0].status) == 1){
            relation = true // FOLLOW
        }
    }

    // get all our posts
    let resu = await db.query(`SELECT * FROM posts WHERE user_id='${user[0].id}' AND status!=0`);
    for (let i = 0; i < resu.length; i++) {
        // how mmany likes
        let post_likes = await db.query(`SELECT * FROM user_likes WHERE post_id='${resu[i].id}' AND status!=0`);
        resu[i].likesCtr = kFormatter(post_likes.length)

        // how many comments
        let post_comments = await db.query(`SELECT * FROM user_comments WHERE post_id='${resu[i].id}' AND status!=0`);
        resu[i].commentsCtr = kFormatter(post_comments.length)
    }
    
    // ctr following
    let temp = await db.query(`SELECT * FROM user_relationships WHERE user_id='${user[0].id}' AND status=1`);
    user[0].followingCtr = kFormatter(temp.length)

    // ctr followers
    temp = await db.query(`SELECT * FROM user_relationships WHERE followed_user_id='${user[0].id}' AND status=1`);
    user[0].followersCtr = kFormatter(temp.length)
    user[0].followers = temp

    return res.status(200).json({
        'message': 'User profile!',
        'data': {
            'profile': user[0],
            'posts': resu, 
            'postsCtr': resu.length,
            'relation': relation
        },
        'status' : 'Success'
    });
});

//updating user profile
router.patch('/profile/update', cekJWT, async(req,res)=>{
    if(req.body.name && req.body.description && req.body.age ){
        // update
        await db.query(`UPDATE users SET name='${req.body.name}', age=${req.body.age}, description='${req.body.description}' WHERE id='${req.user.id}'`);

        return res.status(200).json({
            'message': 'Success update profile!',
            'data':{
                'email': req.user.email,
            },
            'status' : 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// updateimage profile
router.patch('/profile/image/update', cekJWT, async(req,res)=>{
    //console.log(req.body.new_image_id, req.user.id)
    
    if(req.body.new_image_id){
        // update
        await db.query(`UPDATE users SET image_id='${req.body.new_image_id}' WHERE id='${req.user.id}'`);

        return res.status(200).json({
            'message': 'Success update profile image !',
            'data':{
                'email': req.user.email,
            },
            'status' : 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// updating user password
router.patch('/profile/password/update', cekJWT, async(req,res)=>{
    //console.log(req.body.old_password,req.body.new_password,req.body.confirm_password)
    if(req.body.old_password && req.body.new_password && req.body.confirm_password){
        // cek old password
        let resu = await db.query(`SELECT * FROM users WHERE password='${CryptoJS.SHA3(req.body.old_password, { outputLength: 256 })}'`);
        if(resu.length == 0) {
            return res.status(200).json({
                'error_msg': `Old password salah!`
            });
        }

        // cek old pass dan new pass
        if(req.body.new_password == req.body.old_password){
            return res.status(200).json({
                'error_msg': 'New Password dan Old password harus beda!'
            });
        }

        // cek cpass dan new pass
        if(req.body.new_password != req.body.confirm_password){
            return res.status(200).json({
                'error_msg': 'New Password dan Confirm password harus sama!'
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
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// search user
router.post('/searchUser', cekJWT, async(req,res)=>{
    if(req.body.target_user){
        let final = []
        let resu = await db.query(`SELECT * FROM users WHERE username LIKE '%${req.body.target_user}%' OR name LIKE '%${req.body.target_user}%' AND id!='${req.user.id}' AND status!=0`);
        if(resu.length > 0) {
            // cek di block oleh user lain tidak, jika kita yang block user lain maka masi bisa ada di serach
            let status = null
            for(let i=0; i < resu.length; i++){
                // cek hubungan target ke kita apa
                //console.log('id', resu[i].id)
                let temp = await db.query(`SELECT * FROM user_relationships WHERE user_id='${resu[i].id}' AND followed_user_id='${req.user.id}' ORDER BY id DESC`);
                if(temp.length == 0){
                    // belum ada relationship brrt tidak diblock
                    // tambahkan hubungan kita ke user target itu apa
                    temp = await db.query(`SELECT * FROM user_relationships WHERE user_id='${req.user.id}' AND followed_user_id='${resu[i].id}' ORDER BY id DESC`);
                    status = -1 // no relation
                    if(temp.length > 0){
                        status = temp[0].status 
                    }
                    resu[i].relationStatus = status
                    resu[i].subtitle = resu[i].name
                    final.push(resu[i])
                }else{
                    if(parseInt(temp[0].status) != 2){
                        //console.log('status', temp)
                        // jika tidak diblock (0 / 1) dimasukin
                        // tambahkan hubungan kita ke user target itu apa
                        temp = await db.query(`SELECT * FROM user_relationships WHERE user_id='${req.user.id}' AND followed_user_id='${resu[i].id}' ORDER BY id DESC`);
                        status = -1 // no relation
                        if(temp.length > 0){
                            status = temp[0].status 
                        }
                        resu[i].relationStatus = status
                        resu[i].subtitle = resu[i].name
                        final.push(resu[i])
                    }
                }
            }
            
        }

        return res.status(200).json({
            'message': 'User Search Result!',
            'data': final,
            'status' : 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});


// follow, R
router.post('/follow', cekJWT, async (req,res)=> {
    if(req.body.target_user_id){
        // insert new notif
        let resu = await db.query(`SELECT * FROM user_relationships WHERE user_id='${req.user.id}' AND followed_user_id='${req.body.target_user_id}'`);
        if(resu.length == 0) {
            // INSERT 
            // let newNotifId = null
            await db.query(`INSERT INTO notifications VALUES(null, '${req.user.id}', '${req.body.target_user_id}', 'started following you', 0, 1, CURRENT_TIMESTAMP, null)`, async function (err, result) {
                if (err) throw err;
                // console.log(result)
                await db.query(`INSERT INTO user_relationships VALUES(null, '${req.user.id}', '${req.body.target_user_id}', 1, ${result.insertId} , CURRENT_TIMESTAMP, null)`);

                return res.status(200).json({
                    'message': 'Follow Berhasil!',
                    'data':{
                    },
                    'Status': 'Success',
                });
            });
        } else {
            //UPDATE, jika sudah pernah follow, jan lupa update notif id baru juga
            await db.query(`UPDATE user_relationships SET status=1 WHERE id='${resu[0].id}'`);
            await db.query(`UPDATE notifications SET is_read=0, status=1 WHERE id='${resu[0].notif_id}'`);

            return res.status(200).json({
                'message': 'Follow Berhasil!',
                'data':{
                },
                'Status': 'Success',
            });
        }
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// unfollow, R
router.patch('/unfollow', cekJWT, async (req,res)=> {
    if(req.body.target_user_id){
        // UPDATE Status jadi 0 
        let resu = await db.query(`SELECT * FROM user_relationships WHERE user_id='${req.user.id}' AND followed_user_id='${req.body.target_user_id}'`);
        await db.query(`UPDATE user_relationships SET status=0 WHERE id='${resu[0].id}'`);

        // Update notif follow sebelumnya jadi tidak aktif
        await db.query(`UPDATE notifications SET status=0, is_read=0 WHERE id='${resu[0].notif_id}'`);

        return res.status(200).json({
            'message': 'Unfollow Berhasil!',
            'data':{
            },
            'Status': 'Success',
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// block
router.post('/block', cekJWT, async (req,res)=> {
    if(req.body.target_user_id){
        // update user relationship
        await db.query(`UPDATE user_relationships SET status=2 WHERE user_id='${req.user.id}' AND followed_user_id='${req.body.target_user_id}'`);

        return res.status(200).json({
            'message': 'Block Berhasil!',
            'data':{
                'user_id': req.user.id, 
                'followed_user_id': req.body.target_user_id
            },
            'Status': 'Success',
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// unblock
router.post('/unblock', cekJWT, async (req,res)=> {
    if(req.body.target_user_id){
        // update user relationship
        await db.query(`UPDATE user_relationships SET status=1 WHERE user_id='${req.user.id}' AND followed_user_id='${req.body.target_user_id}'`);

        return res.status(200).json({
            'message': 'Unblock Berhasil!',
            'data':{
                'user_id': req.user.id, 
                'followed_user_id': req.body.target_user_id
            },
            'Status': 'Success',
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// show followers user, yang diliat user_id (yang follow kita)
router.get('/followers', cekJWT, async(req,res)=>{
    let resu = await db.query(`SELECT * FROM user_relationships WHERE followed_user_id='${req.user.id}' AND status=1`);
    
    return res.status(200).json({
        'message': 'Followers Result!',
        'data': resu,
        'status' : 'Success'
    });   
});

// show following user, yang diliat followed_user_id (yang kita follow)
router.get('/following', cekJWT, async(req,res)=>{
    let resu = await db.query(`SELECT * FROM user_relationships WHERE user_id='${req.user.id}' AND status=1`);
    
    return res.status(200).json({
        'message': 'Following Result!',
        'data': resu,
        'status' : 'Success'
    });   
});


// show all post from following users
router.post('/post/following', cekJWT, async(req,res)=>{
    if(req.body.size){
        // Get all post dari user yang kita follow
        let followedPosts = await db.query(`SELECT posts.* FROM posts JOIN user_relationships ON posts.user_id = user_relationships.followed_user_id WHERE user_relationships.user_id='${req.user.id}' AND user_relationships.status=1 ORDER BY posts.id DESC LIMIT ${req.body.size}`)
        let final = followedPosts
        
        if(final.length < req.body.size) {
            // Get newest post(karna order by id desc) dengan limit size jika panjang final masih dibawah size
            let newestPosts = await db.query(`SELECT * FROM posts ORDER BY id DESC LIMIT ${req.body.size}`)
            newestPosts.forEach(post => {
                // Jika jumlah final masih dibawah size
                if (req.body.size > final.length) {
                    // Jika post belum ada di final maka push ke final
                    if (final.findIndex(({ id }) => id === post.id) === -1) {
                        final.push(post)
                    }
                } 
            });
        }
        // get all user yang kita follow
        // let resu = await db.query(`SELECT * FROM user_relationships WHERE user_id='${req.user.id}' AND status=1`);
        // let final = [];
        // for (let i = 0; i < resu.length; i++) {
        //     // cek relasi dia ke kita apa
        //     let temp = await db.query(`SELECT * FROM user_relationships WHERE user_id='${resu[i].followed_user_id}' AND followed_user_id='${req.user.id}' ORDER BY ID DESC`);
        //     if(temp.length == 0 || parseInt(temp[0].status) === 1) {
        //         // hanya jika mereka tidak block kita baru kita bisa liat post mereka
        //         let posts = await db.query(`SELECT * FROM posts WHERE user_id='${resu[i].followed_user_id}' AND status!=0 ORDER BY created_at DESC`);
        //         for (let j = 0; j < req.body.size; j++) {
        //             if(j == posts.length) {
        //                 break
        //             }
                   
        //             final.push(posts[j])
        //         }
        //     }
        // }

        // Problem: Kalo gk ada yang like(tidak ada di table user_likes) gak akan kepilih
        // post dengan like terbanyak
        // let temp = await db.query(`SELECT post_id, count(id) as 'ctr' FROM user_likes GROUP BY post_id ORDER BY post_id DESC`);
        

        // Sort Likes count
        // temp.sort((a,b) => {return b.ctr - a.ctr})
        // let flag = true;
        // let temp2 = [];
        
        // for (let i = 0; i < req.body.size - final.length; i++) {
            
        //     if(i >= temp.length){
        //         break
        //     }
        //     flag = true;
           
        //     for (let j = 0; j < final.length; j++) {
        //         if(final[j].id == temp[i].post_id){
        //             flag = false;
        //             break;
        //         }
                
        //     }
        //     if(flag)
        //     {
        //         let post = await db.query(`SELECT * FROM posts WHERE id='${temp[i].post_id}'`);
        //         temp2.push(post[0]);
        //     }
        // }
 
        // for (let i = 0; i < temp2.length; i++) {
        //     final.push(temp2[i]);            
        // }

        // aditional info
        for (let i = 0; i < final.length; i++) {
            let user = await db.query(`SELECT * FROM users WHERE id='${final[i].user_id}'`);

            // ctr following
            let temp = await db.query(`SELECT * FROM user_relationships WHERE user_id='${user[0].id}' AND status=1`);
            user[0].followingCtr = kFormatter(temp.length)

            // ctr followers
            temp = await db.query(`SELECT * FROM user_relationships WHERE followed_user_id='${user[0].id}' AND status=1`);
            user[0].followersCtr = kFormatter(temp.length)

            // cek apa relasi kita ke dia
            temp = await db.query(`SELECT * FROM user_relationships WHERE user_id='${req.user.id}' AND followed_user_id='${user[0].id}' ORDER BY ID DESC`);
            user[0].isFollowing = temp.length == 0 ? false : true

            final[i].user = user[0]

            // cek apa relasi kita ke post, like atau belom like
            temp = await db.query(`SELECT * FROM user_likes WHERE user_id='${req.user.id}' AND post_id='${final[i].id}' ORDER BY ID DESC`);
            final[i].isLiked = temp.length == 0 ? 0 : temp[0].status

            // cek apa relasi kita ke post, like atau belom like
            temp = await db.query(`SELECT * FROM user_likes WHERE post_id='${final[i].id}' AND status=1`);
            final[i].likesCtr = kFormatter(temp.length)

            final[i].dateNow = moment(final[i].created_at, moment.ISO_8601).fromNow()

            // comments
            temp = await db.query(`SELECT * FROM user_comments WHERE post_id='${final[i].id}' AND status=1`);
            if (temp.length > 0){
                for (let j = 0; j < temp.length; j++) {
                    // add aditional info for comments
                    user = await db.query(`SELECT * FROM users WHERE id='${temp[j].user_id}'`);
                    temp[j].user = user[0]
                    temp[j].dateNow = moment(temp[j].created_at, moment.ISO_8601).fromNow()
                }
                final[i].hasComments = true
            } else {
                final[i].hasComments = false
            }

            final[i].comments = temp
            final[i].commentsCtr = kFormatter(temp.length)
        }

        // console.log('final', final)

        return res.status(200).json({
            'message': 'Following post Result!',
            'data': final,
            'status' : 'Success'
        });  
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    } 
});

// user post
router.post('/post/upload', cekJWT, async (req,res)=> {
    //cek field kosong
    // type 1 = image, 2 = video
    if(req.body.caption && req.body.cloudinary_id && req.body.tag && req.body.type){
        // let tags = ''
        // req.body.tag = req.body.tag.split(',')
        // for(let i= 0; i < req.body.tag.length; i++){
        //     tags += req.body.tag[i]
        //     if(i < req.body.tag.length - 1){
        //         tags += ', '
        //     }
        // }

        await db.query(`INSERT INTO posts VALUES(null, '${req.user.id}', '${req.body.cloudinary_id}', '${req.body.caption}', '${req.body.tag}', ${req.body.type}, CURRENT_TIMESTAMP, null)`);

        return res.status(200).json({
            'message': 'Post Berhasil!',
            'data':{
                'user_id': req.user.id,
                'cloudinary_id': req.body.cloudinary_id,
            },
            'Status': 'Success',
        });

    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// delete post 
router.delete('/post/delete', cekJWT, async(req, res) => {
    if(req.body.target_post_id){
        // update status 0 (deleted)
            await db.query(`UPDATE posts SET status=0 WHERE id='${req.body.target_post_id}'`);
            
            return res.status(200).json({
                'message': 'Berhasil soft delete post!',
                'data':{
                },
                'status': 'Error'
            });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

//get total post like R
router.get('/like/:post_id', cekJWT, async (req,res)=> {
    // console.log(req.params.post_id)
    if(req.params.post_id){
        let post_id = req.params.post_id;
        let resu = await db.query(`SELECT * FROM user_likes WHERE post_id='${post_id}' AND status=1 `);
        return res.status(200).json({
            'message': 'Get total like Berhasil!',
            'data': resu,
            'Status': 'Success',
        });

    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// like post
router.post('/post/like', cekJWT, async (req,res)=> {
        // cek jika sudah ada ditable
        let resu = await db.query(`SELECT * FROM user_likes WHERE user_id='${req.user.id}' AND post_id=${req.body.target_post_id} ORDER BY id DESC`);
        if(resu.length == 0){
            let post = await db.query(`SELECT * FROM posts WHERE id='${req.body.target_post_id}'`);
            // insert new notif like 
            await db.query(`INSERT INTO notifications VALUES(null, '${req.user.id}', '${post[0].user_id}', 'has liked your post', 0, 2, CURRENT_TIMESTAMP, null)`,async function (err, result) {
                if (err) throw err;
                // insert ke table user like
                await db.query(`INSERT INTO user_likes VALUES(null, '${req.user.id}', '${req.body.target_post_id}', 1, '${result.insertId}', CURRENT_TIMESTAMP, null)`);
            });

      
        } else {
            // update old notif like, jadi kembali like
            await db.query(`UPDATE notifications SET status=2, is_read=0 WHERE id='${resu[0].notif_id}'`);

            // update table user like
            await db.query(`UPDATE user_likes SET status=1 WHERE id='${resu[0].id}'`);
        }

        return res.status(200).json({
            'message': 'Like Berhasil!',
            'data':{
                'user_id': req.user.id,
                'post_id': req.body.target_post_id,
            },
            'Status': 'Success',
        });
});

// unlike post
router.post('/post/unlike', cekJWT, async (req,res)=> {
    //cek field kosong
    if(req.body.target_post_id){
        let resu = await db.query(`SELECT * FROM user_likes WHERE user_id='${req.user.id}' AND post_id=${req.body.target_post_id} ORDER BY id DESC`);

        // update old notif like, jadi unlike
        // await db.query(`UPDATE notifications SET status=0, is_read=0 WHERE id='${resu[0].notif_id}'`);

        // update table user like
        await db.query(`UPDATE user_likes SET status=0 WHERE id='${resu[0].id}'`);

        return res.status(200).json({
            'message': 'Unlike Berhasil!',
            'data':{
                'user_id': req.user.id,
                'post_id': req.body.target_post_id,
            },
            'Status': 'Success',
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

router.get('/hashtag/search/:keyword', cekJWT, async(req,res)=>{
    let hashtags = []
    let resu = await db.query(`SELECT * FROM posts WHERE tag LIKE '%${req.params.keyword}%' AND status!=0`);

    for (let i = 0; i < resu.length; i++) {
        let temp = resu[i].tag.split(', ')
        for (let j = 0; j < temp.length; j++) {
            if(temp[j].includes(req.params.keyword)){
                let postsCtr = await db.query(`SELECT * FROM posts WHERE tag LIKE '%${temp[j].replace('#', '')}%' AND status!=0`);
                if(postsCtr.length > 0){
                    hashtags.push({
                        'username': temp[j], 
                        'image_id': 'hashtag-image', 
                        'subtitle': postsCtr.length
                    })
                }
            }
        }
        
    } 

        return res.status(200).json({
            'message': 'Post Search Result!',
            'data': hashtags,
            'status' : 'Success'
        }); 
})

// search post dari hash tag, R
router.post('/post/search', cekJWT, async(req,res)=>{
    //console.log(req.body.keyword)
    if(req.body.keyword){
        let resu = await db.query(`SELECT * FROM posts WHERE tag LIKE '%${req.body.keyword}%' AND status!=0`);

        for (let i = 0; i < resu.length; i++) {
            //aditional info
            let temp = await db.query(`SELECT * FROM user_comments WHERE post_id='${resu[0].id}' AND status=1`);
            resu[0].commentsCtr = kFormatter(temp.length)

            temp = await db.query(`SELECT * FROM user_likes WHERE post_id='${resu[0].id}' AND status=1`);
            resu[0].likesCtr = kFormatter(temp.length)
        }
        

        return res.status(200).json({
            'message': 'Post Search Result!',
            'data': resu,
            'status' : 'Success'
        }); 
    }else{
        return res.status(200).json({
            'message': 'Tidak ada post!',
            'data':{
            },
            'status': 'Error'
        });
    }
})

// search by target_post_id
router.get('/post/search/:id', cekJWT, async(req,res)=>{
    let resu = await db.query(`SELECT * FROM posts WHERE id='${req.params.id}' AND status!=0`);

   // console.log(req.params.id)
    
    let user = await db.query(`SELECT * FROM users WHERE id='${resu[0].user_id}'`);
    
    // ctr followers
    let temp = await db.query(`SELECT * FROM user_relationships WHERE followed_user_id='${user[0].id}' AND status=1`);
    user[0].followersCtr = kFormatter(temp.length)

    resu[0].target_user = user[0]

    // comments
            temp = await db.query(`SELECT * FROM user_comments WHERE post_id='${resu[0].id}' AND status=1`);
            if (temp.length > 0){
                for (let j = 0; j < temp.length; j++) {
                    // add aditional info for comments
                    user = await db.query(`SELECT * FROM users WHERE id='${temp[j].user_id}'`);
                    temp[j].user = user[0]
                    temp[j].moment = moment(temp[j].created_at, moment.ISO_8601).fromNow()
                }
                resu[0].hasComments = true
            } else {
                resu[0].hasComments = false
            }

            resu[0].comments = temp
            resu[0].commentsCtr = kFormatter(temp.length)
            
            // cek apa relasi kita ke post, like atau belom like
            temp = await db.query(`SELECT * FROM user_likes WHERE user_id='${req.user.id}' AND post_id='${resu[0].id}' ORDER BY ID DESC`);
            resu[0].isLiked = temp.length == 0 ? 0 : temp[0].status

            // cek apa relasi kita ke post, like atau belom like
            temp = await db.query(`SELECT * FROM user_likes WHERE post_id='${resu[0].id}' AND status=1`);
            resu[0].likesCtr = kFormatter(temp.length)

            resu[0].moment = moment(resu[0].created_at, moment.ISO_8601).fromNow()

            //(resu[0])

    return res.status(200).json({
        'message': 'Post Search By Id!',
        'data': resu[0],
        'status' : 'Success'
    }); 
})

// get all comment suatu post data
router.get('/comment/:post_id', cekJWT, async(req,res) => {
    if(req.params.post_id){
        let resu = await db.query(`SELECT * FROM user_comments WHERE post_id='${req.params.post_id}' AND status=1`);

        return res.status(200).json({
            'message': 'Post Comments Result!',
            'data': resu,
            'status' : 'Success'
        }); 
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }  
})


// comment posts, R
router.post('/post/comment', cekJWT, async (req,res)=> {
    // cek field kosong
    if(req.body.target_post_id && req.body.commentTexts){
        let resu = await db.query(`SELECT * FROM posts WHERE id='${req.body.target_post_id}'`);
        // insert new notif
        await db.query(`INSERT INTO notifications VALUES(null, '${req.user.id}', '${resu[0].user_id}', 'commented on your post', 0, 3, CURRENT_TIMESTAMP, null)`, async function (err, result) {
            if (err) throw err;

            // insert new comment
            await db.query(`INSERT INTO user_comments VALUES(null, '${req.user.id}', '${req.body.target_post_id}','${req.body.commentTexts}', 1, ${result.insertId} , CURRENT_TIMESTAMP, null)`);
    
            return res.status(201).json({
                'message': 'Berhasil comment!',
                'data': {
                    'post_id': req.body.target_post_id,
                    'comment': req.body.commentTexts
            },
                'status': 'Success'
            });
        });

        console.log('error')
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// delete post comment
router.delete('/post/comment/delete', cekJWT, async(req, res) => {
    if(req.body.target_comment_id){
        // update status comment jadi 0 (deleted)
        await db.query(`UPDATE user_comments SET status=0 WHERE id='${req.body.target_post_id}'`);
            
        return res.status(200).json({
            'message': 'Berhasil soft delete comment!',
            'data':{
            },
            'status': 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});


// get all notificaitons, R
router.get('/notifications', cekJWT, async(req,res)=>{
    let resu = await db.query(`SELECT * FROM notifications WHERE receiver_id='${req.user.id}' AND status!=0 ORDER BY CREATED_AT DESC`);

    for(let i = 0; i < resu.length; i++){
        detailUser = await db.query(`SELECT * FROM users WHERE id='${resu[i].sender_id}' `);
        resu[i].detailUser = detailUser
        resu[i].dateNow = moment(resu[i].created_at, moment.ISO_8601).fromNow()
    }
    
    return res.status(200).json({
        'message': 'All Notification Result!',
        'data':resu,
        'status': 'Success'
    });
})


// DM

// get all dm, R
router.get('/dm', cekJWT, async(req,res)=>{
    
    let resu = await db.query(`SELECT * FROM dm WHERE user_id_1='${req.user.id}' AND status=1`);
    // console.log(req.user)
    let allResu= [];
    let pembuatDM = false;
    let cekChat = null;
    let unreadCtr = 0
    if(resu.length > 0){
        //Cek ada chat
        for(let i = 0; i < resu.length; i++){
            pembuatDM = false;
            if(resu[i].id % 2 == 1){
                pembuatDM = true;
            }
            // console.log("id" + resu[i].id);
            cekChat = await db.query(`SELECT * FROM chats WHERE dm_relation='${resu[i].dm_relation}' AND user_sender_id='${req.user.id}' AND user_receiver_id='${resu[i].user_id_2}'
            OR (dm_relation='${resu[i].dm_relation}' AND user_sender_id='${resu[i].user_id_2}' AND user_receiver_id='${req.user.id}') ORDER BY id DESC`);
            // console.log("chat" + cekChat.length);
            if(cekChat.length > 0){
                    // add aditional info
                    let user = await db.query(`SELECT * FROM users WHERE id='${resu[i].user_id_2}'`);

                    // ctr followers
                    let temp = await db.query(`SELECT * FROM user_relationships WHERE followed_user_id='${user[0].id}' AND status=1`);
                    user[0].followersCtr = kFormatter(temp.length)

                    // set target user
                    resu[i].target_user = user[0]

                    // last chat
                    resu[i].lastChat = cekChat[0]

                    resu[i].chats = []
                    let tempChat = []
                    let date = '-'
                    let momentDate = '-'
                    let flag = false
                    for (let j = cekChat.length - 1; j >= 0 ; j--) {
                        if(cekChat[j].status == 2 && req.user.id == cekChat[j].user_receiver_id){
                            flag = true
                        }
                        if(date != '-') {
                            if(date == ((cekChat[j].created_at + '').substring(0, 10) + '')){
                                // console.log('stack', cekChat[j].created_at)
                                // stack chat dengan hari yang sama
                                momentDate = moment(cekChat[j].created_at, moment.ISO_8601).fromNow()
                                cekChat[j].moment = moment(cekChat[j].created_at, moment.ISO_8601).format('LT')
                                tempChat.push(cekChat[j])
                            } else {    
                                date = (cekChat[j].created_at + '').substring(0, 10)

                                // push category berdasarkan hari berbeda
                                resu[i].chats.push({
                                    value: tempChat, 
                                    momentDate: momentDate
                                })

                                // new category berdasarkan hari
                                tempChat = []
                                cekChat[j].moment = moment(cekChat[j].created_at, moment.ISO_8601).format('LT')
                                tempChat.push(cekChat[j])
                            }
                        } else {
                            date = (cekChat[j].created_at + '').substring(0, 10)

                            cekChat[j].moment = moment(cekChat[j].created_at, moment.ISO_8601).format('LT')
                            tempChat.push(cekChat[j])
                        }
                    }
                    momentDate = moment(tempChat[0].created_at, moment.ISO_8601).fromNow()
                    
                    resu[i].chats.push({
                        value: tempChat, 
                        momentDate: momentDate
                    })

                    if(flag){
                        unreadCtr++
                    }
    

                allResu.push(resu[i])
                pembuatDM = false;
            }
            
            else{

                if(pembuatDM){
                    // add aditional info
                    let user = await db.query(`SELECT * FROM users WHERE id='${resu[i].user_id_2}'`);
    
                    // ctr followers
                    let temp = await db.query(`SELECT * FROM user_relationships WHERE followed_user_id='${user[0].id}' AND status=1`);
                    user[0].followersCtr = kFormatter(temp.length)
    
                    // set target user
                    resu[i].target_user = user[0]
    
                     // last chat
                    resu[i].lastChat = {message : " "}
                    // resu[i].chats = [{
                    //     value: " ", 
                    //     momentDate: " "
                    
                    // }];
    
                    allResu.push(resu[i])
                }
            }

         

        }

        allResu.push({
            'id': -1,
            'unreadCtr': unreadCtr
        })

        return res.status(200).json({
            'message': 'Get All DM!',
            'data': allResu,
            'status': 'Success'
        });
        
    }else{
        return res.status(200).json({
            'message': 'Belum ada DM!',
            'data':{
            },
            'status': 'Error'
        });
    }

})

// make new dm, R
router.post('/dm', cekJWT, async (req,res)=> {
    console.log("masuk");
    // cek field kosong
    if(req.body.target_user_id){
        let cekUpdate = await db.query(`SELECT * FROM dm WHERE user_id_1='${req.user.id}' AND user_id_2='${req.body.target_user_id}'`);
        if(cekUpdate.length>0){
            // update
            await db.query(`UPDATE dm SET status=1 WHERE user_id_1='${req.user.id}' AND user_id_2='${req.body.target_user_id}'`);
            let dm = await db.query(`SELECT * FROM dm WHERE user_id_1='${req.user.id}' AND user_id_2='${req.body.target_user_id}'`);
            return res.status(200).json({
                'message': 'Berhasil Create DM!',
                'data': dm,
                'status': 'Success'
            });
        }else{
            // insert
            let cekData = await db.query(`SELECT * FROM dm`);
            if(cekData.length>0){
                let resu = await db.query(`SELECT MAX(dm_relation) FROM dm`);
                console.log("insert kedua");
                // insert new notif
                await db.query(`INSERT INTO dm VALUES(null,${resu[0]["MAX(dm_relation)"]+1}, '${req.user.id}', '${req.body.target_user_id}',1, CURRENT_TIMESTAMP, null)`);
                await db.query(`INSERT INTO dm VALUES(null,${resu[0]["MAX(dm_relation)"]+1}, '${req.body.target_user_id}', '${req.user.id}',1, CURRENT_TIMESTAMP, null)`);
                //insert
                // await db.query(`INSERT INTO chats VALUES(null, ${resu[0]["MAX(dm_relation)"]+1}, '${req.user.id}', '${req.body.target_user_id}', '', 2, CURRENT_TIMESTAMP, null)`);
                // await db.query(`INSERT INTO chats VALUES(null, ${resu[0]["MAX(dm_relation)"]+1},'${req.body.target_user_id}', '${req.user.id}', '', 2, CURRENT_TIMESTAMP, null)`);
                return res.status(201).json({
                    'message': 'Berhasil Create DM!',
                    'data': {
                        'id_relation': resu[0]["MAX(dm_relation)"] + 1
                },
                    'status': 'Success'
                });
        
            }else{
                console.log("insert pertama");
                await db.query(`INSERT INTO dm VALUES(null,1,'${req.user.id}', '${req.body.target_user_id}',1, CURRENT_TIMESTAMP, null)`);
                await db.query(`INSERT INTO dm VALUES(null,1,'${req.body.target_user_id}','${req.user.id}',1, CURRENT_TIMESTAMP, null)`);
                //insert
                // await db.query(`INSERT INTO chats VALUES(null, '1', '${req.user.id}', '${req.body.target_user_id}', '', 2, CURRENT_TIMESTAMP, null)`);
                // await db.query(`INSERT INTO chats VALUES(null,'1','${req.body.target_user_id}', '${req.user.id}', '', 2, CURRENT_TIMESTAMP, null)`);
                return res.status(201).json({
                    'message': 'Berhasil Create DM!',
                    'data': {
                        'target_user_id': req.body.target_user_id
                },
                    'status': 'Success'
                });
            }
        }
        
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// delete dm, R
router.delete('/dm', cekJWT, async(req, res) => {
    if(req.body.target_user_id){
        // update status comment jadi 0 (deleted)
        await db.query(`UPDATE dm SET status=0 WHERE user_id_1='${req.user.id}' AND user_id_2='${req.body.target_user_id}'`);
        
        return res.status(200).json({
            'message': 'Berhasil soft delete DM!',
            'data':{
            },
            'status': 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});

// find all users for create dm
router.get('/dm/create/search', cekJWT, async(req,res)=>{
    let final = []
    let resu = await db.query(`SELECT * FROM users WHERE status!=0 AND id!='${req.user.id}'`);

    resu.forEach(async (obj) => {
        let temp = await db.query(`SELECT * FROM dm WHERE user_id_1='${req.user.id}' AND user_id_2='${obj.id}' status!=0`);
        // jika user yang sedang login TIDAK pernah mengchat target user(obj) maka push
        if(temp.lengh == 0){
            final.push(obj)
        }
    });

    return res.status(200).json({
        'message': 'All users that is available for dm result!',
        'data': final,
        'status': 'Success'
    });

})

// get all chats from a DM
router.get('/dm/chats/:dm_relation', cekJWT, async(req,res)=>{
    if(req.params.dm_relation){
        let resu = await db.query(`SELECT * FROM chats WHERE dm_relation='${req.params.dm_relation}' AND status!=0`);

        let unreadCtr = 0
        for(let i = 0; i < resu.length; i++){
            if(parseInt(resu[i].status) == 2) {
                unreadCtr++
            }
        }

        return res.status(200).json({
            'message': 'All Chats Result!',
            'data': {
                'chats': resu,
                'unreadCtr': unreadCtr 
            },
            'status': 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
})

// read chat
router.patch('/dm/chat/read', cekJWT, async(req,res)=> {
    if(req.body.target_user_id){
        let resu = await db.query(`UPDATE chats SET status=1 WHERE user_sender_id='${req.body.target_user_id}' AND user_receiver_id='${req.user.id}'`);

        return res.status(200).json({
            'message': 'Chat read!',
            'data': resu,
            'status': 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
})

// send chat 
router.post('/dm/chat/send', cekJWT, async (req,res)=> {
    if(req.body.dm_relation && req.body.target_user_id && req.body.message) {
        let resu = await db.query(`INSERT INTO chats VALUES(null, '${req.body.dm_relation}', '${req.user.id}', '${req.body.target_user_id}', '${req.body.message}', 2, CURRENT_TIMESTAMP, null)`);
        await db.query(`INSERT INTO notifications VALUES(null, '${req.user.id}', '${req.body.target_user_id}', 'send you a message', 0, 4, CURRENT_TIMESTAMP, null)`);

        pusher.trigger(`${req.body.dm_relation}`, "sendMessage", {
            user_sender_id: req.user.id,
            target: req.body.target_user_id,
            message: req.body.message, 
            moment: moment().format('LT'),
            id: moment().format('LTS')
        });

        return res.status(201).json({
            'message': 'Send Chats success!',
            'data': {
                'dm_id': req.body.dm_id,
                'target_user_id': req.body.target_user_id, 
                'message': req.body.message, 
                'resu': resu
            },
            'status': 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
})

// unsend chat from a DM
router.delete('/dm/chats/delete', cekJWT, async(req, res) => {
    if(req.body.chat_id){
        // update status comment jadi 0 (deleted)
        await db.query(`UPDATE chats SET status=0 WHERE id='${req.body.chat_id}'`);
            
        return res.status(200).json({
            'message': 'Berhasil soft delete chat!',
            'data':{
            },
            'status': 'Success'
        });
    }else{
        return res.status(200).json({
            'message': 'Inputan Belum lengkap!',
            'data':{
            },
            'status': 'Error'
        });
    }
});


module.exports = router;