const { PrismaClient } = require("../generated/prisma");

const prisma = global._prismaClient ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global._prismaClient = prisma;

module.exports = prisma;
