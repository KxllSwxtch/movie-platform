'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen } from '@phosphor-icons/react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { CategorySelect } from '@/components/studio/category-select';
import { GenreSelect } from '@/components/studio/genre-select';
import { tutorialFormSchema, type TutorialFormValues } from '@/components/studio/schemas';
import { MediaUploadCard } from '@/components/studio/shared/media-upload-card';
import { PublishingCard } from '@/components/studio/shared/publishing-card';
import { SummaryPanel } from '@/components/studio/shared/summary-panel';
import { TitleDescriptionFields } from '@/components/studio/shared/title-description-fields';
import { StructuredContentVideoManager } from '@/components/studio/structured-content-video-manager';
import { WizardShell, type WizardStep } from '@/components/studio/shared/wizard-shell';
import { TagInput } from '@/components/studio/tag-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateContent } from '@/hooks/use-admin-content';
import { useCreateSeriesContent, type CreateSeriesInput } from '@/hooks/use-series-structure';
import { useContentCategories, useContentGenres, useContentTags } from '@/hooks/use-studio-data';

const DRAFT_KEY = 'studio-draft-tutorial';

const STEPS: WizardStep[] = [
  { id: 1, label: 'Основное' },
  { id: 2, label: 'Публикация' },
  { id: 3, label: 'Медиа' },
];

const STEP_FIELDS: Record<number, Array<keyof TutorialFormValues>> = {
  1: ['title', 'description'],
  2: ['categoryId', 'ageCategory'],
  3: [],
};

function getDefaultValues(): TutorialFormValues {
  return {
    title: '',
    slug: '',
    description: '',
    contentType: 'TUTORIAL',
    ageCategory: '0+',
    status: 'DRAFT',
    thumbnailUrl: '',
    previewUrl: '',
    isFree: false,
    individualPrice: 0,
    categoryId: '',
    tagIds: [],
    genreIds: [],
    chapters: [],
  };
}

function loadDraft(): TutorialFormValues | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TutorialFormValues;
    return parsed.title !== undefined ? parsed : null;
  } catch {
    return null;
  }
}

function saveDraft(values: TutorialFormValues): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    // Ignore storage quota errors.
  }
}

function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore.
  }
}

function buildCreatePayload(values: TutorialFormValues): CreateSeriesInput {
  return {
    title: values.title,
    description: values.description,
    contentType: 'TUTORIAL',
    categoryId: values.categoryId,
    ageCategory: values.ageCategory,
    thumbnailUrl: values.thumbnailUrl || undefined,
    previewUrl: values.previewUrl || undefined,
    isFree: values.isFree,
    individualPrice: values.individualPrice,
    tagIds: values.tagIds,
    genreIds: values.genreIds,
    seasons: [],
  };
}

export interface TutorialWizardProps {
  onSuccess?: (contentId: string) => void;
}

