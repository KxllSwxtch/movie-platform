"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const nanoid_1 = require("nanoid");
const prisma = new client_1.PrismaClient();
function generateReferralCode() {
    return (0, nanoid_1.nanoid)(8).toUpperCase();
}
async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}
function calculateAgeCategory(dateOfBirth) {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    if (age >= 18)
        return client_1.AgeCategory.EIGHTEEN_PLUS;
    if (age >= 16)
        return client_1.AgeCategory.SIXTEEN_PLUS;
    if (age >= 12)
        return client_1.AgeCategory.TWELVE_PLUS;
    if (age >= 6)
        return client_1.AgeCategory.SIX_PLUS;
    return client_1.AgeCategory.ZERO_PLUS;
}
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
            type: client_1.SubscriptionPlanType.PREMIUM,
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
            type: client_1.SubscriptionPlanType.PREMIUM,
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
            type: client_1.SubscriptionPlanType.SERIES,
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
            type: client_1.SubscriptionPlanType.TUTORIAL,
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
                rate: 1.0,
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
            type: client_1.LegalDocumentType.USER_AGREEMENT,
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
            type: client_1.LegalDocumentType.PRIVACY_POLICY,
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
            type: client_1.LegalDocumentType.PARTNER_AGREEMENT,
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
            type: client_1.NotificationType.EMAIL,
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
            type: client_1.NotificationType.EMAIL,
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
            type: client_1.NotificationType.EMAIL,
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
            type: client_1.NotificationType.EMAIL,
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
            type: client_1.NotificationType.IN_APP,
            subject: null,
            bodyTemplate: `Вы получили комиссию {{amount}} ₽ от покупки пользователя на уровне {{level}}.`,
            variables: JSON.stringify(['amount', 'level']),
        },
        {
            name: 'order_confirmed',
            type: client_1.NotificationType.EMAIL,
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
            role: client_1.UserRole.ADMIN,
            verificationStatus: client_1.VerificationStatus.VERIFIED,
        },
        {
            email: 'moderator@movieplatform.local',
            password: 'mod123',
            firstName: 'Модератор',
            lastName: 'Контента',
            dateOfBirth: new Date('1990-05-20'),
            role: client_1.UserRole.MODERATOR,
            verificationStatus: client_1.VerificationStatus.VERIFIED,
        },
        {
            email: 'partner@movieplatform.local',
            password: 'partner123',
            firstName: 'Партнер',
            lastName: 'Программы',
            dateOfBirth: new Date('1988-08-10'),
            role: client_1.UserRole.PARTNER,
            verificationStatus: client_1.VerificationStatus.VERIFIED,
        },
        {
            email: 'user@movieplatform.local',
            password: 'user123',
            firstName: 'Иван',
            lastName: 'Петров',
            dateOfBirth: new Date('1999-03-25'),
            role: client_1.UserRole.CLIENT,
            verificationStatus: client_1.VerificationStatus.VERIFIED,
        },
        {
            email: 'minor@movieplatform.local',
            password: 'minor123',
            firstName: 'Алексей',
            lastName: 'Сидоров',
            dateOfBirth: new Date('2011-07-12'),
            role: client_1.UserRole.CLIENT,
            verificationStatus: client_1.VerificationStatus.VERIFIED,
        },
    ];
    const createdUsers = [];
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
        }
        else {
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
        {
            title: 'Тайны ночного города',
            slug: 'mysteries-of-night-city',
            description: 'Захватывающий детективный сериал о частном сыщике в мегаполисе. Каждый эпизод — новое расследование, интриги и неожиданные повороты сюжета.',
            contentType: client_1.ContentType.SERIES,
            categoryId: seriesCategory.id,
            ageCategory: client_1.AgeCategory.EIGHTEEN_PLUS,
            duration: 2700,
            isFree: false,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        {
            title: 'Приключения в школе магии',
            slug: 'magic-school-adventures',
            description: 'Увлекательная история о подростках, обучающихся в секретной школе магии. Дружба, загадки и волшебство!',
            contentType: client_1.ContentType.SERIES,
            categoryId: seriesCategory.id,
            ageCategory: client_1.AgeCategory.TWELVE_PLUS,
            duration: 1800,
            isFree: false,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        {
            title: 'Лучшие моменты: Финал сезона',
            slug: 'best-moments-season-finale',
            description: 'Подборка самых ярких и запоминающихся моментов из финального эпизода.',
            contentType: client_1.ContentType.CLIP,
            categoryId: filmsCategory.id,
            ageCategory: client_1.AgeCategory.SIXTEEN_PLUS,
            duration: 600,
            isFree: true,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        {
            title: 'За кулисами: Как снимался сериал',
            slug: 'behind-the-scenes',
            description: 'Эксклюзивный взгляд на процесс создания вашего любимого сериала.',
            contentType: client_1.ContentType.CLIP,
            categoryId: filmsCategory.id,
            ageCategory: client_1.AgeCategory.ZERO_PLUS,
            duration: 900,
            isFree: true,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        {
            title: 'Интервью с актерами',
            slug: 'actor-interviews',
            description: 'Откровенный разговор с главными звездами о их ролях и жизни.',
            contentType: client_1.ContentType.CLIP,
            categoryId: filmsCategory.id,
            ageCategory: client_1.AgeCategory.SIX_PLUS,
            duration: 1200,
            isFree: false,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        {
            title: 'Утренняя медитация',
            slug: 'morning-meditation',
            description: 'Короткое видео для начала дня с позитивного настроя.',
            contentType: client_1.ContentType.SHORT,
            categoryId: shortsCategory.id,
            ageCategory: client_1.AgeCategory.ZERO_PLUS,
            duration: 60,
            isFree: true,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        {
            title: 'Быстрый рецепт дня',
            slug: 'quick-recipe',
            description: 'Простой и вкусный рецепт, который можно приготовить за 5 минут.',
            contentType: client_1.ContentType.SHORT,
            categoryId: shortsCategory.id,
            ageCategory: client_1.AgeCategory.ZERO_PLUS,
            duration: 90,
            isFree: true,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        {
            title: 'Лайфхак: Уборка за минуту',
            slug: 'cleaning-lifehack',
            description: 'Полезный совет для быстрой уборки дома.',
            contentType: client_1.ContentType.SHORT,
            categoryId: shortsCategory.id,
            ageCategory: client_1.AgeCategory.ZERO_PLUS,
            duration: 45,
            isFree: true,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        {
            title: 'Основы программирования: Python с нуля',
            slug: 'python-basics',
            description: 'Полный курс программирования на Python для начинающих. От установки до первых проектов.',
            contentType: client_1.ContentType.TUTORIAL,
            categoryId: tutorialsCategory.id,
            ageCategory: client_1.AgeCategory.TWELVE_PLUS,
            duration: 7200,
            isFree: false,
            individualPrice: 1999,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
        {
            title: 'Введение в фотографию',
            slug: 'photography-intro',
            description: 'Бесплатный вводный урок по основам фотографии. Узнайте, как делать красивые снимки.',
            contentType: client_1.ContentType.TUTORIAL,
            categoryId: tutorialsCategory.id,
            ageCategory: client_1.AgeCategory.ZERO_PLUS,
            duration: 1800,
            isFree: true,
            status: client_1.ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
    ];
    for (const content of contentItems) {
        const existing = await prisma.content.findUnique({
            where: { slug: content.slug },
        });
        if (!existing) {
            const created = await prisma.content.create({
                data: content,
            });
            if (content.contentType === client_1.ContentType.SERIES) {
                await prisma.series.create({
                    data: {
                        contentId: created.id,
                        seasonNumber: 1,
                        episodeNumber: 1,
                    },
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
            status: client_1.ProductStatus.ACTIVE,
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
            status: client_1.ProductStatus.ACTIVE,
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
            status: client_1.ProductStatus.ACTIVE,
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
            status: client_1.ProductStatus.ACTIVE,
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
            status: client_1.ProductStatus.ACTIVE,
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
    await prisma.user.update({
        where: { id: user.id },
        data: { referredById: partner.id },
    });
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
                level: 1,
            },
        });
    }
    console.log('✅ Partner Relationships seeded');
}
async function main() {
    console.log('');
    console.log('🌱 ========================================');
    console.log('🌱 Starting MoviePlatform Database Seed');
    console.log('🌱 ========================================');
    console.log('');
    try {
        await seedPartnerLevels();
        await seedCategories();
        await seedProductCategories();
        await seedSubscriptionPlans();
        await seedBonusRates();
        await seedLegalDocuments();
        await seedNotificationTemplates();
        await seedUsers();
        await seedContent();
        await seedProducts();
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
        console.log('   - user@movieplatform.local / user123 (CLIENT)');
        console.log('   - minor@movieplatform.local / minor123 (CLIENT, age-restricted by ageCategory)');
        console.log('');
    }
    catch (error) {
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
//# sourceMappingURL=seed.js.map
