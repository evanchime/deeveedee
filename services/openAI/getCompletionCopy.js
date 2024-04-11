const OpenAI = require('openai')
const config = require('../config')
const context = require('./context')
const from = require('../../indexCopy')
const whatsAppmessage = require('../whatsappMessage')
const openai = new OpenAI({
    apiKey: config.openaiApiKey
})

const getCompletion = async (sessData, text) => {

    //If the user sends a message that is not text, return the default message
    if (text === "Sorry, we only support text messages for now.\uD83D\uDE0A") {
        return "Sorry, we only support text messages for now.\uD83D\uDE0A"
        
    } else {//Otherwise, send the message to OpenAI for processing
        await openai.beta.threads.messages.create(
            sessData.thread.id,
            { role: "user", content: text }
        )
        //openai.beta.threads.createAndRunStream(sessData.thread.id,
        //     { assistant_id: sessData.assistant.id });
    
        // let run = await openai.beta.threads.runs.create(
        //     sessData.thread.id,
        //     { assistant_id: sessData.assistant.id }
        // )
    
        // const run = openai.beta.threads.runs
        // .stream(sessData.thread.id, {
        //     assistant_id: sessData.assistant.id,
        // })
        // // .on('messageCreated', (message) => {whatsAppmessage(sessData.from, message.content.text)})
        // // .on('messageDelta', (delta, snapshot) => {whatsAppmessage(sessData.from, delta.value.text)})
        // // .on('messageDone', (message: Message) => ...)

        const run = openai.beta.threads.runs
        .createAndStream(sessData.thread.id, {
            assistant_id: sessData.assistant.id,
        })
        .on('textCreated', (text) => process.stdout.write('\nassistant > '))
        .on('textDelta', (textDelta, snapshot) => process.stdout.write(textDelta.value))
        // const result = await run.finalRun();
        // console.log('Run Result' + result);

        // const stream = await openai.beta.threads.runs.create(
        //     sessData.thread.id,
        //     { 
        //         assistant_id: sessData.assistant.id,
        //         stream: true
        //     }
        // )

        // for await (const event of stream) {
        //     console.log(event)
        //     if (event.event === 'thread.message.delta') {
        //         console.log("we have it")
        //       const chunk = event.data.delta.content?.[0];
        //       if (chunk && 'text' in chunk && chunk.text.value) {
        //         whatsAppmessage(from, chunk.text.value);
        //       }
        //     }
        // }
    }
}

