// Variables globales para almacenar datos
let grupos = [];
let evaluaciones = [];
let evaluadoresGlobales = {
    evaluador1: "",
    evaluador2: "",
    evaluador3: ""
};

// --- Inicialización al cargar el DOM ---
document.addEventListener("DOMContentLoaded", () => {
    inicializarAplicacion();
});

async function inicializarAplicacion() {
    await cargarGrupos();
    cargarEvaluaciones();
    cargarEvaluadoresGlobales();
    setupEventListeners();
    actualizarInterfaz();
    actualizarTextoBotonesSugerencia();
    actualizarSugerenciaGeneral();
}

// --- Gestión de Grupos ---
async function cargarGrupos() {
    try {
        const response = await fetch('grupos.json');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        grupos = await response.json();
        poblarSelectGrupos();
    } catch (error) {
        mostrarNotificacion(`Error cargando grupos: ${error.message}. Asegúrate de que el archivo 'grupos.json' exista y sea válido.`, 'error');
    }
}

function poblarSelectGrupos() {
    const select = document.getElementById('selectGrupo');
    select.innerHTML = '<option value="">Seleccione un grupo</option>';
    grupos.forEach(grupo => {
        const option = document.createElement('option');
        option.value = grupo.id;
        option.textContent = `${grupo.nombre} - ${grupo.escuela} (${grupo.grado || 'N/A'})`;
        select.appendChild(option);
    });
}

// --- Event Listeners ---
function setupEventListeners() {
    document.getElementById('formularioEvaluacion').addEventListener('submit', guardarEvaluacion);
    document.getElementById('limpiarDatos').addEventListener('click', limpiarTodasEvaluaciones);
    document.getElementById('exportarJsonBtn').addEventListener('click', exportarDatos);
    document.getElementById('exportarPdfBtn').addEventListener('click', exportarPDF);
    document.getElementById('exportarPdfBtn1').addEventListener('click', exportarPDF1);
    
    document.getElementById('guardarEvaluadoresBtn').addEventListener('click', guardarEvaluadoresGlobales);
    document.getElementById('eliminarEvaluadoresBtn').addEventListener('click', eliminarEvaluadoresGlobales);
    document.getElementById('selectGrupo').addEventListener('change', mostrarInfoGrupo);
    
    document.getElementById('puntajeFuncionalidad').addEventListener('change', (e) => sugerirObservacion(e.target.value, 'Funcionalidad'));
    document.getElementById('puntajeProgramacion').addEventListener('change', (e) => sugerirObservacion(e.target.value, 'Programacion'));
    document.getElementById('puntajeDiseno').addEventListener('change', (e) => sugerirObservacion(e.target.value, 'Diseno'));
    document.getElementById('puntajeCreatividad').addEventListener('change', (e) => sugerirObservacion(e.target.value, 'Creatividad'));
    document.getElementById('puntajeTrabajoEquipo').addEventListener('change', (e) => sugerirObservacion(e.target.value, 'TrabajoEquipo'));
    document.getElementById('puntajeProcesoTrabajo').addEventListener('change', (e) => sugerirObservacion(e.target.value, 'ProcesoTrabajo'));

    document.querySelectorAll('input[id^="puntaje"]').forEach(input => {
        input.addEventListener('change', actualizarSugerenciaGeneral);
    });

    document.getElementById('convertirPlaceholdersBtn').addEventListener('click', (e) => {
        e.preventDefault();
        convertirPlaceholdersAValores();
    });

    document.querySelectorAll('.btn-placeholder-to-value').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-target');
            convertirPlaceholderAValor(targetId);
        });
    });

    document.querySelectorAll('textarea[id^="obs"]').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
            const targetId = e.target.id;
            const button = document.querySelector(`.btn-placeholder-to-value[data-target="${targetId}"]`);
            if (button) {
                actualizarTextoBoton(button, targetId);
            }
        });
    });
}

// --- Gestión de Evaluadores Globales ---
function guardarEvaluadoresGlobales() {
    const eval1 = document.getElementById('evaluador1Global').value.trim();
    const eval2 = document.getElementById('evaluador2Global').value.trim();
    const eval3 = document.getElementById('evaluador3Global').value.trim();

    if (!eval1) {
        mostrarNotificacion('El campo "Evaluador 1" es obligatorio para guardar los evaluadores.', 'error');
        return;
    }

    evaluadoresGlobales = {
        evaluador1: eval1,
        evaluador2: eval2 || null,
        evaluador3: eval3 || null
    };

    localStorage.setItem('evaluadoresScratch', JSON.stringify(evaluadoresGlobales));
    mostrarNotificacion('Evaluadores guardados correctamente.', 'success');
    mostrarEvaluadoresGlobales();
}

function cargarEvaluadoresGlobales() {
    const datos = localStorage.getItem('evaluadoresScratch');
    if (datos) {
        evaluadoresGlobales = JSON.parse(datos);
        document.getElementById('evaluador1Global').value = evaluadoresGlobales.evaluador1 || '';
        document.getElementById('evaluador2Global').value = evaluadoresGlobales.evaluador2 || '';
        document.getElementById('evaluador3Global').value = evaluadoresGlobales.evaluador3 || '';
    }
    mostrarEvaluadoresGlobales();
}

function mostrarEvaluadoresGlobales() {
    const displayDiv = document.getElementById('evaluadoresActuales');
    const ev1 = evaluadoresGlobales.evaluador1 || 'No definido';
    const ev2 = evaluadoresGlobales.evaluador2 || 'No definido';
    const ev3 = evaluadoresGlobales.evaluador3 || 'No definido';

    displayDiv.innerHTML = `
        <p><strong>Evaluador 1:</strong> ${ev1}</p>
        <p><strong>Evaluador 2:</strong> ${ev2}</p>
        <p><strong>Evaluador 3:</strong> ${ev3}</p>
    `;
}

