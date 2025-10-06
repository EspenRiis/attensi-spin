import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import OverviewTab from './tabs/OverviewTab';
import ParticipantsTab from './tabs/ParticipantsTab';
import CustomizeTab from './tabs/CustomizeTab';
import './EventLayout.css';

const EventLayout = () => {
  const { id, tab } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Determine active tab from URL
  const activeTab = tab || 'overview';

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

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
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event');
      setLoading(false);
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

  if (loading) {
    return (
      <div className="event-layout-page">
        <div className="loading-state">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-layout-page">
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
    <div className="event-layout-page">
      <div className="event-layout-container">
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
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="event-tabs">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => navigate(`/events/${id}/customize`)}
            className={`tab ${activeTab === 'customize' ? 'active' : ''}`}
          >
            Customize
          </button>
          <button
            onClick={() => navigate(`/events/${id}/participants`)}
            className={`tab ${activeTab === 'participants' ? 'active' : ''}`}
          >
            Participants
          </button>
          <button
            onClick={() => navigate(`/events/${id}/emails`)}
            className={`tab ${activeTab === 'emails' ? 'active' : ''}`}
          >
            Emails
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && <OverviewTab event={event} onEventUpdate={setEvent} />}
          {activeTab === 'participants' && <ParticipantsTab event={event} />}
          {activeTab === 'customize' && <CustomizeTab event={event} onEventUpdate={setEvent} />}
          {activeTab === 'emails' && (
            <div className="placeholder-tab">
              <h2>Email Templates</h2>
              <p>Email template editor coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventLayout;
