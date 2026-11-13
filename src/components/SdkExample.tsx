import { useState } from 'react'
import { createSdkExample, SDK_FIELDS, type SdkField, type SdkLanguage } from '../lib/sdk-example'
import { fallbackSrc } from '../lib/photos'

const languages: SdkLanguage[] = ['TypeScript', 'C#', 'C++', 'Godot']
const filenames = { TypeScript: 'Profile.ts', 'C#': 'Profile.cs', 'C++': 'Profile.hpp', Godot: 'profile.gd' }

export function SdkExample() {
  const [language, setLanguage] = useState<SdkLanguage>('TypeScript')
  const [fields, setFields] = useState<SdkField[]>(['level'])
  const [view, setView] = useState<'type' | 'usage' | 'response'>('type')
  const [reads, setReads] = useState(0)
  const example = createSdkExample(language, fields)
  const toggle = (field: SdkField) => setFields((current) => (current.includes(field) ? current.filter((f) => f !== field) : [...current, field]))

  return (
    <div className="journey-demo sdk-lab">
      <p className="journey-demo__note">Interactive schema model · illustrative SDK APIs</p>
      <div className="sdk-lab__source">
        <header>
          <span>One schema</span>
          <code>Profile.graphql</code>
        </header>
        <div className="sdk-lab__schema">
          <code>
            type Profile {'{'}
            <br />
            <span>
              {' '}
              id: ID!
              <br /> owner: String!
            </span>
          </code>
          <fieldset>
            <legend className="sr-only">Add fields to the profile schema</legend>
            {SDK_FIELDS.map((field) => (
              <label key={field.key}>
                <input type="checkbox" checked={fields.includes(field.key)} onChange={() => toggle(field.key)} />
                <code>
                  {field.key}: <span>{field.gql}</span>
                </code>
              </label>
            ))}
          </fieldset>
          <code>{'}'}</code>
        </div>
        <p>Change the schema. Every client follows.</p>
      </div>
      <div className="sdk-lab__fanout" aria-hidden="true">
        <svg viewBox="0 0 400 32" preserveAspectRatio="none">
          <path d="M200 0V8M200 8Q50 8 50 32M200 8Q150 8 150 32M200 8Q250 8 250 32M200 8Q350 8 350 32" />
        </svg>
      </div>
      <div className="sdk-lab__languages" role="group" aria-label="Generated SDK language">
        {languages.map((l) => (
          <button
            key={l}
            aria-pressed={l === language}
            onClick={() => {
              setLanguage(l)
              if (view === 'response') setView('type')
            }}
          >
            {l}
            <span>{l === 'TypeScript' ? 'Web' : l === 'C#' ? 'Unity' : l === 'C++' ? 'Unreal' : 'Godot Engine'}</span>
          </button>
        ))}
      </div>
      <div className="sdk-lab__output">
        <header>
          <code>{view === 'response' ? 'sample-profile.json' : filenames[language]}</code>
          <div role="group" aria-label="Code view">
            <button aria-pressed={view === 'type'} onClick={() => setView('type')}>
              Type
            </button>
            <button aria-pressed={view === 'usage'} onClick={() => setView('usage')}>
              Usage
            </button>
            <button disabled={reads === 0} aria-pressed={view === 'response'} onClick={() => setView('response')}>
              Data
            </button>
          </div>
        </header>
        {view === 'response' ? (
          <div className="sdk-lab__response" key={reads}>
            <img src={fallbackSrc('journey-madlads-1')} alt="Sample character profile" />
            <div>
              <strong>Profile resolved</strong>
              <pre>
                <code>{JSON.stringify(example.response, null, 2)}</code>
              </pre>
            </div>
          </div>
        ) : (
          <pre key={`${language}-${fields.join('-')}-${view}`}>
            <code>{view === 'type' ? example.declaration : example.usage}</code>
          </pre>
        )}
      </div>
      <div className="sdk-lab__read">
        <button
          className="btn"
          onClick={() => {
            setReads(reads + 1)
            setView('response')
          }}
        >
          Read local sample →
        </button>
        <span>In your browser · no network call</span>
      </div>
      <p className="sr-only" role="status">
        {fields.length + 2} profile fields available in all four generated clients. Showing {language} {view}.{reads > 0 ? ' Local sample resolved.' : ''}
      </p>
    </div>
  )
}
