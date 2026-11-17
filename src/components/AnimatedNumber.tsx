import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'

type Props = { value: number; format: (value: number) => string; duration?: number }

export function AnimatedNumber({ value, format, duration = 0.9 }: Props) {
  const reduced = useReducedMotion()
  const motionValue = useMotionValue(reduced ? value : 0)
  const text = useTransform(motionValue, latest => format(Math.round(latest)))

  useEffect(() => {
    if (reduced) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, { duration, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [value, duration, reduced, motionValue])

  return <motion.span>{text}</motion.span>
}
