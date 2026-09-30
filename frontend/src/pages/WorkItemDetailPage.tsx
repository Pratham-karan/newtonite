import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workItemsApi, teamsApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge, formatTimeAgo } from './DashboardPage';

export default function WorkItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal dialog states
  const [modalMode, setModalMode] = useState<
    'NONE' | 'RESOLVE' | 'APPROVE' | 'REOPEN' | 'ASSIGN' | 'PRIORITY'
  >('NONE');
  const [modalInput, setModalInput] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  const {
    data: item,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ['work-item', id],
    queryFn: () => workItemsApi.getById(id!),
    enabled: !!id,
    refetchInterval: 15000, // Refresh every 15s
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', item?.team_id],
    queryFn: () => teamsApi.members(item.team_id),
    enabled: !!item?.team_id,
  });

  const isLeadOrAdmin = user?.role === 'ADMIN' || user?.role === 'TEAM_LEAD';
  const isCreator = user?.id === item?.created_by;
  const isAssignee = user?.id === item?.assignee_id;

  const handleMutationError = (err: any) => {
    if (err.response?.status === 409) {
      setConflictError(
        'Concurrent update conflict: Another user modified this item in parallel. Please reload to review the latest state.'
      );
    } else {
      setActionError(
        err.response?.data?.error?.message ||
          (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : null) ||
          err.response?.data?.message ||
          'Failed to perform operation'
      );
    }
  };

  const handleMutationSuccess = () => {
    setConflictError(null);
    setActionError(null);
    setModalMode('NONE');
    setModalInput('');
    queryClient.invalidateQueries({ queryKey: ['work-item', id] });
    queryClient.invalidateQueries({ queryKey: ['work-items'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  // Status update mutation (PATCH /api/work-items/:id)
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      workItemsApi.update(id!, { status: newStatus, version: item.version }),
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Priority update mutation (PATCH /api/work-items/:id)
  const updatePriorityMutation = useMutation({
    mutationFn: (newPriority: string) =>
      workItemsApi.update(id!, { priority: newPriority, version: item.version }),
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Assign mutation (POST /api/work-items/:id/assign)
  const assignMutation = useMutation({
    mutationFn: (newAssigneeId: string) =>
      workItemsApi.assign(
        id!,
        { assignee_id: newAssigneeId, version: item.version },
        `assign-${id}-${Date.now()}`
      ),
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Resolve mutation (POST /api/work-items/:id/resolve)
  const resolveMutation = useMutation({
    mutationFn: (resolution_note: string) =>
      workItemsApi.resolve(
        id!,
        { resolution_note, version: item.version },
        `resolve-${id}-${Date.now()}`
      ),
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Approve mutation (POST /api/work-items/:id/approve)
  const approveMutation = useMutation({
    mutationFn: (note?: string) =>
      workItemsApi.approve(
        id!,
        { note: note || undefined, version: item.version },
        `approve-${id}-${Date.now()}`
      ),
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Reopen mutation (POST /api/work-items/:id/reopen)
  const reopenMutation = useMutation({
    mutationFn: (reason: string) =>
      workItemsApi.reopen(
        id!,
        { reason, version: item.version },
        `reopen-${id}-${Date.now()}`
      ),
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Comment mutation (POST /api/work-items/:id/comments)
  const commentMutation = useMutation({
    mutationFn: (body: string) => workItemsApi.addComment(id!, body),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['work-item', id] });
    },
    onError: handleMutationError,
  });

  if (isLoading) {
    return <div className="loading-state">Loading work item details...</div>;
  }

  if (fetchError || !item) {
    return (
      <div className="error-banner">
        Failed to load work item. You may not have permission to view it or it may not exist.{' '}
        <Link to="/work-items">Return to Work Items</Link>
      </div>
    );
  }

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (modalMode === 'RESOLVE') {
      if (!modalInput.trim()) {
        setActionError('Resolution note is required');
        return;
      }
      resolveMutation.mutate(modalInput.trim());
    } else if (modalMode === 'APPROVE') {
      approveMutation.mutate(modalInput.trim());
    } else if (modalMode === 'REOPEN') {
      if (!modalInput.trim()) {
        setActionError('Reopen reason is required');
        return;
      }
      reopenMutation.mutate(modalInput.trim());
    } else if (modalMode === 'ASSIGN') {
      if (!selectedAssignee) {
        setActionError('Please select a team member');
        return;
      }
      assignMutation.mutate(selectedAssignee);
    } else if (modalMode === 'PRIORITY') {
      if (!selectedPriority) return;
      updatePriorityMutation.mutate(selectedPriority);
    }
  };

  return (
    <div className="work-item-detail">
      {/* Top Breadcrumb & Alerts */}
      <div className="detail-top-nav">
        <Link to="/work-items" className="breadcrumb-back">&larr; Back to Work Items</Link>
        <div className="version-pill" title="Optimistic Concurrency Control Version">
          Lock Version: v{item.version}
        </div>
      </div>

      {conflictError && (
        <div className="conflict-banner">
          <div className="conflict-title">⚠️ Concurrency Conflict Detected</div>
          <p>{conflictError}</p>
          <button
            onClick={() => {
              setConflictError(null);
              refetch();
            }}
            className="btn btn-sm btn-conflict"
          >
            Reload Latest State
          </button>
        </div>
      )}

      {actionError && <div className="error-banner">{actionError}</div>}

      {/* Main Grid: Details Left, Metadata Right */}
      <div className="detail-layout">
        <div className="detail-main">
          {/* Item Header */}
          <div className="card item-header-card">
            <div className="item-meta-badges">
              <span className="type-badge">{item.type.replace(/_/g, ' ')}</span>
              <StatusBadge status={item.status} />
              <PriorityBadge priority={item.priority} />
            </div>
            <h1 className="item-title">{item.title}</h1>
            <div className="item-description-block">
              <h3>Description</h3>
              <p className="item-description">{item.description}</p>
            </div>

            {item.resolution_note && (
              <div className="resolution-callout">
                <h4>Resolution Note</h4>
                <p>{item.resolution_note}</p>
                {item.resolved_at && (
                  <span className="resolution-date">
                    Resolved {formatTimeAgo(item.resolved_at)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Workflow Action Command Bar */}
          <div className="card workflow-card">
            <h3>Operational Workflow Actions</h3>
            <p className="card-subtitle">
              Valid state transitions governed by business rules and role permissions
            </p>

            <div className="action-buttons-flow">
              {/* OPEN -> Start Work */}
              {item.status === 'OPEN' && (
                <button
                  onClick={() => updateStatusMutation.mutate('IN_PROGRESS')}
                  className="btn btn-primary"
                  disabled={updateStatusMutation.isPending}
                >
                  Start Progress &rarr;
                </button>
              )}

              {/* IN_PROGRESS -> Submit for Approval, Block, or Resolve */}
              {item.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => updateStatusMutation.mutate('WAITING_FOR_APPROVAL')}
                    className="btn btn-warning"
                    disabled={updateStatusMutation.isPending}
                  >
                    Submit for Approval
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate('BLOCKED')}
                    className="btn btn-outline-danger"
                    disabled={updateStatusMutation.isPending}
                  >
                    Mark as Blocked
                  </button>
                  {(isLeadOrAdmin || isAssignee) && (
                    <button
                      onClick={() => {
                        setModalMode('RESOLVE');
                        setModalInput('');
                      }}
                      className="btn btn-success"
                    >
                      Resolve Work Item...
                    </button>
                  )}
                </>
              )}

              {/* WAITING_FOR_APPROVAL -> Approve (Lead/Admin, not creator) or Reject */}
              {item.status === 'WAITING_FOR_APPROVAL' && (
                <>
                  {isLeadOrAdmin && !isCreator && (
                    <>
                      <button
                        onClick={() => {
                          setModalMode('APPROVE');
                          setModalInput('');
                        }}
                        className="btn btn-success"
                      >
                        Approve &amp; Resolve
                      </button>
                      <button
                        onClick={() => updateStatusMutation.mutate('IN_PROGRESS')}
                        className="btn btn-outline-warning"
                        disabled={updateStatusMutation.isPending}
                      >
                        Request Revisions (Reject)
                      </button>
                    </>
                  )}
                  {isCreator && (
                    <div className="helper-banner">
                      Approval pending from a Team Lead or Admin. (Self-approval is blocked by policy).
                    </div>
                  )}
                  {!isLeadOrAdmin && !isCreator && (
                    <div className="helper-banner">
                      Pending review by Team Lead or Admin.
                    </div>
                  )}
                </>
              )}

              {/* BLOCKED -> Resume Progress */}
              {item.status === 'BLOCKED' && (
                <button
                  onClick={() => updateStatusMutation.mutate('IN_PROGRESS')}
                  className="btn btn-primary"
                  disabled={updateStatusMutation.isPending}
                >
                  Unblock &amp; Resume Work
                </button>
              )}

              {/* RESOLVED -> Close */}
              {item.status === 'RESOLVED' && (
                <button
                  onClick={() => updateStatusMutation.mutate('CLOSED')}
                  className="btn btn-secondary"
                  disabled={updateStatusMutation.isPending}
                >
                  Close Work Item
                </button>
              )}

              {/* CLOSED -> Reopen (Lead/Admin) */}
              {item.status === 'CLOSED' && isLeadOrAdmin && (
                <button
                  onClick={() => {
                    setModalMode('REOPEN');
                    setModalInput('');
                  }}
                  className="btn btn-outline"
                >
                  Reopen Item...
                </button>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="card comments-card">
            <h3>Discussion &amp; Notes ({item.comments?.length || 0})</h3>
            <div className="comments-list">
              {item.comments && item.comments.length > 0 ? (
                item.comments.map((c: any) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-author">{c.author_name}</span>
                      <span className="comment-time">{formatTimeAgo(c.created_at)}</span>
                    </div>
                    <div className="comment-body">{c.body}</div>
                  </div>
                ))
              ) : (
                <div className="empty-subtext">No comments yet. Start the conversation below.</div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (commentText.trim()) {
                  commentMutation.mutate(commentText.trim());
                }
              }}
              className="comment-form"
            >
              <textarea
                className="textarea-control"
                rows={3}
                placeholder="Add an update, escalation note, or question..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="comment-actions">
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={commentMutation.isPending || !commentText.trim()}
                >
                  {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>

          {/* Audit Activity Timeline */}
          <div className="card activity-card">
            <h3>Audit Activity History</h3>
            <p className="card-subtitle">Immutable log of state changes, assignments, and approvals</p>
            <div className="timeline">
              {item.activities && item.activities.length > 0 ? (
                item.activities.map((a: any) => (
                  <div key={a.id} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-actor">{a.actor_name}</span>
                        <span className="timeline-action">{a.action_type}</span>
                        <span className="timeline-time">{formatTimeAgo(a.created_at)}</span>
                      </div>
                      {a.metadata && <div className="timeline-meta">{a.metadata}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-subtext">No activity recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Attributes and Controls */}
        <aside className="detail-sidebar">
          <div className="card sidebar-card">
            <h3 className="sidebar-heading">Attributes</h3>

            <div className="attribute-group">
              <span className="attr-label">Assigned Team</span>
              <span className="attr-val team-highlight">{item.team_name}</span>
            </div>

            <div className="attribute-group">
              <span className="attr-label">Assignee</span>
              <div className="attr-row">
                <span className="attr-val">
                  {item.assignee_name || (
                    <span className="unassigned-text">Unassigned (Queue)</span>
                  )}
                </span>
                {isLeadOrAdmin && (
                  <button
                    onClick={() => {
                      setSelectedAssignee(item.assignee_id || '');
                      setModalMode('ASSIGN');
                    }}
                    className="btn btn-link-action"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            <div className="attribute-group">
              <span className="attr-label">Priority</span>
              <div className="attr-row">
                <PriorityBadge priority={item.priority} />
                <button
                  onClick={() => {
                    setSelectedPriority(item.priority);
                    setModalMode('PRIORITY');
                  }}
                  className="btn btn-link-action"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="attribute-group">
              <span className="attr-label">Reported By</span>
              <span className="attr-val">{item.creator_name}</span>
            </div>

            <div className="attribute-group">
              <span className="attr-label">Created At</span>
              <span className="attr-val">{new Date(item.created_at).toLocaleString()}</span>
            </div>

            <div className="attribute-group">
              <span className="attr-label">Last Updated</span>
              <span className="attr-val">{new Date(item.updated_at).toLocaleString()}</span>
            </div>

            <div className="attribute-group">
              <span className="attr-label">Item Identifier</span>
              <span className="attr-code">{item.id}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Dynamic Action Modal */}
      {modalMode !== 'NONE' && (
        <div className="modal-backdrop">
          <div className="modal-dialog card">
            <h2>
              {modalMode === 'RESOLVE' && 'Resolve Work Item'}
              {modalMode === 'APPROVE' && 'Approve Work Item'}
              {modalMode === 'REOPEN' && 'Reopen Work Item'}
              {modalMode === 'ASSIGN' && 'Reassign Team Member'}
              {modalMode === 'PRIORITY' && 'Update Priority'}
            </h2>

            <form onSubmit={handleModalSubmit}>
              {modalMode === 'RESOLVE' && (
                <div className="form-group">
                  <label>Resolution Summary *</label>
                  <textarea
                    className="textarea-control"
                    rows={4}
                    placeholder="Describe how this issue was resolved..."
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    required
                  />
                </div>
              )}

              {modalMode === 'APPROVE' && (
                <div className="form-group">
                  <label>Approval Comment (Optional)</label>
                  <textarea
                    className="textarea-control"
                    rows={3}
                    placeholder="Add an optional review or approval note..."
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                  />
                </div>
              )}

              {modalMode === 'REOPEN' && (
                <div className="form-group">
                  <label>Reason for Reopening *</label>
                  <textarea
                    className="textarea-control"
                    rows={3}
                    placeholder="Why does this item require re-examination?..."
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    required
                  />
                </div>
              )}

              {modalMode === 'ASSIGN' && (
                <div className="form-group">
                  <label>Select Team Member</label>
                  <select
                    className="select-control"
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                  >
                    <option value="">-- Unassigned --</option>
                    {teamMembers.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalMode === 'PRIORITY' && (
                <div className="form-group">
                  <label>Select Priority</label>
                  <select
                    className="select-control"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setModalMode('NONE')}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
