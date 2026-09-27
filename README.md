# Alfa Bursátil

Landing de Alfa Bursátil, un proyecto de Pablo Spata. Diseño aprobado en septiembre de 2026: mercados, matemática y código, con una escena de investigación animada y una tipografía organizada por función.

Sitio estático con HTML, CSS y JavaScript, sin instalación ni compilación. Fuentes, fotografías y gráficos se sirven localmente; no hay analítica ni dependencias externas de ejecución.

## Desarrollo

Trabajar en la rama `dev` y servir el repositorio:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abrir http://localhost:8000/. Preparar un preview revisable para cambios visuales y pasar a `main` la versión aprobada.

## Archivos principales

| Archivo | Función |
|---|---|
| `index.html` | Contenido, estructura semántica y metadatos públicos. |
| `css/style.css` | Composición, componentes y animaciones. |
| `css/typography.css` | Escala tipográfica por función y ajustes de lectura. |
| `js/main.js` | Escena, gráficos, navegación y controles. |
| `js/typography.js` | Tamaño visible de las anotaciones SVG. |
| `assets/` | Logo, favicons, retrato y fuentes. |

Las fuentes Nimbus de URW Base 35 incluyen su licencia en `assets/fonts/LICENSE.txt`.

## Interacciones y datos

La portada combina una superficie gaussiana animada, un gráfico de 144 observaciones sintéticas, código ilustrativo y una distribución de retornos. La simulación permite cambiar entre velas y línea, activar una banda móvil y explorar observaciones con teclado, ratón o toque.

El método ofrece las pestañas Observar, Modelar y Contrastar. El ejemplo de expectativa usa `E[R] = pG − (1−p)L − C`, con `p = 0.54`, `G = 1.4 R` y `L = 1 R`. R representa una unidad de riesgo; no se presentan resultados reales de una estrategia.

Pausar / Animar controla la escena, y se respeta la preferencia de movimiento reducido. El canvas se detiene fuera de pantalla o al ocultar la pestaña.

## Publicación

GitHub Pages está configurado para publicar `main` desde la raíz del repositorio:

https://pablospata.github.io/alfa-bursatil-website/

El dominio https://alfabursatil.com/ se publica en Hostinger desde la raíz de `main`, mediante **Avanzado → Git**. El webhook de GitHub avisa de los pushes a Hostinger, cuya instalación está configurada para publicar `main`. La URL del webhook se guarda en la configuración privada del repositorio, fuera del código.

El flujo de publicación es trabajar en `dev`, revisar los cambios, incorporar la versión aprobada a `main` y hacer push de `main`. Después, comprobar la entrega del webhook en GitHub y el resultado en https://alfabursatil.com/. GitHub Pages y Hostinger tienen publicaciones independientes: verificar Pages no sustituye la comprobación del dominio propio. No agregar un `CNAME` ni cambiar DNS como parte de una actualización ordinaria.

Los recursos usan rutas relativas para funcionar tanto en el dominio propio como bajo la ruta del proyecto en GitHub Pages. La página principal conserva su canonical hacia el dominio propio y no contiene las restricciones `noindex` de los previews.

## SEO básico

Los metadatos presentan Alfa Bursátil como un proyecto personal de Pablo Spata sobre mercados, matemática y código. El marcado `WebSite` incluye el nombre del sitio y su creador como `Person`; la asesoría se deriva a RGG Group en el contenido público.

La URL principal es `https://alfabursatil.com/`. En Hostinger, `.htaccess` redirige permanentemente `www` y las solicitudes explícitas a `/index.html` hacia esa versión, conservando las rutas y los parámetros. Hostinger ya fuerza HTTPS. GitHub Pages mantiene el canonical hacia el dominio propio.

`robots.txt` permite el rastreo y anuncia `sitemap.xml`. Actualizar `lastmod` sólo cuando cambie sustancialmente el contenido de la página. Google Search Console permite comprobar la indexación real, enviar el sitemap y solicitar una revisión después de cambios relevantes; esas tareas requieren acceso a la propiedad del dominio.

## Verificación

Revisar los estados de menú, pestañas, gráfico, costo y pausa; comprobar foco de teclado y movimiento reducido. La versión aprobada fue revisada de 320 a 1920 px. Los cambios de tipografía requieren revisar el encaje del sitio completo, el footer centrado y la ausencia de recortes o desbordes.