const createAssistant = async () => {
    try {
        // Create an assistant with the specified parameters
        const assistant = await openai.beta.assistants.create({
            name: "Helpful Assistant",
            instructions: context.helpfulAssistant,
            model: "gpt-4-turbo-preview",
            // tools: [{type: "function", function: generateOrderDetailsObjectFunctionJson}],
        })
        return assistant
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

const createThread = async () => {
    try {
        // Create a new thread
        const thread = await openai.beta.threads.create()
        return thread 
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}



// const generateOrderDetailsObjectFunctionJson = {
//     "name": "generateOrderDetailsObject",
//     "description": "Generates a detailed Node.js object specifically designed for order processing. This object uses order details as its properties. \
// Input is a json summary of the order.",
//     "parameters": {
//         "type": "object",
//         "properties":{
//             "orderDetails":{
//                 "type": "object",
//                 "properties": {
//                     "reference_id": {
//                         "type": "string",
//                         "description": "Generate unique identifier for the order or invoice, provided by the business. It is case sensitive and cannot be an empty string and can only contain English letters, numbers, underscores, dashes, or dots, and should not exceed 35 characters."
//                     },
//                     "total_amount": {
//                         "type": "object",
//                         "properties": {
//                             "value": {
//                                 "type": "number",
//                                 "description": "The total amount of the order or invoice. total_amount.value must be equal to subtotal.value + tax.value + shipping.value - discount.value."
//                             }
//                         },
//                         "description": "The total amount details for the order"
//                     },
//                     "items": {
//                         "type": "array",
//                         "items": {
//                             "type": "object",
//                             "properties": {
//                                 "retailer_id": {
//                                     "type": "string",
//                                     "description": "Generate unique identifier for an item in the order."
//                                 },
//                                 "name": {
//                                     "type": "string",
//                                     "description": "The item's name to be displayed to the user. Cannot exceed 60 characters"
//                                 },
//                                 "amount": {
//                                     "type": "object",
//                                     "properties": {
//                                         "value": {
//                                             "type": "number",
//                                             "description": "The price per item in the order."
//                                         }
//                                     },
//                                     "description": "The amount details per item of the order"
//                                 },
//                                 "sale_amount": {
//                                     "type": "object",
//                                     "properties": {
//                                         "value": {
//                                             "type": "number",
//                                             "description": "The discounted price per item. This should be less than the original amount. If included, this field is used to calculate the subtotal amount"
//                                         }
//                                     },
//                                     "description": "The sale amount details for the item"
//                                 },
//                                 "quantity": {
//                                     "type": "number",
//                                     "description": "The number of this item in the order, this field cannot be decimal has to be integer."
//                                 }
//                             },
//                             "required": ["retailer_id", "name", "amount", "quantity"]
//                         },
//                         "description": "The list of items for this order."
//                     },
//                     "subtotal": {
//                         "type": "object",
//                         "properties": {
//                             "value": {
//                                 "type": "number",
//                                 "description": "The value must be equal to sum of (amount per item multiplied by quantity per item)"
//                             }
//                         },
//                         "description": "The subtotal details for the order"
//                     },
//                     "tax": {
//                         "type": "object",
//                         "properties": {
//                             "value": {
//                                 "type": "number",
//                                 "description": "The tax amount for the order."
//                             },
//                             "description": {
//                                 "type": "string",
//                                 "description": "The description of the tax. It cannot exceed 60 characters."
//                             },
//                         },
//                         "required": ["value"],
//                         "description": "The tax details for the order"
//                     },
//                     "shipping": {
//                         "type": "object",
//                         "properties": {
//                             "value": {
//                                 "type": "number",
//                                 "description": "The shipping cost for the order."
//                             },
//                             "description": {
//                                 "type": "string",
//                                 "description": "The description of the shipping cost. It cannot exceed 60 characters."
//                             },
//                         },
//                         "required": ["value"],
//                         "description": "The shipping details for the order"
//                     },
//                     "discount": {
//                         "type": "object",
//                         "properties": {
//                             "value": {
//                                 "type": "number",
//                                 "description": "The discount amount for the order."
//                             },
//                             "description": {
//                                 "type": "string",
//                                 "description": "The description of the discount. It cannot exceed 60 characters."
//                             },
//                             "discount_program_name": {
//                                 "type": "string",
//                                 "description": "Text used for defining incentivised orders. If order is incentivised, define this information. Max character limit is 60 characters"
//                             },
//                         },
//                         "required": ["value"],
//                         "description": "The discount details for the order"
//                     },
//                 },
//                 "required": ["reference_id", "total_amount", "items", "subtotal"]
//             },
//         },
//         "description": "The order details to be processed.",
//         "required": ["orderDetails"]
//     }
// }
        

// const generateOrderDetailsObject = async (orderDetails/**{
//     reference_id,
//     total_amount: { value },
//     items,
//     subtotal: { value: subtotalValue },
//     tax: { value: taxValue, description: taxDescription },
//     shipping: { value: shippingValue, description: shippingDescription },
//     discount: { value: discountValue, description: discountDescription, discount_program_name }
// }*/) => {
//     /**const orderdetails = {
//         reference_id: reference_id,
//         total_amount: { value: value },
//         items: items,
//         subtotal: { value: subtotalValue },
//         tax: { value: taxValue, description: taxDescription },
//         shipping: { value: shippingValue, description: shippingDescription },
//         discount: { value: discountValue, description: discountDescription, discount_program_name }
//     }
//     console.log(orderdetails);*/
//     console.log(`this is ${from}`)
//     return orderDetails
//     // console.log(orderDetails);
// }

// const availableTools = {
//     generateOrderDetailsObject,
// };


module.exports = { 
    getCompletion, 
    createAssistant, 
    createThread,
    // generateOrderDetailsObject,
    // generateOrderDetailsObjectFunctionJson
}

