const express = require('express')
var cookieParser = require('cookie-parser')
const app = express()
app.use(cookieParser())
const port = 3000
const path = require('path')

app.get('/content', (req, res) => {
  if(Object.getOwnPropertyNames(req.cookies).length != 0){
      res.send("Welcome to the content! You made it!")
      // Disassemble cookie and match sig, then allow if valid
  } else {
      res.sendFile(path.resolve('../client/queue.html'));
  }
})

app.listen(port, () => {
  console.log(`Demo server initialized!`)
})

let processCookie = new Promise((resolve,reject) => {
  // Decrypt cookie and sign a new one
})

let createCookie = new Promise((resolve, reject) => {
  
})

