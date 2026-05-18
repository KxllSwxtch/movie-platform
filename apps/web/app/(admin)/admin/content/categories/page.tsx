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

interface VideoCategory {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  order: number;
  isActive: boolean;
  _count?: { content?: number; children?: number };
}

const emptyForm = {
  name: '',
  slug: '',
  iconUrl: '',
  order: 0,
  isActive: true,
};

export default function AdminVideoCategoriesPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['adminContent', 'categories'],
    queryFn: async () => {
      const response = await api.get<VideoCategory[]>(endpoints.adminContent.categories);
      return response.data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        slug: form.slug || undefined,
        iconUrl: form.iconUrl || undefined,
        order: Number(form.order) || 0,
      };

      if (editingId) {
        const response = await api.patch<VideoCategory>(
          endpoints.adminContent.category(editingId),
          payload,
        );
        return response.data;
      }

      const response = await api.post<VideoCategory>(
        endpoints.adminContent.categories,
        payload,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminContent', 'categories'] });
      setEditingId(null);
      setForm(emptyForm);
      toast.success('Категория сохранена');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.adminContent.category(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminContent', 'categories'] });
      toast.success('Категория удалена');
    },
  });

  const startEdit = (category: VideoCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      iconUrl: category.iconUrl || '',
      order: category.order,
      isActive: category.isActive,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mp-text-primary">Категории видео</h1>
        <p className="mt-1 text-sm text-mp-text-secondary">
          CRUD, иконка, сортировка и управление отображением категорий.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Редактировать категорию' : 'Новая категория'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_120px_auto] md:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Название"
              required
            />
            <Input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="slug"
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
            ) : categories.length === 0 ? (
              <p className="p-6 text-sm text-mp-text-secondary">Категорий пока нет.</p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="grid gap-3 p-4 md:grid-cols-[1fr_120px_120px_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-mp-text-primary">{category.name}</p>
                    <p className="truncate text-xs text-mp-text-secondary">
                      /{category.slug} · контента: {category._count?.content ?? 0}
                    </p>
                  </div>
                  <span className="text-sm text-mp-text-secondary">#{category.order}</span>
                  <span className={category.isActive ? 'text-sm text-emerald-400' : 'text-sm text-mp-text-disabled'}>
                    {category.isActive ? 'Показывается' : 'Скрыта'}
                  </span>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(category)}>
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(category.id)}
                      disabled={(category._count?.content ?? 0) > 0 || deleteMutation.isPending}
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
