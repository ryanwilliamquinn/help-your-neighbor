# Mock Data Storage

This application uses a simple, deterministic storage approach:

## Development (Browser)

- **Storage**: File-based storage reading from `public/mock-data.json`
- **Data persistence**: Reads initial state from file, changes are in-memory only
- **Login persistence**: User login state persists across page refreshes using localStorage
- **Usage**: No configuration needed - automatically used when running the app in a browser

## Testing (Unit Tests)

- **Storage**: In-memory storage with clean state for each test
- **Data persistence**: None - each test starts with fresh, empty data
- **Usage**: Automatically used when `NODE_ENV=test`

## How It Works

### File Storage (Development)

- Reads initial data from `public/mock-data.json` on startup
- All changes during the session are kept in memory only
- **Login state persists** across page refreshes (stored in localStorage)
- Refresh the browser to reload data from the file while staying logged in
- Perfect for consistent starting state across browser sessions

### In-Memory Storage (Testing)

- Each test gets a fresh, clean storage instance
- No shared state between tests
- Supports all the same operations as file storage
- Ideal for isolated, deterministic testing

## Managing Data

### View Current Data

The starting data is in `public/mock-data.json`. You can view and edit this file directly.

### Reset Data

To reset the starting state:

- Edit `public/mock-data.json` directly
- Refresh the browser to load new data

### Export Current Data

Open browser console and run:

```javascript
window.storageInstance.downloadData();
```

This downloads the current in-memory state as a JSON file.

### Share Data

Since the initial data is in a file, you can:

- Commit `public/mock-data.json` to version control
- Share specific test scenarios with team members
- Create different data setups for different test cases

## Data Structure

The `mock-data.json` file contains:

```json
{
  "users": [...],
  "groups": [...],
  "groupMembers": [...],
  "requests": [...],
  "invites": [...],
  "currentUser": {...},
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

## How It Works

- **File Storage**: Reads initial data from `public/mock-data.json` on startup
- **In-Memory**: All changes during session are kept in memory only
- **No Server Required**: No need for a development server or API endpoints
- **Validation**: Invalid data in the JSON file is validated and filtered out
- **Fallback**: If file can't be read, starts with empty data

## Development Notes

- Changes are **not automatically saved** back to the file
- Refresh browser to reload data from file
- Use the export feature to save current state when needed
- Perfect for setting up consistent test scenarios
