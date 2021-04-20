const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const cors = require("cors")
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()

const port = 4000;

app.use(cors());
app.use(bodyParser.json())
app.use(fileUpload());

app.get('/', (req, res) => {
    res.send('Hello World!')
})
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6gnbd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const serviceCollection = client.db("bridal-evento").collection("services");

    //Add Service
    app.post('/addService', (req, res) => {
        const title = req.body.title
        const details = req.body.details
        const fileInfo = req.files.file
        const newImg = fileInfo.data;
        const encImg = newImg.toString('base64');
        var image = {
            contentType: fileInfo.mimetype,
            size: fileInfo.size,
            img: Buffer.from(encImg, 'base64')
        };
        serviceCollection.insertOne({ title, details, image })
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    //Get services
    app.get('/services', (req, res) => {
        serviceCollection.find({})
        .toArray((err, doc) => {
            res.send(doc);
        })
    })

    //Delete Service
    app.delete('/deleteService/:id', (req, res) => {
        serviceCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                res.send(result.deletedCount > 0)
            })
    })

    //Get serviceBy Id
    app.post('/services/:id', (req, res) => {
        serviceCollection.find({ _id: ObjectId(req.params.id) })
        .toArray((err, doc) => {
            res.send(doc);
        })
    })
});
app.listen(process.env.PORT || port)