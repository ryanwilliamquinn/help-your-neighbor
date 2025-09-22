# AI Development Context - Help Your Neighbor

## Project Overview

Community item pickup application for trusted groups. Users can request items from stores and group members can offer to pick them up during their own shopping trips.

## MVP Specifications

### Core Features

- **Group Management**: Invitation-only groups, max 20 members per group, flat admin structure
- **Item Requests**: Users post requests with item description, store preference, deadline, pickup notes
- **Request Browsing**: Group members see all requests within their groups
- **Contact Sharing**: Automatic contact info sharing when requests are claimed
- **User Profiles**: Basic profiles with name, phone, and general area

### Technical Architecture

- **Frontend**: React + TypeScript web application, mobile-responsive
- **Backend**: Dual-mode architecture
  - **Development**: Mock API service with file based storage
  - **Production**: Supabase (authentication, database, real-time subscriptions)
- **Authentication**: Email/password only for MVP
- **Database**:
  - **Development**: File with structured data
  - **Production**: PostgreSQL via Supabase
- **Real-time**:
  - **Development**: Simulated with React state updates
  - **Production**: Supabase real-time for live updates
- **Hosting**: Static site deployment (Netlify/Vercel free tier)

### Database Schema (Conceptual)

```
Users: id, email, name, phone, general_area, created_at
Groups: id, name, created_by, created_at
GroupMembers: group_id, user_id, joined_at
Requests: id, user_id, group_id, item_description, store_preference, needed_by,
          pickup_notes, status, claimed_by, claimed_at, created_at
Invites: id, group_id, email, token, expires_at, used_at
```

### User Flow

1. User receives invite email with token
2. User creates account and joins group via token
3. User can post requests (item, store, deadline, pickup notes) or browse existing ones
4. Helper claims request and gets access to requester's contact info
5. Users coordinate pickup details via phone/text using shared contact info
6. Helper marks request as fulfilled when complete

### Key Constraints

- **No Payment Processing**: Users handle reimbursement directly (Venmo, cash)
- **No GPS/Location Services**: Users manually specify general area
- **No In-App Messaging**: Users coordinate via phone/text using shared contact info
- **Email Notifications Only**: For status changes (new requests, claims, fulfillment)
- **Group Size Limit**: 20 members maximum
- **Invitation Only**: No public groups or discovery

### Safety Features

- Email verification required
- Report/block functionality
- Community guidelines
- Group-based isolation (no cross-group visibility)

### Development Priorities

1. User authentication and group invitation system
2. Basic request posting and browsing
3. Request claiming system with contact info sharing
4. Email notifications for status changes
5. Mobile-responsive UI

### Future Considerations

- Regional groups for broader communities
- Mobile app development
- Payment integration
- Advanced matching algorithms
- Store inventory integration

### Development Guidelines

- Keep it simple - favor working features over perfect features
- Mobile-first responsive design
- Progressive enhancement approach
- Focus on core user journey
- Minimize hosting costs (use free tiers)

## Programming Standards

### Code Structure

- **Single Responsibility**: Each function/component does one thing well
- **Small Functions**: Keep functions under 20 lines when possible
- **Clear Naming**: Use descriptive names (getUserById vs getUser, isAuthenticated vs checkAuth)
- **Consistent File Structure**: Group related functionality, separate concerns
- **TypeScript**: Use strict TypeScript for all code (no `any` types)

### Error Handling

- **Explicit Error Types**: Define custom error types for different scenarios
- **Graceful Degradation**: App should work with network failures, slow responses
- **User-Friendly Messages**: Never show raw error messages to users
- **Logging**: Log errors with context but never log sensitive data
- **Input Validation**: Validate all user inputs on both client and server

### Security

- **Input Sanitization**: Sanitize all user inputs to prevent XSS
- **SQL Injection Prevention**: Use parameterized queries (Supabase handles this)
- **Authentication Checks**: Verify user permissions on every request
- **Rate Limiting**: Prevent abuse with reasonable request limits
- **HTTPS Only**: Force HTTPS in production

### Performance

- **Lazy Loading**: Load components and data only when needed
- **Optimistic Updates**: Update UI immediately, rollback on failure
- **Caching**: Cache static data and user preferences
- **Bundle Size**: Keep JavaScript bundles small, code-split when possible
- **Database Indexes**: Index frequently queried columns

