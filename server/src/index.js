import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

const { Pool } = pg;
dotenv.config();


const app = express();
app.use(express.json())


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.post('/auth/register', async function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    if (( !username ) || ( !password )){
        res.status(400).send('username and password required')
        console.log('username and password required')
        return
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    res.send(hashedPassword);
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