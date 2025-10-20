import React, { ForwardedRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";
import { Cliente } from "../../../types";

const mockCliente: Cliente = {
  id: "cliente-mock",
  nombre: "Cliente Mock",
  rfc: "RFC123456",
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
    getAll: vi.fn().mockResolvedValue([
      {
        id: "usuario-1",
        name: "Gestor Demo",
        email: "gestor@example.com",
        role: "Gestor",
      },
      {
        id: "miembro-1",
        name: "Miembro Demo",
        email: "miembro@example.com",
        role: "Miembro",
      },
    ]),
  },
}));

let CreateTrabajoDialog: typeof import("../CreateTrabajoDialog").CreateTrabajoDialog;

beforeAll(async () => {
  ({ CreateTrabajoDialog } = await import("../CreateTrabajoDialog"));
});

describe("CreateTrabajoDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite abrir y guardar un cliente desde el diálogo de creación", async () => {
    const user = userEvent.setup();

    render(
      <CreateTrabajoDialog
        open
        onClose={vi.fn()}
        onCreated={vi.fn()}
        currentUserId="usuario-1"
      />
    );

    expect(screen.queryByTestId("cliente-form-modal")).not.toBeInTheDocument();

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

    expect(
      screen.getByRole("button", { name: /editar cliente seleccionado/i })
    ).toBeVisible();
    expect(mockRefresh).toHaveBeenCalled();
  });
});
