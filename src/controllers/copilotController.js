const copilotService = require("../services/copilotService");

const handleCopilotChat = async (req, res, next) => {
  try {
    const { messages, session_id, context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages must not be empty" });
    }

    const responses = await copilotService.invokeCopilotChat({
      messages,
      session_id: session_id || "default",
      context: context || {},
    });

    return res.status(200).json(responses);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleCopilotChat,
};
