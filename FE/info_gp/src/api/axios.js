import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Tu backend
});

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
              
              // Reintentar la petición original
              error.config.headers['x-access-token'] = refreshResponse.data.token;
              return axios.request(error.config);
            }
          } catch (refreshError) {
            // Si falla el refresh, cerrar sesión
            localStorage.clear();
            window.location.href = '/login';
          }
        } else {
          // Usuario eligió cerrar sesión
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;