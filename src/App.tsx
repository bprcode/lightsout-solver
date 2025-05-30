import { useEffect, useMemo, useRef, useState } from 'react'
import diamondEmboss from './assets/diamond-emboss-graphic.svg'
import backgroundDiamonds from './assets/background-diamonds.svg'
import './App.css'
export type BoardSize = 2 | 3 | 4 | 5
export type BitBoard = number
export type SolveRequest = {
  bitBoard: BitBoard
  boardSize: BoardSize
}
export type SolveResponse = {
  solutions: number[][]
  bestSolution: number[]
  originalBitBoard: BitBoard
}

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
  for (let i = 0; i < 9; i++) {
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

    let indexProgression = 1
    const frameTime = 600 / solution.length
    const activeHighlights = [solution[0]]
    let waitAtEnd = true
    setStepIndices(new Set<number>(activeHighlights))

    const applyHighlight = () => {
      if (indexProgression === solution.length) {
        if (!activeHighlights.length) {
          setStepIndices(new Set<number>())
          return
        }

        if (waitAtEnd) {
          waitAtEnd = false
          tid = setTimeout(applyHighlight, frameTime * 10)
          return
        }

        activeHighlights.shift()
        setStepIndices(new Set<number>(activeHighlights))
        tid = setTimeout(applyHighlight, frameTime)

        return
      }

      activeHighlights.push(solution[indexProgression])
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
        onPointerDown={() => onFlip(Math.floor(i / size), i % size)}
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
        `raised-gray grid ${gridCols} w-fit p-4 light-edge-faint-shadow auto-rows-[2.5rem] relative ` +
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
  initialBoard,
  size,
  className = '',
}: {
  solution: number[] | undefined | null
  initialBoard: BitBoard
  size: BoardSize
  className: string
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const resetKey = useMemo(() => (solution ? solution.join('') : 0), [solution])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0)
    }
  }, [solution])

  if (solution === undefined) {
    return <></>
  }
  if (solution === null) {
    return (
      <div className={`${className} text-orange-400 text-xl`}>
        This board has no solution.
      </div>
    )
  }

  return (
    <div
      className={`${className} row-span-2 flex flex-col z-10 mt-[-3rem] wide:mt-0`}
    >
      <h3
        className={`text-slate-300 mb-4 text-xl initial-reveal ${revealDelays[0]}`}
        key={resetKey}
      >
        Solution steps ({solution.length})
      </h3>
      <hr className={`reveal-extend ${revealDelays[1]}`} />
      <div
        ref={scrollRef}
        className={
          'wide:overflow-y-auto relative h-full snap-y scroll-pt-8 [mask-image:linear-gradient(to_bottom,black_93%,transparent_98%)]'
        }
      >
        {solution === null && (
          <h2 className="text-orange-300 text-2xl">
            This board cannot be solved.
          </h2>
        )}

        {solution && (
          <SolutionSteps
            className="wide:absolute pt-10 pb-20 justify-center narrow:justify-start narrow:ml-4 wide:ml-0"
            solution={solution}
            size={size}
            initialBoard={initialBoard}
          />
        )}
        {/* overlap blocks interaction with solution steps -- intentional: */}
        <div className="w-full top-0 mt-auto h-full sticky">
          <div className="absolute w-full bottom-0 h-16" />
        </div>
      </div>
    </div>
  )
}
function SolutionSteps({
  solution,
  size,
  initialBoard,
  className = '',
}: {
  solution: number[]
  size: BoardSize
  initialBoard: BitBoard
  className?: string
}) {
  const stepBoards = useMemo(() => {
    const boards: BitBoard[] = [initialBoard]
    let workingBoard = initialBoard

    for (let i = 0; i < solution.length; i++) {
      workingBoard = togglePlus(
        workingBoard,
        size,
        Math.floor(solution[i] / size),
        solution[i] % size
      )
      boards.push(workingBoard)
    }

    return boards
  }, [initialBoard, solution, size])

  return (
    <div className={`${className} flex flex-wrap gap-8`}>
      {stepBoards.map((board: BitBoard, i) => {
        return (
          <div key={i} className="snap-start">
            <LightBoard
              key={i}
              board={board}
              size={size}
              className={`mb-4 initial-reveal ${
                revealDelays[
                  i + 1 < revealDelays.length ? i + 1 : revealDelays.length - 1
                ]
              }`}
              tagRow={board === 0 ? undefined : Math.floor(solution[i] / size)}
              tagCol={board === 0 ? undefined : solution[i] % size}
              tag={board === 0 ? 'Done!' : String(i + 1)}
            />
          </div>
        )
      })}
    </div>
  )
}

