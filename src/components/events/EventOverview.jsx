import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import EventQRCodePanel from './EventQRCodePanel';
import './EventOverview.css';

const EventOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEventData();
    subscribeToParticipants();
  }, [id]);

  const fetchEventData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('host_user_id', user.id)
        .single();

      if (eventError) {
        if (eventError.code === 'PGRST116') {
          setError('Event not found or you do not have access');
        } else {
          throw eventError;
        }
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Fetch participant count
      const { count, error: countError } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id);

      if (!countError) {
        setParticipantCount(count || 0);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event');
      setLoading(false);
    }
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel(`event-${id}-participants`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `event_id=eq.${id}`
      }, () => {
        // Refetch participant count
        fetchParticipantCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchParticipantCount = async () => {
    const { count } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id);

    setParticipantCount(count || 0);
  };

  const updateEventStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const updates = { status: newStatus };

      if (newStatus === 'live' && !event.started_at) {
        updates.started_at = new Date().toISOString();
      }

      if (newStatus === 'ended' && !event.ended_at) {
        updates.ended_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setEvent({ ...event, ...updates });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update event status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#999';
      case 'live': return '#4caf50';
      case 'ended': return '#ff9800';
      case 'archived': return '#666';
      default: return '#999';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="event-overview-page">
        <div className="loading-state">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-overview-page">
        <div className="error-state">
          <h2>{error || 'Event not found'}</h2>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-overview-page">
      <div className="event-container">
        {/* Header */}
        <div className="event-header">
          <div className="header-top">
            <button onClick={() => navigate('/dashboard')} className="back-link">
              ← Back to Dashboard
            </button>
          </div>

          <div className="header-main">
            <div className="event-title-section">
              <h1 className="event-title">{event.name}</h1>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(event.status) }}
              >
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>

            <div className="event-meta">
              <span>Created: {formatDate(event.created_at)}</span>
              {event.started_at && <span>Started: {formatDate(event.started_at)}</span>}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="event-tabs">
          <Link to={`/events/${id}`} className="tab active">Overview</Link>
          <Link to={`/events/${id}/customize`} className="tab">Customize</Link>
          <Link to={`/events/${id}/participants`} className="tab">Participants</Link>
          <Link to={`/events/${id}/emails`} className="tab">Emails</Link>
          <Link to={`/events/${id}/live`} className="tab">Live View</Link>
        </div>

        {/* Quick Actions */}
        <motion.div
          className="quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {event.status === 'draft' && (
              <button
                className="action-btn action-go-live"
                onClick={() => updateEventStatus('live')}
                disabled={updating}
              >
                🚀 Go Live
              </button>
            )}

            {event.status === 'live' && (
              <>
                <button
                  className="action-btn action-view-qr"
                  onClick={() => alert('QR Code modal coming in next phase!')}
                >
                  📱 View QR Code
                </button>
                <button
                  className="action-btn action-live-view"
                  onClick={() => window.open(`/events/${id}/live`, '_blank')}
                >
                  🎡 Open Live View
                </button>
                <button
                  className="action-btn action-end-event"
                  onClick={() => updateEventStatus('ended')}
                  disabled={updating}
                >
                  ⏹️ End Event
                </button>
              </>
            )}

            {event.status === 'ended' && (
              <button
                className="action-btn action-archive"
                onClick={() => updateEventStatus('archived')}
                disabled={updating}
              >
                📦 Archive Event
              </button>
            )}
          </div>
        </motion.div>

        {/* QR Code Panel - Show only when event is live */}
        {event.status === 'live' && (
          <EventQRCodePanel eventId={event.id} eventName={event.name} />
        )}

        {/* Stats Dashboard */}
        <motion.div
          className="event-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2>Event Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{participantCount}</div>
              <div className="stat-label">Total Participants</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Winners Selected</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Emails Sent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{event.status === 'live' ? '🟢' : '⚪'}</div>
              <div className="stat-label">Status</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EventOverview;
