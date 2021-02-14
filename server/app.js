const express = require('express')
const app = express()
const port = 3000

let requestRouter = (req, res, next) => {
    console.log('LOGGED')
    next()
}

app.get('/content', (req, res) => {
  res.send('Hello World!')
})

app

app.listen(port, () => {
  console.log(`Demo server initialized!`)
})

app.use(requestRouter)

