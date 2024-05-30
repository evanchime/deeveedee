const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const context = require('./context'); 

// Create a memory prompt template with system, user, and agent messages
const prompt = ChatPromptTemplate.fromMessages([
  ["system", context.orderBot],
  new MessagesPlaceholder("chat_history"),
  ["user", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

// Set the input variables for the memory prompt
prompt.inputVariables = ["chat_history", "input", "agent_scratchpad"];

module.exports = prompt;