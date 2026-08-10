'use strict';

// Datos base: PG 05-F07 Listado de verificacion laboratorios (ISO/IEC 17025:2017),
// clausulas 4 a 8. 'titulo' son filas de encabezado de seccion (no evaluables);
// 'item' son los puntos evaluables del checklist.
const ITEMS = [
  {
    "orden": 0,
    "tipo": "titulo",
    "clausula": null,
    "texto": "4. Requisitos Generales\n4.1 Imparcialidad",
    "vigente": true
  },
  {
    "orden": 1,
    "tipo": "item",
    "clausula": "4.1.1",
    "texto": "4.1.1 Las actividades del laboratorio se llevan a cabo de manera imparcial y estructurada",
    "vigente": true
  },
  {
    "orden": 2,
    "tipo": "item",
    "clausula": "4.1.2",
    "texto": "4.1.2 La dirección del laboratorio debe estar comprometida con la imparcialidad",
    "vigente": true
  },
  {
    "orden": 3,
    "tipo": "item",
    "clausula": "4.1.3",
    "texto": "4.1.3 El laboratorio debe ser responsable de la imparcialidad de sus actividades de laboratorio y no debe permitir presiones comerciales, financieras u otras que comprometan la imparcialidad.",
    "vigente": true
  },
  {
    "orden": 4,
    "tipo": "item",
    "clausula": "4.1.4",
    "texto": "4.1.4 El laboratorio debe identificar los riesgos a su imparcialidad de forma continua. Esto debe incluir aquellos riesgos que surgen de sus actividades o de sus relaciones, o de las relaciones de su personal. Sin embargo, estas relaciones no necesariamente presentan un riesgo para la imparcialidad del laboratorio.",
    "vigente": true
  },
  {
    "orden": 5,
    "tipo": "item",
    "clausula": "4.1.5",
    "texto": "4.1.5 Si se identifica un riesgo para la imparcialidad, el laboratorio debe tener capacidad para demostrar cómo se elimina o minimiza tal riesgo.",
    "vigente": true
  },
  {
    "orden": 6,
    "tipo": "titulo",
    "clausula": null,
    "texto": "4.2 Confidencialidad",
    "vigente": true
  },
  {
    "orden": 7,
    "tipo": "item",
    "clausula": "4.2.1",
    "texto": "4.2.1 El laboratorio debe ser responsable, por medio de acuerdos legalmente ejecutables, de la gestión de toda la información obtenida o creada durante la realización de actividades del laboratorio.\nEl laboratorio debe informar al cliente, con antelación, acerca de la información que pretende poner al alcance del público. Excepto por la información que el cliente pone a disposición del público, o cuando lo acuerdan el laboratorio y el cliente (por ejemplo, con el propósito de responder a las quejas), cualquier otra información se considera información del propietario y se debe considerar confidencial.",
    "vigente": true
  },
  {
    "orden": 8,
    "tipo": "item",
    "clausula": "4.2.2",
    "texto": "4.2.2 Cuando se requiera información por la autoridad para revelar información requerida y confidencia, el cliente debe ser notificado salvo que se prohíba ley.",
    "vigente": true
  },
  {
    "orden": 9,
    "tipo": "item",
    "clausula": "4.2.4",
    "texto": "4.2.4 El personal, incluido cualquier miembro de comité, contratista, personal de organismos externos o individuos que actúen en nombre del laboratorio debe mantener la confidencialidad de toda información obtenida o creada durante la realización de las actividades del laboratorio, excepto lo requerido por ley.",
    "vigente": true
  },
  {
    "orden": 10,
    "tipo": "titulo",
    "clausula": null,
    "texto": "5 Requisitos relativos a la estructura",
    "vigente": true
  },
  {
    "orden": 11,
    "tipo": "item",
    "clausula": "5.1",
    "texto": "5.1 El laboratorio debe ser una entidad legal o una parte definida de una entidad legal, que es responsable legalmente de sus actividades de laboratorio.",
    "vigente": true
  },
  {
    "orden": 12,
    "tipo": "item",
    "clausula": "5.2",
    "texto": "5.2 El laboratorio debe identificar el personal de la dirección que tiene la responsabilidad general del laboratorio.",
    "vigente": true
  },
  {
    "orden": 13,
    "tipo": "item",
    "clausula": "5.3",
    "texto": "5.3 El laboratorio debe definir y documentar el alcance de las actividades de laboratorio que cumplen con este documento. \nEl laboratorio solo debe declarar conformidad con este documento para este alcance de las actividades de laboratorio, lo cual excluye las actividades de laboratorio que son suministradas externamente en forma continua.",
    "vigente": true
  },
  {
    "orden": 14,
    "tipo": "item",
    "clausula": "5.4",
    "texto": "5.4 Las actividades de laboratorio se deben llevar a cabo de manera que cumplan los requisitos de este documento, de los clientes del laboratorio, de las autoridades reglamentarias y de las organizaciones que otorgan reconocimiento. \nLo anterior debe incluir las actividades de laboratorio realizadas en todas sus instalaciones permanentes, en sitios fuera de sus instalaciones permanentes, en\ninstalaciones temporales o móviles asociadas, o en las instalaciones del cliente",
    "vigente": true
  },
  {
    "orden": 15,
    "tipo": "item",
    "clausula": "5.5",
    "texto": "5.5 El laboratorio debe:\nDefinir la organización y la estructura de gestión del laboratorio, su ubicación dentro de una organización matriz, y las relaciones entre la gestión, las operaciones técnicas y los servicios de apoyo.\n Especificar la responsabilidad, autoridad e interrelación de todo el personal que dirige, realiza o verifica el trabajo que afecta a los resultados de las actividades de laboratorio\nDocumentar sus procedimientos en la extensión necesaria para asegurar la aplicación coherente de sus actividades de laboratorio y la validez de los resultados.",
    "vigente": true
  },
  {
    "orden": 16,
    "tipo": "item",
    "clausula": "5.6",
    "texto": "5.6 El laboratorio debe contar con personal que, independientemente de otras responsabilidades que tenga la autoridad y los recursos necesarios para llevar a cabo sus tareas, que incluyen:",
    "vigente": true
  },
  {
    "orden": 17,
    "tipo": "item",
    "clausula": null,
    "texto": "la implementación, el mantenimiento y la mejora del sistema de gestión;",
    "vigente": true
  },
  {
    "orden": 18,
    "tipo": "item",
    "clausula": null,
    "texto": "la identificación de las desviaciones del sistema de gestión, o de los procedimientos para la\nrealización de las actividades de laboratorio;",
    "vigente": true
  },
  {
    "orden": 19,
    "tipo": "item",
    "clausula": null,
    "texto": "el inicio de acciones para prevenir o minimizar tales desviaciones;",
    "vigente": true
  },
  {
    "orden": 20,
    "tipo": "item",
    "clausula": null,
    "texto": "informar a la dirección del laboratorio acerca del desempeño del sistema de gestión y de cualquier\nnecesidad de mejora;",
    "vigente": true
  },
  {
    "orden": 21,
    "tipo": "item",
    "clausula": null,
    "texto": "asegurar la eficacia de las actividades de laboratorio.",
    "vigente": true
  },
  {
    "orden": 22,
    "tipo": "titulo",
    "clausula": null,
    "texto": "5.7 La dirección del laboratorio debe asegurarse de\n       que:",
    "vigente": true
  },
  {
    "orden": 23,
    "tipo": "item",
    "clausula": null,
    "texto": "Se efectúa la comunicación relativa a la eficacia del sistema de gestión y a la importancia de cumplir los requisitos del cliente y otros requisitos",
    "vigente": true
  },
  {
    "orden": 24,
    "tipo": "item",
    "clausula": null,
    "texto": "Se mantiene la integridad del sistema de gestión cuando se planifican e implementan cambios de éste.",
    "vigente": true
  },
  {
    "orden": 25,
    "tipo": "titulo",
    "clausula": null,
    "texto": "6 Requisitos relativos a los recursos",
    "vigente": true
  },
  {
    "orden": 26,
    "tipo": "item",
    "clausula": "6",
    "texto": "6.1Generalidades\nEl laboratorio debe tener disponibles el personal, las instalaciones, el equipamiento, los sistemas y los servicios de apoyo necesarios para gestionar y realizar sus actividades de laboratorio.",
    "vigente": true
  },
  {
    "orden": 27,
    "tipo": "titulo",
    "clausula": null,
    "texto": "6.2 Personal",
    "vigente": true
  },
  {
    "orden": 28,
    "tipo": "item",
    "clausula": "6.2.1",
    "texto": "6.2.1 Todo el personal del laboratorio ya sea interno o externo, que puede influir en las actividades de laboratorio debe actuar imparcialmente, ser competente y trabajar de acuerdo con el sistema de gestión del laboratorio.",
    "vigente": true
  },
  {
    "orden": 29,
    "tipo": "item",
    "clausula": "6.2.2",
    "texto": "6.2.2 El laboratorio debe documentar los requisitos de competencia para cada función que influye en los resultados de las actividades del laboratorio, incluidos los requisitos de educación, calificación, formación, conocimiento técnico, habilidades y experiencia.",
    "vigente": true
  },
  {
    "orden": 30,
    "tipo": "item",
    "clausula": "6.2.3",
    "texto": "6.2.3 El laboratorio debe asegurarse de que el personal tiene la competencia para realizar las actividades de laboratorio de las cuales es responsable y para evaluar la importancia de las desviaciones.",
    "vigente": true
  },
  {
    "orden": 31,
    "tipo": "item",
    "clausula": "6.2.4",
    "texto": "6.2.4 La dirección del laboratorio debe comunicar al personal sus tareas, responsabilidades y autoridad",
    "vigente": true
  },
  {
    "orden": 32,
    "tipo": "item",
    "clausula": "6.2.5",
    "texto": "6.2.5 El laboratorio debe tener procedimientos y conservar registros para:\nDeterminar los requisitos de competencia.\nSeleccionar al personal.\nFormar al personal.\nSupervisar al personal.\nAutorizar al personal.\nRealizar el seguimiento de la competencia del personal.",
    "vigente": true
  },
  {
    "orden": 33,
    "tipo": "item",
    "clausula": "6.2.6",
    "texto": "6.2.6 El laboratorio debe autorizar al personal para llevar a cabo actividades de laboratorio específicas incluidas, pero no limitadas a las siguientes:\nDesarrollar, modificar, verificar y validar métodos.\nAnalizar los resultados, incluidas las declaraciones de conformidad o las opiniones e interpretaciones.\nInformar, revisar y autorizar los resultados.",
    "vigente": true
  },
  {
    "orden": 34,
    "tipo": "titulo",
    "clausula": null,
    "texto": "6.3 Instalaciones y condiciones ambientales",
    "vigente": true
  },
  {
    "orden": 35,
    "tipo": "item",
    "clausula": "6.3.1",
    "texto": "6.3.1 Las instalaciones y las condiciones ambientales deben ser adecuadas para las actividades del laboratorio y no deben afectar adversamente a la validez de los resultados.",
    "vigente": true
  },
  {
    "orden": 36,
    "tipo": "item",
    "clausula": "6.3.2",
    "texto": "6.3.2 Se deben documentar los requisitos para las instalaciones y las condiciones ambientales necesarias para realizar las actividades de laboratorio.",
    "vigente": true
  },
  {
    "orden": 37,
    "tipo": "item",
    "clausula": "6.3.3",
    "texto": "6.3.3 El laboratorio debe realizar el seguimiento, controlar y registrar las condiciones ambientales de acuerdo con las especificaciones, los métodos o procedimientos pertinentes, o cuando influyen en la validez de los resultados.",
    "vigente": true
  },
  {
    "orden": 38,
    "tipo": "item",
    "clausula": "6.3.4",
    "texto": "6.3.4 Se deben implementar, realizar el seguimiento de y revisar periódicamente las medidas para controlar las instalaciones y deben incluir, pero no limitarse a, lo siguiente:\n\nacceso y uso de áreas que afecten a las actividades de laboratorio;\nprevención de contaminación, interferencia o influencias adversas en las actividades de laboratorio\nseparación eficaz entre áreas en las cuales hay actividades de laboratorio incompatibles.",
    "vigente": true
  },
  {
    "orden": 39,
    "tipo": "item",
    "clausula": "6.3.5",
    "texto": "6.3.5 Cuando el laboratorio realiza actividades de laboratorio en sitios o instalaciones que están fuera de su control permanente, debe asegurarse de que se cumplan los requisitos relacionados con las instalaciones y condiciones ambientales de este documento.",
    "vigente": true
  },
  {
    "orden": 40,
    "tipo": "titulo",
    "clausula": null,
    "texto": "6.4 Equipamiento",
    "vigente": true
  },
  {
    "orden": 41,
    "tipo": "item",
    "clausula": "6.4.1",
    "texto": "6.4.1 El laboratorio debe tener acceso al equipamiento (incluidos, pero sin limitarse a, instrumentos de medición, software, patrones de medición, materiales de referencia, datos de referencia, reactivos, consumibles o aparatos auxiliares) que se requiere para el correcto desempeño de las actividades de laboratorio y que pueden influir en los resultados.",
    "vigente": true
  },
  {
    "orden": 42,
    "tipo": "item",
    "clausula": "6.4.2",
    "texto": "6.4.2 Cuando el laboratorio utiliza equipamiento que está fuera de su control permanente, debe asegurarse de que se cumplan los requisitos de este documento para el equipamiento.",
    "vigente": true
  },
  {
    "orden": 43,
    "tipo": "item",
    "clausula": "6.4.3",
    "texto": "6.4.3 El laboratorio debe contar con un procedimiento para la manipulación, transporte, almacenamiento, uso y mantenimiento planificado del equipamiento para asegurar el funcionamiento apropiado y con el fin de prevenir contaminación o deterioro.",
    "vigente": true
  },
  {
    "orden": 44,
    "tipo": "item",
    "clausula": "6.4.4",
    "texto": "6.4.4 El laboratorio debe verificar que el equipamiento cumple los requisitos especificados, antes de ser instalado o reinstalado para su servicio.",
    "vigente": true
  },
  {
    "orden": 45,
    "tipo": "item",
    "clausula": "6.4.5",
    "texto": "6.4.5 El equipo utilizado para medición debe ser capaz de lograr la exactitud de la medición y/o la incertidumbre de medición requeridas para proporcionar un resultado válido.",
    "vigente": true
  },
  {
    "orden": 46,
    "tipo": "item",
    "clausula": "6.4.6",
    "texto": "6.4.6 El equipo de medición debe ser calibrado cuando:\nLa exactitud o la incertidumbre de medición afectan a la validez de los resultados informados, y/o\nSe requiere la calibración del equipo para establecer la trazabilidad metrológica de los resultados informados.\nLa medición directa del mensurando, por ejemplo, el uso de una balanza para llevar a cabo una medición de\nmasa;\nLa realización de correcciones al valor medido, por ejemplo, las mediciones de temperatura;\nLa obtención de un resultado de medición calculado a partir de magnitudes múltiples.",
    "vigente": true
  },
  {
    "orden": 47,
    "tipo": "item",
    "clausula": "6.4.7",
    "texto": "6.4.7 El laboratorio debe establecer un programa de calibración, el cual se debe revisar y ajustar según sea necesario, para mantener la confianza en el estado de la calibración.",
    "vigente": true
  },
  {
    "orden": 48,
    "tipo": "item",
    "clausula": "6.4.8",
    "texto": "6.4.8 Todos los equipos que requieran calibración o que tengan un periodo de validez definido se deben etiquetar, codificar o identificar de otra manera para permitir que el usuario de los equipos identifique fácilmente el estado de la calibración o el periodo de validez.",
    "vigente": true
  },
  {
    "orden": 49,
    "tipo": "item",
    "clausula": "6.4.9",
    "texto": "6.4.9 El equipo que haya sido sometido a una sobrecarga o a uso inadecuado, que dé resultados cuestionables, o se haya demostrado que está defectuoso o que está fuera de los requisitos especificados, debe ser puesto fuera de servicio. Éste se debe aislar para evitar su uso o se debe rotular o marcar claramente que está fuera de servicio hasta que se haya verificado que funciona correctamente. El laboratorio debe examinar el efecto del defecto o de la desviación respecto a los requisitos especificados, y debe iniciar la gestión del procedimiento de trabajo no conforme (véase 7.10)",
    "vigente": true
  },
  {
    "orden": 50,
    "tipo": "item",
    "clausula": "6.4.10",
    "texto": "6.4.10 Cuando sean necesarias comprobaciones intermedias para mantener confianza en el desempeño del equipo, estas comprobaciones se deben llevar a cabo de acuerdo con un procedimiento.",
    "vigente": true
  },
  {
    "orden": 51,
    "tipo": "item",
    "clausula": "6.4.11",
    "texto": "6.4.11 Cuando los datos de calibración y de los materiales de referencia incluyen valores de referencia o factores de corrección, el laboratorio debe asegurar que los valores de referencia y los factores de corrección se actualizan e implementan, según sea apropiado, para cumplir con los\nrequisitos especificados.",
    "vigente": true
  },
  {
    "orden": 52,
    "tipo": "item",
    "clausula": "6.4.12",
    "texto": "6.4.12 El laboratorio debe tomar acciones viables para evitar ajustes no previstos del equipo que invalidarían los resultados.",
    "vigente": true
  },
  {
    "orden": 53,
    "tipo": "item",
    "clausula": "6.4.13",
    "texto": "6.4.13 Se deben conservar registros de los equipos que pueden influir en las actividades del laboratorio. \nLos registros deben incluir lo siguiente, cuando sea aplicable:\n\nLa identificación del equipo, incluida la versión del software y del firmware.\n El nombre del fabricante, la identificación del tipo y el número de serie u otra identificación única.\n La evidencia de la verificación de que el equipo cumple los requisitos especificados.\nLa ubicación actual.\nLas fechas de la calibración, los resultados de las calibraciones, los ajustes, los criterios de aceptación y la fecha de la próxima calibración o el intervalo de calibración.",
    "vigente": true
  },
  {
    "orden": 54,
    "tipo": "item",
    "clausula": null,
    "texto": "La documentación de los materiales de referencia, los resultados, los criterios de aceptación, las fechas pertinentes y el período de validez.\nEl plan de mantenimiento y el mantenimiento llevado a cabo hasta la fecha, cuando sea pertinente para el desempeño del equipo.\nLos detalles de cualquier daño, mal funcionamiento, modificación o reparación realizada al equipo.",
    "vigente": true
  },
  {
    "orden": 55,
    "tipo": "titulo",
    "clausula": null,
    "texto": "6.5 Trazabilidad metrológica",
    "vigente": true
  },
  {
    "orden": 56,
    "tipo": "item",
    "clausula": "6.5.1",
    "texto": "6.5.1 El laboratorio debe establecer y mantener la trazabilidad metrológica de los resultados de sus\nmediciones por medio de una cadena ininterrumpida y documentada de calibraciones, cada una de las cuales contribuye a la incertidumbre de medición, vinculándolos con la referencia apropiada.",
    "vigente": true
  },
  {
    "orden": 57,
    "tipo": "item",
    "clausula": "6.5.2",
    "texto": "6.5.2 El laboratorio debe asegurarse de que los resultados de la medición sean trazables al Sistema Internacional de Unidades (SI) mediante:\nLa calibración proporcionada por un laboratorio competente; o\nLos valores certificados de materiales de referencia certificados proporcionados por productores competentes con trazabilidad metrológica establecida al SI; o\nLa realización directa de unidades del SI aseguradas por comparación, directa o indirecta, con patrones nacionales o internacionales.",
    "vigente": true
  },
  {
    "orden": 58,
    "tipo": "item",
    "clausula": "6.5.3",
    "texto": "6.5.3 Cuando la trazabilidad metrológica a unidades del SI no sea técnicamente posible, el laboratorio debe demostrar trazabilidad metrológica a una referencia apropiada, como, por ejemplo:\n\nValores certificados de materiales de referencia certificados suministrados por un productor competente.\n\nResultados de los procedimientos de medición de referencia, métodos especificados o normas de\nconsenso que están descritos claramente y son aceptados, en el sentido de que proporcionan\nresultados de medición adecuados para su uso previsto y asegurados mediante comparación adecuada.",
    "vigente": true
  },
  {
    "orden": 59,
    "tipo": "titulo",
    "clausula": null,
    "texto": "6.6 Productos y servicios suministrados externamente",
    "vigente": true
  },
  {
    "orden": 60,
    "tipo": "item",
    "clausula": "6.6.1",
    "texto": "6.6.1 El laboratorio debe asegurarse de que los productos y servicios suministrados externamente, que afectan a las actividades del laboratorio, sean adecuados y utilizados únicamente cuando estos productos y servicios:\nEstán previstos para la incorporación a las actividades propias de laboratorio.\nSe suministran, parcial o totalmente, directamente al cliente por el laboratorio, como se reciben del proveedor externo.\nSe utilizan para apoyar la operación del laboratorio.",
    "vigente": true
  },
  {
    "orden": 61,
    "tipo": "item",
    "clausula": "6.6.2",
    "texto": "6.6.2 El laboratorio debe contar con un procedimiento y conservar registros para:\n\nDefinir, revisar y aprobar los requisitos del laboratorio para productos y servicios suministrados externamente.\nDefinir los criterios para la evaluación, selección, seguimiento del desempeño y reevaluación de los proveedores externos.\nHay que asegurar que los productos y servicios suministrados externamente cumplen los requisitos establecidos por el laboratorio, o cuando sean aplicables, los requisitos pertinentes de este documento, antes de que dichos productos o servicios se usen o se suministren al cliente.\nEmprender cualquier acción que surja de las evaluaciones, del seguimiento del desempeño y de las reevaluaciones de los proveedores externos.",
    "vigente": true
  },
  {
    "orden": 62,
    "tipo": "item",
    "clausula": "6.6.3",
    "texto": "6.6.3 El laboratorio debe comunicar a los proveedores externos sus requisitos para:\n\n\nlos productos y servicios que se van a suministrar. \nlos criterios de aceptación;\nla competencia, incluyendo cualquier calificación requerida del personal.\nlas actividades que el laboratorio o sus clientes pretendan llevar a cabo en las instalaciones del proveedor externo.",
    "vigente": true
  },
  {
    "orden": 63,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7 Requisitos del proceso\n7.1 Revisión de solicitudes, ofertas y contratos",
    "vigente": true
  },
  {
    "orden": 64,
    "tipo": "item",
    "clausula": "7.1.1",
    "texto": "7.1.1 El laboratorio debe contar con un procedimiento para la revisión de solicitudes, ofertas y contratos. El procedimiento debe asegurar que:\nlos requisitos se definan, documenten    y comprendan adecuadamente.\nel laboratorio cuenta con la capacidad y los recursos para cumplir los requisitos.\nCuando se utilizan proveedores externos, se aplican los requisitos del apartado 6.6 y el laboratorio informe al cliente sobre las actividades de laboratorio específicas que serán realizadas por\nproveedores externos y obtenga la aprobación del cliente:",
    "vigente": true
  },
  {
    "orden": 65,
    "tipo": "item",
    "clausula": null,
    "texto": "El laboratorio tiene los recursos y las competencias para llevar a cabo las actividades, sin embargo, por\nrazones imprevistas no tiene la capacidad de llevarlas a cabo en parte o totalmente\nEl laboratorio no tiene los recursos o la competencia para llevar a cabo las actividades.\n\nSe seleccionan los métodos o procedimientos adecuados y que sean capaces de cumplir los\nrequisitos del cliente",
    "vigente": true
  },
  {
    "orden": 66,
    "tipo": "item",
    "clausula": "7.1.2",
    "texto": "7.1.2 El laboratorio debe informar al cliente cuando el método solicitado por éste se considere inapropiado o desactualizado.",
    "vigente": true
  },
  {
    "orden": 67,
    "tipo": "item",
    "clausula": "7.1.3",
    "texto": "7.1.3 Cuando el cliente solicite una declaración de conformidad con una especificación o norma para\nel ensayo o calibración (por ejemplo, pasa/no pasa, dentro de tolerancia/fuera de tolerancia), se deben\ndefinir claramente la especificación o la norma y la regla de decisión. La regla de decisión seleccionada\nse debe comunicar y acordar con el cliente, a menos que sea inherente a la especificación o a la norma\nsolicitada.",
    "vigente": true
  },
  {
    "orden": 68,
    "tipo": "item",
    "clausula": "7.1.4",
    "texto": "7.1.4 Cualquier diferencia entre la solicitud o la oferta y el contrato se debe resolver antes de que\ncomiencen las actividades de laboratorio. Cada contrato debe ser aceptable tanto para el laboratorio\ncomo para el cliente. Las desviaciones solicitadas por el cliente no deben tener impacto sobre la\nintegridad del laboratorio o sobre la validez de los resultados.",
    "vigente": true
  },
  {
    "orden": 69,
    "tipo": "item",
    "clausula": "7.1.5",
    "texto": "7.1.5 Se debe informar al cliente de cualquier desviación del contrato.",
    "vigente": true
  },
  {
    "orden": 70,
    "tipo": "item",
    "clausula": "7.1.6",
    "texto": "7.1.6 Si un contrato es modificado después de que el trabajo ha comenzado, se debe repetir la revisión\ndel contrato y cualquier modificación se debe comunicar a todo el personal afectado.",
    "vigente": true
  },
  {
    "orden": 71,
    "tipo": "item",
    "clausula": "7.1.7",
    "texto": "7.1.7 El laboratorio debe cooperar con los clientes o con sus representantes para aclarar las\nsolicitudes de los clientes y realizar seguimiento del desempeño del laboratorio en relación con el\ntrabajo realizado.\nproporcionar acceso razonable a las áreas pertinentes del laboratorio para presenciar actividades de laboratorio específicas del cliente.\npreparar, embalar y enviar ítems que necesita el cliente para propósitos de verificación.",
    "vigente": true
  },
  {
    "orden": 72,
    "tipo": "item",
    "clausula": "7.1.8",
    "texto": "7.1.8 Se deben conservar registros de las revisiones, incluido cualquier cambio significativo. También se deben conservar registros de las discusiones pertinentes con los clientes acerca de los requisitos de estos, o de los resultados de las actividades de laboratorio.",
    "vigente": true
  },
  {
    "orden": 73,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.2 Selección, verificación y validación de métodos\n7.2.1 Selección y verificación de métodos",
    "vigente": true
  },
  {
    "orden": 74,
    "tipo": "item",
    "clausula": "7.2.1.1",
    "texto": "7.2.1.1 El laboratorio debe usar métodos y procedimientos apropiados para todas las actividades de laboratorio y, cuando sea apropiado, para la evaluación de la incertidumbre de medición, así como también las técnicas estadísticas para el análisis de datos.",
    "vigente": true
  },
  {
    "orden": 75,
    "tipo": "item",
    "clausula": "7.2.1.2",
    "texto": "7.2.1.2 Todos los métodos, procedimientos y documentación de soporte, tales como instrucciones, normas, manuales y datos de referencia pertinentes a las actividades de laboratorio se deben mantener\nactualizadas y fácilmente disponibles para el personal (véase 8.3).",
    "vigente": true
  },
  {
    "orden": 76,
    "tipo": "item",
    "clausula": "7.2.1.3",
    "texto": "7.2.1.3 El laboratorio debe asegurarse de que utiliza la última versión vigente de un método, a\nmenos que no sea apropiado o posible. Cuando sea necesario, la aplicación del método se debe\ncomplementar con detalles adicionales para asegurar su aplicación de forma coherente.",
    "vigente": true
  },
  {
    "orden": 77,
    "tipo": "item",
    "clausula": "7.2.1.4",
    "texto": "7.2.1.4 Cuando el cliente no especifica el método a utilizar, el laboratorio debe seleccionar un\nmétodo apropiado e informar al cliente acerca del método elegido. \nSe recomiendan los métodos\npublicados en normas internacionales, regionales o nacionales o por organizaciones técnicas\nreconocidas, o en textos o revistas científicas pertinentes, o como lo especifique el fabricante del equipo.\nTambién se pueden utilizar métodos desarrollados por el laboratorio o modificados.",
    "vigente": true
  },
  {
    "orden": 78,
    "tipo": "item",
    "clausula": "7.2.1.5",
    "texto": "7.2.1.5 El laboratorio debe verificar que puede llevar a cabo apropiadamente los métodos antes de\nutilizarlos, asegurando que se pueda lograr el desempeño requerido. \n\nSe deben conservar registros de la verificación. Si el método es modificado por el organismo que lo publicó, la verificación se debe repetir, en la extensión necesaria.",
    "vigente": true
  },
  {
    "orden": 79,
    "tipo": "item",
    "clausula": "7.2.1.6",
    "texto": "7.2.1.6 Cuando se requiere desarrollar un método, debe ser una actividad planificada y se debe\nasignar a personal competente provisto con recursos adecuados. \nA medida que se desarrolla el método,\nse deben llevar a cabo revisiones periódicas para confirmar que se siguen satisfaciendo las necesidades del cliente. \nCualquier modificación al plan de desarrollo debe estar aprobada y autorizada.",
    "vigente": true
  },
  {
    "orden": 80,
    "tipo": "item",
    "clausula": "7.2.1.7",
    "texto": "7.2.1.7 Las desviaciones a los métodos para todas las actividades de laboratorio solamente deben\nsuceder si la desviación ha sido documentada, justificada técnicamente, autorizada y aceptada por el cliente.",
    "vigente": true
  },
  {
    "orden": 81,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.2.2 Validación de los métodos",
    "vigente": true
  },
  {
    "orden": 82,
    "tipo": "item",
    "clausula": "7.2.2.1",
    "texto": "7.2.2.1 El laboratorio debe validar los métodos no normalizados, los métodos desarrollados por el\nlaboratorio y los métodos normalizados utilizados fuera de su alcance previsto o modificados de otra\nforma. La validación debe ser tan amplia como sea necesaria para satisfacer las necesidades de la\naplicación o del campo de aplicación dados.\n\nLa calibración o evaluación del sesgo y precisión utilizando patrones de referencia o materiales de referencia\nUna evaluación sistemática de los factores que influyen en el resultado.",
    "vigente": true
  },
  {
    "orden": 83,
    "tipo": "item",
    "clausula": null,
    "texto": "La robustez del método de ensayo a través de la variación de parámetros controlados, tales como la temperatura de la incubadora, el volumen suministrado.\nLa comparación de los resultados obtenidos con otros métodos validados.\nLas comparaciones interlaboratorio.\nLa evaluación de la incertidumbre de medición de los resultados basada en la comprensión de los principios\nteóricos de los métodos y en la experiencia práctica del desempeño del método de muestreo o ensayo.",
    "vigente": true
  },
  {
    "orden": 84,
    "tipo": "item",
    "clausula": "7.2.2.2",
    "texto": "7.2.2.2 Cuando se hacen cambios a un método validado, se debe determinar la influencia de estos cambios, y cuando se encuentre que éstos afectan la validación inicial, se debe realizar una nueva\nvalidación del método.",
    "vigente": true
  },
  {
    "orden": 85,
    "tipo": "item",
    "clausula": "7.2.2.3",
    "texto": "7.2.2.3 Las características de desempeño de los métodos validados tal como fueron evaluadas para su uso previsto, deben ser pertinentes para las necesidades del cliente y deben ser coherentes con los requisitos especificados.",
    "vigente": true
  },
  {
    "orden": 86,
    "tipo": "item",
    "clausula": "7.2.2.4",
    "texto": "7.2.2.4 El laboratorio debe conservar los siguientes registros de validación:\n\nEl procedimiento de validación utilizado.\nLa especificación de los requisitos.\nLa determinación de las características de desempeño del método.\nLos resultados obtenidos.\nUna  declaración de la validez del método, detallando su aptitud para el uso previsto.",
    "vigente": true
  },
  {
    "orden": 87,
    "tipo": "item",
    "clausula": "7.3",
    "texto": "7.3 Muestreo (Cuando Aplique)",
    "vigente": true
  },
  {
    "orden": 88,
    "tipo": "item",
    "clausula": "7.3.1",
    "texto": "7.3.1 El laboratorio debe tener un plan y un método de muestreo cuando realiza el muestreo de\nsustancias, materiales o productos para el subsiguiente ensayo o calibración. El método de muestreo\ndebe considerar los factores a controlar, para asegurar la validez de los resultados del subsiguiente\nensayo o calibración. El plan y el método de muestreo deben estar disponibles en el sitio donde se lleva\na cabo el muestreo. Siempre que sea razonable, los planes de muestreo deben basarse en métodos\nestadísticos apropiados.",
    "vigente": true
  },
  {
    "orden": 89,
    "tipo": "item",
    "clausula": "7.3.2",
    "texto": "7.3.2 El método de muestreo debe describir:\n\n\na) la selección de muestra o sitios;\nb) el plan de muestreo;\nc) la preparación y tratamiento de muestras de una sustancia, material o producto para obtener el item requerido para el subsiguiente ensayo o calibración.",
    "vigente": true
  },
  {
    "orden": 90,
    "tipo": "item",
    "clausula": "7.3.3",
    "texto": "7.3.3 El laboratorio debe conservar los registros de los datos de muestreo",
    "vigente": true
  },
  {
    "orden": 91,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.4 Manipulación de los ítems de ensayo o calibración",
    "vigente": true
  },
  {
    "orden": 92,
    "tipo": "item",
    "clausula": "7.4.1",
    "texto": "7.4.1 El laboratorio debe contar con un procedimiento para el transporte, recepción, manipulación, protección, almacenamiento, conservación y disposición o devolución de los ítems de ensayo o calibración, incluidas todas las disposiciones necesarias para proteger la integridad del ítem de ensayo\no calibración, y para proteger los intereses del laboratorio y del cliente. Se deben tomar precauciones para evitar el deterioro, la contaminación, la pérdida o el daño del ítem durante la manipulación, el\ntransporte, el almacenamiento/espera, y la preparación para el ensayo o calibración. Se deben seguir las instrucciones de manipulación suministradas con el ítem.",
    "vigente": true
  },
  {
    "orden": 93,
    "tipo": "item",
    "clausula": "7.4.2",
    "texto": "7.4.2 El laboratorio debe contar con un sistema para identificar sin ambigüedades los ítems de ensayo o de calibración. \nLa identificación se debe conservar mientras el ítem esté bajo la responsabilidad del\nlaboratorio. \nEl sistema debe asegurar que los ítems no se confundan físicamente o cuando se haga referencia a ellos en registros o en otros documentos. \nEl sistema debe, si es apropiado, permitir la subdivisión de un ítem o grupos de ítems y la transferencia de ítems.",
    "vigente": true
  },
  {
    "orden": 94,
    "tipo": "item",
    "clausula": "7.4.3",
    "texto": "7.4.3 Al recibir el ítem de calibración o ensayo, se deben registrar las desviaciones de las condiciones\nespecificadas. \nCuando exista duda acerca de la adecuación de un ítem para ensayo o calibración, o cuando un ítem no cumpla con la descripción suministrada, el laboratorio debe consultar al cliente para obtener instrucciones adicionales antes de proceder, y debe registrar los resultados de esta consulta.\nCuando el cliente requiere que el ítem se ensaye o calibre admitiendo una desviación de las condiciones especificadas, el laboratorio debe incluir en el informe un descargo de responsabilidad en el que se indique qué resultados pueden ser afectados por la desviación.",
    "vigente": true
  },
  {
    "orden": 95,
    "tipo": "item",
    "clausula": "7.4.4",
    "texto": "7.4.4 Cuando los ítems necesiten ser almacenados o acondicionados bajo condiciones ambientales\nespecificadas, se deben mantener, realizar el seguimiento y registrar estas condiciones.",
    "vigente": true
  },
  {
    "orden": 96,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.5 Registros técnicos",
    "vigente": true
  },
  {
    "orden": 97,
    "tipo": "item",
    "clausula": "7.5.1",
    "texto": "7.5.1 El laboratorio debe asegurar que los registros técnicos para cada actividad de laboratorio contengan los resultados, el informe y la información suficiente para facilitar, si es posible, la identificación de los factores que afectan al resultado de la medición y su incertidumbre de medición asociada y posibiliten la repetición de la actividad del laboratorio en condiciones lo más cercanas posibles a las originales. \nLos registros técnicos deben incluir la fecha y la identidad del personal responsable de cada actividad del laboratorio y de comprobar los datos y los resultados. \nLas observaciones, los datos y los cálculos originales se deben registrar en el momento en que se hacen y deben identificarse con la tarea específica.",
    "vigente": true
  },
  {
    "orden": 98,
    "tipo": "item",
    "clausula": "7.5.2",
    "texto": "7.5.2 El laboratorio debe asegurar que las modificaciones a los registros técnicos pueden ser trazables a las versiones anteriores o a las observaciones originales. \nSe deben conservar tanto los datos y archivos originales como los modificados, incluida la fecha de corrección, una indicación de los aspectos corregidos y el personal responsable de las correcciones.",
    "vigente": true
  },
  {
    "orden": 99,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.6 Evaluación de la incertidumbre de medición",
    "vigente": true
  },
  {
    "orden": 100,
    "tipo": "item",
    "clausula": "7.6.1",
    "texto": "7.6.1 Los laboratorios deben identificar las contribuciones a la incertidumbre de medición. Cuando se evalúa la incertidumbre de medición, se deben tener en cuenta todas las contribuciones que son significativas, incluidas aquellas que surgen del muestreo, utilizando los métodos apropiados de análisis.",
    "vigente": true
  },
  {
    "orden": 101,
    "tipo": "item",
    "clausula": "7.6.2",
    "texto": "7.6.2 Un laboratorio que realiza calibraciones, incluidas las de sus propios equipos, debe evaluar la incertidumbre de medición para todas las calibraciones.",
    "vigente": true
  },
  {
    "orden": 102,
    "tipo": "item",
    "clausula": "7.6.3",
    "texto": "7.6.3 Un laboratorio que realiza ensayos debe evaluar la incertidumbre de medición. Cuando el método de ensayo no permite una evaluación rigurosa de la incertidumbre de medición, se debe realizar una estimación basada en la comprensión de los principios teóricos o la experiencia práctica de la realización del método.",
    "vigente": true
  },
  {
    "orden": 103,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.7 Aseguramiento de la validez de los resultados",
    "vigente": true
  },
  {
    "orden": 104,
    "tipo": "item",
    "clausula": "7.7.1",
    "texto": "7.7.1 El laboratorio debe contar con un procedimiento para hacer el seguimiento de la validez de los resultados. \nLos datos resultantes se deben registrar de manera que las tendencias sean detectables y cuando sea posible, se deben aplicar técnicas estadísticas para la revisión de los resultados. \nEste seguimiento se debe planificar y revisar y debe incluir, cuando sea apropiado, pero sin limitarse a:\nuso de materiales de referencia o materiales de control de calidad;\nuso de instrumentos alternativos que han sido calibrados para obtener resultados trazables;\ncomprobaciones funcionales del equipamiento de ensayo y de medición;\nuso de patrones de verificación o patrones de trabajo con gráficos de control, cuando sea aplicable;\ncomprobaciones intermedias en los equipos de medición;\n repetición del ensayo o calibración utilizando los mismos métodos o métodos diferentes;\nreensayo o recalibración de los ítems conservados;\ncorrelación de resultados para diferentes características de un ítem.\nrevisión de los resultados informados.\ncomparaciones intralaboratorio;\nensayos de muestras ciegas.",
    "vigente": true
  },
  {
    "orden": 105,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.8 Informe de resultados\n7.8.1 Generalidades",
    "vigente": true
  },
  {
    "orden": 106,
    "tipo": "item",
    "clausula": "7.8.1.1",
    "texto": "7.8.1.1 Los resultados se deben revisar y autorizar antes de su liberación",
    "vigente": true
  },
  {
    "orden": 107,
    "tipo": "item",
    "clausula": "7.8.1.2",
    "texto": "7.8.1.2 Los resultados se deben suministrar de manera exacta, clara, inequívoca y objetiva, usualmente en un informe (por ejemplo, un informe de ensayo o un certificado de calibración o informe de muestreo), y deben incluir toda la información acordada con el cliente y la necesaria para la interpretación de los resultados y toda la información exigida en el método utilizado. \nTodos los informes emitidos se deben conservar como registros técnicos.",
    "vigente": true
  },
  {
    "orden": 108,
    "tipo": "item",
    "clausula": "7.8.1.3",
    "texto": "7.8.1.3 En el caso de un acuerdo con el cliente, los resultados se pueden informar de una manera simplificada. \nCualquier información enumerada de los apartados 7.8.2 a 7.8.7 que no se informe al cliente debe estar disponible fácilmente.",
    "vigente": true
  },
  {
    "orden": 109,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.8.2 Requisitos comunes para los Informes (ensayo, calibración o muestreo)",
    "vigente": true
  },
  {
    "orden": 110,
    "tipo": "item",
    "clausula": "7.8.2.1",
    "texto": "7.8.2.1 Cada informe debe incluir, al menos, la siguiente información, a menos que el laboratorio tenga razones válidas para no hacerlo, minimizando así cualquier posibilidad de interpretaciones\nequivocadas o de uso incorrecto:",
    "vigente": true
  },
  {
    "orden": 111,
    "tipo": "item",
    "clausula": null,
    "texto": "un título (por ejemplo, \"Informe de ensayo\", \"Certificado de calibración\" o \"Informe de muestreo\");",
    "vigente": true
  },
  {
    "orden": 112,
    "tipo": "item",
    "clausula": null,
    "texto": "el nombre y la dirección del laboratorio;",
    "vigente": true
  },
  {
    "orden": 113,
    "tipo": "item",
    "clausula": null,
    "texto": "el lugar en que se realizan las actividades de laboratorio, incluso cuando se realizan en las instalaciones del cliente o en sitios alejados de las instalaciones permanentes del laboratorio, o en instalaciones temporales o móviles asociadas;",
    "vigente": true
  },
  {
    "orden": 114,
    "tipo": "item",
    "clausula": null,
    "texto": "una identificación única de que todos sus componentes se reconocen como una parte de un informe completo y una clara identificación del final;",
    "vigente": true
  },
  {
    "orden": 115,
    "tipo": "item",
    "clausula": null,
    "texto": "el nombre y la información de contacto del cliente;",
    "vigente": true
  },
  {
    "orden": 116,
    "tipo": "item",
    "clausula": null,
    "texto": "la identificación del método utilizado;",
    "vigente": true
  },
  {
    "orden": 117,
    "tipo": "item",
    "clausula": null,
    "texto": "una descripción, una identificación inequívoca y, cuando sea necesario, la condición del ítem;",
    "vigente": true
  },
  {
    "orden": 118,
    "tipo": "item",
    "clausula": null,
    "texto": "la fecha de recepción de los ítems de calibración o ensayo, y la fecha del muestreo, cuando esto sea crítico para la validez y aplicación de los resultados;",
    "vigente": true
  },
  {
    "orden": 119,
    "tipo": "item",
    "clausula": null,
    "texto": "las fechas de ejecución de la actividad del laboratorio.\nLa fecha de emisión del informe;",
    "vigente": true
  },
  {
    "orden": 120,
    "tipo": "item",
    "clausula": null,
    "texto": "La fecha de emisión del informe;",
    "vigente": true
  },
  {
    "orden": 121,
    "tipo": "item",
    "clausula": null,
    "texto": "la referencia al plan y método de muestreo usados por el laboratorio u otros organismos, cuando sean pertinentes para la validez o aplicación de los resultados;",
    "vigente": true
  },
  {
    "orden": 122,
    "tipo": "item",
    "clausula": null,
    "texto": "una declaración acerca de que los resultados se relacionan solamente con los ítems sometidos a\nensayo, calibración o muestreo;",
    "vigente": true
  },
  {
    "orden": 123,
    "tipo": "item",
    "clausula": null,
    "texto": "los resultados con las unidades de medición, cuando sea apropiado;",
    "vigente": true
  },
  {
    "orden": 124,
    "tipo": "item",
    "clausula": null,
    "texto": "las adiciones, desviaciones o exclusiones del método;",
    "vigente": true
  },
  {
    "orden": 125,
    "tipo": "item",
    "clausula": null,
    "texto": "la identificación de las personas que autorizan el informe;",
    "vigente": true
  },
  {
    "orden": 126,
    "tipo": "item",
    "clausula": null,
    "texto": "una identificación clara cuando los resultados provengan de proveedores externos.",
    "vigente": true
  },
  {
    "orden": 127,
    "tipo": "item",
    "clausula": "7.8.2.2",
    "texto": "7.8.2.2 El laboratorio debe ser responsable de toda la información suministrada en el informe, excepto cuando la información la suministre el cliente. \nLos datos suministrados por el cliente deben ser claramente identificados. Además, en el informe se debe incluir un descargo de responsabilidad cuando la información sea proporcionada por el cliente y pueda afectar a la validez de los resultados. \nCuando el laboratorio no ha sido responsable de la etapa de muestreo (por ejemplo, la muestra ha sido suministrada por el cliente), en el informe se debe indicar que los resultados se aplican a la muestra cómo se recibió.",
    "vigente": true
  },
  {
    "orden": 128,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.8.3 Requisitos específicos para los informes de ensayo",
    "vigente": true
  },
  {
    "orden": 129,
    "tipo": "item",
    "clausula": "7.8.3.1",
    "texto": "7.8.3.1 Además de los requisitos del apartado 7.8.2, los informes de ensayo deben incluirlo siguiente, cuando sea necesario para la interpretación de los resultados del ensayo:\ninformación sobre las condiciones específicas del ensayo, tales como condiciones ambientales.\ncuando sea pertinente, una declaración de conformidad con los requisitos o especificaciones\n(véase 7.8.6).\ncuando sea aplicable, la incertidumbre de medición presentada en la misma unidad que el mensurando o en un término relativo al mensurando (por ejemplo, porcentaje) cuando:\nsea pertinente a la validez o aplicación de los resultados de ensayo;\nuna instrucción del cliente que lo requiera; o\nla incertidumbre de medición afecte la conformidad con un límite de especificación.\ncuando sea apropiado, opiniones e interpretaciones (véase 7.8.7).\ninformación adicional que pueda ser requerida por métodos específicos, autoridades, clientes o grupos de clientes.",
    "vigente": true
  },
  {
    "orden": 130,
    "tipo": "item",
    "clausula": "7.8.3.2",
    "texto": "7.8.3.2 Cuando el laboratorio es responsable de la actividad de muestreo, los informes de ensayo deben cumplir con los requisitos enumerados en el apartado 7.8.5, cuando sea necesario para la interpretación de los resultados del ensayo.",
    "vigente": true
  },
  {
    "orden": 131,
    "tipo": "item",
    "clausula": "7.8.4",
    "texto": "7.8.4 Requisitos específicos  para  los  certificados  de calibración",
    "vigente": true
  },
  {
    "orden": 132,
    "tipo": "item",
    "clausula": "7.8.4.1",
    "texto": "7.8.4.1 Además de los requisitos del apartado 7.8.2, los certificados de calibración deben incluir lo siguiente:",
    "vigente": true
  },
  {
    "orden": 133,
    "tipo": "item",
    "clausula": null,
    "texto": "la incertidumbre de medición del resultado de medición presentado en la misma unidad que la de la unidad del mensurando o en un término relativo a dicha unidad (por ejemplo, porcentaje);",
    "vigente": true
  },
  {
    "orden": 134,
    "tipo": "item",
    "clausula": null,
    "texto": "las condiciones (por ejemplo, ambientales) en las que se hicieron las calibraciones, que influyen en los resultados de medición;",
    "vigente": true
  },
  {
    "orden": 135,
    "tipo": "item",
    "clausula": null,
    "texto": "una declaración que identifique cómo las mediciones son trazables metrológicamente (véase el Anexo A);",
    "vigente": true
  },
  {
    "orden": 136,
    "tipo": "item",
    "clausula": null,
    "texto": "los resultados antes y después de cualquier ajuste o reparación, si están disponibles;",
    "vigente": true
  },
  {
    "orden": 137,
    "tipo": "item",
    "clausula": null,
    "texto": "cuando sea pertinente, una declaración de conformidad con los requisitos o especificaciones véase 7.8.6);",
    "vigente": true
  },
  {
    "orden": 138,
    "tipo": "item",
    "clausula": "7.8.4.2",
    "texto": "7.8.4.2 Cuando el laboratorio es responsable de la actividad de muestreo, los certificados de calibración deben cumplir con los requisitos enumerados en el apartado 7.8.5, cuando sea necesario para la interpretación de los resultados de calibración.",
    "vigente": true
  },
  {
    "orden": 139,
    "tipo": "item",
    "clausula": "7.8.4.3",
    "texto": "7.8.4.3 Un certificado o etiqueta de calibración no debe contener recomendaciones sobre el intervalo de calibración, excepto cuando así se haya acordado con el cliente.",
    "vigente": true
  },
  {
    "orden": 140,
    "tipo": "item",
    "clausula": "7.8.5",
    "texto": "7.8.5 Información de muestreo\nRequisitos generales",
    "vigente": true
  },
  {
    "orden": 141,
    "tipo": "item",
    "clausula": "7.8.6",
    "texto": "7.8.6 Información sobre declaraciones de conformidad",
    "vigente": true
  },
  {
    "orden": 142,
    "tipo": "item",
    "clausula": "7.8.7",
    "texto": "7.8.7 Información sobre opiniones e interpretaciones",
    "vigente": true
  },
  {
    "orden": 143,
    "tipo": "item",
    "clausula": "7.8.8",
    "texto": "7.8.8 Modificaciones de los informes",
    "vigente": true
  },
  {
    "orden": 144,
    "tipo": "item",
    "clausula": null,
    "texto": "Cuando se necesite cambiar, corregir o emitir nuevamente un informe ya emitido cualquier cambio en la información debe estar identificado claramente, y cuando sea apropiado, se debe incluir en el informe la razón del cambio.",
    "vigente": true
  },
  {
    "orden": 145,
    "tipo": "item",
    "clausula": "7.8.2",
    "texto": "7.8.2 Las modificaciones a un informe después de su emisión de deben realizar solamente en la forma de otro documento",
    "vigente": true
  },
  {
    "orden": 146,
    "tipo": "item",
    "clausula": "7.8.3",
    "texto": "7.8.3 Cuando sea necesario emitir un nuevo informe completo, se debe identificar de forma única y debe contener una referencia al original al que reemplaza.",
    "vigente": true
  },
  {
    "orden": 147,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.9 Quejas",
    "vigente": true
  },
  {
    "orden": 148,
    "tipo": "item",
    "clausula": "7.9.1",
    "texto": "7.9.1 El laboratorio debe contar con un proceso documentado para recibir, evaluar y tomar decisiones acerca de las quejas",
    "vigente": true
  },
  {
    "orden": 149,
    "tipo": "item",
    "clausula": "7.9.2",
    "texto": "7.9.2 Debe estar disponible una descripción del proceso de tratamiento de quejas para cuando lo solicite cualquier parte interesada.",
    "vigente": true
  },
  {
    "orden": 150,
    "tipo": "item",
    "clausula": "7.9.3",
    "texto": "7.9.3 El proceso de tratamiento  de quejas debe incluir, al menos, los elementos y métodos siguientes:\na) Una descripción del proceso de recepción, validación, investigación de la queja y decisión sobre las acciones a tomar para darles respuesta;\nb) El seguimiento y registro de las quejas, incluyendo las acciones tomadas para resolverlas;\nc) Asegurarse de que se toman las acciones apropiadas.",
    "vigente": true
  },
  {
    "orden": 151,
    "tipo": "item",
    "clausula": "7.9.4",
    "texto": "7.9.4 El laboratorio que recibe la queja debe ser responsable de recopilar y verificar toda la información necesaria para validar la queja.",
    "vigente": true
  },
  {
    "orden": 152,
    "tipo": "item",
    "clausula": "7.9.5",
    "texto": "7.9.5 Siempre que sea posible, debe acusar recibo de la queja y debe facilitar a quien presenta la queja, los informes de progreso y del resultado del tratamiento de la queja.",
    "vigente": true
  },
  {
    "orden": 153,
    "tipo": "item",
    "clausula": "7.9.6",
    "texto": "7.9.6 Los resultados que se comuniquen a quien presenta la queja deben realizarse por, o revisarse y a aprobarse por, personas no involucradas en las actividades de laboratorio que origina la queja.",
    "vigente": true
  },
  {
    "orden": 154,
    "tipo": "item",
    "clausula": "7.9.7",
    "texto": "7.9.7 Siempre que sea posible, el laboratorio debe notificar formalmente a quien presenta la queja, el cierre del tratamiento de la queja.",
    "vigente": true
  },
  {
    "orden": 155,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.10 Trabajo no conforme",
    "vigente": true
  },
  {
    "orden": 156,
    "tipo": "item",
    "clausula": "7.10.1",
    "texto": "7.10.1 El laboratorio debe contar con un procedimiento que se debe implementar cuando cualquier aspecto de sus actividades de laboratorio o los resultados de este trabajo no cumplan con sus propios procedimientos o con los requisitos acordados con el cliente (por ejemplo, el equipamiento o las condiciones ambientales que están fuera de los límites especificados; los resultados del seguimiento no\ncumplen los criterios especificados). \nEl procedimiento debe asegurar que:\nestén definidos las responsabilidades y autoridades para la gestión del trabajo no conforme\nlas acciones (incluyendo la detención o repetición del trabajo, y la retención de los informes, según sea necesario) se basen en los niveles de riesgo establecidos por el laboratorio\nse haga una evaluación de la importancia del trabajo no conforme, incluyendo un análisis de impacto sobre los resultados previos\nse tome una decisión sobre la aceptabilidad del trabajo no conforme\ncuando sea necesario, se notifique al cliente y se anule el trabajo\nse defina la responsabilidad para autorizar la reanudación del trabajo.",
    "vigente": true
  },
  {
    "orden": 157,
    "tipo": "item",
    "clausula": "7.10.2",
    "texto": "7.10.2 El laboratorio debe conservar registros del trabajo no conforme y las acciones según lo especificado en el apartado 7.10.1 viñetas b) a f).",
    "vigente": true
  },
  {
    "orden": 158,
    "tipo": "item",
    "clausula": "7.10.3",
    "texto": "7.10.3 Cuando la evaluación indique que el trabajo no conforme podría volver a ocurrir o exista duda acerca del cumplimiento de las operaciones del laboratorio con su propio sistema de gestión, el laboratorio debe implementar acciones correctivas.",
    "vigente": true
  },
  {
    "orden": 159,
    "tipo": "titulo",
    "clausula": null,
    "texto": "7.11 Control de los datos y gestión de la información",
    "vigente": true
  },
  {
    "orden": 160,
    "tipo": "item",
    "clausula": "7.11.1",
    "texto": "7.11.1 El laboratorio debe tener acceso a los datos y a la información necesaria para llevar a cabo las actividades de laboratorio.",
    "vigente": true
  },
  {
    "orden": 161,
    "tipo": "item",
    "clausula": "7.11.2",
    "texto": "7.11.2 Los sistemas de gestión de la información del laboratorio utilizados para recopilar, procesar, registrar, informar, almacenar o recuperar datos se deben validar en cuanto a su funcionalidad, incluido el funcionamiento apropiado de las interfaces dentro de los sistemas de gestión de la información del laboratorio, por parte del laboratorio antes de su introducción. \nSiempre que haya cualquier cambio, incluida la configuración del software del laboratorio o modificaciones al software comercial listo para su uso, se debe autorizar, documentar y validar antes de su implementación.",
    "vigente": true
  },
  {
    "orden": 162,
    "tipo": "item",
    "clausula": "7.11.3",
    "texto": "7.11.3 El sistema de gestión de la información del laboratorio debe:\nestar protegido contra acceso no autorizado\nestar salvaguardado contra manipulación indebida y pérdida\nser operado en un ambiente que cumpla con las especificaciones del proveedor o del laboratorio o, en caso de sistemas no informáticos, que proporcione condiciones que salvaguarden la exactitud\ndel registro y transcripción manuales",
    "vigente": true
  },
  {
    "orden": 163,
    "tipo": "item",
    "clausula": null,
    "texto": "ser mantenido de manera que se asegure la integridad de los datos y de la información\nincluir el registro de los fallos del sistema y el registro de las acciones inmediatas y correctivas\napropiadas.",
    "vigente": true
  },
  {
    "orden": 164,
    "tipo": "item",
    "clausula": "7.11.4",
    "texto": "7.11.4 Cuando los sistemas de gestión de la información del laboratorio se gestionan y mantienen fuera del sitio o por medio de un proveedor externo, el laboratorio debe asegurar que el proveedor o administrador del sistema cumple todos los requisitos aplicables de este documento.",
    "vigente": true
  },
  {
    "orden": 165,
    "tipo": "item",
    "clausula": "7.11.5",
    "texto": "7.11.5 El laboratorio debe asegurarse de que las instrucciones, manuales y datos de referencia pertinentes al sistema de gestión de la información del laboratorio estén fácilmente disponibles para el personal.",
    "vigente": true
  },
  {
    "orden": 166,
    "tipo": "item",
    "clausula": "7.11.6",
    "texto": "7.11.6 Los cálculos y transferencias de datos se deben comprobar de una manera apropiada y sistemática.",
    "vigente": true
  },
  {
    "orden": 167,
    "tipo": "titulo",
    "clausula": null,
    "texto": "8. Requisitos del sistema de gestión",
    "vigente": true
  },
  {
    "orden": 168,
    "tipo": "item",
    "clausula": null,
    "texto": "Documentación del sistema de gestión (Opción A)\n\n8.2.1 La dirección del laboratorio debe establecer, documentar y mantener políticas y objetivos para el cumplimiento del propósito de este documento y debe asegurarse de que las políticas y objetivos se entienden e implementen en todos los niveles de la organización del laboratorio.",
    "vigente": true
  },
  {
    "orden": 169,
    "tipo": "item",
    "clausula": "8.2.2",
    "texto": "8.2.2 Las políticas y objetivos deben abordar la competencia, la imparcialidad y la operación coherente del laboratorio.",
    "vigente": true
  },
  {
    "orden": 170,
    "tipo": "item",
    "clausula": "8.2.3",
    "texto": "8.2.3 La dirección del laboratorio debe suministrar evidencia del compromiso con el desarrollo y la implementación del sistema de gestión y con mejorar continuamente su eficacia.",
    "vigente": true
  },
  {
    "orden": 171,
    "tipo": "item",
    "clausula": "8.2.4",
    "texto": "8.2.4 Toda la documentación, procesos, sistemas, registros, relacionados con el cumplimiento de los requisitos de este documento se debe incluir, referenciar o vincular al sistema de gestión.",
    "vigente": true
  },
  {
    "orden": 172,
    "tipo": "item",
    "clausula": "8.2.5",
    "texto": "8.2.5 Todo el personal involucrado en actividades de laboratorio debe tener acceso a las partes de la documentación del sistema de gestión y a la información relacionada que sea aplicable a sus responsabilidades.",
    "vigente": true
  },
  {
    "orden": 173,
    "tipo": "item",
    "clausula": "8.3",
    "texto": "8.3 Control de documentos del sistema de gestión (Opción A",
    "vigente": true
  },
  {
    "orden": 174,
    "tipo": "item",
    "clausula": "8.3.1",
    "texto": "8.3.1 El laboratorio debe controlar los documentos (internos y externos) relacionados con el cumplimiento de este documento.",
    "vigente": true
  },
  {
    "orden": 175,
    "tipo": "item",
    "clausula": "8.3.2",
    "texto": "8.3.2 El laboratorio debe asegurarse de que:\na)\tlos documentos se aprueban en cuanto a su adecuación antes de su emisión por personal autorizado;\nb)\tlos documentos se revisan periódicamente, y se actualizan, según sea necesario;\nc)\tse identifican los cambios y el estado de revisión actual de los documentos;\nd)\tlas versiones pertinentes de los documentos aplicables están disponibles en los puntos de uso y cuando sea necesario, se controla su distribución;\ne)\tlos documentos están identificados en forma única;\nf) se previene el uso no intencionado de los documentos obsoletos, y la identificación adecuada se aplica a éstos si se conservan por cualquier propósito.",
    "vigente": true
  },
  {
    "orden": 176,
    "tipo": "titulo",
    "clausula": null,
    "texto": "8.4 Control de registros (Opción A)",
    "vigente": true
  },
  {
    "orden": 177,
    "tipo": "item",
    "clausula": "8.4.1",
    "texto": "8.4.1 El laboratorio debe establecer y conservar registros legibles para demostrar el cumplimiento de los requisitos de este documento.",
    "vigente": true
  },
  {
    "orden": 178,
    "tipo": "item",
    "clausula": "8.4.2",
    "texto": "8.4.2 El laboratorio debe implementar los controles necesarios para la identificación, almacenamiento, protección, copia de seguridad, archivo, recuperación, tiempo de conservación y disposición de sus registros. El laboratorio debe conservar registros durante un período coherente con sus obligaciones contractuales. El acceso a estos registros debe ser coherente con los acuerdos de confidencialidad y los registros deben estar disponibles fácilmente.",
    "vigente": true
  },
  {
    "orden": 179,
    "tipo": "titulo",
    "clausula": null,
    "texto": "8.5 Acciones para abordar riesgos y oportunidades (Opción A)",
    "vigente": true
  },
  {
    "orden": 180,
    "tipo": "item",
    "clausula": "8.5.1",
    "texto": "8.5.1 El laboratorio debe considerar los riesgos y las oportunidades asociados con las actividades del laboratorio para:\na)\tasegurar que el sistema de gestión logre sus resultados previstos;\nb)\tmejorar las oportunidades de lograr el propósito y los objetivos del laboratorio;\nc)\tprevenir o reducir los impactos indeseados y los incumplimientos potenciales en las actividades del laboratorio;\nd)\tlograr la mejora.",
    "vigente": true
  },
  {
    "orden": 181,
    "tipo": "item",
    "clausula": "8.5.2",
    "texto": "8.5.2 El laboratorio debe planificar:\n\na)\tlas acciones para abordar estos riesgos y oportunidades;\nb)\tla manera de:\nintegrar e implementar estas acciones en su sistema de gestión;\nevaluar la eficacia de estas acciones.",
    "vigente": true
  },
  {
    "orden": 182,
    "tipo": "item",
    "clausula": "8.5.3",
    "texto": "8.5.3 Las acciones tomadas para abordar los riesgos y las oportunidades deben ser proporcionales al impacto potencial sobre la validez de los resultados del laboratorio.",
    "vigente": true
  },
  {
    "orden": 183,
    "tipo": "titulo",
    "clausula": null,
    "texto": "8.6 Mejora (Opción A)",
    "vigente": true
  },
  {
    "orden": 184,
    "tipo": "item",
    "clausula": "8.6.1",
    "texto": "8.6.1 El laboratorio debe identificar y seleccionar oportunidades de mejora e implementar cualquier acción necesaria.",
    "vigente": true
  },
  {
    "orden": 185,
    "tipo": "item",
    "clausula": "8.6.2",
    "texto": "8.6.2 El laboratorio debe buscar la retroalimentación, tanto positiva como negativa, de sus clientes. La retroalimentación se debe analizar y usar para mejorar el sistema de gestión, las actividades del laboratorio y el servicio al cliente.",
    "vigente": true
  },
  {
    "orden": 186,
    "tipo": "titulo",
    "clausula": null,
    "texto": "8.7 Acciones correctivas (Opción A)",
    "vigente": true
  },
  {
    "orden": 187,
    "tipo": "item",
    "clausula": "8.7.1",
    "texto": "8.7.1 Cuando ocurre una no conformidad, el laboratorio debe:\na)\treaccionar ante la no conformidad, según sea aplicable:\nemprender acciones para controlarlas y corregirlas;\nhacer frente a las consecuencias;\nb)\tevaluar la necesidad de acciones para eliminar las causas de la no conformidad, con el fin de que no vuelva a ocurrir, ni que ocurra en otra parte, mediante:\nla revisión y análisis de la no conformidad;\nla determinación de las causas de la no conformidad;\nla determinación de si existen no conformidades similares, o que potencialmente pueden ocurrir;\nc)\timplementar cualquier acción necesaria;\nd)\trevisar la eficacia de cualquier acción correctiva tomada;\ne)\tsi fuera necesario, actualizar los riesgos y las oportunidades determinados durante la planificación;\nf)\tsi fuera necesario realizar cambios al sistema de gestión.",
    "vigente": true
  },
  {
    "orden": 188,
    "tipo": "item",
    "clausula": "8.7.2",
    "texto": "8.7.2 Las acciones correctivas deben ser apropiadas a los efectos de las no conformidades encontradas.",
    "vigente": true
  },
  {
    "orden": 189,
    "tipo": "item",
    "clausula": "8.7.3",
    "texto": "8.7.3 El laboratorio debe conservar registros como evidencia de:\na)\tla naturaleza de las no conformidades, las causas y cualquier acción tomada posteriormente;\nb)\tlos resultados de cualquier acción correctiva.",
    "vigente": true
  },
  {
    "orden": 190,
    "tipo": "titulo",
    "clausula": null,
    "texto": "8.8 Auditorías internas (Opción A)",
    "vigente": true
  },
  {
    "orden": 191,
    "tipo": "item",
    "clausula": "8.8.1",
    "texto": "8.8.1 El laboratorio debe llevar a cabo auditorías internas a intervalos planificados para obtener información acerca de si el sistema de gestión:\na)\tes conforme con:\nlos requisitos del propio laboratorio para su sistema de gestión, incluidas las actividades del laboratorio;\nlos requisitos de este documento;\nb)\tse implementa y mantiene eficazmente.",
    "vigente": true
  },
  {
    "orden": 192,
    "tipo": "item",
    "clausula": "8.8.2",
    "texto": "8.8.2 El laboratorio debe:\na)\tplanificar, establecer, implementar y mantener un programa de auditoría que incluya la frecuencia, los métodos, las responsabilidades, los requisitos de planificación y presentación de informes que debe tener en consideración la importancia de las actividades de laboratorio involucradas, los cambios que afectan al laboratorio y los resultados de las auditorías previas;\nb)\tdefinir los criterios de auditoría y el alcance de cada auditoría;\nc)\tasegurarse de que los resultados de las auditorías se informen a la dirección pertinente;\nd)\timplementar las correcciones y las acciones correctivas apropiadas, sin demora indebida;\ne)\tconservar los registros como evidencia de la implementación del programa de auditoría y de los resultados de la auditoría.",
    "vigente": true
  },
  {
    "orden": 193,
    "tipo": "titulo",
    "clausula": null,
    "texto": "8.9 Revisiones por la dirección (Opción A)",
    "vigente": true
  },
  {
    "orden": 194,
    "tipo": "item",
    "clausula": "8.9.1",
    "texto": "8.9.1 La dirección del laboratorio debe revisar su sistema de gestión a intervalos planificados, con el fin de asegurar su conveniencia, adecuación y eficacia, incluidas las políticas y los objetivos establecidos relacionados con el cumplimiento de este documento.",
    "vigente": true
  },
  {
    "orden": 195,
    "tipo": "item",
    "clausula": "8.9.2",
    "texto": "8.9.2 Las entradas a la revisión por la dirección se deben registrar y deben incluir información relacionada con lo siguiente (ver la norma).",
    "vigente": true
  },
  {
    "orden": 196,
    "tipo": "item",
    "clausula": "8.9.3",
    "texto": "8.9.3 Las salidas de la revisión por la dirección deben registrar todas las decisiones y acciones relacionadas, al menos con:\na)\tla eficacia del sistema de gestión y de sus procesos;\nb)\tla mejora de las actividades del laboratorio relacionadas con el cumplimiento de los requisitos de este documento;\nc)\tla provisión de los recursos requeridos;\nd)  cualquier necesidad de cambio.",
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
      vigente: item.vigente,
      creado_por: null,
      createdAt: now,
      updatedAt: now,
    }));
    await queryInterface.bulkInsert('checklist_template_items', rows);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('checklist_template_items', null, {});
  },
};
