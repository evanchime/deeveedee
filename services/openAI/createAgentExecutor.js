const { AgentExecutor, createOpenAIFunctionsAgent, AgentStep } = require("langchain/agents");

/**
 * Creates an AgentExecutor instance.
 * @returns {Promise<AgentExecutor>} The created AgentExecutor instance.
 */
const createAgentExecutor = async (llm, tools, prompt, memory) => {
  // Create an agent using the createOpenAIFunctionsAgent function
  try {
    
    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt,
    });
    // Create a new instance of AgentExecutor with the agent, tools, and memory
    const agentExecutor = AgentExecutor.fromAgentAndTools({
      agent: agent,
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

module.exports = {createAgentExecutor};
    