function LinkedButton({
  onClick,
  className = '',
}: {
  onClick: () => void
  className: string
}) {
  return (
    <button id="linkedSwitch" className={className} onClick={onClick}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="9.5"
          y="9.5"
          width="5"
          height="5"
          fill="currentColor"
          stroke="#D9D9D9"
        />
        <rect
          x="9.5"
          y="1.5"
          width="5"
          height="5"
          fill="currentColor"
          stroke="#D9D9D9"
        />
        <rect
          x="9.5"
          y="17.5"
          width="5"
          height="5"
          fill="currentColor"
          stroke="#D9D9D9"
        />
        <rect
          x="17.5"
          y="9.5"
          width="5"
          height="5"
          fill="currentColor"
          stroke="#D9D9D9"
        />
        <rect
          x="17.5"
          y="1.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="17.5"
          y="17.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="1.5"
          y="9.5"
          width="5"
          height="5"
          fill="currentColor"
          stroke="#D9D9D9"
        />
        <rect
          x="1.5"
          y="1.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="1.5"
          y="17.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
      </svg>
    </button>
  )
}

function SingleButton({
  onClick,
  className = '',
}: {
  onClick: () => void
  className: string
}) {
  return (
    <button id="singleSwitch" className={className} onClick={onClick}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="9.5"
          y="9.5"
          width="5"
          height="5"
          fill="currentColor"
          stroke="#D9D9D9"
        />
        <rect
          x="9.5"
          y="1.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="9.5"
          y="17.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="17.5"
          y="9.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="17.5"
          y="1.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="17.5"
          y="17.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="1.5"
          y="9.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="1.5"
          y="1.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
        <rect
          x="1.5"
          y="17.5"
          width="5"
          height="5"
          stroke="#D9D9D9"
          strokeOpacity="0.4"
        />
      </svg>
    </button>
  )
}

function RandomButton({
  onClick,
  className = '',
}: {
  onClick: () => void
  className: string
}) {
  return (
    <button className={`${className} grow`} onClick={onClick}>
      <svg
        className="text-slate-300 mr-3 group-hover:text-zinc-200"
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
  )
}

