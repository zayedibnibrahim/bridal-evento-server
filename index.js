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

//Verify JWT ADMIN Token

var admin = require("firebase-admin");

var serviceAccount = require("./bridal-evento-firebase-adminsdk-mvc7t-bf99d26f69.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});



app.get('/', (req, res) => {
    res.send('Hello World!')
})
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6gnbd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const serviceCollection = client.db("bridal-evento").collection("services");
    const ordersCollection = client.db("bridal-evento").collection("orders");
    const adminCollection = client.db("bridal-evento").collection("admin");
    const reviewCollection = client.db("bridal-evento").collection("review");
    const emailCollection = client.db("bridal-evento").collection("email");

    //Add Service
    app.post('/addService', (req, res) => {
        const title = req.body.title
        const price = req.body.price
        const details = req.body.details

        const fileInfo = req.files.file
        const newImg = fileInfo.data;
        const encImg = newImg.toString('base64');
        var image = {
            contentType: fileInfo.mimetype,
            size: fileInfo.size,
            img: Buffer.from(encImg, 'base64')
        };
        serviceCollection.insertOne({ title, price, details, image })
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

    //Order Done
    app.post('/paymentDone', (req, res) => {
        const order = req.body
        ordersCollection.insertOne(order)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    //Add Admin
    app.post('/addAdmin', (req, res) => {
        const admin = req.body
        adminCollection.insertOne(admin)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    //All Order
    app.get('/allOrder', (req, res) => {
        ordersCollection.find({})
            .toArray((err, doc) => {
                res.send(doc)
            })
    })

    //All Order by person
    app.get('/allOrderByPerson/:email', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1]
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.params.email

                    if (tokenEmail == queryEmail) {
                        ordersCollection.find({ email: queryEmail })
                            .toArray((err, document) => {
                                res.send(document)
                            })
                    }
                    else {
                        res.status(401).send('Unauthorized Access')
                    }
                })
                .catch(error => {
                    res.status(401).send('Unauthorized Access')
                });
        }
        else {
            res.status(401).send('Unauthorized Access')
        }

    })
    //Post review
    app.post('/review', (req, res) => {
        const review = req.body
        reviewCollection.insertOne(review)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    //Check If Admin
    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({ email: email })
            .toArray((err, admin) => {
                res.send(admin.length > 0)

            })
    })
    //get all reviews
    app.get('/showReview', (req, res) => {
        reviewCollection.find({})
            .toArray((err, review) => {
                res.send(review)
            })
    })

    //Update Status
    app.post('/upStatus', (req, res) => {
        const gotId = req.body.id
        const gotStatus = req.body.upValue

        ordersCollection.updateOne({ _id: ObjectId(gotId) },
            { $set: { status: gotStatus } })
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })
    //send Email
    app.post('/email', (req, res) => {
        const email = req.body
        emailCollection.insertOne(email)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    //Get Email
    app.get('/showEmail', (req, res) => {
        emailCollection.find({})
            .toArray((err, mail) => {
                res.send(mail)
            })
    })

});
//index
app.listen(process.env.PORT || port)