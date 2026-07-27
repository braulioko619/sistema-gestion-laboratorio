# Plan de implementación — Tarea 4.1: Motor de incertidumbre GUM (piloto: Pie de Metros)

> Sub-plan de `docs/PLAN_DESARROLLO.md`, tarea 4.1. Generado el 2026-07-26 tras mapear la planilla real
> del laboratorio (`V:\Magnitudes\Longitud\Servicios Acreditados\Pie de Metros\planilla_pie_de_metro.xlsx`)
> y los patrones ya establecidos en el código. Léase junto con la sección 0/1 de `PLAN_DESARROLLO.md`
> (decisiones de arquitectura D1-D10) — este documento no las repite salvo cuando aplican directo a 4.1.
>
> **Decisión del dueño del proyecto (2026-07-26):** el motor replica el comportamiento real de la
> planilla tal cual está hoy, inconsistencias incluidas frente al procedimiento PRO-L01 (ver sección 1).
> No se "corrige" la fórmula en esta pasada — eso sería una decisión de calidad/metrología separada,
> fuera del alcance de esta tarea.

---

## 0. Alcance de esta tarea

Un solo tipo de instrumento — **Pie de Metros, sección "Topes de Exteriores"** — de las 4 secciones que
tiene la planilla real (Exteriores, Interiores, Profundímetro, Escalón). Las otras 3 secciones y los
otros 8 tipos de instrumento de "Longitud" quedan para iteraciones posteriores (4.2 en el plan general),
una vez que este primer caso esté validado end-to-end. Esto es deliberado: es más valioso tener UN caso
completo y verificado (captura → cálculo → validación numérica → escritura en `work_order_items`) que
cuatro casos a medias.

## 1. Fórmula a implementar (extraída de `Calculos!I9:V18`, sección Exteriores)

Por cada punto nominal calibrado (10 puntos estándar según el rango del instrumento, o puntos a solicitud
del cliente):

| Símbolo | Nombre | Fórmula | Tipo GUM |
|---|---|---|---|
| `u_par` | Paralelismo caras | `max(\|100-punta\|, \|100-medio\|, \|100-fondo\|) / √3` — 3 lecturas contra un bloque patrón de referencia, una vez por calibración completa (no por punto) | B |
| `u_rep` | Repetibilidad | `STDEV.S(4 lecturas) / √4 × t` — `t` = factor Student-t para df=3, ajustado a cobertura ~68% (ver 1.1) | A |
| `u_res` | Resolución | `resolución/√3` si análogo, `resolución/(2√3)` si digital | B |
| `u_pat` | Patrón | `Incert. Final` (columna F de la tabla de patrones — **sin** deriva, pese al nombre de columna "Cert.+Deriva"; ver hallazgo 3.3 del informe de mapeo) | B |
| `u_ΔT_1` | Temperatura (v1) | `valor_nominal × 11.5×10⁻⁶ /°C × (1/√3)` | B |
| `u_ΔT_2` | Temperatura (v2) | `11.5×10⁻⁶ × valor_nominal` — **sin** dividir por √3, se suma igual que las demás (doble conteo real de la planilla, replicado a propósito) | B |
| `u_c` | Combinada | `√(u_par² + u_rep² + u_res² + u_pat² + u_ΔT_1² + u_ΔT_2²)` | — |
| `U` | Expandida (k=2) | `u_c × 2` | — |
| `CMC` | Capacidad mínima acreditada | lookup por (tipo instrumento, resolución) contra 8 valores fijos (ver 1.2) | — |
| `U_final` | Resultado reportado | `max(U, CMC)` — nunca menos que el CMC acreditado | — |
| `Error` | Error de indicación | `MROUND(promedio(4 lecturas), resolución) - valor_nominal` | — |

### 1.1 Factor Student-t

`G = ROUND(T.INV(Φ⁻¹_ajustado, 3), 1)` donde el argumento de `T.INV` se construye a partir de
`NORM.S.DIST(1,TRUE)` (la CDF normal estándar en z=1) — es un valor fijo para n=4 (df=3), **no cambia
por punto ni por instrumento**. Calcularlo una sola vez como constante en el servicio (con `jstat` o
una tabla t de Student embebida — no hay ninguna librería estadística instalada aún, ver sección 4) en
vez de recalcularlo cada vez.

### 1.2 Tablas de referencia (constantes a embeber en el servicio, valores exactos en el informe de mapeo)

