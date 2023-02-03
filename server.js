'use strict';

const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const helmet = require('helmet');

const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const port = process.env.PORT || 3000;
const app = express();

const http = require('http').Server(app);

app.enable('trust proxy');
app.use(helmet());
app.use(cors());
app.set('json spaces', 40);
app.use(bodyParser.json()); // for parsing application/json

// Routes assignment
app.use("/api/v1", require('./routes/api.js'));

// Log unhandled Promise rejections
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise ' + JSON.stringify(p) + ' reason: ' + reason);
});

app.get('/', (req, res) => {
  return res.send('Welcome to Fetch Opportunity Stage Values');
})

//Handle unknown routes
app.use((req, res) => {
  console.log('The request didn\'t match any endpoint - ', req.url);
  return res.status(404).send('404 – Not Found');
});

// Serve the app
console.log('Served on port ' + port);

http.listen(port);

module.exports = { app };