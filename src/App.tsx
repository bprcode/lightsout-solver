import { useState } from 'react'
import './App.css'

type Bulb = 1 | 0
type BoardSize = 2 | 3 | 4 | 5

function LightBoard({ board }: { board: Bulb[][] }) {
  const gridCols = {
    2: 'grid-cols-[repeat(2,2rem)]',
    3: 'grid-cols-[repeat(3,2rem)]',
    4: 'grid-cols-[repeat(4,2rem)]',
    5: 'grid-cols-[repeat(5,2rem)]',
  }[board.length]

  return (
    <div
      className={`bg-zinc-700 grid ${gridCols} gap-2 w-fit p-2 light-edge auto-rows-[2rem]`}
    >
      {board.map((row, ri) =>
        row.map((bulb, ci) => (
          <div
            key={`${ri},${ci}`}
            className={`${
              bulb ? 'bg-emerald-500' : 'bg-stone-800'
            } light-edge flex justify-center`}
          >
            {bulb}
          </div>
        ))
      )}
    </div>
  )
}

function App() {
  const [boardSize, setBoardSize] = useState<BoardSize>(5)

  return (
    <div className="max-w-prose mx-auto mt-12 prose bg-zinc-800 text-slate-200 p-4 light-edge">
      <h1 className="text-slate-300">LightsOut Solver</h1>

      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Omnis adipisci
        neque veniam numquam asperiores dolor aut officia quam dolorum est.
      </p>

      <LightBoard
        board={[
          [1, 0, 0],
          [0, 1, 1],
          [0, 0, 1],
        ]}
      />
      <div className="card">
        {/* <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button> */}
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Expedita
          quod voluptas vitae hic. Consectetur laborum eveniet ipsam aliquam
          labore harum voluptatum dolorum tempora? Tempora facere dolores fugit
          magni porro alias hic possimus natus omnis a id ut non suscipit rem
          obcaecati ratione aspernatur, vero incidunt dolore architecto beatae
          doloribus. Tempora debitis mollitia labore quibusdam, obcaecati
          consectetur inventore, assumenda facere exercitationem eveniet
          temporibus dolore est officia error fugiat ab beatae cum porro. Iste
          saepe vitae maxime inventore architecto officiis deleniti eaque!
        </p>
      </div>
    </div>
  )
}

export default App
