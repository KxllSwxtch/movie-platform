'use client';

import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import * as React from 'react';

import { VideoUpload } from '@/components/admin/content/video-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAddEpisode,
  useAddSeason,
  useDeleteEpisode,
  useSeriesStructure,
  useUpdateEpisode,
  type SeriesEpisode,
  type SeriesSeason,
} from '@/hooks/use-series-structure';

interface StructuredContentVideoManagerProps {
  rootContentId: string;
  contentType: 'SERIES' | 'TUTORIAL';
}

interface EpisodeDraft {
  title: string;
  description: string;
}

export function StructuredContentVideoManager({
  rootContentId,
  contentType,
}: StructuredContentVideoManagerProps) {
  const { data: structure, isLoading } = useSeriesStructure(rootContentId);
  const addSeason = useAddSeason(rootContentId);
  const addEpisode = useAddEpisode(rootContentId);
  const updateEpisode = useUpdateEpisode();
  const deleteEpisode = useDeleteEpisode();
  const [episodeDrafts, setEpisodeDrafts] = React.useState<Record<number, EpisodeDraft>>({});
  const [editingEpisodeId, setEditingEpisodeId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState<EpisodeDraft>({ title: '', description: '' });

  const isTutorial = contentType === 'TUTORIAL';
  const itemLabel = isTutorial ? 'урок' : 'серия';
  const itemLabelCapitalized = isTutorial ? 'Урок' : 'Серия';
  const groupLabel = isTutorial ? 'Глава' : 'Сезон';

  const handleAddSeason = React.useCallback(() => {
    const nextNumber = (structure?.seasons?.length ?? 0) + 1;
    addSeason.mutate({
      title: `${groupLabel} ${nextNumber}`,
    });
  }, [addSeason, groupLabel, structure?.seasons?.length]);

  const handleDraftChange = React.useCallback((seasonNumber: number, patch: Partial<EpisodeDraft>) => {
    setEpisodeDrafts((current) => ({
      ...current,
      [seasonNumber]: {
        title: current[seasonNumber]?.title ?? '',
        description: current[seasonNumber]?.description ?? '',
        ...patch,
      },
    }));
  }, []);

  const handleAddEpisode = React.useCallback((season: SeriesSeason) => {
    const draft = episodeDrafts[season.seasonNumber] ?? { title: '', description: '' };
    if (!draft.title.trim()) return;

    addEpisode.mutate(
      {
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        seasonNumber: season.seasonNumber,
      },
      {
        onSuccess: () => {
          setEpisodeDrafts((current) => ({
            ...current,
            [season.seasonNumber]: { title: '', description: '' },
          }));
        },
      }
    );
  }, [addEpisode, episodeDrafts]);

  const startEdit = React.useCallback((episode: SeriesEpisode) => {
    setEditingEpisodeId(episode.contentId);
    setEditDraft({
      title: episode.title,
      description: episode.description ?? '',
    });
  }, []);

  const saveEdit = React.useCallback((episode: SeriesEpisode) => {
    updateEpisode.mutate(
      {
        id: episode.contentId,
        title: editDraft.title.trim(),
        description: editDraft.description.trim(),
      },
      {
        onSuccess: () => {
          setEditingEpisodeId(null);
          setEditDraft({ title: '', description: '' });
        },
      }
    );
  }, [editDraft, updateEpisode]);

  const handleDelete = React.useCallback((episode: SeriesEpisode) => {
    if (!window.confirm(`Удалить "${episode.title}"?`)) return;
    deleteEpisode.mutate(episode.contentId);
  }, [deleteEpisode]);

  if (isLoading) {
    return (
      <Card className="border-[#272b38] bg-[#10131c]/50">
        <CardHeader>
          <CardTitle className="text-lg text-[#f5f7ff]">Структура и видео</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const seasons = structure?.seasons ?? [];

  return (
    <Card className="border-[#272b38] bg-[#10131c]/50">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg text-[#f5f7ff]">Структура и видео</CardTitle>
          <p className="mt-1 text-sm text-[#9ca2bc]">
            Добавляйте {isTutorial ? 'главы и уроки' : 'сезоны и серии'} в любой момент. Видео загружается только на уровне {itemLabel}.
          </p>
        </div>
        <Button type="button" onClick={handleAddSeason} disabled={addSeason.isPending} leftIcon={<Plus />}>
          Добавить {groupLabel.toLowerCase()}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {seasons.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#34394a] bg-[#080b12] p-5 text-sm text-[#9ca2bc]">
            Структура пока пустая. Нажмите «Добавить {groupLabel.toLowerCase()}», затем добавьте {itemLabel}.
          </div>
        )}

        {seasons.map((season) => {
          const draft = episodeDrafts[season.seasonNumber] ?? { title: '', description: '' };

          return (
            <section key={season.id ?? season.seasonNumber} className="space-y-4 rounded-lg border border-[#272b38]/70 bg-[#080b12] p-4">
              <div className="flex flex-col gap-2 border-b border-[#272b38]/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#f5f7ff]">
                    {season.title || `${groupLabel} ${season.seasonNumber}`}
                  </p>
                  <p className="text-xs text-[#9ca2bc]">
                    {season.episodes.length} {isTutorial ? 'уроков' : 'серий'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-md border border-[#272b38]/60 bg-[#10131c]/70 p-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  value={draft.title}
                  onChange={(event) => handleDraftChange(season.seasonNumber, { title: event.target.value })}
                  placeholder={`Название ${itemLabel}`}
                />
                <Input
                  value={draft.description}
                  onChange={(event) => handleDraftChange(season.seasonNumber, { description: event.target.value })}
                  placeholder="Описание"
                />
                <Button
                  type="button"
                  onClick={() => handleAddEpisode(season)}
                  disabled={addEpisode.isPending || !draft.title.trim()}
                  leftIcon={<Plus />}
                >
                  Добавить {itemLabel}
                </Button>
              </div>

              <div className="space-y-4">
                {season.episodes.map((episode) => {
                  const isEditing = editingEpisodeId === episode.contentId;

                  return (
                    <div key={episode.contentId} className="rounded-lg border border-[#272b38]/70 bg-[#0d1018] p-4">
                      {isEditing ? (
                        <div className="mb-4 space-y-3">
                          <Input
                            value={editDraft.title}
                            onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))}
                          />
                          <Textarea
                            value={editDraft.description}
                            onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))}
                            rows={3}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" onClick={() => saveEdit(episode)} disabled={!editDraft.title.trim() || updateEpisode.isPending}>
                              Сохранить
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingEpisodeId(null)}>
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#f5f7ff]">
                              {itemLabelCapitalized} {episode.episodeNumber}: {episode.title}
                            </p>
                            {episode.description && (
                              <p className="mt-1 text-xs text-[#9ca2bc]">{episode.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => startEdit(episode)} aria-label="Редактировать">
                              <PencilSimple className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="destructive" size="icon" onClick={() => handleDelete(episode)} aria-label="Удалить">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <VideoUpload
                        contentId={episode.contentId}
                        label={`Видео ${itemLabel}`}
                        description="MP4, WebM, MOV, MKV до 5GB. После загрузки появится статус обработки."
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                        maxSizeMB={5120}
                        onChange={() => {}}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
