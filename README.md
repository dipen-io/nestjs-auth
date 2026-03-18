# 🔐 NestJS Auth System

A production-ready authentication system built with **NestJS**, **Drizzle ORM**, **PostgreSQL**, and **Argon2**.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Password Hashing | Argon2 |
| Authentication | JWT (Access + Refresh Tokens) |
| Email | Nodemailer (Gmail SMTP) |
| Validation | class-validator |

---

## 📁 Project Structure

```
src/
├── auth/
│   ├── decorator/
│   │   └── current-user.decorator.ts
│   ├── dto/
│   │   ├── create-auth.dto.ts
│   │   ├── change-password.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   ├── verify-otp.dto.ts
│   │   └── verify-email.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt-refresh.guard.ts
│   │   └── verified.guard.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── jwt-refresh.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   └── users.repository.ts
├── mail/
│   ├── mail.module.ts
│   └── mail.service.ts
├── database/
│   ├── database.provider.ts
│   ├── schema/
│   │   └── users.ts
│   └── types.ts
├── config/
│   └── env.validation.ts
├── common/
│   └── interceptors/
│       └── response.interceptor.ts
└── main.ts
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root of your project:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# JWT
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Mail (Gmail SMTP)
MAIL_USER=yourgmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password

# App
APP_URL=http://localhost:3000
PORT=3000
```

> **Gmail App Password** — Go to Google Account → Security → 2-Step Verification → App Passwords → Generate one. Do **not** use your real Gmail password.

---

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Run database migrations
npx drizzle-kit generate
npx drizzle-kit migrate

# Start in development
npm run start:dev

# Start in production
npm run start:prod
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Guard |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user + send verification OTP | — |
| `POST` | `/auth/login` | Login with email + password | — |
| `POST` | `/auth/refresh` | Rotate access + refresh tokens | JwtRefreshGuard |
| `POST` | `/auth/logout` | Logout + invalidate refresh token | JwtAuthGuard |
| `PATCH` | `/auth/change-password` | Change password | JwtAuthGuard |
| `POST` | `/auth/forgot-password` | Send OTP to email for password reset | — |
| `POST` | `/auth/reset-password` | Reset password using OTP | — |
| `POST` | `/auth/verify-email` | Verify email with OTP | JwtAuthGuard |
| `POST` | `/auth/resend-verification` | Resend email verification OTP | JwtAuthGuard |
| `GET` | `/auth/profile` | Get current user profile | JwtAuthGuard + VerifiedGuard |

---

## 📋 Request & Response Examples

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "securePass123"
}
```
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Please verify your email.",
    "user": { "id": "uuid", "email": "john@example.com", "fullname": "John Doe" }
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePass123"
}
```
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci..."
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

### Change Password
```http
PATCH /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "oldPassword": "securePass123",
  "newPassword": "newSecurePass456"
}
```

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Reset Password (OTP)
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "482910",
  "newPassword": "newSecurePass456"
}
```

### Verify Email
```http
POST /auth/verify-email
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "otp": "123456"
}
```

---

## 🔒 Security Features

| Feature | Details |
|---|---|
| Password Hashing | Argon2 (resistant to GPU attacks) |
| Refresh Token | Stored as Argon2 hash in DB — never plain text |
| Token Rotation | New refresh token issued on every `/refresh` call |
| OTP Hashing | OTPs hashed with Argon2 before storing |
| OTP Expiry | 5 minutes |
| OTP Attempts | Locked after 5 wrong attempts |
| Email Enumeration | Forgot password always returns same message |
| Password Change | Invalidates all sessions (force re-login) |
| Password Reset | Invalidates all sessions (force re-login) |
| Route Protection | Unverified users blocked from sensitive routes |

---

## 🔑 Token Strategy

```
Access Token  → short-lived (15m)  → used for API requests
Refresh Token → long-lived (7d)    → used to get new access token

On login               → both tokens issued
On /refresh            → both tokens rotated (old refresh invalidated)
On logout              → refresh token cleared from DB
On password change     → refresh token cleared (all devices logged out)
On password reset      → refresh token cleared (all devices logged out)
```

---

## 🛡️ Guards

```typescript
// Requires valid access token
@UseGuards(JwtAuthGuard)

// Requires valid refresh token — only for /refresh route
@UseGuards(JwtRefreshGuard)

// Requires valid access token + verified email
@UseGuards(JwtAuthGuard, VerifiedGuard)
```

---

## 📧 OTP Flow

```
Trigger (register / forgot-password)
        ↓
Generate 6-digit OTP
        ↓
Hash with Argon2 → store in DB with 5min expiry
        ↓
Send raw OTP to user email
        ↓
User submits OTP
        ↓
Wrong OTP   → increment attempts → "X attempts remaining"
5 attempts  → OTP cleared       → "request a new OTP"
Expired     → OTP cleared       → "request a new OTP"
Correct     → action performed  → OTP cleared from DB
```

---

## 🗄️ Database Schema

```typescript
users {
  id                  uuid          PK
  fullname            varchar(255)
  email               varchar(255)  UNIQUE
  password            varchar(255)
  refreshToken        varchar(512)  NULLABLE
  isEmailVerified     boolean       DEFAULT false
  emailOtp            varchar(255)  NULLABLE
  emailOtpExpiry      timestamp     NULLABLE
  emailOtpAttempts    integer       DEFAULT 0
  otpToken            varchar(255)  NULLABLE
  otpExpiry           timestamp     NULLABLE
  otpAttempts         integer       DEFAULT 0
  role                enum          DEFAULT 'user'
  createdAt           timestamp     DEFAULT now()
  updatedAt           timestamp     DEFAULT now()
}
```

---

## 📦 Dependencies

```bash
# Core
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install drizzle-orm pg
npm install argon2
npm install nodemailer
npm install class-validator class-transformer

# Dev
npm install -D drizzle-kit @types/nodemailer @types/pg
```

---

## 🧪 Quick Test with curl

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullname":"John","email":"john@example.com","password":"pass12345"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass12345"}'

# Profile (replace TOKEN)
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

---

## 👤 Author

Built with ❤️ using NestJS + Drizzle ORM
