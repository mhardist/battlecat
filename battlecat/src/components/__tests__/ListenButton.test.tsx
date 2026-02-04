import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ListenButton } from '../ListenButton'

// ─── Mock HTMLMediaElement methods ──────────────────────────────────────────
beforeEach(() => {
  // jsdom doesn't implement play/pause on HTMLMediaElement
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
  HTMLMediaElement.prototype.load = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// ─── FE-5: Returns null when audioUrl is falsy ─────────────────────────────
describe('FE-5: Returns null when audioUrl is falsy', () => {
  it('returns null when audioUrl is null', () => {
    const { container } = render(
      <ListenButton audioUrl={null} variant="icon" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when audioUrl is undefined', () => {
    const { container } = render(
      <ListenButton audioUrl={undefined} variant="icon" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when audioUrl is empty string', () => {
    const { container } = render(
      <ListenButton audioUrl="" variant="icon" />
    )
    expect(container.innerHTML).toBe('')
  })
})

// ─── FE-1: Icon variant renders compact speaker icon ────────────────────────
describe('FE-1: Icon variant renders compact speaker icon', () => {
  it('renders a button with speaker SVG icon', () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="icon" />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    // Should contain an SVG element (the speaker icon)
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('does not render text label in icon variant', () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="icon" />)
    const button = screen.getByRole('button')
    // Icon variant should NOT contain visible text like "Listen" or "Pause"
    expect(button.textContent).toBe('')
  })
})

// ─── FE-2: Bar variant renders icon + text label ────────────────────────────
describe('FE-2: Bar variant renders icon + text label', () => {
  it('renders a button with icon and text label', () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="bar" />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    // Should contain an SVG element
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // Should contain text label
    expect(button).toHaveTextContent('Listen')
  })
})

// ─── FE-14: Dynamic aria-label ──────────────────────────────────────────────
describe('FE-14: Dynamic aria-label', () => {
  it('has "Play tutorial audio" aria-label when idle', () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="bar" />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Play tutorial audio')
  })

  it('has "Pause tutorial audio" aria-label when playing', async () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="bar" />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    // After clicking play, aria-label should change to pause
    expect(button).toHaveAttribute('aria-label', 'Pause tutorial audio')
  })
})

// ─── FE-15: aria-pressed reflects current play state ────────────────────────
describe('FE-15: aria-pressed reflects current play state', () => {
  it('has aria-pressed="false" when not playing', () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="icon" />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('has aria-pressed="true" when playing', async () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="icon" />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})

// ─── FE-6: Custom event dispatched on play ──────────────────────────────────
describe('FE-6: Dispatches "battlecat-audio-play" custom event on play', () => {
  it('dispatches custom event when play is triggered', async () => {
    const eventHandler = vi.fn()
    window.addEventListener('battlecat-audio-play', eventHandler)

    render(<ListenButton audioUrl="/audio/test.mp3" variant="bar" />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    expect(eventHandler).toHaveBeenCalledTimes(1)
    expect(eventHandler.mock.calls[0][0]).toBeInstanceOf(CustomEvent)

    window.removeEventListener('battlecat-audio-play', eventHandler)
  })

  it('includes audioUrl in event detail', async () => {
    const eventHandler = vi.fn()
    window.addEventListener('battlecat-audio-play', eventHandler)

    render(<ListenButton audioUrl="/audio/test.mp3" variant="bar" />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    const event = eventHandler.mock.calls[0][0] as CustomEvent
    expect(event.detail).toEqual(
      expect.objectContaining({ audioUrl: '/audio/test.mp3' })
    )

    window.removeEventListener('battlecat-audio-play', eventHandler)
  })
})

// ─── FE-7: Hidden <audio> element in DOM ────────────────────────────────────
describe('FE-7: Hidden <audio> element in DOM', () => {
  it('renders an audio element with the given src', () => {
    const { container } = render(
      <ListenButton audioUrl="/audio/test.mp3" variant="bar" />
    )
    const audio = container.querySelector('audio')
    expect(audio).toBeInTheDocument()
    expect(audio).toHaveAttribute('src', '/audio/test.mp3')
  })

  it('audio element is hidden (not visible)', () => {
    const { container } = render(
      <ListenButton audioUrl="/audio/test.mp3" variant="bar" />
    )
    const audio = container.querySelector('audio')
    expect(audio).toBeInTheDocument()
    // Should be hidden via className or style
    expect(audio).toHaveClass('hidden')
  })
})

// ─── FE-9: icon variant onClick prevents default and stops propagation ──────
describe('FE-9: icon variant onClick with preventDefault + stopPropagation', () => {
  it('calls preventDefault and stopPropagation on icon variant click', async () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="icon" />)
    const button = screen.getByRole('button')

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(clickEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true,
    })
    Object.defineProperty(clickEvent, 'stopPropagation', {
      value: vi.fn(),
      writable: true,
    })

    await act(async () => {
      button.dispatchEvent(clickEvent)
    })

    expect(clickEvent.preventDefault).toHaveBeenCalled()
    expect(clickEvent.stopPropagation).toHaveBeenCalled()
  })
})

// ─── FE-16: Keyboard Enter/Space triggers play/pause ────────────────────────
describe('FE-16: Keyboard Enter/Space triggers play/pause', () => {
  it('Enter key triggers play', async () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="bar" />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.keyDown(button, { key: 'Enter' })
    })

    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('Space key triggers play', async () => {
    render(<ListenButton audioUrl="/audio/test.mp3" variant="bar" />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.keyDown(button, { key: ' ' })
    })

    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})

// ─── FE-18: Loading state with pulse animation ─────────────────────────────
describe('FE-18: Loading state shows pulse animation', () => {
  it('shows loading state (pulse animation class) after clicking play', () => {
    // Make play return a pending promise to keep loading state
    HTMLMediaElement.prototype.play = vi.fn().mockReturnValue(new Promise(() => {}))

    render(<ListenButton audioUrl="/audio/test.mp3" variant="bar" />)
    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Button should have animate-pulse class during loading
    expect(button.className).toContain('animate-pulse')
  })
})
