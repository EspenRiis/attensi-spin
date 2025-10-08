import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';
import './Dashboard.css';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserAndEvents();
  }, []);

  const fetchUserAndEvents = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch user's events
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        // Fetch stats for each event
        const eventsWithStats = await Promise.all(
          (data || []).map(async (event) => {
            const stats = await fetchEventStats(event.id);
            return { ...event, stats };
          })
        );
        setEvents(eventsWithStats);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStats = async (eventId) => {
    try {
      // Get total participants
      const { count: totalCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      // Get winner count
      const { count: winnerCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('is_winner', true);

      // Get emails sent count
      const { count: emailsSentCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .not('winner_email_sent_at', 'is', null);

      return {
        totalParticipants: totalCount || 0,
        winners: winnerCount || 0,
        emailsSent: emailsSentCount || 0
      };
    } catch (err) {
      console.error('Error fetching event stats:', err);
      return { totalParticipants: 0, winners: 0, emailsSent: 0 };
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Create Event Button - Top Right */}
        <div className="dashboard-top-bar">
          <h1 className="dashboard-title">My Events</h1>
          <button className="btn-create-event" onClick={() => setShowCreateModal(true)}>
            + Create New Event
          </button>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="empty-icon">📋</div>
            <h2>No events yet</h2>
            <p>Create your first event to get started!</p>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              Create Your First Event
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="events-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EventCard event={event} onUpdate={fetchUserAndEvents} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUserAndEvents();
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
