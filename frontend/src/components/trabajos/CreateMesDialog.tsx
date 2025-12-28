import React, { useState } from 'react'
import { CreateMesDto, MESES_NOMBRES } from '../../types/trabajo'
import { mesesService } from '../../services'

interface CreateMesDialogProps {
    open: boolean
    trabajoId: string
    onClose: () => void
    onCreated: () => void
    existingMeses?: number[]
}

export const CreateMesDialog: React.FC<CreateMesDialogProps> = ({
    open,
    trabajoId,
    onClose,
    onCreated,
    existingMeses = [],
}) => {
    const [loading, setLoading] = useState(false)
    const [selectedMes, setSelectedMes] = useState<number>(1)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const mesDto: CreateMesDto = {
                trabajoId,
                mes: selectedMes,
            }

            await mesesService.create(mesDto)
            alert(`Mes ${MESES_NOMBRES[selectedMes - 1]} agregado correctamente`)
            onCreated()
            onClose()
        } catch (error: any) {
            console.error('Error al crear mes:', error)
            alert(error.response?.data?.message || 'Error al agregar el mes')
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Agregar Mes</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Selecciona el mes *
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {MESES_NOMBRES.map((nombre, index) => {
                                    const mesNum = index + 1
                                    const yaExiste = existingMeses.includes(mesNum)
                                    return (
                                        <button
                                            key={mesNum}
                                            type="button"
                                            onClick={() => setSelectedMes(mesNum)}
                                            disabled={yaExiste}
                                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                                selectedMes === mesNum
                                                    ? 'bg-blue-600 text-white'
                                                    : yaExiste
                                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                        >
                                            {nombre}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                                💡 Al agregar un mes, se crearán automáticamente los 3 reportes
                                mensuales (Ingresos, Ingresos Auxiliar y MI Admin).
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Agregando...' : 'Agregar Mes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
