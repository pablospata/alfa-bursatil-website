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

El dominio https://alfabursatil.com/ responde desde un hosting separado. Publicar en GitHub Pages no demuestra por sí solo que ese dominio se haya actualizado: hay que verificarlo y sincronizar los archivos en su hosting cuando corresponda. No agregar un `CNAME` ni cambiar DNS como parte de una actualización ordinaria.

Los recursos usan rutas relativas para funcionar tanto en el dominio propio como bajo la ruta del proyecto en GitHub Pages. La página principal conserva su canonical hacia el dominio propio y no contiene las restricciones `noindex` de los previews.

## Verificación

Revisar los estados de menú, pestañas, gráfico, costo y pausa; comprobar foco de teclado y movimiento reducido. La versión aprobada fue revisada de 320 a 1920 px. Los cambios de tipografía requieren revisar el encaje del sitio completo, el footer centrado y la ausencia de recortes o desbordes.
