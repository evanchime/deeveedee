const OpenAI = require('openai')
const config = require('../config')

const openai = new OpenAI({
    apiKey: config.openaiApiKey
})

const createAssistant = async () => {
    try {
        // Create an assistant with the specified parameters
        const assistant = await openai.beta.assistants.create({
            name: "Helpful Assistant",
            instructions: "You are a helpful assistant.",
            model: "gpt-4-1106-preview"
        })

        return { assistant };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

module.exports = createAssistant