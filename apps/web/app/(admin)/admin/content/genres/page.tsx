'use client';

import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { api, endpoints } from '@/lib/api-client';

interface Genre {
  id: string;
  name: string;
  slug: string;
  color: string;
  iconUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  order: number;
}

const emptyForm = {
  name: '',
  slug: '',
  color: '#C94BFF',
  iconUrl: '',
  description: '',
  order: 0,
  isActive: true,
};

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminContentGenresPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);

  const { data: genres = [], isLoading } = useQuery({
    queryKey: ['adminContent', 'genres'],
    queryFn: async () => {
      const response = await api.get<Genre[]>(endpoints.genres.adminList);
      return response.data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        slug: form.slug || makeSlug(form.name),
        iconUrl: form.iconUrl || undefined,
        description: form.description || undefined,
        order: Number(form.order) || 0,
      };

      if (editingId) {
        const response = await api.patch<Genre>(endpoints.genres.update(editingId), payload);
        return response.data;
      }

      const response = await api.post<Genre>(endpoints.genres.create, payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminContent', 'genres'] });
      setEditingId(null);
      setForm(emptyForm);
      toast.success('Жанр сохранён');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.genres.delete(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminContent', 'genres'] });
      toast.success('Жанр удалён');
    },
  });

  const startEdit = (genre: Genre) => {
    setEditingId(genre.id);
    setForm({
      name: genre.name,
      slug: genre.slug,
      color: genre.color,
      iconUrl: genre.iconUrl || '',
      description: genre.description || '',
      order: genre.order,
      isActive: genre.isActive,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mp-text-primary">Жанры</h1>
        <p className="mt-1 text-sm text-mp-text-secondary">
          Управляемая смысловая классификация контента. Партнёры выбирают только активные жанры.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Редактировать жанр' : 'Новый жанр'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-[1fr_1fr_110px_1fr_120px_auto] md:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                  slug: prev.slug ? prev.slug : makeSlug(event.target.value),
                }))
              }
              placeholder="Название"
              required
            />
            <Input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="slug"
              required
            />
            <Input
              value={form.color}
              onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
              placeholder="#C94BFF"
            />
            <Input
              value={form.iconUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, iconUrl: event.target.value }))}
              placeholder="URL иконки"
            />
            <Input
              type="number"
              value={form.order}
              onChange={(event) => setForm((prev) => ({ ...prev, order: Number(event.target.value) }))}
              placeholder="Порядок"
            />
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              />
              <Button type="submit" disabled={saveMutation.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {editingId ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-mp-border">
            {isLoading ? (
              <p className="p-6 text-sm text-mp-text-secondary">Загрузка...</p>
            ) : genres.length === 0 ? (
              <p className="p-6 text-sm text-mp-text-secondary">Жанров пока нет.</p>
            ) : (
              genres.map((genre) => (
                <div key={genre.id} className="grid gap-3 p-4 md:grid-cols-[1fr_120px_120px_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-mp-text-primary">{genre.name}</p>
                    <p className="truncate text-xs text-mp-text-secondary">/{genre.slug}</p>
                  </div>
                  <span className="text-sm text-mp-text-secondary">#{genre.order}</span>
                  <span className={genre.isActive ? 'text-sm text-emerald-400' : 'text-sm text-mp-text-disabled'}>
                    {genre.isActive ? 'Активен' : 'Скрыт'}
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(genre)}>
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(genre.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
