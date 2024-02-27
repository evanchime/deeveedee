const config = require('../config');
const context = require('./context'); 
const { ChatOpenAI } = require("@langchain/openai");
const { orderDetailsOpenAIFunction, tools } = require("./schemas");
const { BufferMemory } = require("langchain/memory");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
// const { DynamicStructuredTool } = require("@langchain/core/tools");
// const { convertToOpenAIFunction } = require("@langchain/core/utils/function_calling");
const { AgentExecutor, createOpenAIFunctionsAgent, AgentStep } = require("langchain/agents");
// const {zodToJsonSchema} = require("zod-to-json-schema");
// const {z} = require("zod");
// const { RunnableSequence } = require("@langchain/core/runnables");
// const { formatToOpenAIFunctionMessages } = require("langchain/agents/format_scratchpad");
// const { OpenAIFunctionsAgentOutputParser } = require("langchain/agents/openai/output_parser");
// const { zodToJsonSchema } = require("zod-to-json-schema");
// const { z } = require("zod");

// Remove the unused variable 'chatModel'
// const chatModel = new ChatOpenAI({
//   openAIApiKey: config.openaiApiKey
// });

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

// Bind the model with the defined functions, including the orderTool and orderDetailsOpenAIFunction
// const llm = llm.bind({
//   functions: [orderDetailsOpenAIFunction]
//   // functions: [convertToOpenAIFunction(orderTool), orderDetailsOpenAIFunction],
// })

/**
 * BufferMemory instance for storing chat history.
 * @type {BufferMemory}
*/
const memory = new BufferMemory({ returnMessages:true, memoryKey: "chat_history" });

/**
 * Creates an AgentExecutor instance.
 * @returns {Promise<AgentExecutor>} The created AgentExecutor instance.
 */
const createAgentExecutor = async () => {
  // Create an agent using the createOpenAIFunctionsAgent function
  try {
    
    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    });
    // Create a new instance of AgentExecutor with the agent, tools, and memory
    const agentExecutor = AgentExecutor.fromAgentAndTools({
      agent,
      tools,
      memory,
      returnIntermediateSteps: true,
    });
    return agentExecutor;

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
    

// // Function to get completion from the agentExecutor
// const getCompletionApp = async (sessData, text) => {
//   try {
//     return await sessData.agentExecutor.invoke({ input: text });
//   } catch (error) {
//     console.error('Error:', error);
//     throw error;
//   }
// }
    

module.exports = { createAgentExecutor};















// const runnableAgent = RunnableSequence.from([
//   {
//     input: (i) => i.input,
//     agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
//   },
//   prompt,
//   modelWithFunctions,
//   new OpenAIFunctionsAgentOutputParser(),
// ]);

// const executor = AgentExecutor.fromAgentAndTools({
//   agent: runnableAgent,
//   tools,
//   memory
// });