function eliminarEvaluadoresGlobales() {
    if (confirm("¿Estás seguro de que deseas eliminar los nombres de todos los evaluadores? Esto no afectará las evaluaciones ya guardadas.")) {
        evaluadoresGlobales = {
            evaluador1: "",
            evaluador2: "",
            evaluador3: ""
        };
        localStorage.removeItem('evaluadoresScratch');
        document.getElementById('evaluador1Global').value = '';
        document.getElementById('evaluador2Global').value = '';
        document.getElementById('evaluador3Global').value = '';

        mostrarEvaluadoresGlobales();
        mostrarNotificacion('Evaluadores eliminados correctamente.', 'success');
    }
}

// --- Gestión de Evaluaciones ---
function guardarEvaluacion(e) {
    e.preventDefault();

    if (!evaluadoresGlobales.evaluador1) {
        mostrarNotificacion('Por favor, defina y guarde el **Evaluador 1** en la sección "Datos de los Evaluadores" antes de guardar una evaluación.', 'error');
        return;
    }

    const grupoId = document.getElementById('selectGrupo').value;
    if (!grupoId) {
        mostrarNotificacion('Seleccione un grupo para la evaluación.', 'error');
        return;
    }

    const grupoSeleccionado = grupos.find(g => g.id === grupoId);
    if (!grupoSeleccionado) {
        mostrarNotificacion('Error: Grupo seleccionado no encontrado.', 'error');
        return;
    }

    const puntajeFuncionalidad = Number(document.getElementById('puntajeFuncionalidad').value);
    const puntajeProgramacion = Number(document.getElementById('puntajeProgramacion').value);
    const puntajeDiseno = Number(document.getElementById('puntajeDiseno').value);
    const puntajeCreatividad = Number(document.getElementById('puntajeCreatividad').value);
    const puntajeTrabajoEquipo = Number(document.getElementById('puntajeTrabajoEquipo').value);
    const puntajeProcesoTrabajo = Number(document.getElementById('puntajeProcesoTrabajo').value);

    const validarPuntaje = (puntaje, nombreCampo) => {
        if (isNaN(puntaje) || puntaje < 0 || puntaje > 10) {
            mostrarNotificacion(`El puntaje de **${nombreCampo}** debe estar entre 0 y 10.`, 'error');
            return false;
        }
        return true;
    };

    if (!validarPuntaje(puntajeFuncionalidad, 'Funcionalidad') ||
        !validarPuntaje(puntajeProgramacion, 'Programación') ||
        !validarPuntaje(puntajeDiseno, 'Diseño/UX') ||
        !validarPuntaje(puntajeCreatividad, 'Creatividad y Originalidad') ||
        !validarPuntaje(puntajeTrabajoEquipo, 'Trabajo en Equipo') ||
        !validarPuntaje(puntajeProcesoTrabajo, 'Proceso de Trabajo y Esfuerzo')) {
        return;
    }

    const total = puntajeFuncionalidad + puntajeProgramacion + puntajeDiseno +
        puntajeCreatividad + puntajeTrabajoEquipo + puntajeProcesoTrabajo;

    const evaluacion = {
        evaluador1: evaluadoresGlobales.evaluador1,
        evaluador2: evaluadoresGlobales.evaluador2,
        evaluador3: evaluadoresGlobales.evaluador3,
        fechaEvaluacion: new Date().toISOString(),
        grupoId: grupoId,
        nombreGrupo: grupoSeleccionado.nombre,
        escuelaGrupo: grupoSeleccionado.escuela,
        integrantesGrupo: grupoSeleccionado.integrantes,
        gradoGrupo: grupoSeleccionado.grado || 'N/A',
        idProyecto: document.getElementById('idProyecto').value.trim() || null,

        puntajeFuncionalidad: puntajeFuncionalidad,
        obsFuncionalidad: document.getElementById('obsFuncionalidad').value.trim() || document.getElementById('obsFuncionalidad').placeholder || null,
        puntajeProgramacion: puntajeProgramacion,
        obsProgramacion: document.getElementById('obsProgramacion').value.trim() || document.getElementById('obsProgramacion').placeholder || null,
        puntajeDiseno: puntajeDiseno,
        obsDiseno: document.getElementById('obsDiseno').value.trim() || document.getElementById('obsDiseno').placeholder || null,
        puntajeCreatividad: puntajeCreatividad,
        obsCreatividad: document.getElementById('obsCreatividad').value.trim() || document.getElementById('obsCreatividad').placeholder || null,
        puntajeTrabajoEquipo: puntajeTrabajoEquipo,
        obsTrabajoEquipo: document.getElementById('obsTrabajoEquipo').value.trim() || document.getElementById('obsTrabajoEquipo').placeholder || null,
        puntajeProcesoTrabajo: puntajeProcesoTrabajo,
        obsProcesoTrabajo: document.getElementById('obsProcesoTrabajo').value.trim() || document.getElementById('obsProcesoTrabajo').placeholder || null,

        mencion: document.getElementById('mencionEspecialManual').value.trim() || null,
        total: total,
        obsGeneral: document.getElementById('obsGeneralManual').value.trim() || document.getElementById('obsGeneralManual').placeholder
    };

    const indiceEdicion = document.getElementById('indiceEdicion').value;

    if (indiceEdicion !== '') {
        evaluaciones[Number(indiceEdicion)] = evaluacion;
        document.getElementById('indiceEdicion').value = '';
        mostrarNotificacion('Evaluación actualizada correctamente.', 'success');
    } else {
        evaluaciones.push(evaluacion);
        mostrarNotificacion('Evaluación guardada correctamente.', 'success');
    }

    guardarEvaluaciones();
    actualizarInterfaz();
    limpiarFormularioEvaluacion();
}

