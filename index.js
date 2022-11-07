const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const prot = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uxk5wr6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function jwtVerify(req, res, next) {
    const authHeaders = req.headers?.authorization;
    if (!authHeaders) {
        return res.status(401).send({ message: 'undefined token' })
    }
    const token = authHeaders.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'invalid token' })
        }
        req.decoded = decoded.email;
        next()
    })
}

async function run() {
    const foodCollection = client.db("BDfood").collection("foods");
    const orderCollection = client.db("BDfood").collection("orders");
    try {
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1d' });
            res.send({ token })
        })
        app.post('/food/create', async (req, res) => {
            const product = req.body;
            const results = await foodCollection.insertOne(product);
            res.send({
                message: 'success',
                data: results
            })
        });
        app.get('/foods', async (req, res) => {
            const products = await foodCollection.find({}).toArray();
            res.send({
                message: 'success',
                data: products
            })
        });
        app.get('/foods/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const food = await foodCollection.findOne(query);
            res.send({
                message: 'success',
                food: food,
            })
        });
        app.post('/orders', async (req, res) => {
            const newOrder = req.body;
            const results = await orderCollection.insertOne(newOrder);
            res.send({
                message: 'success',
                data: results
            })
        });
        app.get('/orders', jwtVerify, async (req, res) => {
            const decoded = req.decoded;
            if (decoded !== req.query.email) {
                return res.status(403).send({message: 'forbidden'})
            }
            let query = {};
            if (req.query.email) {
                query = { email: req.query.email };
            }
            const orders = await orderCollection.find(query).toArray();
            res.send({
                message: 'success',
                orders: orders
            })
        });
        app.delete('/orders/:id', async (req, res) => {
            const id = ObjectId(req.params.id);
            const query = { _id: id };
            const results = await orderCollection.deleteOne(query);
            res.send({
                message: 'success',
                data: results
            })
        });
        app.get('/', (req, res)=> {
            res.send('bd food server running')
        })
    }
    catch (err) {
        console.log(err.message)
        console.log(err.name)
        console.log(err.text)
    }
}
run().catch(err => console.log(err))

app.listen(prot, () => {
    client.connect(err => {
        if (err) {
            console.log('database connection error')
        }
        else {
            console.log('bd food server port:', prot)
        }
    });
})

