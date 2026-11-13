import { useEffect, useRef, useState } from 'react'
import sources from '../assets/photos/journey-sources.json'

const files=import.meta.glob('../assets/photos/journey-*.jpg',{eager:true,query:'?url',import:'default'}) as Record<string,string>
const names:Record<string,string>={madlads:'Mad Lads',solpatrol:'Sol Patrol',fox:'Famous Fox Federation',tff:'Transdimensional Fox Federation'}
const gallery=Object.entries(files).map(([path,url])=>{
  const source=sources.find(s=>path.endsWith('/'+s.file))
  const slug=path.includes('tff')?'tff':path.includes('fox')?'fox':path.includes('solpatrol')?'solpatrol':'madlads'
  return {url,collection:names[slug],name:source?.name??names[slug],source:source?.source,worked:slug==='madlads'||slug==='solpatrol'}
})

export function JourneyGallery(){
  const [selected,setSelected]=useState<number|null>(null)
  const dialog=useRef<HTMLDialogElement>(null)
  useEffect(()=>{const el=dialog.current;if(selected!==null&&!el?.open)el?.showModal()},[selected])
  const art=selected===null?null:gallery[selected]
  const move=(direction:number)=>setSelected(i=>i===null?0:(i+direction+gallery.length)%gallery.length)
  return <>
    <div className="journey__gallery">{gallery.map((art,n)=><button className="nft-tile" key={art.url} onClick={()=>setSelected(n)} aria-label={`Inspect ${art.name}, ${art.collection}`}><img src={art.url} alt="" loading="lazy" width="400" height="400"/><span>{art.collection}<b>↗</b></span></button>)}</div>
    <p className="journey__art-credit">Pick a portrait to explore. Sol Patrol & Mad Lads connect to my work; Fox collections illustrate the wider ecosystem.</p>
    <dialog className="nft-viewer" ref={dialog} onClose={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}}} aria-label="NFT artwork viewer">
      {art&&<div className="nft-viewer__body"><img src={art.url} alt={art.name}/><div className="nft-viewer__info"><button className="nft-viewer__close" onClick={()=>dialog.current?.close()} aria-label="Close artwork">Close ×</button><p>{art.collection}</p><h3>{art.name}</h3><p>{art.worked?'A collection connected to my Solana work. I built the systems around the assets; the artwork belongs to its creators.':'An example from the wider Solana ecosystem. Shown for its artwork, rather than as a work credit.'}</p><div className="nft-viewer__controls"><button className="btn" onClick={()=>move(-1)} aria-label="Previous artwork">← Previous</button><span>{selected!+1} / {gallery.length}</span><button className="btn" onClick={()=>move(1)} aria-label="Next artwork">Next →</button></div>{art.source&&<a href={art.source} target="_blank" rel="noopener noreferrer">Original artwork ↗</a>}</div></div>}
    </dialog>
  </>
}
