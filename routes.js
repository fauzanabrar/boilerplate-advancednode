const passport = require('passport')
const bcrypt = require('bcrypt')

module.exports = function(app, myDatabase){
    app.get('/', (req, res)=>{
        res.render('index', {
            title: "Connected to Database", 
            message:'Please log in', 
            showLogin: true, 
            showRegistration: true,
            showSocialAuth: true
        })
      })
      
      app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
        res.redirect('/chat');
      })
    
      app.route("/profile").get(ensureAuthenticated, (req, res)=>{
        res.render('profile', {username: req.user.username})
      })

      app.route("/chat").get(ensureAuthenticated, (req, res)=>{
        res.render("chat", {user: req.user})
      })
    
      app.route("/logout").get((req, res)=>{
        req.logout()
        res.redirect('/')
      })
    
      app
        .route("/register")
        .post((req, res, next)=>{
          myDatabase.findOne({username: req.body.username}, (err, user)=>{
            if(err) {
              next(err)
            } else if (user){
              res.redirect('/')
            } else {
              const hash = bcrypt.hashSync(req.body.password, 12)
              myDatabase.insertOne({username: req.body.username, password: hash}, (err, user)=>{
                if(err){
                  res.redirect('/')
                }else {
                  next(null, user.ops[0])
                }
              })
            }
          })
        }, passport.authenticate('local', {failureRedirect: '/'}), (req, res, next)=>{
          res.redirect('/profile')
        }
      )

      app.get('/auth/github', passport.authenticate('github') )
      
      app.get('/auth/github/callback', passport.authenticate('github', {failureRedirect: '/'}), (req, res, next)=>{
        req.session.user_id = req.user.id
        res.redirect('/chat')
        }
    )


      app.use((req,res, next)=>{
        res.status(404).type("text").send("Not Found")
      })
}

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
      return next()
    }
    res.redirect('/')
  }