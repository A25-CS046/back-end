// Impor Prisma Client, BUKAN userModel
const prisma = require("../config/prismaClient");
const bcrypt = require("bcryptjs");

const createUser = async (userData) => {
  const { email, password, name } = userData;

  const existingUser = await prisma.user.findUnique({
    where: { email: email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      name: name,
    },
  });

  delete newUser.password;
  return newUser;
};

module.exports = {
  createUser,
};
