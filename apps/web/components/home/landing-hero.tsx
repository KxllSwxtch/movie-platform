'use client';

import { CaretDown, Play } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';

export function LandingHero() {
  return (
    <section className="sesh-approved-hero relative min-h-[100dvh] overflow-hidden">
      <div className="fixed inset-0 hidden md:block" aria-hidden="true">
        <Image
          src="/images/mainbackground.png"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
      <div className="fixed inset-0 md:hidden" aria-hidden="true">
        <Image
          src="/images/mobile-bg.png"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="sesh-approved-mobile-bg h-full w-full object-cover"
          draggable={false}
        />
      </div>

      <div className="sesh-approved-content relative z-10">
        <div className="sesh-approved-badge">
          <span className="sesh-approved-badge-dot" />
          <span>Стриминговая платформа нового поколения</span>
        </div>

        <h1 className="sesh-approved-title">
          <span>Смотрите то,</span>
          <span>что вдохновляет</span>
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

        <div className="sesh-approved-proof" aria-label="Social proof">
          <span>10 000+ {'\u0435\u0434\u0438\u043d\u0438\u0446 \u043a\u043e\u043d\u0442\u0435\u043d\u0442\u0430'}</span>
          <span>4K</span>
          <span>{'\u0411\u0435\u0437 \u0440\u0435\u043a\u043b\u0430\u043c\u044b'}</span>
        </div>
      </div>

      <div className="sesh-approved-scroll" aria-hidden="true">
        <span>ПРОКРУТИТЕ</span>
        <CaretDown className="h-[18px] w-[18px]" />
      </div>
    </section>
  );
}
