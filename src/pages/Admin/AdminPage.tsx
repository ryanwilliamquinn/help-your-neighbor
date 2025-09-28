import React, { useState, useEffect } from 'react';
import { MetricCard } from '../../components/Admin/MetricCard';
import { apiService } from '../../services';
import type { AdminMetrics } from '../../types';
import './AdminPage.css';

export const AdminPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const adminMetrics = await apiService.getAdminMetrics();
        setMetrics(adminMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    void fetchMetrics();
  }, []);

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    return `${Math.round(hours / 24)}d`;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page__header">
          <h1 className="admin-page__title">Admin Dashboard</h1>
        </div>
        <div className="admin-page__loading">
          <div className="admin-page__spinner"></div>
          <p>Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-page__header">
          <h1 className="admin-page__title">Admin Dashboard</h1>
        </div>
        <div className="admin-page__error">
          <h2>Error Loading Metrics</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="admin-page__retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="admin-page">
        <div className="admin-page__header">
          <h1 className="admin-page__title">Admin Dashboard</h1>
        </div>
        <div className="admin-page__error">
          <p>No metrics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Admin Dashboard</h1>
        <p className="admin-page__subtitle">
          Platform metrics and health overview
        </p>
      </div>

      <div className="admin-page__metrics">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          subtitle="Registered accounts"
          className="admin-page__metric"
        />

        <MetricCard
          title="Active Users"
          value={metrics.activeUsers}
          subtitle="Last 30 days"
          className="admin-page__metric"
        />

        <MetricCard
          title="Total Groups"
          value={metrics.totalGroups}
          subtitle="Created communities"
          className="admin-page__metric"
        />

        <MetricCard
          title="Requests This Month"
          value={metrics.totalRequestsThisMonth}
          subtitle="New help requests"
          className="admin-page__metric"
        />

        <MetricCard
          title="Fulfillment Rate"
          value={`${metrics.fulfillmentRate}%`}
          subtitle="Claimed or fulfilled"
          trend={
            metrics.fulfillmentRate > 70
              ? 'up'
              : metrics.fulfillmentRate > 40
                ? 'neutral'
                : 'down'
          }
          className="admin-page__metric"
        />

        <MetricCard
          title="Avg. Time to Claim"
          value={formatHours(metrics.averageTimeToClaimHours)}
          subtitle="Response time"
          trend={
            metrics.averageTimeToClaimHours < 24
              ? 'up'
              : metrics.averageTimeToClaimHours < 72
                ? 'neutral'
                : 'down'
          }
          className="admin-page__metric"
        />

        <MetricCard
          title="Avg. Group Size"
          value={metrics.averageGroupSize.toFixed(1)}
          subtitle="Members per group"
          className="admin-page__metric"
        />
      </div>

      <div className="admin-page__footer">
        <p className="admin-page__updated">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};
