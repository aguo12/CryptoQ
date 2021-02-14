const express = require('express')
const fs = require('fs')
const path = require('path')
var cookieParser = require('cookie-parser')
const app = express()
app.use(cookieParser())

const port = 3000
let config = JSON.parse(fs.readFileSync('./config.json'))

app.get('*', (req, res) => {
  let reqPath = req.path.replace('/', '')
  if (config.events[reqPath] != null) {
    if (Object.getOwnPropertyNames(req.cookies).length != 0) {
      res.send("Welcome to the content! You made it!")
      // Disassemble cookie and match sig, then allow if valid
    } else {
      res.sendFile(path.resolve('../client/queue.html'));
    }
  } else {
    res.sendFile(path.resolve('../client/404.html'));
  }
})

app.listen(port, () => {
  console.log(`Demo server initialized!`)
})

let processCookie = new Promise((resolve, reject) => {
  // Decrypt cookie and sign a new one
})

let createCookie = new Promise((resolve, reject) => {

})