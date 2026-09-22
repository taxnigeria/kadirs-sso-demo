# KADIRS Auth System 2.0 — Demonstration Presets & Evaluator Guide

> **Official Testing Document for Technical Bid Evaluation**  
> **Kaduna State Internal Revenue Service (KADIRS)**  
> **Platform:** Unified Identity & Access Management Platform (Auth 2.0)

---

## 1. Overview

To maintain strict compliance with government security presentation guidelines, **all demo presets, sample hints, and pre-filled inputs have been hidden from the user interface**. Form fields appear blank and unprompted to mirror the genuine production experience.

This document serves as the master cheat sheet for evaluators, demonstrators, and technical assessors to test every journey, verification challenge, and edge case.

---

## 2. Universal Master Credentials

| Credential Type | Value | Behavior |
| :--- | :--- | :--- |
| **Universal Demo Password** | `Kaduna2024!` | Accepted across all seed accounts. |
| **Universal 2FA / OTP Code** | `123456` or `000000` | Universal verification bypass accepted on any carrier route (SMS, WhatsApp, Voice, Email) without exposing the secret on screen. |
| **OTP Validity Window** | **5 minutes** | Code expires after 5 minutes; 3 max failed attempts before invalidation. |
| **Brute-Force Rate Limiting** | **3 failed attempts** | Triggers automated 30-second lockout with active countdown timer. |

---

## 3. Seed Personas & Interactive Journeys

### Journey 1: New Citizen Registration (NIMC & LGA Tax Office)
* **Goal:** Prove instant 11-digit NIN verification, NIMC locked attributes, automated tax office assignment, and NDPA 2023 compliance.
* **URL:** `/auth/register` (Select **Individual Citizen**)
* **Test NIN:** `77788899900` *(or any random 11-digit number)*
* **Expected Citizen Data:**
  - **Legal Name:** Amina Gambo Yusuf *(Locked / Read-Only)*
  - **Date of Birth:** 1995-11-23 *(Masked until verified)*
  - **Gender:** Female
  - **NIN Registered Phone:** `+234 814 555 1212` *(Masked on-screen as `0814 •••• 212` — first 4 and last 3 digits)*
  - **Phone Carrier Challenge:** Code is dispatched directly to the official NIN-registered phone. Contact channels remain hidden until OTP is verified.
  - **OTP Code:** `123456`
  - **Contact Channels (Unlocked after OTP):** Primary email address * &amp; Mobile phone number * (both required with red asterisks)
* **Assigned LGA / Tax Office:** Kaduna South &rarr; **Kaduna South Tax Office — Barnawa**
* **NDPA 2023 Consent:** All 3 consent checkboxes required before account creation.

---

### Journey 2: Corporate Entity Registration (CAC & Director Validation)
* **Goal:** Prove CAC RC number verification, corporate attribute locking, director NIN ownership matching, and corporate authorization OTP.
* **URL:** `/auth/register` (Select **Corporate Entity**)
* **Test RC Number:** `RC-1849204`
* **Expected Corporate Profile:**
  - **Company Name:** Amara Agro-Logistics Ltd *(Locked from CAC)*
  - **Corporate TIN:** `24098192-0001` *(Locked)*
  - **Industry:** Transportation & Warehousing
  - **Official Corporate Email:** `amara.rep@amaraholdings.ng` *(Masked, Read-Only)*
  - **Official Corporate Phone:** `+234 812 987 6543` *(Masked, Read-Only)*
* **Authorized Representative Verification:**
  - **Representative Name:** Amara Chioma Nnamdi
  - **Representative Role:** Managing Director
  - **Authorized Director NIN:** `55566677788` *(Masked input with show/hide eye toggle)*
  - **Director Validation Rule:** If an incorrect NIN is entered, the system flags: *"Representative NIN does not match registered CAC directors for this entity."*
* **Corporate Authorization OTP:** `123456` *(Mandatory before activation)*

---

### Journey 3: Government Agency (MDA) Registration
* **Goal:** Prove manual TIN assignment, mandate document attachment, and Maker/Checker workflow.
* **URL:** `/auth/register` (Select **Government Agency / MDA**)
* **Agency TIN:** `KAD-MIN-FIN-001`
* **Agency Name:** Kaduna State Ministry of Finance
* **Official Email:** `finance@kdsg.gov.ng`
* **Authorized Officer Name:** Aliyu Usman Dangida
* **Officer NIN:** `33322211100`
* **Officer Role:** Director of Finance & Accounts
* **Expected State:** Placed into `PENDING_APPROVAL` status awaiting KADIRS Admin approval.

---

