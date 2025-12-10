const { db, users } = require("../config/drizzleClient");
const { eq } = require("drizzle-orm");
const bcrypt = require("bcryptjs");

const createUser = async (userData) => {
  const { email, password, name, role, specialization, phone, status } =
    userData;

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
    .values({
      email: email,
      password: hashedPassword,
      name: name,
      role: role || "technician",
      specialization: specialization || null,
      phone: phone || null,
      status: status || "active",
    })
    .returning();

  const newUser = Array.isArray(inserted) ? inserted[0] : inserted;
  if (newUser && newUser.password) delete newUser.password;
  return newUser;
};

const validateLogin = async (email, password) => {
  const existingRows = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  const user = existingRows && existingRows.length > 0 ? existingRows[0] : null;

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Update status and last_login
  await db
    .update(users)
    .set({
      last_login: new Date(),
      status: "active",
    })
    .where(eq(users.id, user.id));

  if (user.password) delete user.password;
  user.status = "active"; // reflect in returned object
  return user;
};

const logout = async (userId) => {
  await db
    .update(users)
    .set({ status: "inactive" })
    .where(eq(users.id, userId));
};

const getUserProfile = async (userId) => {
  // Explicitly selecting columns is cleaner, but with Drizzle query builder
  // we can also select all and delete password.
  // Ideally, use .select({ ... }) to pick columns if Drizzle version supports partial select easily
  // For simplicity with this setup, we'll fetch and clean.
  const existingRows = await db.select().from(users).where(eq(users.id, userId));
  const user = existingRows && existingRows.length > 0 ? existingRows[0] : null;

  if (!user) {
    throw new Error("User not found");
  }

  if (user.password) delete user.password;
  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const existingRows = await db.select().from(users).where(eq(users.id, userId));
  const user = existingRows && existingRows.length > 0 ? existingRows[0] : null;

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Incorrect current password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      updated_at: new Date(),
    })
    .where(eq(users.id, userId));
};

module.exports = {
  createUser,
  validateLogin,
  logout,
  getUserProfile,
  changePassword,
};
