# 🚗 Plataforma Web de Subastas de Vehículos en Tiempo Real (Caso Copart)

> **Evaluación Parcial de Desarrollo Web / Arquitectura de Software**  
> **Estudiante:** Erika Esmeralda Argentina Bol Cruz  
> **Carnet:** `1890199521`  
> **Base de Datos Institucional:** Oracle Database (`FREEPDB1`)  

---

## 🌐 Enlaces del Proyecto Desplegado

* **Frontend (SPA en Producción):** [https://subastas-copart-1890199521.vercel.app](https://subastas-copart-1890199521.vercel.app)
* **Backend Web API & WebSockets:** [https://subastas-copart-api-1890199521.onrender.com](https://subastas-copart-api-1890199521.onrender.com)
* **API Health Check:** [https://subastas-copart-api-1890199521.onrender.com/api/health](https://subastas-copart-api-1890199521.onrender.com/api/health)

---

## 👥 Credenciales de Prueba para Evaluación Docente (Exigencia Rúbrica S1.1)

Para realizar pruebas cruzadas de concurrencia y verificar la reactividad de las pujas en tiempo real entre múltiples navegadores simultáneos, utilice las siguientes cuentas pre-configuradas:

| # | Correo Electrónico | Contraseña | Rol / Propósito en la Evaluación |
| :---: | :--- | :---: | :--- |
| **1** | `comprador1@subastas.com` | `Test1234!` | **Postor Inicial:** Realizar la primera oferta y verificar badge verde *"¡Vas ganando!"*. |
| **2** | `comprador2@subastas.com` | `Test1234!` | **Postor Competidor:** Superar oferta en otra ventana y disparar alerta roja *"Tu oferta ha sido superada"*. |
| **3** | `vendedor@subastas.com` | `Test1234!` | **Proveedor:** Publicar vehículo con ficha técnica completa y galería de 5+ fotos. |

---

## 📋 Cumplimiento de la Rúbrica de Evaluación (15/15 Pts)

### 🛡️ SERIE I: Despliegue y Seguridad (5.0 Pts)
* **S1.1 Git y Publicación (2.5 pts):** Sitio 100% operativo en la nube, enlaces activos en README y credenciales de los 3 usuarios de prueba documentadas arriba.
* **S1.2 Autenticación y Autorización (2.5 pts):** 
  * Los usuarios anónimos navegan el Home e inventario únicamente en **modo lectura**.
  * Obligatoriedad de inicio de sesión mediante **JWT (JSON Web Tokens)** y contraseñas encriptadas con **bcrypt** para emitir ofertas o registrar lotes.

### 🚙 SERIE II: Inventario y Filtros (5.0 Pts)
* **S2.1 Vehículo y Galería (2.5 pts):** 
  * Ficha técnica completa (Año, VIN, Tipo, Motor, Transmisión, Combustible, Tracción, Cilindros).
  * Semáforo de Daño estricto según Copart: 🟢 **Verde** (Limpio), 🟡 **Amarillo** (Reparable) y 🔴 **Rojo** (Salvamento).
  * Carrusel interactivo con miniaturas que exige y renderiza un **mínimo de 5 fotografías** por vehículo (`FOTOS_VEHICULO_1890199521`).
* **S2.2 Catálogo y Filtros Multitarea (2.5 pts):** 
  * Interfaz moderna en tonos claros (prohibido fondos oscuros según la directriz).
  * Filtros concurrentes en tiempo real por Marca, Año, Tipo de Combustible, Rango de Precios y Clasificación de Daño.

### ⏱️ SERIE III: Subastas y Tiempo Real (5.0 Pts)
* **S3.1 Motor de Tiempo Real / Real-Time (3.0 pts):** 
  * Conexión continua mediante **WebSockets (Socket.io)** para sincronizar precios y temporizadores de cuenta regresiva instantáneamente **sin refrescar la página (cero F5)**.
  * **Anonimato:** Los postores se identifican únicamente por su código anónimo cifrado (ej. `Postor #0048`).
  * **Indicadores Dinámicos:**
    * 🟢 **Badge Verde ("¡Vas ganando esta subasta!"):** Activo cuando el usuario logueado posee la postura más alta.
    * 🔴 **Badge Rojo ("Tu oferta ha sido superada. ¡Pujar de nuevo!"):** Se dispara en vivo cuando otro postor ingresa una nueva puja líder.
* **S3.2 Reglas de Negocio en Base de Datos (2.0 pts):**
  * Toda oferta es procesada por el Stored Procedure `SP_REGISTRAR_PUJA_1890199521` con bloqueo pesimista (`FOR UPDATE`).
  * Valida que la oferta sea $\ge$ al Monto Base mínimo (**Q. 20,000.00**).
  * **Regla del 10%:** Cada nueva postura debe superar la oferta actual por un margen obligatorio de al menos el **10%** ($\text{Oferta} \ge \text{Actual} \times 1.10$).
  * Bloqueo automático y estado `OFERTA CERRADA` al finalizar el temporizador.

---

## 🏗️ Arquitectura de la Solución Desacoplada



# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
