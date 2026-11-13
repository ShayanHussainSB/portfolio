import { describe, expect, it } from 'vitest'
import { advanceAssetPipeline, initialAssetPipeline, requestLevelUp, isAssetPipelineComplete } from './asset-pipeline'

const finish = (state = initialAssetPipeline) => {
  for (let i = 0; i < 50; i++) state = advanceAssetPipeline(state)
  return state
}

describe('request → transaction → indexed GraphQL read', () => {
  it('does not level up the chain optimistically when the client sends a request', () => {
    const state = requestLevelUp(initialAssetPipeline)
    expect(state.requested).toBe(1)
    expect(state.chain).toBe(0)
    expect(state.client).toBe(0)
  })
  it('updates the database before a GraphQL read can update the client', () => {
    let state = requestLevelUp(initialAssetPipeline)
    const stages: string[] = []
    for (let i = 0; i < 12; i++) {
      stages.push(state.requestStage, state.readStage)
      if (state.readStage === 'graphql') {
        expect(state.database).toBe(1)
        expect(state.client).toBe(0)
      }
      if (state.client > 0) expect(state.database).toBeGreaterThanOrEqual(state.client)
      state = advanceAssetPipeline(state)
    }
    expect(stages).toEqual(expect.arrayContaining(['backend', 'transaction', 'das', 'database', 'graphql', 'client']))
    expect(state).toMatchObject({ chain: 1, database: 1, client: 1 })
  })
  it('lets backend transactions continue while DAS ingestion is disconnected', () => {
    let state = { ...initialAssetPipeline, paused: true }
    for (let i = 0; i < 3; i++) state = requestLevelUp(state)
    state = finish(state)
    expect(state).toMatchObject({ chain: 3, database: 0, client: 0 })
    state = finish({ ...state, paused: false })
    expect(state).toMatchObject({ chain: 3, database: 3, client: 3 })
  })
  it('still serves an already indexed database result if ingestion disconnects during the GraphQL read', () => {
    let state = requestLevelUp(initialAssetPipeline)
    for (let i = 0; i < 15 && state.readStage !== 'graphql'; i++) state = advanceAssetPipeline(state)
    expect(state.readStage).toBe('graphql')
    state = finish({ ...state, paused: true })
    expect(state.client).toBe(1)
  })
  it('settles without generating more levels from idle ticks', () => {
    const done = finish(requestLevelUp(initialAssetPipeline))
    expect(finish(done)).toEqual(done)
  })
})

it('does not call the round trip complete while confirmed data or queued requests are still outstanding', () => {
  expect(isAssetPipelineComplete(initialAssetPipeline)).toBe(false)
  expect(isAssetPipelineComplete({ ...initialAssetPipeline, requested: 1, chain: 1 })).toBe(false)
  const done = finish(requestLevelUp(initialAssetPipeline))
  expect(isAssetPipelineComplete(done)).toBe(true)
  expect(isAssetPipelineComplete(requestLevelUp(done))).toBe(false)
})
