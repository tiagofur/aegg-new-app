import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Trabajo } from "../../../types/trabajo";

global.alert = vi.fn();

const navigateMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const limpiarDatosMock = vi.fn();

function servicesMock() {
  return {
    trabajosService: {
      delete: deleteMock,
      update: updateMock,
    },
    reportesMensualesService: {
      limpiarDatos: limpiarDatosMock,
      procesarYGuardar: vi.fn(),
    },
  };
}

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../services", servicesMock);
vi.mock("@/services", servicesMock);

let TrabajoDetail: typeof import("../TrabajoDetail").TrabajoDetail;

beforeAll(async () => {
  ({ TrabajoDetail } = await import("../TrabajoDetail"));
});

describe("TrabajoDetail", () => {
  const baseTrabajo: Trabajo = {
    id: "trabajo-aprobado",
    clienteId: "cliente-1",
    clienteNombre: "Cliente Demo",
    clienteRfc: "RFC123456",
    anio: 2024,
    estado: "ACTIVO",
    estadoAprobacion: "APROBADO",
    visibilidadEquipo: true,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    meses: [],
    miembroAsignado: { id: "user-1", email: "user@example.com" },
    aprobadoPor: { id: "gestor-1", email: "gestor@example.com" },
  };

  const defaultProps = {
    onAddMes: vi.fn(),
    onBack: vi.fn(),
    onReload: vi.fn(),
    canManage: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloquea acciones de edición cuando el trabajo está aprobado", () => {
    render(<TrabajoDetail trabajo={baseTrabajo} {...defaultProps} />);

    expect(screen.queryByRole("button", { name: /editar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();

    const reopenButton = screen.getByRole("button", {
      name: /reabrir trabajo/i,
    });
    expect(reopenButton).toBeEnabled();

    const importButton = screen.getByRole("button", { name: /importar/i });
    expect(importButton).toBeDisabled();
  });

  it("reabre el trabajo aprobado cuando el Gestor lo confirma", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => true);

    render(
      <TrabajoDetail
        trabajo={baseTrabajo}
        {...defaultProps}
        onReload={onReload}
      />
    );

    const reopenButton = screen.getByRole("button", {
      name: /reabrir trabajo/i,
    });

    await user.click(reopenButton);

    expect(updateMock).toHaveBeenCalledWith("trabajo-aprobado", {
      estadoAprobacion: "REABIERTO",
      aprobadoPorId: null,
    });

    await waitFor(() => expect(onReload).toHaveBeenCalled());

    confirmSpy.mockRestore();
  });
});
