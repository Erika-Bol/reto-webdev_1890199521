import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle, LogIn, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token_copart');
  const user = JSON.parse(localStorage.getItem('usuario_copart') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token_copart');
    localStorage.removeItem('usuario_copart');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo e Inventario */}
          <Link to="/inventario" className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              Copart<span className="text-blue-600">Subastas</span>
            </span>
          </Link>

          {/* Acciones de Usuario */}
          <div className="flex items-center gap-3">
            <Link
              to="/inventario"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
            >
              Catálogo
            </Link>

            {token && user ? (
              <>
                <Link
                  to="/publicar"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Publicar Vehículo
                </Link>

                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-800 block leading-tight">
                      {user.nombres}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {user.correo}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Cerrar Sesión"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <LogIn className="w-4 h-4" />
                Ingresar
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}