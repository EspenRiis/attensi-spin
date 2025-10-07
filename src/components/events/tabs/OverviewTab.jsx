import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import EventQRCodePanel from '../EventQRCodePanel';
import './OverviewTab.css';

const OverviewTab = ({ event, onEventUpdate }) => {
  const { id } = useParams();
  const [participantCount, setParticipantCount] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchParticipantCount();
    subscribeToParticipants();
  }, [id]);

  const fetchParticipantCount = async () => {
    const { count } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id);

    setParticipantCount(count || 0);
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel(`event-${id}-participants-overview`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `event_id=eq.${id}`
      }, () => {
        fetchParticipantCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      onEventUpdate({ ...event, ...updates });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update event status');
    } finally {
      setUpdating(false);
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

  return (
    <div className="overview-tab">
      {/* Event Meta */}
      <div className="event-meta">
        <span>Created: {formatDate(event.created_at)}</span>
        {event.started_at && <span>Started: {formatDate(event.started_at)}</span>}
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
                onClick={() => document.querySelector('.event-qr-panel')?.scrollIntoView({ behavior: 'smooth' })}
              >
                📱 View QR Code
              </button>
              <button
                className="action-btn action-live-view"
                onClick={() => window.open(`/?eventId=${id}`, '_blank')}
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

      {/* Stats Dashboard - Moved higher */}
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

      {/* QR Code Panel - Show only when event is live, moved to bottom and compacted */}
      {event.status === 'live' && (
        <EventQRCodePanel eventId={event.id} eventName={event.name} event={event} onEventUpdate={onEventUpdate} />
      )}
    </div>
  );
};

export default OverviewTab;
