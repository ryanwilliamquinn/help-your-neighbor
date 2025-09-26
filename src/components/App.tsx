import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { ToastProvider } from '@/contexts';
import { ToastContainer } from './Toast';
import LoginPage from '@/pages/Login/LoginPage';
import SignUpPage from '@/pages/Login/SignUpPage';
import EmailVerificationPage from '@/pages/Login/EmailVerificationPage';
import AuthCallbackPage from '@/pages/Auth/AuthCallbackPage';
import ForgotPasswordPage from '@/pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPassword/ResetPasswordPage';
import ProfilePage from '@/pages/Profile/ProfilePage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import GroupsPage from '@/pages/Groups/GroupsPage';
import InvitePage from '@/pages/Invite/InvitePage';
import FeedbackPage from '@/pages/Feedback/FeedbackPage';
import AboutPage from '@/pages/About/AboutPage';
import ProtectedRoute from './ProtectedRoute';

function App(): React.JSX.Element {
  const { user, signOut } = useAuth();

  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="App">
          <header className="App-header">
            <nav>
              <ul>
                <li>
                  <Link to="/">Help Your Neighbor</Link>
                </li>
                {!user && (
                  <li>
                    <Link to="/login">Login</Link>
                  </li>
                )}
                {!user && (
                  <li>
                    <Link to="/signup">Sign Up</Link>
                  </li>
                )}
                {user && (
                  <li>
                    <Link to="/">Dashboard</Link>
                  </li>
                )}
                {user && (
                  <li>
                    <Link to="/groups">Groups</Link>
                  </li>
                )}
                {user && (
                  <li>
                    <Link to="/profile">Profile</Link>
                  </li>
                )}
                <li>
                  <Link to="/about">About</Link>
                </li>
                {user && (
                  <li>
                    <Link to="/feedback">Feedback</Link>
                  </li>
                )}
                {user && (
                  <li>
                    <button onClick={signOut}>Logout</button>
                  </li>
                )}
              </ul>
            </nav>
          </header>
          <main>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/invite" element={<InvitePage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups"
                element={
                  <ProtectedRoute>
                    <GroupsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
        <ToastContainer />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
