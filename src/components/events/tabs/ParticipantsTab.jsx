import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import Papa from 'papaparse';
import './ParticipantsTab.css';

const ParticipantsTab = ({ event }) => {
  const { id } = useParams();
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // all, active, archived
  const [winnerFilter, setWinnerFilter] = useState('all');
  const [consentFilter, setConsentFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Selection
  const [selectedParticipants, setSelectedParticipants] = useState(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchParticipants();
    subscribeToParticipants();
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [participants, searchQuery, statusFilter, winnerFilter, consentFilter, sortColumn, sortDirection]);

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching participants:', error);
    } else {
      setParticipants(data || []);
    }
    setLoading(false);
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel(`event-${id}-participants-tab`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `event_id=eq.${id}`
      }, () => {
        fetchParticipants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const applyFilters = () => {
    let filtered = [...participants];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
      );
    }

    // Status filter (active/archived)
    if (statusFilter === 'active') {
      filtered = filtered.filter(p => p.status === 'active' || !p.status); // Include legacy records without status
    } else if (statusFilter === 'archived') {
      filtered = filtered.filter(p => p.status === 'archived');
    }
    // 'all' shows everything

    if (winnerFilter === 'winners') {
      filtered = filtered.filter(p => p.is_winner);
    } else if (winnerFilter === 'not-winners') {
      filtered = filtered.filter(p => !p.is_winner);
    }

    if (consentFilter === 'consented') {
      filtered = filtered.filter(p => p.consent_marketing);
    } else if (consentFilter === 'not-consented') {
      filtered = filtered.filter(p => !p.consent_marketing);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (sortColumn === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredParticipants(filtered);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(paginatedParticipants.map(p => p.id));
      setSelectedParticipants(allIds);
    } else {
      setSelectedParticipants(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParticipants(newSelected);
  };

  const handleDelete = async (participantId) => {
    if (!confirm('Are you sure you want to delete this participant?')) return;

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      console.error('Error deleting participant:', error);
      alert('Failed to delete participant');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedParticipants.size === 0) {
      alert('No participants selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedParticipants.size} participant(s)?`)) return;

    const { error } = await supabase
      .from('participants')
      .delete()
      .in('id', Array.from(selectedParticipants));

    if (error) {
      console.error('Error deleting participants:', error);
      alert('Failed to delete participants');
    } else {
      setSelectedParticipants(new Set());
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportCSV = () => {
    // Use filtered participants for export
    const dataToExport = filteredParticipants.map(p => ({
      Name: p.name || '',
      Email: p.email || '',
      Organization: p.organization || '',
      Phone: p.phone || '',
      'Marketing Consent': p.consent_marketing ? 'Yes' : 'No',
      Winner: p.is_winner ? 'Yes' : 'No',
      'Registered At': formatDate(p.created_at),
      'Custom Field 1': p.custom_field_1 || '',
      'Custom Field 2': p.custom_field_2 || ''
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `participants_${event?.name || 'event'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedParticipants = filteredParticipants.slice(startIndex, endIndex);

  if (loading) {
    return <div className="loading-state">Loading participants...</div>;
  }

  return (
    <div className="participants-tab">
      {/* Filters and Actions */}
      <div className="table-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
            <option value="all">All Status</option>
          </select>

          <select
            value={winnerFilter}
            onChange={(e) => setWinnerFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Participants</option>
            <option value="winners">Winners Only</option>
            <option value="not-winners">Not Winners</option>
          </select>

          <select
            value={consentFilter}
            onChange={(e) => setConsentFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Consent</option>
            <option value="consented">Consented</option>
            <option value="not-consented">Not Consented</option>
          </select>
        </div>

        <div className="bulk-actions">
          {selectedParticipants.size > 0 && (
            <>
              <span className="selected-count">
                {selectedParticipants.size} selected
              </span>
              <button onClick={handleBulkDelete} className="btn-delete">
                Delete Selected
              </button>
            </>
          )}
          {filteredParticipants.length > 0 && (
            <button onClick={handleExportCSV} className="btn-export">
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="participant-stats">
        <div className="stat">
          <span className="stat-value">{participants.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat">
          <span className="stat-value">{participants.filter(p => p.status === 'active' || !p.status).length}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat">
          <span className="stat-value">{participants.filter(p => p.status === 'archived').length}</span>
          <span className="stat-label">Archived</span>
        </div>
        <div className="stat">
          <span className="stat-value">{participants.filter(p => p.is_winner).length}</span>
          <span className="stat-label">Winners</span>
        </div>
        <div className="stat">
          <span className="stat-value">{filteredParticipants.length}</span>
          <span className="stat-label">Filtered</span>
        </div>
      </div>

      {/* Table */}
      {paginatedParticipants.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="empty-icon">👥</div>
          <h2>No participants yet</h2>
          <p>Share your QR code to start collecting registrations!</p>
        </motion.div>
      ) : (
        <motion.div
          className="table-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <table className="participant-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginatedParticipants.length > 0 &&
                             paginatedParticipants.every(p => selectedParticipants.has(p.id))}
                  />
                </th>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  Email {sortColumn === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Organization</th>
                <th>Phone</th>
                <th className="col-center">Consent</th>
                <th className="col-center">Winner</th>
                <th onClick={() => handleSort('created_at')} className="sortable">
                  Registered {sortColumn === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedParticipants.map((participant) => (
                <tr key={participant.id} style={{ opacity: participant.status === 'archived' ? 0.5 : 1 }}>
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.has(participant.id)}
                      onChange={() => handleSelectOne(participant.id)}
                    />
                  </td>
                  <td className="col-name">
                    {participant.name || '-'}
                    {participant.status === 'archived' && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#9ca3af' }}>
                        (archived)
                      </span>
                    )}
                  </td>
                  <td className="col-email">{participant.email || '-'}</td>
                  <td>{participant.organization || '-'}</td>
                  <td>{participant.phone || '-'}</td>
                  <td className="col-center">
                    {participant.consent_marketing ? '✓' : '✗'}
                  </td>
                  <td className="col-center">
                    {participant.is_winner ? '🏆' : '-'}
                  </td>
                  <td className="col-date">{formatDate(participant.created_at)}</td>
                  <td className="col-actions">
                    <button
                      onClick={() => handleDelete(participant.id)}
                      className="btn-action btn-delete-single"
                      title="Delete participant"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantsTab;
