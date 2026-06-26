import { z } from "zod";
import { IdCardType, DocumentType } from "@prisma/client";

export const idCardSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(IdCardType),
  label: z.string().max(60).optional(),
  cardNumber: z.string().max(60).optional(),
  issuingAuthority: z.string().max(80).optional(),
  expiryDate: z.string().optional(),
  notes: z.string().max(300).optional(),
  frontImagePath: z.string().optional(),
  backImagePath: z.string().optional(),
});

export type IdCardValues = z.infer<typeof idCardSchema>;

export const documentSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(DocumentType),
  title: z.string().min(2).max(80),
  documentDate: z.string().optional(),
  notes: z.string().max(300).optional(),
  filePath: z.string().optional(),
});

export type DocumentValues = z.infer<typeof documentSchema>;
