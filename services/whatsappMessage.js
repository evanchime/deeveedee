// Send message to the Facebook Page using the Send API
// See the Send API reference

const config = require("./config")

// https://developers.facebook.com/docs/messenger-platform/send-api-reference
whatsappMessage = async (from, text) => { 
    try { 
        const qs = "access_token=" + encodeURIComponent(config.whatsappToken)
        const url = config.apiUrl + `/${config.whatsappPhoneNumberID}/messages?` + qs
        const response = await fetch(url, { 
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            }, 
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: from,
                text: { 
                    body: text
                }
            })
        });

        if (!response.ok) { 
            throw new Error("Network response was not OK")
        }
        return response.json()
    } catch (error) { 
        throw new Error("There has been a problem with your fetch operation:", error)
    } 
}

module.exports = whatsappMessage


