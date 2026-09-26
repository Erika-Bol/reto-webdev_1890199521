import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Car,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Calendar,
  ShieldAlert,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

const API_VEHICULOS = 'http://localhost:4000/api/vehiculos';

export default function CreateVehicle() {
  const navigate = useNavigate();

  // Ficha técnica estructurada
  const [formData, setFormData] = useState({
    vin: '',
    tipoArticulo: 'Automóvil',
    anio: new Date().getFullYear(),
    marca: '',
    modelo: '',
    motor: '',
    cilindros: 4,
    transmision: 'Automática',
    combustible: 'Gasolina',
    traccion: 'FWD',
    estadoDanio: 'VERDE',
    montoBase: 20000,
    fechaInicio: new Date().toISOString().slice(0, 16),
    fechaFin: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  // Galería de fotos (mínimo 5 obligatorias)
  const [fotos, setFotos] = useState([
    '', '', '', '', ''
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Manejo de cambios en campos de texto/select
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejo de URLs de fotografías
  const handlePhotoUrlChange = (index, value) => {
    const updated = [...fotos];
    updated[index] = value;
    setFotos(updated);
  };

  const addPhotoField = () => {
    setFotos([...fotos, '']);
  };

  const removePhotoField = (index) => {
    if (fotos.length <= 5) {
      setErrorMsg('Requisito estricto de Copart: Mínimo 5 fotografías por vehículo.');
      return;
    }
    const updated = fotos.filter((_, idx) => idx !== index);
    setFotos(updated);
  };

  // Carga rápida de imágenes de prueba para agilizar la evaluación
  const fillSamplePhotos = () => {
    setFotos([
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'
    ]);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const token = localStorage.getItem('token_copart');
    if (!token) {
      setErrorMsg('Debes iniciar sesión para registrar y subastar un vehículo.');
      navigate('/login');
      return;
    }

    // 1. Validar VIN (17 caracteres estándar)
    if (formData.vin.trim().length !== 17) {
      setErrorMsg('El número VIN debe contener exactamente 17 caracteres alfanuméricos.');
      return;
    }

    // 2. Validar regla de negocio: Monto Base >= Q. 20,000.00
    if (Number(formData.montoBase) < 20000) {
      setErrorMsg('El monto base inicial no puede ser inferior a Q. 20,000.00.');
      return;
    }

    // 3. Validar regla de negocio: Mínimo 5 fotos no vacías
    const cleanPhotos = fotos.map((f) => f.trim()).filter((f) => f.length > 0);
    if (cleanPhotos.length < 5) {
      setErrorMsg(`Has ingresado ${cleanPhotos.length} fotografía(s). Se requieren al menos 5 enlaces válidos.`);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        anio: Number(formData.anio),
        cilindros: Number(formData.cilindros),
        montoBase: Number(formData.montoBase),
        fotos: cleanPhotos
      };

      const res = await axios.post(API_VEHICULOS, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccessMsg('¡Vehículo registrado e ingresado al inventario global de subastas con éxito!');
      setTimeout(() => {
        navigate(`/subasta/${res.data.idVehiculo}`);
      }, 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'Error al procesar el registro del lote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <Link
            to="/inventario"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Cancelar y Volver
          </Link>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Módulo Proveedor / Usuario
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Publicar Vehículo en Subasta
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ingresa la ficha técnica certificada, galería fotográfica y parámetros de remate para el inventario global.
            </p>
          </div>

          {/* Notificaciones */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold text-rose-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SECCIÓN 1: SEMÁFORO DE DAÑOS COPART */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                1. Clasificación por Estado de Daño (Semáforo Oficial) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, estadoDanio: 'VERDE' })}
                  className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    formData.estadoDanio === 'VERDE'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-bold text-xs text-emerald-800 uppercase tracking-wider">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    🟢 Verde
                  </span>
                  <p className="text-xs text-slate-600 mt-2 font-medium">Daño menor / Título Limpio (Clean Title)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, estadoDanio: 'AMARILLO' })}
                  className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    formData.estadoDanio === 'AMARILLO'
                      ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-bold text-xs text-amber-800 uppercase tracking-wider">
                    <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                    🟡 Amarillo
                  </span>
                  <p className="text-xs text-slate-600 mt-2 font-medium">Daño medio / Reparable (Repairable)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, estadoDanio: 'ROJO' })}
                  className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    formData.estadoDanio === 'ROJO'
                      ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-bold text-xs text-rose-800 uppercase tracking-wider">
                    <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                    🔴 Rojo
                  </span>
                  <p className="text-xs text-slate-600 mt-2 font-medium">Daño severo / Salvamento (Salvage)</p>
                </button>
              </div>
            </div>

            {/* SECCIÓN 2: FICHA TÉCNICA */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2">
                2. Ficha Técnica del Vehículo
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Número de VIN (17 Dígitos) *</label>
                  <input
                    type="text"
                    name="vin"
                    required
                    maxLength={17}
                    placeholder="1HGBH41JXMN109186"
                    value={formData.vin}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tipo de Artículo *</label>
                  <select
                    name="tipoArticulo"
                    value={formData.tipoArticulo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Automóvil">Automóvil</option>
                    <option value="Camioneta/SUV">Camioneta/SUV</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Motocicleta">Motocicleta</option>
                    <option value="Pesado">Vehículo Pesado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Año de Fabricación *</label>
                  <input
                    type="number"
                    name="anio"
                    min={1980}
                    max={2030}
                    required
                    value={formData.anio}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Marca *</label>
                  <input
                    type="text"
                    name="marca"
                    required
                    placeholder="Toyota, Honda, Ford..."
                    value={formData.marca}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Modelo *</label>
                  <input
                    type="text"
                    name="modelo"
                    required
                    placeholder="Civic, Hilux, Mustang..."
                    value={formData.modelo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Motor *</label>
                  <input
                    type="text"
                    name="motor"
                    required
                    placeholder="2.0L Turbo, 3.5L V6"
                    value={formData.motor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Cilindros *</label>
                  <select
                    name="cilindros"
                    value={formData.cilindros}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {[3, 4, 5, 6, 8, 10, 12].map((c) => (
                      <option key={c} value={c}>{c} Cilindros</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Transmisión *</label>
                  <select
                    name="transmision"
                    value={formData.transmision}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Automática">Automática</option>
                    <option value="Mecánica">Mecánica</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tracción *</label>
                  <select
                    name="traccion"
                    value={formData.traccion}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="FWD">FWD (Delantera)</option>
                    <option value="RWD">RWD (Trasera)</option>
                    <option value="AWD">AWD (Integral)</option>
                    <option value="4WD">4WD (4x4)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Combustible *</label>
                <select
                  name="combustible"
                  value={formData.combustible}
                  onChange={handleChange}
                  className="w-full sm:w-1/3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Gasolina">Gasolina</option>
                  <option value="Diésel">Diésel</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Eléctrico">Eléctrico</option>
                </select>
              </div>
            </div>

            {/* SECCIÓN 3: GALERÍA DE FOTOS (MÍNIMO 5) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    3. Galería Fotográfica (Mínimo 5 fotos obligatorias) *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Ingresa URLs de imágenes públicas (jpg, png, webp).
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fillSamplePhotos}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Cargar 5 Fotos de Prueba
                  </button>
                  <button
                    type="button"
                    onClick={addPhotoField}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Foto
                  </button>
                </div>
              </div>

              {/* Lista de Inputs de Fotos */}
              <div className="space-y-2">
                {fotos.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-6 text-center">
                      #{idx + 1}
                    </span>
                    <input
                      type="url"
                      required
                      placeholder={`https://ejemplo.com/foto_${idx + 1}.jpg`}
                      value={url}
                      onChange={(e) => handlePhotoUrlChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removePhotoField(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Tira de Previsualización */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Previsualización de Galería ({fotos.filter(f => f.trim().length > 0).length} / {fotos.length})
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {fotos.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center"
                    >
                      {url.trim() ? (
                        <img
                          src={url}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/400x300?text=Error+de+Carga';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-300" />
                      )}
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: PARÁMETROS DE SUBASTA */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2">
                4. Parámetros de la Subasta (Monto Base y Tiempos)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Monto Base Inicial (Mínimo Q. 20,000.00) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Q.</span>
                    <input
                      type="number"
                      name="montoBase"
                      min={20000}
                      step={500}
                      required
                      value={formData.montoBase}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Fecha y Hora de Inicio *</label>
                  <input
                    type="datetime-local"
                    name="fechaInicio"
                    required
                    value={formData.fechaInicio}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Fecha y Hora de Cierre *</label>
                  <input
                    type="datetime-local"
                    name="fechaFin"
                    required
                    value={formData.fechaFin}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* BOTÓN SUBMIT */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Registrando vehículo en Oracle FREEPDB1...</span>
                ) : (
                  <>
                    <Car className="w-5 h-5 text-amber-300" />
                    <span>Publicar e Iniciar Subasta Global</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}