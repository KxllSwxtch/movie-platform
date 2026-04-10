# Referral System Hardening — Design Spec

## Context

The referral/partner system has 29 identified bugs and missing features spanning data integrity, security, validation, and UX. Issues range from missing commission clawback on refunds (money loss) to no bot protection on registration (fraud risk). This spec covers a comprehensive fix using a layer-by-layer approach: Schema → Backend → Frontend → Tests.

### User Decisions
- **Refund policy:** Auto-cancel PENDING commissions; flag APPROVED/PAID for admin review
- **Email gate:** Commissions only flow after purchaser verifies email
- **Bot protection:** Cloudflare Turnstile (invisible, free, works in Russia)

---

## Phase 1: Schema Migration

Single Prisma migration covering all model changes.

### 1.1 User model additions

```prisma
emailVerified      Boolean @default(false) @map("email_verified")
referralCodeActive Boolean @default(true) @map("referral_code_active")
```

- `emailVerified` — gates commission creation. Set to `true` by `verifyEmail()`.
- `referralCodeActive` — admin can deactivate compromised referral codes.

### 1.2 PartnerCommission — unique constraint

```prisma
@@unique([partnerId, sourceTransactionId, level])
```

Prevents duplicate commissions from retries or race conditions.

### 1.3 PartnerCommission — soft-delete partner reference

Change from cascade delete to SetNull:

```prisma
partnerId  String?  @map("partner_id")
partner    User?    @relation("PartnerCommissions", fields: [partnerId], references: [id], onDelete: SetNull)
```

Preserves commission audit trail when partner is deleted/banned.

### 1.4 New environment variables

```env
TURNSTILE_SITE_KEY=           # Cloudflare public key
TURNSTILE_SECRET_KEY=         # Cloudflare server secret
FRONTEND_BASE_URL=            # e.g. https://movieplatform.ru
NEXT_PUBLIC_TURNSTILE_SITE_KEY=  # Same as TURNSTILE_SITE_KEY, for frontend
```

### Files modified
- `apps/api/prisma/schema.prisma`

---

## Phase 2A: Registration Flow Hardening

### 2A.1 Cloudflare Turnstile guard

New NestJS guard: `apps/api/src/common/guards/turnstile.guard.ts`
- Extracts `turnstileToken` from request body
- POSTs to `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Throws `BadRequestException` on failure
- Graceful skip when `TURNSTILE_SECRET_KEY` is not set (dev mode)

Applied to `POST /auth/register` in `auth.controller.ts` via `@UseGuards(TurnstileGuard)`.

### 2A.2 RegisterDto — add Turnstile token + referral code validation

```typescript
// New field
@IsOptional()
@IsString()
turnstileToken?: string;

// Enhanced referral code validation
@Matches(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/, {
  message: 'Реферальный код содержит недопустимые символы',
})
```

### 2A.3 Use `isValidReferralCodeFormat()` before DB lookup

In `auth.service.ts:register()`:
```typescript
if (dto.referralCode) {
  const normalizedCode = normalizeReferralCode(dto.referralCode);
  if (!isValidReferralCodeFormat(normalizedCode)) {
    referredById = undefined;
  } else {
    const referrer = await this.usersService.findByReferralCode(normalizedCode);
    if (referrer && referrer.referralCodeActive) {
      referredById = referrer.id;
    }
  }
}
```

### 2A.4 Self-referral prevention

Compare referrer email with registrant email:
```typescript
if (referrer && referrer.email === dto.email.toLowerCase()) {
  referredById = undefined;
}
```

### 2A.5 Minor partner eligibility

Skip partner relationship for minors:
```typescript
if (referredById && !userIsMinor) {
  await this.createPartnerRelationship(referredById, user.id, tx);
}
```

### 2A.6 Tighten rate limiting

In `throttle.decorator.ts`, Register config:
- `limit: 2` (was 3)
- `blockDuration: 1800000` (30min, was 10min)

### Files modified
- `apps/api/src/common/guards/turnstile.guard.ts` (new)
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/dto/register.dto.ts`
- `apps/api/src/common/decorators/throttle.decorator.ts`

---

## Phase 2B: Transaction Safety & Commission Integrity

### 2B.1 Wrap registration in Prisma transaction

User creation + partner relationship creation become atomic via `prisma.$transaction()`. `createPartnerRelationship()` gains optional `tx` parameter.

### 2B.2 Circular chain prevention

Before creating relationships, check if referralId is already an ancestor of partnerId:
```typescript
const existingChain = await tx.partnerRelationship.findFirst({
  where: { partnerId: referralId, referralId: partnerId },
});
if (existingChain) return; // Skip silently
```

### 2B.3 Commission clawback on refund

New method `partnersService.clawbackCommissions(transactionId)`:
- PENDING → auto-cancel (CANCELLED)
- APPROVED/PAID → create audit log entry for admin review

Called from `payments.service.ts:processRefund()` after updating transaction status.

### 2B.4 Email verification gate

In `auth.service.ts:verifyEmail()`: set `emailVerified: true`.
In `partners.service.ts:calculateAndCreateCommissions()`: skip if purchaser `emailVerified === false`.

### 2B.5 Balance query atomicity

Wrap `getAvailableBalance()` in `prisma.$transaction()` with `RepeatableRead` isolation.

### 2B.6 Withdrawal partner status check

Check `isActive` and `emailVerified` before allowing withdrawal.

