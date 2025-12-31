import GIFEncoder from "gifencoder"
import { createCanvas } from "canvas"
import fs from "fs"
import { ContributionData } from "./fetchContributions.js"

/**
 * Render animated GIF of 3D contribution graph with cute rounded cylinder bars
 * Fixed viewpoint, animating bar heights
 */
export async function renderGif(
  contributionData: ContributionData,
  outputPath: string,
  width: number = 800,
  height: number = 600,
  frames: number = 30,
  delay: number = 100
): Promise<void> {
  const { contributions } = contributionData

  // Drawing parameters
  const PADDING = 10
  const HEIGHT_SCALE = 3
  const BAR_WIDTH_RATIO = 0.85
  const ROTATION = (45 * Math.PI) / 180
  const DEPTH_PROJECTION_FACTOR = 0.5
  const CYLINDER_SQUISH = 0.4 // How much to squish the ellipse (0-1, lower = more squished)

  // Calculate rotated positions for all contributions
  const tempSorted = contributions.map((c) => {
    const x = c.week
    const z = c.day
    const rotatedX = x * Math.cos(ROTATION) - z * Math.sin(ROTATION)
    const rotatedZ = x * Math.sin(ROTATION) + z * Math.cos(ROTATION)
    return { rotatedX, rotatedZ, count: c.count }
  })

  // Calculate bounds
  const minX = Math.min(...tempSorted.map((c) => c.rotatedX))
  const maxX = Math.max(...tempSorted.map((c) => c.rotatedX))
  const minZ = Math.min(...tempSorted.map((c) => c.rotatedZ))

  // Calculate scale based on width
  const graphWidth = maxX - minX
  const scale = (width - PADDING * 2) / (graphWidth + BAR_WIDTH_RATIO)
  const boxDepth = scale * BAR_WIDTH_RATIO

  // Calculate screen Y positions for all bars to determine canvas height
  const screenYPositions = tempSorted.map(({ rotatedZ, count }) => {
    const barHeight = count * 0.1
    const barVisualHeight = barHeight * scale * HEIGHT_SCALE
    const topY = (rotatedZ - minZ) * scale * DEPTH_PROJECTION_FACTOR - barVisualHeight
    const bottomY = (rotatedZ - minZ) * scale * DEPTH_PROJECTION_FACTOR
    return { topY, bottomY }
  })

  const minTopY = Math.min(...screenYPositions.map((p) => p.topY - boxDepth))
  const maxBottomY = Math.max(...screenYPositions.map((p) => p.bottomY))

  // Calculate exact canvas dimensions
  const canvasWidth = Math.ceil((graphWidth + BAR_WIDTH_RATIO) * scale + PADDING * 2)
  const canvasHeight = Math.ceil(maxBottomY - minTopY + PADDING * 2)

  // Create canvas with exact size
  const canvas = createCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext("2d")

  // Create GIF encoder
  const encoder = new GIFEncoder(canvasWidth, canvasHeight)
  const stream = fs.createWriteStream(outputPath)

  encoder.createReadStream().pipe(stream)
  encoder.start()
  encoder.setRepeat(0) // 0 for infinite loop
  encoder.setDelay(delay) // Frame delay in ms
  encoder.setQuality(10) // Image quality (1-20, lower is better)
  encoder.setTransparent(0x000000) // Set transparent color

  // Position graph - align top to padding
  const offsetX = minX
  const offsetZ = minZ
  const centerX = PADDING
  const centerY = PADDING - minTopY // Offset to make top align with padding

  // Precompute sorted contributions with rotated positions
  const sorted = contributions
    .map((c) => {
      const x = c.week
      const z = c.day
      const rotatedX = x * Math.cos(ROTATION) - z * Math.sin(ROTATION)
      const rotatedZ = x * Math.sin(ROTATION) + z * Math.cos(ROTATION)
      return { ...c, rotatedX, rotatedZ }
    })
    .sort((a, b) => a.rotatedZ - b.rotatedZ) // Front to back for proper depth

  // Render each frame with bars growing up then shrinking down (seamless loop)
  // Animation goes from small -> full -> small, and loops back seamlessly
  const totalFrames = frames * 2

  for (let frame = 0; frame < totalFrames; frame++) {
    // Use cosine wave for symmetric easing (slow at both ends, fast in middle)
    // cos(0) = 1, cos(π) = -1, so we invert and normalize: (1 - cos(t * 2π)) / 2
    const t = frame / totalFrames
    const progress = (1 - Math.cos(t * 2 * Math.PI)) / 2

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Draw each bar with animated height
    sorted.forEach(({ count, rotatedX, rotatedZ }) => {
      // Skip drawing bars with 0 contributions
      if (count === 0) return

      const targetBarHeight = Math.max(0.1, count * 0.1)
      const barHeight = targetBarHeight * progress // Animate from 0 to target height

      // Calculate screen position with isometric projection
      const screenX = centerX + (rotatedX - offsetX) * scale
      const screenY = centerY - barHeight * scale * HEIGHT_SCALE + (rotatedZ - offsetZ) * scale * DEPTH_PROJECTION_FACTOR

      // GitHub-style green color palette (deeper/richer)
      let color: string
      if (count < 5) color = "#064420"
      else if (count < 10) color = "#046b2d"
      else if (count < 15) color = "#059142"
      else color = "#06b54e"

      // Draw cute rounded cylinder (pill shape)
      const cylinderRadius = (scale * BAR_WIDTH_RATIO) / 2
      const ellipseHeight = cylinderRadius * CYLINDER_SQUISH
      const minBarHeight = ellipseHeight * 0.5 // Minimum height so bars are visible at progress=0
      const barVisualHeight = Math.max(minBarHeight, barHeight * scale * HEIGHT_SCALE)

      if (barVisualHeight > 0) {
        // Center of the cylinder base
        const baseCenterX = screenX
        const baseCenterY = screenY + barVisualHeight

        // Center of the cylinder top
        const topCenterX = screenX
        const topCenterY = screenY

        // Draw cylinder body with rich gradient
        const bodyGradient = ctx.createLinearGradient(baseCenterX - cylinderRadius, baseCenterY, baseCenterX + cylinderRadius, baseCenterY)
        bodyGradient.addColorStop(0, adjustBrightness(color, 0.5))
        bodyGradient.addColorStop(0.15, adjustBrightness(color, 0.75))
        bodyGradient.addColorStop(0.4, adjustBrightness(color, 1.1))
        bodyGradient.addColorStop(0.6, adjustBrightness(color, 1.15))
        bodyGradient.addColorStop(0.85, adjustBrightness(color, 0.85))
        bodyGradient.addColorStop(1, adjustBrightness(color, 0.6))

        ctx.fillStyle = bodyGradient
        ctx.beginPath()
        ctx.moveTo(baseCenterX - cylinderRadius, baseCenterY)
        ctx.lineTo(topCenterX - cylinderRadius, topCenterY)
        ctx.ellipse(topCenterX, topCenterY, cylinderRadius, ellipseHeight, 0, Math.PI, 0)
        ctx.lineTo(baseCenterX + cylinderRadius, baseCenterY)
        ctx.ellipse(baseCenterX, baseCenterY, cylinderRadius, ellipseHeight, 0, 0, Math.PI)
        ctx.closePath()
        ctx.fill()

        // Add vertical highlight streak on body
        const streakGradient = ctx.createLinearGradient(
          baseCenterX - cylinderRadius * 0.3,
          baseCenterY,
          baseCenterX + cylinderRadius * 0.1,
          baseCenterY
        )
        streakGradient.addColorStop(0, "rgba(255, 255, 255, 0)")
        streakGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.15)")
        streakGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

        ctx.fillStyle = streakGradient
        ctx.beginPath()
        ctx.moveTo(baseCenterX - cylinderRadius * 0.5, baseCenterY)
        ctx.lineTo(topCenterX - cylinderRadius * 0.5, topCenterY)
        ctx.lineTo(topCenterX + cylinderRadius * 0.1, topCenterY)
        ctx.lineTo(baseCenterX + cylinderRadius * 0.1, baseCenterY)
        ctx.closePath()
        ctx.fill()

        // Draw bottom ellipse (darker rim)
        ctx.fillStyle = adjustBrightness(color, 0.4)
        ctx.beginPath()
        ctx.ellipse(baseCenterX, baseCenterY, cylinderRadius, ellipseHeight, 0, 0, Math.PI)
        ctx.closePath()
        ctx.fill()

        // Draw top ellipse with luxurious gradient
        const topGradient = ctx.createRadialGradient(
          topCenterX - cylinderRadius * 0.35,
          topCenterY - ellipseHeight * 0.4,
          0,
          topCenterX,
          topCenterY,
          cylinderRadius * 1.2
        )
        topGradient.addColorStop(0, adjustBrightness(color, 1.6))
        topGradient.addColorStop(0.3, adjustBrightness(color, 1.3))
        topGradient.addColorStop(0.7, adjustBrightness(color, 1.0))
        topGradient.addColorStop(1, adjustBrightness(color, 0.8))

        ctx.fillStyle = topGradient
        ctx.beginPath()
        ctx.ellipse(topCenterX, topCenterY, cylinderRadius, ellipseHeight, 0, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fill()

        // Draw rim/outline on top ellipse
        ctx.strokeStyle = adjustBrightness(color, 0.6)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(topCenterX, topCenterY, cylinderRadius, ellipseHeight, 0, 0, Math.PI * 2)
        ctx.stroke()

        // Main highlight on top (glass-like effect)
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)"
        ctx.beginPath()
        ctx.ellipse(
          topCenterX - cylinderRadius * 0.3,
          topCenterY - ellipseHeight * 0.15,
          cylinderRadius * 0.35,
          ellipseHeight * 0.45,
          -0.4,
          0,
          Math.PI * 2
        )
        ctx.closePath()
        ctx.fill()

        // Secondary smaller highlight (sparkle)
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
        ctx.beginPath()
        ctx.ellipse(
          topCenterX - cylinderRadius * 0.45,
          topCenterY - ellipseHeight * 0.1,
          cylinderRadius * 0.12,
          ellipseHeight * 0.2,
          -0.3,
          0,
          Math.PI * 2
        )
        ctx.closePath()
        ctx.fill()
      }
    })

    // Add frame to GIF
    encoder.addFrame(ctx.getImageData(0, 0, canvasWidth, canvasHeight).data)

    if ((frame + 1) % 10 === 0 || frame === totalFrames - 1) {
      console.log(`Rendering frame ${frame + 1}/${totalFrames}`)
    }
  }

  encoder.finish()

  return new Promise<void>((resolve, reject) => {
    stream.on("finish", () => {
      console.log(`GIF saved to ${outputPath}`)
      resolve()
    })
    stream.on("error", reject)
  })
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const newR = Math.min(255, Math.floor(r * factor))
  const newG = Math.min(255, Math.floor(g * factor))
  const newB = Math.min(255, Math.floor(b * factor))

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
}
