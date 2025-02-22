import { useEffect, useRef, useState, type FC } from 'react'
import { useCurrentPlaylist, usePlayed } from '@/entities/active-track'

interface Ball {
  color: string
  x: number
  baseY: number
  phase: number
  speed: number
}

enum AnimatedState {
  INITIAL = 'initial',
  PAUSE = 'pause',
  START = 'start'
}

const balls: Ball[] = [
  { color: '#fd2cfb', x: 180, baseY: 87, phase: 0, speed: 0.04 },
  { color: '#11d5df', x: 300, baseY: 87, phase: 0, speed: 0.05 },
  { color: '#0d7afe', x: 420, baseY: 87, phase: 0, speed: 0.06 },
  { color: '#9b15cc', x: 540, baseY: 87, phase: 0, speed: 0.03 }
]

interface VKMixBallsProps {
  width: number
  height: number
}

export const VKMixBalls: FC<VKMixBallsProps> = ({ width, height }) => {
  const canvasRef = useRef(null)
  const animationFrameId = useRef<number | null>(null)
  const [animated, setAnimated] = useState(AnimatedState.INITIAL)

  const currentPlaylist = useCurrentPlaylist()
  const played = usePlayed()

  useEffect(() => {
    const startAnimation = (initial: boolean): void => {
      const canvas = canvasRef.current as (HTMLCanvasElement | null)
      if (canvas == null) {
        return
      }

      const ctx = canvas.getContext('2d')
      if (ctx == null) {
        return
      }

      const render = () => {
        draw(canvas, ctx, balls)
        if (!initial) {
          animationFrameId.current = requestAnimationFrame(render)
        }
      }
      render()
    }

    const stopAnimation = () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }

    switch (animated) {
      case AnimatedState.INITIAL:
        startAnimation(true)
        stopAnimation()
        break
      case AnimatedState.START:
        startAnimation(false)
        break
      case AnimatedState.PAUSE:
        stopAnimation()
        break
    }
  }, [animated])

  useEffect(() => {
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  useEffect(() => {
    if (currentPlaylist != null && currentPlaylist.isVkMix) {
      setAnimated(played ? AnimatedState.START : AnimatedState.PAUSE)
    } else {
      setAnimated(AnimatedState.INITIAL)
    }
  }, [played, currentPlaylist])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'inline-block;' }}
    />
  )
}

export const draw = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, balls: Ball[]) => {
  const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(
    '--vkui--color_background_content'
  )
  ctx.fillStyle = backgroundColor.trim()
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  balls.forEach((ball) => {
    ball.phase += ball.speed
    const offsetY = Math.sin(ball.phase) * 25
    const scale = 1 + Math.sin(ball.phase) * 0.15
    drawBall(ctx, ball.x, ball.baseY - offsetY, scale, ball.color)
  })
}

const drawBall = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) => {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)

  ctx.shadowColor = `rgba(${r},${g},${b},0.4)`
  ctx.shadowBlur = 10
  ctx.shadowOffsetX = 5
  ctx.shadowOffsetY = 5

  for (let i = 0; i < 15; i++) {
    const radius = ((90 * (i + 1)) / 15) * scale
    const baseAlpha = 0.015
    let alpha = 0
    if (i < 3) {
      alpha = 0.012
    } else if (i < 6) {
      alpha = 0.03
    } else if (i < 12) {
      alpha = 0.045
    } else {
      alpha = baseAlpha
    }

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
    ctx.fill()
  }

  ctx.shadowColor = 'transparent'
}
