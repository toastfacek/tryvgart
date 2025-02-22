const LoadingSpinner = () => (
  <div className="page-container">
    <div className="content-container">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin text-4xl">🎮</div>
        <p className="text-lg text-white/90">Loading...</p>
      </div>
    </div>
  </div>
)

export default LoadingSpinner 