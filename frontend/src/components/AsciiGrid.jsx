import React, { useEffect, useRef } from 'react'

const AsciiGrid = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Mouse coordinates tracking
    let mouseX = -1000
    let mouseY = -1000

    const handleMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const handleMouseLeave = () => {
      mouseX = -1000
      mouseY = -1000
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    // ASCII characters representing AuraERP and visual symbols
    const chars = 'AURAERP+.#/@%*=: '.split('')
    const bubbleChars = 'o•°*'.split('')
    const fontSize = 14
    ctx.font = `bold ${fontSize}px 'Courier New', Courier, monospace`
    
    let time = 0

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.025

      const colStep = 18
      const rowStep = 18
      
      const centerX = width / 2
      const centerY = height / 2
      const maxBlobRadius = window.innerWidth > 768 ? 312 : 240
      
      for (let x = 12; x < width; x += colStep) {
        for (let y = 18; y < height; y += rowStep) {
          // Skip drawing in the inner-most center to preserve readability of text inputs
          const isInnerCenter = Math.abs(x - centerX) < 205 && Math.abs(y - centerY) < 225
          if (isInnerCenter) continue

          // Proximity to mouse
          const dxMouse = mouseX - x
          const dyMouse = mouseY - y
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse)
          
          // Distance to center (blob position)
          const dxCenter = x - centerX
          const dyCenter = y - centerY
          const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter)
          
          // Calculate wobbly boundary at this angle to see if character is inside the blob
          const angle = Math.atan2(dyCenter, dxCenter)
          const w1 = Math.sin(3 * angle + time * 0.5) * 0.12
          const w2 = Math.cos(2 * angle - time * 0.3) * 0.08
          const w3 = Math.sin(5 * angle + time * 0.8) * 0.05
          const dynamicRadius = maxBlobRadius * (1.0 + w1 + w2 + w3)
          
          const isInsideBlob = distCenter < dynamicRadius
          
          // Wave ripple calculation for character indices
          const wave = Math.sin(x * 0.006 + y * 0.006 - time)
          
          let finalChar = ''
          let opacity = 0.22 // Lighter base grid is more visible at 0.22 opacity
          // Base color: sand / terracotta orange
          let color = 'rgba(184, 107, 74, '
          
          if (isInsideBlob) {
            // Map to bubble characters for a clean frosted look inside the glass
            const charIndexBubble = Math.floor((wave + 1) * 0.5 * (bubbleChars.length - 1))
            finalChar = bubbleChars[charIndexBubble % bubbleChars.length]
            
            // Color: frosted light cream/amber
            color = 'rgba(240, 220, 200, '
            opacity = 0.35 // higher visibility inside the glass to represent frosting shine
          } else {
            // Outside blob
            const charIndex = Math.floor((wave + 1) * 0.5 * (chars.length - 1))
            finalChar = chars[charIndex % chars.length]
          }
          
          // Mouse interaction overrides
          if (distMouse < 180) {
            const factor = 1 - distMouse / 180
            opacity = Math.max(opacity, 0.22 + factor * 0.53) // light up on hover
            
            // Fade hover color into vibrant brand orange: rgb(200, 90, 50)
            color = 'rgba(200, 90, 50, '
          }
          
          ctx.fillStyle = `${color}${opacity})`
          ctx.fillText(finalChar, x, y)
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 select-none"
    />
  )
}

export default AsciiGrid
