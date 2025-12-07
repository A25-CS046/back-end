require("dotenv").config();

const app = require("./app");

// Cloud Run uses PORT env variable, default to 8080 for production
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
