import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isAdmin) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '400px',
          margin: '2rem auto',
        }}
      >
        <h2 style={{ color: '#dc2626' }}>Access Denied</h2>
        <p style={{ color: '#6b7280' }}>
          You don't have administrator privileges to access this page.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            marginTop: '1rem',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
