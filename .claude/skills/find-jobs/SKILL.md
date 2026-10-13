---
name: find-jobs
description: Busca ofertas de empleo nuevas que encajen con el perfil, las puntúa y las registra en el histórico. Usar cuando el usuario quiera buscar ofertas o ejecutar el paso 1 del workflow.
argument-hint: "[cantidad] [enfoque opcional, ej. 'solo backend' o 'Get on Board']"
---

Paso 1 del workflow (ver `CLAUDE.md`).

1. Lanza el subagente `job-scout` con este encargo:
   - Cantidad objetivo de ofertas nuevas: la que indique `$ARGUMENTS`, o 15 por defecto.
   - Enfoque adicional, si `$ARGUMENTS` lo menciona (rol, tecnología o portal concreto).
   - Recordatorio: leer primero `data/offers.md` y no repetir nada que ya esté ahí.
2. Cuando termine, muestra al usuario su resumen: tabla de ofertas nuevas ordenadas por score y conteo de descartadas por motivo.
3. Ofrece continuar con `/tailor-cv` para las de prioridad alta y media (score ≥ 60).
