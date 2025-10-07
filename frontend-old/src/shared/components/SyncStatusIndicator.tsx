import React from 'react';
import { Box, IconButton, Tooltip, Chip, Badge } from '@mui/material';
import {
  CloudDone as OnlineIcon,
  CloudOff as OfflineIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  CloudSync as CloudSyncIcon,
} from '@mui/icons-material';
import { useSyncService } from '../hooks/useSyncService';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  showDetails = true,
  compact = false,
}) => {
  const { state, forceSync, isInitialized } = useSyncService();

  if (!isInitialized) {
    return null;
  }

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Error al forzar sincronización:', error);
    }
  };

  const getStatusIcon = () => {
    if (state.isSyncing) {
      return <SyncIcon className="animate-spin" />;
    }

    if (state.error) {
      return <WarningIcon color="error" />;
    }

    if (state.pendingCount > 0) {
      return (
        <Badge badgeContent={state.pendingCount} color="warning">
          <CloudSyncIcon color="action" />
        </Badge>
      );
    }

    return state.isOnline ? <OnlineIcon color="success" /> : <OfflineIcon color="disabled" />;
  };

  const getStatusText = () => {
    if (state.isSyncing) {
      return 'Sincronizando...';
    }

    if (state.error) {
      return `Error: ${state.error}`;
    }

    if (state.pendingCount > 0) {
      return `${state.pendingCount} cambios pendientes`;
    }

    if (state.isOnline) {
      return state.lastSync
        ? `Último sync: ${state.lastSync.toLocaleTimeString()}`
        : 'Online - Sincronizado';
    }

    return 'Trabajando offline';
  };

  const getStatusColor = () => {
    if (state.error) return 'error' as const;
    if (state.pendingCount > 0) return 'warning' as const;
    if (state.isOnline) return 'success' as const;
    return 'default' as const;
  };

  if (compact) {
    return (
      <Tooltip title={getStatusText()}>
        <IconButton size="small" onClick={handleForceSync} disabled={state.isSyncing}>
          {getStatusIcon()}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title="Forzar sincronización">
        <IconButton size="small" onClick={handleForceSync} disabled={state.isSyncing}>
          {getStatusIcon()}
        </IconButton>
      </Tooltip>

      {showDetails && (
        <Chip label={getStatusText()} color={getStatusColor()} variant="outlined" size="small" />
      )}
    </Box>
  );
};

export default SyncStatusIndicator;
