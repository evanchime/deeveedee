const { BufferMemory } = require("langchain/memory");
const { RedisChatMessageHistory } = require("@langchain/community/stores/message/ioredis");

/**
 * BufferMemory instance for storing chat history.
 * @type {BufferMemory}
*/

const createConversationBufferMemory = async (client, from) => {
    try {
        return new BufferMemory({ 
            chatHistory: new RedisChatMessageHistory({
                sessionId: from,
                sessionTTL: 1500,
                client,
            }),
            returnMessages:true, 
            memoryKey: "chat_history", 
            inputKey: "input", 
            outputKey: "output"
        });
    }catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

module.exports = { createConversationBufferMemory };




