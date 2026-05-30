"use client";

import { LinkSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/lib/utils";

interface CopyAuthorLinkButtonProps {
  url: string;
}

export function CopyAuthorLinkButton({ url }: CopyAuthorLinkButtonProps) {
  const handleCopy = async () => {
    const ok = await copyTextToClipboard(url);
    if (ok) toast.success("Ссылка скопирована");
    else toast.error("Не удалось скопировать ссылку");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
      <LinkSimple className="h-4 w-4" />
      Скопировать ссылку
    </Button>
  );
}
