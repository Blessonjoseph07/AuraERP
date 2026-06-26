import React from 'react'

const FloatingBlob = ({ className = "" }) => {
  return (
    <div className={`floating-blob-container ${className}`}>
      {/* Layered wobbly glass shells to replicate the organic circular ends from the shared image */}
      <div className="blob-glass-backplate blob-layer-1" />
      <div className="blob-glass-backplate blob-layer-2" />
      <div className="blob-glass-backplate blob-layer-3" />
    </div>
  )
}

export default FloatingBlob
