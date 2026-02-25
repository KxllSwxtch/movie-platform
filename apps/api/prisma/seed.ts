import { PrismaClient, UserRole, AgeCategory, VerificationStatus, ContentType, ContentStatus, SubscriptionPlanType, LegalDocumentType, NotificationType, ProductStatus } from '@prisma/client';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// S3/MinIO client for thumbnail uploads
const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  },
});

const MINIO_PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const THUMBNAILS_BUCKET = 'thumbnails';

// Helper to generate referral codes
function generateReferralCode(): string {
  return nanoid(8).toUpperCase();
}

// Helper to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper to calculate age category based on date of birth
function calculateAgeCategory(dateOfBirth: Date): AgeCategory {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();

  if (age >= 18) return AgeCategory.EIGHTEEN_PLUS;
  if (age >= 16) return AgeCategory.SIXTEEN_PLUS;
  if (age >= 12) return AgeCategory.TWELVE_PLUS;
  if (age >= 6) return AgeCategory.SIX_PLUS;
  return AgeCategory.ZERO_PLUS;
}

// ============================================
// THUMBNAIL HELPERS
// ============================================

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const CONTENT_TYPE_GRADIENTS: Record<string, [string, string]> = {
  SERIES: ['#C94BFF', '#6B21A8'],
  CLIP: ['#28E0C4', '#0D9488'],
  SHORT: ['#FF6B5A', '#DC2626'],
  TUTORIAL: ['#3B82F6', '#1D4ED8'],
};

function generatePlaceholderSvg(title: string, contentType: string): string {
  const [color1, color2] = CONTENT_TYPE_GRADIENTS[contentType] || ['#C94BFF', '#28E0C4'];
  const displayTitle = escapeXml(title.length > 30 ? title.substring(0, 27) + '...' : title);

  return `<svg width="640" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#bg)" />
  <text x="320" y="190" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter,Arial,sans-serif" font-size="28" font-weight="600"
        fill="rgba(255,255,255,0.9)">${displayTitle}</text>
  <text x="320" y="230" text-anchor="middle" font-family="Inter,Arial,sans-serif"
        font-size="14" fill="rgba(255,255,255,0.5)">${escapeXml(contentType)}</text>
</svg>`;
}

async function ensureBucketExists(bucket: string): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`  📦 Created bucket: ${bucket}`);
    } catch (createErr: any) {
      // Bucket may already exist (race condition)
      if (createErr?.name !== 'BucketAlreadyOwnedByYou' && createErr?.name !== 'BucketAlreadyExists') {
        console.warn(`  ⚠️ Could not create bucket "${bucket}":`, createErr?.message || createErr);
      }
    }
  }
}

async function uploadPlaceholderThumbnail(contentId: string, title: string, contentType: string): Promise<string | null> {
  try {
    const svg = generatePlaceholderSvg(title, contentType);
    const key = `${contentId}/placeholder.svg`;

    await s3Client.send(new PutObjectCommand({
      Bucket: THUMBNAILS_BUCKET,
      Key: key,
      Body: Buffer.from(svg),
      ContentType: 'image/svg+xml',
    }));

    return `${MINIO_PUBLIC_ENDPOINT}/${THUMBNAILS_BUCKET}/${key}`;
  } catch (err: any) {
    console.warn(`  ⚠️ Failed to upload thumbnail for "${title}":`, err?.message || err);
    return null;
  }
}

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedPartnerLevels() {
  console.log('🎯 Seeding Partner Levels...');

  const levels = [
    { levelNumber: 1, name: 'Стартер', commissionRate: 5, minReferrals: 0, minTeamVolume: 0 },
    { levelNumber: 2, name: 'Бронза', commissionRate: 7, minReferrals: 5, minTeamVolume: 10000 },
    { levelNumber: 3, name: 'Серебро', commissionRate: 10, minReferrals: 15, minTeamVolume: 50000 },
    { levelNumber: 4, name: 'Золото', commissionRate: 12, minReferrals: 30, minTeamVolume: 150000 },
    { levelNumber: 5, name: 'Платина', commissionRate: 15, minReferrals: 50, minTeamVolume: 500000 },
  ];

  for (const level of levels) {
    await prisma.partnerLevel.upsert({
      where: { levelNumber: level.levelNumber },
      update: level,
      create: {
        ...level,
        benefits: JSON.stringify([
          `Комиссия ${level.commissionRate}%`,
          `Минимум ${level.minReferrals} рефералов`,
        ]),
      },
    });
  }

  console.log('✅ Partner Levels seeded');
}

