import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

export default function AuctionRoom({ auctionId, initialPrice, vehicleName, minIncrement }) {
  const [currentPrice, setCurrentPrice] = useState(initialPrice);
  const [error, setError] = useState('');
  const [customBid, setCustomBid] = useState('');

  useEffect(() => {
    socket.emit('join_auction', auctionId);

    socket.on('bid_update', (data) => {
      if (data.auctionId === auctionId) {
        setCurrentPrice(data.currentPrice);
        setError('');
      }
    });

    socket.on('bid_error', (data) => {
      setError(data.message);
    });

    return () => {
      socket.off('bid_update');
      socket.off('bid_error');
    };
  }, [auctionId]);

  const sendBid = (amount) => {
    // ID de usuario simulado (reemplazar con el token decodificado de AuthContext)
    const simulatedUserId = 1; 
    socket.emit('submit_bid', {
      auctionId,
      userId: simulatedUserId,
      amount: Number(amount)
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold tracking-wide">{vehicleName}</h2>
        <span className="bg-red-600 px-3 py-1 text-xs font-semibold rounded-full animate-pulse">
          EN VIVO
        </span>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg text-center my-4 border border-slate-600">
        <p className="text-sm text-slate-400 uppercase font-medium">Puja Actual</p>
        <p className="text-4xl font-extrabold text-green-400 mt-1">${currentPrice.toLocaleString()}</p>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-300 bg-red-950 border border-red-800 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => sendBid(currentPrice + minIncrement)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 font-semibold rounded transition"
        >
          Pujar +${minIncrement}
        </button>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder={`Min $${currentPrice + minIncrement}`}
            value={customBid}
            onChange={(e) => setCustomBid(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
          <button
            onClick={() => {
              if (customBid) {
                sendBid(customBid);
                setCustomBid('');
              }
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 font-semibold rounded transition text-sm"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}