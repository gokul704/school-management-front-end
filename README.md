# School Management System - Frontend

A comprehensive school management system built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## Features

### Core Management
- **Student Information Management**: Complete student profiles with personal info, academic records, attendance, and health data
- **Teacher Management**: Teacher profiles, schedules, attendance tracking, and performance monitoring
- **Course Management**: Academic course creation, assignment to teachers, and curriculum tracking
- **Attendance Management**: Digital attendance marking with automated reports and parent notifications

### Admissions & Enrollment
- **Online Admissions**: Digital application forms with document uploads
- **Application Tracking**: Status tracking from pending to enrolled
- **Automated Follow-ups**: Reminder system for incomplete applications
- **Document Management**: Secure storage and verification of admission documents

### Financial Management
- **Fee Management**: Comprehensive fee structure with multiple fee types
- **Payment Tracking**: Real-time payment status and history
- **Online Payments**: Integration ready for payment gateways
- **Financial Reports**: Detailed analytics and reporting

### Academic Features
- **Gradebook**: Online grading system with customizable report cards
- **Assignment Management**: Homework creation, submission tracking, and grading
- **Exam Management**: Exam scheduling, result generation, and performance analytics
- **Timetable Management**: Automated class scheduling with calendar integration

### Communication & Notifications
- **Built-in Communication**: Messaging between staff, students, and parents
- **Push Notifications**: Real-time alerts for important events
- **Announcements**: School-wide announcements and circulars
- **Event Management**: Calendar integration for school events and activities

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: Redux Toolkit
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd school-management-front-end
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=School Management System
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── (auth)/              # Authentication routes
│   ├── login/
│   └── register/
├── (dashboard)/         # Protected dashboard routes
│   ├── students/
│   ├── teachers/
│   ├── courses/
│   ├── attendance/
│   ├── admissions/
│   ├── financial/
│   ├── academics/
│   ├── communications/
│   └── settings/
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components
│   ├── auth/           # Auth components
│   └── providers/      # Context providers
├── lib/                 # Utilities and helpers
│   ├── api/            # API client and endpoints
│   ├── store/          # Redux store configuration
│   └── utils/          # Helper functions
└── types/              # TypeScript type definitions
```

## API Integration

The frontend expects a Node.js backend API running on `http://localhost:3001/api` (configurable via environment variables).

### API Endpoints Structure

- `/auth/*` - Authentication endpoints
- `/students/*` - Student management
- `/teachers/*` - Teacher management
- `/courses/*` - Course management
- `/attendance/*` - Attendance tracking
- `/admissions/*` - Admission applications
- `/financial/*` - Financial management
- `/academics/*` - Academic features
- `/communications/*` - Communication features
- `/notifications/*` - Notification management

## Authentication

The application uses JWT-based authentication with token refresh mechanism. Tokens are stored in localStorage.

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API base URL (default: `http://localhost:3001/api`)
- `NEXT_PUBLIC_APP_NAME`: Application name

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
