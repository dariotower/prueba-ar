# WebAR — La cumbre de las brujas

Prototipo web para reconocer la portada del libro sin QR y superponer una experiencia aumentada con una interfaz dramática, pensada para luego reproducir un video vertical trackeado.

## Qué incluye hoy

- reconocimiento de la portada desde cámara;
- modo demo sin cámara;
- interfaz visual inspirada en la portada;
- capa aumentada que sigue el movimiento y la perspectiva del libro;
- contenedor preparado para incrustar un video vertical de YouTube no listado.

## Cómo probarlo localmente

1. Abrí una terminal dentro de esta carpeta.
2. Ejecutá:

```bash
python3 -m http.server 8080
```

3. Entrá a `http://localhost:8080`.
4. Si querés simular sin cámara, usá `http://localhost:8080/?demo=1`.

## Cómo subirlo a GitHub Pages

Subí el contenido de esta carpeta a la raíz del repositorio y activá:

- **Settings → Pages**
- **Deploy from a branch**
- **main / root**

Después probalo desde el celular en HTTPS.

## Cuando tengas el link de YouTube

En `app.js`, buscá:

```js
youtubeVideoId: ''
```

Y reemplazalo por el ID del video no listado. Ejemplo, si tu URL es:

```text
https://www.youtube.com/watch?v=ABC123XYZ
```

Entonces el ID es:

```text
ABC123XYZ
```

El sistema montará el iframe cuando detecte la portada.

## Nota práctica

Para una versión final más controlada, seguramente convendrá comparar:

- **YouTube no listado**: rápido y cómodo para prototipar.
- **MP4 propio**: más limpio visualmente y con mayor control de reproducción.
