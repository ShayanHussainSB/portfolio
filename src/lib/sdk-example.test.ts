import { describe, expect, it } from 'vitest'
import { createSdkExample } from './sdk-example'

describe('interactive SDK schema', () => {
  it('keeps optional fields consistent across schema, generated types, and sample response', () => {
    for (const language of ['TypeScript', 'C#', 'C++', 'Godot'] as const) {
      const result = createSdkExample(language, ['level', 'resources'])
      expect(result.schema).toContain('level: Int!')
      expect(result.declaration.toLowerCase()).toContain('level')
      expect(result.response).toMatchObject({ level: 7, resources: ['crystal', 'relic'] })
      expect(result.schema).not.toContain('mission:')
      expect(result.response).not.toHaveProperty('mission')
    }
  })
  it('preserves required identity fields when every optional field is removed', () => {
    const result = createSdkExample('TypeScript', [])
    expect(Object.keys(result.response)).toEqual(['id', 'owner'])
    expect(result.declaration).not.toContain('level')
    expect(result.usage).toContain('profile.id')
  })
  it('uses collection types in the generated language', () => {
    expect(createSdkExample('C++', ['resources']).declaration).toContain('std::vector<std::string> resources')
    expect(createSdkExample('Godot', ['resources']).declaration).toContain('Array[String]')
    expect(createSdkExample('C#', ['resources']).declaration).toContain('string[] Resources')
  })
})
