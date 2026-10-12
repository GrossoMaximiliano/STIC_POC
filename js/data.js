/* =========================================================
   Datos mock — App de Socios STIC
   Sin backend: todo el contenido es ficticio y en memoria.
   ========================================================= */

const SOCIO = {
  nombre: 'Juan Pérez',
  dni: '30.456.789',
  nro: '12.847',
  desde: '2019',
  telefono: '+54 9 11 5555-1234',
  email: 'juan.perez@mail.com',
  sede: 'Sede central',
  cuota: { estado: 'Al día', vence: '2026-10-31' }
};

/* Instalaciones reservables.
   - apertura/cierre en horas enteras, duracion en minutos.
   - ocupa: probabilidad base de que un turno aparezca ocupado (mock).
   - franjas: horarios fijos (opcional, reemplaza la grilla por hora). */
const FACILITIES = [
  {
    id: 'futbol5', nombre: 'Fútbol 5', icono: 'futbol',
    desc: 'Césped sintético · Iluminada', sede: 'Sede central',
    apertura: 8, cierre: 23, duracion: 60, ocupa: 0.42,
    info: 'Turnos de 1 hora. Pelotas y chalecos disponibles en recepción.'
  },
  {
    id: 'futbol8', nombre: 'Fútbol 8', icono: 'futbol',
    desc: 'Césped sintético · Con vestuarios', sede: 'Predio deportivo',
    apertura: 8, cierre: 22, duracion: 60, ocupa: 0.38,
    info: 'Turnos de 1 hora. Vestuarios con duchas disponibles.'
  },
  {
    id: 'padel', nombre: 'Pádel', icono: 'padel',
    desc: 'Cancha de cristal · Techada', sede: 'Sede central',
    apertura: 9, cierre: 23, duracion: 60, ocupa: 0.5,
    info: 'Turnos de 1 hora. Se requiere calzado de suela lisa (que no deje marca).'
  },
  {
    id: 'tenis', nombre: 'Tenis', icono: 'tenis',
    desc: 'Polvo de ladrillo · 2 canchas', sede: 'Predio deportivo',
    apertura: 8, cierre: 21, duracion: 60, ocupa: 0.3,
    info: 'Turnos de 1 hora. Se pueden pedir raquetas en préstamo en recepción.'
  },
  {
    id: 'pileta', nombre: 'Pileta', icono: 'pool',
    desc: 'Climatizada · 25 metros', sede: 'Sede central',
    apertura: 8, cierre: 20, duracion: 120, ocupa: 0.45,
    info: 'Franjas de 2 horas con cupo limitado. Requiere ficha médica al día.'
  },
  {
    id: 'gimnasio', nombre: 'Gimnasio', icono: 'gym',
    desc: 'Musculación + sala funcional', sede: 'Sede central',
    apertura: 7, cierre: 22, duracion: 60, ocupa: 0.55,
    info: 'Turnos de 1 hora. Ingresá mostrando tu carnet digital.'
  },
  {
    id: 'quincho', nombre: 'Quincho · Parrilla', icono: 'grill',
    desc: 'Salón y parrillas · Cap. 40', sede: 'Sede central', ocupa: 0.3,
    franjas: [
      { inicio: 9,  dur: 240, label: 'Mañana', rango: '09 a 13 h' },
      { inicio: 14, dur: 240, label: 'Tarde',   rango: '14 a 18 h' },
      { inicio: 19, dur: 240, label: 'Noche',   rango: '19 a 23 h' }
    ],
    info: 'Incluye parrillas, mesas, bancos y sonido. Se pide devolver el espacio limpio.'
  }
];

