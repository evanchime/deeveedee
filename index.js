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
    cookie: {secure: true}
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
app.post('/webhook', (req, res)  => {
  // Parse the request body from the POST
  let body = req.body;
  
  // Log the request body and event notification to console
  console.log(`\u{1F7EA} Received webhook:`)
  console.log(JSON.stringify(req.body, null, 2))
  console.dir(body, { depth: null })

  // Process the Whatsapp updates here
  // Check if this is an event from a whatsapp_business_account subscription
  if (body.object === "whatsapp_business_account") {
      // Returns a '200 OK' response to all requests
      res.status(200).send("EVENT_RECEIVED")

      // The sender's id
      let from
      // The message text
      let message

      // Process the message here
      if (body.entry[0].changes[0].value.messages[0].type === "text" && 
          !body.entry[0].changes[0].value.messages[0].referral && 
          !body.entry[0].changes[0].value.messages[0].context) {
              
              // Get the sender's id
              from = body.entry[0].changes[0].value.messages[0].from
              // Extract the message text from the webhook payload
              message = body.entry[0].changes[0].value.messages[0].text.body

              // Send the message to openai
              getCompletionAssistant(thisSession, message)
                  .then(msg => {
                  console.dir(thisSession, {depth: null})
                  whatsappMessage(from, message)
                  })
                  .catch(err => {
                  console.error(
                      "Got an error from Openai bot: ",
                      err.stack || err
                  )
                  })
      }else {
          // We received an event that is not a text message
          // Let's reply with an automatic message
          whatsappMessage(
            from,
            "Sorry I can only process text messages to this number for now."
          ).catch(console.error)
          console.log("received event", JSON.stringify(body))
      }
  }else {
      // Returns a '404 Not Found' if event is not from whatsapp_business_account
      res.sendStatus(404)
  }
})

app.listen(port, ()=>{
    console.log(`Server listening on port ${port}...`)
})

