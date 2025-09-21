# Help Your Neighbor

A community item pickup application that connects people within trusted groups to help each other with store runs and errands.

## The Problem

We've all been there - you're cooking dinner and realize you're missing one ingredient, or you need a small item from the store but don't want to make a special trip. Meanwhile, your friends and neighbors are making their regular store runs and could easily grab that item for you.

## The Solution

Help Your Neighbor lets people in trusted groups (friends, family, coworkers, neighbors) coordinate item pickups. When someone is going to the store, they can see what others in their group need and offer to help. When you need something, you can post a request and see if anyone in your group is planning a store trip.

## How It Works

1. **Join a Group**: Get invited to a group by someone you know
2. **Post Requests**: Need something from the store? Post what you need, which store, and when you need it by
3. **Help Others**: See what others in your group need when you're planning your own store trips
4. **Coordinate**: Use the built-in messaging to work out details like payment and meetup
5. **Build Community**: Help each other out and reduce unnecessary trips

## Key Features (MVP)

- **Private Groups**: Only see requests from people in your trusted groups
- **Simple Requests**: Post what you need, from which store, by when
- **Easy Coordination**: Built-in messaging to work out the details
- **No Money Handling**: Users work out payment directly (Venmo, cash, etc.)
- **Invite System**: Group members can invite others they trust

## Getting Started

1. Get an invite link from someone already in a group
2. Create your account with email verification
3. Join your group and start helping your neighbors!

## Technology

- Web application (mobile-responsive)
- Real-time updates for new requests and messages
- Email notifications for important updates
- Simple, clean interface focused on the core functionality

## Safety & Trust

- **Invitation Only**: You can only join groups through invites from existing members
- **Known Communities**: Designed for people who already know and trust each other
- **Transparent Communication**: All coordination happens through the app
- **Community Guidelines**: Simple rules to keep interactions positive and helpful

## Future Possibilities

- Regional groups for broader communities
- Integration with store inventory systems
- Recurring request patterns
- Mobile apps for iOS and Android
- Integration with payment platforms

## Development

The application is designed to work completely offline for development using a mock API service that persists data to the file system.

### Local Setup

1.  **Install dependencies**:

    ```bash
    npm install
    ```

2.  **Configure environment**:
    Copy `.env.example` to `.env` and set the variables. For local development, ensure `VITE_USE_MOCK_API` is set to `true`.

    ```bash
    VITE_USE_MOCK_API=true
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    This will start a local server. Open the URL it provides (usually `http://localhost:5173`) in your web browser. You should see the application's login page.

### Available Scripts

The project includes several scripts to help with development:

- `npm run dev`: Starts the Vite development server with Hot Module Replacement (HMR).
- `npm test`: Runs the full test suite using Jest.
- `npm run test:watch`: Runs Jest in watch mode to re-run tests on file changes.
- `npm run test:coverage`: Runs Jest and generates a test coverage report.
- `npm run lint`: Lints all source files using ESLint.
- `npm run lint:fix`: Attempts to automatically fix linting issues.
- `npm run format`: Formats all source files using Prettier.
- `npm run format:check`: Checks for formatting issues without modifying files.
- `npm run build`: Compiles the TypeScript code and builds the application for production.
- `npm run preview`: Serves the production build locally to preview it.

## Contributing

This is currently a personal project, but feedback and suggestions are welcome!

## License

TBD - likely open source once MVP is proven

---

_Built to strengthen communities one favor at a time._