function sugerirObservacion(puntaje, categoria) {
    const puntajeNum = Number(puntaje);
    let observacionSugerida = '';
    let obsId;

    // Obtenemos el elemento del campo de puntaje
    const campoPuntaje = document.getElementById(`puntaje${categoria}`);

    // Eliminamos la clase de error antes de la validación
    if (campoPuntaje) {
        campoPuntaje.classList.remove('input-error');
    }

    // --- Validación para puntajes fuera de rango ---
    // Si el puntaje no es un número o está fuera del rango 0-10
    if (isNaN(puntajeNum) || puntajeNum < 0 || puntajeNum > 10) {
        // 🚨 Se reemplaza la notificación por una ventana de alerta 🚨
        alert(`El puntaje de ${categoria} debe estar entre 0 y 10.`);

        // Borramos el valor incorrecto del campo
        if (campoPuntaje) {
            campoPuntaje.value = '';
            // Añadimos la clase de error para cambiar el color del borde a rojo
            campoPuntaje.classList.add('input-error');
            // Colocamos el foco en el campo para una corrección inmediata
            campoPuntaje.focus();
        }

        // Limpiamos la sugerencia del placeholder
        const campoObs = document.getElementById(`obs${categoria}`);
        if (campoObs) {
            campoObs.placeholder = '';
        }
        
        // Salimos de la función para no generar sugerencias incorrectas
        return;
    }

    // El resto de la lógica para generar sugerencias solo se ejecuta si el puntaje es válido
    switch(categoria) {
        case 'Funcionalidad':
            obsId = 'obsFuncionalidad';
            if (puntajeNum >= 9) {
                observacionSugerida = '¡Excelente ejecución! El proyecto presenta una lógica de eventos impecable. Todas las interacciones, desde los clic del mouse hasta las colisiones entre sprites, funcionan a la perfección y el flujo del juego es coherente. El proyecto cumple su propósito de manera robusta y sin fallos.';
            } else if (puntajeNum >= 5) {
                observacionSugerida = 'La funcionalidad es aceptable, pero hay margen de mejora. Se observa que la lógica de eventos necesita ser revisada en ciertas partes. Recomendamos verificar la secuencia de los bloques y la correcta activación de los eventos para asegurar que todas las interacciones ocurran como se espera. El proyecto funciona, pero podría ser más estable.';
            } else if (puntajeNum >= 1) {
                observacionSugerida = 'El proyecto presenta problemas de funcionalidad. Se recomienda revisar la secuencia de bloques y los eventos principales que disparan las acciones. ¿El proyecto inicia correctamente? ¿Las colisiones tienen una reacción adecuada? Concentrarse en estos aspectos básicos mejorará significativamente el rendimiento. ¡No se rindan, cada bug es una oportunidad para aprender!';
            } else {
                observacionSugerida = 'La funcionalidad no está implementada. Para empezar, les sugerimos crear un evento simple, como "al hacer clic en este objeto", para que el proyecto cobre vida. Este es un punto de partida fundamental para cualquier proyecto interactivo.';
            }
            break;
        case 'Programacion':
            obsId = 'obsProgramacion';
            if (puntajeNum >= 9) {
                observacionSugerida = '¡Dominio técnico sobresaliente! El código muestra un uso eficiente de estructuras de control avanzadas (condicionales anidados, bucles, manejo de mensajes) y la gestión de datos con variables y listas es impecable. El código es modular, claro y escalable. Se nota una comprensión profunda de los conceptos de programación.';
            } else if (puntajeNum >= 5) {
                observacionSugerida = 'La programación es funcional, pero podría ser más optimizada. Se observa un código repetitivo que podría simplificarse con el uso de **bucles** o la creación de **variables**. Les animamos a explorar la optimización del código para que sea más legible y escalable. ¡La clave es pensar como un programador eficiente!';
            } else if (puntajeNum >= 1) {
                observacionSugerida = 'El proyecto presenta un código básico y desorganizado. Se recomienda a los estudiantes revisar la sintaxis de los bloques y la secuencia lógica. Un buen primer paso es organizar los bloques por función y usar comentarios para entender el propósito de cada script. ¡La base de la programación es la lógica y la organización!';
            } else {
                observacionSugerida = 'No se ha detectado programación. Un buen punto de partida es el uso de bloques simples como "movimiento" y "apariencia" para que el personaje interactúe con el entorno. ¡Cada bloque es un ladrillo para construir algo grande!';
            }
            break;
        case 'Diseno':
            obsId = 'obsDiseno';
            if (puntajeNum >= 9) {
                observacionSugerida = '¡Diseño profesional! El proyecto tiene una **coherencia visual** notable, con gráficos de alta calidad y un diseño de interfaz de usuario (UI) intuitivo. El uso del sonido (música y efectos) crea una atmósfera inmersiva que mejora significativamente la experiencia del usuario (UX).';
            } else if (puntajeNum >= 5) {
                observacionSugerida = 'El diseño es funcional, pero podría ser más atractivo. Los elementos gráficos son coherentes, pero la interfaz podría ser más intuitiva para el usuario. Les sugerimos experimentar con la **paleta de colores**, la **tipografía** y los **efectos de sonido** para enriquecer la experiencia y guiar mejor al jugador.';
            } else if (puntajeNum >= 1) {
                observacionSugerida = 'El proyecto tiene un diseño básico. Les recomendamos explorar la biblioteca de fondos y sprites de Scratch. Con el uso de disfraces y los bloques de apariencia, pueden crear animaciones simples para hacer el proyecto más dinámico. ¡Un pequeño cambio visual puede hacer una gran diferencia!';
            } else {
                observacionSugerida = 'No se ha implementado diseño visual. Les sugerimos empezar por elegir un fondo y un personaje que les gusten. La estética del proyecto es fundamental para captar la atención del público.';
            }
            break;
        case 'Creatividad':
            obsId = 'obsCreatividad';
            if (puntajeNum >= 9) {
                observacionSugerida = '¡Una idea brillante! La propuesta es totalmente original y el uso de los bloques de Scratch para resolver el problema o narrar la historia es innovador. Han utilizado los recursos de forma no convencional para crear una experiencia única. ¡Su creatividad es excepcional!';
            } else if (puntajeNum >= 5) {
                observacionSugerida = 'La idea es interesante, pero se basa en proyectos existentes. Les animamos a añadir un **giro inesperado** o una mecánica que la haga única. Piensen en cómo pueden combinar ideas de diferentes juegos o problemas para crear algo nuevo y sorprendente. ¡La innovación nace de la mezcla de conceptos!';
            } else if (puntajeNum >= 1) {
                observacionSugerida = 'El proyecto tiene una idea base, pero carece de un elemento original. Los invitamos a explorar las extensiones de Scratch, a combinar diferentes tipos de proyectos (juego + historia) o a incorporar sus intereses personales para darle una identidad única.';
            } else {
                observacionSugerida = 'La creatividad es la base de todo proyecto. Les sugerimos realizar una **lluvia de ideas** con el equipo para definir una propuesta que les entusiasme. ¡A partir de un concepto simple, pueden construir una gran idea!';
            }
            break;
        case 'TrabajoEquipo':
            obsId = 'obsTrabajoEquipo';
            if (puntajeNum >= 9) {
                observacionSugerida = '¡Excelente colaboración! La división de roles y la comunicación entre los integrantes es ejemplar. Se evidencia una sinergia y un apoyo mutuo para resolver los desafíos técnicos y creativos. Este tipo de trabajo en equipo es clave para el éxito en proyectos complejos.';
            } else if (puntajeNum >= 5) {
                observacionSugerida = 'Se nota el trabajo en equipo, pero la colaboración podría ser más fluida. Recomendamos la práctica de la **programación en pareja** y la comunicación constante para que cada miembro entienda el código del otro. Una mejor coordinación evitará conflictos y duplicación de tareas.';
            } else if (puntajeNum >= 1) {
                observacionSugerida = 'El proyecto presenta un trabajo individual. Les sugerimos asignar roles claros a cada miembro (ej. "programador", "diseñador", "escritor de historia") para que cada uno se sienta parte del proceso. La colaboración es fundamental para el crecimiento profesional y personal.';
            } else {
                observacionSugerida = 'La colaboración es clave. Les animamos a trabajar juntos, a escuchar las ideas de todos y a asignar roles. El apoyo mutuo hace que el proceso de creación sea más divertido y exitoso.';
            }
            break;
        case 'ProcesoTrabajo':
            obsId = 'obsProcesoTrabajo';
            if (puntajeNum >= 9) {
                observacionSugerida = 'El proyecto demuestra un proceso de desarrollo metódico y un gran esfuerzo. Se observa una planificación clara, con múltiples versiones y mejoras progresivas. Han superado obstáculos técnicos con persistencia y dedicación, lo que se refleja en la calidad del resultado final.';
            } else if (puntajeNum >= 5) {
                observacionSugerida = 'Se ve el esfuerzo, pero el proyecto podría beneficiarse de un proceso de trabajo más estructurado. Les aconsejamos definir una **hoja de ruta** y establecer metas a corto plazo. Guardar versiones de respaldo del proyecto es una excelente práctica para no perder el progreso y aprender del proceso.';
            } else if (puntajeNum >= 1) {
                observacionSugerida = 'El proyecto parece incompleto. Les animamos a dedicar más tiempo y esfuerzo para que sus ideas tomen forma. Un buen primer paso es definir qué quieren que el proyecto haga al final, y luego ir construyendo ese objetivo bloque a bloque.';
            } else {
                observacionSugerida = 'El proyecto parece estar en una fase inicial. Les recomendamos que se propongan una meta pequeña para empezar y que dediquen tiempo a explorar las herramientas. La perseverancia es la clave para ver sus ideas convertidas en realidad.';
            }
            break;
    }
    
    const campoObs = document.getElementById(obsId);
    if (campoObs) {
        campoObs.placeholder = observacionSugerida;
    }
}
function actualizarSugerenciaGeneral() {
    const puntajeFuncionalidad = Number(document.getElementById('puntajeFuncionalidad').value) || 0;
    const puntajeProgramacion = Number(document.getElementById('puntajeProgramacion').value) || 0;
    const puntajeDiseno = Number(document.getElementById('puntajeDiseno').value) || 0;
    const puntajeCreatividad = Number(document.getElementById('puntajeCreatividad').value) || 0;
    const puntajeTrabajoEquipo = Number(document.getElementById('puntajeTrabajoEquipo').value) || 0;
    const puntajeProcesoTrabajo = Number(document.getElementById('puntajeProcesoTrabajo').value) || 0;

    const total = puntajeFuncionalidad + puntajeProgramacion + puntajeDiseno +
        puntajeCreatividad + puntajeTrabajoEquipo + puntajeProcesoTrabajo;
    
    const obsGeneralManual = document.getElementById('obsGeneralManual');
    if (obsGeneralManual) {
        obsGeneralManual.placeholder = generarObservacionGeneral(total);
        actualizarTextoBoton(document.querySelector('.btn-placeholder-to-value[data-target="obsGeneralManual"]'), 'obsGeneralManual');
    }
}