export function TutorialWizard({ onSuccess }: TutorialWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [createdContentId, setCreatedContentId] = React.useState<string | null>(null);

  const createTutorial = useCreateSeriesContent();
  const updateContent = useUpdateContent();
  const { flat: categoriesFlat } = useContentCategories();
  const { data: tagsData } = useContentTags();
  const { data: genresData } = useContentGenres();

  const draft = React.useMemo(() => loadDraft(), []);
  const form = useForm<TutorialFormValues>({
    resolver: zodResolver(tutorialFormSchema),
    defaultValues: draft ?? getDefaultValues(),
    mode: 'onTouched',
  });

  const { watch, trigger, formState } = form;
  const watchedValues = watch();
  const draftTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => saveDraft(watchedValues), 1000);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [watchedValues]);

  const ensureDraftContent = React.useCallback(async (): Promise<boolean> => {
    if (createdContentId) return true;
    const values = form.getValues();

    return await new Promise<boolean>((resolve) => {
      createTutorial.mutate(buildCreatePayload(values), {
        onSuccess: (data) => {
          setCreatedContentId(data.id);
          toast.success('Черновик создан. Главы и уроки можно добавлять в любое время.');
          resolve(true);
        },
        onError: () => resolve(false),
      });
    });
  }, [createdContentId, form, createTutorial]);

  const handleNext = React.useCallback(async (): Promise<boolean> => {
    const fieldsToValidate = STEP_FIELDS[currentStep];
    if (fieldsToValidate?.length) {
      const ok = await trigger(fieldsToValidate);
      if (!ok) {
        toast.error('Пожалуйста, заполните обязательные поля');
        return false;
      }
    }

    if (currentStep === 2) {
      return ensureDraftContent();
    }

    return true;
  }, [currentStep, trigger, ensureDraftContent]);

  const handleFinish = React.useCallback(() => {
    if (!createdContentId) {
      toast.error('Сначала создайте черновик');
      return;
    }

    const values = form.getValues();
    updateContent.mutate(
      {
        id: createdContentId,
        title: values.title,
        description: values.description,
        categoryId: values.categoryId || undefined,
        ageCategory: values.ageCategory,
        thumbnailUrl: values.thumbnailUrl || undefined,
        previewUrl: values.previewUrl || undefined,
        isFree: values.isFree,
        individualPrice: values.individualPrice || undefined,
        tagIds: values.tagIds?.length ? values.tagIds : undefined,
        genreIds: values.genreIds?.length ? values.genreIds : undefined,
        status: values.status || 'DRAFT',
      },
      {
        onSuccess: () => {
          clearDraft();
          onSuccess?.(createdContentId);
        },
      }
    );
  }, [createdContentId, form, updateContent, onSuccess]);

  return (
    <WizardShell
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onNext={handleNext}
      onBack={() => setCurrentStep((s) => Math.max(1, s - 1))}
      onSubmit={handleFinish}
      isSubmitting={createTutorial.isPending || updateContent.isPending}
      submitLabel="Открыть редактор"
      submitIcon={<BookOpen weight="bold" className="h-4 w-4" />}
      cancelHref="/studio"
    >
      {currentStep === 1 && <TitleDescriptionFields form={form} slugPrefix="movieplatform.ru/watch/" />}

      {currentStep === 2 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-[#272b38] bg-[#10131c]/50">
              <CardHeader>
                <CardTitle className="text-lg text-[#f5f7ff]">Тематика *</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  name="categoryId"
                  control={form.control}
                  render={({ field }) => (
                    <CategorySelect value={field.value} onChange={field.onChange} categories={categoriesFlat} />
                  )}
                />
                {formState.errors.categoryId && (
                  <p className="mt-2 text-xs text-[#ff9aa8]">
                    {(formState.errors.categoryId as { message?: string }).message}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#272b38] bg-[#10131c]/50">
              <CardHeader>
                <CardTitle className="text-lg text-[#f5f7ff]">Жанры</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  name="genreIds"
                  control={form.control}
                  render={({ field }) => (
                    <GenreSelect value={field.value ?? []} onChange={field.onChange} availableGenres={genresData ?? []} />
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-[#272b38] bg-[#10131c]/50">
              <CardHeader>
                <CardTitle className="text-lg text-[#f5f7ff]">Теги</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  name="tagIds"
                  control={form.control}
                  render={({ field }) => (
                    <TagInput value={field.value ?? []} onChange={field.onChange} availableTags={tagsData ?? []} maxTags={20} />
                  )}
                />
              </CardContent>
            </Card>

            <PublishingCard form={form} />
          </div>
          <SummaryPanel form={form} contentType="TUTORIAL" />
        </div>
      )}

      {currentStep === 3 && createdContentId && (
        <div className="space-y-6">
          <MediaUploadCard form={form} contentId={createdContentId} showMainVideoUpload={false} />
          <StructuredContentVideoManager rootContentId={createdContentId} contentType="TUTORIAL" />
        </div>
      )}
    </WizardShell>
  );
}

export default TutorialWizard;