async function seedCategories() {
  console.log('🎯 Seeding Content Categories...');

  const categories = [
    { name: 'Сериалы', slug: 'series', order: 1 },
    { name: 'Фильмы', slug: 'films', order: 2 },
    { name: 'Шортсы', slug: 'shorts', order: 3 },
    { name: 'Обучение', slug: 'tutorials', order: 4 },
    { name: 'Развлечения', slug: 'entertainment', order: 5 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log('✅ Content Categories seeded');
}

async function seedProductCategories() {
  console.log('🎯 Seeding Product Categories...');

  const categories = [
    { name: 'Мерч', slug: 'merchandise', order: 1 },
    { name: 'Цифровые товары', slug: 'digital', order: 2 },
    { name: 'Коллекционное', slug: 'collectibles', order: 3 },
  ];

  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log('✅ Product Categories seeded');
}

async function seedSubscriptionPlans() {
  console.log('🎯 Seeding Subscription Plans...');

  const plans = [
    {
      name: 'Премиум Месячный',
      description: 'Полный доступ ко всему контенту платформы на месяц. Смотрите сериалы, фильмы, шортсы и обучающие материалы без ограничений.',
      type: SubscriptionPlanType.PREMIUM,
      price: 499,
      durationDays: 30,
      features: JSON.stringify([
        'Весь контент без ограничений',
        'HD и 4K качество',
        'Скачивание для офлайн просмотра',
        'Без рекламы',
        'Приоритетная поддержка',
      ]),
    },
    {
      name: 'Премиум Годовой',
      description: 'Годовая подписка с максимальной выгодой. Экономия 33% по сравнению с месячной подпиской.',
      type: SubscriptionPlanType.PREMIUM,
      price: 3990,
      durationDays: 365,
      features: JSON.stringify([
        'Весь контент без ограничений',
        'HD и 4K качество',
        'Скачивание для офлайн просмотра',
        'Без рекламы',
        'Приоритетная поддержка',
        'Экономия 33%',
        'Эксклюзивный контент',
      ]),
    },
    {
      name: 'Отдельный сериал',
      description: 'Подписка на один сериал. Получите доступ ко всем сезонам и эпизодам.',
      type: SubscriptionPlanType.SERIES,
      price: 199,
      durationDays: 30,
      features: JSON.stringify([
        'Доступ к выбранному сериалу',
        'Все сезоны и эпизоды',
        'HD качество',
      ]),
    },
    {
      name: 'Курс обучения',
      description: 'Доступ к одному обучающему курсу. Учитесь в своем темпе.',
      type: SubscriptionPlanType.TUTORIAL,
      price: 299,
      durationDays: 90,
      features: JSON.stringify([
        'Доступ к выбранному курсу',
        'Все уроки и материалы',
        'Сертификат по завершению',
      ]),
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name },
    });

    if (!existing) {
      await prisma.subscriptionPlan.create({
        data: plan,
      });
    }
  }

  console.log('✅ Subscription Plans seeded');
}

async function seedBonusRates() {
  console.log('🎯 Seeding Bonus Rates...');

  const now = new Date();

  const existing = await prisma.bonusRate.findFirst({
    where: {
      fromCurrency: 'RUB',
      toCurrency: 'BONUS',
    },
  });

  if (!existing) {
    await prisma.bonusRate.create({
      data: {
        fromCurrency: 'RUB',
        toCurrency: 'BONUS',
        rate: 1.0, // 1 RUB = 1 Bonus
        effectiveFrom: now,
      },
    });
  }

  console.log('✅ Bonus Rates seeded');
}

