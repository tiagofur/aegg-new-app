// src/features/users/components/UsersTable.tsx
import React, { useMemo } from 'react';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Box, Typography, IconButton } from '@mui/material'; // Importa IconButton
import EditIcon from '@mui/icons-material/Edit'; // Icono para editar
import DeleteIcon from '@mui/icons-material/Delete'; // Icono para eliminar
import { User } from '../pages/UsersPage';

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void; // <-- Nuevo prop
}

const UsersTable: React.FC<UsersTableProps> = ({ users, isLoading, onEditUser, onDeleteUser }) => {
  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      // ... (otras columnas como id, name, email, role) ...
       {
        accessorKey: "id",
        header: "ID",
        size: 150,
        enableEditing: false,
      },
      {
        accessorKey: "name",
        header: "Nombre",
        size: 200,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 250,
      },
      {
        accessorKey: "role",
        header: "Rol",
        size: 100,
        Cell: ({ cell }) => <Typography>{cell.getValue<string>()}</Typography>,
      },
      {
        id: "actions",
        header: "Acciones",
        size: 120, // Ajusta el tamaño si es necesario
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <IconButton
              color="secondary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEditUser(row.original);
              }}
              aria-label="Editar usuario"
            >
              <EditIcon />
            </IconButton>
            <IconButton // <-- Botón de Eliminar
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteUser(row.original); // <-- Llama a la nueva función
              }}
              aria-label="Eliminar usuario"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ),
      },
    ],
    [onEditUser, onDeleteUser] // <-- Añade onDeleteUser a las dependencias
  );

  return (
    <MaterialReactTable
      columns={columns}
      data={users ?? []}
      state={{ isLoading }}
      enableColumnFilters={true}
      enableSorting={true}
      enablePagination={true}
      // localization={MRT_Localization_ES} // Opcional
      // Puedes añadir más props de MRT si necesitas
    />
  );
};

export default UsersTable;
