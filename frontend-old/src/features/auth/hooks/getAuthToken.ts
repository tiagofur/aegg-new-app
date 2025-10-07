import { RootState } from '@store';

export function getAuthToken(state: RootState): string | null {
    return state.authState.token || localStorage.getItem('authToken');
}
