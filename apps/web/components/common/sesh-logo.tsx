import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

interface SeshLogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  onClick?: () => void;
  mobile?: boolean;
}

export function SeshLogo({
  href = '/',
  className,
  imageClassName,
  priority = false,
  onClick,
  mobile = false,
}: SeshLogoProps) {
  const logo = (
    <Image
      src={mobile ? '/logo-mobile.png' : '/logo.png'}
      alt="СЕШ"
      width={mobile ? 72 : 220}
      height={72}
      priority={priority}
      className={cn('h-auto w-auto object-contain', imageClassName)}
    />
  );

  return (
    <Link
      href={href}
      aria-label="СЕШ"
      className={cn('inline-flex shrink-0 items-center', className)}
      onClick={onClick}
    >
      {logo}
    </Link>
  );
}
