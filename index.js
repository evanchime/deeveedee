"use strict"

const express = require("express")
const bodyParser = require("body-parser")
const config = require("./services/config")
const whatsappMessage = require("./services/whatsappMessage")
const verifyRequestSignature = require("./services/verifyRequestSignature")
const {getCompletion,createAssistant,createThread} = require("./services/openAI/getCompletion")
const Redis = require("ioredis")
const app = express()

//Initialize client.
const redisClient = new Redis({
  host: 'redis-11258.c281.us-east-1-2.ec2.cloud.redislabs.com',
  port: 11258,
  password: config.redisStoreSecret,
  // tls: {
  //   rejectUnauthorized: false
  // }
})
  .on("error", console.error)
  .on("connect", () => console.log("Redis client connected"))
  .on("ready", () => console.log("Redis client ready"))
  .on("reconnecting", () => console.log("Redis client reconnecting"))
  .on("end", () => console.log("Redis client disconnected"))

  

// Initialize client.
// const redisClient = new Redis()
//   .on("error", console.error)
//   .on("connect", () => console.log("Redis client connected"))
//   .on("ready", () => console.log("Redis client ready"))
//   .on("reconnecting", () => console.log("Redis client reconnecting"))
//   .on("end", () => console.log("Redis client disconnected"))


// // Initialize client.
// const redisClient = new Redis(process.env.REDIS_URL)
// .on("error", console.error)
// .on("connect", () => console.log("Redis client connected"))
// .on("ready", () => console.log("Redis client ready"))
// .on("reconnecting", () => console.log("Redis client reconnecting"))
// .on("end", () => console.log("Redis client disconnected"))


// Log response status, request method and url
app.use(({ method, url }, rsp, next) => {
  rsp.on("finish", () => {
    console.log(`${rsp.statusCode} ${method} ${url}`)
  })
  next()
})

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Parse application/json. Verify that callback came from Facebook
app.use(bodyParser.json({ verify: verifyRequestSignature}))

// Check if all environment variables are set
config.checkEnvVariables()

//Initialise some environnpment variables
const port = config.port
const token = config.metaVerifyToken

// Webhook setup
app.get('/webhook', function(req, res) {
  if (
    req.query['hub.mode'] == 'subscribe' &&
    req.query['hub.verify_token'] == token
  ) {
    console.log("WEB_HOOK VERIFIED")
    res.status(200).send(req.query['hub.challenge'])
  } else {
    res.status(403).send("Forbidden")
  }
})

// Message handler
// Accepts POST requests at /webhook endpoint
app.post('/webhook', async (req, res) => {
  // Check the Incoming webhook message
console.log(JSON.stringify(req.body, null, 2))

// info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
if (req.body.object) {
  // if (
  //   req.body.entry &&
  //   req.body.entry[0].changes &&
  //   req.body.entry[0].changes[0] &&
  //   req.body.entry[0].changes[0].value.messages &&
  //   req.body.entry[0].changes[0].value.messages[0] &&
  //   !req.body.entry[0].changes[0].value.messages[0].context &&
  //   !req.body.entry[0].changes[0].value.messages[0].referral
  // ) {

  //     // Extract the sender's phone number from the webhook payload
  //     let from = req.body.entry[0].changes[0].value.messages[0].from
  //     // Extract the message text from the webhook payload
  //     let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body

  //     // The session data
  //     let sessData = {}

  //     try {
  //       // Check for the from phone number object existence
  //       const fromExists = await redisClient.exists(from)

  //       if (!fromExists) {
  //         // Create the openai assistant in Redis
  //         sessData.assistant = await createAssistant()
  //         // Create the openai thread in Redis
  //         sessData.thread = await createThread()

  //         // Serialize object and set expiration time to 1 hour
  //         await redisClient.set(from, JSON.stringify(sessData), 'EX', 60*60); 
  //         console.log(`Object created ${sessData}`)

  //       } else {
  //         // Retrieve existing object
  //         sessData = JSON.parse(await redisClient.get(from))
  //       }

  //       // Send the message to openai for processing
  //       getCompletion(sessData, msg_body)
  //       .then(msg => {
  //         console.log("Got a response from Openai bot: ", msg)
  //         // Send the message to the user
  //         whatsappMessage(from, msg)
  //       })
  //       .catch(err => {
  //         console.error(
  //           "Got an error from Openai bot: ",
  //           err.stack || err
  //         )
  //       })

  //     }catch (error) {
  //         console.error('Redis error:', error)
  //         res.status(500).json({ message: 'Internal server error' })
  //     }
  //      // Return a '200 OK' response to all requests
  //     res.status(200).send("EVENT_RECEIVED") 
  //   }else {
  //     // Return a '204 No content for these request' if event is not a direct WhatsApp business account API text message
  //     res.sendStatus(204)
  //   }

  //TESTING starts here
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages
    ) {
      // Extract the sender's phone number from the webhook payload
      let from = req.body.entry[0].changes[0].value.messages[0].from
      // Extract the message text from the webhook payload
      let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body || 'Sorry, we only support text messages for now.\uD83D\uDE0A'

      // The session data
      let sessData = {}

      try {
        // Check for the from phone number object existence
        const fromExists = await redisClient.exists(from)

        if (!fromExists) {
          // Create the openai assistant in Redis
          sessData.assistant = await createAssistant()
          // Create the openai thread in Redis
          sessData.thread = await createThread()

          // Serialize object and set expiration time to 1 hour
          await redisClient.set(from, JSON.stringify(sessData), 'EX', 60*60); 
          console.log(`Object created ${sessData}`)

        } else {
          // Retrieve existing object
          sessData = JSON.parse(await redisClient.get(from))
        }

        // Send the message to openai for processing
        getCompletion(sessData, msg_body)
        .then(msg => {
          console.log("Got a response from Openai bot: ", msg)
          // Send the message to the user
          whatsappMessage(from, msg)
        })
        .catch(err => {
          console.error(
            "Got an error from Openai bot: ",
            err.stack || err
          )
        })

      }catch (error) {
          console.error('Redis error:', error)
          res.status(500).json({ message: 'Internal server error' })
      }
      // Return a '200 OK' response to all requests
      res.status(200).send("EVENT_RECEIVED") 
    } else {
        // Return a '204 No content for these request' if event is not a direct WhatsApp business account API text message
        res.sendStatus(204)
    }
  //TESTING ends here
} else {
  // Return a '404 Not Found' if event is not from a WhatsApp API
  res.sendStatus(404)
}
})
        
app.listen(port, ()=>{
    console.log(`Server listening on port ${port}...`)
})

  
            
        



