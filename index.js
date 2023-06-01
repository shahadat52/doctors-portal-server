const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();



// middleware
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xo63l6y.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const appointmentOptionCollection = client.db("doctorsPortal").collection("appointmentOptions");

        app.get("/appointmentOptions", async (req, res) => {
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            res.send(options);
        });

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