- **Patrones** (`Calculos!B54:I82`): dos sub-tablas — "Bloques Cortos" (rango 0–100mm, columna F literal)
  y "Bloques Largos" (125–1500mm, columna F = `ABS(desviación) + incertidumbre`). El componente `u_pat`
  de un punto nominal se busca por **coincidencia exacta del rango** contra la columna B de estas tablas.
- **CMC** (`CMC!I28,I39,I50,I64,I75,I104,I115,I126`): 8 valores, uno por combinación
  (análogo/digital) × (resolución 0.1/0.05/0.02/0.01mm), evaluados a la longitud de referencia
  `Registro!$D$20` (el rango del instrumento) — **no varían por punto dentro de una misma calibración**,
  son un techo fijo por (tipo, resolución, rango del instrumento).
- Coeficiente de dilatación térmica: `11.5×10⁻⁶ /°C` (acero), fijo.
- `ΔT` de referencia: `1°C` (variación ambiental asumida), fijo.

**Antes de escribir código**: releer el informe de mapeo completo (transcrito en la sección "Contexto"
de este documento, o re-ejecutable con el script node de la sección 4) para los valores numéricos
exactos de las 8 celdas CMC y de las ~29 filas de la tabla de patrones — no están reproducidos aquí en
extenso para no duplicar una fuente que puede desincronizarse; la fuente de verdad sigue siendo el
archivo `.xlsx` real hasta que sus valores se congelen en una migración (fase 1).

## 2. Modelo de datos

**No se crean tablas nuevas.** Se reutiliza lo que ya existe, siguiendo D2 (JSONB, no EAV) y el
precedente de que `work_order_items.puntos` ya está descrito como "Resultados finales digitados por
punto de medición (estructura libre)":

- **Captura de datos crudos** (lecturas, resolución, tipo análogo/digital, rango, paralelismo,
  temperatura): vía `CalibrationFormTemplate` + `CalibrationFormTemplateVersion` (tarea 3.1) — crear
  UNA plantilla nueva (código sugerido `FRM-PIE-METRO-EXT-001`, magnitud `Longitud`) con su `schema`
  JSON Schema definiendo los campos de entrada de la sección Exteriores. Las capturas van a
  `CalibrationFormEntry.data` (tarea 3.2), reusando toda la validación/inmutabilidad ya construida ahí
  — **no se inventa un flujo de captura paralelo**.
- **Resultado calculado, por punto**: se escribe en `work_order_items.puntos` (JSONB), reemplazando el
  digitado manual de hoy por el resultado del motor. Estructura sugerida por punto (a definir en fase 1,
  no cerrada aquí):
  ```json
  {
    "valor_nominal": 150.0,
    "lecturas": [150.00, 150.01, 150.01, 150.00],
    "error_indicacion": 0.01,
    "componentes": {
      "paralelismo": 0.000289, "repetibilidad": 0.00408, "resolucion": 0.00289,
      "patron": 0.00006, "temperatura_1": 0.0009995, "temperatura_2": 0.001725
    },
    "incertidumbre_combinada": 0.0057,
    "incertidumbre_expandida": 0.0114,
    "cmc": 0.02,
    "incertidumbre_final": 0.02,
    "factor_k": 2
  }
  ```
- **Resultado a nivel de ítem** (`work_order_items.incertidumbre_U`, `factor_k`): se fija como el
  **máximo** `incertidumbre_final` entre todos los puntos calculados de esa calibración — es lo que hoy
  bloquea/permite la emisión del certificado (`CertificateIssuanceService`/`CalibrationCertificateController`),
  así que el motor debe alimentar exactamente esas dos columnas para que el resto del sistema (checklist
  de emisión, generación de PDF) siga funcionando sin tocar ese código. **Confirmar con el dueño del
  proyecto si "máximo entre puntos" es el criterio correcto** antes de fijarlo en código — es una
  suposición razonable pero no viene de ningún documento leído hasta ahora.
- **Migración nueva** (no editar migraciones existentes): ninguna migración de esquema es estrictamente
  necesaria si `puntos` ya es JSONB de estructura libre — solo el seeder/creación de la
  `CalibrationFormTemplate` de Pie de Metros (vía API, no vía seeder, siguiendo el patrón de que las
  plantillas se crean por la aplicación, no por seed).

## 3. Servicio de cálculo

Nuevo archivo `backend/src/services/UncertaintyEngineService.js`, siguiendo **exactamente** el patrón de
`DriftAnalysisService.js`/`ControlChartService.js` (documentado en el informe de patrones):

