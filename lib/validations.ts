import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const CreateProgramSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  durationHours: z.number().positive().optional(),
  maxParticipants: z.number().int().positive().optional(),
  pricePerPax: z.number().min(0).optional(),
  locationType: z.enum(["onsite", "online", "hybrid"]).optional(),
  syllabus: z.array(z.string()).optional(),
});
