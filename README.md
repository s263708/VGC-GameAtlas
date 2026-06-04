# GameAtlas

This README file serves as a backup in case deployment does not work, or any other similar errors occur involved in the deployment/replication process.

---

## Technology Stack

### Frontend

* React Native
* Expo
* React Navigation
* AsyncStorage

### Backend

* Node.js
* Express.js

### Database

* SQLite

### Authentication

* JWT
* bcrypt

### External API

* IGDB API

---

## Installation

### 1. Clone the repository

```bash
git clone [repository-url]
cd GameAtlas
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Create a .env file

Inside the server directory create a file named:

```text
.env
```

Add the following variables:

```env
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret
PORT=5000
```
The Twitch client variables are required by the IGDB, see here for more documentation on that: https://www.igdb.com/api

### 5. Start the backend

```bash
cd server
node index.js
```

or

```bash
npm start
```

### 6. Start the frontend

```bash
npx expo start
```

---

## Local Development Configuration

When running the application on a physical device using Expo Go, replace localhost with the local IPv4 address of the machine hosting the backend server.

Example:

```text
http://192.168.1.100:5000
```

Both devices must be connected to the same local network.

---

## Database

The repository includes an SQLite database used during development and testing.

The database contains sample data used to demonstrate application functionality.

---

## Project Structure

```text
GameAtlas
│
├── assets/
├── components/
├── context/
├── navigation/
├── screens/
├── server/
│   ├── database/
│   ├── routes/
│   └── index.js
│
├── App.js
├── package.json
└── README.md
```

---

## Project Information

Project Title:
GameAtlas – Video Game Discovery and Cataloguing Mobile Application

Student:
Jack Hart (S263708)

Module:
Final Project – BSc (Hons) Computer Science

University:
University of Suffolk

Submission Date:
05/06/2026
