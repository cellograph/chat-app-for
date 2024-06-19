# Chat Application

This is a simple chat application built using Node.js, Express, Socket.io, and SQLite. The application allows users to generate tokens, connect with those tokens, and chat with others using the same token. Messages are stored in the database and can be retrieved when users reconnect.

## Features

-   **Token Generation:** Users can generate a unique token to join a chat session.
-   **Authentication:** Users must provide a valid token and username to connect to a chat session.
-   **Message Storage:** Messages are stored in a SQLite database and retrieved when users reconnect.
-   **Auto-delete Messages:** Messages are deleted from the database when no users are connected with the token.
-   **Auto-delete Tokens:** Tokens are deleted from the database when no users are using them.

-   **Unique User Colors:** Each user is assigned a unique color for their messages.

## Getting Started

### Prerequisites

-   Node.js
-   npm (Node Package Manager)

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