function App() {
  const [workerThinking, setWorkerThinking] = useState(false)
  const [solution, setSolution] = useState<number[] | undefined | null>(
    undefined
  )
  const [solveWorker, setSolveWorker] = useState<Worker | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('solve-worker-f2.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (e: MessageEvent<SolveResponse | { error: string }>) => {
      setWorkerThinking(false)

      if ('error' in e.data) {
        // Board was unsolvable.
        setSolution(null)
        return
      }

      setSolution(e.data.bestSolution)
      setSolvedBoard(e.data.originalBitBoard)
    }

    setSolveWorker(worker)

    return () => worker.terminate()
  }, [])

  const [boardSize, setBoardSize] = useState<BoardSize>(5)
  const [bitBoard, setBitBoard] = useState<BitBoard>(() =>
    makeRandomBoard(boardSize)
  )
  const [solvedBoard, setSolvedBoard] = useState<BitBoard>(() => bitBoard)

  const [inputMode, setInputMode] = useState(() => togglePlus)

  const solveButtonStyle =
    'bg-emerald-700 emerald-edge-shadow hover:bg-emerald-600 active:bg-emerald-800 hover:text-zinc-100 active:text-emerald-100 active:inset-shadow-sm active:inset-shadow-zinc-950 '
  const unpressedSecondary =
    'group raised-gray text-slate-200 light-edge-faint-shadow hover:bg-zinc-600 hover:text-zinc-200 active:bg-zinc-800 active:text-zinc-100 active:inset-shadow-sm active:inset-shadow-slate-950 '
  const grayPressedStyle =
    'bg-zinc-800 inset-shadow-sm inset-shadow-zinc-950 text-emerald-100/90 '
  const grayUnpressedStyle =
    'raised-gray text-slate-200 light-edge-faint-shadow hover:bg-zinc-600 active:bg-zinc-800 active:text-slate-100 active:inset-shadow-sm active:inset-shadow-slate-950 '
  const baseButtonStyle =
    'px-3 py-1 rounded-lg font-medium h-10 relative flex justify-center items-center shrink-0 cursor-pointer '

  return (
    <div className="max-w-xl wide:max-w-4xl mx-auto relative">
      <div className="fixed top-0 transform -translate-x-1/2 translate-y-[-11rem] blur-md opacity-45">
        <img src={backgroundDiamonds} className={`w-[100%] opacity-40`} />
      </div>
      <div className="contain-paint relative mt-8 wide:mb-8 bg-[hsl(235,9%,21%)] text-slate-200 px-4 narrow:px-6 pt-6 pb-1 y-edge narrow:thin-edge min-h-[calc(100svh-8rem)] outfit-font flex flex-col">
        <div className="absolute -right-[14rem] top-[14rem]">
          <img src={diamondEmboss} className={`w-[38rem] opacity-78`} />
        </div>
        <h1 className={`text-slate-200 mb-6 text-3xl noto-sans-display`}>
          <em>Lights Out</em> Solver
        </h1>

        <div className="grid narrow-template wide:wide-template grow">
          <section className="[grid-area:text] text-slate-200 prose mb-2 max-w-[50ch] wide:w-[50ch] z-10">
            <p>
              <em>Lights Out</em> is a classic puzzle game in which the player
              tries to switch&nbsp;off every light on the board. Whenever one
              light is changed, its&nbsp;neighbors change in tandem.
            </p>
            <p>
              This solver will find an optimal solution for any Lights&nbsp;Out
              puzzle, if&nbsp;it&nbsp;exists. Just set up the board,
              then&nbsp;click&nbsp;"solve."
            </p>
          </section>

          <div className="[grid-area:board] flex flex-col narrow:flex-row items-center narrow:items-start">
            <aside className="flex flex-col w-[232px] narrow:w-fit items-start z-10 mb-4 order-1 narrow:order-2">
              <div className="flex gap-4 w-full">
                <select
                  className="outline-0 px-4 py-2 light-edge-faint-shadow mb-4 font-medium raised-gray hover:bg-zinc-600 h-10"
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

                <RandomButton
                  className={baseButtonStyle + unpressedSecondary}
                  onClick={() => {
                    setSolution(undefined)
                    setBitBoard(makeRandomBoard(boardSize))
                  }}
                />
              </div>

              <fieldset className="outline-1 outline-zinc-600 bg-[hsl(235,9%,21%)] p-4 rounded-md w-full">
                <div className="flex items-center">
                  <LinkedButton
                    className={`${
                      inputMode === togglePlus
                        ? grayPressedStyle + ' text-emerald-200/90'
                        : grayUnpressedStyle + ' '
                    } ${baseButtonStyle} rounded-br-none rounded-bl-none mr-4 inline`}
                    onClick={() => {
                      setInputMode(() => togglePlus)
                    }}
                  />

                  <label
                    htmlFor="linkedSwitch"
                    className={
                      inputMode === togglePlus
                        ? `text-emerald-200`
                        : `text-slate-200 hover:text-zinc-100 cursor-pointer`
                    }
                  >
                    Toggle linked
                  </label>
                </div>
                <div className="flex items-center">
                  <SingleButton
                    className={`${
                      inputMode === toggleSingle
                        ? grayPressedStyle + ' text-emerald-200/90'
                        : grayUnpressedStyle
                    } ${baseButtonStyle} rounded-tl-none rounded-tr-none mr-4 inline`}
                    onClick={() => setInputMode(() => toggleSingle)}
                  />

                  <label
                    htmlFor="singleSwitch"
                    className={
                      inputMode === toggleSingle
                        ? `text-emerald-200`
                        : `text-slate-200 hover:text-zinc-100 cursor-pointer`
                    }
                  >
                    Edit puzzle
                  </label>
                </div>
              </fieldset>
            </aside>

            <main className="flex flex-col items-start mb-14 narrow:ml-4 narrow:mr-6 w-fit order-2 narrow:order-1">
              <LightBoard
                className="mb-4"
                board={bitBoard}
                size={boardSize}
                onFlip={(r, c) => {
                  if (solution === null) {
                    setSolution(undefined)
                  }
                  setBitBoard(bb => inputMode(bb, boardSize, r, c))
                }}
                solution={solution}
              />

              <button
                disabled={workerThinking}
                className={solveButtonStyle + baseButtonStyle + 'w-full'}
                onClick={() => {
                  setWorkerThinking(true)
                  setSolution(undefined)
                  solveWorker?.postMessage({ bitBoard, boardSize })
                }}
              >
                Solve
              </button>
            </main>
          </div>

          <SolutionWrapper
            className="[grid-area:solution] wide:ml-14"
            solution={solution}
            size={boardSize}
            initialBoard={solvedBoard}
          />
        </div>
      </div>
    </div>
  )
}

export default App
