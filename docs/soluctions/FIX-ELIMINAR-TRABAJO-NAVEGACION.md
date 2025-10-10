# Fix: Navegación después de eliminar un trabajo

## Problema

Cuando se eliminaba un trabajo (proyecto), la interfaz no regresaba automáticamente a la lista de trabajos. El usuario se quedaba en la vista del trabajo eliminado, mostrando una pantalla vacía o con errores.

## Causa

En el componente `TrabajoDetail.tsx`, el método `handleEliminarProyecto()` estaba usando:

```tsx
navigate("/trabajos");
```

Pero esto no funcionaba correctamente porque el componente está diseñado para usar callbacks para la navegación entre vistas.

## Solución

Se cambió el método `handleEliminarProyecto()` para usar el callback `onBack()` en lugar de `navigate()`:

```tsx
try {
  await trabajosService.delete(trabajo.id);
  alert("Proyecto eliminado correctamente");
  // Volver a la lista de trabajos después de eliminar
  onBack();
} catch (error: any) {
  console.error("Error al eliminar proyecto:", error);
  alert(error.response?.data?.message || "Error al eliminar el proyecto");
} finally {
  setEliminando(false);
}
```

## Archivo Modificado

- `frontend/src/components/trabajos/TrabajoDetail.tsx`

## Comportamiento Esperado

Ahora cuando se elimina un trabajo:

1. Se muestra la doble confirmación de seguridad
2. Se elimina el trabajo del backend
3. Se muestra el mensaje "Proyecto eliminado correctamente"
4. **Automáticamente regresa a la lista de trabajos**
5. La lista se recarga mostrando todos los trabajos excepto el eliminado

## Prueba

1. Ir a la lista de trabajos
2. Seleccionar un trabajo para ver sus detalles
3. Click en "Eliminar Proyecto"
4. Confirmar ambas ventanas de confirmación
5. Verificar que después de eliminar, la interfaz regrese automáticamente a la lista de trabajos

## Nota

El `useNavigate` y `navigate` aún se mantienen en el componente porque se usan para navegar al reporte anual en otra parte del código.
