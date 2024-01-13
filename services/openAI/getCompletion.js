const OpenAI = require('openai')
const config = require('../config')

const openai = new OpenAI({
    apiKey: config.openaiApiKey
})

const getCompletion = async (session, text) => {
    
    // if (!session.sessInfo) {
    //     // Create the assistant for the first time
    //     const assistant = await openai.beta.assistants.create({
    //         name: "Helpful Assistant",
    //         instructions: "You are a helpful assistant.",
    //         model: "gpt-4-1106-preview"
    //     })
    //     // Create the thread for the first time
    //     const thread = await openai.beta.threads.create()
    //     // Store the session
    //     session.sessInfo = {
    //         assistant: assistant,
    //         thread: thread
    //     }
    // }

    await openai.beta.threads.messages.create(
        session.sessInfo.thread.id,
        { role: "user", content: text }
    )

    let run = await openai.beta.threads.runs.create(
        session.sessInfo.thread.id,
        { assistant_id: session.sessInfo.assistant.id }
    )

    while (run.status !== "completed") {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
        run = await openai.beta.threads.runs.retrieve(session.sessInfo.thread.id, run.id)
    }
    
        
    const messages = await openai.beta.threads.messages.list(session.sessInfo.thread.id)
    const assistantResponse = messages.data.find(msg => msg.role === "assistant")

    return assistantResponse.content[0].text.value
}

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


module.exports = { getCompletion, createAssistant, createThread }