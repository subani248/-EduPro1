# EduPro1

EduPro1 is an online exam platform with built-in AI-powered proctoring. Teachers can create and publish exams; students take them in a monitored environment where a Python AI engine watches for face presence, gaze direction, and banned objects (phones, books) during the test, and a code playground lets students run code as part of an exam.

**Live demo:** [edupro1-1.onrender.com](https://edupro1-1.onrender.com)

## Features

- **Authentication** — JWT-based login, with teacher and student roles (`protect` / `teacherOnly` middleware)
- **Exam management** — teachers create, publish, and view results for exams; students start and submit exams
- **AI proctoring engine** (Python/FastAPI) — per-frame analysis for:
  - Face detection (no face / multiple faces)
  - Gaze tracking (looking away from screen)
  - Object detection via YOLO (cell phone, book detection)
  - Logged as violation events (`MULTIPLE_FACES`, `NO_FACE`, `SUSPICIOUS_GAZE`, `CELL_PHONE_DETECTED`, `BOOK_DETECTED`)
- **Snapshot capture** — stores proctoring snapshots tied to exam sessions
- **Code playground** — students can run code in-browser as part of an exam
- **File uploads** — question/exam asset uploads via Multer
- **Dashboards** — separate teacher and student dashboard pages

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js, Express 5, Mongoose/MongoDB driver |
| Auth | JWT (`jsonwebtoken`), `bcrypt` for password hashing |
| AI Engine | Python, FastAPI, OpenCV, MediaPipe, Ultralytics (YOLO) |
| Frontend | Static HTML/CSS/JavaScript (served by Express) |
| Database | MongoDB |

## Project Structure

```
EduPro1/
├── backend/
│   ├── ai_engine/         # FastAPI service: face/gaze/object detection
│   │   ├── main.py
│   │   ├── face_detection.py
│   │   ├── gaze_tracking.py
│   │   ├── object_detection.py
│   │   └── requirements.txt
│   ├── config/
│   │   └── db.js          # MongoDB connection (native driver + Mongoose)
│   ├── controllers/        # Route handler logic
│   ├── middleware/          # Auth middleware (protect, teacherOnly)
│   ├── models/              # Mongoose schemas (User, Exam, Question, Submission, Violation, Snapshot)
│   ├── routes/               # Express routers (auth, exams, upload, violations, snapshots, playground)
│   ├── seed.js                # Database seeding script
│   └── server.js               # Express app entry point
├── frontend/
│   ├── index.html
│   ├── exam.html
│   ├── playground.html
│   ├── profile.html
│   ├── student-dashboard.html
│   ├── teacher-dashboard.html
│   ├── css/
│   └── js/
├── package.json
└── package-lock.json
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Python 3.9+ (for the AI proctoring engine)
- A MongoDB instance (local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/subani248/-EduPro1.git
cd -EduPro1
```

### 2. Install backend (Node) dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
```

### 4. Seed the database (optional, creates an initial teacher account)

```bash
npm run seed
```

### 5. Start the backend server

```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start
```

The server runs on `http://localhost:5000` by default and also serves the frontend.

### 6. Set up and run the AI proctoring engine

```bash
cd backend/ai_engine
pip install -r requirements.txt
uvicorn main:app --reload
```

## API Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/login` | Log in | Public |
| POST | `/api/auth/register-teacher` | Register a teacher account | Public |
| POST | `/api/exams` | Create an exam | Teacher |
| GET | `/api/exams` | List exams | Authenticated |
| GET | `/api/exams/results` | Get exam results | Authenticated |
| GET | `/api/exams/:id` | Get exam details | Authenticated |
| PUT | `/api/exams/:id/publish` | Publish an exam | Teacher |
| GET | `/api/exams/:id/start` | Start an exam attempt | Authenticated |
| POST | `/api/exams/:id/submit` | Submit exam answers | Authenticated |
| POST | `/api/upload` | Upload files/assets | Authenticated |
| * | `/api/violations` | Log/query proctoring violations | Authenticated |
| * | `/api/snapshots` | Store/query proctoring snapshots | Authenticated |
| POST | `/api/playground/run` | Run code in the playground | Authenticated |

## License

ISC
