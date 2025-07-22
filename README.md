# nomemo

nomemo is a stateless, ephemeral chat system using nothing but the filesystem and the browser.

## How it works

- Each chat room is a folder: `chat/{room}/`
- Each message is a file: `{timestamp}_{sender}.txt`
- Files are deleted after they are read by the recipient

## Server logic (`exchange.php`)

- `POST`: saves a message from a user into the room folder
- `GET`: returns all messages not sent by the requesting user, then deletes them

## Client (`index.html`)

- Join any room with a name
- Pick a username
- Send and receive messages
- No persistence, no accounts

## Run locally

```bash
php -S localhost:8000
