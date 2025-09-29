'use client';

import { usePathname } from 'next/navigation';

// Componente de indicador de progresso para navegação
const ProgressIndicator = () => {
  const pathname = usePathname();

  // Definir as etapas do processo
  const steps = [
    { id: 'index', name: 'Início', path: '/' },
    { id: 'register', name: 'Cadastro', path: '/register' },
    { id: 'test', name: 'Teste', path: '/test' },
    { id: 'results', name: 'Resultado', path: '/results' },
    { id: 'chat', name: 'Chat', path: '/chat' }
  ];

  // Determinar etapa atual
  const currentStepIndex = steps.findIndex(step => {
    if (step.path === '/' && pathname === '/') return true;
    if (step.path !== '/' && pathname.startsWith(step.path)) return true;
    return false;
  });

  // Se não está em uma das páginas principais, não mostrar o indicador
  if (currentStepIndex === -1) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                {/* Circle indicator */}
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step name */}
                <span className={`
                  ml-2 text-sm font-medium
                  ${isCompleted || isCurrent 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                  }
                `}>
                  {step.name}
                </span>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={`
                    ml-4 w-12 h-0.5
                    ${isCompleted 
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                    }
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;