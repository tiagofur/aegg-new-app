import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api, { authApi, LoginData, RegisterData } from '../services/api'
import { AppUser, DashboardRole } from '../types'

interface AuthContextType {
    user: AppUser | null
    token: string | null
    login: (data: LoginData) => Promise<void>
    register: (data: RegisterData) => Promise<void>
    logout: () => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const emailRoleOverrides: Record<string, DashboardRole> = {
    'tiagofur@gmail.com': 'Admin',
}

const normalizeUser = (raw: any): AppUser => {
    const fallbackRole = emailRoleOverrides[raw?.email?.toLowerCase() ?? '']
    const rawRole = raw?.role ?? fallbackRole ?? 'Gestor'
    const role: DashboardRole = (() => {
        if (rawRole === 'Admin' || rawRole === 'Gestor' || rawRole === 'Miembro') {
            return rawRole
        }
        if (rawRole === 'Ejecutor') {
            return 'Miembro'
        }
        return 'Gestor'
    })()
    return {
        id: raw?.id ?? '',
        email: raw?.email ?? '',
        name: raw?.name ?? '',
        role,
        createdAt: raw?.createdAt,
        updatedAt: raw?.updatedAt,
        equipoId: raw?.equipoId ?? null,
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
            try {
                setToken(storedToken)
                const parsed = JSON.parse(storedUser)
                const normalized = normalizeUser(parsed)
                setUser(normalized)
                if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
                    localStorage.setItem('user', JSON.stringify(normalized))
                }
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
            } catch (error) {
                console.error('Error parsing stored user data:', error)
                // Clear invalid data
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                delete api.defaults.headers.common['Authorization']
            }
        } else {
            delete api.defaults.headers.common['Authorization']
        }
        setIsLoading(false)
    }, [])

    const login = async (data: LoginData) => {
        const response = await authApi.login(data)
        const normalizedUser = normalizeUser(response.user)
        setUser(normalizedUser)
        setToken(response.token)
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`
    }

    const register = async (data: RegisterData) => {
        const response = await authApi.register(data)
        const normalizedUser = normalizeUser(response.user)
        setUser(normalizedUser)
        setToken(response.token)
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
    }

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
