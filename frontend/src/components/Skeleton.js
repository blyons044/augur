import React from 'react';

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line skeleton-short" />
      <div className="skeleton-block" />
      <div className="skeleton-line skeleton-long" />
      <div className="skeleton-line skeleton-medium" />
      <div className="skeleton-chart" />
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-score">
        <div className="skeleton-circle" />
        <div className="skeleton-bars">
          <div className="skeleton-bar" />
          <div className="skeleton-bar" />
          <div className="skeleton-bar" />
        </div>
      </div>
      <div className="skeleton-grid">
        {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

export { SkeletonCard, SkeletonDashboard };
