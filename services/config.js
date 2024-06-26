/**
 * DeeVeeDee bot. Messenger OpenAI bot For "E Dey Play E Dey Show" Facebook Page
 */

"use strict"

// Use dotenv to read .env vars into Node
require("dotenv").config()

// Required environment variables
const ENV_VARS = [
  "WHATSAPP_TOKEN",
  "OPENAI_API_KEY",
  "WHATSAPP_APP_SECRET",
  "META_VERIFY_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "SESSION_SECRET",
  "REDIS_URL",
  "LANGSMITH_API_KEY",
];

module.exports = {
  // Messenger Platform API
  apiDomain: "https://graph.facebook.com",
  apiVersion: "v18.0",

  // Page and Application information
  whatsappToken: process.env.WHATSAPP_TOKEN,
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET,
  metaVerifyToken: process.env.META_VERIFY_TOKEN,
  openaiApiKey: process.env.OPENAI_API_KEY,
  whatsappPhoneNumberID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  sessSecret: process.env.SESSION_SECRET,
  redisUrl: process.env.REDIS_URL,
  langsmithApiKey: process.env.LANGSMITH_API_KEY,

  // Preferred port (default to 3000)
  port: process.env.PORT || 3000,

  // Base URL for Messenger Platform API calls
  get apiUrl() {
    return `${this.apiDomain}/${this.apiVersion}`;
  },

  // URL of your webhook endpoint
  get webhookUrl() {
    return `${this.apiUrl}/webbook`;
  },
  

  checkEnvVariables: () => {
    ENV_VARS.forEach((key) => {
      if (!process.env[key]) {
        console.warn("WARNING: Missing the environment variable " + key);
      } 
    });
  }
};