async function seedLegalDocuments() {
  console.log('🎯 Seeding Legal Documents...');

  const documents = [
    {
      type: LegalDocumentType.USER_AGREEMENT,
      title: 'Пользовательское соглашение',
      version: '1.0.0',
      content: `# Пользовательское соглашение

## 1. Общие положения

1.1. Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между владельцем платформы MoviePlatform (далее — Платформа) и пользователем сети Интернет (далее — Пользователь).

1.2. Использование Платформы означает согласие Пользователя с настоящим Соглашением.

## 2. Права и обязанности сторон

2.1. Пользователь обязуется:
- Предоставлять достоверную информацию при регистрации
- Не нарушать авторские права
- Соблюдать законодательство РФ

2.2. Платформа обязуется:
- Обеспечивать доступ к сервису 24/7
- Защищать персональные данные пользователей
- Своевременно информировать об изменениях

## 3. Контент и возрастные ограничения

3.1. Контент на Платформе имеет возрастные ограничения: 0+, 6+, 12+, 16+, 18+.

3.2. Пользователь подтверждает достижение необходимого возраста.`,
      requiresAcceptance: true,
    },
    {
      type: LegalDocumentType.PRIVACY_POLICY,
      title: 'Политика конфиденциальности',
      version: '1.0.0',
      content: `# Политика конфиденциальности

## 1. Сбор информации

1.1. Мы собираем следующую информацию:
- Имя и email при регистрации
- Дату рождения для определения возрастных ограничений
- Историю просмотров для персонализации рекомендаций

## 2. Использование информации

2.1. Собранная информация используется для:
- Предоставления доступа к контенту
- Персонализации рекомендаций
- Обработки платежей
- Связи с пользователем

## 3. Защита данных

3.1. Мы применяем современные методы защиты:
- Шифрование данных
- Безопасное хранение паролей
- Регулярные аудиты безопасности`,
      requiresAcceptance: true,
    },
    {
      type: LegalDocumentType.PARTNER_AGREEMENT,
      title: 'Партнерское соглашение',
      version: '1.0.0',
      content: `# Партнерское соглашение

## 1. Условия участия

1.1. Партнерская программа доступна пользователям старше 18 лет.

1.2. Для участия необходимо пройти верификацию.

## 2. Комиссионные выплаты

2.1. Комиссии начисляются с покупок привлеченных пользователей.

2.2. Ставки комиссий по уровням:
- Уровень 1 (прямые): 10%
- Уровень 2: 5%
- Уровень 3: 3%
- Уровень 4: 2%
- Уровень 5: 1%

## 3. Выплаты

3.1. Минимальная сумма для вывода: 1000 ₽.

3.2. Выплаты производятся в течение 5 рабочих дней.`,
      requiresAcceptance: true,
    },
  ];

  for (const doc of documents) {
    const existing = await prisma.legalDocument.findFirst({
      where: { type: doc.type, version: doc.version },
    });

    if (!existing) {
      await prisma.legalDocument.create({
        data: {
          ...doc,
          isActive: true,
          publishedAt: new Date(),
        },
      });
    }
  }

  console.log('✅ Legal Documents seeded');
}

