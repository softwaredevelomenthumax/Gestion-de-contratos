import React from 'react';

const EstadoLegend = ({ legendItems }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      {legendItems.map((item, idx) => (
        <span key={idx} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${item.color}`}>{item.label}</span>
      ))}
    </div>
  );
};

export default EstadoLegend;