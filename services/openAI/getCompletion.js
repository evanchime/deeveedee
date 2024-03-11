const OpenAI = require('openai')
const config = require('../config')
const context = require('./context')

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
    
        let run = await openai.beta.threads.runs.create(
            sessData.thread.id,
            { assistant_id: sessData.assistant.id }
        )
    
        while (run.status !== "completed") {

            if (run.status === "requires_action") {

                const toolOutputs = []
                run.required_action.submit_tool_outputs.tool_calls.forEach(async (tool_call) => {
                    const functionToCall = tool_call.function.name
                    const functionArgs = JSON.parse(tool_call.function.arguments)
                    const functionArgsArr = Object.values(functionArgs)
                    const functionResponse = await functionToCall.apply(null, functionArgsArr)
                    toolOutputs.push({ tool_call_id: tool_call.id, output: JSON.stringify(functionResponse) })
                });
                run = await openai.beta.threads.runs.submitToolOutputs(
                    sessData.thread.id,
                    run.id,
                    {
                        tool_outputs: toolOutputs
                    }
                    );
                    
                continue

            }else{
                
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 1/2 second
                run = await openai.beta.threads.runs.retrieve(sessData.thread.id, run.id)
            
            }
        }
        
            
        const messages = await openai.beta.threads.messages.list(sessData.thread.id)
        const assistantResponse = messages.data.find(msg => msg.role === "assistant")
    
        return assistantResponse.content[0].text.value
    }
}

const createAssistant = async () => {
    try {
        // Create an assistant with the specified parameters
        const assistant = await openai.beta.assistants.create({
            name: "Helpful Assistant",
            instructions: context.orderBot,
            model: "gpt-4-turbo-preview",
            tools: [{type: "function", function: "generateOrderDetailsObjectFunctionJson"}],
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

const generateOrderDetailsObjectFunctionJson = {
    "name": "generateOrderDetailsObject",
    "description": "Generates a detailed Node.js object specifically designed for order processing. This object uses order details as its properties. \
Input is a json summary of the order.",
    "parameters": {
        "type": "object",
        "properties": {
            "reference_id": {
                "type": "string",
                "description": "Generate unique identifier for the order or invoice, provided by the business. It is case sensitive and cannot be an empty string and can only contain English letters, numbers, underscores, dashes, or dots, and should not exceed 35 characters."
            },
            "total_amount": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "number",
                        "description": "The total amount of the order or invoice. total_amount.value must be equal to subtotal.value + tax.value + shipping.value - discount.value."
                    }
                },
                "description": "The total amount details for the order"
            },
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "retailer_id": {
                            "type": "string",
                            "description": "Generate unique identifier for an item in the order."
                        },
                        "name": {
                            "type": "string",
                            "description": "The item's name to be displayed to the user. Cannot exceed 60 characters"
                        },
                        "amount": {
                            "type": "object",
                            "properties": {
                                "value": {
                                    "type": "number",
                                    "description": "The price per item in the order."
                                }
                            },
                            "description": "The amount details per item of the order"
                        },
                        "sale_amount": {
                            "type": "object",
                            "properties": {
                                "value": {
                                    "type": "number",
                                    "description": "The discounted price per item. This should be less than the original amount. If included, this field is used to calculate the subtotal amount"
                                }
                            },
                            "description": "The sale amount details for the item"
                        },
                        "quantity": {
                            "type": "number",
                            "description": "The number of this item in the order, this field cannot be decimal has to be integer."
                        }
                    },
                    "required": ["retailer_id", "name", "amount", "quantity"]
                },
                "description": "The list of items for this order."
            },
            "subtotal": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "number",
                        "description": "The value must be equal to sum of (amount per item multiplied by quantity per item)"
                    }
                },
                "description": "The subtotal details for the order"
            },
            "tax": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "number",
                        "description": "The tax amount for the order."
                    },
                    "description": {
                        "type": "string",
                        "description": "The description of the tax. It cannot exceed 60 characters."
                    },
                },
                "required": ["value"],
                "description": "The tax details for the order"
            },
            "shipping": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "number",
                        "description": "The shipping cost for the order."
                    },
                    "description": {
                        "type": "string",
                        "description": "The description of the shipping cost. It cannot exceed 60 characters."
                    },
                },
                "required": ["value"],
                "description": "The shipping details for the order"
            },
            "discount": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "number",
                        "description": "The discount amount for the order."
                    },
                    "description": {
                        "type": "string",
                        "description": "The description of the discount. It cannot exceed 60 characters."
                    },
                    "discount_program_name": {
                        "type": "string",
                        "description": "Text used for defining incentivised orders. If order is incentivised, define this information. Max character limit is 60 characters"
                    },
                },
                "required": ["value"],
                "description": "The discount details for the order"
            },
        },
        "required": ["reference_id", "total_amount", "items", "subtotal"],
    },
}

const generateOrderDetailsObject = async ({
    reference_id,
    total_amount: { value },
    items: items,
    subtotal: { value: subtotalValue },
    tax: { value: taxValue, description: taxDescription },
    shipping: { value: shippingValue, description: shippingDescription },
    discount: { value: discountValue, description: discountDescription, discount_program_name }
}) => {
    const orderdetails = {
        reference_id: reference_id,
        total_amount: { value: value },
        items: items,
        subtotal: { value: subtotalValue },
        tax: { value: taxValue, description: taxDescription },
        shipping: { value: shippingValue, description: shippingDescription },
        discount: { value: discountValue, description: discountDescription, discount_program_name }
    }
    console.log(orderdetails);
}


module.exports = { 
    getCompletion, 
    createAssistant, 
    createThread,
    generateOrderDetailsObject,
    generateOrderDetailsObjectFunctionJson
}

