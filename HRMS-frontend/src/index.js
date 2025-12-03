// src/index.js - UPDATED FOR REACT 18

import React from 'react';
import { createRoot } from 'react-dom/client'; // ✅ Changed from ReactDOM
import App from './App';
import './index.css';

// Chart.js Configuration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Filler, // Register filler plugin so `fill` dataset option works
  Tooltip,
  Legend
);

// Make sure filler plugin isn't disabled by defaults
ChartJS.defaults.plugins = ChartJS.defaults.plugins || {};
ChartJS.defaults.plugins.filler = ChartJS.defaults.plugins.filler || {};

// ✅ REACT 18 - Create root and render
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
