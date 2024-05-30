const {
  BaseMessage, AIMessage, HumanMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
} = require("@langchain/core/messages");

 /**
   * Retrieves all messages from the chat history.
   * @param client The Redis client to use.
   * @param sessionId The session ID to use.
   * @returns Promise that resolves with an array of BaseMessage instances.
   */
 const getMessages = async (client, sessionId) => {
    try {
      const rawStoredMessages = await client.lrange(sessionId, 0, -1) ?? [];
      const orderedMessages = rawStoredMessages
        .reverse()
        .map((message) => JSON.parse(message));
      return mapStoredMessagesToChatMessages(orderedMessages);
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
}

 /**
   * Adds a message to the chat history.
   * @param message The message to add to the chat history.
   * @param client The Redis client to use.
   * @param sessionId The session ID to use.
   * @param sessionTTL The time-to-live (in seconds) for the session. If not provided, the session will not expire.
   * @returns Promise that resolves when the message has been added.
   */
const addMessage = async (message, client, sessionId, sessionTTL) => {
    try {
      const messageToAdd = mapChatMessagesToStoredMessages([message]);
        await client.lpush(sessionId, JSON.stringify(messageToAdd[0]));
        if (sessionTTL) {
          await client.expire(sessionId, sessionTTL);
        }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
}

  /**
   * Clears all messages from the chat history.
   * @returns Promise that resolves when the chat history has been cleared.
   */
const clear = async (client, sessionId) => { 
  try {
    await client.del(sessionId);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

module.exports = {getMessages, addMessage, clear}