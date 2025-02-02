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

const passportSocketIo = require('passport.socketio')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')(session)
const URI = process.env.MONGO_URI
const store = new MongoStore({url: URI})


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
  cookie: {secure: false},
  key: 'express.sid',
  store: store
}))
app.use(passport.initialize(), passport.session())

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'express.sid',
  secret: process.env.SESSION_SECRET,
  store: store,
  success: onAuthorizeSuccess, 
  fail: onAuthorizeFail
}))

myDB(async client => {
  const myDatabase = await client.db('database').collection('users')
  
  routes(app, myDatabase)
  auth(app, myDatabase)
  
  let currentUsers = 0
  io.on('connection', socket =>{
    ++currentUsers
    io.emit('user', {
      username: socket.request.user.username,
      currentUsers,
      connected: true
    })
    console.log('A user has been connected')
    
    socket.on("chat message", (message)=>{
      io.emit("chat message", {
        username: socket.request.user.username,
        message
      });
    })


    socket.on('disconnect', ()=>{
      --currentUsers;
      io.emit('user count', currentUsers)
      console.log('A user has been disconnected')
    })
  })
  

}).then(e =>{
  
  app.route('/').get((req, res) => {
    res.render('index', {title: "Hello", message: "Please log in"})
  });
  
})


function onAuthorizeSuccess(data, accept){
  console.log("successful connection to socket.io")
  accept(null, true)
}

function onAuthorizeFail(data, message, error, accept){
  if(error) throw new Error(message)
  console.log("failed connection to socket.io:", message);
  accept(null, false)
}




const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
