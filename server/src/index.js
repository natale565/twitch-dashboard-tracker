import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv'

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();
app.get('/health', function(req, res){res.send({ok : true})} );
app.listen(3001);

console.log(typeof app);
console.log("starting...");
console.log('listening on..');