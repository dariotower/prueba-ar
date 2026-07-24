# Prototipo WebAR — Brigada de Emergencia

Prueba web que reconoce el emblema desde la cámara sin utilizar un código QR y dibuja una capa animada sobre la superficie detectada.

## Probar en computadora

1. Abrir una terminal dentro de esta carpeta.
2. Ejecutar:

```bash
python3 -m http.server 8080
```

3. Abrir `http://localhost:8080`.
4. Elegir **Probar sin cámara** para ver una simulación, o **Iniciar cámara** y mostrar el emblema desde otra pantalla.

También se puede abrir directamente con el modo demo:

```text
http://localhost:8080/?demo=1
```

## Probar en un celular

El acceso a la cámara exige que el sitio esté servido por HTTPS. Subir el contenido de esta carpeta a Netlify, GitHub Pages, Cloudflare Pages u otro hosting estático HTTPS. Después:

1. Abrir la URL desde el celular.
2. Tocar **Iniciar cámara**.
3. Autorizar la cámara.
4. Apuntar al emblema impreso o mostrado en otra pantalla, procurando que esté completo, bien iluminado y sin reflejos fuertes.

## Cambiar la imagen reconocida

1. Reemplazar `assets/target.png` por otra imagen conservando el mismo nombre.
2. Recargar la web. El prototipo genera las características visuales en el navegador, por lo que no necesita compilar un archivo adicional.
3. Para un resultado estable, usar una imagen con detalles, contrastes y elementos no repetitivos.

## Cambiar el contenido aumentado

La función `drawAugmentedOverlay()` de `app.js` controla la animación dibujada sobre la imagen. Allí se pueden reemplazar:

- textos;
- colores;
- líneas animadas;
- indicadores;
- gráficos 2D.

Para video, audio, botones interactivos o modelos 3D conviene pasar la versión siguiente a MindAR o una plataforma WebAR dedicada.

## Dependencia externa

La prueba carga JSFeat 0.0.8 desde cdnjs. Por eso necesita conexión a internet incluso cuando se prueba en localhost.
