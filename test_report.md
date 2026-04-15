# 📋 Invoice Managerium — Auth API Test Report

**Project:** Invoice Managerium  
**Base URL:** `http://localhost:4000`  
**Test Date:** 2026-04-16  
**Tester:** Antigravity AI  
**Status:** ✅ All Tests Passed  

---

## 🧪 Test Summary

| Total Tests | Passed | Failed | Fixed |
|:-----------:|:------:|:------:|:-----:|
| 7 | 7 | 0 | 1 |

---

## 🐛 Bugs Fixed

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Duplicate user registration returned HTTP `200 OK` instead of `409 Conflict` | `user.controller.js` line 33 | Changed status code to `409 Conflict` |

---

## 📡 API Endpoints

> **Base URL:** `http://localhost:4000/api/user`  
> **Content-Type:** `application/json` (all requests)

---

### 1. Register User

`POST /api/user/register`

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Pass@1234",
  "phone": "01712345678"
}
```

#### Validation Rules

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Required, max 30 chars |
| `email` | string | Required, valid email format |
| `password` | string | Required, min 8 chars |
| `phone` | string | Required, must be 11 digits, starts with `01` |

#### Responses

**✅ 201 Created — Success**
```json
{
  "success": true,
  "message": "A verification email sent to john@example.com!"
}
```

**❌ 409 Conflict — Email already registered**
```json
{
  "success": false,
  "message": "User already exist!"
}
```

**❌ 400 Bad Request — Validation error**
```json
{
  "errors": [
    { "path": "phone", "message": "Phone number must be a string!" }
  ]
}
```

---

### 2. Login User

`POST /api/user/login`

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "Pass@1234"
}
```

#### Validation Rules

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | Required, valid email format |
| `password` | string | Required |

#### Responses

**✅ 200 OK — Login successful**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successfull!",
  "user": {
    "_id": "69dfdd91624926db56a728d4",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "01712345678",
    "role": "customer",
    "status": "active",
    "isVerified": false,
    "provider": "credentials",
    "bio": "",
    "image": "",
    "address": {
      "country": "",
      "cityState": "",
      "postalCode": "",
      "taxId": ""
    },
    "socialLinks": {
      "facebook": "",
      "instagram": "",
      "twitter": "",
      "linkedin": ""
    },
    "createdAt": "2026-04-15T18:48:49.628Z",
    "updatedAt": "2026-04-15T18:49:13.334Z"
  }
}
```

> 📝 A `HttpOnly` refresh token cookie (`invoice_refresh`) is also set automatically.

**❌ 404 Not Found — User doesn't exist**
```json
{
  "success": false,
  "message": "User not found!"
}
```

**❌ 404 Not Found — Wrong password**
```json
{
  "success": false,
  "message": "Invalid credential!"
}
```

**❌ 400 Bad Request — Validation error (empty body)**
```json
{
  "errors": [
    { "path": "email", "message": "Invalid email!" },
    { "path": "password", "message": "Password must be a string!" }
  ]
}
```

---

## 🧪 Detailed Test Cases

### TC-01 — Register New User
- **Endpoint:** `POST /api/user/register`
- **Input:** `{ name, email, password, phone }` — all valid
- **Expected:** `201` + success message + email sent
- **Actual:** ✅ `201` — `"A verification email sent to testuser@example.com!"`

---

### TC-02 — Register Duplicate User
- **Endpoint:** `POST /api/user/register`
- **Input:** Same email as TC-01
- **Expected:** `409 Conflict`
- **Actual:** ✅ `409` — `"User already exist!"`
- **Note:** 🐛 Bug fixed (was previously returning `200`)

---

### TC-03 — Login with Correct Credentials
- **Endpoint:** `POST /api/user/login`
- **Input:** Valid email + correct password
- **Expected:** `200` + user object + access token
- **Actual:** ✅ `200` — User data + JWT access token returned

---

### TC-04 — Login with Wrong Password
- **Endpoint:** `POST /api/user/login`
- **Input:** Valid email + wrong password
- **Expected:** `404` + error message
- **Actual:** ✅ `404` — `"Invalid credential!"`

---

### TC-05 — Login with Non-Existent User
- **Endpoint:** `POST /api/user/login`
- **Input:** Email that is not registered
- **Expected:** `404` + error message
- **Actual:** ✅ `404` — `"User not found!"`

---

### TC-06 — Register with Missing Phone
- **Endpoint:** `POST /api/user/register`
- **Input:** `{ name, email, password }` — no phone
- **Expected:** `400` + validation error
- **Actual:** ✅ `400` — `[{ path: "phone", message: "Phone number must be a string!" }]`

---

### TC-07 — Login with Empty Body
- **Endpoint:** `POST /api/user/login`
- **Input:** `{}`
- **Expected:** `400` + validation errors
- **Actual:** ✅ `400` — errors for `email` and `password` fields

---

## 🔧 Quick cURL Commands for Testers

### Register
```bash
curl -X POST http://localhost:4000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Pass@1234","phone":"01712345678"}'
```

### Login
```bash
curl -X POST http://localhost:4000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Pass@1234"}'
```

---

## 📌 Notes for Testers

> [!IMPORTANT]
> After registration, the user will receive a **verification email**. The account will have `"isVerified": false` until the link in the email is clicked. Login **does not require** email verification — users can log in immediately after registration.

> [!NOTE]
> The `access_token` returned from login is a **JWT Bearer token**. For protected endpoints, include it in the `Authorization` header:
> ```
> Authorization: Bearer <access_token>
> ```

> [!NOTE]
> A `HttpOnly` cookie named `invoice_refresh` is set on login. This is used internally for token refresh and does **not** need to be sent manually by the client.
