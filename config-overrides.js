const { override, disableEsLint } = require('customize-cra');
const fs = require('fs');
const path = require('path');

// Plugin personalizado para mover y renombrar archivos
class RenameOutputPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('RenameOutputPlugin', (compilation) => {
      const outputPath = compilation.outputOptions.path;
      const staticPath = path.join(outputPath, 'static');
      
      // Mover y renombrar archivos JS
      const jsPath = path.join(staticPath, 'js');
      if (fs.existsSync(jsPath)) {
        const jsFiles = fs.readdirSync(jsPath);
        let combinedJs = '';
        
        // Primero agregar vendors
        const vendorsJsFile = jsFiles.find(file => file.startsWith('vendors.') && file.endsWith('.js'));
        if (vendorsJsFile) {
          const vendorsPath = path.join(jsPath, vendorsJsFile);
          if (fs.existsSync(vendorsPath)) {
            combinedJs += fs.readFileSync(vendorsPath, 'utf8') + '\n';
          }
        }
        
        // Luego agregar main
        const mainJsFile = jsFiles.find(file => file.startsWith('main.') && file.endsWith('.js'));
        if (mainJsFile) {
          const mainPath = path.join(jsPath, mainJsFile);
          if (fs.existsSync(mainPath)) {
            combinedJs += fs.readFileSync(mainPath, 'utf8');
          }
        }
        
        // Escribir el archivo combinado
        if (combinedJs) {
          const indexJsPath = path.join(outputPath, 'index.js');
          fs.writeFileSync(indexJsPath, combinedJs);
        }
      }
      
      // Mover y renombrar archivos CSS
      const cssPath = path.join(staticPath, 'css');
      if (fs.existsSync(cssPath)) {
        const cssFiles = fs.readdirSync(cssPath);
        const mainCssFile = cssFiles.find(file => file.startsWith('main.') && file.endsWith('.css'));
        if (mainCssFile) {
          const oldPath = path.join(cssPath, mainCssFile);
          const newPath = path.join(outputPath, 'index.css');
          if (fs.existsSync(oldPath)) {
            fs.copyFileSync(oldPath, newPath);
          }
        }
      }
      
      // Modificar el index.html para usar solo index.js e index.css
      const indexHtmlPath = path.join(outputPath, 'index.html');
      if (fs.existsSync(indexHtmlPath)) {
        let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
        
        // Remover todas las referencias a archivos static/
        htmlContent = htmlContent.replace(/<script[^>]*src="[^"]*static\/js\/[^"]*"[^>]*><\/script>/g, '');
        htmlContent = htmlContent.replace(/<link[^>]*href="[^"]*static\/css\/[^"]*"[^>]*>/g, '');
        
        // Agregar las nuevas referencias antes del cierre de </head>
        const headCloseIndex = htmlContent.indexOf('</head>');
        if (headCloseIndex !== -1) {
          const newReferences = `<script defer="defer" src="./index.js"></script><link href="./index.css" rel="stylesheet">`;
          htmlContent = htmlContent.slice(0, headCloseIndex) + newReferences + htmlContent.slice(headCloseIndex);
        }
        
        fs.writeFileSync(indexHtmlPath, htmlContent);
      }
    });
  }
}

module.exports = override(
  // Deshabilitar ESLint para evitar conflictos
  disableEsLint(),
  
  (config) => {
    // Agregar el plugin personalizado
    config.plugins.push(new RenameOutputPlugin());
    
    // Configurar la salida
    config.output.filename = 'static/js/[name].[contenthash:8].js';
    config.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
    
    // Deshabilitar la división de código para minimizar archivos
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    };
    
    // Deshabilitar el runtime chunk
    config.optimization.runtimeChunk = false;
    
    return config;
  }
);