/* ═══════════════════════════════════════════════════════════════
   SECTION BACKGROUND — imagen de fondo por sección
   
   1. Agrega estos dos divs al final de <div id="app">, 
      justo antes del cierre </div> del app:

      <div id="section-bg"></div>
      <div id="section-bg-tint"></div>

   2. En app.js, reemplaza la función navigate() con esta versión:
═══════════════════════════════════════════════════════════════ */

/* Mapa de imágenes por sección */
const SECTION_BG = {
  dashboard: './img/5.jpg',
  usuarios:  './img/1.jpg',
  roles:     './img/2.jpg',
  productos: './img/3.png',
  auditoria: './img/4.png'
};

function navigate(page) {
  // Actualizar nav activo
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Mostrar vista
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + page);
  if (view) view.classList.add('active');

  // Actualizar topbar
  const meta = PAGE_META[page] || { title: page, sub: '' };
  document.getElementById('topbar-title').innerHTML  = meta.title;
  document.getElementById('topbar-sub').textContent  = meta.sub;

  // ── Imagen de fondo por sección ──
  const bg   = document.getElementById('section-bg');
  const tint = document.getElementById('section-bg-tint');
  const img  = SECTION_BG[page];

  if (bg && img) {
    // Fade out → cambiar imagen → fade in
    bg.classList.remove('visible');
    tint.classList.remove('visible');

    setTimeout(() => {
      bg.style.backgroundImage = `url('${img}')`;
      bg.classList.add('visible');
      tint.classList.add('visible');
    }, 200);
  }

  // Cargar datos
  const loaders = {
    dashboard: loadDashboard,
    usuarios:  loadUsuarios,
    roles:     loadRoles,
    productos: loadProductos,
    auditoria: loadAuditoria
  };
  if (loaders[page]) loaders[page]();
}