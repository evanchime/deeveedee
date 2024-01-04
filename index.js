"use strict"

const express = require("express")
const bodyParser = require("body-parser")
const config = require("./services/config")
const whatsappMessage = require("./services/whatsappMessage")
const verifyRequestSignature = require("./services/verifyRequestSignature")
const getCompletionAssistant = require("./services/openAI/getCompletionAssistant")
const session = require("express-session")
const RedisStore = require("connect-redis").default
const {createClient} = require("redis")
const app = express()

// Initialize client.
let redisClient = createClient({host: process.env.REDIS_URL})
// redisClient.connect().catch(console.error)

// Initialize store.
let redisStore = new RedisStore({
  client: redisClient,
})

// Initialize sesssion storage.
app.use(
  session({
    store: redisStore,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    secret: config.sessSecret,
    cookie: {secure: true, maxAge: 1800000}
  })
)

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

//Create session variable
const thisSession = {}

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
app.post("/webhook", (req, res) => {

  // Log the session id
  console.log(`this is session id ${req.session.id} `)



  // console.log(` this is this session ${thisSession} `)
  console.log(JSON.stringify(thisSession, null, 2))
  
  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2))


  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0] &&
      !req.body.entry[0].changes[0].value.messages[0].context &&
      !req.body.entry[0].changes[0].value.messages[0].referral
    ) {
      // Return a '200 OK' response to all requests
      res.status(200).send("EVENT_RECEIVED") 

      // Extract the sender's phone number from the webhook payload
      let from = req.body.entry[0].changes[0].value.messages[0].from
      // Extract the message text from the webhook payload
      let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body

      // Send the message to openai for processing
      getCompletionAssistant(thisSession, msg_body)
      .then(msg => {
      whatsappMessage(from, msg)
      })
      .catch(err => {
      console.error(
        "Got an error from Openai bot: ",
        err.stack || err
      )
      })
    }
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404)
  }
})
        
app.listen(port, ()=>{
    console.log(`Server listening on port ${port}...`)
})


