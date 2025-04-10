import { act, useEffect, useMemo, useReducer, useState } from 'react'
import './App.css'
import linkedSelectionSvg from './assets/linked-selection.svg'
import unlinkedSelectionSvg from './assets/unlinked-selection.svg'
export type BoardSize = 2 | 3 | 4 | 5
export type BitBoard = number

export function togglePlus(
  board: BitBoard,
  size: BoardSize,
  row: number,
  col: number
): BitBoard {
  let update = board

  update ^= 1 << (row * size + col)
  if (row > 0) update ^= 1 << ((row - 1) * size + col)
  if (row < size - 1) update ^= 1 << ((row + 1) * size + col)
  if (col > 0) update ^= 1 << (row * size + col - 1)
  if (col < size - 1) update ^= 1 << (row * size + col + 1)

  return update
}

export function toggleSingle(
  board: BitBoard,
  size: BoardSize,
  row: number,
  col: number
): BitBoard {
  let update = board

  update ^= 1 << (row * size + col)

  return update
}

function makeRandomBoard(size: BoardSize) {
  console.log('generating random board:')
  let board = 0
  for (let i = 0; i < 7; i++) {
    const position = Math.floor(Math.random() * size ** 2)
    console.log(i+1,'\ttoggling',[Math.floor(position / size),
      position % size])
    board = togglePlus(
      board,
      size,
      Math.floor(position / size),
      position % size
    )
  }
  return board
}

const noop = () => {}

function LightBoard({
  board,
  size,
  onFlip = noop,
  className = '',
  tagRow = NaN,
  tagCol = NaN,
  tag = '',
  solution = undefined,
}: {
  board: number
  size: BoardSize
  onFlip?: (row: number, col: number) => void
  className?: string
  tagRow?: number
  tagCol?: number
  tag?: string
  solution?: null | undefined | BitBoard[]
}) {
  if (size < 2 || size > 5) {
    throw new Error(`Unsupported board size (${size})`)
  }

  const [stepIndices, setStepIndices] = useState(new Set<number>())

  useEffect(() => {
    if (solution === undefined || solution === null) {
      setStepIndices(new Set<number>())
      return
    }

    const stepList: number[] = []
    for (let i = 0; i < solution.length - 1; i++) {
      const step = stepDiff(solution[i], solution[i + 1], size)
      stepList.push(step[0] * size + step[1])
    }

    let indexProgression = 1
    const frameTime = 600 / stepList.length
    const activeHighlights = [stepList[0]]
    let waitAtEnd = true
    setStepIndices(new Set<number>(activeHighlights))

    const applyHighlight = () => {
      if (indexProgression === stepList.length) {
        if (!activeHighlights.length) {
          setStepIndices(new Set<number>())
          return
        }

        if(waitAtEnd) {
          waitAtEnd = false
          tid = setTimeout(applyHighlight, frameTime*10)
          return
        }

        activeHighlights.shift()
        setStepIndices(new Set<number>(activeHighlights))
        tid = setTimeout(applyHighlight, frameTime)

        return
      }

      activeHighlights.push(stepList[indexProgression])
      indexProgression++

      setStepIndices(new Set<number>(activeHighlights))

      tid = setTimeout(applyHighlight, frameTime)
    }

    let tid = setTimeout(applyHighlight, frameTime)

    return () => {
      clearTimeout(tid)
    }
  }, [solution, size])

  const gridCols = {
    2: 'grid-cols-[repeat(2,2.5rem)]',
    3: 'grid-cols-[repeat(3,2.5rem)]',
    4: 'grid-cols-[repeat(4,2.5rem)]',
    5: 'grid-cols-[repeat(5,2.5rem)]',
  }[size]

  const tagIndex = tag ? tagCol + tagRow * size : NaN
  const cells = Array.from({ length: size ** 2 }, (_, i) => {
    const bit = board & (1 << i)
    return (
      <div
        key={i}
        className="p-1 group"
        onClick={() => onFlip(Math.floor(i / size), i % size)}
      >
        <div
          className={`flex justify-center w-full h-full ${
            bit ? 'lit-bulb' : 'unlit-bulb'
          } ${stepIndices.has(i) ? 'bulb-ping' : ''}`}
        >
          {i === tagIndex && (
            <div
              className={`z-10 size-[28px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-[50%] absolute  flex justify-center high-contrast-amethyst`}
            >
              <span className="[line-height:24px] [color:#fff]">{tag}</span>
            </div>
          )}
        </div>
      </div>
    )
  })

  return (
    <div
      className={
        `bg-zinc-700 grid ${gridCols} w-fit p-1 light-edge auto-rows-[2.5rem] relative ` +
        className
      }
    >
      {cells}
      {board === 0 && tag && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 amethyst-done">
          {tag}
        </div>
      )}
    </div>
  )
}

