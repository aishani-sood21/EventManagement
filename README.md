# EventHub - IIIT Event Management Platform

## Table of Contents
- [Overview](#overview)
- [Libraries, Frameworks, and Modules](#libraries-frameworks-and-modules)
- [Advanced Features Implemented](#advanced-features-implemented)
- [Design Choices & Technical Decisions](#design-choices--technical-decisions)
- [Setup and Installation Instructions](#setup-and-installation-instructions)
- [Justification for Libraries/Frameworks](#justification-for-librariesframeworks)

---

## Overview
Eventure is a full-stack event management platform for IIIT, supporting club/organizer management, event creation, participant registration, attendance, and security features. It is built with a modern React frontend and a Node.js/Express backend, using MongoDB for data storage.

---

## Libraries, Frameworks, and Modules

### Frontend
- **React**: Modular, component-based UI development.
- **Vite**: Fast development server and build tool for React.
- **(UI Library, e.g., Tailwind CSS/Bootstrap/Material-UI)**: For rapid, responsive UI development.
- **axios**: For HTTP requests to backend APIs.
- **react-router-dom**: For SPA routing.

### Backend
- **Node.js**: JavaScript runtime for server-side logic.
- **Express**: Web framework for REST APIs.
- **Mongoose**: ODM for MongoDB.
- **jsonwebtoken**: For JWT-based authentication.
- **nodemailer**: For sending emails (e.g., registration, password reset).
- **Other modules**: (e.g., bcrypt for password hashing, rate-limiter, etc.)

**Justification:**
- React and Vite provide a fast, modular, and maintainable frontend.
- Express and Node.js are lightweight and flexible for REST APIs.
- MongoDB (with Mongoose) is schema-flexible and ideal for event/registration data.
- Chosen UI library (e.g., Tailwind) enables rapid, consistent UI development.

---

## Advanced Features Implemented

### Tier A
- Merchandise Payment Approval Workflow
- QR Scanner & Attendance Tracking

### Tier B
- Real-Time Discussion Forum
- Organizer Password Reset Workflow

### Tier C
- Bot Protection

#### For each feature:
- **Justification for selection:**
  - Security, usability, and automation are critical for event management.
- **Design & Implementation Approach:**
  - Modular controllers/services, RESTful APIs, reusable React components.
- **Technical Decisions:**
  - JWT for stateless auth, MongoDB for flexible data, modular code for maintainability.

---

## Design Choices & Technical Decisions
- **Frontend/Backend separation** for scalability and independent deployment.
- **MongoDB** for flexible, document-based storage.
- **JWT authentication** for stateless, scalable security.
- **Error handling** via middleware and consistent API responses.
- **Folder structure**: Clear separation of controllers, models, routes, and services.

---

## Setup and Installation Instructions

### Prerequisites
- Node.js (v16+ recommended)
- npm
- MongoDB (already connects with cloud)

### Backend
```bash
cd backend
npm install
# Set up environment variables (see config/emailConfig.ts, config/googleCloudStorage.ts)
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Other Setup
- Place your Google Cloud credentials in `backend/gcs-key.json`.
- Configure email settings in `backend/src/config/emailConfig.ts`.

### Running Locally
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5050](http://localhost:5050) (or your configured port)




