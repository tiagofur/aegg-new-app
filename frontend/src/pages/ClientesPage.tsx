import React, { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Cliente } from "../types";
import { ClienteFormModal, ClientesTable } from "../features/clientes";

export const ClientesPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const openCreateModal = () => {
    setSelectedCliente(null);
    setModalOpen(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setRefreshToken((value) => value + 1);
  };

  return (
    <AppShell
      title="Clientes"
      breadcrumbs={[
        { label: "Inicio", to: "/dashboard" },
        { label: "Clientes" },
      ]}
    >
      <ClientesTable
        onRequestCreate={openCreateModal}
        onRequestEdit={openEditModal}
        refreshToken={refreshToken}
      />

      <ClienteFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
        initialData={selectedCliente}
      />
    </AppShell>
  );
};
