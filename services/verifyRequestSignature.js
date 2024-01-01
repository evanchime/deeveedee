const config = require("./config")
const crypto = require("crypto")

/*
 * Verify that the callback came from Whatsapp Business Platform. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
verifyRequestSignature = (req, res, buf) => {
  var signature = req.headers["x-hub-signature-256"]

  if (!signature) {
    // throw new Error(`Couldn't find "x-hub-signature" in headers.`)
    console.warn(`Couldn't find "x-hub-signature-256" in headers.`)
  } else {
    var elements = signature.split("=")
    var signatureHash = elements[1]
    var expectedHash = crypto
    .createHmac("sha256", config.whatsappAppSecret)
    .update(buf)
    .digest("hex")
    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.")
    }
  }
}

module.exports = verifyRequestSignature

