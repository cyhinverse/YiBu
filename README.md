# YiBu - Social Media Platform

A modern, full-stack social media application built with the MERN stack and containerized with Docker.

## 🚀 Tech Stack

### Frontend (`/client`)

- **Framework**: React (Vite)
- **State Management**: Redux Toolkit (with Persistence)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios

### Backend (`/server`)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Replica Set for Transactions)
- **Caching**: Redis
- **Authentication**: JWT (Access & Refresh Tokens)
- **Real-time**: Socket.IO
- **Storage**: Cloudinary
- **Security**: Helmet, Rate Limiting, XSS Clean, HPP

### DevOps

- **Containerization**: Docker, Docker Compose
- **Environment**: Alpine Linux (Node 20)

## 🛠️ Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Node.js (if running locally without Docker)

## 🏃‍♂️ Getting Started (Docker)

The easiest way to run the application is using Docker Compose.

1.  **Clone the repository**
2.  **Setup Environment Variables**
    - The `docker-compose.yaml` file contains default configurations for development.
    - For production, ensure you create `.env` files and update the secrets.
3.  **Run the application**

```bash
docker compose up --build
```

This will start the following services:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017 (Replica Set `rs0`)
- **Redis**: redis://localhost:6379

## 📂 Project Structure

```
YiBu/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages (Auth, Home, Profile...)
│   │   ├── redux/          # State management slices & actions
│   │   └── ...
│   ├── Dockerfile
│   └── ...
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic (User, Post, Auth...)
│   │   ├── middlewares/    # Auth, Error, RateLimit...
│   │   └── ...
│   ├── Dockerfile
│   └── ...
└── docker-compose.yaml     # Service orchestration
```

## ✨ Key Features

- **Authentication**: Secure Login/Register with JWT & Refresh Tokens.
- **Social Feed**:
  - **For You**: Personalized recommendations (excluding own posts).
  - **Following**: Posts from followed users.
  - **Latest**: Real-time new posts.
- **Interactions**: Like, Comment, Save, Share posts.
- **Real-time Notifications**: Socket.IO integration for instant updates.
- **Search**: Users, Posts, Hashtags.
- **Media**: Image upload support via Cloudinary.
