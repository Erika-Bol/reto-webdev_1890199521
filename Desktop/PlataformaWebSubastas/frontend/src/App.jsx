import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Catalog from './pages/Catalog';
import LiveAuction from './pages/LiveAuction';
import Auth from './pages/Auth';
import CreateVehicle from './pages/CreateVehicle';

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/inventario" replace />} />
        <Route path="/inventario" element={<Catalog />} />
        <Route path="/subasta/:id" element={<LiveAuction />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/publicar" element={<CreateVehicle />} />
      </Routes>
    </Router>
  );
}