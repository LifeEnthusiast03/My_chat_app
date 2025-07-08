import { z } from 'zod'

const registerSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username cannot exceed 20 characters" }) // Match your User model
    .trim()
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(1, { message: "Email is required" })
    .max(255, { message: "Email must not be more than 255 characters" })
    .email({ message: "Please enter a valid email address" }),
  
  password: z
    .string({ required_error: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" }) // Match your User model
    .max(1024, { message: "Password must not be more than 1024 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
    })
});

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
  
  password: z
    .string({ required_error: "Password is required" })
    .min(1, { message: "Password is required" })
});

// Alternative: Login with email OR username
const loginWithUsernameSchema = z.object({
  identifier: z
    .string({ required_error: "Email or username is required" })
    .trim()
    .min(1, { message: "Email or username is required" }),
  
  password: z
    .string({ required_error: "Password is required" })
    .min(1, { message: "Password is required" })
});

export { registerSchema, loginSchema, loginWithUsernameSchema }