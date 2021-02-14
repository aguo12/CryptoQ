const express = require('express')
const CryptoJS = require("crypto-js");
const fs = require('fs')
const path = require('path')
const cookieParser = require('cookie-parser');
const qs = require('qs');

const app = express()
app.use(cookieParser())
app.set('trust proxy', true)
const port = 3000

let config = JSON.parse(fs.readFileSync(path.join(__dirname,'./config.json')))

app.post('/create', (req, res) => {
  if (req.query.eventName != null && req.query.allowRate != null && req.query.expiryTime != null && req.query.privateKey != null) {
    config.events[req.query.eventName] = {
      "keys": {
        "private_key": req.query.privateKey
      },
      "allowPercentile": req.query.allowRate,
      "isActive": true,
      "sessionExpiry": req.query.expiryTime
    }
    fs.writeFileSync(path.join(__dirname,'./config.json'), JSON.stringify(config))
    res.send({"success": true, "link": `https://aguo.dev/${req.query.eventName}`})
  } else {
    res.send({
      "success": false
    })
  }
})

app.get('*', (req, res) => {
  let reqPath = req.path.replace('/', '')
  if (config.events[reqPath] != null && config.events[reqPath]['isActive'] == true) { // Checks if the event name exists & that the event is active
    if (Object.getOwnPropertyNames(req.cookies).length != 0 && req.cookies['queueToken'] != null) { // Checks if the request includes cookies and if it includes queue cookie
      let queueToken = req.cookies['queueToken'];
      verifyCookie(queueToken, reqPath, req.ip).then(status => {
        switch (status) {
          case "allow":
            createCookie(req.ip, reqPath, 'allow').then(newCookie => {
              res.sendFile(path.resolve('../client/content.html'));
              res.cookie('queueToken', newCookie)
            })
            break;
          case "wait":
            createCookie(req.ip, reqPath, 'wait').then(newCookie => {
              res.sendFile(path.resolve('../client/queue.html'));
              res.cookie('queueToken', newCookie)
            })
            break;
          case "expired":
            createCookie(req.ip, reqPath, 'wait').then(newCookie => {
              res.sendFile(path.resolve('../client/expired.html'));
              res.cookie('queueToken', newCookie)
            })
            break;
        }
      })
    } else {
      res.sendFile(path.resolve('../client/queue.html'));
      createCookie(req.ip, reqPath, 'wait').then(newCookie => {
        if (newCookie != false) {
          res.cookie('queueToken', newCookie);
        } else {
          res.sendFile(path.resolve('../client/error.html'));
        }
      })
    }
  } else {
    res.sendFile(path.resolve('../client/error.html'));
  }
})

app.listen(port, () => {
  console.log(`Demo server initialized!`)
})

let verifyCookie = (queueToken, eventName, userIp) => {
  return new Promise((resolve, reject) => {
    if (qs.parse(queueToken) != null && qs.parse(queueToken).sig != null && qs.parse(queueToken).user != null && qs.parse(queueToken).event != null && qs.parse(queueToken).status != null && qs.parse(queueToken).expiry != null && qs.parse(queueToken).event === eventName) {
      let signature = qs.parse(queueToken).sig
      let originalCookie = `event=${qs.parse(queueToken).event}&status=${qs.parse(queueToken).status}&user=${qs.parse(queueToken).user}&expiry=${qs.parse(queueToken).expiry}&sig=`
      if (CryptoJS.HmacSHA256(originalCookie, config.events[eventName]['keys']['private_key']).toString() === signature) {
        if (userIp != qs.parse(queueToken).user) {
          resolve('wait');
        } else {
          if (new Date().getTime() > qs.parse(queueToken).expiry) {
            resolve('expired');
          } else {
            switch (qs.parse(queueToken).status) {
              case "allow":
                resolve('allow');
                break;
              case 'wait':
                let roll = Math.floor(Math.random() * 100);
                if (roll < config.events[eventName]['allowPercentile']) {
                  resolve('allow');
                } else {
                  resolve('wait')
                }
                break;
              case 'expired':
                resolve('expired');
                break;
            }
          }
        }
      } else {
        resolve('wait')
      }
    } else {
      resolve('wait')
    }
  })
}

let createCookie = (userIp, eventName, decision) => {
  return new Promise((resolve, reject) => {
    if (config.events[eventName] != null) {
      let cookieString = `event=${eventName}&status=${decision}&user=${userIp}&expiry=${new Date().getTime() + config.events[eventName]['sessionExpiry']}&sig=`
      let finalString = cookieString + CryptoJS.HmacSHA256(cookieString, config.events[eventName]['keys']['private_key']).toString()
      resolve(finalString);
    } else {
      resolve(false)
    }
  })
}