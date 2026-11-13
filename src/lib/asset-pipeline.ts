export type RequestStage = 'idle' | 'request' | 'backend' | 'transaction'
export type ReadStage = 'idle' | 'das' | 'database' | 'graphql' | 'client'
export interface AssetPipeline {
  requested: number
  chain: number
  database: number
  client: number
  target: number
  requestStage: RequestStage
  readStage: ReadStage
  paused: boolean
}
export const initialAssetPipeline: AssetPipeline = {
  requested: 0,
  chain: 0,
  database: 0,
  client: 0,
  target: 0,
  requestStage: 'idle',
  readStage: 'idle',
  paused: false,
}
/** Each level-up starts as a client request; it has not changed the chain yet. */
export const requestLevelUp = (state: AssetPipeline): AssetPipeline => ({
  ...state,
  requested: state.requested + 1,
  requestStage: state.requestStage === 'idle' ? 'request' : state.requestStage,
})

/** Illustrative backend/chain writes and DAS → database → GraphQL reads run independently. */
export function advanceAssetPipeline(state: AssetPipeline): AssetPipeline {
  const next = { ...state }
  switch (state.requestStage) {
    case 'request':
      next.requestStage = 'backend'
      break
    case 'backend':
      next.requestStage = 'transaction'
      break
    case 'transaction':
      next.chain = state.chain + 1
      next.requestStage = state.requested > next.chain ? 'request' : 'idle'
      break
  }
  switch (state.readStage) {
    case 'idle':
      if (!state.paused && state.chain > state.database) {
        next.target = state.chain
        next.readStage = 'das'
      }
      break
    case 'das':
      if (!state.paused) next.readStage = 'database'
      break
    case 'database':
      next.database = state.target
      next.readStage = 'graphql'
      break
    case 'graphql':
      next.readStage = 'client'
      break
    case 'client':
      next.client = state.database
      next.readStage = 'idle'
      break
  }
  return next
}

export const isAssetPipelineComplete = (state: AssetPipeline) =>
  state.requested > 0 &&
  state.requested === state.chain &&
  state.chain === state.database &&
  state.database === state.client &&
  state.requestStage === 'idle' &&
  state.readStage === 'idle'
