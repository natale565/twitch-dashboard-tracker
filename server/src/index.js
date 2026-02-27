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

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader){
        res.status(401).send('Missing authentication credentials');
        console.log('Missing authentication credentials');
        return
    }
    if (!authHeader.startsWith('Bearer ')){
        res.status(401).send('Missing authentication credentials');
        console.log('Missing authentication credentials');
        return
    }
    const token = authHeader.replace('Bearer ', '') 

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decodedPayload;
        next();
    }
    catch(error){
        res.status(401).send('Missing authentication credentials')
        console.log('Missing authentication credentials');
        return
    }
}

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
        res.status(400).send('username and password required');
        console.log('username and password required');
        return
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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

app.post('/favorites', authMiddleware, async function(req, res){
    const streamer_name = req.body.streamer_name;
    const user_id = req.user.sub;

    if (!streamer_name){
        res.status(400).json({ error: 'streamer name required'});
        console.log('Streamer name required');
        return
    }

    try {
        const result = await pool.query('INSERT INTO favorite_streamer (user_id, streamer_name) VALUES ($1, $2) RETURNING id, user_id, streamer_name', [user_id, streamer_name])
        res.status(201).json(result.rows[0])
        return
    }
    catch(error) {
        if (error.code === '23505') {
            res.status(409).json({ error: 'Streamer already added' });
            console.log('Streamer already added');
            return
        }
        else {
            res.status(500).json({error: 'server error'})
            console.log(error);
            return
        }
    }
})

app.get('/favorites', authMiddleware, async (req, res) =>{
    const user_id = req.user.sub;

    try{
    const result = await pool.query('SELECT id, user_id, streamer_name, created_at FROM favorite_streamer WHERE user_id = $1 ORDER BY created_at DESC', [user_id])
    return res.status(200).json(result.rows)
    }
    catch(error){
        res.status(500).json({error: 'server error'})
        console.log('Server error')
        return
    }

});

app.get('/auth/me', authMiddleware, (req, res) => {
    return res.send(req.user)
})

app.delete('/favorites/:id', authMiddleware, async (req, res) => {
    const {id} = req.params;
    const user_id = req.user.sub;
    try {
    const result = await pool.query('DELETE FROM favorite_streamer WHERE id=$1 AND user_id=$2 RETURNING * ',[id, user_id]);
    if (result.rows.length === 0){
        res.status(404).send()
        console.log('Delete successful')
        return
    }
    else{
        res.status(204).send()
        return
    }
}
    catch(error){
        res.status(500).json({error: 'Database Failed'})
        console.log('Database Failed', error)
        return
    }
})


app.get('/db-test', async function(req, res) {
    try {
        const result = await pool.query('SELECT NOW()')
        res.send(result.rows[0])
    }
    catch(error){
        console.log('Database Failed', error)
        res.status(500).send('Database Failed');
    }
    
})

app.get('/health', function(req, res){res.send({ok : true})} );
app.listen(3001);


console.log(typeof app);
console.log("starting...");
console.log('listening on..');