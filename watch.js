const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

console.log('🤖 Franbot Watch Mode iniciado...');
console.log('📁 Monitoreando cambios en src/, public/, package.json y config-overrides.js');

let buildProcess = null;
let isBuilding = false;
let initialBuildDone = false;

function runBuild() {
  if (isBuilding) {
    console.log('⏳ Build en progreso, esperando...');
    return;
  }

  isBuilding = true;
  console.log('🔨 Iniciando build...');

  // Terminar proceso anterior si existe
  if (buildProcess) {
    buildProcess.kill();
  }

  buildProcess = spawn('pnpm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  buildProcess.on('close', (code) => {
    isBuilding = false;
    if (code === 0) {
      console.log('✅ Build completado exitosamente!');
      if (initialBuildDone) {
        console.log('🔄 Recarga la extensión en Chrome para ver los cambios');
      }
      console.log('🔄 Esperando cambios...\n');
      initialBuildDone = true;
    } else {
      console.log('❌ Error en el build');
    }
  });

  buildProcess.on('error', (err) => {
    isBuilding = false;
    console.error('❌ Error ejecutando build:', err);
  });
}

// Configurar watcher con configuración más específica
const watcher = chokidar.watch(['src', 'public', 'package.json', 'config-overrides.js'], {
  ignored: [
    '**/node_modules/**',
    '**/build/**',
    '**/.git/**',
    '**/.*',
    '**/*.map'
  ],
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 50
  }
});

let debounceTimer = null;

// Build inicial
console.log('👀 Ejecutando build inicial...\n');
runBuild();

watcher.on('all', (event, filePath) => {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`📝 ${event}: ${relativePath}`);
  
  // Debounce para evitar múltiples builds
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runBuild();
  }, 300);
});

watcher.on('ready', () => {
  console.log('👀 Watcher listo y monitoreando cambios...\n');
});

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando Franbot Watch Mode...');
  watcher.close();
  if (buildProcess) {
    buildProcess.kill();
  }
  process.exit(0);
});

console.log('💡 Presiona Ctrl+C para detener el watch mode\n');