/* Beneficios para socios (comercios ficticios) */
const BENEFICIOS = [
  {
    id: 'b1', cat: 'Salud', titulo: '40% OFF en armazones', comercio: 'Óptica Vista Clara',
    destacado: true, vigencia: '2026-10-31',
    detalle: 'Descuento en todos los armazones de catálogo, incluidas marcas líderes. Sumás 20% adicional en lentes graduadas si llevás la segunda unidad.',
    condiciones: ['Presentá carnet de socio y DNI', 'No acumulable con otras promociones', 'Sujeto a stock disponible']
  },
  {
    id: 'b2', cat: 'Salud', titulo: '25% OFF en perfumería', comercio: 'Farmacia Central',
    destacado: false, vigencia: '2026-12-31',
    detalle: 'Descuento en todo el sector perfumería y cosmética de las sucursales adheridas.',
    condiciones: ['Válido en sucursales adheridas', 'No incluye medicamentos', 'Presentá tu carnet digital']
  },
  {
    id: 'b3', cat: 'Educación', titulo: '20% OFF en cursos de inglés', comercio: 'Instituto Inglés Global',
    destacado: true, vigencia: '2027-03-31',
    detalle: 'Descuento en la inscripción a los cursos grupales e individuales, modalidad presencial u online.',
    condiciones: ['Socios y grupo familiar directo', 'Inscripción en sede del instituto', 'Cupos limitados por nivel']
  },
  {
    id: 'b4', cat: 'Educación', titulo: '15% OFF en útiles y libros', comercio: 'Librería Páginas',
    destacado: false, vigencia: '2026-11-30',
    detalle: 'Descuento en libros, papelería y artículos escolares de catálogo.',
    condiciones: ['Presentá carnet de socio', 'No acumulable con liquidaciones']
  },
  {
    id: 'b5', cat: 'Turismo', titulo: '20% OFF en escapadas termales', comercio: 'Hotel Termas del Sol',
    destacado: true, vigencia: '2026-12-15',
    detalle: 'Hasta 2 noches de fin de semana con desayuno y acceso a las piscinas termales incluidos.',
    condiciones: ['Reserva previa por teléfono o web', 'Sujeto a disponibilidad de habitaciones', 'Válido fin de semana y feriados']
  },
  {
    id: 'b6', cat: 'Turismo', titulo: '6 cuotas sin interés en paquetes', comercio: 'Agencia Ruta 40',
    destacado: false, vigencia: '2027-01-31',
    detalle: 'Financiación en todos los paquetes turísticos nacionales: bus, avión y cruceros de río.',
    condiciones: ['Pagos con tarjeta de crédito adherida', 'Confirmación sujeta a disponibilidad']
  },
  {
    id: 'b7', cat: 'Comercio', titulo: '10% OFF en compras de +$30.000', comercio: 'Supermercado El Progreso',
    destacado: false, vigencia: '2026-10-15',
    detalle: 'Descuento en ticket total para compras superiores a $30.000, incluyendo alimentación y bazar.',
    condiciones: ['Presentá tu DNI al momento de pagar', 'No aplica a bebidas alcohólicas', 'Un cupón por compra']
  },
  {
    id: 'b8', cat: 'Comercio', titulo: '30% OFF en indumentaria deportiva', comercio: 'Deportes Total',
    destacado: true, vigencia: '2026-11-15',
    detalle: 'Descuento en ropa deportiva, calzado y accesorios de las principales marcas.',
    condiciones: ['Presentá carnet de socio', 'Válido en locales físicos', 'No acumulable con otras promos']
  },
  {
    id: 'b9', cat: 'Descuentos', titulo: 'Créditos con tasa preferente', comercio: 'Mutual STIC',
    destacado: false, vigencia: '2027-06-30',
    detalle: 'Préstamos personales de hasta $2.000.000 en hasta 24 cuotas, con tasa reducida exclusiva para socios al día.',
    condiciones: ['Cuota sindical al día', 'Aprobación sujeta a evaluación crediticia', 'Turno previo en la mutual']
  },
  {
    id: 'b10', cat: 'Descuentos', titulo: '15% OFF de contado en neumáticos', comercio: 'Neumáticos Centro',
    destacado: false, vigencia: '2026-12-20',
    detalle: 'Descuento en el pago de contado sobre la lista vigente, con montaje y balanceo sin cargo.',
    condiciones: ['Aplica a todas las medidas', 'Turno previo para instalación', 'Presentá carnet de socio']
  }
];

const BENEFIT_CATS = ['Todas', 'Salud', 'Educación', 'Turismo', 'Comercio', 'Descuentos'];

const CAT_ICON = {
  'Salud': 'shield',
  'Educación': 'doc',
  'Turismo': 'pin',
  'Comercio': 'percent',
  'Descuentos': 'ticket'
};

/* Reservas precargadas del socio demo.
   Las próximas aparecen en Home / Mis reservas y marcan su slot como "mío". */
function initialReservations(todayISO, plusDays) {
  return [
    { id: 'r1', facilityId: 'padel',    date: plusDays(todayISO, 1),  start: 19 * 60, dur: 60,  label: '19:00', status: 'proxima',   code: 'STIC-7K2M' },
    { id: 'r2', facilityId: 'futbol5',  date: plusDays(todayISO, 3),  start: 21 * 60, dur: 60,  label: '21:00', status: 'proxima',   code: 'STIC-9Q4T' },
    { id: 'h1', facilityId: 'gimnasio', date: plusDays(todayISO, -4), start: 8 * 60,  dur: 60,  label: '08:00', status: 'finalizada', code: 'STIC-3B8V' },
    { id: 'h2', facilityId: 'tenis',    date: plusDays(todayISO, -11), start: 17 * 60, dur: 60, label: '17:00', status: 'cancelada',  code: 'STIC-5W1C' }
  ];
}
