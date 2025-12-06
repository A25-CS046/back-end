const axios = require("axios");

const invokeCopilotChat = async (chatRequest) => {
  const response = await axios.post(
    `${process.env.ML_URL}/copilot/chat`,
    chatRequest
  );
  return response.data;
};

module.exports = {
  invokeCopilotChat,
};
