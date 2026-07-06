# GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION

GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION is an IAM-integrated agreement management system for MFU. It includes:

- Backend API for GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION registry records.
- Vue frontend for dashboard, GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION registry, account directory, settings, and permission management.
- IAM delegated authentication and permission filtering.
- Local/server Docker Compose files.
- GitLab CI and GitLab deploy compose templates for Harbor-based delivery.

## Runtime Ports

- Backend local port: `8206`
- Frontend local port: `8080`
- Production domain: `https://graduation-system-using-face-recognition.mfu.ac.th`

## Local Run

Run both local services from the repository root:

```bash
npm start
```

Open `http://localhost:8080`.

The root start script reuses an already-running backend on `http://127.0.0.1:8206/healthz` and starts only the missing service.

Do not run `docker compose` on this machine unless Docker Desktop is installed.

## Docker Run

Use this only on a machine with Docker Desktop installed:

```bash
docker compose --env-file .env.local up -d --build
```

Open `http://localhost:8080`.

## Server Run

```bash
APP_ENV=prod ./server.sh deploy
```

The server compose binds backend and frontend to `127.0.0.1` by default so Nginx can publish the public domain.

## Backend Scripts

Run inside `backend-node`:

- `npm run start:local`
- `npm run test:contracts`
- `npm run register:iam:local`
- `npm run bootstrap:local`
- `npm run bootstrap`
- `npm run import:graduate-csv:local -- --file "D:\path\graduates.csv" --dry-run`
- `npm run reset:permissions`
- `npm run smoke:live:user`

## Import Graduate Registration CSV

Use this when you want to test the graduation registration flow with real form data instead of manually typing each graduate.

```bash
cd backend-node
npm run import:graduate-csv:local -- --file "D:\path\graduates.csv" --dry-run
npm run import:graduate-csv:local -- --file "D:\path\graduates.csv"
```

The importer writes to `Graduate_Registration` and defaults to upsert by `barcodeValue`, then `email`, then `phone + firstName + lastName`. Supported CSV headers include the backend field names such as `firstName`, `lastName`, `firstNamePronunciation`, `lastNamePronunciation`, `phone`, `email`, `school`, `program`, `ceremonyStatus`, `barcodeValue`, plus common Thai labels from the registration form such as `ชื่อจริง`, `นามสกุล`, `สะกดชื่อจริงสำหรับผู้อ่านประกาศ`, `เบอร์ติดต่อ`, `อีเมล`, `สำนักวิชา`, `สาขา/หลักสูตร`, and address fields.

## Important

Real env files are present in this workspace and ignored by git. Do not commit secrets. Register the GRADUATIONSYSTEMUSINGFACERECOGNITIONGRADUATIONSYSTEMUSINGFACERECOGNITION IAM managed client before production login is expected to work end-to-end. Set `PROJECT_PERMISSION_ACCOUNT_EMAIL` or `PROJECT_PERMISSION_ACCOUNT_ID` before running bootstrap; `npm run bootstrap:local` creates the Permission Matrix rows and assigns the configured owner account to the project owner group.
