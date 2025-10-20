import React, { ForwardedRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Cliente, Trabajo } from "../../../types";

global.alert = vi.fn();

const mockCliente: Cliente = {
  id: "cliente-edit",
  nombre: "Cliente Existente",
  rfc: "RFCEDIT01",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {},
};

const mockRefresh = vi.fn();
const mockLoad = vi.fn();

function clientesMockFactory() {
  const ClienteSelector = React.forwardRef(
    (
      {
        onChange,
        helperText,
      }: {
        onChange?: (clienteId: string | null, cliente: Cliente | null) => void;
        helperText?: string;
      },
      ref: ForwardedRef<unknown>
    ) => {
      React.useImperativeHandle(ref, () => ({
        refresh: mockRefresh,
        loadCliente: mockLoad,
      }));

      return (
        <div>
          <button
            type="button"
            onClick={() => onChange?.(mockCliente.id, mockCliente)}
          >
            Seleccionar cliente mock
          </button>
          {helperText ? <span>{helperText}</span> : null}
        </div>
      );
    }
  );

  const ClienteFormModal = ({
    open,
    onClose,
    onSaved,
    initialData,
  }: {
    open: boolean;
    onClose: () => void;
    onSaved: (cliente: Cliente) => void;
    initialData?: Cliente | null;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="cliente-form-modal">
        <div data-testid="modal-mode">{initialData ? "edit" : "create"}</div>
        <button type="button" onClick={() => onSaved(mockCliente)}>
          Guardar cliente mock
        </button>
        <button type="button" onClick={onClose}>
          Cerrar modal mock
        </button>
      </div>
    );
  };

  return {
    ClienteSelector,
    ClienteFormModal,
  };
}

vi.mock("../../features/clientes", clientesMockFactory);
vi.mock("@/features/clientes", clientesMockFactory);

vi.mock("../../../services/users", () => ({
  usersApi: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

let EditTrabajoDialog: typeof import("../EditTrabajoDialog").EditTrabajoDialog;

beforeAll(async () => {
  ({ EditTrabajoDialog } = await import("../EditTrabajoDialog"));
});

describe("EditTrabajoDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseTrabajo: Trabajo = {
    id: "trabajo-1",
    clienteId: mockCliente.id,
    clienteNombre: mockCliente.nombre,
    clienteRfc: mockCliente.rfc,
    anio: 2024,
    estado: "ACTIVO",
    estadoAprobacion: "EN_PROGRESO",
    visibilidadEquipo: true,
    miembroAsignadoId: null,
    gestorResponsableId: null,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    aprobadoPorId: null,
    meses: [],
    cliente: mockCliente,
  };

  it("abre el modal en modo creación y refresca el selector tras guardar", async () => {
    const user = userEvent.setup();

    render(
      <EditTrabajoDialog
        trabajo={baseTrabajo}
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /crear nuevo cliente/i })
    );
    expect(await screen.findByTestId("cliente-form-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-mode")).toHaveTextContent("create");

    await user.click(
      screen.getByRole("button", { name: /guardar cliente mock/i })
    );

    await waitFor(() =>
      expect(screen.queryByTestId("cliente-form-modal")).not.toBeInTheDocument()
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("abre el modal en modo edición cuando hay cliente seleccionado", async () => {
    const user = userEvent.setup();

    render(
      <EditTrabajoDialog
        trabajo={baseTrabajo}
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /editar cliente seleccionado/i })
    );
    const modal = await screen.findByTestId("cliente-form-modal");
    expect(modal).toBeInTheDocument();
    expect(screen.getByTestId("modal-mode")).toHaveTextContent("edit");
  });
});
