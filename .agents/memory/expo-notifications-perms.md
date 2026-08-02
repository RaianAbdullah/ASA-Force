---
name: expo-notifications permission type resolution
description: getPermissionsAsync/requestPermissionsAsync return type does not resolve .status or .granted cleanly through tsconfig in this project.
---

**Rule:** Cast the result of `Notifications.getPermissionsAsync()` and `requestPermissionsAsync()` to `any`, then access `.granted` as a boolean.

**Why:** `NotificationPermissionsStatus` extends `PermissionResponse` from `expo-modules-core`, but the TypeScript resolution through the pnpm workspace tsconfig does not surface that base interface's properties. The runtime value does have `.granted` (confirmed by expo-notifications JSDoc example), but tsc rejects property access at compile time.

**How to apply:**
```ts
const perms = await Notifications.getPermissionsAsync() as any;
const granted: boolean = Boolean(perms?.granted);
```
