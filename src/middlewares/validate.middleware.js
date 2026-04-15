const { ZodError } = require("zod");

const dtoValidate = (schema) => (req, res, next) => {
  try {
    const dataToValidate = {
      ...req.body,
      images: req.files || [],
      image: req.file || undefined,
      avatar: req.file || undefined,
    };
    req.validatedData = schema.parse(dataToValidate); // or req.query / req.params
    next();
  } catch (error) {
    console.log(error);
    if (error instanceof ZodError) {
      return res.status(400).json({
        errors: error.issues.map((err) => ({
          path: err.path[0],
          message: err.message,
        })),
      });
    }
    // Fallback for unexpected errors
    console.error("Unexpected validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = dtoValidate;
