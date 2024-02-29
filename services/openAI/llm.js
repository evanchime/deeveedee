const { ChatOpenAI } = require("@langchain/openai");
const { orderDetailsOpenAIFunction, tools } = require("./schemas");

// Create a new instance of ChatOpenAI with the model name "gpt-4-turbo-preview" and temperature set to 0
const llm = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0,
    functions: [orderDetailsOpenAIFunction],
});

module.exports = llm;