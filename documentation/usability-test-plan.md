# ASA-Force Controlled Usability Test Plan

## 1. Purpose

This evaluation examines whether invited participants can understand and complete the main ASA-Force workflow. It is a university prototype evaluation, not a production trial.

The evaluation will answer these questions:

1. Can a new user register using the supplied fictional details?
2. Can the administrator find and approve the registration?
3. Can the participant sign in and identify their assigned department?
4. Can the participant find their schedule, announcements, messages, and profile?
5. Can the participant switch between Arabic and English and understand the layout?

## 2. Scope

The first pilot should involve three to five invited classmates. Increase this number only after the first pilot is stable and any university ethics requirements have been confirmed with the supervisor.

The following functions are included:

- registration with a supplied fictional identity;
- administrator approval;
- login and logout;
- department display;
- navigation between employee pages;
- Arabic and English switching;
- submitting a fictional leave request, if that function is stable.

The following functions are excluded from the first pilot:

- real attendance or geolocation collection;
- real national identity numbers or telephone numbers;
- real workplace messages or management notes;
- real employee records;
- uploading personal documents or photographs;
- security penetration testing by participants.

## 3. Preconditions

Before inviting participants, the researcher must:

- obtain the supervisor's agreement and check whether formal ethics approval is required;
- complete a private internal test of the full registration and login journey;
- create one fictional identity for each participant;
- confirm that the administrator can approve and delete test accounts;
- verify that no real SMS message is sent to an unrelated telephone number;
- take a backup or confirm that all pilot data can be safely deleted;
- provide the participant information sheet before testing begins.

## 4. Fictional test-data format

Create a separate identity for each participant. Do not ask participants to invent or reuse personal information.

| Field | Safe example | Rule |
|---|---|---|
| First name | مستخدم | Fictional Arabic name |
| Middle name | تجريبي | Fictional and optional |
| Last name | واحد | Fictional participant number |
| National ID | 9000000001 | Reserved project test range only |
| Phone number | 0500000001 | Must not belong to a real person |
| Password | Supplied temporary password | Must not be reused from another account |
| Department | Test Department | Do not use a real employment assignment |

Before using any test phone number, verify that the prototype does not send a real SMS to it. If SMS delivery is active, use approved test numbers from the provider or disable delivery in the test environment.

## 5. Participant tasks

Give the tasks one at a time without explaining where each button is located.

1. Read the participant information and confirm voluntary participation.
2. Open the supplied ASA-Force test link.
3. Register using the supplied fictional identity.
4. Tell the researcher when the waiting-for-approval screen appears.
5. Wait while the researcher approves the account and assigns the Test Department.
6. Sign in using the supplied credentials.
7. Find and state the department shown on the dashboard.
8. Find the weekly schedule page.
9. Find the announcements page.
10. Switch the application language to English, then back to Arabic.
11. Find the logout control and sign out.

Optional task, only when stable:

12. Submit a fictional one-day leave request and find its status.

## 6. Data to record

Record only what is necessary for the dissertation evaluation:

- anonymous participant code, such as P01;
- task completed: yes, no, or completed with help;
- approximate task completion time;
- observed error or point of confusion;
- participant rating from 1 to 5;
- short optional feedback in the participant's own words.

Do not record names, student numbers, national IDs, personal phone numbers, real passwords, precise location, or unrelated personal comments.

## 7. Success criteria

The initial pilot is considered ready for a larger evaluation when:

- every participant reaches the waiting-for-approval screen;
- every approved participant can log in;
- at least 80% of core tasks are completed without assistance;
- no participant is shown another participant's private information;
- no real personal data is entered;
- no serious application or security failure occurs.

These are planned criteria, not results. Results must be recorded only after the evaluation is performed.

## 8. Stop conditions

Stop the evaluation immediately if:

- a participant can see another user's private information;
- the application requests or exposes real credentials;
- an unexpected SMS, email, or push notification is sent;
- location is collected without informed agreement;
- the API or database becomes unstable;
- a participant wishes to withdraw.

Record the issue without recording sensitive data, fix it, and repeat the internal test before inviting another participant.

## 9. End-of-test procedure

After the evaluation:

1. Export only the anonymous results needed for analysis.
2. Delete the fictional participant accounts and related sessions.
3. Delete test messages, leave requests, schedules, and tokens.
4. Confirm that the deletion succeeded.
5. Store consent and evaluation records according to university guidance.
6. Report findings honestly, including failures and limitations.

