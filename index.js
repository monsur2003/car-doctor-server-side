const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
   res.send("hello doctor of car ");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kjf5ogd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   },
});
// jwt verify
const verifyJwt = (req, res, next) => {
   // console.log(req.headers.autorization);
   const authorization = req.headers.autorization;
   if (!authorization) {
      return res
         .status(401)
         .send({ error: true, message: "Unauthorized Access" });
   }

   const token = authorization.split(" ")[1];
   jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
         return res.send({ error: true, message: "Unauthorized" });
      }
      req.decoded = decoded;
      next();
   });
};

async function run() {
   try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();

      const servicesCollection = client.db("cardoctor").collection("services");
      const bookingCollection = client.db("cardoctor").collection("bookings");

      app.post("/jwt", (req, res) => {
         const user = req.body;
         console.log(user);
         const token = jwt.sign(user, process.env.JWT_SECRET, {
            expiresIn: "1h",
         });
         res.send({ token });
      });

      app.get("/services", async (req, res) => {
         const cursor = servicesCollection.find();
         const result = await cursor.toArray();
         res.send(result);
      });

      app.get("/services/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };
         console.log("query from 45 lines", query);
         const result = await servicesCollection.findOne(query);
         res.send(result);
      });

      //   booking section
      app.post("/bookings", async (req, res) => {
         const booking = req.body;
         const result = await bookingCollection.insertOne(booking);
         res.send(result);
      });

      app.get("/bookings", verifyJwt, async (req, res) => {
         // console.log(req.headers.autorization);
         let query = {};
         if (req.query?.email) {
            query = { email: req.query.email };
         }
         const result = await bookingCollection.find(query).toArray();
         res.send(result);
      });

      //   update booking

      app.patch("/bookings/:id", async (req, res) => {
         const id = req.params.id;
         const booking = req.body;
         console.log(booking);
         const filter = { _id: new ObjectId(id) };
         const updateDoc = {
            $set: {
               status: booking.statusbar,
            },
         };
         const result = await bookingCollection.updateOne(filter, updateDoc);
         res.send(result);
      });

      app.delete("/bookings/:id", async (req, res) => {
         const id = req.params.id;
         const deleteOne = { _id: new ObjectId(id) };
         const result = await bookingCollection.deleteOne(deleteOne);
         res.send(result);
      });

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log(
         "Pinged your deployment. You successfully connected to MongoDB!"
      );
   } finally {
      // Ensures that the client will close when you finish/error
      //   await client.close();
   }
}
run().catch(console.dir);

app.listen(port, () => {
   console.log(`server listening on ${port}`);
});
