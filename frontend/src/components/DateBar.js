import React from 'react';
import './DateBar.css';

function getFormattedDate() {
  const text = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function DateBar() {
  return (
    <div className="date-bar">
      <div className="date-bar-inner">{getFormattedDate()}</div>
    </div>
  );
}

export default DateBar;