### Files modified
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/partners/partners.service.ts`
- `apps/api/src/modules/payments/payments.service.ts`

---

## Phase 2C: Partner Dashboard & Commission Workflow

### 2C.1 PartnerDashboardDto — add referralCode + referralUrl

Inject `ConfigService` into `PartnersService`. Fetch user's referralCode, construct URL from `FRONTEND_BASE_URL` env var.

### 2C.2 Commission approval/rejection endpoints

New methods in `partners.service.ts`:
- `approveCommissions(ids: string[]): Promise<number>`
- `rejectCommissions(ids: string[], reason: string): Promise<number>`

New admin-only endpoints:
- `PATCH /partners/admin/commissions/approve`
- `PATCH /partners/admin/commissions/reject`

Protected by `JwtAuthGuard` + `RolesGuard` (ADMIN only).

### 2C.3 Min commission threshold

Constant `MIN_COMMISSION_AMOUNT = 0.01` (1 kopeck). Filter out sub-kopeck commissions.

### 2C.4 Audit log for referral code usage

Inside the registration transaction, create audit entry with: referralCode, referrerId, ipAddress, deviceInfo.

### 2C.5 Referral code deactivation

Check `referralCodeActive` when looking up referrer. Admin can toggle via existing user management.

### Files modified
- `apps/api/src/modules/partners/partners.service.ts`
- `apps/api/src/modules/partners/partners.controller.ts`
- `apps/api/src/modules/partners/dto/partner-dashboard.dto.ts`
- `apps/api/src/modules/partners/dto/index.ts` (new DTOs for approve/reject)

---

## Phase 2D: Frontend Fixes

### 2D.1 Cloudflare Turnstile widget

Install `@marsidev/react-turnstile`. Add `<Turnstile>` component to `register/page.tsx`. Pass `turnstileToken` in registration payload. New env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

### 2D.2 Zod schema validation

```typescript
referralCode: z.string()
  .regex(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,12}$/, 'Недопустимые символы в коде')
  .optional()
  .or(z.literal('')),
```

### 2D.3 sessionStorage persistence

On mount: if `ref` URL param exists, save to `sessionStorage`. On form init: read from sessionStorage as fallback.

### 2D.4 User feedback on code failure

After registration, if referral code was provided but response user has no `referredById`, show info toast.

### 2D.5 Auto-uppercase + character filter

`onChange` handler strips invalid characters and uppercases input in real-time.

### Files modified
- `apps/web/app/(auth)/register/page.tsx`
- `apps/web/hooks/use-auth.ts` (add turnstileToken to register mutation)
- `apps/web/package.json` (add @marsidev/react-turnstile)

---

## Phase 2E: Fraud Logging

IP + device info logged in the audit entry from 2C.4. No separate fraud detection engine — data is available for admin queries and future ML integration.

---

## Phase 3: Tests

### Backend unit tests
- `partners.service.spec.ts`: clawback, circular chain, email gate, min commission, approve/reject
- `auth.service.spec.ts`: self-referral, minor eligibility, Turnstile guard, referral format validation
- `turnstile.guard.spec.ts`: success, failure, dev-mode skip

### Backend E2E
- `partners.e2e-spec.ts`: commission approval endpoints, withdrawal with unverified email, refund clawback

### Frontend E2E
- `referral-registration.spec.ts`: valid/invalid code, Turnstile renders, sessionStorage persistence, auto-uppercase

---

## Verification Plan

1. **Schema migration:** `npm run db:migrate:dev` — verify new fields exist in DB
2. **Backend unit tests:** `npm run test -- --filter=partners --filter=auth`
3. **Backend E2E:** `npm run test:e2e -- --filter=partners`
4. **Frontend build:** `npm run build --filter=web` — no type errors
5. **Frontend E2E:** `npx playwright test referral-registration`
6. **Manual smoke test:**
   - Register with valid referral code → relationship created
   - Register with invalid code → no crash, code silently ignored
   - Register minor with code → no PartnerRelationship created
   - Refund a payment → PENDING commissions cancelled
   - Unverified email user purchase → no commissions created
   - Verify email → subsequent purchases generate commissions
   - Admin approve/reject commissions → status transitions correctly

---

## Issues Covered (29 of 31)

| # | Issue | Phase |
|---|-------|-------|
| 1 | Commission clawback on refund | 2B.3 |
| 2 | Race condition in partner relationship creation | 2B.1 |
| 3 | Unique constraint on commissions | 1.2 |
| 4 | referralUrl/Code missing in PartnerDashboardDto | 2C.1 |
| 5 | No CAPTCHA/bot protection | 2A.1 |
| 6 | Self-referral not prevented | 2A.4 |
| 7 | Circular referral chains | 2B.2 |
| 8 | No fraud detection (IP/device) | 2E |
| 9 | Email verification not enforced | 2B.4 |
| 10 | Rate limiting too lenient | 2A.6 |
| 11 | Balance query race condition | 2B.5 |
| 12 | Synchronous commission in payment tx | 2B.3 (stays sync but atomic) |
| 13 | No commission approval workflow | 2C.2 |
| 14 | Cascade delete loses commissions | 1.3 |
| 15 | isValidReferralCodeFormat unused | 2A.3 |
| 16 | DTO missing @Matches for code | 2A.2 |
| 17 | Frontend Zod schema no validation | 2D.2 |
| 18 | Minors can become partners | 2A.5 |
| 19 | Withdrawal without status check | 2B.6 |
| 20 | No min/max commission amount | 2C.3 |
| 21 | No code expiry/revocation | 2C.5 |
| 22 | Referral URL domain not configurable | 2C.1 |
| 23 | No audit log for referral usage | 2C.4 |
| 24 | Referral code not persisted in sessionStorage | 2D.3 |
| 25 | No frontend code pre-validation | 2D.2 + 2D.5 |
| 26 | Silent ignore → no user feedback | 2D.4 |
| 27 | Commission rates hardcoded | Deferred (tech debt) |
| 28 | Double normalization | Deferred (low) |
| 29 | Clipboard error handling | Deferred (low) |

Issues #27-29 deferred as low-priority tech debt (option B scope excluded low items).