async function seedNotificationTemplates() {
  console.log('🎯 Seeding Notification Templates...');

  const templates = [
    {
      name: 'welcome',
      type: NotificationType.EMAIL,
      subject: 'Добро пожаловать в MoviePlatform!',
      bodyTemplate: `Здравствуйте, {{firstName}}!

Добро пожаловать на MoviePlatform — вашу новую платформу для просмотра качественного контента.

Ваш реферальный код: {{referralCode}}
Поделитесь им с друзьями и получайте бонусы!

С уважением,
Команда MoviePlatform`,
      variables: JSON.stringify(['firstName', 'referralCode']),
    },
    {
      name: 'email_verification',
      type: NotificationType.EMAIL,
      subject: 'Подтвердите ваш email',
      bodyTemplate: `Здравствуйте, {{firstName}}!

Для подтверждения email перейдите по ссылке:
{{verificationUrl}}

Ссылка действительна 24 часа.

С уважением,
Команда MoviePlatform`,
      variables: JSON.stringify(['firstName', 'verificationUrl']),
    },
    {
      name: 'password_reset',
      type: NotificationType.EMAIL,
      subject: 'Сброс пароля MoviePlatform',
      bodyTemplate: `Здравствуйте, {{firstName}}!

Вы запросили сброс пароля. Перейдите по ссылке:
{{resetUrl}}

Ссылка действительна 1 час.

Если вы не запрашивали сброс, проигнорируйте это письмо.

С уважением,
Команда MoviePlatform`,
      variables: JSON.stringify(['firstName', 'resetUrl']),
    },
    {
      name: 'subscription_confirmed',
      type: NotificationType.EMAIL,
      subject: 'Подписка оформлена',
      bodyTemplate: `Здравствуйте, {{firstName}}!

Ваша подписка "{{planName}}" успешно оформлена.

Сумма: {{amount}} ₽
Действует до: {{expiresAt}}

Приятного просмотра!

С уважением,
Команда MoviePlatform`,
      variables: JSON.stringify(['firstName', 'planName', 'amount', 'expiresAt']),
    },
    {
      name: 'commission_earned',
      type: NotificationType.IN_APP,
      subject: null,
      bodyTemplate: `Вы получили комиссию {{amount}} ₽ от покупки пользователя на уровне {{level}}.`,
      variables: JSON.stringify(['amount', 'level']),
    },
    {
      name: 'order_confirmed',
      type: NotificationType.EMAIL,
      subject: 'Заказ №{{orderId}} подтвержден',
      bodyTemplate: `Здравствуйте, {{firstName}}!

Ваш заказ №{{orderId}} успешно оформлен.

Сумма: {{amount}} ₽
Статус: Обработка

Мы уведомим вас об отправке.

С уважением,
Команда MoviePlatform`,
      variables: JSON.stringify(['firstName', 'orderId', 'amount']),
    },
  ];

  for (const template of templates) {
    const existing = await prisma.notificationTemplate.findFirst({
      where: { name: template.name },
    });

    if (!existing) {
      await prisma.notificationTemplate.create({
        data: template,
      });
    }
  }

  console.log('✅ Notification Templates seeded');
}

async function seedUsers() {
  console.log('🎯 Seeding Users...');

  const users = [
    {
      email: 'admin@movieplatform.local',
      password: 'admin123',
      firstName: 'Админ',
      lastName: 'Платформы',
      dateOfBirth: new Date('1985-01-15'),
      role: UserRole.ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    {
      email: 'moderator@movieplatform.local',
      password: 'mod123',
      firstName: 'Модератор',
      lastName: 'Контента',
      dateOfBirth: new Date('1990-05-20'),
      role: UserRole.MODERATOR,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    {
      email: 'partner@movieplatform.local',
      password: 'partner123',
      firstName: 'Партнер',
      lastName: 'Программы',
      dateOfBirth: new Date('1988-08-10'),
      role: UserRole.PARTNER,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    {
      email: 'user@movieplatform.local',
      password: 'user123',
      firstName: 'Иван',
      lastName: 'Петров',
      dateOfBirth: new Date('1999-03-25'),
      role: UserRole.BUYER,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    {
      email: 'minor@movieplatform.local',
      password: 'minor123',
      firstName: 'Алексей',
      lastName: 'Сидоров',
      dateOfBirth: new Date('2011-07-12'),
      role: UserRole.MINOR,
      verificationStatus: VerificationStatus.VERIFIED,
    },
  ];

  const createdUsers: { email: string; id: string }[] = [];

  for (const userData of users) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existing) {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: await hashPassword(userData.password),
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          ageCategory: calculateAgeCategory(userData.dateOfBirth),
          role: userData.role,
          verificationStatus: userData.verificationStatus,
          referralCode: generateReferralCode(),
          isActive: true,
        },
      });
      createdUsers.push({ email: user.email, id: user.id });
    } else {
      createdUsers.push({ email: existing.email, id: existing.id });
    }
  }

  console.log('✅ Users seeded');
  return createdUsers;
}

