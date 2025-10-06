import { useNavigate } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event, onUpdate }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return '#999';
      case 'live':
        return '#4caf50';
      case 'ended':
        return '#ff9800';
      case 'archived':
        return '#666';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const stats = event.stats || { totalParticipants: 0, winners: 0, emailsSent: 0 };

  return (
    <div className="event-card">
      <div className="event-card-header">
        <h3 className="event-name">{event.name}</h3>
        <span
          className="status-badge"
          style={{ backgroundColor: getStatusColor(event.status) }}
        >
          {getStatusLabel(event.status)}
        </span>
      </div>

      <div className="event-card-body">
        <div className="event-stats-grid">
          <div className="event-stat-item">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalParticipants}</div>
              <div className="stat-label">Participants</div>
            </div>
          </div>
          <div className="event-stat-item">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-value">{stats.winners}</div>
              <div className="stat-label">Winners</div>
            </div>
          </div>
          <div className="event-stat-item">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <div className="stat-value">{stats.emailsSent}</div>
              <div className="stat-label">Emails Sent</div>
            </div>
          </div>
        </div>

        <div className="event-meta-dates">
          Created {formatDate(event.created_at)}
          {event.started_at && ` • Started ${formatDate(event.started_at)}`}
        </div>
      </div>

      <div className="event-card-actions">
        <button
          className="btn-action btn-view"
          onClick={() => navigate(`/events/${event.id}`)}
        >
          Manage Event
        </button>
      </div>
    </div>
  );
};

export default EventCard;
