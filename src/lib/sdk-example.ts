export type SdkLanguage = 'TypeScript' | 'C#' | 'C++' | 'Godot'
export type SdkField = 'level' | 'resources' | 'mission'

export const SDK_FIELDS = [
  { key: 'level', gql: 'Int!', sample: 7, types: ['number', 'int', 'int', 'int'] },
  { key: 'resources', gql: '[String!]!', sample: ['crystal', 'relic'], types: ['string[]', 'string[]', 'std::vector<std::string>', 'Array[String]'] },
  { key: 'mission', gql: 'String!', sample: 'Crystal grove', types: ['string', 'string', 'std::string', 'String'] },
] as const

/** A small, local schema model. These are illustrative SDK surfaces, not Honeycomb API signatures. */
export function createSdkExample(language: SdkLanguage, selected: readonly SdkField[]) {
  const optional = SDK_FIELDS.filter(field => selected.includes(field.key))
  const fields = [
    { key: 'id', gql: 'ID!', sample: 'profile-024', types: ['string', 'string', 'std::string', 'String'] },
    { key: 'owner', gql: 'String!', sample: 'demo-owner', types: ['string', 'string', 'std::string', 'String'] },
    ...optional,
  ]
  const schema = `type Profile {\n${fields.map(f => `  ${f.key}: ${f.gql}`).join('\n')}\n}`
  const response = Object.fromEntries(fields.map(f => [f.key, f.sample]))
  const read = optional[0]?.key ?? 'id'
  const pascal = (key: string) => key[0].toUpperCase() + key.slice(1)
  switch (language) {
    case 'C#':
      return { schema, response,
        declaration: `public record Profile(\n${fields.map(f => `  ${f.types[1]} ${pascal(f.key)}`).join(',\n')}\n);`,
        usage: `Profile profile = await client.ProfileAsync("profile-024");\nConsole.WriteLine(profile.${pascal(read)});` }
    case 'C++':
      return { schema, response,
        declaration: `#include <string>\n${selected.includes('resources') ? '#include <vector>\n' : ''}\nstruct Profile {\n${fields.map(f => `  ${f.types[2]} ${f.key};`).join('\n')}\n};`,
        usage: `Profile profile = client.profile("profile-024");\n// Read profile.${read}` }
    case 'Godot':
      return { schema, response,
        declaration: `class_name Profile\nextends RefCounted\n\n${fields.map(f => `var ${f.key}: ${f.types[3]}`).join('\n')}`,
        usage: `var profile: Profile = await client.profile("profile-024")\nprint(profile.${read})` }
    default:
      return { schema, response,
        declaration: `export interface Profile {\n${fields.map(f => `  ${f.key}: ${f.types[0]};`).join('\n')}\n}`,
        usage: `const profile: Profile = await client.profile("profile-024");\nconsole.log(profile.${read});` }
  }
}
