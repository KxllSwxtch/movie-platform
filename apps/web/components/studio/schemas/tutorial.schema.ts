import { z } from 'zod';
import { fullMetadataSchema } from './base.schema';

export const lessonItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Lesson title is required').max(200),
  description: z.string().max(5000).optional().default(''),
  order: z.number().int().min(1),
});

export const chapterGroupSchema = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  items: z.array(lessonItemSchema).default([]),
});

export const tutorialFormSchema = fullMetadataSchema.extend({
  contentType: z.literal('TUTORIAL'),
  chapters: z.array(chapterGroupSchema).default([]),
});

export type LessonItem = z.infer<typeof lessonItemSchema>;
export type ChapterGroup = z.infer<typeof chapterGroupSchema>;
export type TutorialFormValues = z.infer<typeof tutorialFormSchema>;
