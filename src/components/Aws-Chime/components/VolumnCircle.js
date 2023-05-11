import React, { memo } from 'react';

const VolumnCircle = ({ volume = 0 }) => (
  <div className="volumn-cricle">
    <div style={{ height: volume ? `${volume / 1.5}%` : '2px' }} />
    <div style={{ height: volume ? `${volume}%` : '2px' }} />
    <div style={{ height: volume ? `${volume}%` : '2px' }} />
    <div style={{ height: volume ? `${volume / 1.5}%` : '2px' }} />
  </div>
);

export default memo(VolumnCircle);
