"use client";

import { X } from "@phosphor-icons/react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  PopoverAnchor,
  Popover,
  PopoverContent,
} from "@/components/ui/popover";
import { api, endpoints } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// ============ Types ============

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface TagInputProps {
  value: string[];
  onChange: (ids: string[]) => void;
  availableTags: Tag[];
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  allowCreate?: boolean;
}

// ============ Component ============

export function TagInput({
  value,
  onChange,
  availableTags,
  placeholder = "Добавить тег...",
  disabled = false,
  maxTags,
  allowCreate = true,
}: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const [cachedTagsById, setCachedTagsById] = React.useState<
    Map<string, Tag>
  >(() => new Map());

  const SUGGESTIONS_LIMIT = 12;

  const maxReached = maxTags !== undefined && value.length >= maxTags;

  const normalizeTagName = React.useCallback((name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim();
  }, []);

  React.useEffect(() => {
    if (availableTags.length === 0) return;

    setCachedTagsById((previous) => {
      const next = new Map(previous);

      for (const tag of availableTags) {
        next.set(tag.id, tag);
      }

      return next;
    });
  }, [availableTags]);

  const tagsById = React.useMemo(() => {
    const byId = new Map(cachedTagsById);

    for (const tag of availableTags) {
      byId.set(tag.id, tag);
    }

    return byId;
  }, [availableTags, cachedTagsById]);

  const selectedTags = React.useMemo(
    () =>
      value
        .map((id) => tagsById.get(id))
        .filter((tag): tag is Tag => !!tag),
    [tagsById, value],
  );

  const filteredSuggestions = React.useMemo(() => {
    const selectedSet = new Set(value);
    const q = query.trim().toLowerCase();

    const suggestions = availableTags.filter((tag) => {
      if (selectedSet.has(tag.id)) return false;
      if (q.length === 0) return true;
      return tag.name.toLowerCase().includes(q);
    });

    return suggestions.slice(0, SUGGESTIONS_LIMIT);
  }, [availableTags, value, query]);

  const normalizedQuery = normalizeTagName(query);
  const exactQueryMatch = React.useMemo(
    () =>
      normalizedQuery
        ? availableTags.find((tag) => normalizeTagName(tag.name) === normalizedQuery)
        : undefined,
    [availableTags, normalizeTagName, normalizedQuery],
  );

  const suggestionsTitle = React.useMemo(() => {
    const q = query.trim();
    return q.length === 0 ? "Популярные теги" : "Результаты";
  }, [query]);

  const handleAdd = React.useCallback(
    (tagId: string) => {
      if (maxReached || value.includes(tagId)) return;

      onChange([...value, tagId]);
      setQuery("");
      setOpen(maxTags === undefined || value.length + 1 < maxTags);
    },
    [value, onChange, maxReached, maxTags],
  );

  const handleRemove = React.useCallback(
    (tagId: string) => {
      onChange(value.filter((id) => id !== tagId));
    },
    [value, onChange],
  );

  const handleCreate = React.useCallback(async () => {
    if (!allowCreate || maxReached || isCreating) return;

    const tagName = normalizeTagName(query);
    if (tagName.length < 2 || tagName.length > 32) return;

    if (exactQueryMatch) {
      handleAdd(exactQueryMatch.id);
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.post<Tag>(endpoints.tags.create, { name: tagName });
      const tag = response.data;
      setCachedTagsById((previous) => {
        const next = new Map(previous);
        next.set(tag.id, tag);
        return next;
      });
      onChange([...value, tag.id]);
      setQuery("");
      setOpen(maxTags === undefined || value.length + 1 < maxTags);
    } finally {
      setIsCreating(false);
    }
  }, [
    allowCreate,
    exactQueryMatch,
    handleAdd,
    isCreating,
    maxReached,
    maxTags,
    normalizeTagName,
    onChange,
    query,
    value,
  ]);

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (!maxReached) setOpen(true);
    },
    [maxReached],
  );

  const handleInputFocus = React.useCallback(() => {
    if (!maxReached) setOpen(true);
  }, [maxReached]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && open) {
        e.preventDefault();

        const firstSuggestion = filteredSuggestions[0];
        if (firstSuggestion) {
          handleAdd(firstSuggestion.id);
        } else {
          void handleCreate();
        }

        return;
      }

      // Remove last tag on Backspace when input is empty
      if (e.key === "Backspace" && query === "" && value.length > 0) {
        onChange(value.slice(0, -1));
      }

      // Close dropdown on Escape
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    [filteredSuggestions, handleAdd, handleCreate, open, query, value, onChange],
  );

  return (
    <div ref={fieldRef} className="space-y-2">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="border-mp-border bg-mp-surface text-mp-text-primary hover:bg-mp-surface-elevated gap-1 pr-1"
            >
              <span className="text-xs">{tag.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                disabled={disabled}
                className="rounded-sm p-0.5 text-mp-text-secondary hover:text-mp-text-primary hover:bg-white/10 transition-colors disabled:pointer-events-none"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onClick={handleInputFocus}
              onKeyDown={handleKeyDown}
              disabled={disabled || maxReached}
              placeholder={
                maxReached ? `Максимум ${maxTags} тегов` : placeholder
              }
              className={cn(
                "flex h-9 w-full rounded-md border border-mp-border bg-mp-surface/50 px-3 py-1 text-sm text-mp-text-primary shadow-sm transition-colors",
                "placeholder:text-muted-foreground",
                "hover:bg-mp-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>
        </PopoverAnchor>

        {open && (
          <PopoverContent
            className="p-0"
            style={{ width: fieldRef.current?.getBoundingClientRect().width }}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (fieldRef.current?.contains(e.target as Node)) {
                e.preventDefault();
              }
            }}
          >
            <div className="max-h-[200px] overflow-y-auto p-1">
              <div className="px-2 pt-2 pb-1">
                <p className="text-xs font-medium text-mp-text-secondary">
                  {suggestionsTitle}
                </p>
              </div>

              {filteredSuggestions.length === 0 ? (
                <div className="py-3 text-center text-sm text-muted-foreground">
                  {allowCreate && normalizedQuery.length >= 2 && normalizedQuery.length <= 32 ? (
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => void handleCreate()}
                      disabled={isCreating}
                      className="rounded px-2 py-1 text-mp-text-primary hover:bg-accent disabled:opacity-50"
                    >
                      {isCreating ? "Создание..." : `Добавить «${normalizedQuery}»`}
                    </button>
                  ) : (
                    "Теги не найдены"
                  )}
                </div>
              ) : (
                filteredSuggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleAdd(tag.id)}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-mp-text-primary outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
