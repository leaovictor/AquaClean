import { MessageCircle } from 'lucide-react';

export default function WhatsAppWidget() {
    // Replace with the actual support number
    const phoneNumber = "5511999999999";
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre os serviços da AquaClean Pro.");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center group"
            aria-label="Contato via WhatsApp"
        >
            <MessageCircle className="w-8 h-8" />
            <span className="absolute right-full mr-3 bg-white text-gray-800 px-3 py-1 rounded-lg text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                Fale Conosco
            </span>
        </a>
    );
}
