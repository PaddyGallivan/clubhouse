import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'

const SPORTS = ['AFL', 'Cricket', 'Netball', 'Soccer', 'Rugby', 'Basketball', 'Hockey', 'Other']
const STEPS = ['Club Details', 'Colours', 'Admin Account', 'Done']

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name:'',short_name:'',slug:'',sport:'AFL',primary_colour:'#003087',secondary_colour:'#FFD700',ground_name:'',ground_address:'',admin_email:'' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const [error, setError] = useState('')

  function set(k,v) { setForm(f=>({...f,[k]:v})); setError('') }
  function autoSlug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') }

  async function submit() {
    setSubmitting(true); setError('')
    try { const d = await api.onboardClub(form); setDone(d); setStep(3) }
    catch(e) { setError(e.message) }
    setSubmitting(false)
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 text-white/60 hover:text-white text-sm">← Back to Clubhouse</Link>
          <h1 className="text-3xl font-black text-white">Get your club online</h1>
          <p className="text-white/60 mt-2">Set up your club in 2 minutes. No credit card required.</p>
        </div>
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s,i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${i<step?'bg-green-400 text-white':i===step?'bg-white text-slate-900':'bg-white/20 text-white/40'}`}>{i<step?'✓':i+1}</div>
              {i<STEPS.length-1 && <div className={`flex-1 h-0.5 w-8 ${i<step?'bg-green-400':'bg-white/20'}`} />}
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {step===0 && <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900">Club Details</h2>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Club Name *</label><input value={form.name} onChange={e=>{set('name',e.target.value);set('slug',autoSlug(e.target.value))}} placeholder="e.g. Williamstown CYMS FC" className={inp} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Short Name</label><input value={form.short_name} onChange={e=>set('short_name',e.target.value)} placeholder="e.g. WCYMS" className={inp} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">URL Slug *</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-200">
                <span className="bg-gray-50 px-3 py-2 text-xs text-gray-400 border-r border-gray-200">clubhouse.app/</span>
                <input value={form.slug} onChange={e=>set('slug',e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} placeholder="wcyms" className="flex-1 px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Sport *</label><select value={form.sport} onChange={e=>set('sport',e.target.value)} className={inp}>{SPORTS.map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Ground Name</label><input value={form.ground_name} onChange={e=>set('ground_name',e.target.value)} placeholder="e.g. Williamstown Oval" className={inp} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Ground Address</label><input value={form.ground_address} onChange={e=>set('ground_address',e.target.value)} placeholder="Melbourne Rd" className={inp} /></div>
            </div>
            <button onClick={()=>setStep(1)} disabled={!form.name||!form.slug||!form.sport} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm disabled:opacity-40 mt-2">Next →</button>
          </div>}
          {step===1 && <div className="space-y-5">
            <h2 className="text-lg font-black text-gray-900">Club Colours</h2>
            <div className="grid grid-cols-2 gap-5">
              {[['primary_colour','Primary colour'],['secondary_colour','Secondary / accent']].map(([k,label]) => (
                <div key={k}><label className="text-xs font-semibold text-gray-500 block mb-2">{label}</label>
                  <div className="flex items-center gap-3"><input type="color" value={form[k]} onChange={e=>set(k,e.target.value)} className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" /><input value={form[k]} onChange={e=>set(k,e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-100"><div className="p-4 text-white font-bold text-center" style={{backgroundColor:form.primary_colour}}><span style={{color:form.secondary_colour}}>{form.short_name||form.name||'Your Club'}</span><div className="text-white/60 text-xs font-normal mt-0.5">Preview</div></div></div>
            <div className="flex gap-3"><button onClick={()=>setStep(0)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-lg font-bold text-sm">← Back</button><button onClick={()=>setStep(2)} disabled={!form.primary_colour||!form.secondary_colour} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold text-sm disabled:opacity-40">Next →</button></div>
          </div>}
          {step===2 && <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900">Admin Account</h2>
            <p className="text-sm text-gray-500">We'll send a magic link to this email. You'll be added as club admin automatically.</p>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{error}</div>}
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Admin Email *</label><input type="email" value={form.admin_email} onChange={e=>set('admin_email',e.target.value)} placeholder="you@yourclub.com.au" className={inp} /></div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1"><div><span className="font-semibold">Club:</span> {form.name}</div><div><span className="font-semibold">Sport:</span> {form.sport}</div><div><span className="font-semibold">URL:</span> clubhouse-e5e.pages.dev/{form.slug}</div></div>
            <div className="flex gap-3"><button onClick={()=>setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-lg font-bold text-sm">← Back</button><button onClick={submit} disabled={submitting||!form.admin_email} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold text-sm disabled:opacity-40">{submitting?'Creating club...':'🚀 Create Club'}</button></div>
          </div>}
          {step===3 && <div className="text-center py-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-black text-gray-900 mb-2">{form.name} is live!</h2>
            <p className="text-gray-500 text-sm mb-6">Check your email for the magic login link. Your club is ready at:</p>
            <div className="bg-gray-50 rounded-lg px-4 py-3 font-mono text-sm text-gray-700 mb-6 break-all">clubhouse-e5e.pages.dev/{form.slug}</div>
            <div className="flex gap-3 flex-col sm:flex-row">
              <Link to={`/${form.slug}/dashboard`} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold text-sm text-center">Go to Club Dashboard →</Link>
              <Link to="/" className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-lg font-bold text-sm text-center">Back to Home</Link>
            </div>
          </div>}
        </div>
      </div>
    </div>
  )
}
