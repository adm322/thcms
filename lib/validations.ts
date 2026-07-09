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

// ── AI endpoints ────────────────────────────────────────────────────────────

export const EnhanceDescriptionSchema = z.object({
  title: z.string().min(1).max(200),
  bulletPoints: z.array(z.string().max(500)).max(20).optional(),
});

export const InsightsSchema = z.object({
  comments: z
    .array(
      z.object({
        participant: z.string().min(1).max(200),
        text: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(1000),
});

export const NeedsAnalysisSchema = z.object({
  responses: z
    .array(
      z.object({
        question: z.string().min(1).max(500),
        answer: z.string().min(1).max(5000),
      })
    )
    .min(1)
    .max(5000),
});

export const QuizGenerateSchema = z.object({
  topic: z.string().min(1).max(200),
  count: z.number().int().min(1).max(20).optional(),
});

// ── Admin write paths ────────────────────────────────────────────────────────

export const BookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "PENDING"]),
  employerHrdfSubmitted: z.boolean().optional(),
  trainerHrdfSubmitted: z.boolean().optional(),
  trainerDocumentsUrl: z.string().url().max(2000).optional(),
});

export const FeatureToggleSchema = z.object({
  id: z.string().min(1).max(64),
  featured: z.boolean().optional(),
});

export const ProposalSchema = z.object({
  proposalUrl: z.string().url().max(2000).nullable().optional(),
  proposalLabel: z.string().max(200).nullable().optional(),
});

// ── HR write paths ───────────────────────────────────────────────────────────

export const LeaveStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
});

export const CreateLeaveSchema = z.object({
  employeeId: z.string().min(1).max(64),
  type: z.string().min(1).max(50),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.number().min(0.5).max(365),
  reason: z.string().max(2000).optional(),
});

export const ReviewSchema = z.object({
  bookingId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  trainerId: z.string().min(1).max(64),
});

// ── Quiz submit ─────────────────────────────────────────────────────────────

export const QuizSubmitSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

// ── Program extract (auto-fill from DOCX/PPTX/PDF) ────────────────────────

export const ProgramModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  durationMins: z.number().int().min(15).max(480),
});

export const ProgramItinerarySchema = z.object({
  type: z.enum(["REGISTRATION", "MEAL", "MODULE", "BREAK", "CLOSING"]),
  title: z.string().min(1).max(200),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
});

export const ProgramDraftSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  category: z.string().min(1).max(50),
  durationHours: z.number().min(1).max(40),
  maxParticipants: z.number().int().min(1).max(100),
  pricePerPax: z.number().min(0).max(100000),
  locationType: z.enum(["onsite", "online", "hybrid"]),
  modules: z.array(ProgramModuleSchema).min(1).max(8),
  itinerary: z.array(ProgramItinerarySchema).max(10).optional(),
  proposalContent: z.string().max(10000).optional(),
});

export const ExtractProgramResponseSchema = z.object({
  draft: ProgramDraftSchema,
  sourceTextLength: z.number().int().min(0),
  detectedFileType: z.enum(["docx", "pptx", "pdf"]),
});
