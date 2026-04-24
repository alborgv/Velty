# Velty

Velty es una plataforma web completa de administración y gestión de préstamos, clientes y cuotas, diseñada para ofrecer un dashboard financiero claro y un control detallado sobre los estados de pago.

## Tecnologías Utilizadas

### Frontend
- **React (Vite)**: Framework principal para construir la interfaz de usuario de forma rápida y optimizada.
- **TypeScript**: Para garantizar la seguridad de tipos y reducir errores en desarrollo.
- **Tailwind CSS**: Framework de estilos de utilidad para un diseño moderno y responsive.
- **React Router**: Para el manejo de navegación y rutas privadas en el cliente.
- **JWT Decode**: Para manejar y extraer la información de la sesión desde el frontend.

### Backend
- **Django**: Framework web robusto de Python utilizado para construir la lógica de negocio.
- **Django REST Framework (DRF)**: Para la construcción rápida y estructurada de la API RESTful.
- **JWT Authentication**: Para asegurar los endpoints a través de tokens de acceso y refresco (usando Simple JWT).
- **SQLite / PostgreSQL**: Para almacenamiento seguro y relacional de los datos financieros.

## Funcionalidades Principales
- **Dashboard Financiero**: Resumen en tiempo real del capital total, préstamos activos, en mora y reportes mensuales.
- **Gestión de Préstamos**: Creación de nuevos créditos con plazos, tasas de interés y frecuencia de pago.
- **Módulo de Clientes (Prestatarios)**: Administración de información de deudores y visualización de su historial.
- **Registro de Pagos**: Sistema completo para registrar abonos, con lógica para amortizar intereses y capital, permitiendo opciones de solo pago de intereses.
- **Seguridad**: Rutas protegidas y autenticación mediante JWT.

## Despliegue
El proyecto cuenta con configuración de Docker (`docker-compose.yml` y `Dockerfile`) preparada para su despliegue en entornos de producción.
