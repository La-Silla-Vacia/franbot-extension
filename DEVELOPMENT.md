# Desarrollo de Franbot Extension

## 🚀 Inicio Rápido

Para comenzar el desarrollo con watch mode automático:

```bash
# Instalar dependencias
pnpm install

# Iniciar watch mode (detecta cambios y rebuilds automáticamente)
pnpm run dev
# o alternativamente:
pnpm run watch
```

## 📁 Estructura de Desarrollo

```
franbot-extension/
├── manifest.json          # ✅ Configuración principal de la extensión (en raíz)
├── index.js              # ✅ Punto de entrada que importa builds
├── watch.js              # ✅ Script de watch personalizado
├── config-overrides.js   # ✅ Configuración personalizada del build
├── src/                  # Código fuente React
│   ├── App.js
│   ├── App.css
│   └── index.js
├── public/               # Archivos estáticos
│   ├── icons/           # Iconos de la extensión
│   ├── background.js    # Service worker
│   ├── content.js       # Content script
│   └── index.html
└── build/               # ✅ Build automático generado
    ├── index.html       # Popup de la extensión (solo importa index.js e index.css)
    ├── index.css        # ✅ CSS combinado y optimizado
    ├── index.js         # ✅ JavaScript combinado (vendors + main)
    ├── background.js    # Service worker copiado
    ├── content.js       # Content script copiado
    └── icons/           # Iconos copiados
```

### 🎯 Archivos de Build Simplificados

La configuración personalizada genera solo **2 archivos principales**:
- **`index.js`**: Contiene todo el JavaScript (React + vendors) combinado
- **`index.css`**: Contiene todos los estilos optimizados

El `index.html` solo importa estos 2 archivos:
```html
<script defer="defer" src="./index.js"></script>
<link href="./index.css" rel="stylesheet">
```

**Ventajas:**
- ✅ Estructura simple y limpia
- ✅ Menos archivos para gestionar
- ✅ Carga más rápida (menos requests HTTP)
- ✅ Ideal para extensiones de Chrome

## 🔄 Flujo de Desarrollo

1. **Ejecutar watch mode:**
   ```bash
   pnpm run dev
   ```

2. **El sistema automáticamente:**
   - 👀 Monitorea cambios en `src/` y `public/`
   - 🔨 Ejecuta build cuando detecta cambios
   - ✅ Notifica cuando el build está listo

3. **Instalar/Recargar extensión:**
   - Ve a `chrome://extensions/`
   - Activa "Modo de desarrollador"
   - Carga la carpeta raíz del proyecto (no build/)
   - Recarga la extensión cuando veas "✅ Build completado"

## 📝 Archivos que Activan Rebuild

- `src/**/*` - Código React (componentes, estilos, etc.)
- `public/**/*` - Scripts de extensión, iconos, etc.

## 🛠️ Scripts Disponibles

- `pnpm run dev` - Modo watch con rebuild automático
- `pnpm run watch` - Alias para dev
- `pnpm run build` - Build único para producción
- `pnpm run start` - Servidor de desarrollo React (para testing UI)

## 🎯 Ventajas del Watch Mode

- ⚡ **Desarrollo rápido**: No necesitas ejecutar build manualmente
- 🔄 **Auto-reload**: Cambios se reflejan automáticamente
- 📊 **Feedback visual**: Logs claros del estado del build
- 🚫 **Debounce**: Evita builds múltiples en cambios rápidos

## 🐛 Troubleshooting

### Build falla
- Verifica que no haya errores de sintaxis en el código
- Revisa los logs del watch para detalles del error

### Extensión no se actualiza
- Asegúrate de recargar la extensión en Chrome después del build
- Verifica que el manifest.json esté en la raíz del proyecto

### Watch no detecta cambios
- Reinicia el watch mode: `Ctrl+C` y luego `pnpm run dev`
- Verifica que los archivos estén en `src/` o `public/`

## 💡 Tips de Desarrollo

1. **Mantén Chrome DevTools abierto** para ver errores de la extensión
2. **Usa console.log** en background.js y content.js para debugging
3. **Recarga la extensión** después de cada build exitoso
4. **Prueba en páginas web reales** para verificar content scripts