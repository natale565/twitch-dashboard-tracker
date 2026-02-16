import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();
console.log('DB URL exists?', Boolean(process.env.DATABASE_URL));


const app = express();
app.use(express.json())


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.post('/auth/register', async function(req, res){
    console.log(req.body)
    res.send('received!')
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