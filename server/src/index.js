import express from 'express'

const app = express()
app.get('/health', function(req, res){res.send({ok : true})} );
app.listen(3001)

console.log(typeof app)
console.log("starting...")
console.log('listening on..')