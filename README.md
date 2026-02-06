# Service Representaciones - Web Platform

Este es el repositorio oficial de la plataforma web de **Service Representaciones**, expertos en seguridad electrónica, mantenimiento técnico y soluciones IT.

## Tecnologías Utilizadas

- **Frontend**: React + Vite
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Base de Datos & Auth**: Supabase
- **Animaciones**: Framer Motion

## Estructura del Proyecto

- `/src/pages`: Páginas principales de la aplicación.
- `/src/components`: Componentes reutilizables.
- `/src/lib`: Configuraciones de librerías externas (Supabase, utils).
- `/src/hooks`: Hooks personalizados.

## Configuración Local

1.  **Clonar el repositorio**:
    ```sh
    git clone <repository-url>
    cd web-service-representaciones
    ```

2.  **Instalar dependencias**:
    ```sh
    npm install
    ```

3.  **Configurar variables de entorno**:
    Crea un archivo `.env.local` con tus credenciales de Supabase:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
    ```

4.  **Iniciar el servidor de desarrollo**:
    ```sh
    npm run dev
    ```

## Desarrollo e Implementación

Para generar una versión de producción:
```sh
npm run build
```
Los archivos de salida se encontrarán en la carpeta `dist/`.
