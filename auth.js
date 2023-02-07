const passport = require("passport")
const {ObjectID} = require("mongodb")
const LocalStrategy = require("passport-local")
const bcrypt = require('bcrypt')
const GithubStrategy = require("passport-github").Strategy

require('dotenv').config()

module.exports = function(app, myDatabase){

    passport.serializeUser((user, done)=>{
        done(null, user._id)
      })
      passport.deserializeUser((id, done)=>{
        myDatabase.findOne({_id: new ObjectID(id)}, (err, doc)=>{
          done(null, doc)
        })
      })

    passport.use(new LocalStrategy((username, password, done) => {
        myDatabase.findOne({ username: username }, (err, user) => {
          console.log(`User ${username} attempted to log in.`);
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
    
          if (bcrypt.compareSync(password, user.password)) { return done(null, false); }
          return done(null, user);
        });
      }));
    
      

      passport.use(new GithubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://fauzanabrar-bug-free-invention-49v5wgx7j6xcq76r-3000.preview.app.github.dev/auth/github/callback"
    }, (accessToken, refreshToken, profile, cb)=>{
        console.log(profile)
        myDatabase.findOneAndUpdate({id: profile.id}, {
            $setOnInsert:{
                id: profile.id,
                username: profile.displayName|| 'John Doe',
                photo: profile.photos[0].value || '',
                email: Array.isArray(profile.emails) ? profile.emails[0].value : "No public email",
                created_on: new Date(),
                provider: profile.provider || ''
            },
            $set:{
                last_login: new Date()
            },
            $inc:{
                login_count: 1
            }
        },{upsert: true, new: true}, (err, doc)=>{
            return cb(null, doc.value)
        })
    }))
}