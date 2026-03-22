import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RecordsRoutes from './routes';

// Main App for Records - renders all routes
const App = () => {
  return (
    <div className="App">
      <RecordsRoutes />
    </div>
  );
};

export default App;

