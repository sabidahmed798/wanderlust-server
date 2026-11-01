import express from 'express'
import { MongoClient, ObjectId } from 'mongodb';

import cors from "cors"
import 'dotenv/config'
import { createRemoteJWKSet, jwtVerify } from 'jose';
const app = express()
const PORT = 8000

app.use(cors())
app.use(express.json())



const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
  try {
    // await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB()
const db = mongoClient.db("wonderlust");
const destinationCollection = db.collection("destination")
const bookingCollection = db.collection("bookings")

const verifyToken = async (req, res, next) => {
   const authHeader = req.headers.authorization
console.log(authHeader)
 if(!authHeader){
   return res.status(401).send({msg: 'Unauthorized!'})
 }

 const token = authHeader.split(" ")[1]

if(!token){
   return res.status(401).send({msg: 'Unauthorized!'})
}

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`))

try{
const {payload} = await jwtVerify (token, JWKS)
console.log(payload)
next()
} catch (error){
  console.log(error)
 return res.status(500).send({msg: 'Server Error!'})
}


 
};

app.post('/add-destination', verifyToken, async(req, res) =>{
  const data = req.body
const result = await destinationCollection.insertOne(data)

  res.send({result});
});

app.get('/destination', async(req, res) =>{
  const result = await destinationCollection.find().toArray()
  res.send(result)
})

app.get('/destination/:id', verifyToken,  async (req, res)=>{





  const {id} = req.params
const result = await destinationCollection.findOne({_id: new ObjectId(id)})
  res.send(result)
})
app.post('/booking', async(req, res)=> {
  const data = req.body
  const result = await bookingCollection.insertOne(data)
  res.send(result)
})

app.get('/my-bookings/:email', async(req, res)=> {
  const {email} = req.params
  const result = await bookingCollection.find({email:email}).toArray()
res.send(result)
})

app.delete('/booking/:id', async(req, res)=>{
  const {id} = req.params

  // Documents created via POST /booking carry the destination id as a string
  // `_id`; newer ones get a Mongo-generated ObjectId. Match either.
  let objectId = null
  try {
    objectId = new ObjectId(id)
  } catch {
    objectId = null
  }

  const query = objectId ? {$or: [{_id: objectId}, {_id: id}]} : {_id: id}
  const result = await bookingCollection.deleteOne(query)
  res.json(result)
})

app.patch('/destination/:id', verifyToken , async (req, res) => {
  const { id } = req.params
  const updateData = req.body
  const result = await destinationCollection.updateOne (
    {_id: new ObjectId(id)},
    {$set: updateData},
)
res.json(result);
})

app.delete('/destination/:id', verifyToken, async(req,res) =>{
  const {id} = req.params
  const result = await destinationCollection.deleteOne({_id: new ObjectId(id)})
  res.json(result);
})


app.get('/', (req,res) => {
    res.send({meaaage: 'Server is running find!'})
})

app.listen(PORT, () => {
    console.log(`server is running at ${PORT}`)
})

export default app