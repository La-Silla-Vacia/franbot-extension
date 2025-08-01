# Franbot - Extensión de Chrome

Franbot es un asistente inteligente para Chrome que te ayuda a analizar y comprender contenido web de manera interactiva.

## 🤖 Características

- **Interfaz de chat intuitiva**: Comunícate con Franbot a través de una interfaz moderna y fácil de usar
- **Análisis de contenido web**: Analiza texto seleccionado en cualquier página web
- **Menú contextual**: Acceso rápido desde el menú del botón derecho
- **Diseño responsivo**: Optimizado para el popup de extensiones de Chrome
- **Iconos personalizados**: Robot con fondo azul en múltiples tamaños

## 🚀 Instalación

### Para Desarrollo

1. Clona o descarga este repositorio
2. Instala las dependencias:
   ```bash
   pnpm install
   ```
3. Construye la extensión:
   ```bash
   pnpm run build
   ```
4. Abre Chrome y ve a `chrome://extensions/`
5. Activa el "Modo de desarrollador" en la esquina superior derecha
6. Haz clic en "Cargar extensión sin empaquetar"
7. Selecciona la carpeta `build` del proyecto

### Para Producción

1. Descarga el archivo `.zip` de la extensión
2. Descomprime el archivo
3. Sigue los pasos 4-7 de la instalación para desarrollo

## 🛠️ Desarrollo

### Scripts Disponibles

- `pnpm start` - Inicia el servidor de desarrollo
- `pnpm run build` - Construye la extensión para producción
- `pnpm run build-original` - Construye usando la configuración original de React

### Estructura del Proyecto

```
franbot-extension/
├── public/
│   ├── icons/           # Iconos de la extensión
│   ├── manifest.json    # Configuración de la extensión
│   ├── background.js    # Script de background
│   ├── content.js       # Script de contenido
│   └── index.html       # HTML del popup
├── src/
│   ├── App.js          # Componente principal
│   ├── App.css         # Estilos principales
│   └── index.js        # Punto de entrada
└── build/              # Archivos construidos
    ├── index.js        # JavaScript combinado
    ├── index.css       # CSS combinado
    └── ...             # Otros archivos de la extensión
```

## 🎨 Personalización

### Iconos

Los iconos están ubicados en `public/icons/` y incluyen:
- `franbot-icon.svg` - Icono vectorial original
- `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` - Versiones PNG

Para cambiar el icono:
1. Reemplaza `franbot-icon.svg`
2. Regenera los PNG usando: `npx sharp-cli -i "public/icons/franbot-icon.svg" -o "public/icons/icon-[SIZE].png" resize [SIZE] [SIZE]`

### Estilos

Los estilos principales están en `src/App.css`. La extensión usa:
- Gradiente azul-púrpura de fondo
- Efectos de vidrio esmerilado (backdrop-filter)
- Diseño responsivo para 400x600px

## 📦 Construcción

La extensión utiliza una configuración personalizada de webpack que:
- Combina todo el JavaScript en un solo archivo `index.js`
- Combina todo el CSS en un solo archivo `index.css`
- Deshabilita ESLint durante la construcción
- Mantiene los archivos de la extensión (manifest.json, background.js, content.js)

## 🔧 Configuración Técnica

### Dependencias Principales

- `react` - Framework de UI
- `react-app-rewired` - Personalización de webpack
- `customize-cra` - Utilidades para personalizar Create React App
- `cross-env` - Variables de entorno multiplataforma
- `sharp-cli` - Procesamiento de imágenes

### Permisos de la Extensión

- `activeTab` - Acceso a la pestaña activa
- `storage` - Almacenamiento local
- `contextMenus` - Menús contextuales

## 🐛 Solución de Problemas

### Error de construcción con ESLint
Si encuentras errores de ESLint durante la construcción, asegúrate de que la variable de entorno `DISABLE_ESLINT_PLUGIN=true` esté configurada.

### Iconos no se muestran
Verifica que todos los archivos PNG estén en `public/icons/` y que el `manifest.json` tenga las rutas correctas.

### Popup no se abre
Asegúrate de que `index.html` esté en la carpeta `build` después de la construcción.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo LICENSE para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