### Testing & TDD Approach

- **Test-Driven Development**: Write tests before implementation (Red-Green-Refactor cycle)
- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test component interactions and API calls
- **Test Coverage**: Aim for 80%+ coverage on core business logic
- **Testing Tools**: Jest for unit tests, React Testing Library for components
- **Mock Strategy**: Mock external dependencies (Supabase, email services)
- **Test Organization**: Mirror source code structure in test files
- **Critical Path Testing**: Test user registration, request creation, claiming
- **Edge Cases**: Test with empty data, network failures, invalid inputs
- **Cross-Browser**: Test on Chrome, Firefox, Safari, mobile browsers
- **Accessibility**: Test with keyboard navigation and screen readers

### TDD Workflow

1. **Red**: Write a failing test that describes the desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code quality while keeping tests green
4. **Repeat**: Continue cycle for each new feature or bug fix

### Test Categories

- **Unit Tests**: Pure functions, utilities, custom hooks
- **Component Tests**: User interactions, rendering, props
- **Integration Tests**: API interactions, data flow between components
- **E2E Tests**: Critical user journeys (registration, creating requests)

### Test Naming Convention

- Use descriptive test names: `should create request when valid data provided`
- Group related tests with `describe` blocks
- Use `it` for individual test cases
- Follow Given-When-Then pattern in test descriptions

### Code Quality

- **Linting**: Use ESLint with strict rules, Prettier for formatting
- **Pre-commit Hooks**: Run lints and tests before commits
- **Code Reviews**: Review all changes, even when working solo
- **Documentation**: Comment complex logic, maintain README
- **Dependencies**: Keep dependencies minimal and up to date

### Development Workflow

- **Feature Branches**: One feature per branch, small focused changes
- **Commit Messages**: Clear, descriptive commit messages
- **Environment Variables**: Use .env files, never commit secrets
- **Database Migrations**: Use proper migration scripts for schema changes
- **Deployment**: Automated deployment from main branch

### React/Frontend Specific

- **Component Props**: Define clear TypeScript interfaces for all props
- **State Management**: Use React hooks, avoid prop drilling beyond 2 levels
- **Effect Dependencies**: Always specify useEffect dependencies correctly
- **Key Props**: Use stable, unique keys for list items
- **Accessibility**: Use semantic HTML, proper ARIA labels

### Testing Strategy

- Start with friends/family as beta users
- Manual testing for MVP
- Basic error handling and validation
- Gradual rollout to additional groups

## Local Development Setup

### Running the Application Offline

The application is designed to work completely offline for development:

1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev`
3. **Run tests**: `npm test`
4. **Build for production**: `npm run build`

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Use mock API for offline development
VITE_USE_MOCK_API=true

# For production deployment, set to false and add Supabase credentials
# VITE_USE_MOCK_API=false
# VITE_SUPABASE_URL=your_project_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Mock Data

The mock API service provides:

- Sample users for testing login flows
- File-based persistence across browser sessions
- Full CRUD operations for all entities
- Realistic API delays for testing loading states
- Input validation and error handling

### Switching to Production

When ready for production:

1. Set `VITE_USE_MOCK_API=false`
2. Add Supabase credentials to environment variables
3. Run database migration scripts in `/database/schema.sql`
4. Implement Supabase service layer (currently planned)

## Development Status

**Current Status**: Pre-alpha development - No real users yet

**Phase 1 Complete**: Project foundation with offline development capability

- ✅ React + TypeScript + Vite setup
- ✅ ESLint, Prettier, pre-commit hooks
- ✅ Jest + React Testing Library
- ✅ Clean architecture with types, services, contexts
- ✅ Mock API service with file based storage
- ✅ Environment configuration for dev/prod modes

**Next Phase**: UI components and user authentication flows

### Pre-Alpha Development Guidelines

Since we have no real users yet:

- **No Backward Compatibility Required**: Make breaking changes freely to improve architecture
- **Rapid Iteration**: Prioritize speed of development over migration concerns
- **Schema Changes**: Database schema can be modified without migration scripts
- **API Breaking Changes**: API interfaces can be redesigned as needed
- **UI/UX Experimentation**: Feel free to completely redesign user interfaces
- **Performance Over Polish**: Focus on core functionality before optimization
- **Testing Strategy**: Focus on critical paths, comprehensive testing comes later
