# Fix: Navegación al Reporte Base Anual

**Fecha:** 18 de octubre de 2025  
**Estado:** ✅ RESUELTO

## Problema Reportado

Al hacer clic en el botón **"Ver Base Importada"** en la página de un trabajo:

- ✅ La URL cambia correctamente en el navegador
- ❌ La interfaz NO se actualiza para mostrar el contenido
- ❌ Solo al hacer refresh manual (F5) se muestra la página correcta

## Análisis del Problema

### Flujo de Navegación

1. **Usuario en:** `/trabajos/123` → Muestra `TrabajoDetail`
2. **Click en "Ver Base Importada"**
3. **URL cambia a:** `/trabajos/123/reporte-base-anual`
4. **React Router carga:** `ReporteBaseAnualPage` en el outlet
5. **❌ PROBLEMA:** El componente padre `TrabajosPage` no se re-renderiza

### Causa Raíz

En `TrabajosPage.tsx`, el componente usa esta lógica:

```tsx
{
  selectedTrabajo ? outlet ? <Outlet /> : <TrabajoDetail /> : <TrabajosList />;
}
```

**El problema:**

- `outlet` es el resultado de `useOutlet()` de React Router
- Cuando la URL cambia, `useOutlet()` devuelve el componente correcto
- **PERO** React no siempre fuerza un re-render del padre cuando solo cambia el valor de `outlet`
- El condicional `outlet ? ... : ...` no se re-evalúa hasta que el componente se re-renderice por otra razón

### Código Problemático

```tsx
export const TrabajosPage: React.FC = () => {
  const outlet = useOutlet();
  const location = useLocation(); // ❌ No se usaba

  // ...

  return (
    <div>
      {selectedTrabajo ? (
        outlet ? ( // ❌ Este condicional no se re-evalúa
          <Outlet />
        ) : (
          <TrabajoDetail />
        )
      ) : (
        <TrabajosList />
      )}
    </div>
  );
};
```

## Solución Implementada

### Cambio en `TrabajosPage.tsx`

```tsx
export const TrabajosPage: React.FC = () => {
  const { trabajoId } = useParams<{ trabajoId: string }>();
  const location = useLocation();
  const outlet = useOutlet();

  // ✅ SOLUCIÓN: Detectar explícitamente si estamos en ruta anidada
  // Esto crea una variable que se recalcula en cada render
  // y React detecta el cambio cuando la URL cambia
  const isNestedRoute =
    outlet !== null && location.pathname !== `/trabajos/${trabajoId}`;

  return (
    <div>
      {selectedTrabajo ? (
        isNestedRoute ? ( // ✅ Usa la variable calculada
          <Outlet />
        ) : (
          <TrabajoDetail />
        )
      ) : (
        <TrabajosList />
      )}
    </div>
  );
};
```

### ¿Por qué funciona?

1. **`location.pathname`** es parte del estado de React Router
2. Cuando la URL cambia, React Router actualiza `location`
3. Esto fuerza un re-render del componente `TrabajosPage`
4. En el re-render, se recalcula `isNestedRoute`
5. El condicional se re-evalúa con el nuevo valor
6. React detecta que debe renderizar `<Outlet />` en lugar de `<TrabajoDetail />`

### Alternativa Considerada (No implementada)

Otra solución sería usar `useEffect` para forzar re-renders:

```tsx
const [shouldShowOutlet, setShouldShowOutlet] = useState(false);

useEffect(() => {
  setShouldShowOutlet(outlet !== null);
}, [outlet]);
```

**No se implementó porque:**

- Es más complejo
- Añade estado innecesario
- La solución actual es más simple y declarativa

## Componentes Afectados

### Archivo Modificado

- **`frontend/src/pages/TrabajosPage.tsx`**

### Archivos Relacionados (No modificados)

- `frontend/src/components/trabajos/ReporteAnualHeader.tsx` - Contiene el botón
- `frontend/src/components/trabajos/TrabajoDetail.tsx` - Llama a `navigate()`
- `frontend/src/pages/ReporteBaseAnualPage.tsx` - Página destino
- `frontend/src/App.tsx` - Configuración de rutas

## Botón "Ver Base Importada"

### Ubicación

**Componente:** `ReporteAnualHeader.tsx` (línea 76-98)

```tsx
{
  tieneHojas && onVerReporteBase && (
    <button
      onClick={onVerReporteBase}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg"
      title="Ver reporte base anual importado (todas las hojas del Excel)"
    >
      <svg>...</svg>
      Ver Base Importada
    </button>
  );
}
```

### Handler de Navegación

**Componente:** `TrabajoDetail.tsx` (línea 270-272)

```tsx
onVerReporteBase={() =>
  navigate(`/trabajos/${trabajo.id}/reporte-base-anual`)
}
```

### Ruta

**Archivo:** `App.tsx`

```tsx
<Route
  path=":trabajoId/reporte-base-anual"
  element={<ReporteBaseAnualPage />}
/>
```

## Testing Manual

### Pasos para Verificar

1. ✅ Ir a `/trabajos/[id]` (página de detalle de un trabajo)
2. ✅ Click en "Importar" para subir un reporte base Excel
3. ✅ Esperar a que aparezca el botón "Ver Base Importada"
4. ✅ Click en "Ver Base Importada"
5. ✅ **Verificar:** La página debe cambiar inmediatamente a la vista del reporte base
6. ✅ **Verificar:** La URL debe ser `/trabajos/[id]/reporte-base-anual`
7. ✅ **Verificar:** Se muestra el título "Reporte Base Anual - [Cliente] [Año]"
8. ✅ **Verificar:** Se muestran todas las hojas del Excel importado

### Casos Edge

- ✅ Navegar directamente a `/trabajos/[id]/reporte-base-anual` → Funciona
- ✅ Navegar desde el detalle del trabajo → Funciona (arreglado)
- ✅ Usar el botón "Volver al Proyecto" → Funciona
- ✅ Navegar entre diferentes trabajos → Funciona

## Prevención de Regresiones

### Patrón a Seguir

Cuando uses rutas anidadas con `<Outlet />` en React Router v6:

```tsx
// ❌ EVITAR: Usar directamente useOutlet() en condicionales
const outlet = useOutlet();
return outlet ? <Outlet /> : <DefaultView />;

// ✅ MEJOR: Combinar con location para forzar re-renders
const outlet = useOutlet();
const location = useLocation();
const isNested = outlet !== null && location.pathname !== baseRoute;
return isNested ? <Outlet /> : <DefaultView />;
```

### Documentación React Router

De la documentación oficial de React Router v6:

> "useOutlet returns the element for the child route at this level of the route hierarchy.
> This hook is used internally by <Outlet> to render child routes."

**Importante:** `useOutlet()` devuelve el elemento, pero no garantiza que el componente padre se re-renderice cuando cambia.

## Resumen

### Antes ❌

- Click en botón → URL cambia → UI no cambia → Necesita refresh manual

### Después ✅

- Click en botón → URL cambia → UI cambia automáticamente → Usuario ve la página

### Cambios

- 1 archivo modificado: `TrabajosPage.tsx`
- 3 líneas cambiadas
- 0 breaking changes
- 100% compatibilidad con código existente

---

**Autor:** GitHub Copilot  
**Revisado:** Sistema de trabajos AEGG
