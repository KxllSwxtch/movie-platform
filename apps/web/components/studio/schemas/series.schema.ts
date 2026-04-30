import { z } from 'zod';
import { fullMetadataSchema } from './base.schema';

export const episodeItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Episode title is required').max(200),
  description: z.string().max(5000).optional().default(''),
  order: z.number().int().min(1),
});

export const seasonGroupSchema = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  items: z.array(episodeItemSchema).default([]),
});

export const seriesFormSchema = fullMetadataSchema.extend({
  contentType: z.literal('SERIES'),
  seasons: z.array(seasonGroupSchema).default([]),
});

export type EpisodeItem = z.infer<typeof episodeItemSchema>;
export type SeasonGroup = z.infer<typeof seasonGroupSchema>;
export type SeriesFormValues = z.infer<typeof seriesFormSchema>;