async function seedContent() {
  console.log('🎯 Seeding Content...');

  const seriesCategory = await prisma.category.findUnique({ where: { slug: 'series' } });
  const filmsCategory = await prisma.category.findUnique({ where: { slug: 'films' } });
  const shortsCategory = await prisma.category.findUnique({ where: { slug: 'shorts' } });
  const tutorialsCategory = await prisma.category.findUnique({ where: { slug: 'tutorials' } });

  if (!seriesCategory || !filmsCategory || !shortsCategory || !tutorialsCategory) {
    console.log('⚠️ Categories not found, skipping content seed');
    return;
  }

  const contentItems = [
    // Series
    {
      title: 'Тайны ночного города',
      slug: 'mysteries-of-night-city',
      description: 'Захватывающий детективный сериал о частном сыщике в мегаполисе. Каждый эпизод — новое расследование, интриги и неожиданные повороты сюжета.',
      contentType: ContentType.SERIES,
      categoryId: seriesCategory.id,
      ageCategory: AgeCategory.EIGHTEEN_PLUS,
      duration: 2700, // 45 min
      isFree: false,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      title: 'Приключения в школе магии',
      slug: 'magic-school-adventures',
      description: 'Увлекательная история о подростках, обучающихся в секретной школе магии. Дружба, загадки и волшебство!',
      contentType: ContentType.SERIES,
      categoryId: seriesCategory.id,
      ageCategory: AgeCategory.TWELVE_PLUS,
      duration: 1800, // 30 min
      isFree: false,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    // Clips
    {
      title: 'Лучшие моменты: Финал сезона',
      slug: 'best-moments-season-finale',
      description: 'Подборка самых ярких и запоминающихся моментов из финального эпизода.',
      contentType: ContentType.CLIP,
      categoryId: filmsCategory.id,
      ageCategory: AgeCategory.SIXTEEN_PLUS,
      duration: 600, // 10 min
      isFree: true,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      title: 'За кулисами: Как снимался сериал',
      slug: 'behind-the-scenes',
      description: 'Эксклюзивный взгляд на процесс создания вашего любимого сериала.',
      contentType: ContentType.CLIP,
      categoryId: filmsCategory.id,
      ageCategory: AgeCategory.ZERO_PLUS,
      duration: 900, // 15 min
      isFree: true,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      title: 'Интервью с актерами',
      slug: 'actor-interviews',
      description: 'Откровенный разговор с главными звездами о их ролях и жизни.',
      contentType: ContentType.CLIP,
      categoryId: filmsCategory.id,
      ageCategory: AgeCategory.SIX_PLUS,
      duration: 1200, // 20 min
      isFree: false,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    // Shorts
    {
      title: 'Утренняя медитация',
      slug: 'morning-meditation',
      description: 'Короткое видео для начала дня с позитивного настроя.',
      contentType: ContentType.SHORT,
      categoryId: shortsCategory.id,
      ageCategory: AgeCategory.ZERO_PLUS,
      duration: 60, // 1 min
      isFree: true,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      title: 'Быстрый рецепт дня',
      slug: 'quick-recipe',
      description: 'Простой и вкусный рецепт, который можно приготовить за 5 минут.',
      contentType: ContentType.SHORT,
      categoryId: shortsCategory.id,
      ageCategory: AgeCategory.ZERO_PLUS,
      duration: 90, // 1.5 min
      isFree: true,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      title: 'Лайфхак: Уборка за минуту',
      slug: 'cleaning-lifehack',
      description: 'Полезный совет для быстрой уборки дома.',
      contentType: ContentType.SHORT,
      categoryId: shortsCategory.id,
      ageCategory: AgeCategory.ZERO_PLUS,
      duration: 45,
      isFree: true,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    // Tutorials
    {
      title: 'Основы программирования: Python с нуля',
      slug: 'python-basics',
      description: 'Полный курс программирования на Python для начинающих. От установки до первых проектов.',
      contentType: ContentType.TUTORIAL,
      categoryId: tutorialsCategory.id,
      ageCategory: AgeCategory.TWELVE_PLUS,
      duration: 7200, // 2 hours
      isFree: false,
      individualPrice: 1999,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    {
      title: 'Введение в фотографию',
      slug: 'photography-intro',
      description: 'Бесплатный вводный урок по основам фотографии. Узнайте, как делать красивые снимки.',
      contentType: ContentType.TUTORIAL,
      categoryId: tutorialsCategory.id,
      ageCategory: AgeCategory.ZERO_PLUS,
      duration: 1800, // 30 min
      isFree: true,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  ];

  // Ensure thumbnails bucket exists before uploading
  await ensureBucketExists(THUMBNAILS_BUCKET);

  for (const content of contentItems) {
    const existing = await prisma.content.findUnique({
      where: { slug: content.slug },
    });

    if (!existing) {
      const created = await prisma.content.create({
        data: content,
      });

      // Generate and upload placeholder thumbnail
      const thumbnailUrl = await uploadPlaceholderThumbnail(
        created.id,
        content.title,
        content.contentType,
      );
      if (thumbnailUrl) {
        await prisma.content.update({
          where: { id: created.id },
          data: { thumbnailUrl },
        });
      }

      // Create series entries for SERIES type content
      if (content.contentType === ContentType.SERIES) {
        await prisma.series.create({
          data: {
            contentId: created.id,
            seasonNumber: 1,
            episodeNumber: 1,
          },
        });
      }
    } else if (!existing.thumbnailUrl) {
      // Existing content without thumbnail — generate one
      const thumbnailUrl = await uploadPlaceholderThumbnail(
        existing.id,
        content.title,
        content.contentType,
      );
      if (thumbnailUrl) {
        await prisma.content.update({
          where: { id: existing.id },
          data: { thumbnailUrl },
        });
      }
    }
  }

  console.log('✅ Content seeded');
}

async function seedProducts() {
  console.log('🎯 Seeding Products...');

  const merchCategory = await prisma.productCategory.findUnique({ where: { slug: 'merchandise' } });
  const digitalCategory = await prisma.productCategory.findUnique({ where: { slug: 'digital' } });
  const collectiblesCategory = await prisma.productCategory.findUnique({ where: { slug: 'collectibles' } });

  if (!merchCategory || !digitalCategory || !collectiblesCategory) {
    console.log('⚠️ Product categories not found, skipping products seed');
    return;
  }

  const products = [
    {
      name: 'Футболка MoviePlatform',
      slug: 'movieplatform-tshirt',
      description: 'Стильная хлопковая футболка с логотипом MoviePlatform. Доступны размеры S, M, L, XL.',
      categoryId: merchCategory.id,
      price: 1500,
      bonusPrice: 1500,
      stockQuantity: 100,
      status: ProductStatus.ACTIVE,
      images: JSON.stringify(['/images/products/tshirt-1.jpg', '/images/products/tshirt-2.jpg']),
    },
    {
      name: 'Худи MoviePlatform',
      slug: 'movieplatform-hoodie',
      description: 'Теплая худи с вышитым логотипом. Идеально для прохладной погоды.',
      categoryId: merchCategory.id,
      price: 3500,
      bonusPrice: 3500,
      stockQuantity: 50,
      status: ProductStatus.ACTIVE,
      images: JSON.stringify(['/images/products/hoodie-1.jpg']),
    },
    {
      name: 'Цифровой набор обоев',
      slug: 'digital-wallpaper-pack',
      description: 'Коллекция из 20 эксклюзивных обоев для рабочего стола и телефона.',
      categoryId: digitalCategory.id,
      price: 299,
      bonusPrice: 299,
      stockQuantity: 9999,
      status: ProductStatus.ACTIVE,
      images: JSON.stringify(['/images/products/wallpapers-preview.jpg']),
    },
    {
      name: 'Эксклюзивный NFT бейдж',
      slug: 'exclusive-nft-badge',
      description: 'Уникальный цифровой бейдж для вашего профиля. Ограниченная коллекция.',
      categoryId: collectiblesCategory.id,
      price: 999,
      bonusPrice: 999,
      stockQuantity: 500,
      status: ProductStatus.ACTIVE,
      images: JSON.stringify(['/images/products/nft-badge.jpg']),
    },
    {
      name: 'Набор постеров',
      slug: 'poster-set',
      description: 'Комплект из 5 постеров формата A3 с артами из популярных сериалов.',
      categoryId: merchCategory.id,
      price: 899,
      bonusPrice: 899,
      stockQuantity: 200,
      status: ProductStatus.ACTIVE,
      images: JSON.stringify(['/images/products/posters.jpg']),
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (!existing) {
      await prisma.product.create({
        data: product,
      });
    }
  }

  console.log('✅ Products seeded');
}

async function seedPartnerRelationships() {
  console.log('🎯 Seeding Partner Relationships...');

  const partner = await prisma.user.findUnique({
    where: { email: 'partner@movieplatform.local' },
  });

  const user = await prisma.user.findUnique({
    where: { email: 'user@movieplatform.local' },
  });

  if (!partner || !user) {
    console.log('⚠️ Partner or user not found, skipping relationships seed');
    return;
  }

  // Update user's referredById
  await prisma.user.update({
    where: { id: user.id },
    data: { referredById: partner.id },
  });

  // Create partner relationship
  const existing = await prisma.partnerRelationship.findFirst({
    where: {
      partnerId: partner.id,
      referralId: user.id,
    },
  });

  if (!existing) {
    await prisma.partnerRelationship.create({
      data: {
        partnerId: partner.id,
        referralId: user.id,
        level: 1, // Direct referral
      },
    });
  }

  console.log('✅ Partner Relationships seeded');
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('');
  console.log('🌱 ========================================');
  console.log('🌱 Starting MoviePlatform Database Seed');
  console.log('🌱 ========================================');
  console.log('');

  try {
    // Phase 1: Lookup Tables (no dependencies)
    await seedPartnerLevels();
    await seedCategories();
    await seedProductCategories();
    await seedSubscriptionPlans();
    await seedBonusRates();
    await seedLegalDocuments();
    await seedNotificationTemplates();

    // Phase 2: Users (depends on nothing, but needed for later phases)
    await seedUsers();

    // Phase 3: Content (depends on categories)
    await seedContent();

    // Phase 4: Products (depends on product categories)
    await seedProducts();

    // Phase 5: Relationships (depends on users)
    await seedPartnerRelationships();

    console.log('');
    console.log('✅ ========================================');
    console.log('✅ Seed completed successfully!');
    console.log('✅ ========================================');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - 5 Partner Levels');
    console.log('   - 5 Content Categories');
    console.log('   - 3 Product Categories');
    console.log('   - 4 Subscription Plans');
    console.log('   - 1 Bonus Rate');
    console.log('   - 3 Legal Documents');
    console.log('   - 6 Notification Templates');
    console.log('   - 5 Test Users');
    console.log('   - 10 Sample Content Items');
    console.log('   - 5 Sample Products');
    console.log('   - 1 Partner Relationship');
    console.log('');
    console.log('🔐 Test Users:');
    console.log('   - admin@movieplatform.local / admin123 (ADMIN)');
    console.log('   - moderator@movieplatform.local / mod123 (MODERATOR)');
    console.log('   - partner@movieplatform.local / partner123 (PARTNER)');
    console.log('   - user@movieplatform.local / user123 (BUYER)');
    console.log('   - minor@movieplatform.local / minor123 (MINOR)');
    console.log('');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
