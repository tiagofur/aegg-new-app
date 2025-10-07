export const apiRequest = async (
    endpoint: string,
    method: string = "GET",
    body?: unknown,
    token?: string
): Promise<unknown> => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        //const response = await fetch(`https://aegg-api.creapolis.mx${endpoint}`, {
        const response = await fetch(`http://localhost:3001${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        const responseBodyText = await response.text();
        let parsedBody: unknown;

        try {
            parsedBody = JSON.parse(responseBodyText);
        } catch {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}. Respuesta del servidor: ${responseBodyText}`);
            }
            throw new Error("La respuesta del servidor no tiene un formato JSON válido.");
        }

        if (!response.ok) {
            const errorMessage = (parsedBody as { message?: string })?.message || `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return parsedBody;
    } catch (error) {
        // Mejorar el manejo de errores de red
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté funcionando y tu conexión a internet.');
        }

        // Re-lanzar el error si ya es un Error personalizado
        if (error instanceof Error) {
            throw error;
        }

        // Error desconocido
        throw new Error('Error desconocido en la comunicación con el servidor.');
    }
};