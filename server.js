/**
 * [https] 인증서 생성 방법
 * npm install -g mkcert
 * mkcert create-ca
 * mkcert create-cert
 */
const express = require('express')
const expressSanitizer = require('express-sanitizer')
const socketIo = require('./common/index')
const app = express()
const fs = require('fs')
const path = require('path')

const server = require('http').createServer(app)
const io = require('socket.io')
const httpio = io(server)

// const options = {
//   key: fs.readFileSync('./config/cert.key'),
//   cert: fs.readFileSync('./config/cert.crt'),
// }
// const httpsServer = require('https').createServer(options, app)
// const httpsio = io(httpsServer)
const db = {}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(expressSanitizer())
app.use(express.static(path.join(__dirname, 'public')))

server.listen(5000, () => {
  console.log('ok')
  socketIo.init(__dirname, httpio, db)
})

// httpsServer.listen(5500, () => {
//   console.log('https ok')
//   socketIo.init(__dirname, httpsio, db, 'https')
// })
