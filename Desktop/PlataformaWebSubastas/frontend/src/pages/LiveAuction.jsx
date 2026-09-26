import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Car,
  Fuel,
  Gauge,
  Calendar,
  Lock,
  ArrowLeft
} from 'lucide-react';

const API_BASE = 'http://localhost:4000/api/vehiculos';
const SOCKET_URL = 'http://localhost:4000';

export default function LiveAuction() {
  const { id } = useParams();

  // Estados de datos del lote
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Estados de galería/carrusel
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Estados de subasta y tiempo real
  const [currentPrice, setCurrentPrice] = useState(0);
  const [highestBidderId, setHighestBidderId] = useState(null);
  const [userHasBid, setUserHasBid] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Entrada de puja personalizada
  const [customBidInput, setCustomBidInput] = useState('');

  // Identificador de usuario autenticado (extraído de localStorage)
  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('usuario_copart');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const socketRef = useRef(null);

  // 1. Cargar detalle del lote desde la API REST
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await axios.get(`${API_BASE}/${id}`);
        const data = res.data;
        setVehicle(data);
        setCurrentPrice(Number(data.PRECIO_ACTUAL || data.MONTO_BASE || 20000));
        setHighestBidderId(data.ID_USUARIO_GANADOR || null);

        if (currentUser && data.ID_USUARIO_GANADOR === currentUser.id) {
          setUserHasBid(true);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('No se pudo cargar la información de la subasta.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // 2. Conexión WebSocket y suscripción a la sala
  useEffect(() => {
    if (!vehicle?.ID_SUBASTA) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    // Unirse a la sala específica de esta subasta
    socket.emit('join_auction', vehicle.ID_SUBASTA);

    // Escuchar actualizaciones de ofertas en tiempo real (sin F5)
    socket.on('bid_update', (data) => {
      if (Number(data.auctionId) === Number(vehicle.ID_SUBASTA)) {
        setCurrentPrice(Number(data.currentPrice));
        setHighestBidderId(Number(data.winnerId));
        setActionError('');
      }
    });

    // Escuchar errores de validación de puja
    socket.on('bid_error', (data) => {
      setActionError(data.message || 'Error al validar la oferta.');
    });

    return () => {
      socket.disconnect();
    };
  }, [vehicle?.ID_SUBASTA]);

  // 3. Temporizador regresivo en vivo
  useEffect(() => {
    if (!vehicle?.FECHA_FIN) return;

    const updateCountdown = () => {
      const target = new Date(vehicle.FECHA_FIN).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setAuctionEnded(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [vehicle?.FECHA_FIN]);

  // Regla de Negocio: Monto mínimo admisible (Superar por al menos el 10%)
  const minRequiredBid = useMemo(() => {
    return Math.ceil(currentPrice * 1.10);
  }, [currentPrice]);

  // Emisión de puja por WebSocket
  const handleBidSubmit = (amountToBid) => {
    if (!currentUser) {
      setActionError('Debes iniciar sesión para poder pujar en esta subasta.');
      return;
    }

    if (auctionEnded) {
      setActionError('La subasta ya se encuentra cerrada.');
      return;
    }

    if (amountToBid < minRequiredBid) {
      setActionError(`Tu oferta debe ser de al menos Q. ${minRequiredBid.toLocaleString('es-GT', { minimumFractionDigits: 2 })} (+10%)`);
      return;
    }

    setActionError('');
    setUserHasBid(true);

    socketRef.current?.emit('submit_bid', {
      auctionId: vehicle.ID_SUBASTA,
      userId: currentUser.id,
      amount: amountToBid
    });

    setCustomBidInput('');
  };

  // Navegación en Carrusel
  const nextPhoto = () => {
    if (!vehicle?.FOTOS?.length) return;
    setActivePhotoIdx((prev) => (prev + 1) % vehicle.FOTOS.length);
  };

  const prevPhoto = () => {
    if (!vehicle?.FOTOS?.length) return;
    setActivePhotoIdx((prev) => (prev - 1 + vehicle.FOTOS.length) % vehicle.FOTOS.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium text-sm">Cargando sala de subasta...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md w-full text-center shadow-sm">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Vehículo no disponible</h2>
          <p className="text-slate-500 text-sm mt-1">{errorMsg || 'No se localizó el lote solicitado.'}</p>
          <Link
            to="/inventario"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inventario
          </Link>
        </div>
      </div>
    );
  }

  const photosList = vehicle.FOTOS && vehicle.FOTOS.length > 0 
    ? vehicle.FOTOS 
    : [{ URL_FOTO: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800' }];

  // Determinación de estado del postor
  const isWinning = currentUser && highestBidderId === currentUser.id;
  const isOutbid = currentUser && userHasBid && highestBidderId !== currentUser.id;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between">
          <Link
            to="/inventario"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Catálogo
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
              VIN: {vehicle.VIN}
            </span>
          </div>
        </div>

        {/* Banner Dinámico de Estado de Puja (Rúbrica: Badge Verde / Badge Rojo) */}
        {isWinning && (
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">¡Vas ganando esta subasta!</h4>
                <p className="text-xs text-emerald-700">Tu postura es la más alta en este momento.</p>
              </div>
            </div>
            <span className="bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Líder Actual
            </span>
          </div>
        )}

        {isOutbid && (
          <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 animate-bounce" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Tu oferta ha sido superada</h4>
                <p className="text-xs text-rose-700">¡Haz tu contraoferta ahora antes de que termine el tiempo!</p>
              </div>
            </div>
            <span className="bg-rose-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Superado
            </span>
          </div>
        )}

        {/* Cuadrícula Principal: Galería (Izq) + Motor de Pujas (Der) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA: Carrusel de 5+ fotos y Ficha Técnica */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Contenedor Carrusel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
              {/* Imagen Principal */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 group">
                <img
                  src={photosList[activePhotoIdx]?.URL_FOTO}
                  alt={`Foto ${activePhotoIdx + 1}`}
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {/* Flechas de navegación */}
                {photosList.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md backdrop-blur-sm transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md backdrop-blur-sm transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Contador de fotos */}
                <div className="absolute bottom-3 right-3 bg-slate-900/70 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-sm font-medium">
                  {activePhotoIdx + 1} / {photosList.length} Fotos
                </div>
              </div>

              {/* Tira de Miniaturas (Mínimo 5 fotos) */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photosList.map((foto, idx) => (
                  <button
                    key={foto.ID_FOTO || idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${
                      activePhotoIdx === idx
                        ? 'border-blue-600 ring-2 ring-blue-600/30'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={foto.URL_FOTO} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Ficha Técnica Detallada */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Ficha Técnica Certificada
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Año</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle.ANIO}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Tipo de Artículo</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle.TIPO_ARTICULO || 'Automóvil'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Motor</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle.MOTOR}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Cilindros</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle.CILINDROS} Cilindros</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Transmisión</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle.TRANSMISION}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Combustible</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle.COMBUSTIBLE}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Tracción</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle.TRACCION}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Nivel de Daño</span>
                  <span className="font-semibold text-slate-800 text-sm">{vehicle.ESTADO_DANIO}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Monto Base Inicial</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    Q. {Number(vehicle.MONTO_BASE).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: Motor de Subastas, Reloj y Panel de Postura */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Tarjeta de Puja Activa */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Título del vehículo */}
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Lote #{vehicle.ID_VEHICULO}
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {vehicle.MARCA} {vehicle.MODELO}
                </h1>
              </div>

              {/* Temporizador Regresivo */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                    Tiempo Restante
                  </span>
                </div>

                {auctionEnded ? (
                  <span className="text-sm font-extrabold text-rose-400 uppercase tracking-widest">
                    OFERTA CERRADA
                  </span>
                ) : (
                  <div className="flex items-center gap-1 font-mono text-lg font-bold text-amber-400">
                    <span className="bg-slate-800 px-2 py-1 rounded">
                      {String(timeLeft.hours).padStart(2, '0')}h
                    </span>
                    <span>:</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">
                      {String(timeLeft.minutes).padStart(2, '0')}m
                    </span>
                    <span>:</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">
                      {String(timeLeft.seconds).padStart(2, '0')}s
                    </span>
                  </div>
                )}
              </div>

              {/* Monto Actual en Tiempo Real */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Oferta Actual Más Alta
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                  Q. {currentPrice.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Postor Anónimo #{highestBidderId ? String(highestBidderId).padStart(4, '0') : 'Sin ofertas'}
                </p>
              </div>

              {/* Error en acción de puja */}
              {actionError && (
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Formulario de Pujas */}
              {auctionEnded ? (
                <div className="bg-slate-100 p-4 rounded-xl text-center border border-slate-200">
                  <Lock className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-slate-700">Subasta Finalizada</p>
                  <p className="text-xs text-slate-500">Ya no se admiten más posturas para este vehículo.</p>
                </div>
              ) : !currentUser ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center space-y-2">
                  <p className="text-xs text-amber-800 font-medium">
                    Debes tener una cuenta activa para realizar ofertas en vivo.
                  </p>
                  <Link
                    to="/login"
                    className="inline-block w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Iniciar Sesión para Ofertar
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Botón de Puja Rápida (+10% Reglamentario) */}
                  <button
                    onClick={() => handleBidSubmit(minRequiredBid)}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Flame className="w-4 h-4 text-amber-300" />
                    Pujar Q. {minRequiredBid.toLocaleString('es-GT', { minimumFractionDigits: 2 })} (+10%)
                  </button>

                  {/* Input de Puja Personalizada */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      O ingresa un monto superior (Mínimo Q. {minRequiredBid.toLocaleString('es-GT')}):
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">Q.</span>
                        <input
                          type="number"
                          placeholder={String(minRequiredBid)}
                          value={customBidInput}
                          onChange={(e) => setCustomBidInput(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                        />
                      </div>
                      <button
                        onClick={() => handleBidSubmit(Number(customBidInput))}
                        disabled={!customBidInput}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Garantía y Privacidad */}
              <div className="border-t border-slate-100 pt-4 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Postor anónimo cifrado. Procedimiento atómico en Oracle FREEPDB1.</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}