function convertirPlaceholderAValor(targetId) {
    const campo = document.getElementById(targetId);
    if (campo) {
        if (campo.value.trim() === '' && campo.placeholder.trim() !== '') {
            campo.value = campo.placeholder;
            mostrarNotificacion(`Sugerencia de observación aplicada a '${targetId}'.`, 'info');
        } else {
            campo.value = '';
            mostrarNotificacion(`Sugerencia de observación eliminada de '${targetId}'.`, 'info');
        }
        const button = document.querySelector(`.btn-placeholder-to-value[data-target="${targetId}"]`);
        if (button) {
            actualizarTextoBoton(button, targetId);
        }
    }
}

function actualizarTextoBoton(button, targetId) {
    const campo = document.getElementById(targetId);
    if (campo) {
        if (campo.value.trim() === '') {
            button.textContent = 'Usar sugerencia';
        } else {
            button.textContent = 'Borrar sugerencia';
        }
    }
}

function actualizarTextoBotonesSugerencia() {
    document.querySelectorAll('.btn-placeholder-to-value').forEach(button => {
        const targetId = button.getAttribute('data-target');
        actualizarTextoBoton(button, targetId);
    });
}

function convertirPlaceholdersAValores() {
    const camposObs = document.querySelectorAll('textarea[id^="obs"]');
    camposObs.forEach(campo => {
        if (campo.value.trim() === '' && campo.placeholder.trim() !== '') {
            campo.value = campo.placeholder;
        }
    });
    actualizarTextoBotonesSugerencia();
    mostrarNotificacion('Sugerencias de observación aplicadas a todos los campos.', 'info');
}

