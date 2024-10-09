import React from 'react';

const ArrowIcon = () => {
  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        padding: '10px',
        zIndex: '999999999999'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" id="arrow" width="64" height="64">
        <g fill="#134563">
          <path d="M32 55.9C18.8 55.9 8.1 45.2 8.1 32S18.8 8.1 32 8.1 55.9 18.8 55.9 32 45.2 55.9 32 55.9zm0-45.2c-11.7 0-21.3 9.6-21.3 21.3S20.3 53.3 32 53.3 53.3 43.7 53.3 32 43.7 10.7 32 10.7z"></path>
          <path d="M32.5 45.7 18.8 32l13.7-13.7 1.8 1.9L22.6 32l11.7 11.8-1.8 1.9"></path>
          <path d="M20.7 30.6h24v2.8h-24z"></path>
        </g>
      </svg>
    </div>
  );
};

export default ArrowIcon;
