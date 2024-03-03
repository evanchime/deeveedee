const { RedisChatMessageHistory } = require("@langchain/community/stores/message/ioredis");
const config = require('../config');
const context = require('./context'); 
const { ChatOpenAI } = require("@langchain/openai");
const { orderDetailsOpenAIFunction, tools } = require("./schemas");
const { BufferMemory } = require("langchain/memory");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { AgentExecutor, createOpenAIFunctionsAgent, AgentStep } = require("langchain/agents");

// Create a new instance of ChatOpenAI with the model name "gpt-4-turbo-preview" and temperature set to 0
const llm = new ChatOpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0,
  functions: [orderDetailsOpenAIFunction],
});

// Define the memory key for chat history
const MEMORY_KEY = "chat_history";

// Create a memory prompt template with system, user, and agent messages
const prompt = ChatPromptTemplate.fromMessages([
  ["system", context.orderBot],
  new MessagesPlaceholder(MEMORY_KEY),
  ["user", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

// Set the input variables for the memory prompt
prompt.inputVariables = ["chat_history", "input", "agent_scratchpad"];

/**
 * BufferMemory instance for storing chat history.
 * @type {BufferMemory}
*/
const memory = new BufferMemory({ 
      chatHistory: new RedisChatMessageHistory({
        sessionId: 12345,
        sessionTTL: 3000,
        client: redisClient,
    }),
    returnMessages:true, 
    memoryKey: "chat_history", 
    inputKey: "input", 
    outputKey: "output"
});


/**
 * Creates an AgentExecutor instance.
 * @returns {Promise<AgentExecutor>} The created AgentExecutor instance.
 */
const createAgentExecutor = async () => {
  try {

    // Create a new instance of AgentExecutor with the agent, tools, and memory
    const agentExecutor = AgentExecutor.fromAgentAndTools({
      agent: await createOpenAIFunctionsAgent({
        llm,
        tools,
        prompt,
      }),
      tools: tools,
      memory: memory,
      returnIntermediateSteps: true,
    });
    return agentExecutor;

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};


// createAgentExecutor()
// .then(async (agentExecutor) => {const result = await agentExecutor.invoke({ input: "hi"})
// console.log(result.output)})
    

module.exports = { createAgentExecutor};


































