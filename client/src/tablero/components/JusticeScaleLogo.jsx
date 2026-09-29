import { useEffect, useRef } from 'react'

const CYAN = '#4deaff'
const CYAN_SOFT = 'rgba(77, 234, 255, 0.18)'
const MAGENTA = '#e34dff'
const MAGENTA_SOFT = 'rgba(227, 77, 255, 0.35)'

const AMPLITUDE_DEG = 8
const PERIOD_MS = 6000

function drawScale(ctx, size, timestamp) {
  const phase = (2 * Math.PI * timestamp) / PERIOD_MS
  const angle = ((AMPLITUDE_DEG * Math.PI) / 180) * Math.sin(phase)
  // brightness "breathes" with the swing, peaking as the beam crosses center (max speed)
  const pulse = 0.6 + 0.4 * Math.abs(Math.cos(phase))

  const cx = size / 2
  const baseY = size * 0.88
  const baseWidth = size * 0.4
  const baseHeight = size * 0.08
  const pivotY = size * 0.22
  const beamHalf = size * 0.33
  const chainLength = size * 0.2
  const panRx = size * 0.12
  const panRy = size * 0.045

  ctx.clearRect(0, 0, size, size)

  // ambient holographic haze
  const haze = ctx.createRadialGradient(cx, size * 0.5, size * 0.05, cx, size * 0.5, size * 0.55)
  haze.addColorStop(0, `rgba(77, 234, 255, ${0.12 * pulse})`)
  haze.addColorStop(1, 'rgba(77, 234, 255, 0)')
  ctx.fillStyle = haze
  ctx.fillRect(0, 0, size, size)

  // projection rings under the base, like a holo landing pad
  ctx.save()
  ctx.shadowColor = CYAN
  ctx.shadowBlur = size * 0.04
  for (let i = 0; i < 3; i++) {
    const ry = size * (0.018 + i * 0.011)
    const rx = size * (0.2 + i * 0.055)
    ctx.beginPath()
    ctx.ellipse(cx, baseY + size * 0.025, rx, ry, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(77, 234, 255, ${0.32 - i * 0.09})`
    ctx.lineWidth = 1
    ctx.stroke()
  }
  ctx.restore()

  // base — wireframe pedestal
  ctx.save()
  ctx.shadowColor = CYAN
  ctx.shadowBlur = size * 0.05 * pulse
  ctx.beginPath()
  ctx.moveTo(cx - baseWidth / 2, baseY)
  ctx.lineTo(cx + baseWidth / 2, baseY)
  ctx.lineTo(cx + baseWidth / 2 - size * 0.05, baseY - baseHeight)
  ctx.lineTo(cx - baseWidth / 2 + size * 0.05, baseY - baseHeight)
  ctx.closePath()
  ctx.fillStyle = CYAN_SOFT
  ctx.fill()
  ctx.strokeStyle = CYAN
  ctx.lineWidth = Math.max(1, size * 0.012)
  ctx.stroke()
  ctx.restore()

  // column
  ctx.save()
  ctx.shadowColor = CYAN
  ctx.shadowBlur = size * 0.05 * pulse
  ctx.strokeStyle = CYAN
  ctx.lineWidth = Math.max(1, size * 0.018)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, pivotY)
  ctx.lineTo(cx, baseY - baseHeight)
  ctx.stroke()
  ctx.restore()

  // pivot core — power node with a HUD ring around it
  ctx.save()
  ctx.shadowColor = MAGENTA
  ctx.shadowBlur = size * 0.11 * pulse
  ctx.beginPath()
  ctx.arc(cx, pivotY, size * 0.026, 0, Math.PI * 2)
  ctx.fillStyle = MAGENTA
  ctx.fill()
  ctx.shadowBlur = size * 0.03
  ctx.strokeStyle = CYAN
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, pivotY, size * 0.05, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // beam + chains + pans all swing together around the pivot
  ctx.save()
  ctx.translate(cx, pivotY)
  ctx.rotate(angle)

  ctx.save()
  ctx.shadowColor = CYAN
  ctx.shadowBlur = size * 0.06 * pulse
  ctx.strokeStyle = CYAN
  ctx.lineWidth = Math.max(1, size * 0.016)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-beamHalf, 0)
  ctx.lineTo(beamHalf, 0)
  ctx.stroke()
  ctx.restore()

  for (const side of [-1, 1]) {
    const anchorX = side * beamHalf

    ctx.save()
    ctx.shadowColor = MAGENTA
    ctx.shadowBlur = size * 0.05 * pulse
    ctx.beginPath()
    ctx.arc(anchorX, 0, size * 0.013, 0, Math.PI * 2)
    ctx.fillStyle = MAGENTA
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.shadowColor = CYAN
    ctx.shadowBlur = size * 0.025
    ctx.strokeStyle = CYAN
    ctx.lineWidth = 1
    ctx.setLineDash([size * 0.02, size * 0.018])
    ctx.beginPath()
    ctx.moveTo(anchorX, 0)
    ctx.lineTo(anchorX, chainLength)
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.shadowColor = CYAN
    ctx.shadowBlur = size * 0.05 * pulse
    ctx.beginPath()
    ctx.ellipse(anchorX, chainLength, panRx, panRy, 0, 0, Math.PI * 2)
    ctx.fillStyle = CYAN_SOFT
    ctx.fill()
    ctx.strokeStyle = CYAN
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.shadowBlur = size * 0.02
    ctx.strokeStyle = MAGENTA_SOFT
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(anchorX - panRx, chainLength)
    ctx.lineTo(anchorX + panRx, chainLength)
    ctx.moveTo(anchorX, chainLength - panRy)
    ctx.lineTo(anchorX, chainLength + panRy)
    ctx.stroke()
    ctx.restore()
  }

  ctx.restore()
}

function JusticeScaleLogo({ size = 120 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    let rafId
    function frame(timestamp) {
      drawScale(ctx, size, timestamp)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => cancelAnimationFrame(rafId)
  }, [size])

  return <canvas ref={canvasRef} className="justice-scale-logo" aria-hidden="true" />
}

export default JusticeScaleLogo
