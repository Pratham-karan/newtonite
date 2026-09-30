import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { workItemsApi, teamsApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const WORK_ITEM_TYPES = [
  { value: 'CUSTOMER_ISSUE', label: 'Customer Issue', desc: 'User-facing escalation or bug' },
  { value: 'ENGINEERING', label: 'Engineering', desc: 'Technical defect or infrastructure issue' },
  { value: 'PAYMENT', label: 'Payment', desc: 'Financial transaction discrepancy or failure' },
  { value: 'PRODUCTION_INCIDENT', label: 'Production Incident', desc: 'High-severity service disruption' },
  { value: 'COMPLIANCE', label: 'Compliance', desc: 'Regulatory or policy requirement' },
  { value: 'OPERATIONAL_TASK', label: 'Operational Task', desc: 'Standard business operation' },
];

const PRIORITIES = [
  { value: 'CRITICAL', label: 'Critical', color: 'var(--priority-critical)' },
  { value: 'HIGH', label: 'High', color: 'var(--priority-high)' },
  { value: 'MEDIUM', label: 'Medium', color: 'var(--priority-medium)' },
  { value: 'LOW', label: 'Low', color: 'var(--priority-low)' },
];

export default function CreateWorkItemPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('CUSTOMER_ISSUE');
  const [priority, setPriority] = useState('MEDIUM');
  const [teamId, setTeamId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Client-generated idempotency key
  const [idempotencyKey] = useState(() => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'key-' + Math.random().toString(36).substring(2) + Date.now();
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.list,
  });

  // Filter available teams based on user role
  const availableTeams = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return teams;
    const userTeamIds = user.teams.map((t) => t.id);
    return teams.filter((t: any) => userTeamIds.includes(t.id));
  }, [teams, user]);

  // Set default team
  useEffect(() => {
    if (availableTeams.length > 0 && !teamId) {
      setTeamId(availableTeams[0].id);
    }
  }, [availableTeams, teamId]);

  // Load members of selected team
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamsApi.members(teamId),
    enabled: !!teamId,
  });

  // Reset assignee if team changes and previous assignee isn't in new team
  useEffect(() => {
    if (assigneeId && teamMembers.length > 0) {
      const exists = teamMembers.some((m: any) => m.id === assigneeId);
      if (!exists) setAssigneeId('');
    }
  }, [teamId, teamMembers, assigneeId]);

  const createMutation = useMutation({
    mutationFn: (data: any) => workItemsApi.create(data, idempotencyKey),
    onSuccess: (createdItem: any) => {
      navigate(`/work-items/${createdItem.id}`);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : null) ||
        err.response?.data?.message ||
        'Failed to create work item';
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!teamId) {
      setError('Please select a team');
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      team_id: teamId,
      assignee_id: assigneeId || null,
    });
  };

  return (
    <div className="create-item-container">
      <div className="page-header">
        <div>
          <Link to="/work-items" className="breadcrumb-back">&larr; Back to Work Items</Link>
          <h1 className="mt-2">Create Operational Work Item</h1>
          <p className="page-subtitle">Submit a new request or operational escalation</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            className="input-control"
            placeholder="e.g. Gateway timeout on merchant refund API"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={500}
          />
          <span className="field-hint">Be specific so the operational team can triage quickly</span>
        </div>

        <div className="form-row two-cols">
          <div className="form-group">
            <label htmlFor="type">Work Item Type *</label>
            <select
              id="type"
              className="select-control"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {WORK_ITEM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} ({t.desc})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Initial Priority *</label>
            <select
              id="priority"
              className="select-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row two-cols">
          <div className="form-group">
            <label htmlFor="team">Assigned Team *</label>
            <select
              id="team"
              className="select-control"
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setAssigneeId('');
              }}
              disabled={teamsLoading}
            >
              {availableTeams.map((team: any) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="assignee">Assignee (Optional)</label>
            <select
              id="assignee"
              className="select-control"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={membersLoading || !teamId}
            >
              <option value="">-- Unassigned (Team Queue) --</option>
              {teamMembers.map((member: any) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Detailed Description & Context *</label>
          <textarea
            id="description"
            className="textarea-control"
            rows={6}
            placeholder="Include operational context, reproduction steps, customer impacts, logs, or links..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-footer">
          <div className="idempotency-badge" title="Guarantees safe submission without accidental duplicate creation">
            <span className="dot-green"></span> Idempotency Protected
          </div>
          <div className="action-buttons">
            <Link to="/work-items" className="btn btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Submitting...' : 'Create Work Item'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
