import { useEffect, useState } from 'react'
import './App.css'
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
  let board = 0
  for (let i = 0; i < 7; i++) {
    const position = Math.floor(Math.random() * size ** 2)
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
}: {
  board: number
  size: BoardSize
  onFlip?: (row: number, col: number) => void
  className?: string
  tagRow?: number
  tagCol?: number
  tag?: string
}) {
  if (size < 2 || size > 5) {
    throw new Error(`Unsupported board size (${size})`)
  }

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
        className="p-1 group"
        onClick={() => onFlip(Math.floor(i / size), i % size)}
      >
        <div
          key={i}
          className={`${
            bit
              // ? 'bg-emerald-500 group-hover:bg-emerald-300 group-active:bg-teal-200 extra-light-edge'
              ? 'illuminated group-hover:very-illuminated group-active:bg-teal-200'
              : 'bg-stone-800 group-hover:bg-stone-700 group-active:bg-stone-400 light-edge'
          } flex justify-center w-full h-full`}
        >
          {i === tagIndex && (
            <div
              className={`outline-2 ${
                bit ? 'outline-orange-500' : 'outline-orange-500'
              } ${
                bit ? 'bg-orange-900/90' : 'bg-orange-900/50'
              } w-100 rounded-full flex justify-center`}
            >
              {tag}
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 bg-orange-950/80 outline-orange-500 outline-2">
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

function SolutionSteps({
  solution,
  size,
}: {
  solution: BitBoard[]
  size: BoardSize
}) {
  return (
    <div>
      <h2 className="text-slate-200 mt-4">Solution steps:</h2>
      <div className="flex flex-wrap gap-4">
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
                className="mb-4"
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
  const [solution, setSolution] = useState<BitBoard[] | undefined | null>()
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

      setSolution(newSolution)
    }

    setSolveWorker(worker)

    return () => worker.terminate()
  }, [])

  const [bitBoard, setBitBoard] = useState<BitBoard>(makeRandomBoard(5))
  const [boardSize, setBoardSize] = useState<BoardSize>(5)

  const [inputMode, setInputMode] = useState(() => togglePlus)

  const pressedStyle =
    'bg-emerald-900 inset-shadow-sm inset-shadow-zinc-950 text-emerald-100/80 '
  const unpressedStyle =
    'bg-emerald-700 light-edge-shadow hover:bg-emerald-600 active:bg-emerald-800 active:text-emerald-100 active:inset-shadow-sm active:inset-shadow-zinc-950 '
  const baseButtonStyle =
    'px-3 py-1 mb-4 rounded-lg font-semibold h-10 relative '

  return (
    <div className="max-w-3xl mx-auto mt-8  bg-zinc-800 text-slate-200 p-4 light-edge">
      <div className="prose text-slate-200">
        <h1 className="text-slate-300 font-bold">Lights Out Solver</h1>

        <p>
          <em>Lights Out</em> is a classic puzzle game in which the player tries
          to switch off every light on the board. Whenever one light is changed,
          its neighbors change in tandem.
        </p>
        <p>
          This solver will find an optimal solution for any Lights Out puzzle,
          if it exists (some boards have no solution). Just set up the board,
          then click "solve" to see the solution.
        </p>
      </div>

      <div className="flex gap-8 mt-8 w-fit">
        <div className="flex flex-col">
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
          />

          <button
            disabled={workerThinking}
            className={
              workerThinking
                ? baseButtonStyle + pressedStyle
                : unpressedStyle + baseButtonStyle + 'w-full'
            }
            onClick={() => {
              setWorkerThinking(true)
              setSolution(undefined)
              solveWorker?.postMessage({ bitBoard, boardSize })
            }}
          >
            Solve
          </button>
        </div>
        <div className="flex flex-col w-fit">
          <button
            className={`${
              inputMode === togglePlus ? pressedStyle : unpressedStyle
            } ${baseButtonStyle}`}
            onClick={() => {
              setInputMode(() => togglePlus)
            }}
          >
            Toggle linked tiles
          </button>
          <button
            className={`${
              inputMode === toggleSingle ? pressedStyle : unpressedStyle
            } ${baseButtonStyle}`}
            onClick={() => setInputMode(() => toggleSingle)}
          >
            Toggle one at a time
          </button>
          <select
            className="bg-zinc-700 px-4 py-2 light-edge mx-1"
            value={boardSize}
            onChange={e => {
              setBoardSize(Number(e.target.value) as BoardSize)
              setBitBoard(makeRandomBoard(Number(e.target.value) as BoardSize))
              setSolution(undefined)
            }}
          >
            <option value="2">2x2</option>
            <option value="3">3x3</option>
            <option value="4">4x4</option>
            <option value="5">5x5</option>
          </select>
        </div>
      </div>

      {solution === null && (
        <h2 className="text-orange-300">This board cannot be solved.</h2>
      )}
      {solution && <SolutionSteps solution={solution} size={boardSize} />}
    </div>
  )
}

export default App
