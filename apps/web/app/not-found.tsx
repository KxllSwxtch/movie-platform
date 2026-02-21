'use client';

import { House, ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

/**
 * 404 Not Found page
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-mp-bg-primary">
      <div className="text-center">
        {/* 404 graphic */}
        <div className="relative mb-8">
          <div className="text-[150px] md:text-[200px] font-bold text-mp-surface leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl md:text-8xl font-bold text-gradient">
              404
            </div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-mp-text-primary mb-4">
          Страница не найдена
        </h1>

        <p className="text-mp-text-secondary max-w-md mx-auto mb-8">
          К сожалению, запрашиваемая страница не существует или была перемещена.
          Проверьте правильность адреса или вернитесь на главную.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="gradient" asChild>
            <Link href="/">
              <House className="w-4 h-4" />
              На главную
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
}
