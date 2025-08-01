# Configuración de Build Personalizada

Este proyecto ha sido configurado para generar siempre los archivos de build con nombres fijos:
- `build/index.js` - Contiene todo el código JavaScript combinado (vendors + main)
- `build/index.css` - Contiene todos los estilos CSS

## Cambios Realizados

### 1. Dependencias Agregadas
- `react-app-rewired`: Para personalizar la configuración de webpack sin hacer eject
- `customize-cra`: Utilidades para personalizar Create React App
- `cross-env`: Para manejar variables de entorno de forma multiplataforma

### 2. Archivos Modificados

#### package.json
- Scripts actualizados para usar `react-app-rewired`
- Script de build configurado con `cross-env DISABLE_ESLINT_PLUGIN=true`

#### config-overrides.js (nuevo)
- Plugin personalizado que combina y renombra archivos después de la build
- Configuración de webpack para minimizar la división de código
- ESLint deshabilitado para evitar conflictos

## Scripts Disponibles

```bash
# Build con archivos de salida fijos
pnpm run build

# Build original (sin personalización)
pnpm run build-original

# Desarrollo
pnpm start

# Tests
pnpm test
```

## Estructura de Salida

Después de ejecutar `pnpm run build`, la carpeta `build/` contendrá:
- `index.js` - Todo el código JavaScript combinado (~190KB)
- `index.css` - Todos los estilos CSS (~779B)
- `index.html` - Archivo HTML principal
- Otros archivos estáticos (favicon, manifest, etc.)

Los archivos `index.js` e `index.css` siempre tendrán estos nombres exactos, sin hashes ni versiones.