import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './Footer.css';

const Footer = () => {
  const [totalSpins, setTotalSpins] = useState(null);

  useEffect(() => {
    const fetchTotalSpins = async () => {
      try {
        const { data, error } = await supabase
          .from('app_statistics')
          .select('total_spins')
          .eq('id', 1)
          .single();

        if (!error && data) {
          setTotalSpins(data.total_spins);
        }
      } catch (err) {
        console.error('Failed to fetch spin statistics:', err);
      }
    };

    fetchTotalSpins();
  }, []);

  const formatNumber = (num) => {
    if (num === null) return '...';
    return num.toLocaleString();
  };

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p className="footer-text">
          Powered by <span className="footer-brand">Attensi</span>
        </p>
        {totalSpins !== null && (
          <p className="footer-stats">
            🎉 {formatNumber(totalSpins)} spins worldwide!
          </p>
        )}
      </div>
    </footer>
  );
};

export default Footer;
