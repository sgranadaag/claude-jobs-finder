---
name: tailor-cv
description: Genera el CV adaptado y los datos de aplicación para las ofertas registradas, sin inventar información. Usar cuando el usuario quiera preparar ofertas para aplicar o ejecutar el paso 2 del workflow.
argument-hint: "[IDs separados por espacio | score mínimo, por defecto 60]"
---

Paso 2 del workflow (ver `CLAUDE.md`).

1. Lee `data/offers.md` y elige las ofertas a preparar:
   - Si `$ARGUMENTS` trae IDs, esas.
   - Si trae un número, las de estado `nueva` con score ≥ ese número.
   - Si viene vacío, las de estado `nueva` con score ≥ 60.
   Muestra la lista al usuario antes de empezar. Si no hay ninguna, dilo y termina.
2. Lanza un subagente `cv-tailor` por oferta, pasando el ID. Lánzalos en paralelo en lotes de hasta 4.
3. Cuando termine cada uno, actualiza su fila en `data/offers.md`: estado `preparada` si existen `<Nombre>_CV_<Empresa>.pdf` y `application.md`; si no, deja `nueva` y anota el problema en Notas. Solo tú editas este archivo; los subagentes no.
4. Muestra un resumen por oferta: cobertura de obligatorios, salario resultante, requisitos transferibles y sin base, y la lista consolidada de pendientes. Si se repite el mismo dato pendiente, sugiere agregarlo a `docs/preferences.md` para que no vuelva a quedar pendiente.
5. Recomienda al usuario revisar el PDF de cada oferta antes de ejecutar `/apply`.