```js
// Función pura, sin I/O — testeable con el caso de 150mm del documento de
// validación manual (PL06-F01) sin tocar la BD.
function calcularIncertidumbrePieDeMetroExterior({
  valorNominal, lecturas, resolucion, tipoInstrumento, // 'analogo' | 'digital'
  paralelismo, // { punta, medio, fondo, referencia }
  patronIncertidumbre, // resuelto contra la tabla de patrones (sección 1.2)
  cmc, // resuelto contra la tabla CMC (sección 1.2)
}) { /* ... */ return { componentes, incertidumbre_combinada, incertidumbre_expandida, incertidumbre_final, factor_k: 2 }; }

// Async: trae CalibrationFormEntry + resuelve patrón/CMC contra las tablas
// de referencia, llama a la función pura, y escribe work_order_items.puntos
// + incertidumbre_U/factor_k (el máximo entre puntos).
async function calcularIncertidumbreItem(workOrderItemId) { /* ... */ }

module.exports = { calcularIncertidumbrePieDeMetroExterior, calcularIncertidumbreItem };
```

Las tablas de referencia (patrones, CMC) se embeben como constantes en el mismo archivo, con un
comentario citando la celda exacta de origen (mismo estilo que el resto del proyecto documenta sus
decisiones) — no se modela como datos en BD todavía (eso sería sobre-ingeniería para un solo instrumento
piloto; 4.2 puede promoverlas a tabla si hace falta generalizar a más magnitudes).

**Dependencia nueva a evaluar**: el factor Student-t (sección 1.1) requiere `T.INV`/`NORM.S.DIST`.
Como es una constante fija para n=4 (no depende de datos de entrada), la opción más simple es
**calcularla una vez fuera de Node** (con la propia planilla, o con una calculadora estadística) y
dejarla como constante numérica comentada en el código — evita sumar una dependencia de estadística
solo para un valor que nunca cambia. Documentar el valor exacto y cómo se obtuvo.

## 4. Validación numérica (criterio de aceptación de 4.1)

