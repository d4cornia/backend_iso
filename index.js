const express=require("express");
const cors = require('cors')
const app = express();

app.use(cors())
// const fs= require("fs");
// const morgan=require('morgan');
// const accessLogStream  = fs.createWriteStream('./218116716.log', {flags:'a'},);
// app.set('view engine','ejs');
const db = require("./connection");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3001;

const user = require('./routes/user');
// const admin_kantin_sehat = require('./routes/admin_kantin_sehat');
// const stall_admin = require('./routes/stall_admin');
// const school_admin = require('./routes/school_admin');
app.use('/api/users/', user);
// app.use('/api/admin_kantin_sehat/', admin_kantin_sehat);
// app.use('/api/stall_admin/', stall_admin);
// app.use('/api/school_admin/', school_admin);

app.get('/api/test/:pa', function (req, res){
    let values = ''
    for (const col in req.body) {
        if(col !== 'temp'){
            values += req.body[col]
        }
    }
    return res.status(200).json({
        'body' : req.body,
        "hasil" : values,
        "LENGTH" : values.length
    });
});



// all
app.get('/api/:table', async(req,res)=>{
    let orderBy = 'ORDER BY ID ASC'
    if(req.query.order.length > 0) {
        let temp = req.query.order.split('-')
        orderBy = `ORDER BY ${temp[0]} ${temp[1]}`
    }

    console.log(`SELECT * FROM ${req.params.table} WHERE deleted_at IS NULL ${orderBy}`)
    let data = null
    try {
        data = await db.query(`SELECT * FROM ${req.params.table} WHERE deleted_at IS NULL ${orderBy}`);
    }catch(e) {
        console.log(e)
    }
    if(data.length == 0) {
        return res.status(200).json({
            'data' :{
                'message': 'No data',
                'data':{},
                'status': 'Failed'
            }
        });
    }

    return res.status(200).json({
        'message': 'Data ' + req.params.table,
        data,
        'status': 'Success'
    });
});

// sesuai id
app.get('/api/:table/:id', async(req,res)=>{

    console.log(`SELECT * FROM ${req.params.table} WHERE id='${req.params.id}' AND deleted_at IS NULL`)
    let data = await db.query(`SELECT * FROM ${req.params.table} WHERE id='${req.params.id}' AND deleted_at IS NULL`);
    if(data.length == 0) {
        return res.status(200).json({
            'data' :{
                'message': 'No data',
                'data':{},
                'status': 'Failed'
            }
        });
    }

    return res.status(200).json({
        'message': 'Data ' + req.params.table,
        'data': data[0],
        'status': 'Success'
    });
});

// post
app.post('/api/:table', async(req,res)=>{
    let values = ''
    for (const col in req.body) {
        if(req.body[col] === null){
            values += req.body[col] + `, `
        }else{
            values += `'` + req.body[col] + `', `
        }
    }
    values = values.substr(0, values.length - 2)
    // insert
    let data = {
        id: null
    }
    try {
        await db.query(`INSERT INTO ${req.params.table} VALUES(${values})`, function (err, result) {
            if (err) throw err;
            data.id = result.insertId;
            console.log(`INSERT INTO ${req.params.table} VALUES(${values})`)
            console.log("tengah" + data.id)

            return res.status(201).json({
                'message': 'Register Berhasil!',
                data,
                'status': 'Success'
            });
        });
    }catch (e) {
        console.log(e)
    }
});

// patch
app.patch('/api/:table/:id', async(req,res)=> {
    let values = ''
    for (const col in req.body) {
        values += col + `='` + req.body[col] + `', `
    }
    values = values.substr(0, values.length - 2)
    let data = null
    try{
        data = await db.query(`UPDATE ${req.params.table} SET ${values} WHERE id='${req.params.id}'`)
        console.log(`UPDATE ${req.params.table} SET ${values} WHERE id='${req.params.id}'`)
    }catch(e) {
        console.log(e)
    }
    return res.status(200).json({
        'message': 'Update Berhasil!',
        data,
        'status': 'Success'
    });
});


app.listen(port, function(){
    console.log('Listening to port 3001');
});
