
const botonAgregar = document.getElementById("agregarHistoria");
const entradaImagen = document.getElementById("entradaImagen");
const listaHistorias = document.getElementById("listaHistorias");
const visorHistorias = document.getElementById("visorHistorias");
const imagenHistoria = document.getElementById("imagenHistoria");
const contenedorProgreso = document.getElementById("contenedorProgreso");
const botonCerrar = document.getElementById("cerrarHistoria");
const botonSiguiente = document.getElementById("siguienteHistoria");
const botonAnterior = document.getElementById("historiaAnterior");

// Recuperamos las historias guardadas en el navegador
let historias = JSON.parse(localStorage.getItem("historias")) || [];

let indiceActual = 0;
let temporizadorHistoria = null;
let inicioToqueX = 0;

// Guardamos las historias en localStorage
function guardarHistorias() {
    localStorage.setItem("historias", JSON.stringify(historias));
}

// Eliminamos las historias que tengan más de 24 horas
function limpiarHistorias() {
    const ahora = Date.now();

    historias = historias.filter(historia => {
        return ahora - historia.fechaCreacion < 24 * 60 * 60 * 1000;
    });

    guardarHistorias();
}

// Mostramos las historias en la pantalla
function mostrarHistorias() {
    listaHistorias.innerHTML = "";
    listaHistorias.appendChild(botonAgregar);

    historias.forEach((historia, indice) => {
        const elemento = document.createElement("div");
        elemento.className = "elemento-historia";

        const imagen = document.createElement("img");
        imagen.src = historia.imagen;
        imagen.className = "imagen-historia";
        imagen.alt = "Historia " + (indice + 1);

        const texto = document.createElement("small");
        texto.textContent = "Historia " + (indice + 1);

        elemento.appendChild(imagen);
        elemento.appendChild(texto);

        elemento.addEventListener("click", () => {
            abrirHistoria(indice);
        });

        listaHistorias.appendChild(elemento);
    });
}

// Abrimos el selector para elegir una imagen
botonAgregar.addEventListener("click", () => {
    entradaImagen.click();
});

// Convertimos la imagen a Base64 y ajustamos su tamaño
function convertirImagen(archivo) {
    return new Promise((resolver, rechazar) => {
        const imagen = new Image();
        const direccionImagen = URL.createObjectURL(archivo);

        imagen.onload = () => {
            let ancho = imagen.width;
            let alto = imagen.height;

            // Limitamos las dimensiones a 1080 x 1920
            const escala = Math.min(
                1080 / ancho,
                1920 / alto,
                1
            );

            ancho = Math.round(ancho * escala);
            alto = Math.round(alto * escala);

            const lienzo = document.createElement("canvas");
            lienzo.width = ancho;
            lienzo.height = alto;

            const contexto = lienzo.getContext("2d");

            contexto.fillStyle = "#ffffff";
            contexto.fillRect(0, 0, ancho, alto);
            contexto.drawImage(imagen, 0, 0, ancho, alto);

            // Convertimos la imagen a Base64
            const base64 = lienzo.toDataURL("image/jpeg", 0.85);

            URL.revokeObjectURL(direccionImagen);

            resolver(base64);
        };

        imagen.onerror = () => {
            URL.revokeObjectURL(direccionImagen);
            rechazar(new Error("No se pudo cargar la imagen"));
        };

        imagen.src = direccionImagen;
    });
}

// Detectamos cuando el usuario selecciona una imagen
entradaImagen.addEventListener("change", async (evento) => {
    const archivo = evento.target.files[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
        alert("Selecciona una imagen válida");
        entradaImagen.value = "";
        return;
    }

    try {
        const imagenBase64 = await convertirImagen(archivo);

        // Creamos una nueva historia
        const nuevaHistoria = {
            id: Date.now(),
            imagen: imagenBase64,
            fechaCreacion: Date.now()
        };

        historias.push(nuevaHistoria);

        // Guardamos y actualizamos las historias
        guardarHistorias();
        mostrarHistorias();

    } catch (error) {
        alert("No se pudo cargar la imagen. Intenta con otra.");
    }

    entradaImagen.value = "";
});

// Abrimos una historia seleccionada
function abrirHistoria(indice) {
    if (historias.length === 0) return;

    indiceActual = indice;

    visorHistorias.classList.add("activa");

    mostrarHistoriaActual();
}

// Mostramos la historia seleccionada y su progreso
function mostrarHistoriaActual() {
    clearTimeout(temporizadorHistoria);

    if (indiceActual >= historias.length) {
        cerrarVisor();
        return;
    }

    imagenHistoria.src = historias[indiceActual].imagen;

    contenedorProgreso.innerHTML = "";

    historias.forEach((historia, indice) => {
        const barra = document.createElement("div");
        barra.className = "barra-progreso";

        const relleno = document.createElement("div");
        relleno.className = "relleno-progreso";

        if (indice < indiceActual) {
            relleno.classList.add("completada");
        }

        barra.appendChild(relleno);
        contenedorProgreso.appendChild(barra);
    });

    // Iniciamos la animación de la barra
    setTimeout(() => {
        const rellenoActivo = contenedorProgreso.children[indiceActual]?.firstElementChild;

        if (rellenoActivo) {
            rellenoActivo.classList.add("activa");
        }
    }, 50);

    // Pasamos a la siguiente historia después de 3 segundos
    temporizadorHistoria = setTimeout(() => {
        indiceActual++;
        mostrarHistoriaActual();
    }, 3000);
}

// Pasamos a la siguiente historia
function mostrarSiguienteHistoria() {
    clearTimeout(temporizadorHistoria);
    indiceActual++;
    mostrarHistoriaActual();
}

// Regresamos a la historia anterior
function mostrarHistoriaAnterior() {
    clearTimeout(temporizadorHistoria);

    if (indiceActual > 0) {
        indiceActual--;
    }

    mostrarHistoriaActual();
}

// Cerramos el visor de historias
function cerrarVisor() {
    clearTimeout(temporizadorHistoria);

    visorHistorias.classList.remove("activa");
    imagenHistoria.src = "";
}

// Botones para cambiar o cerrar historias
botonSiguiente.addEventListener("click", mostrarSiguienteHistoria);
botonAnterior.addEventListener("click", mostrarHistoriaAnterior);
botonCerrar.addEventListener("click", cerrarVisor);

// Cerramos o cambiamos historias usando el teclado
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        cerrarVisor();
    }

    if (visorHistorias.classList.contains("activa")) {
        if (evento.key === "ArrowRight") {
            mostrarSiguienteHistoria();
        }

        if (evento.key === "ArrowLeft") {
            mostrarHistoriaAnterior();
        }
    }
});

// Detectamos cuando el usuario comienza a deslizar el dedo
visorHistorias.addEventListener("touchstart", (evento) => {
    inicioToqueX = evento.changedTouches[0].screenX;
});

// Detectamos hacia dónde desliza el usuario
visorHistorias.addEventListener("touchend", (evento) => {
    const finalToqueX = evento.changedTouches[0].screenX;
    const diferencia = inicioToqueX - finalToqueX;

    if (Math.abs(diferencia) > 50) {
        if (diferencia > 0) {
            mostrarSiguienteHistoria();
        } else {
            mostrarHistoriaAnterior();
        }
    }
});

// Revisamos las historias cuando abrimos la página
limpiarHistorias();
mostrarHistorias();

// Revisamos las historias cada minuto
setInterval(() => {
    limpiarHistorias();
    mostrarHistorias();
}, 60000);
