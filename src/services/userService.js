const { db, users } = require("../config/drizzleClient");
const { eq } = require("drizzle-orm");
const bcrypt = require("bcryptjs");

const createUser = async (userData) => {
  const { email, password, name } = userData;

  const existingRows = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  const existingUser =
    existingRows && existingRows.length > 0 ? existingRows[0] : null;

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const inserted = await db
    .insert(users)
    .values({ email: email, password: hashedPassword, name: name })
    .returning();

  const newUser = Array.isArray(inserted) ? inserted[0] : inserted;
  if (newUser && newUser.password) delete newUser.password;
  return newUser;
};

module.exports = {
  createUser,
};
