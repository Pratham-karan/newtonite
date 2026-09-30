import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'var(--status-open)',
  IN_PROGRESS: 'var(--status-in-progress)',
  WAITING_FOR_APPROVAL: 'var(--status-waiting)',
  BLOCKED: 'var(--status-blocked)',
  RESOLVED: 'var(--status-resolved)',
  CLOSED: 'var(--status-closed)',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'var(--priority-critical)',
  HIGH: 'var(--priority-high)',
  MEDIUM: 'var(--priority-medium)',
  LOW: 'var(--priority-low)',
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="badge" style={{ backgroundColor: STATUS_COLORS[status] || '#666' }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className="badge badge-outline" style={{ borderColor: PRIORITY_COLORS[priority] || '#666', color: PRIORITY_COLORS[priority] || '#666' }}>
      {priority}
    </span>
  );
}

export { StatusBadge, PriorityBadge, formatTimeAgo };

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.summary,
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: myWork } = useQuery({
    queryKey: ['dashboard', 'my-work'],
    queryFn: dashboardApi.myWork,
  });

  const { data: critical } = useQuery({
    queryKey: ['dashboard', 'critical'],
    queryFn: dashboardApi.critical,
  });

  const { data: approvals } = useQuery({
    queryKey: ['dashboard', 'approvals'],
    queryFn: dashboardApi.approvals,
  });

  const { data: recent } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: dashboardApi.recent,
  });

  if (summaryLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-number">{summary?.totalActive || 0}</div>
          <div className="summary-label">Active Items</div>
        </div>
        <div className="summary-card critical">
          <div className="summary-number">{summary?.priorityCounts?.CRITICAL || 0}</div>
          <div className="summary-label">Critical</div>
        </div>
        <div className="summary-card warning">
          <div className="summary-number">{summary?.priorityCounts?.HIGH || 0}</div>
          <div className="summary-label">High Priority</div>
        </div>
        <div className="summary-card info">
          <div className="summary-number">{summary?.statusCounts?.WAITING_FOR_APPROVAL || 0}</div>
          <div className="summary-label">Awaiting Approval</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{summary?.statusCounts?.IN_PROGRESS || 0}</div>
          <div className="summary-label">In Progress</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{summary?.statusCounts?.BLOCKED || 0}</div>
          <div className="summary-label">Blocked</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* My Work */}
        <div className="dashboard-section">
          <h2 className="section-title">📋 My Work</h2>
          {myWork && myWork.length > 0 ? (
            <div className="item-list">
              {myWork.map((item: any) => (
                <Link to={`/work-items/${item.id}`} key={item.id} className="item-row">
                  <div className="item-row-main">
                    <PriorityBadge priority={item.priority} />
                    <span className="item-title">{item.title}</span>
                  </div>
                  <div className="item-row-meta">
                    <StatusBadge status={item.status} />
                    <span className="item-meta">{item.team_name}</span>
                    <span className="item-meta">{formatTimeAgo(item.updated_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-state">No items assigned to you</p>
          )}
        </div>

        {/* Critical Items */}
        <div className="dashboard-section">
          <h2 className="section-title">🔴 Critical Items</h2>
          {critical && critical.length > 0 ? (
            <div className="item-list">
              {critical.map((item: any) => (
                <Link to={`/work-items/${item.id}`} key={item.id} className="item-row">
                  <div className="item-row-main">
                    <span className="item-title">{item.title}</span>
                  </div>
                  <div className="item-row-meta">
                    <StatusBadge status={item.status} />
                    <span className="item-meta">{item.assignee_name || 'Unassigned'}</span>
                    <span className="item-meta">{formatTimeAgo(item.updated_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-state">No critical items — great!</p>
          )}
        </div>

        {/* Pending Approvals */}
        {(user?.role === 'ADMIN' || user?.role === 'TEAM_LEAD') && (
          <div className="dashboard-section">
            <h2 className="section-title">⏳ Pending Approvals</h2>
            {approvals && approvals.length > 0 ? (
              <div className="item-list">
                {approvals.map((item: any) => (
                  <Link to={`/work-items/${item.id}`} key={item.id} className="item-row">
                    <div className="item-row-main">
                      <PriorityBadge priority={item.priority} />
                      <span className="item-title">{item.title}</span>
                    </div>
                    <div className="item-row-meta">
                      <span className="item-meta">By {item.creator_name}</span>
                      <span className="item-meta">{item.team_name}</span>
                      <span className="item-meta">{formatTimeAgo(item.updated_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty-state">No pending approvals</p>
            )}
          </div>
        )}

        {/* Recently Updated */}
        <div className="dashboard-section">
          <h2 className="section-title">🔄 Recently Updated</h2>
          {recent && recent.length > 0 ? (
            <div className="item-list">
              {recent.map((item: any) => (
                <Link to={`/work-items/${item.id}`} key={item.id} className="item-row">
                  <div className="item-row-main">
                    <PriorityBadge priority={item.priority} />
                    <span className="item-title">{item.title}</span>
                  </div>
                  <div className="item-row-meta">
                    <StatusBadge status={item.status} />
                    <span className="item-meta">{item.assignee_name || 'Unassigned'}</span>
                    <span className="item-meta">{formatTimeAgo(item.updated_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-state">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
