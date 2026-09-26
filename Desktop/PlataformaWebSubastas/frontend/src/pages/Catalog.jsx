import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  RotateCcw, 
  Flame, 
  Car, 
  Calendar, 
  Fuel, 
  Gauge, 
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

const API_BASE = 'http://localhost:4000/api/vehiculos';

export default function Catalog() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de filtros multitarea
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedFuel, setSelectedFuel] = useState('ALL');
  const [selectedDamage, setSelectedDamage] = useState('ALL');

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_BASE}/catalogo`);
      setVehicles(res.data || []);
    } catch (err) {
      console.error(err);
      setError('No se pudo sincronizar el inventario con el servidor de subastas.');
    } finally {
      setLoading(false);
    }
  };

  // Listas dinámicas para los menús desplegables
  const uniqueBrands = useMemo(() => {
    const brands = vehicles.map(v => v.MARCA).filter(Boolean);
    return ['ALL', ...new Set(brands)].sort();
  }, [vehicles]);

  const uniqueYears = useMemo(() => {
    const years = vehicles.map(v => v.ANIO).filter(Boolean);
    return ['ALL', ...new Set(years)].sort((a, b) => b - a);
  }, [vehicles]);

  const uniqueFuels = useMemo(() => {
    const fuels = vehicles.map(v => v.COMBUSTIBLE).filter(Boolean);
    return ['ALL', ...new Set(fuels)].sort();
  }, [vehicles]);

  // Lógica de filtrado en cliente para respuesta inmediata
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.MARCA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.MODELO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.VIN?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBrand = selectedBrand === 'ALL' || item.MARCA === selectedBrand;
      const matchYear = selectedYear === 'ALL' || String(item.ANIO) === String(selectedYear);
      const matchFuel = selectedFuel === 'ALL' || item.COMBUSTIBLE?.toLowerCase() === selectedFuel.toLowerCase();
      const matchDamage = selectedDamage === 'ALL' || item.ESTADO_DANIO === selectedDamage;

      return matchSearch && matchBrand && matchYear && matchFuel && matchDamage;
    });
  }, [vehicles, searchTerm, selectedBrand, selectedYear, selectedFuel, selectedDamage]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBrand('ALL');
    setSelectedYear('ALL');
    setSelectedFuel('ALL');
    setSelectedDamage('ALL');
  };

  // Renderizador de badge de daño según requerimiento Copart
  const renderDamageBadge = (damage) => {
    switch (damage) {
      case 'VERDE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Verde: Título Limpio
          </span>
        );
      case 'AMARILLO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-600"></span>
            Amarillo: Reparable
          </span>
        );
      case 'ROJO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-600"></span>
            Rojo: Salvamento
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {damage || 'No especificado'}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      {/* Contenedor Principal */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado Principal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-4 w-4" /> Plataforma de Remates Copart
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Inventario Global de Subastas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Vehículos importados certificados con posturas directas en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 text-right">
              <span className="text-xs font-medium text-slate-500 block">Lotes Disponibles</span>
              <span className="text-xl font-bold text-slate-900">{filteredVehicles.length}</span>
            </div>
          </div>
        </div>

        {/* Panel de Filtros Multitarea (Paleta Clara) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Barra de Búsqueda y Botón Limpiar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por marca, modelo o serie VIN..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>

            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <RotateCcw className="h-4 w-4" />
              Restablecer Filtros
            </button>
          </div>

          {/* Selector de Semáforo de Daños (Botones rápidos) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Clasificación de Daño (Semáforo)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDamage('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  selectedDamage === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedDamage('VERDE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                  selectedDamage === 'VERDE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                🟢 Verde (Limpio)
              </button>
              <button
                onClick={() => setSelectedDamage('AMARILLO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                  selectedDamage === 'AMARILLO'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                🟡 Amarillo (Reparable)
              </button>
              <button
                onClick={() => setSelectedDamage('ROJO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                  selectedDamage === 'ROJO'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                🔴 Rojo (Salvamento)
              </button>
            </div>
          </div>

          {/* Menús Desplegables: Marca, Año, Combustible */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Marca</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="ALL">Todas las Marcas</option>
                {uniqueBrands.filter(b => b !== 'ALL').map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Año</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="ALL">Todos los Años</option>
                {uniqueYears.filter(y => y !== 'ALL').map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Combustible</label>
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="ALL">Cualquier Combustible</option>
                {uniqueFuels.filter(f => f !== 'ALL').map(fuel => (
                  <option key={fuel} value={fuel}>{fuel}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Estado de Carga */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-pulse space-y-4">
                <div className="w-full h-48 bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Listado de Tarjetas (Cards) */}
        {!loading && filteredVehicles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((item) => (
              <div 
                key={item.ID_VEHICULO}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
              >
                {/* Cabecera / Imagen con Badge */}
                <div className="relative">
                  <img
                    src={item.FOTO_PRINCIPAL || 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800'}
                    alt={`${item.MARCA} ${item.MODELO}`}
                    className="w-full h-52 object-cover bg-slate-100"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    {renderDamageBadge(item.ESTADO_DANIO)}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-slate-800 shadow-sm border border-slate-200 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    {item.ESTADO_SUBASTA || 'EN_VIVO'}
                  </div>
                </div>

                {/* Contenido Técnico */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">
                        {item.ANIO} • {item.TIPO_ARTICULO || 'Automóvil'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        VIN: {item.VIN ? `...${item.VIN.slice(-6)}` : 'N/A'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-1">
                      {item.MARCA} {item.MODELO}
                    </h3>

                    {/* Especificaciones clave en badges */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Gauge className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.MOTOR || 'Motor estándar'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Fuel className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.COMBUSTIBLE || 'Gasolina'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Car className="h-3.5 w-3.5 text-slate-400" />
                        <span>Tracción: {item.TRACCION || 'FWD'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Trans: {item.TRANSMISION || 'Automática'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sección de Precios y Acción */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Oferta Actual</p>
                      <p className="text-xl font-extrabold text-slate-900">
                        Q. {Number(item.PRECIO_ACTUAL || item.MONTO_BASE || 20000).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <Link
                      to={`/subasta/${item.ID_VEHICULO}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition"
                    >
                      <Flame className="h-4 w-4 text-amber-300" />
                      Ir a Pujar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && filteredVehicles.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
            <Car className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-900">No hay vehículos con estos filtros</h3>
            <p className="text-sm text-slate-500 mt-1">
              Prueba cambiando la marca, año o el semáforo de daños para ampliar tu búsqueda.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl transition"
            >
              Limpiar Búsqueda
            </button>
          </div>
        )}

      </div>
    </div>
  );
}