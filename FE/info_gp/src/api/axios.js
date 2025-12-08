import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Tu backend
});

// Variable para controlar si ya se está mostrando el modal de sesión expirada
let isShowingSessionExpiredModal = false;

// Interceptor: Antes de cada petición, inyectamos el Token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-access-token'] = token;
  }
  return config;
});

// Interceptor de respuesta: Detectar token expirado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si el error es 401 o 403 y el mensaje indica token expirado
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const message = error.response.data?.message || '';
      
      // Detectar si es un error de token expirado
      if (message.toLowerCase().includes('token') || message.toLowerCase().includes('expirado') || message.toLowerCase().includes('expired')) {
        
        // Si ya se está mostrando el modal, rechazar sin hacer nada
        if (isShowingSessionExpiredModal) {
          return Promise.reject(error);
        }
        
        isShowingSessionExpiredModal = true;
        
        // Mostrar alerta con opciones
        const result = await Swal.fire({
          title: '¡Sesión Expirada!',
          text: 'Tu sesión ha expirado. ¿Deseas extender la sesión o cerrar?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Extender Sesión',
          cancelButtonText: 'Cerrar Sesión',
          allowOutsideClick: false,
          allowEscapeKey: false
        });

        if (result.isConfirmed) {
          // Usuario quiere extender la sesión - refrescar token
          try {
            const refreshResponse = await axios.post('http://localhost:5000/api/auth/refresh-token', {}, {
              headers: { 'x-access-token': localStorage.getItem('token') }
            });
            
            if (refreshResponse.data.token) {
              localStorage.setItem('token', refreshResponse.data.token);
              
              Swal.fire({
                title: '¡Sesión Extendida!',
                text: 'Tu sesión ha sido renovada exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              
              // Restablecer el flag antes de reintentar
              isShowingSessionExpiredModal = false;
              
              // Reintentar la petición original
              error.config.headers['x-access-token'] = refreshResponse.data.token;
              return axios.request(error.config);
            }
          } catch (refreshError) {
            // Si falla el refresh, cerrar sesión
            isShowingSessionExpiredModal = false;
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
          // Usuario eligió cerrar sesión
          isShowingSessionExpiredModal = false;
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;