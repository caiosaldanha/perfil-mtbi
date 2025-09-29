
import Link from 'next/link';
import ProgressIndicator from './ProgressIndicator';

// Componente de navegação principal da aplicação
const Navbar = () => {
  return (
    <>
      <nav className="bg-transparent p-4">
        <div className="container mx-auto flex justify-between items-center border-b border-gray-200 pb-4">
          {/* Logo da aplicação */}
          <Link href="/" className="text-gray-800 text-2xl font-bold">
            MBTI
          </Link>
          {/* Links de navegação em ordem lógica de processo */}
          <div className="flex space-x-6 items-center">
            <Link href="/register" className="text-gray-600 hover:text-gray-800 font-medium">
              Cadastro
            </Link>
            <Link href="/test" className="text-gray-600 hover:text-gray-800 font-medium">
              Teste
            </Link>
            <Link href="/results" className="text-gray-600 hover:text-gray-800 font-medium">
              Resultados
            </Link>
            <Link href="/chat" className="text-gray-600 hover:text-gray-800 font-medium">
              Chat
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Indicador de progresso */}
      <ProgressIndicator />
    </>
  );
};

export default Navbar;
