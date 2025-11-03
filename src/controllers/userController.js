const userService = require("../services/userService");

const createUser = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const newUser = await userService.createUser({ email, password, name });

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
};