function generarObservacionGeneral(total) {
    const maxPuntaje = 60;
    const porcentaje = (total / maxPuntaje) * 100;
    
    if (porcentaje >= 90) {
        return "¡Felicidades! Este proyecto es sobresaliente. Se evidencia una comprensión avanzada de los conceptos de programación y una ejecución técnica impecable. La creatividad y el trabajo en equipo son dignos de un profesional. Este es un proyecto de alto nivel que sirve de inspiración para la comunidad.";
    } else if (porcentaje >= 75) {
        return "¡Muy buen trabajo! El proyecto es sólido y completo. Los estudiantes demuestran una buena comprensión de la mayoría de los criterios técnicos. Para llevarlo al siguiente nivel, podrían enfocarse en la optimización del código o en la expansión de la narrativa. Un gran esfuerzo que ha dado excelentes resultados.";
    } else if (porcentaje >= 50) {
        return "El proyecto muestra un sólido potencial y un buen entendimiento de los conceptos básicos. Se observan oportunidades claras para mejorar la lógica de programación o la experiencia de usuario. Es un excelente punto de partida para seguir desarrollando habilidades. ¡Con un poco más de práctica, el proyecto podría alcanzar un nivel superior!";
    } else if (porcentaje >= 25) {
        return "El proyecto muestra un inicio prometedor, pero necesita un desarrollo más profundo en los aspectos técnicos. Es fundamental revisar los fundamentos de la programación, como la secuencia de bloques y la funcionalidad de los eventos. Es un buen momento para aprender de los errores y seguir construyendo.";
    } else {
        return "Este proyecto es una primera aproximación al mundo de la programación. Sugerimos a los estudiantes explorar a fondo los tutoriales básicos de Scratch para familiarizarse con las herramientas. El aprendizaje de la programación es un proceso gradual, y este es un buen primer paso en el camino.";
    }
}

