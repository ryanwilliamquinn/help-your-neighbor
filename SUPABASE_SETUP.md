# Supabase Production Setup Guide

This guide will help you set up Supabase for production deployment of the A Cup of Sugar application.

## Prerequisites

- A [Supabase](https://supabase.com) account
- Node.js and npm installed locally
- Supabase CLI (optional but recommended)

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `help-your-neighbor` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (this may take a few minutes)

## Step 2: Configure Environment Variables

1. In your Supabase dashboard, go to **Settings > API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Create a `.env.local` file in your project root:

```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:

```bash
# Application Configuration
VITE_APP_NAME="Help Your Neighbor"
VITE_APP_VERSION=0.1.0

# API Configuration - Set to false for production
VITE_USE_MOCK_API=false

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 3: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended for first-time setup)

1. Go to your Supabase project dashboard
2. Navigate to **Database > SQL Editor**
3. Run the migration files in order:

#### Migration 1: Initial Schema

Copy and paste the contents of `supabase/migrations/001_initial_schema.sql` and click "Run"

#### Migration 2: Indexes and Functions

Copy and paste the contents of `supabase/migrations/002_indexes_and_functions.sql` and click "Run"

#### Migration 3: Row Level Security

Copy and paste the contents of `supabase/migrations/003_row_level_security.sql` and click "Run"

### Option B: Using Supabase CLI

1. Install the Supabase CLI:

```bash
npm install -g supabase
```

2. Initialize Supabase in your project:

```bash
supabase init
```

3. Link to your remote project:

```bash
supabase link --project-ref your-project-id
```

4. Copy the migration files to the supabase folder and run:

```bash
supabase db push
```

## Step 4: Configure Authentication

1. In your Supabase dashboard, go to **Authentication > Settings**
2. Configure the following settings:

### Site URL

- Set **Site URL** to `https://acupofsugar.org`
- For development, add `http://localhost:5173`

### Email Templates (Optional)

- Customize signup confirmation and password reset email templates
- Update the email templates to match your app branding

### Auth Providers (Optional)

- Enable additional auth providers if needed (Google, GitHub, etc.)

## Step 5: Test the Setup

1. Start your development server:

```bash
npm run dev
```

2. The app should now use Supabase instead of the mock API
3. Test the following functionality:
   - User registration
   - User login
   - Creating groups
   - Creating requests
   - Inviting users

## Step 6: Deploy to Production

### Environment Variables for Production

Set the following environment variables in your production deployment platform:

```bash
VITE_USE_MOCK_API=false
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Build and Deploy

1. Build the production app:

```bash
npm run build
```

2. Deploy the `dist` folder to your hosting platform (Vercel, Netlify, etc.)

## Step 7: Database Maintenance (Optional)

### Set up periodic cleanup

You can set up periodic cleanup of expired data using Supabase Edge Functions or cron jobs:

1. **Expire old requests**: Call the `expire_old_requests()` function periodically
2. **Cleanup old invites**: Call the `cleanup_old_invites()` function periodically

### Example cron setup (if using a server):

```bash
# Add to crontab - run every hour
0 * * * * psql "your-connection-string" -c "SELECT expire_old_requests();"
0 2 * * * psql "your-connection-string" -c "SELECT cleanup_old_invites();"
```

## Troubleshooting

### Common Issues

1. **"Supabase client not initialized" error**
   - Check that your environment variables are set correctly
   - Ensure `VITE_USE_MOCK_API=false`

2. **Authentication errors**
   - Verify your Site URL is configured correctly
   - Check that RLS policies are enabled and configured

3. **Database connection issues**
   - Verify your project URL and anon key are correct
   - Check that your database is not paused (free tier limitation)

4. **Permission denied errors**
   - Review the RLS policies in the database
   - Ensure users are properly authenticated

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the database logs in your Supabase dashboard
- Check browser console for client-side errors

## Security Considerations

1. **Row Level Security**: All tables have RLS enabled with appropriate policies
2. **API Keys**: Never expose your service role key in client-side code
3. **CORS**: Configure allowed origins in Supabase settings
4. **Rate Limiting**: Consider implementing rate limiting for production use

## Next Steps

Once your Supabase setup is complete, you can:

1. Set up monitoring and alerts
2. Configure backups
3. Set up staging environments
4. Implement additional security measures
5. Scale your database as needed

For more advanced features, refer to the Supabase documentation.
