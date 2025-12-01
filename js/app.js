import { initDB, guardarPendiente, obtenerPendientes, borrarPendiente } from './db.js';
import { validarFormulario } from './validacion.js';
import { enviarPendientes } from './envio.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initDB();

  const selPrueba = document.getElementById('sel_prueb');
  const manometro = document.getElementById('manometro');
  const p4 = document.getElementById('p4');

  function togglePresiones() {
    if (selPrueba.value === 'VST') {
      p4.style.display = 'none';
      p4.value = '';
    } else {
      p4.style.display = 'block';
    }
  }

  function toggleManometro() {
    if (selPrueba.value === 'Banco') {
      manometro.style.display = 'block';
    } else {
      manometro.style.display = 'none';
      manometro.value = 'Manómetro';
    }
  }

  selPrueba.addEventListener('change', () => { togglePresiones(); toggleManometro(); });

  togglePresiones(); toggleManometro();

  document.getElementById('btnVerificar').addEventListener('click', async () => {
    const form = {
      client_proy: document.getElementById('Client_Proy').value.trim(),
      tag: document.getElementById('Tag').value.trim(),
      set: parseFloat(document.getElementById('set').value),
      seccion: document.getElementById('sel_seccion').value,
      tipo: document.getElementById('sel_prueb').value,
      manometro: document.getElementById('manometro').value,
      p1: parseFloat(document.getElementById('p1').value),
      p2: parseFloat(document.getElementById('p2').value),
      p3: parseFloat(document.getElementById('p3').value),
      p4: parseFloat(document.getElementById('p4').value)
    };

    const result = validarFormulario(form);
    document.getElementById('resultado').innerText = result.text;
    document.getElementById('statusLine').innerText = 'Estado: ' + result.statusText;

    if (result.aprobado && result.prueba) {
      // add timestamp
      result.prueba.fecha = new Date().toLocaleString();
      // save in indexedDB pendientes (will try to send later)
      await guardarPendiente(result.prueba);
      // also keep a localStorage backup list
      const aprobadas = JSON.parse(localStorage.getItem('pruebasAprobadas') || '[]');
      aprobadas.push(result.prueba);
      localStorage.setItem('pruebasAprobadas', JSON.stringify(aprobadas));

      // clear inputs
      document.getElementById('Tag').value = '';
      ['p1','p2','p3','p4'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }
  });

  document.getElementById('btnEnviar').addEventListener('click', async () => {
    document.getElementById('statusLine').innerText = 'Estado: enviando...';
    try {
      await enviarPendientes();
      document.getElementById('statusLine').innerText = 'Estado: todos los pendientes fueron enviados';
    } catch (e) {
      document.getElementById('statusLine').innerText = 'Estado: error enviando, quedan pendientes';
      console.error(e);
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(()=>console.log('SW registrado')).catch(e=>console.error(e));
  }
});
