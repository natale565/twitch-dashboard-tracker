import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { Pool } = pg;
dotenv.config();


const app = express();
app.use(express.json())


const pool = new Pool({
connectionString: process.env.DATABASE_URL,
});

app.post('/auth/login', async function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    if ( (!username) || ( !password) ){
        res.status(400).send('username and password required')
        console.log('username and password required')
        return
    }

    let result;

    try {
    result = await pool.query('SELECT id, username, password_hash, created_at FROM users WHERE username = $1', [username])
    if (result.rows.length === 0){
        res.status(401).send('invalid credentials');
        console.log('invalid credentials');
        return
    }
    }
    catch(error) {
        res.status(500).send('server error');
        console.log(error)
        return
    }

    const user = result.rows[0];
    const safeUser = {
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
    };
    
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match){
        res.status(401).send('invalid credentials');
        console.log('invalid credentials');
        return;
    }
    
    const token = jwt.sign({ sub: user.id,username: user.username },process.env.JWT_SECRET,
    { expiresIn: '1h'});

    res.status(200).json({user: safeUser, token});

    
});

app.post('/auth/register', async function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    if ( ( !username ) || ( !password ) ){
        res.status(400).send('username and password required')
        console.log('username and password required')
        return
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    //res.send(hashedPassword);

    try {
    const result = await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at', [username, hashedPassword])
    res.status(201).send(result.rows[0])
    }
    catch (error){
        if (error.code === '23505'){
            res.status(409).send('username already taken')
        }
        else {
            res.status(500).send('server error')
        }
    }
})


app.get('/db-test', async function(req, res) {
    try {
        const result = await pool.query('SELECT NOW()')
        res.send(result.rows[0])
    }
    catch(error){
        console.log('database failed', error)
        res.status(500).send('database failed');
    }
    
})

app.get('/health', function(req, res){res.send({ok : true})} );
app.listen(3001);


console.log(typeof app);
console.log("starting...");
console.log('listening on..');