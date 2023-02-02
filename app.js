const express = require('express')
const mongoose = require('mongoose')
const app = express()
const port = 3000
const jwt = require('jsonwebtoken')
const { Schema } = mongoose

mongoose.set('strictQuery', false);

const BookSchema = new Schema({
    id: String,
    title: String
})

const UserSchema = new Schema({
    username: String,
    password: String,
    wishlist: [BookSchema]
})

const User = mongoose.model("User", UserSchema)

function generateToken(username) {
    return jwt.sign({username}, 'secret', {expiresIn: '1h'})
}

function authenticateToken(req, res, next) {
    const token = req.headers.authorization

    if (token === null) return res.sendStatus(401)

    jwt.verify(token, 'secret', (err, user) => {
        if (err) {
            console.log(err);
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}

app.use(express.json())


app.post('/signup', async (req, res) => {
    let usernameExists = await User.exists({username: req.body.username})
    if (usernameExists) {
        return res.status(409).json({
            error: "user exists already"
        })
    }

    const { username, password } = req.body
    const newUser = new User({
        username, password, wishlist: []
    })

    try {
        await newUser.save();
    } catch {
        console.log("error happened");
    }
    const token = generateToken({username: req.body.username})
    res.status(201)
    .json({
        success: true,
        data: {
            username,
            token
        }
    })
})
.post('/login', async (req, res) =>{
    let { username, password } = req.body
    let currentUser = await User.findOne({username: username})
    if (currentUser === null || currentUser.password !== password) {
        return res.sendStatus(403)
    }
    const token = generateToken(username)
    res.status(200)
    .json({
        success: true,
        data: {
            username,
            token
        }
    })
})

app.get('/wishlist/', authenticateToken, async (req, res) => {
    let wishlist;
    try {
        const currentUser = await User.findOne({username: user.username})
        wishlist = currentUser.wishlist
    } catch {
        return res.sendStatus(403).json({
            error: "wrong credential"
        })
    }
    res.status(200).json({
        success: true,
        data: {
            wishlist
        }
    })
})
.delete('/wishlist/', authenticateToken, async (req, res) => {
    try {
        await User.findOneAndUpdate({username: user.username}, {wishlist: user.wishlist.filter(book => book.id !== req.body.id)})
    }  catch {
        return res.sendStatus(404).json({
            error: "error updating wishlist"
        })
    }
    let currentUser = await User.findOne({username: user.username})
    res.status(200).json({
        success: true,
        data: {
            wishlist: currentUser.wishlist
        }
    })
})
.put('/wishlist/', authenticateToken, async (req, res) => {
    try {
        await User.findOneAndUpdate({username: user.username}, {wishlist: [...user.wishlist, req.body.book]})
        }  catch {
            return res.sendStatus(404).json({
                error: "error updating wishlist"
            })
        }
    let currentUser = await User.findOne({username: user.username})
    res.status(201).json({
        success: true,
        data: {
            wishlist: currentUser.wishlist
        }
    })
})


mongoose.connect("mongodb://localhost:27017/books")
.then(() => {
    app.listen(3000, () => {
        console.log("Server is running at port 3000");
    })
})