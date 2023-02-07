'use strict';
require('dotenv').config();
const express = require('express');
const pug = require('pug')
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();
const session = require("express-session")
const passport = require('passport')

const routes = require('./routes')
const auth = require('./auth')

const http = require('http').createServer(app)
const io = require("socket.io")(http)

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug')
app.set('views', './views/pug')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {secure: false}
}))
app.use(passport.initialize(), passport.session())

myDB(async client => {
  const myDatabase = await client.db('database').collection('users')
  
  
  routes(app, myDatabase)
  auth(app, myDatabase)
  
  io.on('connection', socket =>{
    console.log('A user has been connected')
  })

}).then(e =>{
  
  app.route('/').get((req, res) => {
    res.render('index', {title: "Hello", message: "Please log in"})
  });
  
})

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
