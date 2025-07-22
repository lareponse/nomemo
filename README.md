# nomemo

Ephemeral filesystem-based chat with quote disguise interface.

## Architecture

**Transport**: Files as temporary message queue
- `{timestamp}_{sender}.txt` in room directories
- Messages deleted after recipient reads them
- Zero persistence on server

**Storage**: Client-side localStorage
- Complete conversation history per user
- Survives server restarts/cleanup

**Interface**: Dual-mode frontend
- Quote grid with hidden chat entrance
- Secret position randomized per session

## Protocol

**POST** `nomemo.php?room=X&from=Y`
- Writes message to `{room}/{timestamp}_{sender}.txt`
- Returns 204

**GET** `nomemo.php?room=X&from=Y`
- Returns JSON array of messages not from requesting user
- Deletes returned message files
- Auto-polling every 1s during active session

## Files

- `nomemo.php` - Backend message broker
- `spikizi.html` - Dual-mode frontend
- `nomemo.js` - Chat logic + quote display
- `spikizi.css` - Glass morphism styling

## Usage

```bash
php -S localhost:8000