import React, { useState } from "react";
import { useAppDispatch } from "@store/hooks";
import {
  updateTask,
  deleteTask,
  TaskItem,
} from "@features/tasks/redux/tasksSlice";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
  Box,
} from "@mui/material";

interface EditTaskFormProps {
  open: boolean;
  onClose: () => void;
  task: TaskItem;
}

const EditTaskForm: React.FC<EditTaskFormProps> = ({ open, onClose, task }) => {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>(
    {}
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { title?: string; dueDate?: string } = {};

    if (!title.trim()) {
      newErrors.title = "El título de la tarea es requerido";
    } else if (title.trim().length < 3) {
      newErrors.title = "El título debe tener al menos 3 caracteres";
    } else if (title.trim().length > 200) {
      newErrors.title = "El título no puede exceder 200 caracteres";
    }

    if (dueDate) {
      const selectedDate = new Date(dueDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.dueDate = "La fecha de vencimiento no puede ser en el pasado";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await dispatch(
        updateTask({
          id: task._id,
          title: title.trim(),
          priority,
          dueDate: dueDate || undefined,
        })
      ).unwrap();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;

    setDeleting(true);
    try {
      await dispatch(deleteTask(task._id)).unwrap();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!submitting && !deleting) {
      setTitle(task.title);
      setPriority(task.priority);
      setDueDate(task.dueDate || "");
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Editar Tarea</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              type="date"
              label="Fecha límite"
              InputLabelProps={{ shrink: true }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              error={!!errors.dueDate}
              helperText={errors.dueDate}
              fullWidth
            />
            <TextField
              select
              label="Prioridad"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "low" | "normal" | "high")
              }
              sx={{ maxWidth: 160 }}
            >
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Button
              onClick={handleDelete}
              color="error"
              disabled={submitting || deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={handleClose} disabled={submitting || deleting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || deleting}
              >
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditTaskForm;
