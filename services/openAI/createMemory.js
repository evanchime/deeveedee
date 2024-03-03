const { RedisChatMessageHistory } = require("@langchain/community/stores/message/ioredis");
const { BufferMemory, ChatMessageHistory } = require("langchain/memory");

/**
 * Create BufferMemory instance for storing chat history.
 * @type {BufferMemory}
*/
const createMemory = async (sessionId, client, sessionTTL, chatHistory = []) => {
    try {
        if (chatHistory.length === 0) {
            chatHistory = new RedisChatMessageHistory({
                sessionId: sessionId,
                sessionTTL: sessionTTL,
                client: client,
            });
        } else {
            chatHistory = new ChatMessageHistory(chatHistory);
        }
        return new BufferMemory({ 
            chatHistory: chatHistory,
            returnMessages:true, 
            memoryKey: "chat_history", 
            inputKey: "input", 
            outputKey: "output"
        });
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
        
    }
}

module.exports = { createMemory};