function editarEvaluacion(idx) {
    const ev = evaluaciones[idx];
    if (!ev) {
        mostrarNotificacion('Error: Evaluación no encontrada para editar.', 'error');
        return;
    }

    document.getElementById('selectGrupo').value = ev.grupoId;
    document.getElementById('selectGrupo').dispatchEvent(new Event('change'));

    document.getElementById('idProyecto').value = ev.idProyecto || '';
    document.getElementById('puntajeFuncionalidad').value = ev.puntajeFuncionalidad;
    document.getElementById('obsFuncionalidad').value = ev.obsFuncionalidad || '';
    document.getElementById('puntajeProgramacion').value = ev.puntajeProgramacion;
    document.getElementById('obsProgramacion').value = ev.obsProgramacion || '';
    document.getElementById('puntajeDiseno').value = ev.puntajeDiseno;
    document.getElementById('obsDiseno').value = ev.obsDiseno || '';
    document.getElementById('puntajeCreatividad').value = ev.puntajeCreatividad || '';
    document.getElementById('obsCreatividad').value = ev.obsCreatividad || '';
    document.getElementById('puntajeTrabajoEquipo').value = ev.puntajeTrabajoEquipo || '';
    document.getElementById('obsTrabajoEquipo').value = ev.obsTrabajoEquipo || '';
    document.getElementById('puntajeProcesoTrabajo').value = ev.puntajeProcesoTrabajo || '';
    document.getElementById('obsProcesoTrabajo').value = ev.obsProcesoTrabajo || '';
    document.getElementById('mencionEspecialManual').value = ev.mencion || '';
    
    const obsGeneralManual = document.getElementById('obsGeneralManual');
    if (obsGeneralManual) {
        obsGeneralManual.value = ev.obsGeneral || '';
    }

    document.getElementById('indiceEdicion').value = idx;
    
    sugerirObservacion(ev.puntajeFuncionalidad, 'Funcionalidad');
    sugerirObservacion(ev.puntajeProgramacion, 'Programacion');
    sugerirObservacion(ev.puntajeDiseno, 'Diseno');
    sugerirObservacion(ev.puntajeCreatividad, 'Creatividad');
    sugerirObservacion(ev.puntajeTrabajoEquipo, 'TrabajoEquipo');
    sugerirObservacion(ev.puntajeProcesoTrabajo, 'ProcesoTrabajo');

    actualizarSugerenciaGeneral();
    actualizarTextoBotonesSugerencia();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function eliminarEvaluacion(idx) {
    if (confirm("¿Estás seguro de que deseas eliminar esta evaluación?")) {
        evaluaciones.splice(idx, 1);
        guardarEvaluaciones();
        actualizarInterfaz();
        mostrarNotificacion('Evaluación eliminada correctamente.', 'success');
    }
}

function limpiarTodasEvaluaciones() {
    if (confirm("¡ATENCIÓN! ¿Estás seguro de que deseas eliminar TODAS las evaluaciones? Esta acción es irreversible.")) {
        evaluaciones = [];
        guardarEvaluaciones();
        actualizarInterfaz();
        mostrarNotificacion('Todas las evaluaciones han sido eliminadas.', 'success');
    }
}

function limpiarFormularioEvaluacion() {
    document.getElementById('formularioEvaluacion').reset();
    document.getElementById('indiceEdicion').value = '';
    document.getElementById('grupoInfo').style.display = 'none';
    document.getElementById('grupoInfo').innerHTML = '';
    document.getElementById('selectGrupo').value = '';
    
    const obsGeneralManual = document.getElementById('obsGeneralManual');
    if (obsGeneralManual) {
        obsGeneralManual.value = '';
        obsGeneralManual.placeholder = generarObservacionGeneral(0); 
    }
    
    actualizarTextoBotonesSugerencia();
}

function cargarEvaluaciones() {
    const datos = localStorage.getItem('evaluacionesScratch');
    if (datos) {
        evaluaciones = JSON.parse(datos);
    }
}

function guardarEvaluaciones() {
    localStorage.setItem('evaluacionesScratch', JSON.stringify(evaluaciones));
}

// --- Funciones de visualización y utilidad ---
function actualizarInterfaz() {
    mostrarEvaluaciones();
    mostrarEvaluadoresGlobales();
    mostrarClasificacion();
}

function mostrarEvaluaciones() {
    const lista = document.getElementById('listaEvaluaciones');
    lista.innerHTML = '';

    if (evaluaciones.length === 0) {
        lista.innerHTML = '<p id="noDatosMensaje">No hay evaluaciones guardadas aún.</p>';
        document.getElementById('limpiarDatos').style.display = 'none';
        document.getElementById('exportarJsonBtn').style.display = 'none';
        document.getElementById('exportarPdfBtn').style.display = 'none';
        document.getElementById('exportarPdfBtn1').style.display = 'none';
      
        return;
    }
    document.getElementById('limpiarDatos').style.display = 'inline-block';
    document.getElementById('exportarJsonBtn').style.display = 'inline-block';
    document.getElementById('exportarPdfBtn').style.display = 'inline-block';
    document.getElementById('exportarPdfBtn1').style.display = 'inline-block';

    evaluaciones.forEach((ev, idx) => {
        const evaluadoresDisplay = [];
        if (ev.evaluador1) evaluadoresDisplay.push(ev.evaluador1);
        if (ev.evaluador2) evaluadoresDisplay.push(ev.evaluador2);
        if (ev.evaluador3) evaluadoresDisplay.push(ev.evaluador3);
        const evaluadoresHtml = evaluadoresDisplay.length > 0
            ? `<p><strong>Evaluador(es):</strong> ${evaluadoresDisplay.join(', ')}</p>`
            : '';

        const fechaLegible = ev.fechaEvaluacion ? new Date(ev.fechaEvaluacion).toLocaleDateString('es-AR') : 'N/A';

        const div = document.createElement('div');
        div.className = 'evaluacion-card';
        div.setAttribute('data-index', idx);

        div.innerHTML = `
            <p class="escuela-display">Olimpiadas de Programación Scracth - Sede Villa Dolores - Cba </p>
            <div class="action-buttons">
                <button class="edit-btn" onclick="editarEvaluacion(${idx})">Editar</button>
                <button class="delete-btn" onclick="eliminarEvaluacion(${idx})">Eliminar</button>
            </div>
            ${evaluadoresHtml}
            

            <p><strong>Fecha de Evaluación:</strong> ${fechaLegible}</p>
            <p class="escuela-display"><strong>Grupo:</strong> ${ev.nombreGrupo}</p>
            <p class="escuela-display"><strong>Escuela:</strong> ${ev.escuelaGrupo}</p>
            <p class="escuela-display"><strong>Grado/Curso:</strong> ${ev.gradoGrupo}</p>
            <p class="escuela-display"><strong>Integrantes:</strong> ${ev.integrantesGrupo ? ev.integrantesGrupo.join(', ') : 'N/A'}</p>
            <p><strong>ID Proyecto Scratch:</strong> ${ev.idProyecto || 'N/A'}</p>
            <p><strong>Funcionalidad:</strong> ${ev.puntajeFuncionalidad} / 10</p>
            <p><strong>Observaciones Funcionalidad:</strong> ${ev.obsFuncionalidad || 'Sin observaciones'}</p>
            <p><strong>Programación:</strong> ${ev.puntajeProgramacion} / 10</p>
            <p><strong>Observaciones Programación:</strong> ${ev.obsProgramacion || 'Sin observaciones'}</p>
            <p><strong>Diseño/UX:</strong> ${ev.puntajeDiseno} / 10</p>
            <p><strong>Observaciones Diseño/UX:</strong> ${ev.obsDiseno || 'Sin observaciones'}</p>
            <p><strong>Creatividad y Originalidad:</strong> ${ev.puntajeCreatividad} / 10</p>
            <p><strong>Observaciones Creatividad:</strong> ${ev.obsCreatividad || 'Sin observaciones'}</p>
            <p><strong>Trabajo en Equipo:</strong> ${ev.puntajeTrabajoEquipo} / 10</p>
            <p><strong>Observaciones Trabajo en Equipo:</strong> ${ev.obsTrabajoEquipo || 'Sin observaciones'}</p>
            <p><strong>Proceso de Trabajo y Esfuerzo:</strong> ${ev.puntajeProcesoTrabajo} / 10</p>
            <p><strong>Observaciones Proceso de Trabajo:</strong> ${ev.obsProcesoTrabajo || 'Sin observaciones'}</p>
            ${ev.mencion ? `<p class="mencion-especial-display"><strong>Mención Especial:</strong> ${ev.mencion}</p>` : ''}
            <p class="total-score"><strong>Total:</strong> ${ev.total} puntos</p>
            <p class="obs-general-display"><strong>Observación General:</strong> ${ev.obsGeneral || 'Sin observación general'}</p>
        `;
        lista.appendChild(div);
    });
}

function mostrarClasificacion() {
    const contenedor = document.getElementById('clasificacionResultados');
    contenedor.innerHTML = '';

    if (evaluaciones.length === 0) {
        contenedor.innerHTML = '<p>No hay evaluaciones para mostrar la clasificación.</p>';
        return;
    }

    const ordenadas = [...evaluaciones].sort((a, b) => b.total - a.total);

    let html = `<h2>Clasificación de Proyectos</h2><ol class="clasificacion-list">`;

    let puestoActual = 1;
    let puntajeAnterior = null;
    ordenadas.forEach((ev, i) => {
        if (i > 0 && ev.total < puntajeAnterior) {
            puestoActual = i + 1;
        }
        
        const mencionHtml = ev.mencion ? ` - <span class="mencion-inline">(${ev.mencion})</span>` : '';
        html += `
            <li>
                <span class="puesto">#${puestoActual}</span>
                <div class="info-clasificacion">
                    ${ev.nombreGrupo}- ${ev.escuelaGrupo} (${ev.gradoGrupo})
                    <span class="puntaje-total">${ev.total} pts </span>
                    
                    ${mencionHtml}
                </div>
            </li>
        `;
        puntajeAnterior = ev.total;
    });
    html += '</ol>';
    contenedor.innerHTML = html;
}

function mostrarInfoGrupo() {
    const select = document.getElementById('selectGrupo');
    const grupoId = select.value;
    const grupoInfoDiv = document.getElementById('grupoInfo');

    if (grupoId) {
        const grupoSeleccionado = grupos.find(g => g.id === grupoId);
        if (grupoSeleccionado) {
            const integrantes = grupoSeleccionado.integrantes.join(', ');
            grupoInfoDiv.innerHTML = `
                <p><strong>Escuela:</strong> ${grupoSeleccionado.escuela}</p>
                <p><strong>Grado:</strong> ${grupoSeleccionado.grado}</p>
                <p><strong>Integrantes:</strong> ${integrantes}</p>
            `;
            grupoInfoDiv.style.display = 'block';
        }
    } else {
        grupoInfoDiv.style.display = 'none';
        grupoInfoDiv.innerHTML = '';
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const notificationBar = document.getElementById('notification-bar');
    notificationBar.textContent = mensaje;
    notificationBar.className = `notification ${tipo}`;
    notificationBar.style.display = 'block';

    setTimeout(() => {
        notificationBar.style.display = 'none';
    }, 5000);
}

function exportarDatos() {
    if (evaluaciones.length === 0) {
        mostrarNotificacion('No hay datos para exportar.', 'error');
        return;
    }

    const evaluacionesParaExportar = [...evaluaciones];
    evaluacionesParaExportar.sort((a, b) => b.total - a.total);

    let puestoActual = 1;
    let puntajeAnterior = null;
    const datosConPuesto = evaluacionesParaExportar.map((ev, i) => {
        if (i > 0 && ev.total < puntajeAnterior) {
            puestoActual = i + 1;
        }
        const evaluacionConPuesto = {
            ...ev,
            posicionClasificacion: puestoActual
        };
        puntajeAnterior = ev.total;
        return evaluacionConPuesto;
    });

    const datos = JSON.stringify(datosConPuesto, null, 2);
    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluaciones_scratch_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarNotificacion('Datos exportados con éxito, incluyendo la clasificación.', 'success');
}

// --- Funciones para exportar a PDF
function exportarPDF() {
    if (evaluaciones.length === 0) {
        mostrarNotificacion('No hay evaluaciones para exportar a PDF.', 'error');
        return;
    }

    const contenedorTemporal = document.createElement('div');
    contenedorTemporal.style.position = 'absolute';
    contenedorTemporal.style.left = '-9999px';
    contenedorTemporal.style.width = '210mm';
    contenedorTemporal.innerHTML = `
        <h1 style="text-align: center; font-family: sans-serif;">Reporte de Evaluaciones Scratch</h1>
        ${generarHtmlParaPDF()}
    `;
    document.body.appendChild(contenedorTemporal);

    html2canvas(contenedorTemporal, { 
        scale: 2 
    }).then(canvas => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/jpeg');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`reporte_evaluaciones_scratch_${new Date().toISOString().slice(0, 10)}.pdf`);
        document.body.removeChild(contenedorTemporal);
        mostrarNotificacion('Reporte PDF generado y descargado correctamente.', 'success');
    }).catch(error => {
        document.body.removeChild(contenedorTemporal);
        mostrarNotificacion(`Error al generar el PDF: ${error.message}`, 'error');
    });
}

// --- Exportación a PDF ---
// --- Exportación a PDF ---
async function exportarPDF1() {
    const { jsPDF } = window.jspdf;
    const cards = document.querySelectorAll('.evaluacion-card');

    if (cards.length === 0) {
        mostrarNotificacion('No hay evaluaciones para exportar.', 'error');
        return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    let yOffset = margin;
    
    // Ocultar los botones de acción antes de la exportación
    const actionButtons = document.querySelectorAll('.action-buttons');
    actionButtons.forEach(btnContainer => {
        btnContainer.style.display = 'none';
    });
    
    // Título del documento
    const titulo = "Reporte de Evaluaciones Scratch";
    doc.setFontSize(20);
    doc.text(titulo, 105, 20, null, null, "center");
    
    // Información general
    doc.setFontSize(12);
    const fechaReporte = new Date().toLocaleDateString('es-AR');
    doc.text(`Fecha del reporte: ${fechaReporte}`, 105, 30, null, null, "center");

    const startY = 40; // Donde empieza el contenido de las tarjetas
    let contentHeight = 0;
    let cardHeight = 0;

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        
        // Convertir la tarjeta actual a una imagen (canvas)
        const canvas = await html2canvas(card, {
            scale: 2,
            logging: false,
            useCORS: true
        });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        cardHeight = (canvas.height * 210) / canvas.width; // A4 width in mm
        contentHeight += cardHeight;
        
        // Lógica de salto de página
        if (startY + contentHeight > doc.internal.pageSize.height - margin && i > 0) {
            doc.addPage();
            yOffset = margin;
            contentHeight = cardHeight;
        }

        doc.addImage(imgData, 'JPEG', margin, yOffset, 190, cardHeight);
        yOffset += cardHeight + 10; // Espacio entre tarjetas
    }

    // Volver a mostrar los botones de acción después de la exportación
    actionButtons.forEach(btnContainer => {
        btnContainer.style.display = 'flex'; // O 'block', según tu diseño CSS original
    });

    doc.save(`Evaluaciones_Scratch_${fechaReporte}.pdf`);
    mostrarNotificacion('PDF exportado correctamente.', 'success');
}

function generarHtmlParaPDF() {
    let html = '';
    
    // Ordenar evaluaciones de mayor a menor puntaje para la clasificación
    const ordenadas = [...evaluaciones].sort((a, b) => b.total - a.total);

    html += '<div style="font-family: sans-serif; padding: 10mm; font-size: 10pt;">';
    
    // Generar la sección de clasificación
    html += '<h2 style="text-align: center; color: #333;">Clasificación General de Proyectos</h2>';
    html += '<ol style="padding-left: 20px;">';
    let puestoActual = 1;
    let puntajeAnterior = null;
    ordenadas.forEach((ev, i) => {
        if (i > 0 && ev.total < puntajeAnterior) {
            puestoActual = i + 1;
        }
        const mencionHtml = ev.mencion ? ` - <em>(${ev.mencion})</em>` : '';
        html += `
            <li style="margin-bottom: 5px;">
                <strong style="color: #007bff;">Puesto #${puestoActual}:</strong> ${ev.nombreGrupo} (${ev.escuelaGrupo}, ${ev.gradoGrupo})
                <br>
                Total: <strong style="color: #28a745;">${ev.total} pts</strong> ${mencionHtml}
            </li>
        `;
        puntajeAnterior = ev.total;
    });
    html += '</ol>';
    html += '<div style="page-break-after: always;"></div>';
    
    // Generar la sección de detalles de cada evaluación
    html += '<h2 style="text-align: center; color: #333;">Detalle de las Evaluaciones</h2>';
    ordenadas.forEach(ev => {
        const integrantes = ev.integrantesGrupo ? ev.integrantesGrupo.join(', ') : 'N/A';
        const mencion = ev.mencion ? `<p style="color: #dc3545; font-weight: bold;">Mención Especial: ${ev.mencion}</p>` : '';
        
        html += `
            <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #0056b3; margin-top: 0;">Proyecto: ${ev.nombreGrupo}</h3>
                <p><strong>Escuela:</strong> ${ev.escuelaGrupo}</p>
                <p><strong>Grado/Curso:</strong> ${ev.gradoGrupo}</p>
                <p><strong>Integrantes:</strong> ${integrantes}</p>
                <p><strong>ID Proyecto Scratch:</strong> ${ev.idProyecto || 'N/A'}</p>
                <hr style="border: 0; border-top: 1px solid #eee;">
                
                <p style="font-weight: bold; font-size: 11pt;">Puntaje Total: <span style="color: #28a745;">${ev.total} pts</span></p>
                ${mencion}

                <div style="margin-top: 15px;">
                    <p><strong>Funcionalidad:</strong> ${ev.puntajeFuncionalidad} / 10</p>
                    <p style="margin-left: 10px; font-style: italic; color: #555;">- Observación: ${ev.obsFuncionalidad || 'Sin observación'}</p>
                    
                    <p><strong>Programación:</strong> ${ev.puntajeProgramacion} / 10</p>
                    <p style="margin-left: 10px; font-style: italic; color: #555;">- Observación: ${ev.obsProgramacion || 'Sin observación'}</p>
                    
                    <p><strong>Diseño/UX:</strong> ${ev.puntajeDiseno} / 10</p>
                    <p style="margin-left: 10px; font-style: italic; color: #555;">- Observación: ${ev.obsDiseno || 'Sin observación'}</p>
                    
                    <p><strong>Creatividad:</strong> ${ev.puntajeCreatividad} / 10</p>
                    <p style="margin-left: 10px; font-style: italic; color: #555;">- Observación: ${ev.obsCreatividad || 'Sin observación'}</p>
                    
                    <p><strong>Trabajo en Equipo:</strong> ${ev.puntajeTrabajoEquipo} / 10</p>
                    <p style="margin-left: 10px; font-style: italic; color: #555;">- Observación: ${ev.obsTrabajoEquipo || 'Sin observación'}</p>
                    
                    <p><strong>Proceso de Trabajo:</strong> ${ev.puntajeProcesoTrabajo} / 10</p>
                    <p style="margin-left: 10px; font-style: italic; color: #555;">- Observación: ${ev.obsProcesoTrabajo || 'Sin observación'}</p>
                </div>

                <div style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #007bff; border-radius: 4px;">
                    <p style="font-weight: bold;">Observación General:</p>
                    <p style="margin-left: 10px;">${ev.obsGeneral || 'Sin observación general'}</p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}