function stepDiff(
  before: BitBoard,
  after: BitBoard,
  size: BoardSize
): [number, number] {
  const center: [number, number] = [NaN, NaN]
  for (let row = 0; row < size && isNaN(center[0]); row++) {
    let differences = 0
    for (let col = 0; col < size; col++) {
      if (
        (before & (1 << (row * size + col))) !==
        (after & (1 << (row * size + col)))
      ) {
        differences++
        if (differences === 2) {
          center[0] = row
          break
        }
      }
    }
  }

  for (let col = 0; col < size && isNaN(center[1]); col++) {
    let differences = 0
    for (let row = 0; row < size; row++) {
      if (
        (before & (1 << (row * size + col))) !==
        (after & (1 << (row * size + col)))
      ) {
        differences++
        if (differences === 2) {
          center[1] = col
          break
        }
      }
    }
  }

  return center
}

const revealDelays = [
  '[--reveal-delay:0.7s]',
  '[--reveal-delay:1.1s]',
  '[--reveal-delay:1.5s]',
  '[--reveal-delay:1.9s]',
  '[--reveal-delay:2.3s]',
  '[--reveal-delay:2.7s]',
]

function SolutionWrapper({
  solution,
  size,
}: {
  solution: BitBoard[]
  size: BoardSize
}) {
  const resetKey = useMemo(() => solution.join(''), [solution])
  return (
    <>
      {solution && (
        <>
          <h3
            className={`text-slate-300 mb-4 text-xl initial-reveal ${revealDelays[0]}`}
            key={resetKey}
          >
            Solution steps ({solution.length - 1})
          </h3>
          <hr className="opacity-50" />
        </>
      )}
      <div className="overflow-y-auto relative h-full snap-y">
        {solution === null && (
          <h2 className="text-orange-300 text-2xl">
            This board cannot be solved.
          </h2>
        )}

        {solution && (
          <SolutionSteps
            className="absolute pt-10 pb-20"
            solution={solution}
            size={size}
          />
        )}
        {/* overlap blocks interaction with solution steps -- intentional: */}
        <div className="w-full top-0 mt-auto h-full sticky">
          <div className="absolute w-full bottom-0 h-16 bg-linear-to-t from-zinc-800 to-zinc-800/0" />
        </div>
      </div>
    </>
  )
}
function SolutionSteps({
  solution,
  size,
  className = '',
}: {
  solution: BitBoard[]
  size: BoardSize
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-8">
        {solution.map((s, i) => {
          const diff =
            i < solution.length - 1 &&
            stepDiff(solution[i], solution[i + 1], size)

          return (
            <div key={i}>
              <LightBoard
                key={i}
                board={s}
                size={size}
                className={`mb-4 snap-center initial-reveal ${
                  revealDelays[
                    i + 1 < revealDelays.length
                      ? i + 1
                      : revealDelays.length - 1
                  ]
                }`}
                tagRow={diff ? diff[0] : undefined}
                tagCol={diff ? diff[1] : undefined}
                tag={diff ? String(i + 1) : s === 0 ? 'Done!' : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function App() {
  const [workerThinking, setWorkerThinking] = useState(false)
  const [solution, setSolution] = useState<BitBoard[] | undefined | null>([
    6466819, 6466884, 6470784, 6325248, 7405568, 0,
  ])
  const [solveWorker, setSolveWorker] = useState<Worker | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('solve-worker-f2.ts', import.meta.url))
    worker.onmessage = e => {
      setWorkerThinking(false)

      if (e.data.error) {
        // Board was unsolvable.
        setSolution(null)
        return
      }

      const newSolution: BitBoard[] = [e.data.originalBitBoard]
      const size = Math.sqrt(e.data.solution.length) as BoardSize

      for (let i = 0; i < e.data.solution.length; i++) {
        if (e.data.solution[i]) {
          newSolution.push(
            togglePlus(
              newSolution[newSolution.length - 1],
              size,
              Math.floor(i / size),
              i % size
            )
          )
        }
      }

      console.log('storing solution:', newSolution)
      setSolution(newSolution)
    }

    setSolveWorker(worker)

    return () => worker.terminate()
  }, [])

  const [boardSize, setBoardSize] = useState<BoardSize>(5)
  const [bitBoard, setBitBoard] = useState<BitBoard>(() => makeRandomBoard(boardSize))

  const [inputMode, setInputMode] = useState(() => togglePlus)

  const pressedStyle =
    'bg-emerald-900 inset-shadow-sm inset-shadow-zinc-950 text-emerald-100/80 '
  const unpressedStyle =
    'bg-emerald-700 light-edge-shadow hover:bg-emerald-600 active:bg-emerald-800 active:text-emerald-100 active:inset-shadow-sm active:inset-shadow-zinc-950 '
  const unpressedSecondary =
    'bg-zinc-700 text-zinc-200 light-edge-shadow hover:bg-zinc-600 active:bg-zinc-800 active:text-zinc-100 active:inset-shadow-sm active:inset-shadow-zinc-950 '
  const grayPressedStyle =
    'bg-zinc-800 inset-shadow-sm inset-shadow-zinc-950 text-emerald-100/90 '
  const grayUnpressedStyle =
    'bg-zinc-700 text-zinc-200 light-edge-shadow hover:bg-zinc-600 active:bg-zinc-800 active:text-zinc-100 active:inset-shadow-sm active:inset-shadow-zinc-950 '
  const baseButtonStyle =
    'px-3 py-1 rounded-lg font-semibold h-10 relative flex justify-center items-center shrink-0 '

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-zinc-800 text-slate-200 p-4 light-edge min-h-[calc(100svh-8rem)]">
      <h1 className="text-slate-300 font-bold mb-6 text-3xl">
        <em>Lights Out</em> Solver
      </h1>

      <div className="grid  grid-flow-col grid-cols-[max-content_1fr] grid-rows-[min-content_1fr] gap-x-8">
        <section className="text-slate-200 prose mb-10">
          <p>
            <em>Lights Out</em> is a classic puzzle game in which the player
            tries to switch off every light on the board. Whenever one light is
            changed, its neighbors change in tandem.
          </p>
          <p>
            This solver will find an optimal solution for any Lights Out puzzle,
            if it exists (some boards have no solution). Just set up the board,
            then click "solve."
          </p>
        </section>

        {/* Main lightboard */}
        <main className="flex flex-col items-start shrink-0 ml-8">
          <div className="flex gap-8">
            <div>
              <LightBoard
                className="mb-4"
                board={bitBoard}
                size={boardSize}
                onFlip={(r, c) => {
                  if (solution === null) {
                    setSolution(undefined)
                  }
                  setBitBoard(inputMode(bitBoard, boardSize, r, c))
                }}
                solution={solution}
              />

              <div className="flex gap-4">
                <button
                  disabled={workerThinking}
                  className={unpressedStyle + baseButtonStyle + 'grow'}
                  onClick={() => {
                    setWorkerThinking(true)
                    setSolution(undefined)
                    solveWorker?.postMessage({ bitBoard, boardSize })
                  }}
                >
                  Solve
                </button>
              </div>
            </div>

            <div className="flex flex-col w-fit items-start gap-8">
              <select
                className="bg-zinc-700 px-4 py-2 light-edge h-fit w-30"
                value={boardSize}
                onChange={e => {
                  setBoardSize(Number(e.target.value) as BoardSize)
                  setBitBoard(
                    makeRandomBoard(Number(e.target.value) as BoardSize)
                  )
                  setSolution(undefined)
                }}
              >
                <option value="2">2x2</option>
                <option value="3">3x3</option>
                <option value="4">4x4</option>
                <option value="5">5x5</option>
              </select>

              <div className="flex flex-col">
                Linked
                <button
                  className={`${
                    inputMode === togglePlus
                      ? grayPressedStyle
                      : grayUnpressedStyle
                  } ${baseButtonStyle} rounded-br-none rounded-bl-none`}
                  onClick={() => {
                    setInputMode(() => togglePlus)
                  }}
                >
                  <img
                    src={linkedSelectionSvg}
                    className={`mr-3 ${
                      inputMode === toggleSingle ? 'opacity-65' : 'opacity-90'
                    }`}
                  />
                </button>
                <button
                  className={`${
                    inputMode === toggleSingle
                      ? grayPressedStyle
                      : grayUnpressedStyle
                  } ${baseButtonStyle} rounded-tl-none rounded-tr-none`}
                  onClick={() => setInputMode(() => toggleSingle)}
                >
                  <img
                    src={unlinkedSelectionSvg}
                    className={`mr-3 ${
                      inputMode === toggleSingle ? 'opacity-100' : 'opacity-70'
                    }`}
                  />
                </button>
                Single
              </div>

              <button
                className={baseButtonStyle + unpressedSecondary}
                onClick={() => {
                  setSolution(undefined)
                  setBitBoard(makeRandomBoard(boardSize))
                }}
              >
                <svg
                  className="text-zinc-300 mr-3"
                  width="20"
                  height="25"
                  viewBox="0 0 20 25"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 24L18.5547 18.2969C18.8329 18.1114 19 17.7992 19 17.4648V7M10 24L1.4453 18.2969C1.1671 18.1114 1 17.7992 1 17.4648V7M10 24V13M19 7L10.5547 1.3698C10.2188 1.14587 9.7812 1.14587 9.4453 1.3698L1 7M19 7L10 13M1 7L10 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="bevel"
                  />
                  <path
                    d="M6.65562 16.235C6.65562 17.0634 6.18496 17.3158 5.53996 16.8625C4.89497 16.4093 4.40686 15.5468 4.40686 14.7184C4.40686 13.8899 4.89495 13.7945 5.52253 14.1954C6.15011 14.5963 6.65562 15.4065 6.65562 16.235Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12.1807 18.1432C12.1807 18.9716 12.6514 19.224 13.2964 18.7708C13.9414 18.3175 14.4295 17.455 14.4295 16.6266C14.4295 15.7982 13.9414 15.7027 13.3138 16.1036C12.6863 16.5046 12.1807 17.3148 12.1807 18.1432Z"
                    fill="currentColor"
                  />
                  <path
                    d="M14.651 13.6285C14.651 14.4569 15.1216 14.7093 15.7666 14.256C16.4116 13.8028 16.8997 12.9403 16.8997 12.1119C16.8997 11.2834 16.4116 11.188 15.784 11.5889C15.1565 11.9898 14.651 12.8 14.651 13.6285Z"
                    fill="currentColor"
                  />
                </svg>
                Random
              </button>
            </div>
          </div>
        </main>

        {/* Solution section */}
        <div className="row-span-2">
          {solution && <SolutionWrapper solution={solution} size={boardSize} />}
        </div>
      </div>
    </div>
  )
}

export default App
