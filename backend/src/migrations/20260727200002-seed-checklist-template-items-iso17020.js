'use strict';

// Datos base: PG 05-F09 Lista de verificacion Organismo de Inspeccion (NCh-ISO
// 17020:2012 + directrices de acreditacion DA-D22 / DA-D23 del INN).
// 'titulo' son filas de encabezado de seccion (no evaluables); 'item' son los
// puntos evaluables del checklist. 'fuente' indica si el punto proviene
// directamente de la norma (ISO_17020) o de una directriz complementaria
// (DA_D22, DA_D23).
const ITEMS = [
  {
    "orden": 0,
    "tipo": "titulo",
    "clausula": "4",
    "texto": "4 Requisitos generales",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 1,
    "tipo": "titulo",
    "clausula": "4.1",
    "texto": "4.1 Imparcialidad e independencia",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 2,
    "tipo": "item",
    "clausula": "4.1.1",
    "texto": "4.1.1 Las actividades de inspección se deben realizar  con imparcialidad.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 3,
    "tipo": "item",
    "clausula": "4.1.2",
    "texto": "4.1.2  El organismo de inspección debe ser responsable de la imparcialidad de sus actividades de inspección y no debe permitir que presiones comerciales, financieras o de otra índole comprometan la imparcialidad.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 4,
    "tipo": "item",
    "clausula": "4.1.2",
    "texto": "Se deberá  contar  con procedimiento(s) para asegurar que la gerencia y el personal estén libres de presiones indebidas, comerciales, financieras o de otro tipo, y que personas u organizaciones externas no afecten  la imparcialidad del OI y de su personal.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 5,
    "tipo": "item",
    "clausula": "4.1.3",
    "texto": "4.1.3  El organismo de inspección debe  identificar de manera  continua los riesgos  a su imparcialidad. Esta  identificación debe incluir  los  riesgos  derivados de sus  actividades, o de sus  relaciones, o de las  relaciones de su personal. Sin  embargo, dichas relaciones no constituyen necesariamente un riesgo para la imparcialidad del organismo de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 6,
    "tipo": "item",
    "clausula": "4.1.3 a)",
    "texto": "a. La identificación de los riesgos  a la imparcialidad deberá  realizarse al menos  una vez cada 12 meses,  y cada vez que ocurran eventos  que podrían  tener relación  con la imparcialidad del OI o de su personal.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 7,
    "tipo": "item",
    "clausula": "4.1.3 b)",
    "texto": "b. Para la identificación de los riesgos  a la imparcialidad se deberá  contar  con una matriz  de riesgos,  la cual incluirá  al menos  lo siguiente: Relación/Actividad; Factor de riesgo;  Riesgo;  Valoración; Acciones para mitigar  o eliminar  el riesgo;  Medidas de control  de acciones y los responsables de ellas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 8,
    "tipo": "item",
    "clausula": "4.1.3 c)",
    "texto": "c. En la matriz  de riesgos  se deberá  incluir el análisis  de cada uno de los factores  de riesgo incluidos en la nota del numeral 4.1.3 de la norma  NCh-ISO  17020:2012. Estos son: propiedad, gobernabilidad, dirección, personal, recursos compartidos, finanzas, contratos, marketing, pago de una comisión por venta u otro incentivo para la remisión de nuevos  clientes.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 9,
    "tipo": "item",
    "clausula": "4.1.3 d)",
    "texto": "d. Se deberá  mantener en la matriz  de riesgos  todos los riesgos  detectados, independientemente si algunos  de ellos han sido minimizados o eliminados.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 10,
    "tipo": "item",
    "clausula": "4.1.4",
    "texto": "4.1.4 Si se identifica un riesgo para la imparcialidad, el organismo de inspección debe ser capaz de demostrar cómo elimina  o minimiza dicho riesgo.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 11,
    "tipo": "item",
    "clausula": "4.1.4",
    "texto": "4.1.4 Se deberá  contar  con evidencia objetiva  respecto de la mitigación o eliminación de los riesgos  detectados en la matriz  de riesgos",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 12,
    "tipo": "item",
    "clausula": "4.1.5",
    "texto": "4.1.5 El organismo de inspección debe tener una alta dirección comprometida con la imparcialidad.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 13,
    "tipo": "item",
    "clausula": "4.1.5 a)",
    "texto": "a. El compromiso con la imparcialidad deberá  demostrarse al menos  con una declaración o política  firmada  por la alta gerencia. Este compromiso debe incluir al menos  el manejo  de conflictos de interés  y asegurar la objetividad de sus actividades de inspección. Este compromiso debe estar públicamente\ndisponible",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 14,
    "tipo": "item",
    "clausula": "4.1.5 b)",
    "texto": "b. Acciones emanadas de la alta dirección no deben contradecir este compromiso.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 15,
    "tipo": "item",
    "clausula": "4.1.6",
    "texto": "4.1.6 El organismo de inspección debe ser independiente en la medida  en que lo requieran las condiciones bajo las cuales presta sus servicios. Dependiendo de estas condiciones, debe cumplir  los requisitos mínimos estipulados en el Anexo A, como se describe a continuación:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 16,
    "tipo": "item",
    "clausula": "4.1.6 a)",
    "texto": "a) Un organismo de inspección que realiza  inspecciones de tercera  parte debe cumplir  los requisitos del tipo A",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 17,
    "tipo": "item",
    "clausula": "4.1.6 a)",
    "texto": "Un OI tipo A, debe asegurar que su personal cumple  con el capítulo  A.1 de la norma  NCh-ISO  17020:2012, dentro  y fuera de su jornada  laboral.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 18,
    "tipo": "item",
    "clausula": "4.1.6 b)",
    "texto": "b) Un organismo de inspección que realiza  inspecciones de primera  parte, de segunda parte, o ambas,  y que constituye una parte separada e identificable de una organización que participa en el diseño,  la fabricación, el suministro, la instalación, el uso o el mantenimiento de los ítems que inspecciona, y que presta servicios de inspección únicamente a su organización matriz (organismo de inspección interno)  debe cumplir  los requisitos del tipo B",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 19,
    "tipo": "item",
    "clausula": "4.1.6 c)",
    "texto": "c) Un organismo de inspección que realiza  inspecciones de primera  parte, de segunda parte, o ambas,  y que constituye una parte identificable pero no necesariamente separada de una organización que participa en el diseño,  la fabricación, el suministro, la instalación, el uso o el mantenimiento de los ítems que inspecciona, y que presta servicios de inspección a su organización matriz  o a otras partes,  o a ambas,  debe cumplir  los requisitos del tipo C",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 20,
    "tipo": "titulo",
    "clausula": "4.2",
    "texto": "4.2 Confidencialidad",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 21,
    "tipo": "item",
    "clausula": "4.2.1",
    "texto": "4.2.1 El organismo de inspección debe ser responsable, en el marco de compromisos legalmente ejecutables, de la gestión  de toda la información obtenida o generada durante  la realización de las actividades de inspección. El organismo de inspección debe informar al cliente,  con antelación, qué información tiene intención de hacer pública.  A excepción de la información que el cliente pone a disposición del público,  o cuando  haya sido acordado entre el organismo de inspección y el cliente,  toda otra información debe ser considerada información confidencial.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 22,
    "tipo": "item",
    "clausula": "4.2.2",
    "texto": "4.2.2 Cuando  el organismo de inspección deba por ley divulgar  información confidencial o cuando  este autorizadopor compromisos contractuales, el cliente o la persona  correspondiente debe ser notificado acerca  de la información proporcionada, salvo que esté prohibido por ley.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 23,
    "tipo": "item",
    "clausula": "4.2.3",
    "texto": "4.2.3 La información sobre el cliente obtenida de fuentes distintas al cliente (por ejemplo, una persona que realiza una queja, de autoridades reglamentarias) debe tratarse como información confidencial.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 24,
    "tipo": "titulo",
    "clausula": "5",
    "texto": "5. Requisitos relativos a la estructura",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 25,
    "tipo": "titulo",
    "clausula": "5.1",
    "texto": "5.1 Requisitos administrativos",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 26,
    "tipo": "item",
    "clausula": "5.1.1",
    "texto": "5.1.1 El organismo de inspección debe ser una entidad legal, o una parte definida de una entidad legal, de manera que pueda ser considerado legalmente responsable de todas sus actividades de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 27,
    "tipo": "item",
    "clausula": "5.1.1",
    "texto": "El OI o la organización de la cual forma parte, debe ser una empresa legalmente constituida y cumplir con lo exigido en el Anexo\n1 de la directriz DA-D06.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 28,
    "tipo": "item",
    "clausula": "5.1.2",
    "texto": "5.1.2 Un organismo de inspección que es parte de una entidad legal que realiza activiades diferente de las inspecciones debe ser identificable dentro de dicha entidad.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 29,
    "tipo": "item",
    "clausula": "5.1.3",
    "texto": "5.1.3 El organismo de inspección debe disponer de documentación que describa las actividades para las cuales es competente.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 30,
    "tipo": "item",
    "clausula": "5.1.3",
    "texto": "El OI debería describir sus actividades definiendo el campo general y el rango de inspección (por ejemplo, categorías/subcategorías de productos, procesos, servicios o instalaciones) y la etapa de inspección, (ver nota de la cláusula 1 de la norma)  y, cuando  sea aplicable, los reglamentos, normas  o especificaciones que contienen los requisitos contra  los cuales se realizará la inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 31,
    "tipo": "item",
    "clausula": "5.1.4",
    "texto": "5.1.4 El organismo de inspección debe tener disposiciones adecuadas (por ejemplo, un seguro o fondos) para cubrir las responsabilidades derivadas de sus operaciones.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 32,
    "tipo": "item",
    "clausula": "5.1.4 a)",
    "texto": "a. El OI debe tener documentado su análisis de riesgos respecto de sus responsabilidades legales derivadas de sus operaciones, a fin de contratar un seguro o definir el monto de los fondos, según corresponda.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 33,
    "tipo": "item",
    "clausula": "5.1.4 b)",
    "texto": "b. El análisis  de riesgo deberá  basarse  en una matriz  de riesgos,  que incluya  al menos  lo siguiente: errores/omisiones; daños asociados; frecuencia del error/omisión; monto  asociado al daño; determinación de los montos  totales.  La matriz  de riesgos deberá  actualizarse cada vez que se genere  un evento  que demuestre negligencia técnica  por parte del OI, o al menos  una vez cada 12\nmeses.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 34,
    "tipo": "item",
    "clausula": "5.1.4 c)",
    "texto": "c. En caso que un OI cuente con un seguro  que cubra eventuales negligencias técnicas, es decir, que cometa  errores  u omisiones en sus operaciones, este seguro  debe ser emitido  por una compañía de seguros  autorizada y reconocida por la Comisión para el Mercado Financiero (CMF).En aquellos casos que el OI sea parte de una organización mayor,  y ésta cuente con un seguro internacional que incluya  responsabilidades legales  en relación  con negligencias técnicas  asociadas a sus\noperaciones, se deberá  demostrar que dicho seguro  es aplicable en Chile, a través de una declaración de la CMF y/o por una declaración de una compañía de seguros  chilena  autorizada por la CMF.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 35,
    "tipo": "item",
    "clausula": "5.1.4 d)",
    "texto": "d. Si el OI decide contar  con fondos  que cubran  eventuales negligencias técnicas, deberá  establecer el tiempo  necesario para reunir dichos  fondos  incluyendo los montos  mensuales definidos para este efecto,  salvo que el OI cuente ya con dichos  fondos. El nivel de fondos  debería  ser acorde con el nivel y la naturaleza de las responsabilidades que puedan  derivarse de las operaciones del OI. El tiempo  necesario para reunir los fondos  no deberá  exceder  un ciclo de acreditación, entendiendo que dicho tiempo  es un riesgo que asume el propio  OI.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 36,
    "tipo": "item",
    "clausula": "5.1.4 e)",
    "texto": "e. El INN no asumirá  ninguna  responsabilidad subsidiaria ni de otra índole relacionada con las responsabilidades legales  que cada OI debe asumir.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 37,
    "tipo": "item",
    "clausula": "5.1.4 f)",
    "texto": "f. No se aceptarán para dar cumplimiento a los fondos  necesarios para cubrir las negligencias técnicas, los siguientes casos:\nf.1. Fondos  rescatables a través de cupos de tarjetas  de crédito  y/o cupos de líneas de crédito.\nf.2. Establecer un ciclo de aprovisionamiento de dichos  fondos  sin aportar  mensualmente por un periodo  de seis meses consecutivos.\nf.3. Boletas  de garantía  que no incluyan  expresamente, o bien no referencien, el pago de multas  producto de negligencias técnicas.\nf.4. No se cuente con al menos  el 50% de los fondos  totales,  dentro  del 50% del tiempo  establecido para reunir dichos  fondos.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 38,
    "tipo": "item",
    "clausula": "5.1.4 g)",
    "texto": "g. Los montos  asociados a los fondos  deberán estar identificados como tales en la contabilidad de la organización.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 39,
    "tipo": "item",
    "clausula": "5.1.4 h)",
    "texto": "h. Independiente de la disposición implementada (seguro  o fondos),  esta disposición deberá  estar incorporada en los documentos contractuales establecidos entre el OI y el cliente.",
    "fuente": "DA_D23",
    "vigente": true
  },
  {
    "orden": 40,
    "tipo": "item",
    "clausula": "5.1.5",
    "texto": "5.1.5 El organismo de inspección debe disponer de documentación que describa las condiciones contractuales bajo las que presta la inspección, salvo cuando  preste servicios de inspección a la entidad  legal de la que forma parte.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 41,
    "tipo": "titulo",
    "clausula": "5.2",
    "texto": "5.2 Organización y gestión",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 42,
    "tipo": "item",
    "clausula": "5.2.1",
    "texto": "5.2.1 El organismo de inspección debe estar estructurado y gestionado de manera  que salvaguarde su imparcialidad.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 43,
    "tipo": "item",
    "clausula": "5.2.2",
    "texto": "5.2.2 El organismo de inspección debe estar organizado y  gestionado de manera  que le permita  mantener la capacidad de realizar  sus actividades de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 44,
    "tipo": "item",
    "clausula": "5.2.2 a)",
    "texto": "a. El tamaño,  la estructura, la composición y la gestión  de un OI, tomados en conjunto, deben ser adecuados para el desempeño competente de las actividades dentro  del alcance  para el que está acreditado el OI.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 45,
    "tipo": "item",
    "clausula": "5.2.2 b)",
    "texto": "b. \"Mantener la capacidad de realizar  las actividades de inspección\" implica  que el OI debe tomar medidas para mantenerse adecuadamente informado sobre desarrollos técnicos  y/o legislativos aplicables concernientes a sus actividades.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 46,
    "tipo": "item",
    "clausula": "5.2.2 c)",
    "texto": "c. Los OI deben mantener su capacidad y competencia para llevar a cabo las actividades de inspección realizadas con poca frecuencia (normalmente con intervalos mayores a un año). Un OI puede demostrar su capacidad y competencia para las actividades de inspección realizadas con poca frecuencia a través de inspecciones simuladas’ y/o por medio de las actividades de inspección realizadas en productos similares.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 47,
    "tipo": "item",
    "clausula": "5.2.3",
    "texto": "5.2.3 El organismo de inspección debe definir  y documentar las responsabilidades y la estructura de la organización encargada de la emisión  de informes.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 48,
    "tipo": "item",
    "clausula": "5.2.3 a)",
    "texto": "a. Se debe considerar como emisión  de informes las etapas  de: traspaso de datos y resultados de la inspección; revisión  de dicho traspaso; aprobación y/o firma; despacho.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 49,
    "tipo": "item",
    "clausula": "5.2.3 b)",
    "texto": "b. El OI debe mantener un organigrama actualizado o documentos que indiquen claramente las funciones y líneas de autoridad para el personal dentro  del OI. Los cargos  del(los)  gerente(s) técnico(s) y del miembro de la alta dirección referenciado en la cláusula  8.2.3 deberían estar claramente indicados en el organigrama o en los documentos.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 50,
    "tipo": "item",
    "clausula": "5.2.4",
    "texto": "5.2.4 Cuando  el organismo de inspección forma parte de una entidad  legal que realiza  otras actividades, se debe definir  la relación  entre estas otras actividades y las actividades de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 51,
    "tipo": "item",
    "clausula": "5.2.4",
    "texto": "Puede ser relevante proporcionar información respecto al personal que lleva a cabo tareas tanto para el OI como para otras unidades y departamentos, para tener en cuenta  la implicación y la influencia que puedan  tener en las actividades de inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 52,
    "tipo": "item",
    "clausula": "5.2.5",
    "texto": "5.2.5 El organismo de inspección debe disponer de uno o más gerentes técnicos  que asumen  toda la responsabilidad de que se lleven a cabo las actividades de inspección. Las personas que desempeñan esta función  deben ser técnicamente competentes y con experiencia en el funcionamiento del OI. En el caso de que el organismo de inspección tenga más de un gerente  técnico,  se deben definir  y documentar las responsabilidades específicas de cada gerente.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 53,
    "tipo": "item",
    "clausula": "5.2.5 a)",
    "texto": "a. La responsabilidad que asume el(los) gerente(s) técnico(s) incluye  todos los requisitos de la norma  NCh-ISO  17020:2012, es decir, no incluye sólo la responsabilidad sobre los “Requisitos de los procesos”, sino que también  aquellas  relacionadas con: “Requisitos generales”, “Requisitos relativos  a la estructura”, “Requisitos relativos  a los recursos”, “Requisitos relativos  al sistema  de gestión”.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 54,
    "tipo": "item",
    "clausula": "5.2.5 b)",
    "texto": "b. El contrato del(los) gerente(s) técnico(s) deberá ser de jornada completa en\nel OI. En caso que algún gerente técnico tenga otro(s) empleador(es) o participación en otra empresa, se deberá demostrar que todos los empleadores y empresas, incluyendo el OI, están en conocimiento de esta situación.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 55,
    "tipo": "item",
    "clausula": "5.2.5 c)",
    "texto": "c. Con el fin de asegurar que las actividades de inspección se llevan a cabo de acuerdo con NCh-ISO 17020:2012, el(los) gerente(s) técnico(s) y cualquier subrogante(s), deberán tener la competencia técnica necesaria para comprender todas los temas significativos involucrados en el desempeño de las\nactividades de inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 56,
    "tipo": "item",
    "clausula": "5.2.6",
    "texto": "5.2.6 El organismo de inspección debe tener una o más personas designadas para asumir las funciones en ausencia de cualquier gerente técnico responsable de las actividades de inspección en curso.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 57,
    "tipo": "item",
    "clausula": "5.2.6 a)",
    "texto": "a. En aquellos casos en los cuales el gerente técnico es el único inspector con el que cuenta el OI, se podrá definir que no existe subrogancia para el gerente técnico y se deberán establecer y documentar qué actividades se suspenden en ausencia del gerente técnico.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 58,
    "tipo": "item",
    "clausula": "5.2.6 b)",
    "texto": "b. El(los) subrogante(s) del(los) gerente(s) técnico(s) deberá(n) cumplir con la competencia requerida del cargo a subrogar y además con lo establecido en el numeral 5.2.5 anterior.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 59,
    "tipo": "item",
    "clausula": "5.2.6 c)",
    "texto": "c. En una organización donde la ausencia de una persona clave causa la interrupción del trabajo, el requisito de tener subrogantes no es aplicable. Se deberá establecer y documentar qué actividades se suspenden en ausencia de la persona clave.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 60,
    "tipo": "item",
    "clausula": "5.2.7",
    "texto": "5.2.7 El organismo de inspección debe disponer de una descripción de los puestos de trabajo u otra documentación para cada categoría de puesto de trabajo dentro de la organización que participa en las actividades de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 61,
    "tipo": "item",
    "clausula": "5.2.7 a)",
    "texto": "a. Las descripciones de cargo, para cada cargo del OI, deberán incluir al menos lo siguiente: nombre del cargo, dependencia, subordinados, subrogancia, perfil del cargo, funciones y responsabilidades. Dentro del perfil del cargo, se debe incluir como mínimo: educación, formación, conocimiento técnico habilidades y experiencia.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 62,
    "tipo": "item",
    "clausula": "5.2.7 b)",
    "texto": "b. Las categorías de cargos involucrados en las actividades de inspección son inspectores y otros cargos que podrían tener un efecto  en la gestión,  el desempeño, el registro  o el reporte  de las inspecciones.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 63,
    "tipo": "titulo",
    "clausula": "6",
    "texto": "6. Requisitos relativos a los recursos",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 64,
    "tipo": "titulo",
    "clausula": "6.1",
    "texto": "6.1 Personal",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 65,
    "tipo": "item",
    "clausula": "6.1.1",
    "texto": "6.1.1 El organismo de inspección debe definir  y documentar los requisitos de competencia de todo el personal que participa en las actividades de inspección, incluyendo los requisitos relativos a la educación, formación, conocimiento técnico,  habilidades y experiencia.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 66,
    "tipo": "item",
    "clausula": "6.1.1 a)",
    "texto": "a. Para efectos  de interpretación de los requisitos de competencia, se considerará lo siguiente:\na.1. Requisitos relativos a la educación: Corresponde al nivel académico requerido para el cargo, ya sea, enseñanza básica, media,  técnica,  técnica  superior, universitaria, postítulos y/o postgrados.\na.2. Requisitos relativos a la formación: corresponde al nivel de conocimiento requerido para el cargo, ya sea capacitaciones internas  o capacitaciones externas.\na.3. Requisitos relativos al conocimiento técnico:  Corresponde al nivel de conocimiento necesario para el cargo, adquirido en el tiempo,  a través de experiencia laboral.\na.4. Requisitos relativos a las habilidades: Corresponde a las habilidades requeridas para el cargo, ya sea habilidades motrices, habilidades físicas, habilidades de relaciones interpersonales, habilidades de trabajo  en equipo,  entre otras.\na.5. Requisitos relativos a la experiencia: Corresponde a los años de experiencia laboral  requeridos para el cargo en funciones similares al cargo a desempeñar.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 67,
    "tipo": "item",
    "clausula": "6.1.1 b)",
    "texto": "b. En caso que el cargo no requiera de algunos  de los requisitos indicados en el punto anterior, se deberá  establecer documentalmente que no lo requiere.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 68,
    "tipo": "item",
    "clausula": "6.1.1 c)",
    "texto": "c. Cuando  sea apropiado, los OI deben definir  y documentar los requisitos de competencia para cada actividad de inspección, como se describe en 5.1.3.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 69,
    "tipo": "item",
    "clausula": "6.1.1 d)",
    "texto": "d. Para \"personal involucrado en las actividades de inspección\", ver 5.2.7.b.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 70,
    "tipo": "item",
    "clausula": "6.1.1 e)",
    "texto": "e. Los requisitos de competencia deberían incluir el conocimiento del sistema  de gestión  del OI y la capacidad para implementar procedimientos aplicables tanto administrativos como técnicos  para las actividades realizadas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 71,
    "tipo": "item",
    "clausula": "6.1.1 f)",
    "texto": "f. Cuando  se requiere el juicio profesional para determinar la conformidad, ésta debe ser considerada cuando  se defina los requisitos de competencia.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 72,
    "tipo": "item",
    "clausula": "6.1.1 g)",
    "texto": "g. Cuando  algunos  aspectos de los requisitos de competencia estén definidos por los reguladores, o los propietarios de esquemas, o especificados por los clientes,  el organismo de inspección debe incorporar o hacer referencia a estos requisitos en sus definiciones generales de competencia. El organismo de inspección sigue siendo  responsable de la adecuación de las definiciones de competencia y su cumplimiento con los requisitos de NCh-ISO  17020:2012.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 73,
    "tipo": "item",
    "clausula": "6.1.2",
    "texto": "6.1.2 El organismo de inspección debe emplear  o contratar un número  suficiente de personas que posean  las competencias requeridas, incluyendo, cuando  sea necesario, la capacidad de emitir juicios profesionales, para realizar  el tipo, la gama y el volumen de sus actividades de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 74,
    "tipo": "item",
    "clausula": "6.1.2",
    "texto": "Todos los requisitos de NCh-ISO  17020:2012 aplican  por igual a empleados y a personas contratadas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 75,
    "tipo": "item",
    "clausula": "6.1.3",
    "texto": "6.1.3 El personal responsable de la inspección debe tener las calificaciones una formación y experiencia apropiada y un conocimiento satisfactorio de los requisitos de las inspecciones a realizar.  También debe tener concocimiento adecuado de:\n-la tecnología empleada para fabricar  los productos inspeccionados, la operación de los procesos y la prestación de los servicios;\n-la manera  en la que se utilizan  los productos, se operan  los procesos y se prestan  los servicios;\n-los defectos que puedan  ocurrir  durante  el uso del producto, los fallos en la operación de los procesos y las deficientes en la prestación de los servicios.\nEl personal debe comprender la importacia de las desviaciones encontradas con respecto al uso normal  de los productos, la operación de los procesos y la prestación de los servicios.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 76,
    "tipo": "item",
    "clausula": "6.1.4",
    "texto": "6.1.4 El organismo de inspección debe indicar  claramente a cada persona  sus obligaciones, responsabilidades y autoridad.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 77,
    "tipo": "item",
    "clausula": "6.1.5",
    "texto": "6.1.5 El organismo de inspección debe de disponder procedimientos documentados para seleccionar, formar,  autorizar formalmente y realizar  el seguimiento de los inspectores y además  personal que participa en las actividades de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 78,
    "tipo": "item",
    "clausula": "6.1.5 a)",
    "texto": "a. Los procedimientos para realizar  el seguimiento a los inspectores y demás  personal que participa en la inspección, se deben entender como procedimientos de monitoreo del personal.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 79,
    "tipo": "item",
    "clausula": "6.1.5 b)",
    "texto": "b. El monitoreo del personal incluye:  la programación, la evaluación del conocimiento, experiencia y habilidades del personal, y el registro  de dicha evaluación. En caso que sea necesaria una capacitación o reentrenamiento del personal, se deberá monitorear nuevamente, según corresponda.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 80,
    "tipo": "item",
    "clausula": "6.1.5 c)",
    "texto": "c. El procedimiento para autorizar formalmente a los inspectores debería  especificar que los detalles  relevantes sean documentados, por ejemplo  la autorización de la actividad de inspección, el comienzo de la autorización, la identidad de la persona  que realizó  la autorización y, cuando  corresponda, la fecha de finalización de la autorización.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 81,
    "tipo": "item",
    "clausula": "6.1.6",
    "texto": "6.1.6 Los procedimientos documentados para la formación  deben contemplar las siguientes etapas a)período de inducción,\nb)período de trabajo  bajo la tutela de inspectores experimentados\nc)formación continua para mantenerse al día con la tecnología y los métodos de inspección en desarrollo.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 82,
    "tipo": "item",
    "clausula": "6.1.6",
    "texto": "El “período  de trabajo  bajo tutela”  mencionado en el punto b) de la norma NCh  ISO 17020:2012, normalmente incluye\nactividades donde se realizan  las inspecciones.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 83,
    "tipo": "item",
    "clausula": "6.1.7",
    "texto": "6.1.7 La formación requerida debe depender de la capacidad, calificaciones y experiencia de cada inspector y demás  personal involucrado en las actividades de inspección, así como de los resultados de la supervisión (véase 6.1.8).",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 84,
    "tipo": "item",
    "clausula": "6.1.7",
    "texto": "La identificación de las necesidades de capacitación para cada persona  debería  tener lugar a intervalos regulares. El intervalo debe ser seleccionado para asegurar el cumplimiento de la cláusula  6.1.6 punto c) de la norma  NCh-ISO  17020:2012. Los resultados de la revisión de la capacitación, por ejemplo, los\nplanes de capacitación complementaria o una declaración que no se requiere capacitación, deberían ser documentadas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 85,
    "tipo": "item",
    "clausula": "6.1.8",
    "texto": "6.1.8 El personal familiarizado con los métodos y procedimientos de inspección debe supervisar a todos los inspectores y demás personal que participa en las actividades de inspección para obtener un desempeño satisfactorio. Los resultados de la supervisión se deben utilizar para identificar las necesidades de formación (véase 6.1.7).",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 86,
    "tipo": "item",
    "clausula": "6.1.8 a)",
    "texto": "a. El principal objetivo del requisito de monitoreo es proporcionar al OI una herramienta para asegurar la consistencia y la fiabilidad de los resultados de inspección, incluyendo cualquier juicio profesional frente a criterios generales. El monitoreo puede resultar en la identificación de necesidades de capacitación individual o las necesidades de revisión del sistema de gestión del OI.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 87,
    "tipo": "item",
    "clausula": "6.1.8 b)",
    "texto": "b. Para “otro personal involucrado en actividades de inspección”, ver 5.2.7.b.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 88,
    "tipo": "item",
    "clausula": "6.1.9",
    "texto": "6.1.9 Cada inspector debe ser observado in situ, a menos que se disponga de suficiente evidencia de que el inspector continúa desempeñando sus tareas de manera competente.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 89,
    "tipo": "item",
    "clausula": "6.1.9 a)",
    "texto": "a. Para la observación in situ de los inspectores, ésta deberá realizarse al menos una vez dentro del ciclo de acreditación, para cada uno de los inspectores calificados por el OI. En la mitad del ciclo de acreditación, al menos el 50% de los inspectores deberán haber sido observados in situ.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 90,
    "tipo": "item",
    "clausula": "6.1.9 b)",
    "texto": "b. Como evidencia de las observaciones in situ, se deberá  contar  con registros que incluyan  al menos,  el detalle de la inspección observada, el conocimiento del procedimiento de inspección, el uso de los equipos, el juicio técnico, la coordinación de la inspección, según corresponda.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 91,
    "tipo": "item",
    "clausula": "6.1.9 c)",
    "texto": "c. Para ser considerada suficiente, la evidencia que el inspector continúa trabajando de manera  competente deberá  ser sustentada por una combinación de información tal como:\n- desempeño satisfactorio de los exámenes y determinaciones,\n- resultado positivo  de revisión  de informes, entrevistas, inspecciones simuladas y otras evaluaciones de desempeño (véase la nota de la cláusula  6.1.8 de la norma  NCh-ISO  17020:2012),\n- resultado positivo  de evaluaciones separadas para confirmar el resultado de las inspecciones (esto puede ser posible  y apropiado en el caso de, por ejemplo, la inspección de la documentación de construcción),\n- resultado positivo  de la tutoría  y la capacitación,\n- ausencia de apelaciones o quejas  legítimas, y\n- resultados satisfactorios de testificación por un organismo competente, por ejemplo, un organismo de certificación de personas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 92,
    "tipo": "item",
    "clausula": "6.1.9 d)",
    "texto": "d. Un programa efectivo  para la observación in situ de inspectores puede contribuir a cumplir  con los requisitos de las cláusulas\n5.2.2 y 6.1.3 de la norma  NCh-ISO  17020:2012. El programa debería  ser diseñado considerando:\n- los riesgos  y complejidades de las inspecciones,\n- resultados de las actividades de monitoreos previos,  y\n- desarrollos técnicos  de procedimiento o legislativos relevantes a las inspecciones.\nSi los niveles  de riesgos  o complejidades, o los resultados de las observaciones previas  así lo indican,  o si han ocurrido cambios técnicos, de procedimientos o legislativos, entonces una frecuencia mayor  debería  ser considerada. Dependiendo de los campos,  los tipos y rangos  de inspección cubiertos por las\nautorizaciones del inspector, puede ser más de una observación por cada inspector necesaria para cubrir adecuadamente todo el rango de competencias requeridas.\nTambién, podrían  ser necesarias observaciones in-situ más frecuentes si hay una falta de evidencia de desempeño satisfactorio continuo.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 93,
    "tipo": "item",
    "clausula": "6.1.9 e)",
    "texto": "e. Este requisito se aplica incluso  en el caso que el OI tenga sólo una persona  técnicamente competente. En estos casos el OI debe tener acuerdos vigentes  para observaciones externas in-situ,  a menos  que esté disponible, otra evidencia suficiente que soporte  que el inspector está continuamente\ndesempeñándose de manera  competente (véase 6.1.9.c).",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 94,
    "tipo": "item",
    "clausula": "6.1.10",
    "texto": "6.1.10 El organismo de inspección debe mantener registros de la supervisión, la educación, la formación, el conocimiento técnico,  las habilidades,  la experiencia y autorización de cada miembro del personal involucrado en las actividades de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 95,
    "tipo": "item",
    "clausula": "6.1.10",
    "texto": "a. Los registros de capacitación (formación) deben incluir al menos,  el temario, el relator,  las fechas  y la duración de la capacitación.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 96,
    "tipo": "item",
    "clausula": "6.1.10",
    "texto": "b. Los registros de autorización deberían especificar la base sobre la cual la autorización fue otorgada (por ejemplo, la observación in situ de las inspecciones).",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 97,
    "tipo": "item",
    "clausula": "6.1.11",
    "texto": "6.1.11 El personal que participa en las actividades de inspección no debe ser remunerado de una manera  que influya  en los resultados de las inspecciones.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 98,
    "tipo": "item",
    "clausula": "6.1.11",
    "texto": "a. La remuneración del personal que participa en las actividades de inspección, no debe depender del número  de inspecciones realizadas, ni del resultado de éstas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 99,
    "tipo": "item",
    "clausula": "6.1.11",
    "texto": "b. Los métodos de remuneración que ofrecen  incentivos para llevar a cabo inspecciones de forma rápida  tienen  el potencial de afectar  negativamente a la calidad  y el resultado de la inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 100,
    "tipo": "item",
    "clausula": "6.1.12",
    "texto": "6.1.12 Todo el personal del organismo de inspección, tanto interno  como externo, que pueda influir en las actividades de inspección debe actuar  de manera  imparcial.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 101,
    "tipo": "item",
    "clausula": "6.1.12",
    "texto": "a. Se deberá  evidenciar el compromiso de imparcialidad de todo el personal del OI, tanto interno  como externo.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 102,
    "tipo": "item",
    "clausula": "6.1.12",
    "texto": "b. Las políticas  y procedimientos deberían ayudar  al personal del OI en la identificación y hacer frente a las amenazas comerciales o financieras o de otro tipo, o incentivos, que podrían  afectar  su imparcialidad, si se originan  dentro  o fuera del OI. Tales procedimientos deben abordar  cómo cualquier conflicto de intereses es identificado por el personal del OI, son informados y registrados. Notar, sin embargo, que mientras las expectativas para la integridad del inspector pueden  ser comunicadas mediante políticas  y procedimientos, la existencia de tales documentos no asegura  la presencia de la integridad y la imparcialidad requerida por esta cláusula.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 103,
    "tipo": "item",
    "clausula": "6.1.13",
    "texto": "6.1.13 Todo el personal del organismo de inspección, incluidos los subcontratistas, el personal de los organismos externos y las personas que actúan  en nombre  del organismo de inspección, deben mantener la confidencialidad de toda la información obtenida o generada durante  la realización de las actividades de inspección, excepto  cuando  sea requerido por ley disponga otra cosa.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 104,
    "tipo": "item",
    "clausula": "6.1.13",
    "texto": "Se deberá  evidenciar el compromiso de mantener la confidencialidad por parte de todo el personal del OI, de los subcontratistas, del personal de los organismos externos y las personas que actúan  en nombre  del OI.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 105,
    "tipo": "titulo",
    "clausula": "6.2",
    "texto": "6.2 Instalaciones y equipos",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 106,
    "tipo": "item",
    "clausula": "6.2.1",
    "texto": "6.2.1 El organismo de inspección debe disponer de instalaciones y equipos  adecuados y suficientes para permitir  que se realicen  todas las actividades asociadas con la inspección de manera  competente y segura.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 107,
    "tipo": "item",
    "clausula": "6.2.1",
    "texto": "El equipamiento necesario para llevar a cabo la inspección de una manera  segura  puede incluir,  por ejemplo, equipo  de protección personal y andamios.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 108,
    "tipo": "item",
    "clausula": "6.2.2",
    "texto": "6.2.2 El organismo de inspección debe disponer de reglas para el acceso  y la utilización de instalaciones y equipos  especificados que se utilizan  para realizar  las inspecciones.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 109,
    "tipo": "item",
    "clausula": "6.2.3",
    "texto": "6.2.3 El organismo de inspección debe asegurarse de la adecuación continua de las instalaciones y los equipos  mencionados en el apartado 6.2.1 para su uso previsto.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 110,
    "tipo": "item",
    "clausula": "6.2.3",
    "texto": "a. Si se requieren condiciones ambientales controladas, por ejemplo, para la correcta realización de la inspección, el OI debe monitorearlas y registrar los resultados. Si las condiciones estuvieran fuera de los límites aceptables para la inspección a realizar, el OI debe registrar que acción fue tomada. Ver también cláusula 8.7.4 de la norma NCh-ISO 17020:2012.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 111,
    "tipo": "item",
    "clausula": "6.2.3",
    "texto": "b. Se puede establecer la adecuación continua a través de inspecciones visuales, verificaciones funcionales y/o re-calibraciones. Este requisito es particularmente relevante para los equipos que no están bajo el control directo del OI.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 112,
    "tipo": "item",
    "clausula": "6.2.4",
    "texto": "6.2.4 Se deben definir todos los equipos que tienen una influencia significativa en los resultados de la inspección y, cuando corresponda, se les debe proporcionar una identificación única.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 113,
    "tipo": "item",
    "clausula": "6.2.4 a)",
    "texto": "a. Cuando corresponda, la identificación única de un equipo deberá evidenciarse en el equipo mismo, y cuando no sea posible, al menos en su envase o caja contenedora.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 114,
    "tipo": "item",
    "clausula": "6.2.4 b)",
    "texto": "b. Para permitir el seguimiento cuando los ítems son reemplazados, la identificación única de un ítem del equipo puede ser apropiada incluso cuando sólo hay un ítem disponible.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 115,
    "tipo": "item",
    "clausula": "6.2.4 c)",
    "texto": "c. Cuando se requieran condiciones ambientales controladas, el equipo utilizado para monitorear tales condiciones debería ser considerado como el equipo que influye significativamente en el resultado de las inspecciones.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 116,
    "tipo": "item",
    "clausula": "6.2.4 d)",
    "texto": "d. Los OI deberían documentar y conservar la justificación de las decisiones sobre la importancia de la influencia del equipo en los resultados de la inspección, ya que estas decisiones son fundamentales para las decisiones posteriores sobre calibración y trazabilidad. La justificación deberá ser en términos técnicos y no comerciales ni relacionados a costos de calibración.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 117,
    "tipo": "item",
    "clausula": "6.2.5",
    "texto": "6.2.5 Todos los equipos (véase el apartado 6.2.4) se deben mantener de acuerdo con procedimientos e instrucciones documentados.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 118,
    "tipo": "item",
    "clausula": "6.2.6",
    "texto": "6.2.6 Cuando corresponda, los equipos de medición que tienen una influencia significativa en los resultados de la inspección deben ser calibrados antes de su puesta en servicio, y a partir de entonces, según un programa establecido.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 119,
    "tipo": "item",
    "clausula": "6.2.6 a)",
    "texto": "a. Cuando corresponda, la calibración de los equipos deberá ser realizada por laboratorios de calibración acreditados por el\nINN o por otro organismo de acreditación signatario de MRA de ILAC.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 120,
    "tipo": "item",
    "clausula": "6.2.6 b)",
    "texto": "b. La justificación para no calibrar  el equipo  que tiene una influencia significativa en el resultado de la inspección (ver cláusula\n6.2.4 de la norma  NCh-ISO  17020:2012), debe ser registrada.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 121,
    "tipo": "item",
    "clausula": "6.2.6 c)",
    "texto": "c. Las directrices sobre cómo determinar los intervalos de calibración se pueden  encontrar en ILAC G24.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 122,
    "tipo": "item",
    "clausula": "6.2.6 d)",
    "texto": "d. Cuando  corresponda (normalmente para los equipos  contemplados en la cláusula  6.2.6 de la norma  NCh-ISO  17020:2012), en la definición debería  incluir la exactitud y el rango de medición requeridos.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 123,
    "tipo": "item",
    "clausula": "6.2.7",
    "texto": "6.2.7 El programa general  de calibración de los equipos  se debe diseñar  e implementar de tal manera  que se asegure  que, siempre  que sea posible,  las mediciones efectuadas por el organismo de inspección sean trazables a patrones nacionales o internacionales de medición, si están disponibles. En los casos en los que la trazabilidad a patrones de medición nacionales o internacionales no sea aplicable, el organismo de inspección debe mantener evidencia suficiente de la correlación o exactitud de los resultados de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 124,
    "tipo": "item",
    "clausula": "6.2.7 a)",
    "texto": "a. La trazabilidad de las mediciones se deberá  demostrar a través del cumplimiento con la Directriz DA-D04.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 125,
    "tipo": "item",
    "clausula": "6.2.7 b)",
    "texto": "b. Cuando  la trazabilidad a patrones nacionales o internacionales de medición no es aplicable, la participación en programas de comparación pertinentes o ensayos  de aptitud  es un ejemplo  de cómo obtener  evidencia de correlación o la exactitud de los resultados de la inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 126,
    "tipo": "item",
    "clausula": "6.2.8",
    "texto": "6.2.8 Los patrones de medición de referencia en poder del organismo de inspección deben utilizarse únicamente para la calibración y para ningún  otro fin. Los patrones de referencia se deben calibrar  proporcionando trazabilidad a un patrón nacional o internacional de medición.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 127,
    "tipo": "item",
    "clausula": "6.2.8 a)",
    "texto": "a. La calibración de los patrones deberá  ser realizada por laboratorios de calibración acreditados por el INN o por otro organismo de acreditación signatario de MRA de ILAC.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 128,
    "tipo": "item",
    "clausula": "6.2.8 b)",
    "texto": "b. Cuando  los OI utilizan  patrones de medición de referencia para calibrar  instrumentos de trabajo,  dichos  patrones deberían tener un grado de exactitud mayor  que el requerido para los instrumentos de trabajo  que son calibrados.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 129,
    "tipo": "item",
    "clausula": "6.2.9",
    "texto": "6.2.9 Cuando  sea pertinente, los equipos  deben someterse a comprobaciones internas  entre re-calibraciones periódicas.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 130,
    "tipo": "item",
    "clausula": "6.2.9",
    "texto": "Cuando  el equipo  se somete  a verificaciones en servicio  entre re-calibraciones regulares, la naturaleza de tales verificaciones, la frecuencia y los criterios  de aceptación deben estar definidos en un procedimiento. Estas verificaciones deben ser realizadas\npor personal autorizado para tales efectos.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 131,
    "tipo": "item",
    "clausula": "6.2.10",
    "texto": "6.2.10 Los materiales de referencia deben,  en lo posible,  ser trazables a materiales de referencia, nacionales o internacionales cuando  éstos existan.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 132,
    "tipo": "item",
    "clausula": "6.2.10",
    "texto": "La información proporcionada en 6.2.7.a  y 6.2.7.b  para los programas de calibración de los equipos  es válida también  para los programas de calibración de materiales de referencia.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 133,
    "tipo": "item",
    "clausula": "6.2.11",
    "texto": "6.2.11 Cuando  sea pertinente para los resultados de las actividades de inspección, el organismo de inspección debe disponer de procedimientos para:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 134,
    "tipo": "item",
    "clausula": "6.2.11   a)",
    "texto": "a) seleccionar y aprobar  proveedores;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 135,
    "tipo": "item",
    "clausula": "6.2.11   a)",
    "texto": "a. Cuando  el OI contrata proveedores para llevar a cabo actividades que no incluyen la ejecución de una parte de la inspección, pero que son relevantes para el resultado de las actividades de inspección, por ejemplo, registro  de la orden, el archivado, la distribución de servicios auxiliares durante  una inspección, la redacción de los informes de inspección o servicios de calibración, tales actividades están cubiertas por el término  \"servicios\" usado en esta cláusula.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 136,
    "tipo": "item",
    "clausula": "6.2.11   b)",
    "texto": "b) verificar  los bienes  y servicios que se reciben;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 137,
    "tipo": "item",
    "clausula": "6.2.11   b)",
    "texto": "b. El procedimiento de verificación debería  asegurar que las materias primas  y servicios no se utilizan  hasta que se haya verificado la conformidad con la especificación.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 138,
    "tipo": "item",
    "clausula": "6.2.11   c)",
    "texto": "c) asegurar instalaciones de almacenamiento adecuadas.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 139,
    "tipo": "item",
    "clausula": "6.2.12",
    "texto": "6.2.12 Cuando  corresponda, se debe evaluar,  a intervalos adecuados, la condición de los ítems almacenados para detectar deterioros.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 140,
    "tipo": "item",
    "clausula": "6.2.13",
    "texto": "6.2.13 Si el organismo de inspección utiliza equipos  informáticos o automatizados en conexión con las inspecciones, debe asegurar que:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 141,
    "tipo": "item",
    "clausula": "6.2.13   a)",
    "texto": "a) el software es adecuado para el uso;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 142,
    "tipo": "item",
    "clausula": "6.2.13   a)",
    "texto": "En caso que no se cuente con software, pero si con planillas  de cálculo  tipo Excel, éstas se deberán considerar como software y por ende validar.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 143,
    "tipo": "item",
    "clausula": "6.2.13   b)",
    "texto": "b) se establecen e implementan procedimientos para proteger la integridad y seguridad de los datos;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 144,
    "tipo": "item",
    "clausula": "6.2.13   b)",
    "texto": "Los factores  que se deberían considerar en la protección de la integridad y seguridad de los datos incluyen:\n- prácticas y frecuencia de copia de seguridad (respaldos),\n- efectividad en la restauración de los datos de copia de seguridad,\n- la protección contra  virus,\n- la protección de contraseña,\n- controlar el acceso  a la información, y\n- evitar la modificación de la información.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 145,
    "tipo": "item",
    "clausula": "6.2.13   c)",
    "texto": "c) se mantienen los equipos  informáticos y automatizados con el fin de asegurar su correcto funcionamiento.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 146,
    "tipo": "item",
    "clausula": "6.2.14",
    "texto": "6.2.14 El organismo de inspección debe disponer de procedimientos documentados para tratar los equipos  defectuosos. Los equipos  defectuosos deben ser retirados del servicio  por segregación, etiquetado o marcado muy visible. El organismo de inspección debe analizar  las consecuencias de los defectos sobre las inspecciones procedentes y, cuando  sea necesario, tomar las acciones correctivas adecuadas.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 147,
    "tipo": "item",
    "clausula": "6.2.15",
    "texto": "6.2.15 Se debe registrar la información correspondiente a los equipos, incluido el software. Esto debe incluir la identificación y, cuando corresponda, la información referida a la calibración y al mantenimiento.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 148,
    "tipo": "titulo",
    "clausula": "6.3",
    "texto": "6.3 Subcontratación",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 149,
    "tipo": "item",
    "clausula": "6.3.1",
    "texto": "6.3.1 El organismo de inspección debe realizar por sí mismo las inspecciones que ha aceptado realizar por contrato. Cuando un organismo de inspección subcontrata cualquier parte de la inspección, debe asegurarse y ser capaz de demostrar que el subcontratista es competente para realizar las actividades en cuestión y, cuando corresponda, cumple los requisitos pertinentes establecidos en esta Norma o en otras normas de evaluación de la conformidad pertinentes.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 150,
    "tipo": "item",
    "clausula": "6.3.1",
    "texto": "a. En caso que un OI subcontrate cualquier parte de la inspección, justificadamente por alguno de los motivos descritos en la Nota 1 del numeral 6.3.1 de la norma NCh-ISO 17020:2012, esta subcontratación no podrá extenderse por más de 6 meses consecutivos.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 151,
    "tipo": "item",
    "clausula": "6.3.1",
    "texto": "b. En caso de que un OI decida no subcontratar parte o la totalidad de sus inspecciones, deberá estar establecida esta condición en la documentación de sistema de gestión, y no se aceptará ninguna subcontratación, inclusive en aquellos casos establecidos en la Nota 1 del numeral 6.3.1 de la norma NCh ISO 17020:2012.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 152,
    "tipo": "item",
    "clausula": "6.3.1",
    "texto": "c. La acreditación se limita a tareas de evaluación de la conformidad en las que el OI ha demostrado competencia para desarrollarlas por sí mismo. Por lo tanto, la acreditación no puede ser otorgada por las actividades referidas en el cuarto punto en la nota 1 de la norma NCh-ISO 17020:2012, si el OI no tiene la competencia y/o de los recursos requeridos. Sin embargo, la tarea de evaluación e interpretación de los resultados de tales actividades con el propósito de determinar la conformidad puede ser incluida en el alcance de acreditación, siempre que la competencia adecuada para esto haya sido demostrada.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 153,
    "tipo": "item",
    "clausula": "6.3.2",
    "texto": "6.3.2 El organismo de inspección debe informar al cliente de su intención de subcontratar cualquier parte de la inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 154,
    "tipo": "item",
    "clausula": "6.3.3",
    "texto": "6.3.3 Cuando los subcontratistas realizan trabajos que forman parte de una inspección, el organismo de inspección conserva la responsabilidad de la determinación de la conformidad del ítem inspeccionado con los requisitos.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 155,
    "tipo": "item",
    "clausula": "6.3.3",
    "texto": "En la nota 2 de la definición de \"inspección\" en la cláusula  3.1 de la norma  NCh  ISO 17020:2012 se indica que en algunos  casos la inspección puede ser sólo un examen, sin una determinación posterior de la conformidad. En tales casos, la cláusula  6.3.3 no se aplica ya que no hay una determinación de la\nconformidad.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 156,
    "tipo": "item",
    "clausula": "6.3.4",
    "texto": "6.3.4 El organismo de inspección debe registrar y conservar los detalles  relativos a la competencia de sus subcontratistas y de su conformidad con los requisitos aplicables de esta Norma  o de otras normas  pertinentes de evaluación de la conformidad. El organismo de inspección debe mantener un registro  de todos los subcontratistas.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 157,
    "tipo": "item",
    "clausula": "6.3.4",
    "texto": "Si la evaluación de la competencia del subcontratista se basa en parte o en su totalidad en su acreditación, el OI debe asegurar que el alcance  de la acreditación del subcontratista cubra las actividades a ser subcontratadas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 158,
    "tipo": "titulo",
    "clausula": "7",
    "texto": "7. Requisitos de los procesos",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 159,
    "tipo": "titulo",
    "clausula": "7.1",
    "texto": "7.1 Métodos y procedimientos de inspección",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 160,
    "tipo": "item",
    "clausula": "7.1.1",
    "texto": "7.1.1 El organismo de inspección debe utilizar  los métodos y procedimientos de inspección definidos en los requisitos con respecto a los cuales se va a realizar  la inspección. Cuando  no estén definidos, el organismo de inspección debe desarrollar métodos y procedimientos específicos a utilizar  (véase 7.1.3). Si el método  de inspección propuesto por el cliente se considera inapropiado, el organismo de inspección debe informar al cliente.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 161,
    "tipo": "item",
    "clausula": "7.1.1 a)",
    "texto": "a. Si la inspección incluye  mediciones, ILAC G27 brinda  orientación sobre cómo determinar qué requisitos pueden  ser relevantes.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 162,
    "tipo": "item",
    "clausula": "7.1.1 b)",
    "texto": "b. Para el desarrollo de métodos y procedimientos de inspección específicos, se puede utilizar  la guía de NCh-ISO/IEC 17007.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 163,
    "tipo": "item",
    "clausula": "7.1.1 c)",
    "texto": "c. Varios métodos de inspección utilizan  el ojo humano  para realizar  inspecciones visuales. Cada vez se introducen nuevas tecnologías (por ejemplo: drones,  cámaras, gafas especiales, TI, inteligencia artificial, etc.) para su uso durante  las inspecciones. Esto podría  ser como un reemplazo (parcial)  de un método  de inspección existente (como  el ojo humano) o como un nuevo método  de inspección",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 164,
    "tipo": "item",
    "clausula": "7.1.2",
    "texto": "7.1.2 El organismo de inspección debe tener y utilizar  instrucciones adecuadas y documentadas relativas a la planificación de las inspecciones y las técnicas  de muestreo e inspección, cuando  la ausencia de dichas instrucciones puedan  comprometer la eficacia  del proceso  de inspección. Cuando  corresponda, el organismo de inspección debe tener los conocimientos suficientes en materia  de técnicas  estadísticas para asegurarse de que los procedimientos de muestreo son estadísticamente robustos y que son correcto el tratamiento y la interpretación de resultados.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 165,
    "tipo": "item",
    "clausula": "7.1.3",
    "texto": "7.1.3 Cuando  el organismo de inspección tiene que utilizar  métodos o procedimientos de inspección que no están normalizados, dichos  métodos y procedimientos deben ser apropiados y deben estar completamente documentados.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 166,
    "tipo": "item",
    "clausula": "7.1.3",
    "texto": "a. Para demostrar que un método  o procedimiento de inspección no normalizado es adecuado, se debe validar  a través de la comparación de resultados con otros métodos similares normalizados, uso de materiales de referencia certificados, comparación de resultados con un organismo oficial de referencia, o participación en ensayos  de aptitud.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 167,
    "tipo": "item",
    "clausula": "7.1.3",
    "texto": "b. Los aspectos que requieren atención con la introducción de nueva tecnología son:\n- Validación del método  de inspección nuevo o modificado, utilizando nueva tecnología. En caso de reemplazo (parcial)  de un método  de inspección existente, se debería  investigar si el resultado de la inspección es igual (o más) confiable que el resultado del método  existente;\n- Los requisitos legales  y de seguridad aplicables (como  permisos), limitaciones legales  y condiciones legales;\n- Las limitaciones y condiciones aplicables al método  de inspección, cuando  se utilice nueva tecnología;\n- Si el uso de nueva tecnología debería  mencionarse en el informe  de inspección;\n- Si se debería  mencionar el uso de nueva tecnología en el alcance  de la inspección y/o acreditación.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 168,
    "tipo": "item",
    "clausula": "7.1.4",
    "texto": "7.1.4 Todas las instrucciones, normas  o procedimientos escritos,  hojas de trabajo,  listas de verificación y datos de referencia pertinentes al trabajo  del organismo de inspección se deben mantener actualizados y deben estar fácilmente disponibles para el personal.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 169,
    "tipo": "item",
    "clausula": "7.1.5",
    "texto": "7.1.5 El organismo de inspección debe disponer de un sistema  de control  de contratos o de órdenes  de trabajo  el cual asegure que:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 170,
    "tipo": "item",
    "clausula": "7.1.5 a)",
    "texto": "a) el trabajo  a realizar  está dentro  de su experiencia técnica  y que el organismo tiene los recursos adecuados para cumplir  los requisitos;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 171,
    "tipo": "item",
    "clausula": "7.1.5 a)",
    "texto": "a. Cuando  proceda, el sistema  de control  de contratos u órdenes  de trabajo  debería  asegurar también  que:\n- las condiciones del contrato están acordadas,\n- la competencia del personal es adecuada,\n- todos los requisitos reglamentarios son identificados,\n- los requisitos de seguridad son identificados,\n- las extensiones de los acuerdos de subcontratación requeridos son identificados.\n\nPara las solicitudes de trabajo  de rutina o repetición, la revisión  puede limitarse a consideraciones de tiempo  y de recursos humanos. Un registro  aceptable en tales casos sería una aceptación del contrato firmado  por una persona  debidamente autorizada.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 172,
    "tipo": "item",
    "clausula": "7.1.5 b)",
    "texto": "b) los requisitos de quienes  solicitan  los servicios del organismo de inspección están  definidos adecuadamente y se entiendan las condiciones especiales, de manera  que se puedan  dar instrucciones no ambiguas al personal que realiza  los trabajos  que se van a requerir;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 173,
    "tipo": "item",
    "clausula": "7.1.5 b)",
    "texto": "b. En situaciones en las cuales órdenes  de trabajo  verbales son aceptables, el OI debe mantener un registro  de todas las solicitudes e instrucciones recibidas verbalmente. Donde sea apropiado, las fechas  pertinentes y la identidad del representante del cliente,  deberían ser registradas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 174,
    "tipo": "item",
    "clausula": "7.1.5 c)",
    "texto": "c) el trabajo que se está desarrollando se controla mediante revisiones regulares y acciones correctivas;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 175,
    "tipo": "item",
    "clausula": "7.1.5 c)",
    "texto": "c. El sistema de control de contrato u órdenes de trabajo debería asegurar que existe un claro y demostrable entendimiento entre el OI y su cliente del alcance del trabajo de inspección que será llevado a cabo por el OI.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 176,
    "tipo": "item",
    "clausula": "7.1.5 d)",
    "texto": "d) se han cumplido los requisitos del contrato o de la orden de trabajo.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 177,
    "tipo": "item",
    "clausula": "7.1.6",
    "texto": "7.1.6 Cuando el organismo de inspección utiliza, como parte del proceso de inspección, información proporcionada por cualquier otra parte, debe verificar la integridad de dicha información.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 178,
    "tipo": "item",
    "clausula": "7.1.6",
    "texto": "La información referida en esta cláusula no es la información proporcionada por un subcontratista, sino información recibida de otras partes, por ejemplo, autoridades regulatorias o el cliente del OI. La información puede incluir datos de referencia de la actividad de inspección, pero no los resultados de la actividad de inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 179,
    "tipo": "item",
    "clausula": "7.1.7",
    "texto": "7.1.7 Las observaciones o datos obtenidos en el curso de las inspecciones deben registrarse de manera oportuna para evitar la pérdida de la información pertinente.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 180,
    "tipo": "item",
    "clausula": "7.1.8",
    "texto": "7.1.8 Los cálculos y la transferencia de datos deben ser objeto de las comprobaciones pertinentes.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 181,
    "tipo": "item",
    "clausula": "7.1.8",
    "texto": "El OI deberá  establecer un procedimiento que defina la frecuencia para realizar  las comprobaciones de cálculo  y las transferencias de datos, así como los registros que se generen.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 182,
    "tipo": "item",
    "clausula": "7.1.9",
    "texto": "7.1.9 El organismo de inspección debe disponer de instrucciones documentadas para llevar a cabo la inspección de manera segura.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 183,
    "tipo": "item",
    "clausula": "7.1.9",
    "texto": "Las instrucciones documentadas o procedimientos deberán incluir el uso de elementos de protección personal para cada tipo de inspección, cuando corresponda.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 184,
    "tipo": "titulo",
    "clausula": "7.2",
    "texto": "7.2 Manipulación de los ítems y muestras de inspección",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 185,
    "tipo": "item",
    "clausula": "7.2.1",
    "texto": "7.2.1 El organismo de inspección debe asegurarse de que los ítems y muestras a inspeccionar poseen  una identificación única con el fin de evitar toda confusión respecto de la identidad de dichos  ítems y muestras.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 186,
    "tipo": "item",
    "clausula": "7.2.2",
    "texto": "7.2.2 El organismo de inspección debe determinar si el ítem a inspeccionar ha sido preparado para ser inspeccionado",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 187,
    "tipo": "item",
    "clausula": "7.2.3",
    "texto": "7.2.3 Toda anormalidad aparente notificada al inspector u observada por él debe registrarse. En caso de duda sobre la idoneidad del ítem para la inspección prevista, o cuando  el ítem no corresponda con la descripción suministrada, el organismo de inspección debe ponerse  en contacto con el cliente antes de continuar.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 188,
    "tipo": "item",
    "clausula": "7.2.4",
    "texto": "7.2.4 El organismo de inspección debe disponer de procedimientos documentados e instalaciones apropiadas para evitar el deterioro o el daño de los ítems a inspeccionar, mientras están bajo su responsabilidad.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 189,
    "tipo": "titulo",
    "clausula": "7.3",
    "texto": "7.3 Registros de inspección",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 190,
    "tipo": "item",
    "clausula": "7.3.1",
    "texto": "7.3.1 El organismo de inspección debe mantener un sistema  de registros (véase el 8.4) para demostrar el cumplimiento eficaz de los procedimientos de inspección y permitir  una evaluación de la inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 191,
    "tipo": "item",
    "clausula": "7.3.1",
    "texto": "Los registros deberían indicar  cual ítem en particular del equipamiento, que tiene una influencia significativa en los resultados de la inspección, ha sido usado para cada actividad de inspección",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 192,
    "tipo": "item",
    "clausula": "7.3.2",
    "texto": "7.3.2 El informe  o certificado de inspección debe permitir  internamente identificable al inspector o a los inspectores que realizaron la inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 193,
    "tipo": "titulo",
    "clausula": "7.4",
    "texto": "7.4 Informes de inspección y certificados de inspección",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 194,
    "tipo": "item",
    "clausula": "7.4.1",
    "texto": "7.4.1 El trabajo  realizado por el organismo de inspección debe estar respaldado por un informe  de inspección o un certificado de inspección recuperable.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 195,
    "tipo": "item",
    "clausula": "7.4.1 a)",
    "texto": "a. Un OI emitirá  certificados de inspección, sólo en aquellos casos que el esquema de inspección exija incluir una declaración de conformidad. En caso contrario el OI deberá  emitir informes de inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 196,
    "tipo": "item",
    "clausula": "7.4.1 b)",
    "texto": "b. La excepción a lo indicado en el criterio  anterior, será cuando  la autoridad reglamentaria defina disposiciones particulares.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 197,
    "tipo": "item",
    "clausula": "7.4.2",
    "texto": "7.4.2 Todo informe/certificado de inspección debe incluir lo siguiente:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 198,
    "tipo": "item",
    "clausula": "7.4.2",
    "texto": "El Reglamento INN-R409 proporciona requisitos para el uso de símbolos de creditación y para la condición de acreditado.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 199,
    "tipo": "item",
    "clausula": "7.4.2 a)",
    "texto": "a) la identificación del organismo emisor",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 200,
    "tipo": "item",
    "clausula": "7.4.2 b)",
    "texto": "b) la identificación única y la fecha de emisión;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 201,
    "tipo": "item",
    "clausula": "7.4.2 c)",
    "texto": "c) la fecha o las fechas  de inspección;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 202,
    "tipo": "item",
    "clausula": "7.4.2 d)",
    "texto": "d) la identificación del ítem o ítems inspeccionados;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 203,
    "tipo": "item",
    "clausula": "7.4.2 e)",
    "texto": "e) la firma u otra indicación de aprobación proporcionada por el personal autorizado;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 204,
    "tipo": "item",
    "clausula": "7.4.2 f)",
    "texto": "f) una declaración de conformidad, cuando  corresponda;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 205,
    "tipo": "item",
    "clausula": "7.4.2 g)",
    "texto": "g) los resultados de la inspección, excepto  cuando  se detallan  de acuerdo  con el apartado 7.4.3.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 206,
    "tipo": "item",
    "clausula": "7.4.3",
    "texto": "7.4.3 Un organismo de inspección debe emitir un certificado de inspección que no incluya  los resultados de inspección [véase\n7.4.2 g)] sólo cuando  el organismo de inspección pueda elaborar también  un informe  de inspección que contenga los resultados de inspección, y cuando  dicho certificado de inspección y el informe  de inspección sean mutuamente trazables.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 207,
    "tipo": "item",
    "clausula": "7.4.4",
    "texto": "7.4.4 Toda la información indicada en el apartado 7.4.2 debe reportarse de manera  correcta, precisa  y clara. Cuando  el informe de inspección o el certificado de inspección contengan resultados proporcionados por los subcontratistas, dichos  resultados deben ser identificados claramente.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 208,
    "tipo": "item",
    "clausula": "7.4.4",
    "texto": "Puede ser útil identificar el método  de inspección en el informe/certificado de inspección, cuando  esta información provea  una interpretación adecuada de los resultados de la inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 209,
    "tipo": "item",
    "clausula": "7.4.5",
    "texto": "7.4.5 Las correcciones o adiciones a un informe  de inspección o certificado de inspección posteriores a su emisión  deben registrarse de acuerdo  con los requisitos pertinentes de este apartado 7.4 . Un informe  o certificado modificado debe identificar el informe  o certificado al que reemplazó.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 210,
    "tipo": "titulo",
    "clausula": "7.5",
    "texto": "7.5 Quejas  y apelaciones",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 211,
    "tipo": "item",
    "clausula": "7.5",
    "texto": "a. Como criterio  se entenderán como sinónimos quejas  y reclamos.\nb. Se pueden  establecer procedimientos como  procedimientos separados, el tratamiento de las quejas  y el tratamiento de las apelaciones.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 212,
    "tipo": "item",
    "clausula": "7.5.1",
    "texto": "7.5.1 El organismo de inspección debe disponer de un proceso  documentado para recibir,  evaluar  y tomar  decisiones sobre las quejas  y apelaciones.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 213,
    "tipo": "item",
    "clausula": "7.5.2",
    "texto": "7.5.2  Una  descripción del  proceso   para  el  tratamiento de  quejas  y apelaciones debe  estar  disponible para  cualquier parte interesada que lo solicite.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 214,
    "tipo": "item",
    "clausula": "7.5.3",
    "texto": "7.5.3 Cuando  el organismo de inspección recibe  una queja,  debe confirmar si está relacionada con las actividades de inspección de las que es responsable y, en ese caso, debe tratarla.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 215,
    "tipo": "item",
    "clausula": "7.5.3",
    "texto": "Cuando  un OI recibe una queja, ésta debe ser respondida, independientemente si debe tratarla,  o no (aquellas que no están relacionadas con la actividad de inspección del OI).",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 216,
    "tipo": "item",
    "clausula": "7.5.4",
    "texto": "7.5.4  El organismo de inspección debe  ser responsable de todas  las decisiones a todos  los niveles  del proceso  de tratamiento de quejas  y apelaciones.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 217,
    "tipo": "item",
    "clausula": "7.5.4",
    "texto": "Respecto a las quejas y apelaciones el OI deberá hacerse responsable por las respuestas que entregue.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 218,
    "tipo": "item",
    "clausula": "7.5.5",
    "texto": "7.5.5 Las investigaciones y decisiones relativas a las apelaciones no deben dar lugar a ninguna acción discriminatoria.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 219,
    "tipo": "titulo",
    "clausula": "7.6",
    "texto": "7.6 Proceso de quejas y apelaciones",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 220,
    "tipo": "item",
    "clausula": "7.6.1",
    "texto": "7.6.1 El proceso de tratamiento de quejas y apelaciones debe incluir como mínimo los elementos y métodos siguientes:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 221,
    "tipo": "item",
    "clausula": "7.6.1 a)",
    "texto": "a) una descripción del proceso de recepción, validación, investigación de la queja o apelación y de decisión sobre las acciones a tomar para darles respuesta;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 222,
    "tipo": "item",
    "clausula": "7.6.1 b)",
    "texto": "b) el seguimiento y el registro de las quejas y apelaciones, incluyendo las acciones tomadas para resolverlas;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 223,
    "tipo": "item",
    "clausula": "7.6.1 c)",
    "texto": "c) asegurarse de que se toman las acciones apropiadas.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 224,
    "tipo": "item",
    "clausula": "7.6.2",
    "texto": "7.6.2 El organismo de inspección que recibe la queja o apelación debe ser responsable de reunir y verificar toda la información necesaria para validar la queja o apelación.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 225,
    "tipo": "item",
    "clausula": "7.6.3",
    "texto": "7.6.3 Siempre que sea posible, el organismo de inspección debe acusar recibo de la queja o apelación, y debe facilitar a quien presente la queja o apelación los informes del progreso y del resultado del tratamiento de la queja o apelación.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 226,
    "tipo": "item",
    "clausula": "7.6.4",
    "texto": "7.6.4 La decisión que se comunicará a quien presente la queja o apelación debe tomarse, o revisarse y aprobarse por una o varias personas que no hayan participado en las actividades de inspección que dieron origen a la queja o apelación.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 227,
    "tipo": "item",
    "clausula": "7.6.5",
    "texto": "7.6.5 Siempre que sea posible, el organismo de inspección debe notificar formalmente la finalización del proceso de tratamiento de la queja o apelación a quien la presente la queja o apelación.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 228,
    "tipo": "item",
    "clausula": "7.6.5",
    "texto": "El OI deberá notificar en todos los casos, la finalización del proceso de tratamiento de la queja o apelación.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 229,
    "tipo": "titulo",
    "clausula": "8",
    "texto": "8. Requisitos relativos al sistema  de gestión",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 230,
    "tipo": "titulo",
    "clausula": "8.1",
    "texto": "8.1 Opciones",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 231,
    "tipo": "item",
    "clausula": "8.1.1",
    "texto": "8.1.1 Generalidades\nEl organismo de inspección debe establecer y mantener un sistema  de gestión  capaz de asegurar el cumplimiento coherente con los requisitos de esta Norma  Internacional de acuerdo  con la Opción  A o con la Opción  B.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 232,
    "tipo": "item",
    "clausula": "8.1.2",
    "texto": "8.1.2 Opción  A\nEl sistema  de gestión  del organismo de inspección debe contemplar lo siguiente:\n-la documentación del sistema  de gestión  (por ejemplo, manual,  políticas, definición de responsabilidades, véase 8.2)\n-el control  de los documentos (véase 8.3);\n-el contol de registros (véase 8.4);\n-la revisión  por la dirección (véase 8.5);\n-las auditorías internas  (véase 8.6);\n-las acciones correctivas (véase 8.7);\n-las acciones preventivas (véase 8.8);\n-las quejas  y apelaciones (véase 7.5 y 7.6);",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 233,
    "tipo": "item",
    "clausula": "8.1.3",
    "texto": "8.1.3 Opción  B\nUn organismo de inspección que ha establecido y mantiene un sistema  de gestión,  de acuerdo  con los requisitos de la ISO 9001, y que es capaz  de sostener y demostrar el cumplimiento coherente de los requisitos de esta Norma  Internacional, satisface los requisitos del capítulo  del sistema  de gestión  (véanse  los 8.2 a 8.8).",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 234,
    "tipo": "item",
    "clausula": "8.1.3 a)",
    "texto": "a. La elección  de la opción  B, no exime al INN de evaluar  todos los requisitos establecidos en la opción  A, es decir, en todos los casos se evaluará el cumplimiento de los numerales 8.2 al 8.8 de la norma  NCh-ISO  17020:2012.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 235,
    "tipo": "item",
    "clausula": "8.1.3 b)",
    "texto": "b. La elección  de la opción  B, no implica  que, si el OI tiene implementado y/o certificado su sistema  de gestión  en base a ISO\n9001, se excluirán los requisitos de la opción  A. En todos los casos se deberá  demostrar el cumplimiento de los numerales 8.2 al\n8.8 de la norma  NCh-ISO  17020:2012.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 236,
    "tipo": "item",
    "clausula": "8.1.3 c)",
    "texto": "c. Si un OI asegura  que cumplen con la opción  B, es necesario demostrar que ha establecido un sistema  de gestión  que cumple con la norma  ISO 9001, y que el sistema  de gestión  es capaz de soportar el cumplimiento coherente de los requisitos de la norma  NCh-ISO  17020:2012. El INN debe verificar  las\nafirmaciones realizadas por el OI, pero no evaluar  (o auditar)  el sistema  de gestión  ISO 9001. El grado requerido de verificación necesario, dependerá de la evidencia aportada. Si el sistema  de gestión  está certificado por un organismo de certificación acreditado, el INN deberá  de igual forma verificar  el\ncumplimiento con 8.1.3, pero no evaluar  (o auditar)  contra  las cláusulas 8.2 a 8.8 de la norma.  Si la verificación resulta  en la identificación de no conformidades, estas deberían ser informadas contra  la cláusula  8.1.3.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 237,
    "tipo": "item",
    "clausula": "8.1.3 d)",
    "texto": "d. Cuando  un sistema  de gestión  ISO 9001 es establecido para una organización que incluye  actividades distintas de la inspección, el sistema  deberá  siempre  cubrir adecuadamente las actividades del OI.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 238,
    "tipo": "item",
    "clausula": "8.1.3 e)",
    "texto": "e. La opción  B no requiere que el sistema  de gestión  del OI esté certificado con la norma  ISO 9001. Sin embargo, al determinar la extensión de la evaluación requerida, el INN debería  tener en cuenta  si el OI ha sido certificado según ISO 9001 por un organismo de certificación acreditado por un organismo de\nacreditación que es signatario del MLA IAF, o de un MLA regional, para la certificación de sistemas de gestión.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 239,
    "tipo": "titulo",
    "clausula": "8.2",
    "texto": "8.2 Documentación del sistema  de gestión  (Opción  A)",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 240,
    "tipo": "item",
    "clausula": "8.2.1",
    "texto": "8.2.1 La alta dirección del organismo de inspección debe establecer, documentar y mantener políticas  y objetivos para el cumplimiento de esta Norma  Internacional y debe asegurarse de que las políticas  y los objetivos se entienden y se implementan a todos los niveles  de la organización del organismo de inspección.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 241,
    "tipo": "item",
    "clausula": "8.2.1 a)",
    "texto": "a. Los objetivos deben ser medibles y verificables.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 242,
    "tipo": "item",
    "clausula": "8.2.1 b)",
    "texto": "b. Los objetivos deben ser correspondientes con las políticas  (política  de la calidad).",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 243,
    "tipo": "item",
    "clausula": "8.2.1 c)",
    "texto": "c. No se aceptarán como objetivos, requisitos normativos.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 244,
    "tipo": "item",
    "clausula": "8.2.1 d)",
    "texto": "d. Las políticas  y objetivos deben abordar  la competencia, imparcialidad y funcionamiento coherente del organismo de inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 245,
    "tipo": "item",
    "clausula": "8.2.2",
    "texto": "8.2.2 La alta dirección debe proporcionar evidencia de su compromiso con el desarrollo y la implementación del sistema  de gestión  y con su eficacia  para alcanzar  el cumplimiento coherente de esta Norma  Internacional.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 246,
    "tipo": "item",
    "clausula": "8.2.2",
    "texto": "Evidencias del compromiso de la alta dirección, pueden  ser recursos para: la calibración/mantención de equipos, capacitación, auditorías eficaces, revisiones por la dirección apropiadas, entre otros.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 247,
    "tipo": "item",
    "clausula": "8.2.3",
    "texto": "8.2.3 La alta dirección del organismo de inspección debe designar un miembro de la dirección quien, independientemente de otras responsabilidades, debe tener la responsabilidad y la autoridad para:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 248,
    "tipo": "item",
    "clausula": "8.2.3 a)",
    "texto": "a) asegurar que se establecen, implementan y mantienen los procesos y procedimientos necesarios para el sistema  de gestión;\ne",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 249,
    "tipo": "item",
    "clausula": "8.2.3 b)",
    "texto": "b) informar a la alta dirección sobre el desempeño del sistema  de gestión  y cualquier necesidad de mejora.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 250,
    "tipo": "item",
    "clausula": "8.2.4",
    "texto": "8.2.4 Toda la documentación, procesos, sistemas, registros, etc. que se relacionan con el cumplimiento de los requisitos de esta\nNorma  Internacional se deben incluir,  hacer referencia o vincular  a la documentación del sistema  de gestión.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 251,
    "tipo": "item",
    "clausula": "8.2.4",
    "texto": "Para una fácil referencia, se recomienda que el OI indique  dónde el requisito de NCh-ISO  17020:2012 es establecido, por ejemplo, por medio  de una tabla de referencias cruzadas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 252,
    "tipo": "item",
    "clausula": "8.2.5",
    "texto": "8.2.5 Todo el personal que participa en las actividades de inspección debe tener acceso a las partes de la documentación del sistema de gestión y a la información relacionada que sea aplicable a sus responsabilidades.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 253,
    "tipo": "titulo",
    "clausula": "8.3",
    "texto": "8.3 Control de documentos (Opción A)",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 254,
    "tipo": "item",
    "clausula": "8.3.1",
    "texto": "8.3.1 El organismo de inspección debe establecer procedimientos para el control de los documentos (internos y externos) que se relacionen con el cumplimiento de los requisitos de esta Norma Internacional",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 255,
    "tipo": "item",
    "clausula": "8.3.1",
    "texto": "Todo procedimiento e instrucción para llevar a cabo una actividad debe estar documentado.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 256,
    "tipo": "item",
    "clausula": "8.3.2",
    "texto": "8.3.2 Los procedimientos deben establecer los controles necesarios para:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 257,
    "tipo": "item",
    "clausula": "8.3.2 a)",
    "texto": "a) aprobar la adecuación de los documentos antes de emitirlos;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 258,
    "tipo": "item",
    "clausula": "8.3.2 b)",
    "texto": "b) revisar y actualizar (según sea necesario) y volver a aprobar los documentos;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 259,
    "tipo": "item",
    "clausula": "8.3.2 c)",
    "texto": "c) asegurar que se identifican los cambios y el estado de revisión vigente de los documentos;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 260,
    "tipo": "item",
    "clausula": "8.3.2 d)",
    "texto": "d) asegurar que las versiones pertinentes de los documentos aplicables están disponibles en los lugares de uso;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 261,
    "tipo": "item",
    "clausula": "8.3.2 e)",
    "texto": "e) asegurar que los documentos permanecen legibles y fácilmente identificables;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 262,
    "tipo": "item",
    "clausula": "8.3.2 f)",
    "texto": "f) asegurar que se identifican los documentos de origen externo y que se controla su distribución;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 263,
    "tipo": "item",
    "clausula": "8.3.2 g)",
    "texto": "g) prevenir el uso no intencionado de documentos obsoletos e identificarlos adecuadamente si se conservan para cualquier fin.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 264,
    "tipo": "titulo",
    "clausula": "8.4",
    "texto": "8.4 Control de registros (Opción A)",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 265,
    "tipo": "item",
    "clausula": "8.4.1",
    "texto": "8.4.1 El organismo de inspección debe establecer procedimientos para definir  los controles necesarios para la identificación, el almacenamiento, la protección, la recuperación, los tiempos  de retención y la disposición de los registros relacionados con el cumplimiento de los requisitos de esta Norma  Internacional.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 266,
    "tipo": "item",
    "clausula": "8.4.1 a)",
    "texto": "a. El OI debe establecer cuál será el formato  de registros a mantener, en papel y/o electrónicos.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 267,
    "tipo": "item",
    "clausula": "8.4.1 b)",
    "texto": "b. Si los registros son electrónicos, se deberán establecer condiciones de acceso  e integridad de los registros, similares a los definidos en el numeral 6.2.13 b) de esta Directriz.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 268,
    "tipo": "item",
    "clausula": "8.4.1 c)",
    "texto": "c. Este requisito significa  que todos los registros necesarios para demostrar el cumplimiento de los requisitos de la norma deben ser establecidos y mantenidos.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 269,
    "tipo": "item",
    "clausula": "8.4.2",
    "texto": "8.4.2 El organismo de inspección debe establecer procedimientos para la conservación de registros por un período  que sea coherente con sus obligaciones contractuales y legales.  El acceso  a estos registros debe ser coherente con los acuerdos de confidencialidad.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 270,
    "tipo": "item",
    "clausula": "8.4.2 a)",
    "texto": "a. Los registros deben mantenerse al menos  por un período  de 5 años, o tiempos  mayores definidos por otros requisitos o por las autoridades reglamentarias, según corresponda.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 271,
    "tipo": "item",
    "clausula": "8.4.2 b)",
    "texto": "b. Los registros de personal y de equipos, entre otros, son permanentes mientras la persona  o el equipo  esté en funciones en el\nOI, y deberán mantenerse al menos  por 5 años adicionales desde el cese de funciones.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 272,
    "tipo": "titulo",
    "clausula": "8.5",
    "texto": "8.5 Revisión por la dirección (Opción  A)",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 273,
    "tipo": "titulo",
    "clausula": "8.5.1",
    "texto": "8.5.1 Generalidades",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 274,
    "tipo": "item",
    "clausula": "8.5.1.1",
    "texto": "8.5.1.1  La alta dirección del organismo de inspección debe establecer procedimientos para revisar  su sistema  de gestión  a intervalos planificados para asegurar su continua conveniencia, adecuación y eficacia,  incluyendo las políticas  y los objetivos declarados relativos al cumplimiento de esta Norma  Internacional.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 275,
    "tipo": "item",
    "clausula": "8.5.1.2",
    "texto": "8.5.1.2  Estas revisiones deben realizarse al menos  una vez al año. Si no, se debe proceder a una revisión  exhaustiva dividida  en carios segmentos (revisión continua) que debe completarse en 12 mese.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 276,
    "tipo": "item",
    "clausula": "8.5.1.3",
    "texto": "8.5.1.3  Se deben conservar los registros de las revisiones.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 277,
    "tipo": "item",
    "clausula": "8.5.2",
    "texto": "8.5.2 Información de entrada  para la revisión\nLa información de entrada  para la revisión  por la dirección debe incluir información relativa  a lo siguiente:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 278,
    "tipo": "item",
    "clausula": "8.5.2 a)",
    "texto": "a) los resultados de las auditorías internas  y externas;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 279,
    "tipo": "item",
    "clausula": "8.5.2 a)",
    "texto": "a. Se debe considerar como dato de entrada  para la revisión  por la dirección, la matriz  de riesgos  a la imparcialidad y sus conclusiones (ver 4.1.3 y 4.1.4 de la NCh  ISO 17020:2012).",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 280,
    "tipo": "item",
    "clausula": "8.5.2 b)",
    "texto": "b) la retroalimentación de los clientes  y las partes interesadas relativa  al cumplimiento de esta Norma  Internacional;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 281,
    "tipo": "item",
    "clausula": "8.5.2 b)",
    "texto": "b. La revisión  por la dirección debería  tener en cuenta  la información sobre la adecuación de los recursos humanos y equipos actuales, las cargas  de trabajo  proyectadas y las necesidades de capacitación del personal nuevo y existente.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 282,
    "tipo": "item",
    "clausula": "8.5.2 c)",
    "texto": "c) el estado  de las acciones preventivas y correctivas;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 283,
    "tipo": "item",
    "clausula": "8.5.2 c)",
    "texto": "c. La revisión  por la dirección debería  incluir una revisión  de la efectividad del sistema  establecido para asegurar la competencia adecuada del personal.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 284,
    "tipo": "item",
    "clausula": "8.5.2 d)",
    "texto": "d) las acciones de seguimiento provenientes de revisiones por la dirección previas;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 285,
    "tipo": "item",
    "clausula": "8.5.2 e)",
    "texto": "e) el cumplimiento de los objetivos;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 286,
    "tipo": "item",
    "clausula": "8.5.2 f)",
    "texto": "f) los cambios  que podrían  afectar  al sistema  de gestión;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 287,
    "tipo": "item",
    "clausula": "8.5.2 g)",
    "texto": "g) las apelaciones y las quejas.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 288,
    "tipo": "titulo",
    "clausula": "8.5.3",
    "texto": "8.5.3 Resultados de la revisión\nLos resultados de la revisión  por la dirección deben incluir las decisiones y acciones relativas a:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 289,
    "tipo": "item",
    "clausula": "8.5.3",
    "texto": "Se debe concluir  si el sistema  de gestión  y sus procesos, son adecuados y eficaces. Esto no quiere decir que siempre  se concluya en forma positiva.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 290,
    "tipo": "item",
    "clausula": "8.5.2 a)",
    "texto": "a) la mejora  de la eficacia  del sistema  de gestión  y de sus procesos;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 291,
    "tipo": "item",
    "clausula": "8.5.2 b)",
    "texto": "b) la mejora  del organismo de inspección, en relación  con el cumplimiento de esta Norma  Técnica  Boliviana;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 292,
    "tipo": "item",
    "clausula": "8.5.2 c)",
    "texto": "c) la necesidad de recursos.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 293,
    "tipo": "titulo",
    "clausula": "8.6",
    "texto": "8.6 Auditorías internas (Opción  A)",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 294,
    "tipo": "item",
    "clausula": "8.6.1",
    "texto": "8.6.1 El organismo de inspección debe establecer procedimientos para las auditorías internas  con el fin de verificar  que cumple los requisitos de esta Norma  Técnica  Boliviana y que el sistema  de gestión  está implementado y se mantiene de manera  eficaz.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 295,
    "tipo": "item",
    "clausula": "8.6.1",
    "texto": "Para la verificación de la eficacia  e implementación del sistema  de gestión,  se deben mantener registros de las auditorías internas  que incluyan  los hallazgos positivos y negativos detectados, es decir, las conformidades y no conformidades respectivamente. Por ejemplo, a través de listas deverificación.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 296,
    "tipo": "item",
    "clausula": "8.6.2",
    "texto": "8.6.2 Se debe planificar un programa de auditoría, teniendo en cuenta  la importancia de los procesos y áreas a auditar,  así como los resultados de las auditorías previas.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 297,
    "tipo": "item",
    "clausula": "8.6.3",
    "texto": "8.6.3 El organismo de inspección debe realizar auditorías internas periódicas que abarquen todos los procedimientos de manera planificada y sistemática, con el fin de verificar que el sistema de gestión está implementado y es eficaz.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 298,
    "tipo": "item",
    "clausula": "8.6.3 a)",
    "texto": "a. Las auditorías internas deberán incluir los procedimientos de inspección, por lo que además de auditar los registros de inspección, se deberá auditar la realización de las inspecciones.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 299,
    "tipo": "item",
    "clausula": "8.6.3 b)",
    "texto": "b. Las auditorías de los procesos de inspección no deben confundirse ni reemplazarse con las actividades de monitoreo (numeral 6.1.8 de la norma NCh ISO 17020:2012), ni con las acti vidades de observación in situ (numeral 6.1.9 de la norma NCh- ISO 17020:2012).",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 300,
    "tipo": "item",
    "clausula": "8.6.4",
    "texto": "8.6.4 Las auditorías internas se deben realizar al menos una vez cada 12 meses. La frecuencia de las auditorías internas se puede ajustar en función de la eficacia demostrada del sistema de gestión y su estabilidad probada.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 301,
    "tipo": "item",
    "clausula": "8.6.4 a)",
    "texto": "a. La frecuencia de las auditorías internas no se podrá ajustar a plazos superiores a 12 meses, pero sí para plazos inferiores.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 302,
    "tipo": "item",
    "clausula": "8.6.4 b)",
    "texto": "b. El OI debe garantizar que todos los requisitos de NCh-ISO 17020:2012 están cubiertos por el programa de auditoría interna, cada 12 meses. Además, los requisitos a ser cubiertos, deben ser considerados para todas las áreas de inspección y para todas las instalaciones donde se realizan actividades claves,\ndentro del ciclo de la acreditación.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 303,
    "tipo": "item",
    "clausula": "8.6.4 c)",
    "texto": "c. Cuando un organismo de inspección detecta problemas que afectan el cumplimiento de cualquier requisito de ISO/IEC 17020 (ej., un aumento en las quejas y apelaciones, resultados insatisfactorios en las auditorías externas, problemas con la calificación del personal, etc.), debe considerar aumentar la\nfrecuencia y profundidad de sus auditorías internas y/o ampliar su cobertura para incluir otras ubicaciones y campos de inspección.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 304,
    "tipo": "item",
    "clausula": "8.6.5",
    "texto": "8.6.5 El organismo de inspección debe asegurarse de que:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 305,
    "tipo": "item",
    "clausula": "8.6.5 a)",
    "texto": "a) las auditorías internas se realizan por personal calificado conocedor de la inspección, la auditoría y los requisitos de esta\nNorma",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 306,
    "tipo": "item",
    "clausula": "8.6.5 a)",
    "texto": "a. El personal que realiza  las auditorías internas  debe ser personal calificado por el OI. Los criterios  de calificación, deben incluir al menos:  conocimientos de la norma  NCh-ISO  17020:2012 (evidenciar capacitación), conocimiento en técnicas  de auditoría (evidenciar capacitación de auditor  interno  o auditor  líder) y conocimiento de las inspecciones a auditar  (evidenciar experiencia previa o tiempo  de permanencia mínimo  en el OI).",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 307,
    "tipo": "item",
    "clausula": "8.6.5 b)",
    "texto": "b) los auditores no auditen  su propio  trabajo;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 308,
    "tipo": "item",
    "clausula": "8.6.5 b)",
    "texto": "b. Si el personal que realiza  las auditorías internas  es personal externo, se debe demostrar el cumplimiento de los requisitos definidos en el criterio  anterior  y además, asegurar y garantizar la confidencialidad de la información a la que tenga acceso.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 309,
    "tipo": "item",
    "clausula": "8.6.5 c)",
    "texto": "c) el personal responsable del área auditada sea informado del resultado de la auditoría;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 310,
    "tipo": "item",
    "clausula": "8.6.5 d)",
    "texto": "d) cualquier acción  resultante de las auditorías internas  se tome de manera  oportuna y apropiada;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 311,
    "tipo": "item",
    "clausula": "8.6.5 e)",
    "texto": "e) se identifican las oportunidades de mejora;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 312,
    "tipo": "item",
    "clausula": "8.6.5 f)",
    "texto": "f) se documentan los resultados de la auditoría.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 313,
    "tipo": "titulo",
    "clausula": "8.7",
    "texto": "8.7 Acciones correctivas (Opción  A)",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 314,
    "tipo": "item",
    "clausula": "8.7.1",
    "texto": "8.7.1 El organismo de inspección debe establecer procedimientos para identificar y gestionar las no conformidades en sus operaciones.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 315,
    "tipo": "item",
    "clausula": "8.7.2",
    "texto": "8.7.2 El organismo de inspección también  debe, cuando  sea necesario, tomar medidas para eliminar  las causas  de las no conformidades con el fin de evitar que vuelvan  a ocurrir.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 316,
    "tipo": "item",
    "clausula": "8.7.3",
    "texto": "8.7.3 Las acciones correctivas deben ser apropiadas a las consecuencias de los problemas encontrados.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 317,
    "tipo": "item",
    "clausula": "8.7.4",
    "texto": "8.7.4 Los procedimientos deben definir  requisitos para:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 318,
    "tipo": "item",
    "clausula": "8.7.4 a)",
    "texto": "a) identificar no conformidades;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 319,
    "tipo": "item",
    "clausula": "8.7.4 b)",
    "texto": "b) determinar las causas  de las no conformidades;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 320,
    "tipo": "item",
    "clausula": "8.7.4 b)",
    "texto": "El procedimiento debe incluir la descripción de la(s) técnica(s) de análisis  de causas  que será(n)  utilizada(s) por el OI para el tratamiento de las no conformidades, así como los registros que evidencien la aplicación de dicha(s)  técnica(s)",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 321,
    "tipo": "item",
    "clausula": "8.7.4 c)",
    "texto": "c) corregir  las no conformidades;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 322,
    "tipo": "item",
    "clausula": "8.7.4 d)",
    "texto": "d) evaluar  la necesidad de emprender acciones para asegurarse de que las no conformidades no vuelvan  a ocurrir;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 323,
    "tipo": "item",
    "clausula": "8.7.4 e)",
    "texto": "e) determinar e implementar de manera  oportuna las acciones necesarias;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 324,
    "tipo": "item",
    "clausula": "8.7.4 f)",
    "texto": "f) registrar los resultados de las acciones tomadas;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 325,
    "tipo": "item",
    "clausula": "8.7.4 g)",
    "texto": "g) revisar  la eficacia  de las acciones correctivas.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 326,
    "tipo": "item",
    "clausula": "8.7.4 g)",
    "texto": "Para la revisión  de la eficacia  de la acción  correctiva implementada, se debe definir  en qué plazo y quién verificará la eficacia  a partir de la implementación de la acción  correctiva.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 327,
    "tipo": "titulo",
    "clausula": "8.8",
    "texto": "8.8 Acciones preventivas (Opción  A)",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 328,
    "tipo": "item",
    "clausula": "8.8.1",
    "texto": "8.8.1 El organismo de inspección debe establecer procedimientos para emprender acciones preventivas que eliminen las causas  de las no conformidades potenciales.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 329,
    "tipo": "item",
    "clausula": "8.8.1",
    "texto": "Las acciones preventivas son tomadas en un proceso  proactivo de identificación de potenciales no conformidades y oportunidades de mejora  y no como una reacción a la identificación de no conformidades, problemas o quejas.",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 330,
    "tipo": "item",
    "clausula": "8.8.2",
    "texto": "8.8.2 Las acciones preventivas tomadas deben ser apropiadas al probable efecto  de los problemas potenciales.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 331,
    "tipo": "item",
    "clausula": "8.8.3",
    "texto": "8.8.3 Los procedimientos relativos a las acciones preventivas deben definir  requisitos para:",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 332,
    "tipo": "item",
    "clausula": "8.8.3 a)",
    "texto": "a) identificar no conformidades potenciales y sus causas;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 333,
    "tipo": "item",
    "clausula": "8.8.3 a)",
    "texto": "El procedimiento debe incluir la descripción de la(s) técnica(s) de análisis  de causas  que será(n)  utilizada(s) por el OI para el tratamiento de las potenciales no conformidades, así como los registros que evidencien la aplicación de dicha(s)  técnica(s).",
    "fuente": "DA_D22",
    "vigente": true
  },
  {
    "orden": 334,
    "tipo": "item",
    "clausula": "8.8.3 b)",
    "texto": "b) evaluar  la necesidad de emprender acciones para prevenir la aparición de no conformidades;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 335,
    "tipo": "item",
    "clausula": "8.8.3 c)",
    "texto": "c) determinar e implementar la acción  necesaria;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 336,
    "tipo": "item",
    "clausula": "8.8.3 d)",
    "texto": "d) registrar los resultados de las acciones tomadas;",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 337,
    "tipo": "item",
    "clausula": "8.8.3 e)",
    "texto": "e) revisar  la eficacia  de las acciones preventivas tomadas.",
    "fuente": "ISO_17020",
    "vigente": true
  },
  {
    "orden": 338,
    "tipo": "titulo",
    "clausula": "Anexo A",
    "texto": "Requisitos de independencia para los Organismo de Inspección",
    "fuente": "ISO_17020",
    "vigente": true
  }
];

module.exports = {
  up: async (queryInterface) => {
    const { v4: uuidv4 } = require('uuid');
    const now = new Date();
    const rows = ITEMS.map((item) => ({
      id: uuidv4(),
      orden: item.orden,
      tipo: item.tipo,
      clausula: item.clausula,
      texto: item.texto,
      fuente: item.fuente,
      norma: 'ISO17020',
      vigente: item.vigente,
      creado_por: null,
      createdAt: now,
      updatedAt: now,
    }));
    await queryInterface.bulkInsert('checklist_template_items', rows);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('checklist_template_items', { norma: 'ISO17020' }, {});
  },
};
