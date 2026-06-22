'use client';

import { CaretDown, Play } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';

export function LandingHero() {
  return (
    <section className="sesh-approved-hero relative min-h-[100dvh] overflow-hidden">
      <Image
        src="/images/mainbackground.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        unoptimized
        sizes="100vw"
        className="fixed inset-0 h-full w-full object-cover"
        style={{ position: 'fixed' }}
        draggable={false}
      />

      <div className="sesh-approved-content relative z-10">
        <div className="sesh-approved-badge">
          <span className="sesh-approved-badge-dot" />
          <span>Стриминговая платформа нового поколения</span>
        </div>

        <h1 className="sesh-approved-title">
          <span>Смотрите то,</span>
          <span>что вдохнавляет</span>
        </h1>

        <p className="sesh-approved-subtitle">
          Тысячи сериалов, обучающих куссов и эксклюзивного контента. Смотрите в любое
          время, с любого устройства.
        </p>

        <div className="sesh-approved-actions">
          <Link href="/register" className="sesh-approved-primary">
            <Play className="h-[29px] w-[29px]" weight="fill" />
            <span>Начать бесплатно</span>
            <span className="sesh-approved-arrow">→</span>
          </Link>

          <Link href="/pricing" className="sesh-approved-secondary">
            Узнать о тарифах
          </Link>
        </div>
      </div>

      <div className="sesh-approved-scroll" aria-hidden="true">
        <span>ПРОКРУТИТЕ</span>
        <CaretDown className="h-[18px] w-[18px]" />
      </div>
    </section>
  );
}
