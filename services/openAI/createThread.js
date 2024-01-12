const OpenAI = require('openai')
const config = require('../config')

const openai = new OpenAI({
    apiKey: config.openaiApiKey
})

const createThread = async () => {
    try {
        // Create a new thread
        const thread = await openai.beta.threads.create()
        return { thread }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

module.exports = createThread