"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ThreeBackground } from "@/components/three-background"
import { Footer } from "@/components/footer"

const sampleQuotes = [
  {
    original: "Life is like a box of chocolates",
    encrypted: "Olih lv olnh d era ri fkrfrodwhv",
    author: "Forrest Gump",
  },
]

type ValidationState = "correct-word" | "correct-letter" | "incorrect-letter" | null

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)
  const [currentQuote, setCurrentQuote] = useState(sampleQuotes[0])
  // userInput: array of words, each word is array of single-character strings
  const [userInput, setUserInput] = useState<string[][]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [validationStates, setValidationStates] = useState<ValidationState[][]>([])
  const [hasChecked, setHasChecked] = useState(false)
  const [currentKey, setCurrentKey] = useState<Record<string, string> | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])

  useEffect(() => {
    if (gameStarted && currentQuote) {
      // Initialize input array with empty arrays for each word (chars)
      const words = currentQuote.original.split(" ")
      setUserInput(words.map((word) => Array.from({ length: word.length }).map(() => "")))
      setValidationStates(words.map((word) => Array(word.length).fill(null)))
      setHasChecked(false)

      // Initialize refs structure
      inputRefs.current = words.map((word) => Array(word.length).fill(null))
    }
  }, [gameStarted, currentQuote])

  async function fetchNewQuote() {
    try {
  const res = await fetch(`/api/quotes?ts=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        // ensure any Give Up panel is cleared when we actually fetched a new quote
        setGaveUp(false)
        // Log server-provided metadata to browser console so devtools shows why a fallback might be used
        console.log('[app] /api/quotes response ok', {
          upstreamStatus: data.upstreamStatus,
          upstreamError: data.upstreamError,
          usedFallback: data.usedFallback,
          id: data.id,
        })
        const quote = { original: data.original, encrypted: data.encrypted, author: data.author }
        setCurrentQuote(quote)
        setCurrentKey(data.key || null)
        setShowKey(false)
        return data
      }
    } catch (e) {
      console.log('[app] /api/quotes fetch error', e)
      // fallback handled below
    }

    // fallback locally if API fails
    const fallbacks = [
      { original: 'Life is like a box of chocolates', encrypted: 'Olih lv olnh d era ri fkrfrodwhv', author: 'Forrest Gump' },
      { original: 'The only thing we have to fear is fear itself', encrypted: '', author: 'Franklin D. Roosevelt' },
      { original: 'To be or not to be, that is the question', encrypted: '', author: 'William Shakespeare' },
      { original: 'I think therefore I am', encrypted: '', author: 'René Descartes' },
    ]
    const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    const quote = { original: pick.original, encrypted: pick.encrypted || pick.original, author: pick.author }
    setCurrentQuote(quote)
  setGaveUp(false)
    // generate a local key so even fallbacks produce a unique mapping
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
    const shuffled = [...letters]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = tmp
    }
    const localKey: Record<string, string> = {}
    for (let i = 0; i < letters.length; i++) localKey[letters[i]] = shuffled[i]
    setCurrentKey(localKey)
    return { original: pick.original, encrypted: pick.encrypted || pick.original, author: pick.author }
  }

  const startGame = async () => {
  await fetchNewQuote()
    // explicitly clear gaveUp when starting a new game
    setGaveUp(false)
    setGameStarted(true)
    setIsComplete(false)
    setHasChecked(false)
  }

  const handleInputChange = (wordIndex: number, letterIndex: number, value: string) => {
    const newInput = userInput.map((w) => [...w])
    const char = value.slice(-1)
    if (!newInput[wordIndex]) newInput[wordIndex] = []
    newInput[wordIndex][letterIndex] = char
    setUserInput(newInput)

    // Reset validation when user types
    if (hasChecked) {
      setHasChecked(false)
      const words = currentQuote.original.split(" ")
      setValidationStates(words.map((word) => Array(word.length).fill(null)))
    }

    // Auto-advance if we entered a character
    if (char) {
      const word = currentQuote.original.split(" ")[wordIndex]
      if (letterIndex < word.length - 1) {
        const next = inputRefs.current[wordIndex]?.[letterIndex + 1]
        if (next) next.focus()
      } else {
        // If at end of this word, advance to the first letter of the next word (if present)
        const nextWordFirst = inputRefs.current[wordIndex + 1]?.[0]
        if (nextWordFirst) nextWordFirst.focus()
      }
    }
  }

  const handleKeyDown = (wordIndex: number, letterIndex: number, e: React.KeyboardEvent) => {
    // Allow pressing space to jump to next word's first input for continuous typing
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      const nextWordFirst = inputRefs.current[wordIndex + 1]?.[0]
      if (nextWordFirst) nextWordFirst.focus()
      return
    }

    if (e.key === "Backspace") {
      const currentLetter = userInput[wordIndex]?.[letterIndex]
      if (!currentLetter) {
        // If at start of a word, move to previous word's last letter
        if (letterIndex === 0 && wordIndex > 0) {
          const prevWord = inputRefs.current[wordIndex - 1]
          const prev = prevWord ? prevWord[prevWord.length - 1] : undefined
          if (prev) {
            e.preventDefault()
            prev.focus()
          }
        } else if (letterIndex > 0) {
          const prev = inputRefs.current[wordIndex]?.[letterIndex - 1]
          if (prev) prev.focus()
        }
      }
      // let default behavior clear the character if present
    }
  }

  const checkAnswer = () => {
    const words = currentQuote.original.split(" ")
    const newValidationStates: ValidationState[][] = []

    words.forEach((originalWord, wordIndex) => {
      const userWordArray = userInput[wordIndex] || Array(originalWord.length).fill("")
      const wordValidation: ValidationState[] = []

      // If the user filled the entire word and it matches, mark as correct-word
      const userWordStr = userWordArray.join("")
      if (userWordStr.toLowerCase() === originalWord.toLowerCase() && userWordStr.length === originalWord.length) {
        wordValidation.push(...Array(originalWord.length).fill("correct-word"))
      } else {
        for (let i = 0; i < originalWord.length; i++) {
          const userLetter = (userWordArray[i] || "").toLowerCase()
          const originalLetter = originalWord[i].toLowerCase()

          if (!userLetter) {
            // If the user hasn't entered a letter, keep neutral (null) instead of marking incorrect
            wordValidation.push(null)
          } else if (userLetter === originalLetter) {
            wordValidation.push("correct-letter")
          } else {
            wordValidation.push("incorrect-letter")
          }
        }
      }

      newValidationStates.push(wordValidation)
    })

    setValidationStates(newValidationStates)
    setHasChecked(true)

    // Compute if entire quote is complete
    const userText = userInput.map((w) => w.join("")).join(" ").toLowerCase()
    const originalText = currentQuote.original.toLowerCase()
    if (userText === originalText) {
      setIsComplete(true)
      setCorrectCount((c) => c + 1)
    }
  }

  const resetGame = () => {
    setGameStarted(false)
    setUserInput([])
    setIsComplete(false)
    setHasChecked(false)
    setValidationStates([])
    setGaveUp(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden glass-background">
      <ThreeBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6">
          <div className="max-w-6xl mx-auto flex justify-center items-center">
              <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="BeauQuote" className="w-10 h-10 rounded-lg object-cover" />
              <h1 className="text-3xl font-bold gradient-text">BeauQuote</h1>
            </div>
            <div className="ml-auto mr-4 text-sm text-muted-foreground">
              Correct: <span className="font-semibold">{correctCount}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl mx-auto w-full">
            {!gameStarted ? (
              /* Welcome Screen */
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-6xl font-bold gradient-text text-balance">Decoding History</h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                    Challenge your mind with encrypted quotes from history's greatest thinkers. Crack the cipher and
                    reveal a piece of the past.
                  </p>
                </div>

                <Card className="glass-strong p-8 max-w-md mx-auto glow">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-semibold mb-2 gradient-text">Ready to Begin?</h3>
                      <p className="text-muted-foreground">
                        Each quote uses a unique cipher. Decode letter by letter to reveal the message.
                      </p>
                    </div>
                    <Button
                      onClick={startGame}
                      className="w-full text-lg py-6 gradient-primary glow-strong hover:glow-strong font-semibold cursor-pointer shimmer-button"
                      size="lg"
                    >
                      Start Decoding
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              /* Game Screen */
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold gradient-text mb-2">Decode This Quote</h2>
                  <p className="text-muted-foreground">Enter your guess letter by letter</p>
                </div>

                {/* Encrypted Quote Display */}
                <Card className="glass-strong p-6 glow">
                  <div className="text-center">
                    <p className="text-2xl font-mono tracking-wider gradient-text glow-text">
                      {currentQuote.encrypted}
                    </p>
                    <div className="mt-4">
                      <button
                        className="text-sm underline"
                        onClick={() => setShowKey((s) => !s)}
                      >
                        {showKey ? 'Hide Key' : 'Show Key'}
                      </button>
                      {showKey && currentKey && (
                        <pre className="text-left text-xs mt-2 font-mono max-w-xl mx-auto p-2 bg-background/30 rounded">
                          {Object.entries(currentKey)
                            .map(([k, v]) => `${k} → ${v}`)
                            .join('\n')}
                        </pre>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Input Fields */}
                <Card className="glass-strong p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center gradient-text">Your Decode:</h3>
                    <div className="flex flex-wrap gap-4 justify-center items-center">
                      {currentQuote.original.split(" ").map((word, wordIndex) => (
                        <div key={wordIndex} className="word-group">
                          {Array.from(word).map((letter, letterIndex) => (
                                <Input
                                  key={letterIndex}
                                  ref={(el) => {
                                    if (!inputRefs.current[wordIndex]) inputRefs.current[wordIndex] = []
                                    inputRefs.current[wordIndex][letterIndex] = el
                                  }}
                                  value={userInput[wordIndex]?.[letterIndex] || ""}
                                  onChange={(e) => handleInputChange(wordIndex, letterIndex, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(wordIndex, letterIndex, e)}
                                  className={`w-10 h-12 text-center font-mono text-lg glass border-primary/30 focus:border-primary focus:glow ${
                                    hasChecked && validationStates[wordIndex]?.[letterIndex]
                                      ? validationStates[wordIndex][letterIndex]
                                      : ""
                                  }`}
                                  placeholder="_"
                                  maxLength={1}
                                />
                              ))}
                          {/* Add space between words */}
                          {wordIndex < currentQuote.original.split(" ").length - 1 && (
                            <div className="word-separator" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {!isComplete && (
                  <div className="flex justify-center">
                    <Button
                      onClick={checkAnswer}
                      className="gradient-secondary glow hover:glow-strong font-semibold px-8 py-3 cursor-pointer shimmer-button"
                    >
                      Check Answer
                    </Button>
                  </div>
                )}

                {/* Success Message */}
                {isComplete && (
                  <Card className="glass-strong p-6 border-primary glow-strong">
                    <div className="text-center space-y-4">
                      <h3 className="text-2xl font-bold gradient-text glow-text">🎉 Decoded!</h3>
                      <p className="text-lg">"{currentQuote.original}"</p>
                      <p className="text-muted-foreground">— {currentQuote.author}</p>
                      <div className="flex gap-4 justify-center">
                        <Button onClick={startGame} className="gradient-primary glow cursor-pointer shimmer-button">
                          Next Quote
                        </Button>
                        <Button
                          onClick={resetGame}
                          variant="outline"
                          className="glass bg-transparent border-primary/50 cursor-pointer shimmer-button"
                        >
                          Main Menu
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Game Controls */}
                {!isComplete && (
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => {
                        setGaveUp(true)
                        setHasChecked(false)
                      }}
                      variant="outline"
                      className="glass bg-transparent border-primary/50 cursor-pointer shimmer-button"
                    >
                      Give Up
                    </Button>
                    <Button
                      onClick={async () => {
                        const data = await fetchNewQuote()
                        const words: string[] = (data?.original || sampleQuotes[0].original).split(' ')
                        setUserInput(words.map((w: string) => Array.from({ length: w.length }).map(() => '')))
                        setValidationStates(words.map((w: string) => Array(w.length).fill(null)))
                        setHasChecked(false)
                        setIsComplete(false)
                        setGameStarted(true)
                      }}
                      variant="outline"
                      className="glass bg-transparent border-primary/50 cursor-pointer shimmer-button"
                    >
                      New Quote
                    </Button>
                  </div>
                )}

                {/* Gave Up Reveal */}
                {gaveUp && !isComplete && (
                  <Card className="glass-strong p-6 border-destructive/20 glow-strong mt-4">
                    <div className="text-center space-y-4">
                      <h3 className="text-2xl font-bold gradient-text">Better luck next time</h3>
                      <p className="text-lg">The quote was:</p>
                      <p className="text-lg font-mono">"{currentQuote.original}"</p>
                      <p className="text-muted-foreground">— {currentQuote.author}</p>
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={async () => {
                            setGaveUp(false)
                            await startGame()
                          }}
                          className="gradient-primary glow cursor-pointer shimmer-button"
                        >
                          Next Quote
                        </Button>
                        <Button
                          onClick={resetGame}
                          variant="outline"
                          className="glass bg-transparent border-primary/50 cursor-pointer shimmer-button"
                        >
                          Main Menu
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