### Journey 4: Hero User Sign-In & Legacy Account Unification
* **Goal:** Prove cross-portal SSO, silent pre-migration record matching, and Recognition Cards.
* **URL:** `/auth/login`
* **Identifier:** `fatimah.a@gmail.com` *(or NIN: `12345678901`)*
* **Password:** `Kaduna2024!`
* **Step 2 (2FA OTP):** `123456`
* **Step 3 (Recognition Interstitial):**
  - Displays pre-migration records matched across 3 legacy systems:
    1. **PayKaduna TSP:** `PAYKAD-USR-8821` (Email: `fatima.abdullahi@yahoo.com`)
    2. **KADVREG Vehicle Registry:** `KADVREG-OWN-4491` (Vehicle: Toyota Corolla `KD-482-ZAR`)
    3. **PIT Personal Income Tax:** `PIT-IND-10492` (TIN: `KAD-PIT-2019-8834`)
  - **Actions:** 1-Click "Unify All Verified Records" or review individually.

---

### Journey 5: Progressive Profiling (Delta Gap Analysis)
* **Goal:** Prove that citizens only supply missing information when accessing new state services.
* **URL:** `/auth/login`
* **Identifier:** `emeka.obi@yahoo.com` *(or NIN: `98765432101`)*
* **Password:** `Kaduna2024!`
* **OTP:** `123456`
* **Action:** In the PayKaduna Dashboard, navigate to **Personal Income Tax (PIT)**.
* **Result:** System performs real-time gap analysis and prompts **only** for missing TIN and employment details.

---

### Journey 6: Reconciliation Conflict & Dispute Queue (Golden Rule Defense)
* **Goal:** Prove that conflicting records cannot be silently unified and must be routed to the Maker/Checker dispute queue.
* **URL:** `/auth/login`
* **Identifier:** `ibrahim.d@gmail.com` *(or NIN: `11122233344`)*
* **Password:** `Kaduna2024!`
* **OTP:** `123456`
* **Navigate to:** `/auth/reconciliation`
* **Conflict Flag:** Shows conflicting legacy record with conflicting NIN warning (`NIN Mismatch: 11122233344 vs legacy 11122299900`), enforcing Golden Rule: Disputed records require human review.

---

## 4. Free-Form Dynamic Simulation (Any Data Testing)

The KADIRS Auth 2.0 prototype contains built-in synthetic generators so evaluators can test arbitrary numbers:

| Field | Input Rule | Simulated Result |
| :--- | :--- | :--- |
| **Any Citizen NIN** | Any 11-digit integer (e.g., `90123456789`) | Generates a verified Nigerian identity with authentic NIMC lookup latency (1.4s), realistic name, and date of birth. |
| **Any CAC RC Number** | Any string starting with `RC-` (e.g., `RC-5544332`) | Generates a valid active CAC corporate record with registered directors and Kaduna commercial address. |
| **Any Phone / Email** | Any Nigerian format (`080...`, `070...`, `081...`) | Triggers SMS carrier simulation; use `123456` to verify. |

---

## 5. Security & Failure Mode Demonstrations

1. **Duplicate NIN Hard Block (NDPA 2023 Enforcement):**
   - On `/auth/register` (Individual), enter pre-registered NIN `12345678901` (Fatima Abdullahi).
   - System immediately displays a red **Duplicate Prohibited Hard Block** with a one-click redirect to Sign In.
2. **Duplicate Email Hard Block:**
   - On `/auth/register` (Individual), enter `fatimah.a@gmail.com` in the editable email field.
   - System flags a real-time hard block blocking progression until a unique email is provided.
3. **Editable Phone & Dynamic OTP Verification:**
   - On `/auth/register` (Individual), modify the phone number to any custom number.
   - System automatically invalidates existing OTP status and requires verifying a fresh code on the new number.
4. **Duplicate Corporate RC Number Hard Block:**
   - On `/auth/register` (Corporate), enter `RC-1849204` (Amara Agro-Logistics Ltd).
   - System triggers a **Corporate Duplicate Hard Block** directing the representative to Corporate Sign In.
5. **Corporate Email / Personal Email Overlap Advisory:**
   - On `/auth/register` (Corporate), enter a personal citizen email (e.g. `fatimah.a@gmail.com`).
   - System displays a prominent advisory warning to use an institutional email; permits proceeding while recording the governance decision in the KADIRS audit trail.
6. **Duplicate Agency TIN Hard Block (Ghost Agency Layer 1):**
   - On `/auth/register` (Government Agency), enter existing TIN `KAD-MIN-FIN-001`.
   - System triggers a **Ghost Agency Prevention Hard Block** preventing dual registration.
7. **Agency Non-.gov.ng Email Advisory:**
   - On `/auth/register` (Government Agency), enter a commercial email (e.g. `ministry@yahoo.com`).
   - System displays an advisory warning and flags the submission prominently for KADIRS Executive Review.
8. **Brute-Force Lockout:**
   - On `/auth/login`, enter an incorrect password shorter than 4 characters (e.g. `123`) 3 consecutive times.
   - The screen will activate a **30-second security lockout** blocking further attempts.
9. **OTP Tamper Defense:**
   - In any OTP verification step, enter an incorrect 6-digit code (e.g. `888888`).
   - The system decrements the attempts counter (`2 attempt(s) remaining`) and locks out after 3 failures.
10. **Resetting Demo State:**
   - Click the **Reset (↺)** button in the top navigation bar at any time to purge localStorage and restore the demo to a clean state.
