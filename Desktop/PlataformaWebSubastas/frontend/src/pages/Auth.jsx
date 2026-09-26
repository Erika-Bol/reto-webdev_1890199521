import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

const API_AUTH = 'http://localhost:4000/api/auth';

export default function Auth() {
  const navigate = useNavigate();
  const [isLoginTab, setIsLoginTab] = useState(true);

  // Estados de Login
  const [loginData, setLoginData] = useState({
    correo: '',
    password: ''
  });

  // Estados de Registro
  const [registerData, setRegisterData] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Manejo de Inicio de Sesión
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_AUTH}/login`, {
        correo: loginData.correo.trim(),
        password: loginData.password
      });

      const { token, usuario } = res.data;

      // Persistir en localStorage para consumo de LiveAuction y headers de API
      localStorage.setItem('token_copart', token);
      localStorage.setItem('usuario_copart', JSON.stringify(usuario));

      setSuccessMsg('Inicio de sesión exitoso. Redirigiendo...');
      setTimeout(() => {
        navigate('/inventario');
      }, 900);
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Manejo de Registro
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (registerData.password !== registerData.confirmPassword) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    if (registerData.password.length < 6) {
      setErrorMsg('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_AUTH}/register`, {
        nombres: registerData.nombres.trim(),
        apellidos: registerData.apellidos.trim(),
        correo: registerData.correo.trim(),
        telefono: registerData.telefono.trim(),
        password: registerData.password
      });

      setSuccessMsg('¡Cuenta registrada correctamente! Ya puedes iniciar sesión.');
      // Limpiar formulario y cambiar a pestaña de login
      setRegisterData({
        nombres: '',
        apellidos: '',
        correo: '',
        telefono: '',
        password: '',
        confirmPassword: ''
      });
      setTimeout(() => {
        setIsLoginTab(true);
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.mensaje || 'Ocurrió un error al registrar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Autocompletado para evaluación docente (3 usuarios de prueba)
  const autoFillTestUser = (correo) => {
    setIsLoginTab(true);
    setLoginData({
      correo,
      password: 'Test1234!'
    });
    setErrorMsg('');
    setSuccessMsg('Credenciales de prueba cargadas.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Encabezado y Marca */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-2xl shadow-md mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Subastas Copart GT
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Plataforma de remate e importación vehicular en tiempo real
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          
          {/* Selector de pestañas: Iniciar Sesión / Registrarse */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { setIsLoginTab(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition ${
                isLoginTab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition ${
                !isLoginTab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Alertas de Notificación */}
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORMULARIO DE LOGIN */}
          {isLoginTab ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginData.correo}
                    onChange={(e) => setLoginData({ ...loginData, correo: e.target.value })}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                {loading ? 'Accediendo...' : 'Ingresar a la Plataforma'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            /* FORMULARIO DE REGISTRO */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nombres</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={registerData.nombres}
                      onChange={(e) => setRegisterData({ ...registerData, nombres: e.target.value })}
                      placeholder="Juan"
                      className="w-full pl-9 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Apellidos</label>
                  <input
                    type="text"
                    required
                    value={registerData.apellidos}
                    onChange={(e) => setRegisterData({ ...registerData, apellidos: e.target.value })}
                    placeholder="Pérez"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={registerData.correo}
                    onChange={(e) => setRegisterData({ ...registerData, correo: e.target.value })}
                    placeholder="juan@correo.com"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Teléfono</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={registerData.telefono}
                    onChange={(e) => setRegisterData({ ...registerData, telefono: e.target.value })}
                    placeholder="50212345678"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Confirmar</label>
                  <input
                    type="password"
                    required
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition"
              >
                {loading ? 'Creando cuenta...' : 'Completar Registro'}
              </button>
            </form>
          )}

          {/* Accesos Rápidos de Prueba para el Catedrático (Rúbrica: 3 usuarios pre-creados) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Usuarios de Evaluación (Test):</span>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => autoFillTestUser('comprador1@subastas.com')}
                className="text-left px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs text-slate-700 flex justify-between items-center transition"
              >
                <span className="font-medium">1. comprador1@subastas.com</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">Test1234!</span>
              </button>

              <button
                type="button"
                onClick={() => autoFillTestUser('comprador2@subastas.com')}
                className="text-left px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs text-slate-700 flex justify-between items-center transition"
              >
                <span className="font-medium">2. comprador2@subastas.com</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">Test1234!</span>
              </button>

              <button
                type="button"
                onClick={() => autoFillTestUser('vendedor@subastas.com')}
                className="text-left px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs text-slate-700 flex justify-between items-center transition"
              >
                <span className="font-medium">3. vendedor@subastas.com</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">Test1234!</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link to="/inventario" className="text-xs text-blue-600 hover:underline font-semibold">
              ← Continuar explorando como visitante (Modo lectura)
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}