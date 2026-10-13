---
name: apply
description: Aplica a las ofertas en estado "preparada" (o "borrador") usando el navegador, llenando los formularios con los datos ya generados y el banco de respuestas, y registrando qué se envió y el resultado. Usar solo cuando el usuario pida aplicar (paso 3 del workflow).
argument-hint: "[IDs separados por espacio | vacío = todas las preparadas] [sin enviar]"
disable-model-invocation: true
---

Paso 3 del workflow (ver `CLAUDE.md`). Se ejecuta en la sesión principal (no en un subagente) porque necesita el navegador, las sesiones del usuario y su confirmación.

## Preparación

1. Lee `data/offers.md` y toma las ofertas indicadas en `$ARGUMENTS`, o todas las de estado `preparada`. Muéstralas ordenadas por score y confirma con el usuario cuáles aplicar. Si `$ARGUMENTS` dice "sin enviar", llena todo y deja cada postulación como borrador.
2. Lee `docs/answer-bank.md`, `docs/writing-style.md` (sección "Respuestas a formularios") y `docs/preferences.md` ("Respuestas reutilizables" y salario).
3. Carga la skill del navegador disponible (Claude in Chrome, o en su defecto el navegador integrado) antes de la primera acción en el navegador.

## Por cada oferta

1. Lee `applications/<ID>/application.md` (CV, salario, "¿por qué?", carta, pendientes) y `offer.md` (tabla de requisitos). Los datos de contacto están en "Contacto" de `docs/profile.md`. Documentos de identidad u otros datos sensibles no se guardan en ningún archivo: si el formulario los exige, pídeselos al usuario en el momento y no los registres en el log. Si quedan pendientes que el formulario vaya a pedir, pregúntale al usuario antes de empezar.
2. Abre la URL de la oferta y llega al formulario (Apply / Easy Apply / ATS externo como Greenhouse, Lever, Ashby, Workable).
3. Si pide login, crear cuenta, captcha o verificación por email: **detente y pide al usuario que lo haga**. No crees cuentas sin permiso.
4. Lee **todas** las preguntas del formulario antes de responder ninguna. Luego:
   - Asigna a cada pregunta los temas de `docs/answer-bank.md` que le corresponden y **reparte el material para no repetir** el mismo proyecto, logro o certificación en dos respuestas (cuentan también "¿por qué la empresa?" y la carta).
   - Adapta la redacción de cada respuesta base a la pregunta, sin agregar hechos. Si pide una tecnología transferible, usa el patrón "Tecnología equivalente"; si no hay base, "Sin base parecida".
   - Salario o renta (bruta o líquida): el valor de `application.md`.
   - Preguntas que dependen del usuario y no están en los docs ni en "Respuestas reutilizables": pregúntale; nunca las supongas.
   - Demográficas opcionales: en blanco o "Prefiero no responder".
5. Sube `applications/<ID>/<Nombre>_CV_<Empresa>.pdf` (sin actualizar el perfil del portal con ese CV ni marcarlo por defecto). Si el navegador no permite subir archivos, pídele al usuario que lo suba e indícale la ruta absoluta.
6. **Antes de enviar**: muestra al usuario un resumen de todos los campos y respuestas y espera su confirmación explícita. Sin confirmación no se envía. En modo "sin enviar", deja la postulación en la vista previa o como borrador.
7. Envía y captura el resultado (mensaje de confirmación, número de referencia, error).
8. Si redactaste una respuesta nueva que servirá para otras ofertas, o el usuario corrigió una, agrégala o actualízala en `docs/answer-bank.md`. Si el usuario dio un dato personal nuevo (renta, procesos previos, etc.), agrégalo a "Respuestas reutilizables" de `docs/preferences.md`.

## Registro (siempre, incluso si falla, se omite o queda en borrador)

Crea o amplía `applications/<ID>/application-log.md`:

```markdown
## Intento <YYYY-MM-DD HH:mm>
- URL / plataforma: ...
- Resultado: aplicada | borrador | bloqueada | fallida | omitida
- Confirmación / referencia: ...
- CV: <archivo> (nombre con el que quedó en el portal)
- Salario declarado: <valor>
- Campos:
  | Campo | Valor |
  |---|---|
- Preguntas de selección (texto literal de la pregunta y respuesta enviada, completas):
  1. **<pregunta tal cual aparece>**
     <respuesta>
- Datos aportados por el usuario: ...
- Incidencias: ...
```

Luego agrega una fila a `data/applications.md` (si no existe, créalo copiando `.claude/templates/data/applications.md`) y actualiza el estado en `data/offers.md` (`aplicada`, `borrador`, `fallida` u `omitida`, con el motivo en Notas).

Al final, muestra un resumen de todas las aplicaciones de la sesión.
