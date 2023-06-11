const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();



// middleware
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xo63l6y.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true, }
});

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(401).send('forbidden access')
        };
        req.decoded = decoded;
        next();
    })
}
async function run() {
    try {
        const appointmentOptionCollection = client.db("doctorsPortal").collection("appointmentOptions");
        const bookingsCollections = client.db("doctorsPortal").collection("bookings");
        const usersCollections = client.db("doctorsPortal").collection("users");



        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollections.insertOne(user);
            res.send(result)
        })
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send("forbidden access");
            }

            const query = { email: email }
            const bookings = await bookingsCollections.find(query).toArray()
            res.send(bookings)
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollections.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '2h' });
                res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: ' ' })
        })
        app.get("/appointmentOptions", async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            const bookingQuery = { appointmentDate: date };
            const alreadyBook = await bookingsCollections.find(bookingQuery).toArray();

            options.forEach(option => {
                const bookingOption = alreadyBook.filter(book => book.treatment === option.name);
                const bookingSlot = bookingOption.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookingSlot.includes(slot))
                option.slots = remainingSlots
            })
            res.send(options);
        });
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }
            const alreadyBooked = await bookingsCollections.find(query).toArray()

            if (alreadyBooked.length) {
                const message = `You already have a booking on ${booking.appointmentDate}`
                return res.send({ acknowledge: false, message })
            }
            const result = await bookingsCollections.insertOne(booking);
            res.send(result)
        });

        app.get('/allUsers', async (req, res) => {
            const query = {};
            const users = await usersCollections.find(query).toArray();
            res.send(users)
        })

    }
    finally {

    }
}
run().catch((error) => console.error(error));



app.get('/', (req, res) => {
    res.send('doctors portal server is running')
});

app.listen(port, () => {
    console.log(`doctors portal server is running on ${port}`)
});
