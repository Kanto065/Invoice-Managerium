require("dotenv").config();
const dbConnection = require("./src/config/database.config");

(async () => {
  await dbConnection(); // Wait for DB
  const app = require("./src/app"); // Load express app only after DB is ready
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );

  // Handle server errors
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Please use a different port.`
      );
      process.exit(1);
    } else {
      console.error("Server error:", error);
    }
  });
})();
