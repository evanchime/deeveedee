"use strict"

const express = require("express")
const bodyParser = require("body-parser")
const config = require("./services/config")
const whatsappMessage = require("./services/whatsappMessage")
const verifyRequestSignature = require("./services/verifyRequestSignature")
const {getCompletion,createAssistant,createThread} = require("./services/openAI/getCompletion")
const session = require("express-session")
 const OpenAI = require('openai')
// const {createAssistant, c = require('./services/openAI/getCompletion')
// const createThread = require('./services/openAI/createThread')

const openai = new OpenAI({
    apiKey: config.openaiApiKey
})
// const MongoDBStore = require('connect-mongodb-session')(session);
const RedisStore = require("connect-redis")(session)
const Redis = require("ioredis")

// Initialize client.
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

  

// // Initialize client.
// const redisClient = new Redis()
//   .on("error", console.error)
//   .on("connect", () => console.log("Redis client connected"))
//   .on("ready", () => console.log("Redis client ready"))
//   .on("reconnecting", () => console.log("Redis client reconnecting"))
//   .on("end", () => console.log("Redis client disconnected"))

// const {createClient} = require("redis")
const app = express()

// // Initialize client.
// const redisClient = createClient({
//   url: process.env.REDIS_URL,
//   socket: {
//     tls: true,
//     rejectUnauthorized: false
//   }
// })
// .on("error", console.error)
// .on("connect", () => console.log("Redis client connected"))
// .on("ready", () => console.log("Redis client ready"))
// .on("reconnecting", () => console.log("Redis client reconnecting"))
// .on("end", () => console.log("Redis client disconnected"))
// .connect()

// for local testing
// let redisClient = createClient() 
// .on("error", console.error)
// .on("connect", () => console.log("Redis client connected"))
// .on("ready", () => console.log("Redis client ready"))
// .on("reconnecting", () => console.log("Redis client reconnecting"))
// .on("end", () => console.log("Redis client disconnected"))
// .connect()


// const redisClient = createClient({
//   username: 'default', // use your Redis user. More info https://redis.io/docs/management/security/acl/
//   password: config.redisStoreSecret, // use your password here
//   socket: {
//     host: 'redis-11258.c281.us-east-1-2.ec2.cloud.redislabs.com',
//     port: 11258
//     // rejectUnauthorized: false

//   }
// })
// .on('error', (err) => console.log('Redis Client Error', err))
// .on("connect", () => console.log("Redis client connected"))
// .on("ready", () => console.log("Redis client ready"))
// .on("reconnecting", () => console.log("Redis client reconnecting"))
// .on("end", () => console.log("Redis client disconnected"))
// .connect()


// redisClient.on('error', (err) => console.log('Redis Client Error', err));

// await redisClient.connect();


// // Initialize store.
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
    cookie: {maxAge: 1800000, path: "/webhook"}, // 30 minutes
  })
)

// Log response status, request method and url
app.use(({ method, url }, rsp, next) => {
  rsp.on("finish", () => {
    console.log(`${rsp.statusCode} ${method} ${url}`)
  })
  next()
})

// app.use((req, res, next) => {
//   if (req.method === "POST" && req.path === "/webhook") {
//     if (!req.session) {
//       console.log("Session is not initialized")
//       return res.status(500).end()
//     }
//     req.session.sessData = req.session.sessData || 1
//     console.log(`this is sessinfo ${req.session.sessData++}`)
//   }
//   next()
// })

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
//DEBUG
//const thisSession = {}

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
  console.log(`this is session ${JSON.stringify(req.session)} `)



  // console.log(` this is this session ${thisSession} `)
  //DEBUG
  //console.log(JSON.stringify(thisSession, null, 2))
  
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
      // // Return a '200 OK' response to all requests
      // res.status(200).send("EVENT_RECEIVED") 

      // Extract the sender's phone number from the webhook payload
      let from = req.body.entry[0].changes[0].value.messages[0].from
      // Extract the message text from the webhook payload
      let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body

      // if (!req.session.sessInfo) {

      //   // Create the assistant for the first time
      //   req.session.sessInfo ={
      //     assistant : null,
      //     thread : null
      //   }
      //   createAssistant().then(assistant => {req.session.sessInfo.assistant = assistant}) 
      //   console.log(`this is assistant ${ req.session.sessInfo.assistant.id}`)
      //   // Create the thread for the first time
      //   createThread().then(thread => {req.session.sessInfo.thread = thread})
      //   console.log(`this is thread ${ req.session.sessInfo.thread.id}`)
      //   // Store the session
      //   // req.session.sessInfo = {
      //   //   assistant : assistant,
      //   //   thread : thread
      //   // }
      // }
        
      
      // if (!req.session.sessInfo[from]) {
        
      //   // Create the assistant for the first time
      //   const assistant = createAssistant()
        
      //   // Create the thread for the first time
      //   const thread = createThread()

      //   // Store the session
      //   req.session.sessInfo[from] = {
      //       assistant: assistant,
      //       thread: thread
      //   }
      // }
      
            
        

      // Send the message to openai for processing
      //DEBUG
      getCompletion(/*thisSession*/req.session, msg_body)
      .then(msg => {
        console.log("Got a response from Openai bot: ", msg)
        console.log(`this is session info ${JSON.stringify(req.session.sessInfo)} `)
        // Send the message to the user
      whatsappMessage(from, msg)
      })
      .catch(err => {
      console.error(
        "Got an error from Openai bot: ",
        err.stack || err
      )
      })
    }
    // Return a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED") 
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404)
  }
})
        
app.listen(port, ()=>{
    console.log(`Server listening on port ${port}...`)
})