**Restricción real importante, no documentada hasta ahora en el plan**: la librería `xlsx` (SheetJS) ya
usada en el proyecto **lee valores cacheados, no recalcula fórmulas**. No sirve para generar casos de
prueba sintéticos nuevos "en vivo" contra la planilla real — solo para leer casos que la planilla YA
tiene calculados. Esto cambia cómo se cumple el criterio de aceptación ("resultados coinciden con ≥N
casos reales del Excel validado"):

1. **Caso de referencia 1 (ya disponible)**: el punto de 150,0mm resuelto a mano en
   `PL 06-F01 Validación de planilla de calculo pie de metros.pdf` — transcribir los valores exactos
   (relectura cuidadosa del documento, la transcripción de esta sesión fue por OCR de manuscrito y
   puede tener errores de dígitos) y usarlo como el primer test unitario.
2. **Casos adicionales**: buscar en `V:\Certificados emitidos\` y en
   `V:\Magnitudes\Longitud\Servicios Acreditados\Pie de Metros\certificados tipo\` certificados de Pie
   de Metros ya emitidos con su planilla de respaldo (si el archivo `.xlsx` de esa calibración específica
   se conservó, no solo el PDF final) — de ahí se pueden extraer N filas ya calculadas (entradas +
   resultado) como casos de prueba reales, leyendo con `xlsx` (`cellFormula:false`, solo valores). Si
   no se conservan los `.xlsx` originales por calibración (solo el PDF del certificado, que no muestra
   el desglose), el número real de casos disponibles podría ser menor a los 10 sugeridos en el plan
   general — **decisión abierta #5 de `PLAN_DESARROLLO.md` ("N de casos... sugerido 10")**: confirmar
   con el laboratorio cuántos casos reales hay disponibles antes de comprometerse a un número.
3. Test unitario en `backend/src/services/__tests__/UncertaintyEngineService.test.js`, mismo patrón que
   `DriftAnalysisService.test.js`: importa solo la función pura, sin BD.

## 5. Controlador y rutas

Sigue el precedente de `calibration_form_entries` (3.2): el cálculo pertenece a un `WorkOrderItem`
concreto, así que se anida en `backend/src/routes/workorder.routes.js` (no se crea un archivo de rutas
nuevo ni se monta en `routes/index.js`):

```
POST /api/work-orders/items/:itemId/calculate-uncertainty
```

Restringido a los mismos roles que ya editan `incertidumbre_U`/`factor_k` hoy en
`WorkOrderController.updateWorkOrderItem` (revisar esa función antes de fijar el rol exacto — no se
verificó en esta sesión). Auditado igual que el resto de escrituras del ítem
(`AuditLog`, `entidad: 'work_order_item'`).

**Sin endpoint de captura nuevo**: la captura de lecturas ya tiene sus endpoints (3.2,
`POST /work-orders/items/:itemId/form-entries` etc.) — el endpoint de esta tarea solo dispara el
cálculo sobre una `CalibrationFormEntry` ya confirmada.

## 6. Frontend

**Fuera de alcance para el primer corte**, mismo criterio que 2.1/3.1 (backend primero, sin UI de
captura/cálculo todavía) — la tarea 3.2 ya dejó pendiente la UI genérica de captura por formulario
dinámico; construir la UI específica de Pie de Metros sobre esa base pendiente es una pasada aparte,
después de validar que el cálculo es numéricamente correcto. El único uso inmediato es vía API
(consistente con cómo se verificaron manualmente 3.4/3.5/4.4/4.5 en esta sesión).

## 7. Fases de ejecución sugeridas (para `/do` o ejecución manual secuencial)

1. **Releer con cuidado** `PL 06-F01 Validación de planilla de calculo pie de metros.pdf` (manuscrito)
   dígito por dígito, y el archivo `.xlsx` con el script node de esta sesión, para fijar con certeza
   los valores exactos de las tablas de patrones y CMC (sección 1.2) antes de escribir una sola línea
   de servicio — un dígito mal transcrito aquí se convierte en un bug de certificado real.
2. Crear la `CalibrationFormTemplate` + versión con schema para captura de Pie de Metros Exteriores
   (JSON Schema: `valor_nominal`, `lecturas` (array de 4), `resolucion`, `tipo_instrumento` (enum),
   `paralelismo` (objeto punta/medio/fondo/referencia), `temperatura` si aplica).
3. Escribir `UncertaintyEngineService.js` (función pura primero, con las tablas de referencia
   embebidas), y su test unitario contra el caso de 150mm.
4. Escribir la función async `calcularIncertidumbreItem` (BD) + endpoint + ruta + auditoría.
5. Verificar end-to-end contra la BD de desarrollo (mismo patrón manual usado en esta sesión, dado el
   bloqueo de `CREATEDB` heredado de la tarea 0.1): crear una OT/ítem de prueba, capturar lecturas via
   API, calcular, confirmar que `work_order_items.puntos`/`incertidumbre_U`/`factor_k` quedan
   correctos, y que el checklist de emisión (`CertificateIssuanceService`) sigue funcionando con el
   valor calculado en vez de uno digitado a mano.
6. Registrar en `software_validations` el protocolo de validación numérica (sección 4), incluyendo
   explícitamente que la fórmula replica intencionalmente las inconsistencias de la planilla real
   (doble conteo de temperatura, patrón sin deriva) por decisión del dueño del proyecto — para que quede
   trazable ante un auditor INN por qué el motor no sigue literalmente PRO-L01.
7. Actualizar `docs/PLAN_DESARROLLO.md` (fila 4.1) con el resultado, siguiendo el mismo nivel de detalle
   que el resto de tareas ya cerradas.

## 8. Hallazgos a registrar como deuda técnica (no bloquean esta tarea, pero deben quedar trazables)

Del informe de mapeo de la planilla, para revisión formal de metrología/calidad en otro momento:

1. Doble conteo del término de temperatura en `O = SQRT(SUMSQ(I:N))` — infla la incertidumbre reportada,
   creciendo con la longitud nominal. *Replicado a propósito en el motor por decisión 2026-07-26.*
2. El componente "patrón" excluye la deriva pese al nombre de columna, y la tabla de "Bloques Largos"
   no tiene deriva cargada en absoluto. *Replicado a propósito.*
3. `CMC!I89` ("incertidumbre adicional pendiente de definir por Metrología") sigue en 0.
4. El procedimiento PRO-L01 describe 7 componentes (incluye *rectitud* separada de *paralelismo*, y
   *deriva* como término aditivo independiente); la planilla real implementa una variante de 6.
5. El certificado de Exteriores (`Certificado mm`, fila 75) imprime `Calculos!F` (4ª lectura cruda) como
   "Valor Nominal" en vez de la columna de valor nominal real — invisible en datos de prueba donde
   lectura=nominal, pero potencialmente un error real de impresión en certificados con error de
   indicación distinto de cero. **Este no es un problema del motor de cálculo (4.1)** — vive en la
   plantilla de certificado, fuera de este alcance, pero debería reportarse a quien mantiene esa
   planilla.
