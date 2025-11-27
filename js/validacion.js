export function validarFormulario(form) {
  // Basic presence
  if (!form.client_proy) return { aprobado:false, text:'⚠️ Falta Cliente/Proyecto.', statusText:'error' };
  if (!form.tag) return { aprobado:false, text:'⚠️ Falta Tag/Serial.', statusText:'error' };
  if (isNaN(form.set)) return { aprobado:false, text:'⚠️ Falta set de presión válvula.', statusText:'error' };
  if (form.tipo === 'Tipo de prueba') return { aprobado:false, text:'⚠️ Debes seleccionar tipo de prueba.', statusText:'error' };
  if (form.seccion === 'Sección válvula') return { aprobado:false, text:'⚠️ Debes seleccionar la sección.', statusText:'error' };
  if (form.tipo === 'Banco' && (!form.manometro || form.manometro === 'Manómetro')) return { aprobado:false, text:'⚠️ Debes seleccionar manómetro.', statusText:'error' };

  // Build pressures array respecting VST
  const presiones = [
    { nombre:'Escape 1', valor: form.p1 },
    { nombre:'Escape 2', valor: form.p2 },
    { nombre:'Escape 3', valor: form.p3 }
  ];
  if (form.tipo === 'Banco') presiones.push({ nombre:'Escape 4', valor: form.p4 });

  if (presiones.some(p => isNaN(p.valor))) {
    return { aprobado:false, text:`⚠️ Faltan presiones para ${form.tipo}`, statusText:'error' };
  }

  // No negative pressures
  if (presiones.some(p => p.valor < 0)) {
    return { aprobado:false, text:'⚠️ Las presiones no pueden ser negativas.', statusText:'error' };
  }

  // Optional: validate monotonicity (increasing)
  const valores = presiones.map(p => p.valor);
  for (let i=1;i<valores.length;i++){
    if (valores[i] < valores[i-1]) {
      return { aprobado:false, text:'⚠️ Las presiones deben estar en orden ascendente (escape 1 ≤ escape 2 ≤ ...).', statusText:'error' };
    }
  }

  // Promedio
  const promedio = valores.reduce((a,b)=>a+b,0)/valores.length;

  // Rango repetibilidad
  const deltaRep = promedio > 50 ? promedio * 0.01 : 0.5;
  const infRep = promedio - deltaRep;
  const supRep = promedio + deltaRep;

  // Rango por sección
  let deltaSeccion = 0;
  const set = form.set;
  if (form.seccion === 'Sec. I') {
    if (set <= 70) deltaSeccion = 2;
    else if (set <= 300) deltaSeccion = set * 0.03;
    else if (set <= 1000) deltaSeccion = 10;
    else deltaSeccion = set * 0.01;
  } else { // Sec. VIII
    deltaSeccion = set <= 70 ? 2 : set * 0.03;
  }

  const ajuste = set <= 500 ? 0.2 : set <= 1000 ? 1 : 1.8;
  const infSeccion = set - deltaSeccion + ajuste;
  const supSeccion = set + deltaSeccion - ajuste;

  // Errores
  const erroresRep = presiones.filter(p => p.valor < infRep || p.valor > supRep).map(p => `${p.nombre}: ${p.valor} PSI fuera del rango de repetibilidad`);
  const erroresSec = presiones.filter(p => p.valor < infSeccion || p.valor > supSeccion).map(p => `${p.nombre}: ${p.valor} PSI fuera del rango por sección`);

  // Incertidumbre según manómetro
  let incertidumbre = 0;
  if (form.manometro && form.manometro.includes('MAN-002')) incertidumbre = 0.87;
  else if (form.manometro && form.manometro.includes('MAN-003')) incertidumbre = 1.78;
  else if (form.manometro && form.manometro.includes('MAN-005')) incertidumbre = 0.18;

  // Desviación total para Banco
  let desviacionTotal = 0;
  if (form.tipo === 'Banco') {
    const n = valores.length;
    const media = promedio;
    const sumatoria = valores.reduce((acc, v) => acc + Math.pow(v - media, 2), 0);
    const desviacionEstandar = n > 1 ? Math.sqrt(sumatoria / (n - 1)) : 0;
    const errorDividido = desviacionEstandar / Math.sqrt(n);
    desviacionTotal = errorDividido + incertidumbre;
  }

  // Validación manómetro (rango no solapado)
  let manometroOK = true;
  if (form.tipo === 'Banco') {
    // Define ranges clearly (example):
    // MAN-005/MAN-006: suitable for set <= 600
    // MAN-002/MAN-003: suitable for set >= 601
    if (set <= 600) {
      manometroOK = /MAN-005|MAN-006/.test(form.manometro);
    } else {
      manometroOK = /MAN-002|MAN-003/.test(form.manometro);
    }
  }

  // Validación desviación
  let errorDesviacion = false;
  if (form.tipo === 'Banco') {
    const limite = promedio * 0.01;
    if (limite < desviacionTotal) errorDesviacion = true;
  }

  const aprobadoBase = erroresRep.length === 0 && erroresSec.length === 0;
  const aprobadoFinal = aprobadoBase && !errorDesviacion && manometroOK;

  let texto = aprobadoFinal ? '✅ Aprobado' : '❌ Repite';

  if (erroresRep.length) texto += `\n\n- Falló prueba de repetibilidad\n${erroresRep.join('\n')}`;
  if (erroresSec.length) texto += `\n\n- Falló prueba por sección\n${erroresSec.join('\n')}`;
  if (errorDesviacion) texto += `\n\n❌ Desviación de datos muy grande, prueba no pasa.`;
  if (!manometroOK) texto += `\n\n❌ Manómetro mal seleccionado, prueba no pasa.`;

  texto += `\n\nRango repetibilidad: ${infRep.toFixed(2)} - ${supRep.toFixed(2)} PSI`;
  texto += `\nRango por sección: ${infSeccion.toFixed(2)} - ${supSeccion.toFixed(2)} PSI`;

  const prueba = {
    client_proy: form.client_proy,
    tag: form.tag,
    set: form.set,
    seccion: form.seccion,
    tipo: form.tipo,
    manometro: form.manometro,
    presiones: valores,
    promedio,
    desviacionTotal,
    incertidumbre
  };

  return { aprobado: aprobadoFinal, text: texto, statusText: aprobadoFinal ? 'aprobado' : 'repite', prueba: aprobadoFinal ? prueba : null };
}
