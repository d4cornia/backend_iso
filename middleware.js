const db = require("./connection");
const jwt = require('jsonwebtoken');
const CryptoJS = require("crypto-js");

async function cekJWT(req, res, next){
    if(!req.headers['x-auth-token']){
        return res.status(401).json({
            'error_msg': 'Unauthorized!'
        });
    }
    let token = req.headers['x-auth-token'];
    let user = null;
    try{
        user = jwt.verify(token, process.env.secret);
    }catch(e){
        console.log(e);
        return res.status(401).json({
            'error_msg': 'Invalid Token'
        });
    }

    // batasan waktu
    // hasil dalam second
    // console.log(new Date().getTime()/1000 - user.iat);
    // if(new Date().getTime()/1000 - user.iat > 900){
    //     return res.status(401).json({
    //         'err': 'Token expired'
    //     });
    // }
    let resu = await db.query(`SELECT * FROM users WHERE email='${user.email}' AND password='${user.password}'`);

    req.user = resu[0]; // jika suskses maka akan mendapatkan user yang diverfikasi jwt
    next();
}

async function verifyCode(req, res, next) {
    let resu = await db.query(`SELECT * FROM users WHERE email='${req.body.email}'`);
    if(resu[0].verification_code == '-'){
        return res.status(400).json({
            'message': 'Request Verification code dulu!',
            'data':{
            },
            'status': 'Error'
        });
    }
    if(req.body.verification_code != resu[0].verification_code){
        return res.status(400).json({
            'message': 'Verification code yang dimasukan salah!',
            'data':{
            },
            'status': 'Error'
        });
    }

    next();
}

async function authAdminKantinSehat(req, res, next) {
    if(req.user.role != 0){
        return res.status(401).json({
            'message': 'Unauthorized',
            'data':{
            },
            'status': 'Error'
        });
    }

    next();
}

async function authAdminStall(req, res, next) {
    if(req.user.role != 2){
        return res.status(401).json({
            'message': 'Unauthorized',
            'data':{
            },
            'status': 'Error'
        });
    }

    next();
}

async function authAdminSekolah(req, res, next) {
    if(req.user.role != 3){
        return res.status(401).json({
            'message': 'Unauthorized',
            'data':{
            },
            'status': 'Error'
        });
    }

    next();
}


async function cekTagihanBulanLalu(req, res, next){
    // sebelum bisa extend cek tagihan bulan lalu sudah dibayar belum
    let resu = await db.query(`SELECT * FROM members WHERE id_user='${req.user.id_user}'`);

    let tgl = resu[0].last_payment.split("-");
    let lastpayment = new Date(parseInt(tgl[2]), parseInt(tgl[1]) - 1, tgl[0]);
    tgl = resu[0].end_date.split("-");
    let enddate = '-';
    if(parseInt(tgl[1]) - 2 < 0){
        enddate = new Date(parseInt(tgl[2]), 12, tgl[0] - 1);
    }else{
        enddate = new Date(parseInt(tgl[2]), parseInt(tgl[1]) - 2, tgl[0]);
    }

    if(lastpayment.getTime() < enddate.getTime()){
        // belum bayar bulan ini
        return res.status(402).json({
            'error msg': 'Harap bayar tagihan yang belum lunas!'
        });
    }

    let now = new Date();
    enddate = new Date(parseInt(tgl[2]), parseInt(tgl[1]) - 1, tgl[0]);

    if(now.getTime() <= enddate.getTime()){
        //belum expired
        return res.status(400).json({
            'error msg': 'Membership anda belum expired!'
        });
    }
    next();
}


module.exports = {
    'authAdminKantinSehat': authAdminKantinSehat,
    'authAdminStall': authAdminStall,
    'authAdminSekolah': authAdminSekolah,
    'verifyCode': verifyCode,
    'cekJWT': cekJWT,
    'cekTagihanBulanLalu': cekTagihanBulanLalu
};


