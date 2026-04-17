const { default: zod } = require("zod");

const fileSchema = zod.object({
  fieldname: zod.string(),
  originalname: zod.string(),
  mimetype: zod.enum(["image/jpeg", "image/png"]),
  size: zod
    .number()
    .max(2 * 1024 * 1024, "Each image must not be greater than 2MB!"),
});
const createUserSchema = zod.object({
  name: zod
    .string("Name must be a string!")
    .trim()
    .nonempty("Name is required!")
    .max(30, "Name length maximum 30 character!"),

  email: zod.email("Invalid email!").trim().nonempty("Email is required!"),

  password: zod
    .string("Password must be a string!")
    .nonempty("Password is required!")
    .min(8, "Password must be at least 8 character!"),

  phone: zod
    .string("Phone number must be a string!")
    .nonempty("Phone number is required!")
    .regex(
      /^(01)[0-9]{9}$/,
      "Phone number must be 11 digits and start with 01!"
    ),
});

const loginUserSchema = zod.object({
  email: zod.email("Invalid email!").trim().nonempty("Email is required!"),
  password: zod
    .string("Password must be a string!")
    .trim()
    .nonempty("Password is required!"),
});

const updateUserProfileSchema = zod.object({
  name: zod.string("Name must be a string!").trim().optional(),
  phone: zod
    .string("Phone number must be a string!")
    .trim()
    .refine((val) => val === "" || /^(01)[0-9]{9}$/.test(val), {
      message: "Invalid phone number!",
    })
    .optional(),
  avatar: zod.instanceof(fileSchema).optional(),
  bio: zod.string("Bio must be a string!").trim().optional(),
  businessName: zod.string("Business name must be a string!").trim().optional(),
  contactNumber: zod.string("Contact number must be a string!").trim().optional(),
  address: zod
    .object({
      address_line1: zod.string().trim().optional(),
      address_line2: zod.string().trim().optional(),
      city: zod.string().trim().optional(),
      state: zod.string().trim().optional(),
      postal_code: zod.string().trim().optional(),
      country: zod.string().trim().optional(),
    })
    .optional(),
  socialLinks: zod
    .object({
      facebook: zod.string().trim().optional(),
      instagram: zod.string().trim().optional(),
      twitter: zod.string().trim().optional(),
      linkedin: zod.string().trim().optional(),
    })
    .optional(),
});

const updateUserPasswordSchema = zod.object({
  oldPassword: zod
    .string("Old password must be a string!")
    .trim()
    .nonempty("Old password is required!")
    .min(8, "Old password must be at least 8 character!"),
  newPassword: zod
    .string("New password must be a string!")
    .trim()
    .nonempty("New password is required!")
    .min(8, "New password must be at least 8 character!"),
  confirmPassword: zod
    .string("Confirm password must be a string!")
    .trim()
    .nonempty("Confirm password is required!")
    .min(8, "Confirm password must be at least 8 character!"),
});

const formgetPasswordSchema = zod.object({
  email: zod.email("Invalid email!").trim().nonempty("Email is required!"),
});

const verifyOtpSchema = zod.object({
  otp: zod
    .string()
    .length(4, "OTP must be exactly 4 digits!")
    .nonempty("OTP is required!"),
});

const resetUserPasswordSchema = zod.object({
  otp: zod
    .string()
    .length(4, "OTP must be exactly 4 digits!")
    .nonempty("OTP is required!"),
  newPassword: zod
    .string()
    .min(8, "New password must be at least 8 character!")
    .nonempty("New password is required!"),
  confirmPassword: zod
    .string()
    .min(8, "Confirm password must be at least 8 character!")
    .nonempty("Confirm password is required!"),
});

const blockUnblockUserSchema = zod.object({
  status: zod.enum(["active", "inactive"], "Invalid status!"),
});

module.exports = {
  createUserSchema,
  loginUserSchema,
  updateUserProfileSchema,
  updateUserPasswordSchema,
  formgetPasswordSchema,
  verifyOtpSchema,
  resetUserPasswordSchema,
  blockUnblockUserSchema,
};
