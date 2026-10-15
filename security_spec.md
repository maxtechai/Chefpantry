# Security Specification: ChefPantry Rules & ABAC Guard

## 1. Data Invariants
1. Only authenticated administrators with verified emails matching `maxburguer2022@gmail.com` or documented in `/admins/$(request.auth.uid)` can modify `/recipes`, create administrative resources, or manage system parameters.
2. User profile documents `/users/{userId}` can only be read or written by the respective owner (`request.auth.uid == userId`) or an admin.
3. Users cannot elevate their own role to 'admin' during creation or update.
4. No document ID may exceed 128 bytes or contain invalid characters (`^[a-zA-Z0-9_\-]+$`).
5. Blanket reads (`allow list: if isSignedIn()`) are strictly forbidden.

## 2. The "Dirty Dozen" Vulnerability Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Admin Read**: An unauthenticated user attempts `get /admins/{anyId}`.
2. **Unauthenticated Admin Write**: An unauthenticated user attempts `create /admins/{anyId}` with `{ "email": "maxburguer2022@gmail.com", "role": "admin" }`.
3. **Non-Admin Recipe Creation**: A standard authenticated user (`uid: attacker_123`, `email: attacker@gmail.com`) attempts `create /recipes/recipe_1`.
4. **Non-Admin Recipe Deletion**: A standard authenticated user attempts `delete /recipes/recipe_1`.
5. **Admin Identity Spoofing**: An unverified email user claiming `email: maxburguer2022@gmail.com` without `email_verified == true`.
6. **Self Privilege Escalation**: User `uid: user_abc` attempts `update /users/user_abc` with `{ "role": "admin" }`.
7. **PII Snooping**: User `uid: user_a` attempts `get /users/user_b`.
8. **Resource ID Poisoning**: Attempt to create document with 2KB payload or malicious ID `../../root`.
9. **Shadow Field Injection**: Attempt to write undocumented keys (`isSuperGod: true`) into user or recipe documents.
10. **Terminal State Mutation**: Attempt to overwrite immutable creation timestamps or original author ID.
11. **Blanket Query Scraping**: Attempting to query `list /users` without bounding the query to the user's own `userId`.
12. **Malformed Type Injection**: Attempting to pass numbers as titles or arrays where strings are expected.
