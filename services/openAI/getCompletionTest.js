// Function to get completion from the agentExecutor
const getCompletionApp = async (sessData, text) => {
  try {
    return await sessData.agentExecutor.invoke({ input: text });
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

module.exports = {
  getCompletionApp,
};