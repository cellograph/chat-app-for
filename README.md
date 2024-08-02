# Chat App

This is a real-time chat application built with Node.js, Express, Socket.IO, and SQLite. It allows users to generate tokens, join chat rooms, and communicate with each other in real-time.

## Deployed App

The application is deployed and accessible at [http://chat-app-nodejs-9sg2.onrender.com/](http://chat-app-nodejs-9sg2.onrender.com/).

## Features

- **Token-Based Authentication:** Users can generate unique tokens to join specific chat rooms.
- **Real-Time Communication:** Messages are sent and received in real-time using Socket.IO.
- **User Count Display:** The number of active users in each chat room is displayed.
- **Message Persistence:** Messages are stored in a SQLite database and are available for users who join the chat room later.
- **Auto-delete Messages:** Messages are deleted from the database when no users are connected with the token.
- **Auto-delete Tokens:** Tokens are deleted from the database when no users are using them.
- **User Colors:** Each user has a unique color for their messages.

## Getting Started

### Prerequisites

- Node.js
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/aleaguiard/chat-app-nodejs
   ```

2. Change to the project directory:

   ```bash
   cd chat-app-nodejs
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Set up the environment variables. Create a `.env` file in the root directory and add the following:

   ```env
   DATABASE_URL=your_database_url
   DATABASE_AUTH_TOKEN=your_database_auth_token
   PORT=3000
   ```

5. Start the server:

   ```bash
   npm start
   ```

6. Open your browser and go to `http://localhost:3000`.

### Usage

1. Generate a token using the "Generate Token" button.
2. Copy the generated token and share it with other users.
3. Enter the token and a username to join the chat session.
4. Start chatting!

http://103.174.50.60:3000/
