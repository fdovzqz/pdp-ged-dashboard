# 🚀 Proceso Rápido de Actualización

## Para Actualizar el Dashboard en el Futuro

### Paso 1: Reemplazar el archivo
```bash
# El archivo SIEMPRE se llama: 2026-01-MTD.csv
# Solo reemplaza el contenido con datos nuevos
cp nuevo_archivo.csv data/2026-01-MTD.csv
```

### Paso 2: Ejecutar el script
```bash
node scripts/processCSV.js
```

## ¡ESO ES TODO! 🎉

El script automáticamente:
- ✅ Procesa el CSV
- ✅ Convierte zona horaria UTC → México
- ✅ Detecta el último día disponible
- ✅ Calcula totales y promedios
- ✅ **Actualiza `historicalData.ts` automáticamente**

---

## ⚠️ Importante: Zona Horaria

**Si ves fechas del día 23 en el CSV pero el dashboard muestra día 22:**
- ✅ Es CORRECTO
- ✅ El CSV viene en UTC
- ✅ El script convierte a hora de México (UTC-6)
- ✅ Las primeras 6 horas del día 23 UTC = últimas 6 horas del día 22 México

**NO intentes "corregir" esto manualmente**

---

## Lo que se actualiza automáticamente:

**Por el script:**
- ✅ Array `historicalData` (datos diarios)
- ✅ Total `totals['2026']`
- ✅ Array `hourlyDistribution` (distribución horaria)

**Por el dashboard (después de ejecutar el script):**
- ✅ Último día disponible (calculado del array)
- ✅ Promedios diarios (dinámicos)
- ✅ Contadores de días laborales (dinámicos)
- ✅ Rangos de semanas (dinámicos)
- ✅ Fechas en títulos (dinámicas)
- ✅ Proyecciones (dinámicas)
- ✅ Máximos históricos (dinámicos)
- ✅ Todo el dashboard (dinámico)

---

## Resumen

```
Paso 1: Reemplazar data/2026-01-MTD.csv
Paso 2: node scripts/processCSV.js
Resultado: Dashboard actualizado automáticamente
```

**No necesitas copiar nada manualmente. Todo es automático.**
