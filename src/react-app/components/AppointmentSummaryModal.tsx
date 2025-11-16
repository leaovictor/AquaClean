import type { Appointment } from "@/shared/types";
import { Car, Calendar, CheckCircle, XCircle, Clock, Info } from "lucide-react";

interface AppointmentSummaryModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

const statusDetails = {
  scheduled: {
    text: "Agendado",
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  completed: {
    text: "Concluído",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  canceled: {
    text: "Cancelado",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  pending: {
    text: "Pendente",
    icon: Info,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
};

export default function AppointmentSummaryModal({ appointment, onClose }: AppointmentSummaryModalProps) {
  if (!appointment) return null;

  const {
    text: statusText,
    icon: StatusIcon,
    color: statusColor,
    bgColor: statusBgColor,
  } = statusDetails[appointment.status] || statusDetails.pending;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Resumo do Agendamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {/* Status */}
          <div className={`flex items-center space-x-3 p-3 ${statusBgColor} rounded-xl border ${statusBgColor.replace('100', '200')}`}>
            <StatusIcon className={`w-6 h-6 ${statusColor} flex-shrink-0`} />
            <div>
              <p className="font-medium text-gray-900">Status</p>
              <p className={`text-sm ${statusColor}`}>{statusText}</p>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Car className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Veículo</p>
              <p className="text-gray-700 text-sm">
                {appointment.vehicle?.year} {appointment.vehicle?.make} {appointment.vehicle?.model}
              </p>
            </div>
          </div>

          {/* Service Details */}
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <CheckCircle className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Serviço</p>
              <p className="text-gray-700 text-sm">{appointment.service_type}</p>
            </div>
          </div>

          {/* Date/Time Details */}
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Calendar className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Data e Hora</p>
              <p className="text-gray-700 text-sm">
                {new Date(appointment.start_time).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}{' '}
                às {new Date(appointment.start_time).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {appointment.status === 'canceled' && appointment.canceled_at && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Cancelado em</p>
                <p className="text-gray-700 text-sm">
                  {new Date(appointment.canceled_at).toLocaleString('pt-BR', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
