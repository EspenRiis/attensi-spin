import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { calculateKDE, calculateBandwidth, calculateStats, generateSVGPath } from '../../../utils/kde';
import './DistributionCurve.css';

const DistributionCurve = ({ data, minLabel, maxLabel }) => {
  // Calculate KDE curve and stats
  const { curvePoints, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        curvePoints: [],
        stats: { mean: 0, median: 0, mode: 0, stdDev: 0, totalResponses: 0 }
      };
    }

    const bandwidth = calculateBandwidth(data);
    const points = calculateKDE(data, bandwidth, 101);
    const statistics = calculateStats(data);

    return {
      curvePoints: points,
      stats: statistics
    };
  }, [data]);

  // Generate SVG path
  const svgPath = useMemo(() => {
    if (curvePoints.length === 0) return '';
    return generateSVGPath(curvePoints, 600, 300);
  }, [curvePoints]);

  const hasData = stats.totalResponses > 0;

  return (
    <div className="distribution-curve">
      <div className="curve-header">
        <h3>Response Distribution</h3>
        <div className="response-count">
          {stats.totalResponses} {stats.totalResponses === 1 ? 'response' : 'responses'}
        </div>
      </div>

      <div className="curve-container">
        {!hasData ? (
          <div className="no-data">
            <span className="no-data-icon">📊</span>
            <p>Waiting for responses...</p>
            <p className="no-data-hint">Participants will see sliders to respond</p>
          </div>
        ) : (
          <motion.div
            className="curve-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <svg
              className="curve-svg"
              viewBox="0 0 600 300"
              preserveAspectRatio="none"
            >
              {/* Gradient definition */}
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#C06C84" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <g className="grid-lines">
                {[0, 25, 50, 75, 100].map(value => (
                  <line
                    key={value}
                    x1={(value / 100) * 600}
                    y1="0"
                    x2={(value / 100) * 600}
                    y2="300"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                  />
                ))}
              </g>

              {/* Curve path */}
              <motion.path
                d={svgPath}
                fill="url(#curveGradient)"
                stroke="#FF6B9D"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />

              {/* Mean marker */}
              {stats.mean > 0 && (
                <g className="mean-marker">
                  <line
                    x1={(stats.mean / 100) * 600}
                    y1="0"
                    x2={(stats.mean / 100) * 600}
                    y2="300"
                    stroke="#00FF88"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </g>
              )}
            </svg>

            {/* X-axis labels */}
            <div className="axis-labels">
              <span className="axis-label axis-label-min">
                {minLabel || '0'}
              </span>
              <span className="axis-label axis-label-center">50</span>
              <span className="axis-label axis-label-max">
                {maxLabel || '100'}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Statistics */}
      {hasData && (
        <motion.div
          className="stats-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="stat-item">
            <span className="stat-label">Mean</span>
            <span className="stat-value">{stats.mean}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Median</span>
            <span className="stat-value">{stats.median}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Mode</span>
            <span className="stat-value">{stats.mode}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Std Dev</span>
            <span className="stat-value">{stats.stdDev}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DistributionCurve;
