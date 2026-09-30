import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workItemsApi, teamsApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBadge, PriorityBadge, formatTimeAgo } from './DashboardPage';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_APPROVAL', 'BLOCKED', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const TYPES = ['CUSTOMER_ISSUE', 'ENGINEERING', 'PAYMENT', 'PRODUCTION_INCIDENT', 'COMPLIANCE', 'OPERATIONAL_TASK'];

export default function WorkItemsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const type = searchParams.get('type') || '';
  const teamId = searchParams.get('team_id') || '';
  const search = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(search);

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.list,
  });

  const filters: any = { page, pageSize: 25 };
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (type) filters.type = type;
  if (teamId) filters.team_id = teamId;
  if (search) filters.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ['work-items', filters],
    queryFn: () => workItemsApi.list(filters),
  });

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchInput);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params);
  };

  return (
    <div className="work-items-page">
      <div className="page-header">
        <h1>Work Items</h1>
        <Link to="/work-items/new" className="btn btn-primary">+ New Work Item</Link>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search title or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-sm">Search</button>
        </form>
        <div className="filter-selects">
          <select value={status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select value={priority} onChange={(e) => updateFilter('priority', e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => updateFilter('type', e.target.value)}>
            <option value="">All Types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select value={teamId} onChange={(e) => updateFilter('team_id', e.target.value)}>
            <option value="">All Teams</option>
            {teams?.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Type</th>
                  <th>Team</th>
                  <th>Assignee</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((item: any) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={`/work-items/${item.id}`} className="item-link">
                        {item.title}
                      </Link>
                    </td>
                    <td><StatusBadge status={item.status} /></td>
                    <td><PriorityBadge priority={item.priority} /></td>
                    <td><span className="type-label">{item.type.replace(/_/g, ' ')}</span></td>
                    <td>{item.team_name}</td>
                    <td>{item.assignee_name || <span className="text-muted">Unassigned</span>}</td>
                    <td className="text-muted">{formatTimeAgo(item.updated_at)}</td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">No work items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {data.pagination.page} of {data.pagination.totalPages}
                {' '}({data.pagination.total} total)
              </span>
              <button
                className="btn btn-sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
