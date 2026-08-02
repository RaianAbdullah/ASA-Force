---
name: ASA Mobile Stage 1 UI
description: Welcome, login, and register screen decisions for the ASA Workforce mobile app
---

# ASA Mobile — Stage 1 UI State

## Welcome screen (`app/index.tsx`)
- Logo: `assets/images/asa-logo.png` (Saudi Ministry of Interior seal), 190×190, circular clip
- Title: "Agency of Security Affairs" (18px bold, dark `#1A2332`)
- Arabic name: "وكالة وزارة الداخلية للشون الأمنية"
- Sub-line: "إدارة العمليات الأمنية"
- Background: `#F8F9FB` (light grey)
- Buttons: Sign In (grey `#4A5568` box) + New Employee (white outlined box), centered vertically
- Footer: "Government Internal System · للاستخدام الداخلي فقط" pinned at bottom

## Auth header (`app/(auth)/_layout.tsx`)
- Header background: `colors.light.background` (light grey, NOT navy)
- Header tint/text: `#1A2332` (dark)

## Login screen (`app/(auth)/login.tsx`)
- Logo shown at top (80×80 circular)
- Field: "ID Number / رقم الهوية" — numeric-only, max 10 digits (national ID)
- `outlineWidth: 0` on TextInput to suppress web blue focus ring

## Register screen (`app/(auth)/register.tsx`)
- Logo shown at top (72×72 circular)
- Name fields keyed `firstNameAr` / `lastNameAr` for clear DB identification
- No email field (removed)
- ID Number: 10-digit numeric validation (`/^\d{10}$/`)
- `outlineWidth: 0` on TextInput to suppress web blue focus ring

**Why:** Government internal system — Arabic-first, light professional theme, no consumer-style colours.
