/**
 * Sistema de Solicitudes - Lógica Frontend (ES6 Vanilla)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM
  const formRegistro = document.getElementById('form-registro');
  const formConsulta = document.getElementById('form-consulta');
  const formGestion = document.getElementById('form-gestion');
  const inputBuscarCodigo = document.getElementById('input-buscar-codigo');
  const btnRecargarLista = document.getElementById('btn-recargar-lista');
  const btnNuevoScroll = document.getElementById('btn-nuevo-scroll');

  // Modal
  const modalExito = document.getElementById('modal-exito');
  const modalCodigo = document.getElementById('modal-codigo');
  const btnCopiarCodigo = document.getElementById('btn-copiar-codigo');
  const btnCopiarText = document.getElementById('btn-copiar-text');
  const btnVerTicketModal = document.getElementById('btn-ver-ticket-modal');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal');
  const btnCerrarModalX = document.getElementById('btn-cerrar-modal-x');

  // Alerta global
  const globalAlert = document.getElementById('global-alert');
  const alertTitle = document.getElementById('alert-title');
  const alertMessage = document.getElementById('alert-message');
  const alertDetails = document.getElementById('alert-details');
  const btnCerrarAlerta = document.getElementById('btn-cerrar-alerta');

  // Consulta y Detalle
  const consultaEmpty = document.getElementById('consulta-empty');
  const consultaResultado = document.getElementById('consulta-resultado');
  const ticketViewCodigo = document.getElementById('ticket-view-codigo');
  const ticketViewEstado = document.getElementById('ticket-view-estado');
  const ticketViewPrioridad = document.getElementById('ticket-view-prioridad');
  const ticketViewSolicitante = document.getElementById('ticket-view-solicitante');
  const ticketViewCategoria = document.getElementById('ticket-view-categoria');
  const ticketViewTecnico = document.getElementById('ticket-view-tecnico');
  const ticketViewFechaCreacion = document.getElementById('ticket-view-fecha-creacion');
  const ticketViewFechaActualizacion = document.getElementById('ticket-view-fecha-actualizacion');
  const ticketViewDescripcion = document.getElementById('ticket-view-descripcion');
  const timelineList = document.getElementById('timeline-list');

  // Gestión de Estado
  const gestionIndicator = document.getElementById('gestion-indicator');
  const gestionSummaryCode = document.getElementById('gestion-summary-code');
  const gestionSummaryState = document.getElementById('gestion-summary-state');
  const gestNuevoEstado = document.getElementById('gest-nuevo-estado');
  const gestTecnico = document.getElementById('gest-tecnico');
  const gestObservaciones = document.getElementById('gest-observaciones');
  const btnActualizarEstado = document.getElementById('btn-actualizar-estado');
  const tecnicoRequiredMark = document.getElementById('tecnico-required-mark');
  const tecnicoHint = document.getElementById('tecnico-hint');

  // Tablero
  const tablaBody = document.getElementById('tabla-body');

  // Estado local en memoria del cliente
  let ticketActivo = null;

  // Transiciones válidas según modelo
  const TRANSICIONES_VALIDAS = {
    'Registrada': ['Asignada', 'Cancelada'],
    'Asignada': ['En Proceso', 'Cancelada'],
    'En Proceso': ['Resuelta', 'Cancelada'],
    'Resuelta': [],
    'Cancelada': []
  };

  const ESTADOS_REQUIEREN_TECNICO = ['Asignada', 'En Proceso', 'Resuelta'];

  // ==========================================
  // 1. UTILIDADES Y NOTIFICACIONES
  // ==========================================

  function mostrarAlerta(tipo, titulo, mensaje, detalles = []) {
    globalAlert.hidden = false;
    globalAlert.className = `alert-banner ${tipo === 'success' ? 'alert-success' : 'alert-error'}`;
    alertTitle.textContent = titulo;
    alertMessage.textContent = mensaje;

    if (detalles && detalles.length > 0) {
      alertDetails.hidden = false;
      alertDetails.innerHTML = '';
      detalles.forEach(d => {
        const li = document.createElement('li');
        li.textContent = d;
        alertDetails.appendChild(li);
      });
    } else {
      alertDetails.hidden = true;
      alertDetails.innerHTML = '';
    }

    globalAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function ocultarAlerta() {
    globalAlert.hidden = true;
  }

  btnCerrarAlerta.addEventListener('click', ocultarAlerta);

  function formatearFecha(isoString) {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  function getBadgeEstadoClase(estado) {
    switch (estado) {
      case 'Registrada': return 'badge-registrada';
      case 'Asignada': return 'badge-asignada';
      case 'En Proceso': return 'badge-proceso';
      case 'Resuelta': return 'badge-resuelta';
      case 'Cancelada': return 'badge-cancelada';
      default: return 'badge-registrada';
    }
  }

  // ==========================================
  // 2. MÓDULO DE REGISTRO
  // ==========================================

  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarAlerta();

    const solicitante = document.getElementById('reg-solicitante').value.trim();
    const categoria = document.getElementById('reg-categoria').value.trim();
    const prioridad = document.getElementById('reg-prioridad').value.trim();
    const descripcion = document.getElementById('reg-descripcion').value.trim();

    // Validación cliente
    const faltantes = [];
    if (!solicitante) faltantes.push('Solicitante');
    if (!categoria) faltantes.push('Categoría');
    if (!prioridad) faltantes.push('Prioridad');
    if (!descripcion) faltantes.push('Descripción');

    if (faltantes.length > 0) {
      mostrarAlerta(
        'error',
        'Campos incompletos',
        'Por favor complete todos los campos obligatorios para registrar la solicitud.',
        faltantes.map(f => `El campo '${f}' es requerido`)
      );
      return;
    }

    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitante, categoria, descripcion, prioridad })
      });

      const data = await response.json();

      if (!response.ok) {
        mostrarAlerta(
          'error',
          data.mensaje || 'Error al registrar solicitud',
          data.error || 'BAD_REQUEST',
          data.detalles || []
        );
        return;
      }

      // Registro exitoso
      formRegistro.reset();
      abrirModalExito(data.codigo);
      cargarTablero();
    } catch (err) {
      mostrarAlerta('error', 'Error de conexión', 'No se pudo comunicar con el servidor.');
      console.error(err);
    }
  });

  function abrirModalExito(codigo) {
    modalCodigo.textContent = codigo;
    modalExito.hidden = false;
    modalExito.style.display = 'flex';
    btnCopiarText.textContent = 'Copiar';
    if (btnCerrarModal) {
      btnCerrarModal.focus();
    }
  }

  function cerrarModalExito() {
    modalExito.hidden = true;
    modalExito.style.display = 'none';
  }

  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', cerrarModalExito);
  }

  if (btnCerrarModalX) {
    btnCerrarModalX.addEventListener('click', cerrarModalExito);
  }

  // Cerrar al hacer clic en el backdrop fuera de la tarjeta modal
  modalExito.addEventListener('click', (e) => {
    if (e.target === modalExito) {
      cerrarModalExito();
    }
  });

  // Cerrar al presionar la tecla Escape en el teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalExito.hidden) {
      cerrarModalExito();
    }
  });

  btnCopiarCodigo.addEventListener('click', async () => {
    const codigo = modalCodigo.textContent;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codigo);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = codigo;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      btnCopiarText.textContent = '¡Copiado!';
      setTimeout(() => {
        btnCopiarText.textContent = 'Copiar';
      }, 2500);
    } catch (err) {
      btnCopiarText.textContent = 'Error al copiar';
      console.error(err);
    }
  });

  btnVerTicketModal.addEventListener('click', () => {
    const codigo = modalCodigo.textContent;
    cerrarModalExito();
    inputBuscarCodigo.value = codigo;
    consultarSolicitud(codigo);
  });

  // ==========================================
  // 3. MÓDULO DE CONSULTA
  // ==========================================

  formConsulta.addEventListener('submit', (e) => {
    e.preventDefault();
    const codigo = inputBuscarCodigo.value.trim().toUpperCase();
    if (!codigo) {
      mostrarAlerta('error', 'Código requerido', 'Por favor ingrese un código de solicitud para buscar.');
      return;
    }
    consultarSolicitud(codigo);
  });

  async function consultarSolicitud(codigo) {
    ocultarAlerta();
    const codNormalizado = codigo.trim().toUpperCase();

    try {
      const response = await fetch(`/api/solicitudes/${encodeURIComponent(codNormalizado)}`);
      const data = await response.json();

      if (!response.ok) {
        consultaEmpty.hidden = false;
        consultaResultado.hidden = true;
        desactivarModuloGestion();
        mostrarAlerta(
          'error',
          'Solicitud no encontrada (404)',
          data.mensaje || `No se encontró ninguna solicitud con el código ${codNormalizado}`
        );
        return;
      }

      // Renderizar datos en tarjeta
      ticketActivo = data;
      renderizarDetalleTicket(data);
      activarModuloGestion(data);
    } catch (err) {
      mostrarAlerta('error', 'Error al consultar', 'Ocurrió un problema de red al intentar recuperar la solicitud.');
      console.error(err);
    }
  }

  function renderizarDetalleTicket(ticket) {
    consultaEmpty.hidden = true;
    consultaResultado.hidden = false;

    ticketViewCodigo.textContent = ticket.codigo;
    ticketViewEstado.textContent = ticket.estado;
    ticketViewEstado.className = `badge-status ${getBadgeEstadoClase(ticket.estado)}`;
    ticketViewPrioridad.textContent = `Prioridad ${ticket.prioridad}`;

    ticketViewSolicitante.textContent = ticket.solicitante;
    ticketViewCategoria.textContent = ticket.categoria;
    ticketViewTecnico.textContent = ticket.tecnico || 'Sin asignar';
    ticketViewTecnico.className = ticket.tecnico ? 'detail-value' : 'detail-value text-muted';

    ticketViewFechaCreacion.textContent = formatearFecha(ticket.fechaCreacion);
    ticketViewFechaActualizacion.textContent = formatearFecha(ticket.fechaActualizacion);
    ticketViewDescripcion.textContent = ticket.descripcion;

    // Renderizar Timeline
    timelineList.innerHTML = '';
    if (Array.isArray(ticket.historial)) {
      ticket.historial.forEach((item) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'timeline-item';

        const subinfo = [];
        if (item.estadoAnterior) {
          subinfo.push(`Estado anterior: ${item.estadoAnterior}`);
        }
        subinfo.push(`Nuevo estado: ${item.nuevoEstado}`);
        if (item.tecnicoAsignado) {
          subinfo.push(`Técnico: ${item.tecnicoAsignado}`);
        }

        itemEl.innerHTML = `
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-meta">
              <span class="timeline-action">${item.id} · ${item.accion}</span>
              <span class="timeline-date">${formatearFecha(item.fechaHora)}</span>
            </div>
            <p class="timeline-desc">${item.observaciones || 'Sin observaciones'}</p>
            <div class="timeline-subinfo">
              <span>${subinfo.join(' · ')}</span>
            </div>
          </div>
        `;
        timelineList.appendChild(itemEl);
      });
    }
  }

  // ==========================================
  // 4. MÓDULO DE GESTIÓN DE ESTADO
  // ==========================================

  function activarModuloGestion(ticket) {
    gestionIndicator.textContent = 'Ticket Activo';
    gestionIndicator.className = 'panel-badge badge-active';

    gestionSummaryCode.textContent = ticket.codigo;
    gestionSummaryState.textContent = `Estado actual: ${ticket.estado} (Técnico: ${ticket.tecnico || 'Ninguno'})`;

    const transiciones = TRANSICIONES_VALIDAS[ticket.estado] || [];

    // Limpiar y repoblar el select de estados válidos
    gestNuevoEstado.innerHTML = '';
    if (transiciones.length === 0) {
      gestNuevoEstado.innerHTML = `<option value="">Estado final alcanzado (${ticket.estado})</option>`;
      gestNuevoEstado.disabled = true;
      gestTecnico.disabled = true;
      gestObservaciones.disabled = true;
      btnActualizarEstado.disabled = true;
      return;
    }

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Seleccione el siguiente estado...';
    gestNuevoEstado.appendChild(defaultOpt);

    transiciones.forEach(est => {
      const opt = document.createElement('option');
      opt.value = est;
      const reqTec = ESTADOS_REQUIEREN_TECNICO.includes(est);
      opt.textContent = reqTec ? `${est} (Requiere técnico)` : est;
      gestNuevoEstado.appendChild(opt);
    });

    gestNuevoEstado.disabled = false;
    gestTecnico.disabled = false;
    gestObservaciones.disabled = false;
    btnActualizarEstado.disabled = false;

    // Si ya tiene técnico asignado, pre-llenar con el técnico existente
    gestTecnico.value = ticket.tecnico || '';
    gestObservaciones.value = '';

    actualizarReglasTecnico();
  }

  function desactivarModuloGestion() {
    ticketActivo = null;
    gestionIndicator.textContent = 'Esperando Consulta';
    gestionIndicator.className = 'panel-badge badge-disabled';
    gestionSummaryCode.textContent = 'Ninguno seleccionado';
    gestionSummaryState.textContent = 'Consulte una solicitud arriba';

    gestNuevoEstado.innerHTML = '<option value="">Seleccione el nuevo estado...</option>';
    gestNuevoEstado.disabled = true;
    gestTecnico.disabled = true;
    gestTecnico.value = '';
    gestObservaciones.disabled = true;
    gestObservaciones.value = '';
    btnActualizarEstado.disabled = true;

    tecnicoRequiredMark.hidden = true;
    tecnicoHint.textContent = 'Obligatorio si el estado es Asignada, En Proceso o Resuelta.';
  }

  gestNuevoEstado.addEventListener('change', actualizarReglasTecnico);

  function actualizarReglasTecnico() {
    const estadoSeleccionado = gestNuevoEstado.value;
    const requiereTecnico = ESTADOS_REQUIEREN_TECNICO.includes(estadoSeleccionado);

    if (requiereTecnico) {
      tecnicoRequiredMark.hidden = false;
      tecnicoHint.textContent = `⚠️ Obligatorio: Debe especificar el técnico responsable para transicionar a '${estadoSeleccionado}'.`;
      tecnicoHint.style.color = '#b45309';
    } else {
      tecnicoRequiredMark.hidden = true;
      tecnicoHint.textContent = 'Opcional para cancelación o estados que no requieren intervención.';
      tecnicoHint.style.color = 'var(--text-muted)';
    }
  }

  formGestion.addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarAlerta();

    if (!ticketActivo) {
      mostrarAlerta('error', 'Error', 'Debe consultar una solicitud antes de intentar actualizar su estado.');
      return;
    }

    const nuevoEstado = gestNuevoEstado.value;
    const tecnico = gestTecnico.value.trim();
    const observaciones = gestObservaciones.value.trim();

    if (!nuevoEstado) {
      mostrarAlerta('error', 'Estado no seleccionado', 'Por favor seleccione el nuevo estado para la solicitud.');
      return;
    }

    // Validación estricta en el cliente para Asignada, En Proceso o Resuelta
    const requiereTecnico = ESTADOS_REQUIEREN_TECNICO.includes(nuevoEstado);
    if (requiereTecnico && !tecnico) {
      mostrarAlerta(
        'error',
        'Técnico Obligatorio',
        `Para transicionar a '${nuevoEstado}', el campo 'Técnico Responsable' es obligatorio y no puede quedar vacío.`,
        ['Ingrese el nombre del técnico antes de enviar la actualización']
      );
      gestTecnico.focus();
      return;
    }

    try {
      const response = await fetch(`/api/solicitudes/${encodeURIComponent(ticketActivo.codigo)}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevoEstado,
          tecnico: tecnico || null,
          observaciones: observaciones || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        mostrarAlerta(
          'error',
          data.mensaje || 'Error al actualizar estado',
          data.error || 'BAD_REQUEST',
          data.detalles || []
        );
        return;
      }

      // Éxito: refrescar vista del ticket y tablero
      ticketActivo = data;
      renderizarDetalleTicket(data);
      activarModuloGestion(data);
      cargarTablero();

      mostrarAlerta(
        'success',
        'Estado Actualizado',
        `La solicitud ${data.codigo} ahora se encuentra en estado '${data.estado}' exitosamente.`
      );
    } catch (err) {
      mostrarAlerta('error', 'Error de red', 'No se pudo comunicar con el servidor para actualizar el estado.');
      console.error(err);
    }
  });

  // ==========================================
  // 5. TABLERO DE SOLICITUDES
  // ==========================================

  async function cargarTablero() {
    try {
      const response = await fetch('/api/solicitudes');
      if (!response.ok) return;

      const solicitudes = await response.json();
      tablaBody.innerHTML = '';

      if (solicitudes.length === 0) {
        tablaBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
              No hay solicitudes registradas aún. ¡Cree una nueva en el Módulo 01!
            </td>
          </tr>
        `;
        return;
      }

      // Ordenar por fecha de actualización descendente
      solicitudes.sort((a, b) => new Date(b.fechaActualizacion) - new Date(a.fechaActualizacion));

      solicitudes.forEach(sol => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code class="ticket-code-value" style="font-size: 0.95rem;">${sol.codigo}</code></td>
          <td><strong>${sol.solicitante}</strong></td>
          <td>${sol.categoria}</td>
          <td><span class="badge-priority">${sol.prioridad}</span></td>
          <td><span class="badge-status ${getBadgeEstadoClase(sol.estado)}">${sol.estado}</span></td>
          <td>${sol.tecnico ? `<strong>${sol.tecnico}</strong>` : '<span class="text-muted">Sin asignar</span>'}</td>
          <td class="font-mono" style="font-size: 0.8rem;">${formatearFecha(sol.fechaCreacion)}</td>
          <td class="text-right">
            <button class="btn btn-secondary btn-sm btn-consultar-row" data-codigo="${sol.codigo}">
              Consultar
            </button>
          </td>
        `;
        tablaBody.appendChild(tr);
      });

      // Agregar manejadores para los botones Consultar de la tabla
      document.querySelectorAll('.btn-consultar-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const codigo = e.currentTarget.getAttribute('data-codigo');
          inputBuscarCodigo.value = codigo;
          consultarSolicitud(codigo);
          document.getElementById('modulo-consulta').scrollIntoView({ behavior: 'smooth' });
        });
      });
    } catch (err) {
      console.error('Error al cargar tablero:', err);
    }
  }

  btnRecargarLista.addEventListener('click', cargarTablero);

  btnNuevoScroll.addEventListener('click', () => {
    document.getElementById('modulo-registro').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('reg-solicitante').focus();
  });

  // Carga inicial del tablero
  cargarTablero();
});
