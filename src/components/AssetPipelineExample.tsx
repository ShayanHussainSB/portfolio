import { useEffect, useState } from 'react'
import { advanceAssetPipeline, initialAssetPipeline, requestLevelUp, isAssetPipelineComplete } from '../lib/asset-pipeline'
import { thumb } from '../lib/photos'

const steps = [
  { key: 'backend', name: 'Backend', detail: 'build transaction' },
  { key: 'transaction', name: 'On-chain', detail: 'execute transaction' },
  { key: 'das', name: 'DAS', detail: 'decode & serialize' },
  { key: 'database', name: 'Database', detail: 'write asset state' },
  { key: 'graphql', name: 'GraphQL', detail: 'request fresh data' },
] as const
const descriptions = {
  request: ['The client asks to level up.', 'The request reaches the backend. No on-chain state has changed yet.'],
  backend: ['The backend builds the transaction.', 'It prepares and submits the on-chain level-up transaction.'],
  transaction: ['The transaction executes on-chain.', 'The character’s on-chain level changes only after this step completes.'],
  das: ['DAS detects and decodes the change.', 'The transaction is detected, its data decoded, and the asset record serialized for the database.'],
  database: ['The indexer updates the database.', 'The decoded asset state is written to the database. The client still has its previous view.'],
  graphql: ['The client asks GraphQL for fresh data.', 'GraphQL reads the newly indexed record from the database.'],
  client: ['The response returns to the client.', 'The client receives the refreshed record and displays the new level.'],
} as const

export function StreamExample() {
  const [state, setState] = useState(initialAssetPipeline)
  const readPending =
    state.readStage === 'database' ||
    state.readStage === 'graphql' ||
    state.readStage === 'client' ||
    (!state.paused && (state.chain > state.database || state.readStage === 'das'))
  const busy = state.requestStage !== 'idle' || readPending
  useEffect(() => {
    if (!busy) return
    const id = setInterval(() => setState(advanceAssetPipeline), 360)
    return () => clearInterval(id)
  }, [busy])
  const waiting = state.chain - state.database
  const phase = state.requestStage !== 'idle' ? state.requestStage : state.readStage
  const held = state.paused && (state.readStage === 'das' || state.readStage === 'idle')
  const description =
    held && state.requestStage === 'idle'
      ? [
          'DAS is disconnected. Indexing waits.',
          `${waiting} confirmed update${waiting === 1 ? '' : 's'} waiting. Backend transactions can still run; reconnect to index them, then refetch through GraphQL.`,
        ]
      : phase !== 'idle'
        ? descriptions[phase]
        : state.chain > state.database
          ? ['On-chain confirmed. Waiting for DAS.', 'DAS will detect and decode the confirmed transaction before the database and client can catch up.']
          : isAssetPipelineComplete(state)
            ? ['The new level has made the round trip.', 'Request → backend → on-chain transaction → DAS → database → GraphQL → client.']
            : [
                'A request, all the way back.',
                'Request a level-up. Follow the transaction into the chain, then watch indexed data return through a GraphQL refetch.',
              ]
  const active = (key: string) =>
    state.requestStage === key ||
    (key === 'backend' && state.requestStage === 'request') ||
    state.readStage === key ||
    (key === 'graphql' && state.readStage === 'client')

  return (
    <div className="journey-demo echo-play asset-roundtrip" data-travelling={busy} data-paused={state.paused}>
      <p className="journey-demo__note">Interactive pipeline model · synthetic transactions</p>
      <div className="echo-play__world">
        <div className="echo-play__asset">
          <img {...thumb('journey-madlads-2')} alt="Example on-chain character" />
          <span>On-chain</span>
          <b>level {state.chain + 1}</b>
        </div>
        <div className="echo-play__bridge" aria-hidden="true">
          <svg viewBox="0 0 200 160">
            <path d="M0 85 C50 10 150 155 200 75" />
            <path d="M0 100 C50 25 150 170 200 90" />
          </svg>
          <i key={`${state.chain}-${state.readStage}`} />
          <span>
            {state.requestStage !== 'idle'
              ? 'Request → transaction'
              : state.readStage === 'graphql' || state.readStage === 'client'
                ? 'GraphQL → client'
                : held
                  ? 'DAS stream held'
                  : 'Index → database → query'}
          </span>
        </div>
        <div className="echo-play__asset echo-play__asset--mirror">
          <img {...thumb('journey-madlads-2')} alt="Client view of the character" />
          <span>In your app</span>
          <b>level {state.client + 1}</b>
        </div>
      </div>
      <ol className="asset-roundtrip__steps" aria-label="Level-up write and read path">
        {steps.map((step, i) => (
          <li key={step.key} data-active={active(step.key)} data-held={step.key === 'das' && held}>
            <span>{i + 1}</span>
            <b>{step.name}</b>
            <small>{step.key === 'database' ? `indexed level ${state.database + 1}` : step.detail}</small>
          </li>
        ))}
      </ol>
      <h3>{description[0]}</h3>
      <p>{description[1]}</p>
      <div className="journey-demo__actions">
        <button className="btn" onClick={() => setState(requestLevelUp)}>
          Request level up ↑
        </button>
        <button className="btn" aria-pressed={state.paused} onClick={() => setState((s) => ({ ...s, paused: !s.paused }))}>
          {state.paused ? 'Reconnect DAS stream' : 'Disconnect DAS stream'}
        </button>
      </div>
      <output className="sr-only" aria-live="polite">
        {description[0]} On-chain level {state.chain + 1}, database level {state.database + 1}, client level {state.client + 1}. {state.requested - state.chain}{' '}
        backend requests pending.
      </output>
    </div>
  )
}
