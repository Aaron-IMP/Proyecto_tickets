function LoadingSpinner({ texto = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[#3A3A48] border-t-[#7C3AED] animate-spin" />
      <p className="text-[#A8A8B3] text-sm">{texto}</p>
    </div>
  );
}

export default LoadingSpinner;
