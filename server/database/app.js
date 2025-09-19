/*jshint esversion: 8 */

const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors')
const app = express()
const port = 3030;

app.use(cors())
app.use(require('body-parser').urlencoded({ extended: false }));

const reviews_data = JSON.parse(fs.readFileSync("data/reviews.json", 'utf8'));
const dealerships_data = JSON.parse(fs.readFileSync("data/dealerships.json", 'utf8'));

// Try to connect to MongoDB, but don't fail if it's not available
let mongoConnected = false;
let Reviews, Dealerships;

mongoose.connect("mongodb://mongo_db:27017/", {'dbName':'dealershipsDB'})
  .then(() => {
    console.log('Connected to MongoDB');
    mongoConnected = true;
    
    Reviews = require('./review');
    Dealerships = require('./dealership');
    
    // Initialize data
    Reviews.deleteMany({}).then(()=>{
      Reviews.insertMany(reviews_data['reviews']);
    });
    Dealerships.deleteMany({}).then(()=>{
      Dealerships.insertMany(dealerships_data['dealerships']);
    });
  })
  .catch(err => {
    console.log('MongoDB connection failed, using JSON fallback:', err.message);
    mongoConnected = false;
  });

// Express route to home
app.get('/', async (req, res) => {
    res.send("Welcome to the Mongoose API")
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    if (mongoConnected) {
      const documents = await Reviews.find();
      res.json(documents);
    } else {
      // Fallback to JSON data
      res.json(reviews_data.reviews);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    if (mongoConnected) {
      const documents = await Reviews.find({dealership: req.params.id});
      res.json(documents);
    } else {
      // Fallback to JSON data
      const filtered = reviews_data.reviews.filter(review => review.dealership == req.params.id);
      res.json(filtered);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
    try {
        if (mongoConnected) {
          const documents = await Dealerships.find({});
          res.json(documents);
        } else {
          // Fallback to JSON data
          res.json(dealerships_data.dealerships);
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Express route to fetch Dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
    try {
        if (mongoConnected) {
          const documents = await Dealerships.find({ state: req.params.state });
          res.json(documents);
        } else {
          // Fallback to JSON data
          const filtered = dealerships_data.dealerships.filter(dealer => dealer.state === req.params.state);
          res.json(filtered);
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Express route to fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
    try {
        if (mongoConnected) {
          const document = await Dealerships.findOne({ id: req.params.id });
          res.json(document);
        } else {
          // Fallback to JSON data
          const dealer = dealerships_data.dealerships.find(dealer => dealer.id == req.params.id);
          res.json(dealer);
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching document' });
    }
});

//Express route to insert review
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
  data = JSON.parse(req.body);
  
  if (mongoConnected) {
    const documents = await Reviews.find().sort( { id: -1 } )
    let new_id = documents[0]['id']+1

    const review = new Reviews({
      "id": new_id,
      "name": data['name'],
      "dealership": data['dealership'],
      "review": data['review'],
      "purchase": data['purchase'],
      "purchase_date": data['purchase_date'],
      "car_make": data['car_make'],
      "car_model": data['car_model'],
      "car_year": data['car_year'],
    });

    try {
      const savedReview = await review.save();
      res.json(savedReview);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Error inserting review' });
    }
  } else {
    // Fallback: just return success (can't persist without DB)
    let new_id = reviews_data.reviews.length + 1;
    const newReview = {
      "id": new_id,
      "name": data['name'],
      "dealership": data['dealership'],
      "review": data['review'],
      "purchase": data['purchase'],
      "purchase_date": data['purchase_date'],
      "car_make": data['car_make'],
      "car_model": data['car_model'],
      "car_year": data['car_year'],
    };
    res.json(newReview);
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});