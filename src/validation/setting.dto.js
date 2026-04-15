const { default: zod } = require("zod");

const toggleShutdownSchema = zod.object({
  shutdown: zod.enum(["up", "down"], "Invalid shutdown value"),
});

module.exports = { toggleShutdownSchema };
