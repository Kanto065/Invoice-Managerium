const allowedOrigins = [
  "https://nanuvaierrosonakothon.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:4000",
  // Add any other origins you need to allow
];

const corsOption = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman, direct browser access)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      // For development, allow all origins
      callback(null, true);
      // For production, uncomment the line below:
      // callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400, // 24 hours
};

module.exports = corsOption;
