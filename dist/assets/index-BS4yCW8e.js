import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{C as t,S as n,_ as r,a as i,b as a,c as o,d as s,f as c,g as l,h as u,i as d,l as f,m as p,n as m,o as h,p as g,r as _,s as v,t as y,u as b,v as x,w as S,x as C,y as w}from"./vendor-firebase-BGI5x0rT.js";import{c as T}from"./vendor-CLWOpsq3.js";import{a as E,i as D,n as O,r as k,t as A}from"./vendor-pdf-C3MHnq3N.js";import{n as j,t as M}from"./vendor-xlsx-DXM_A2ny.js";import{t as ee}from"./vendor-chart-g6IpANAA.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var N=S({apiKey:`AIzaSyBoPbWqksM2RmZTD1x3-ykWUVZzfXlM2d8`,authDomain:`kmppampalogs.firebaseapp.com`,projectId:`kmppampalogs`,storageBucket:`kmppampalogs.firebasestorage.app`,messagingSenderId:`672982424982`,appId:`1:672982424982:web:5c819788e0c33ba54f91b7`,measurementId:`G-NS0X4WSHV4`});y(N);var P=t(N);typeof window<`u`&&(window.db=P),n(P).catch(e=>{e.code==`failed-precondition`?console.warn(`Múltiples pestañas abiertas, persistencia solo funciona en una.`):e.code==`unimplemented`&&console.warn(`El navegador actual no soporta persistencia offline.`)});var F=_(N),I=new T(`KmpTravelLocalDb`);I.version(1).stores({travels:`id, status, updatedAt`,faenas_detalle:`id, status, tropa, garron, destination, dispatchDate, barcode, updatedAt`,clientes:`id, name, updatedAt`,sync_logs:`++id, timestamp, status`}),I.version(2).stores({travels:`id, status, updatedAt`,faenas_detalle:`id, status, tropa, garron, destination, dispatchDate, barcode, updatedAt`,clientes:`id, name, updatedAt`,sync_logs:`++id, timestamp, status`,cash_extractions:`id, cashSessionId, butcheryName, status, timestamp, updatedAt`}),I.version(3).stores({travels:`id, status, updatedAt`,faenas_detalle:`id, status, tropa, garron, destination, dispatchDate, barcode, updatedAt`,clientes:`id, name, updatedAt`,sync_logs:`++id, timestamp, status`,cash_extractions:`id, cashSessionId, butcheryName, status, timestamp, updatedAt`,employee_time_logs:`id, employeeId, establishmentId, status, checkInTime, checkOutTime, updatedAt`}),I.version(4).stores({travels:`id, status, updatedAt`,faenas_detalle:`id, status, tropa, garron, destination, dispatchDate, barcode, updatedAt`,clientes:`id, name, updatedAt`,sync_logs:`++id, timestamp, status`,cash_extractions:`id, cashSessionId, butcheryName, status, timestamp, updatedAt`,employee_time_logs:`id, employeeId, establishmentId, status, checkInTime, checkOutTime, updatedAt`,accounting_entries:`id, type, date, updatedAt`,check_operations:`id, ownerUid, status, updatedAt`});var te=class{constructor(e={}){this.rendimiento=e.rendimiento||58.5,this.precioVivo=e.precioVivo||5050,this.distancia=e.distancia||0,this.porcentajeIIBB=e.porcentajeIIBB||1.7,this.jaulaDobleOrSimple=e.jaulaDobleOrSimple??!0;let t=e.settings||{};this.pesoJaulaDoble=e.pesoJaulaDoble||t.pesoJaulaDoble||32e3,this.pesoJaulaSimple=e.pesoJaulaSimple||t.pesoJaulaSimple||16e3,this.margenGanancia=e.margenGanancia||t.margenGanancia||1.05,this.precioKmSimple=e.precioKmSimple||t.precioKmSimple||1200,this.precioKmDouble=e.precioKmDouble||t.precioKmDouble||2e3}get precioKm(){return this.jaulaDobleOrSimple?this.precioKmDouble:this.precioKmSimple}get kgVivos(){return this.jaulaDobleOrSimple?this.pesoJaulaDoble:this.pesoJaulaSimple}get kgFaena(){return this.kgVivos*(this.rendimiento/100)}get costoInicialPorKgCarne(){return this.rendimiento>0?this.precioVivo/(this.rendimiento/100):0}get costoFletePorKgCarne(){return this.kgFaena>0?this.distancia*this.precioKm/this.kgFaena:0}get costoFinal(){let e=this.costoInicialPorKgCarne+this.costoFletePorKgCarne,t=1-this.margenGanancia*(this.porcentajeIIBB/100);return t>1e-4?e/t:e}get facturaVentaPorKgCarne(){return this.costoFinal*this.margenGanancia}get costoIIBB(){return this.facturaVentaPorKgCarne*(this.porcentajeIIBB/100)}get utilidadPorKg(){return this.facturaVentaPorKgCarne-this.costoFinal}get totalVentaEstimada(){return this.facturaVentaPorKgCarne*this.kgFaena}get utilidadTotalEstimada(){return this.utilidadPorKg*this.kgFaena}},L=class{static KEY=`kmp_transport_settings`;static getDefaults(){return{pesoJaulaDoble:21500,precioKmDouble:3100,pesoJaulaSimple:15500,precioKmSimple:2500,margenGanancia:1.1}}static loadSettings(){let e=this.getDefaults();try{let t=localStorage.getItem(this.KEY);if(t)return{...e,...JSON.parse(t)}}catch(e){console.warn(`Error loading settings from localStorage`,e)}return e}static saveSettings(e){try{return localStorage.setItem(this.KEY,JSON.stringify(e)),!0}catch(e){return console.error(`Error saving settings`,e),!1}}},R=new Map,z=300*1e3,B=600*1e3;function V(e){let t=R.get(e);return t&&Date.now()<t.expiresAt?t.data:(R.delete(e),null)}function H(e,t,n=z){R.set(e,{data:t,expiresAt:Date.now()+n})}function U(...e){e.forEach(e=>R.delete(e))}function ne(e){if(!e.exists())return null;let t=e.data();try{let{data:n,updatedAt:r,createdAt:i,...a}=t;if(n&&typeof n==`string`){let t=JSON.parse(n);return{...a,...t,firebaseId:e.id}}return{id:e.id,...t}}catch(n){return console.warn(`Error parsing data for doc ${e.id}:`,n),{id:e.id,...t}}}async function re(e,t){if(!t||!t.uid)return{role:`VISOR`,allowedViews:[]};let n=C(e,`user_metadata`,t.uid),r=await f(n);if(r.exists()){let e=r.data(),i={};return t.uid===`iqy12KgqiDU0Z1QwwbqRSqvSpCM2`&&e.role!==`ADMIN`&&(i.role=`ADMIN`),!e.email&&t.email&&(i.email=t.email),Object.keys(i).length>0&&(i.updatedAt=Date.now(),await p(n,i,{merge:!0})),{...e,...i}}let i=t.uid===`iqy12KgqiDU0Z1QwwbqRSqvSpCM2`?`ADMIN`:`VISOR`,a={role:i,email:t.email||``,allowedViews:[],createdAt:Date.now()};return console.log(`Setting default metadata ${i} for user ${t.uid}`),await p(n,a),a}async function ie(e){let t=`user_metadata:all`,n=V(t);if(n)return n;let r=(await b(a(e,`user_metadata`))).docs.map(e=>({uid:e.id,...e.data()}));return H(t,r,B),r}async function ae(e,t,n,r=null){let i=C(e,`user_metadata`,t),a={role:n,updatedAt:Date.now()};r!==null&&(a.allowedViews=r),await p(i,a,{merge:!0}),U(`user_metadata:all`)}async function oe(e,t){await o(C(e,`user_metadata`,t)),U(`user_metadata:all`)}var W=null,G=null;async function se(e){if(W&&W.length>0)return W;let t=await I.clientes.toArray();return t.length>0&&(W=t),t}function ce(){W=null}async function le(e,t){let n=a(e,`clientes`),i,o=Date.now(),c;if(t.id)i=C(e,`clientes`,t.id),c={...t,updatedAt:o},await l(i,c);else{let a=await b(g(n,r(`name`,`==`,t.name),s(1)));if(a.empty){let e=await v(n,{...t,createdAt:o,updatedAt:o});i=e,c={...t,id:e.id,createdAt:o,updatedAt:o}}else{let n=a.docs[0].id;i=C(e,`clientes`,n),c={...t,id:n,updatedAt:o},await l(i,c)}}return await I.clientes.put(c),W=null,i.id}async function ue(e){if(G)return G;let t=await f(C(e,`config`,`prices`));if(t.exists()){let e=t.data();return G=e.prices||e||{},G}return{}}async function de(e,t){await p(C(e,`config`,`prices`),{prices:t,updatedAt:Date.now()}),G=null}async function fe(e,t){return(await b(g(a(e,`transactions`),r(`clientId`,`==`,t)))).docs.map(e=>({id:e.id,...e.data()}))}async function pe(e){let t=`transactions:all`,n=V(t);if(n)return n;let r=(await b(a(e,`transactions`))).docs.map(e=>({id:e.id,...e.data()}));return H(t,r,z),r}async function me(e,t){await v(a(e,`transactions`),{...t,createdAt:Date.now()}),U(`transactions:all`)}async function he(e,t,n,i,s){let c=a(e,t),u=await b(g(c,r(`checkId`,`==`,n),r(`checkSide`,`==`,i)));if(!s){for(let n of u.docs)await o(C(e,t,n.id));return}u.empty?await v(c,{...s,checkId:n,checkSide:i,createdAt:Date.now()}):await l(C(e,t,u.docs[0].id),{...s,updatedAt:Date.now()})}async function ge(e,t,n,i){let o=(await b(g(a(e,`transactions`),r(`clientId`,`==`,t)))).docs.map(e=>({id:e.id,...e.data()}));if(n||i){let e=n?new Date(n+`T00:00:00`).getTime():0,t=i?new Date(i+`T23:59:59`).getTime():1/0;o=o.filter(n=>{let r=n.date||n.createdAt;return r>=e&&r<=t})}return o}async function _e(e,t){let n=a(e,`price_analyses`),r,{id:i,...o}=t,s={...o,updatedAt:Date.now()};return i?(r=C(e,`price_analyses`,i),await l(r,s)):(s.createdAt=Date.now(),r=await v(n,s)),r.id}async function ve(e,t){return(await b(g(a(e,`price_analyses`),r(`clientId`,`==`,t)))).docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>(t.createdAt||0)-(e.createdAt||0))}async function ye(e,t){let n=await f(C(e,`sales`,t));return n.exists()?{id:n.id,...n.data()}:null}var be=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:`open`})}static get observedAttributes(){return[`status`,`label`]}attributeChangedCallback(){this.render()}connectedCallback(){this.render()}getStyles(e){let t=String(e||``).toUpperCase(),n={COMPLETED:{h:142,s:70,l:45,text:`Finalizado`},FINALIZADO:{h:142,s:70,l:45,text:`Finalizado`},ACTIVE:{h:217,s:91,l:60,text:`Activo`},ACTIVO:{h:217,s:91,l:60,text:`Activo`},DRAFT:{h:36,s:100,l:50,text:`Borrador`},BORRADOR:{h:36,s:100,l:50,text:`Borrador`},PENDING:{h:27,s:96,l:61,text:`Pendiente`},PENDIENTE:{h:27,s:96,l:61,text:`Pendiente`},SOLD:{h:250,s:89,l:65,text:`Vendido`},VENDIDO:{h:250,s:89,l:65,text:`Vendido`},REJECTED:{h:0,s:84,l:60,text:`Rechazado`},RECHAZADO:{h:0,s:84,l:60,text:`Rechazado`},PAID:{h:152,s:76,l:40,text:`Pagado`},PAGADO:{h:152,s:76,l:40,text:`Pagado`},VOID:{h:0,s:0,l:60,text:`Anulado`},ANULADO:{h:0,s:0,l:60,text:`Anulado`}}[t]||{h:200,s:10,l:60,text:t};return`
      :host {
        display: inline-block;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.65rem;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.72rem;
        font-weight: 700;
        border-radius: 9999px;
        letter-spacing: 0.2px;
        text-transform: uppercase;
        background-color: hsla(${n.h}, ${n.s}%, ${n.l}%, 0.12);
        border: 1.5px solid hsla(${n.h}, ${n.s}%, ${n.l}%, 0.25);
        color: hsl(${n.h}, ${n.s}%, 72%);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: default;
        user-select: none;
      }
      .chip:hover {
        background-color: hsla(${n.h}, ${n.s}%, ${n.l}%, 0.2);
        border-color: hsla(${n.h}, ${n.s}%, ${n.l}%, 0.45);
        color: hsl(${n.h}, ${n.s}%, 82%);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.16);
      }
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: hsl(${n.h}, ${n.s}%, 55%);
        box-shadow: 0 0 6px hsl(${n.h}, ${n.s}%, 55%);
        transition: all 0.2s ease;
      }
      .chip:hover .dot {
        transform: scale(1.2);
        background-color: hsl(${n.h}, ${n.s}%, 65%);
        box-shadow: 0 0 10px hsl(${n.h}, ${n.s}%, 65%);
      }
    `}render(){let e=this.getAttribute(`status`)||``,t=this.getAttribute(`label`)||{COMPLETED:`Finalizado`,FINALIZADO:`Finalizado`,ACTIVE:`Activo`,ACTIVO:`Activo`,DRAFT:`Borrador`,BORRADOR:`Borrador`,PENDING:`Pendiente`,PENDIENTE:`Pendiente`,SOLD:`Vendido`,VENDIDO:`Vendido`,REJECTED:`Rechazado`,RECHAZADO:`Rechazado`,PAID:`Pagado`,PAGADO:`Pagado`,VOID:`Anulado`,ANULADO:`Anulado`}[String(e).toUpperCase()]||e;this.shadowRoot.innerHTML=`
      <style>${this.getStyles(e)}</style>
      <div class="chip">
        <span class="dot"></span>
        <span class="text">${t}</span>
      </div>
    `}};customElements.get(`kmp-status-chip`)||customElements.define(`kmp-status-chip`,be);var xe=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:`open`})}static get observedAttributes(){return[`title`,`value`,`trend`,`icon`,`subtitle`,`value-color`]}attributeChangedCallback(){this.render()}connectedCallback(){this.render()}getStyles(){let e=this.getAttribute(`trend`)||``,t=e.startsWith(`+`)||e.includes(`up`)||parseFloat(e)>0,n=e.startsWith(`-`)||e.includes(`down`)||parseFloat(e)<0,r=`var(--text-muted, #94a3b8)`;return t&&(r=`#34d399`),n&&(r=`#f87171`),`
      :host {
        display: block;
        flex: 1 1 200px;
        min-width: 180px;
      }
      .card {
        padding: 1.25rem 1.5rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      .card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
        pointer-events: none;
        z-index: 1;
      }
      .card:hover {
        transform: translateY(-4px);
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        position: relative;
        z-index: 2;
      }
      .title {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-muted, #94a3b8);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 0;
      }
      .icon-wrapper {
        font-size: 1.25rem;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.2s ease;
      }
      .card:hover .icon-wrapper {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
      }
      .body {
        position: relative;
        z-index: 2;
      }
      .value {
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        font-size: 1.62rem;
        font-weight: 800;
        color: var(--text-primary, #f8fafc);
        letter-spacing: -0.5px;
        margin: 0;
        line-height: 1.2;
      }
      .footer {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-top: 0.65rem;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.72rem;
        position: relative;
        z-index: 2;
      }
      .trend {
        font-weight: 700;
        color: ${r};
        display: flex;
        align-items: center;
        gap: 0.15rem;
      }
      .subtitle {
        color: var(--text-muted, #64748b);
        font-weight: 500;
      }
    `}render(){let e=this.getAttribute(`title`)||``,t=this.getAttribute(`value`)||``,n=this.getAttribute(`trend`)||``,r=this.getAttribute(`icon`)||``,i=this.getAttribute(`subtitle`)||``,a=this.getAttribute(`value-color`)||``,o=a?`style="color: ${a};"`:``,s=n.startsWith(`+`)||parseFloat(n)>0,c=n.startsWith(`-`)||parseFloat(n)<0,l=``;s&&(l=`↑`),c&&(l=`↓`),this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="card">
        <div class="header">
          <h4 class="title">${e}</h4>
          ${r?`<div class="icon-wrapper">${r}</div>`:``}
        </div>
        <div class="body">
          <div class="value" ${o}>${t}</div>
        </div>
        ${n||i?`
          <div class="footer">
            ${n?`<span class="trend">${l} ${n}</span>`:``}
            ${i?`<span class="subtitle">${i}</span>`:``}
          </div>
        `:``}
      </div>
    `}};customElements.get(`kmp-metric-card`)||customElements.define(`kmp-metric-card`,xe);var Se=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:`open`}),this._userRole=`VISOR`,this.activeView=`dashboard`}static get observedAttributes(){return[`role`,`active`]}attributeChangedCallback(e,t,n){e===`role`?this._userRole=n||`VISOR`:e===`active`&&(this.activeView=n||`dashboard`),this.render()}connectedCallback(){this.render()}getStyles(){return`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.3);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-right: 1px solid rgba(255, 255, 255, 0.04);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .sidebar-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 0.75rem;
        box-sizing: border-box;
      }
      /* Custom Scrollbar for Premium Feel */
      .sidebar-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .sidebar-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .sidebar-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.06);
        border-radius: 99px;
      }
      .sidebar-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .nav-group {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin-bottom: 1.5rem;
      }
      .group-title {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.65rem;
        font-weight: 800;
        color: var(--text-muted, #64748b);
        opacity: 0.5;
        letter-spacing: 1.5px;
        padding: 0.5rem 0.75rem;
        text-transform: uppercase;
        border-bottom: 1px solid rgba(255, 255, 255, 0.02);
        margin-bottom: 0.4rem;
        user-select: none;
      }
      .nav-item {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--text-muted, #94a3b8);
        padding: 0.7rem 0.9rem;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.65rem;
        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        box-sizing: border-box;
      }
      .nav-item:hover {
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-primary, #f1f5f9);
        transform: translateX(2px);
      }
      .nav-item.active {
        background: rgba(59, 130, 246, 0.12);
        border: 1px solid rgba(59, 130, 246, 0.25);
        color: #60a5fa; /* Blue-400 */
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.05);
      }
      .nav-item.logout-item {
        color: var(--danger, #f87171);
        margin-top: 1.5rem;
        border: 1px solid transparent;
      }
      .nav-item.logout-item:hover {
        background: rgba(239, 68, 68, 0.08);
        border-color: rgba(239, 68, 68, 0.15);
        color: #fca5a5;
      }
    `}render(){let e=this._userRole,t=this.activeView,n=[{title:`OPERACIONES & LOGÍSTICA`,items:[{id:`dashboard`,label:`📊 Dashboard`,roles:[`ADMIN`,`OPERARIO`,`VISOR`]},{id:`travels`,label:`🚛 Gestión de Viajes`,roles:[`ADMIN`,`OPERARIO`,`VISOR`]},{id:`logistics-liquidations`,label:`💵 Liquidación Choferes`,roles:[`ADMIN`,`OPERARIO`]},{id:`logistics-fuel`,label:`⛽ Rendimiento Combustible`,roles:[`ADMIN`,`OPERARIO`]},{id:`consumption`,label:`🥩 Despacho y Stock`,roles:[`ADMIN`,`OPERARIO`]}]},{title:`FINANZAS & CRÉDITO`,items:[{id:`checks`,label:`💸 Gestión de Cheques`,roles:[`ADMIN`,`OPERARIO`]},{id:`accounting`,label:`💰 Caja General`,roles:[`ADMIN`,`OPERARIO`]},{id:`frigorifico`,label:`🏢 Caja Frigorífico`,roles:[`ADMIN`,`OPERARIO`]}]},{title:`HERRAMIENTAS & ANÁLISIS`,items:[{id:`simulator`,label:`🧮 Simulador de Costos`,roles:[`ADMIN`,`OPERARIO`,`VISOR`]},{id:`price-share`,label:`📲 Placa de Precios`,roles:[`ADMIN`,`OPERARIO`]}]},{title:`SISTEMA & CONFIGURACIÓN`,items:[{id:`master-data`,label:`⚙️ Datos Maestros`,roles:[`ADMIN`]},{id:`clients`,label:`👥 Clientes y Cuentas`,roles:[`ADMIN`]},{id:`establishments`,label:`🏢 Sucursales y Personal`,roles:[`ADMIN`]},{id:`settings`,label:`⚙️ Configuración`,roles:[`ADMIN`]},{id:`contact`,label:`📖 Info y Contacto`,roles:[`ADMIN`,`OPERARIO`,`VISOR`]}]}],r=`<div class="sidebar-scroll">`;n.forEach(n=>{let i=n.items.filter(t=>t.roles.includes(e));i.length!==0&&(r+=`
        <div class="nav-group">
          <div class="group-title">${n.title}</div>
      `,i.forEach(e=>{let n=e.id===t?`active`:``;r+=`
          <div class="nav-item ${n}" data-view="${e.id}">
            ${e.label}
          </div>
        `}),r+=`</div>`)}),r+=`
      <div class="nav-item logout-item" id="logout-btn">
        🚪 Cerrar Sesión
      </div>
    `,r+=`</div>`,this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      ${r}
    `,this.shadowRoot.querySelectorAll(`.nav-item`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-view`);t&&(this.dispatchEvent(new CustomEvent(`navigate`,{detail:{view:t},bubbles:!0,composed:!0})),document.body.classList.remove(`sidebar-open`))})});let i=this.shadowRoot.getElementById(`logout-btn`);i&&i.addEventListener(`click`,()=>{confirm(`¿Deseas cerrar sesión del sistema?`)&&window.dispatchEvent(new CustomEvent(`app:logout`))})}};customElements.get(`kmp-sidebar`)||customElements.define(`kmp-sidebar`,Se);function K(e,{classes:t=[],text:n=``,html:r=``,attrs:i={},style:a=``}={}){let o=document.createElement(e),s=t.filter(e=>e&&typeof e==`string`&&e.trim()!==``);s.length&&o.classList.add(...s),n&&(o.textContent=n),r&&(o.innerHTML=r),a&&(o.style.cssText=a);for(let[e,t]of Object.entries(i))o.setAttribute(e,t);return o}function Ce(e,t,n){let r=K(`div`,{classes:[`modal-overlay`,`fade-in`],style:`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem;`}),i=K(`div`,{classes:[`glass-card`],style:`max-width: 850px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2.25rem; border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5);`}),a=()=>{let o=e.buy;i.innerHTML=``;let s=K(`h2`,{text:`Detalle de Liquidación`,style:`margin: 0; font-size: 1.35rem; font-weight: 800; color: var(--text-main);`}),c=K(`p`,{classes:[`card-subtitle`],html:`Productor: <strong style="color: var(--text-main);">${t.producer.name}</strong> | Viaje: <strong style="color: var(--text-main);">${e.truck?.name||`ID: `+e.id}</strong>`,style:`margin: 0.35rem 0 1.75rem 0; font-size: 0.85rem; color: var(--text-muted);`});i.appendChild(s),i.appendChild(c);let l=K(`div`,{classes:[`table-responsive`],style:`margin-bottom: 1.5rem; overflow-x: auto; background: rgba(0,0,0,0.12); padding: 0.75rem; border-radius: 16px; border: 1px solid var(--border);`}),u=K(`table`,{style:`width: 100%; min-width: 650px; border-collapse: collapse; font-size: 0.82rem;`,html:`
        <thead>
          <tr style="border-bottom: 2px solid var(--border); text-align: left; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 0.75rem;">Producto</th>
            <th style="padding: 0.75rem; text-align: center;">Cant.</th>
            <th style="padding: 0.75rem; text-align: right;">Kg Sucio</th>
            <th style="padding: 0.75rem; text-align: center;">% Desv. (Desb.)</th>
            <th style="padding: 0.75rem; text-align: right;">Kg Limpio</th>
            <th style="padding: 0.75rem; text-align: right;">Precio Vivo ($)</th>
            <th style="padding: 0.75rem; text-align: right;">Operación</th>
            <th style="padding: 0.75rem; text-align: right;">Comisión</th>
          </tr>
        </thead>
        <tbody style="font-weight: 600;">
          ${t.listOfProducts.map((e,t)=>`
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); color: var(--text-main);">
              <td style="padding: 0.75rem; font-weight: 700; color: #ffffff;">${e.name}</td>
              <td style="padding: 0.75rem; text-align: center; color: var(--text-muted);">${e.quantity}</td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace;">${e.kg.toLocaleString()}</td>
              <td style="padding: 0.75rem; text-align: center;">
                <input type="number" step="0.1" value="${e.roughing}" 
                  class="compact-input product-roughing" data-idx="${t}"
                  style="width: 70px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); text-align: center; font-weight: 700;">
              </td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace; color: #34d399;">${e.kgClean.toFixed(0).toLocaleString()}</td>
              <td style="padding: 0.75rem; text-align: right;">
                <input type="number" step="1" value="${e.price}" 
                  class="compact-input product-price" data-idx="${t}"
                  style="width: 85px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); text-align: right; font-weight: 750;">
              </td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace;">$${e.operation.toLocaleString()}</td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace; color: var(--primary);">$${e.commission.toLocaleString()}</td>
            </tr>
          `).join(``)}
        </tbody>
      `});l.appendChild(u),i.appendChild(l);let d=K(`div`,{style:`margin-bottom: 1.5rem; padding: 1.15rem 1.5rem; border: 1px solid var(--border); border-radius: 16px; background: rgba(255, 255, 255, 0.01); display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;`}),f=t.manualIva!==null&&t.manualIva!==void 0,p=K(`label`,{style:`display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-weight: 600; color: var(--text-main); margin: 0;`,html:`
        <span style="font-size: 0.85rem;">🛠️ Usar Cálculo de IVA Manual</span>
        <label class="switch-container-m3" style="margin: 0;">
          <input type="checkbox" id="toggle-manual-iva" ${f?`checked`:``}>
          <span class="switch-slider-m3"></span>
        </label>
      `}),m=K(`input`,{attrs:{type:`number`,step:`1`,value:f?t.manualIva:``,placeholder:`Monto IVA ($)`,id:`manual-iva-input`},style:`padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; width: 150px; text-align: right; visibility: ${f?`visible`:`hidden`};`});d.appendChild(p),d.appendChild(m),i.appendChild(d);let h=t.facturaOverOpRatio,g=h<.4?`#f87171`:h>1?`#fbbf24`:`#34d399`,_=h<.4?`⚠️ Ratio Factura/Operación muy bajo (< 40%)`:h>1?`⚠️ Ratio Factura/Operación superior al 100%`:`🛡️ Ratio Factura/Operación dentro del rango normal`,v=K(`div`,{style:`margin-bottom: 1.5rem; padding: 0.95rem 1.25rem; border-radius: 14px; background: ${g}0d; border: 1.5px solid ${g}25; display: flex; align-items: center; gap: 0.95rem;`});v.innerHTML=`<span style="font-size: 1.4rem;">${h<.4||h>1?`🚩`:`🛡️`}</span>
      <div style="flex: 1;">
        <div style="font-weight: 700; color: ${g}; font-size: 0.88rem;">Ratio Factura / Operación: ${(h*100).toFixed(1)}%</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: 0.15rem;">${_}</div>
      </div>`,i.appendChild(v);let y=K(`div`,{classes:[`grid-2-cols`],style:`background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 1.25rem 1.5rem; border-radius: 16px; gap: 2rem; display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 1.5rem;`}),b=K(`div`,{style:`display: flex; flex-direction: column; gap: 0.65rem;`});b.innerHTML=`
      <div class="detail-row"><span>Total Operación:</span> <strong>$${t.totalOperation.toLocaleString()}</strong></div>
      <div class="detail-row"><span>Total Comisión (${t.buy?.agent?.percent||0}%):</span> <strong>$${t.totalCommission.toLocaleString()}</strong></div>
      <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.25rem;"><span style="color: var(--text-main); font-weight: 700;">Op + Comisión:</span> <strong style="color: #60a5fa;">$${t.totalOpPlusComm.toLocaleString()}</strong></div>
    `;let x=K(`div`,{style:`display: flex; flex-direction: column; gap: 0.65rem;`});x.innerHTML=`
      <div class="detail-row"><span>Achique Total Viaje:</span> <strong>$${o.reduce.toLocaleString()}</strong></div>
      <div class="detail-row"><span>Achique Prorrateado:</span> <strong style="color: #f87171;">- $${t.achiqueProrrateado.toLocaleString()}</strong></div>
      <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.25rem;"><span style="color: var(--text-main); font-weight: 700;">Base Factura:</span> <strong>$${t.totalFactura.toLocaleString()}</strong></div>
    `,y.appendChild(b),y.appendChild(x),i.appendChild(y);let S=K(`div`,{style:`padding: 1.25rem; border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); margin-bottom: 1.75rem; display: flex; flex-direction: column; gap: 0.65rem;`});S.innerHTML=`
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--text-muted); font-weight: 500;">Neto:</span> <strong style="font-family: monospace; color: var(--text-main); font-size: 0.9rem;">$${t.neto.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--text-muted); font-weight: 500;">IVA Consolidado (10.5%):</span> <strong style="font-family: monospace; color: var(--text-main); font-size: 0.9rem;">$${t.iva.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--text-muted); font-weight: 500;">Retención Ganancias (2% Neto) [Separada]:</span> <strong style="font-family: monospace; color: #f87171; font-size: 0.9rem;">- $${t.retencionGanancias.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 1.15rem; border-top: 1.5px solid var(--primary); padding-top: 1rem; margin-top: 0.5rem; align-items: center;">
        <strong style="color: #ffffff; font-weight: 800;">FACTURA (Neto + IVA):</strong> 
        <strong style="color: #34d399; font-size: 1.35rem; font-weight: 850; text-shadow: 0 0 10px rgba(52,211,153,0.15);">$${t.totalFactura.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.95rem; padding-top: 0.5rem; align-items: center;">
        <span style="color: var(--text-muted); font-weight: 700;">TOTAL NETO A PAGAR (Factura - Retención):</span> 
        <strong style="color: #fbbf24; font-size: 1.15rem; font-weight: 800;">$${t.totalAPagar.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
      </div>
    `,i.appendChild(S);let C=K(`div`,{classes:[`modal-actions`],style:`display: flex; gap: 1rem; justify-content: flex-end;`}),w=K(`button`,{classes:[`btn-outline`],text:`Cerrar`,style:`padding: 0.65rem 1.5rem; border-radius: 12px; font-weight: 600;`}),T=K(`button`,{classes:[`btn-primary`],text:`💾 Guardar Liquidación`,style:`background: #10b981; border: none; padding: 0.65rem 1.75rem; border-radius: 12px; font-weight: 700; color: #ffffff;`});w.onclick=()=>r.remove(),T.onclick=()=>{let a=[];i.querySelectorAll(`.product-roughing`).forEach(e=>{let t=parseInt(e.dataset.idx),n=i.querySelector(`.product-price[data-idx="${t}"]`);a.push({index:t,roughing:parseFloat(e.value),price:parseFloat(n.value)})});let o=p.querySelector(`input`).checked?parseFloat(m.value):null;n.onUpdateSettlement&&n.onUpdateSettlement(e.id,String(t.producer.cuit||``),a,o),r.remove()},C.appendChild(w),C.appendChild(T),i.appendChild(C),p.querySelector(`input`).onchange=e=>{m.style.visibility=e.target.checked?`visible`:`hidden`,e.target.checked||(t.manualIva=null,a())},m.oninput=e=>{t.manualIva=parseFloat(e.target.value)||0,a();let n=i.querySelector(`#manual-iva-input`);n.focus();let r=n.value;n.value=``,n.value=r},i.querySelectorAll(`.product-roughing, .product-price`).forEach(e=>{e.oninput=e=>{let n=parseInt(e.target.dataset.idx),r=i.querySelector(`.product-roughing[data-idx="${n}"]`).value,o=i.querySelector(`.product-price[data-idx="${n}"]`).value;t.listOfProducts[n].roughing=parseFloat(r)||0,t.listOfProducts[n].price=parseFloat(o)||0,a();let s=e.target.classList.contains(`product-roughing`)?`.product-roughing`:`.product-price`,c=i.querySelector(`${s}[data-idx="${n}"]`);c.focus();let l=c.value;c.value=``,c.value=l}})};a(),r.appendChild(i),document.body.appendChild(r)}function we(e){if(!e)return`OTRO`;let t=e.trim().toLowerCase();return t.startsWith(`nov`)||t.includes(`novillo`)||t.startsWith(`nto`)||t.startsWith(`mej`)||t.startsWith(`no `)?`NOVILLO`:t.startsWith(`vq`)||t.startsWith(`vaq`)?`VAQUILLONA`:t.startsWith(`vaca`)||t.startsWith(`vac`)||t.startsWith(`vaca cons`)||t.startsWith(`vaca flaca`)||t.startsWith(`va`)?`VACA`:t.startsWith(`to`)||t.startsWith(`toro`)?`TORO`:`OTRO`}var Te=class{constructor(e={}){this.id=e.id||e.firebaseId||``,this.agent=e.agent||{name:``,percent:0},this.reduce=e.totalReduce||e.reduce||0,this.listOfProducers=(e.listOfProducers||[]).map(e=>new Ee(e,this))}get categories(){let e=new Set;return this.listOfProducers.forEach(t=>{t.listOfProducts.forEach(t=>{e.add(t.standardizedCategory)})}),Array.from(e)}get totalOperation(){return this.listOfProducers.reduce((e,t)=>e+t.totalOperation,0)}get totalKgClean(){return this.listOfProducers.reduce((e,t)=>e+t.totalKgClean,0)}get totalKgFaena(){return this.listOfProducers.reduce((e,t)=>e+t.totalKgFaena,0)}get totalQuantity(){return this.listOfProducers.reduce((e,t)=>e+t.totalQuantity,0)}get agentCommissionAmount(){return this.totalOperation*((this.agent?.percent||0)/100)}get totalOperationWithCommission(){return this.totalOperation+this.agentCommissionAmount}get amountToDistribute(){return Math.max(0,this.reduce-this.agentCommissionAmount)}get avgPrice(){let e=this.totalKgClean;return e>0?this.totalOperation/e:0}get avgPriceWithCommission(){let e=this.totalKgClean;return e>0?this.totalOperationWithCommission/e:0}get generalYield(){let e=this.totalKgClean;return e>0?this.totalKgFaena/e:0}},Ee=class{constructor(e={},t=null){this.buy=t;let n=typeof e.producer==`object`&&e.producer!==null?e.producer:null;this.producer={name:n?.name||e.name||e.producerName||`Productor`,cuit:n?.cuit||e.cuit||e.cuit_numero||``,cbu:n?.cbu||e.cbu||e.cbu_numero||``},this.origin=e.origin||``,this.manualIva=e.manualIva===void 0?null:e.manualIva,this.listOfProducts=(e.listOfProducts||[]).map(e=>new De(e,t))}get totalKgClean(){return this.listOfProducts.reduce((e,t)=>e+t.kgClean,0)}get totalOperation(){return this.listOfProducts.reduce((e,t)=>e+t.operation,0)}get totalQuantity(){return this.listOfProducts.reduce((e,t)=>e+(t.quantity||0),0)}get totalCommission(){return this.listOfProducts.reduce((e,t)=>e+(t.commission||0),0)}get totalOpPlusComm(){return this.totalOperation+this.totalCommission}get achiqueStandard(){return!this.buy||this.buy.totalQuantity===0?0:this.totalQuantity/this.buy.totalQuantity*this.buy.amountToDistribute}get iva(){return this.manualIva===null?this.totalFacturaStandard-this.netoStandard:this.manualIva}get neto(){return this.manualIva===null?this.netoStandard:this.manualIva/.105}get totalFactura(){return this.neto+this.iva}get totalFacturaStandard(){return this.totalOpPlusComm-this.achiqueStandard}get netoStandard(){return this.totalFacturaStandard/1.105}get achiqueProrrateado(){return this.manualIva===null?this.achiqueStandard:this.totalOpPlusComm-this.totalFactura}get facturaOverOpRatio(){return this.totalOperation>0?this.totalFactura/this.totalOperation:0}get retencionGanancias(){return this.neto*.02}get totalAPagar(){return this.totalOpPlusComm-this.achiqueProrrateado-this.retencionGanancias}get totalKgFaena(){return this.listOfProducts.reduce((e,t)=>e+(t.kgFaena||0),0)}get totalIva(){return this.iva}get totalGanancias(){return this.retencionGanancias}},De=class{constructor(e={},t=null){this.name=e.name||``,this.kg=e.kg||0,this.roughing=e.roughing||0,this.price=e.price||0,this.quantity=e.quantity||0,this.kgFaena=e.kgFaena||0,this.taxes=e.taxes||{bill:{neto:0,iva:0,ganancias:0}},this.agentPercent=t?.agent?.percent||0}get standardizedCategory(){return we(this.name)}get kgClean(){let e=this.roughing>0&&this.roughing<1?this.roughing:1-this.roughing/100;return this.kg*e}get operation(){return this.kgClean*this.price}get commission(){return this.operation*(this.agentPercent/100)}get billFactura(){let e=this.taxes.bill||{neto:0,iva:0};return(e.neto||0)+(e.iva||0)}};async function Oe(e){let t=new E,n=[132,29,29];t.setFillColor(...n),t.rect(0,0,210,40,`F`),t.setTextColor(255,255,255),t.setFontSize(22),t.text(`REPORTE DE VIAJES KMP`,15,25),t.setFontSize(10),t.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`,150,25),t.setTextColor(0,0,0),t.setFontSize(14),t.text(`Resumen de Periodo`,15,55);let r=e.reduce((e,t)=>e+(t.buy?.totalKgClean||0),0),i=e.reduce((e,t)=>e+(t.buy?.totalOperation||0),0),a=r>0?i/r:0;t.setFontSize(11),t.text(`Total Viajes: ${e.length}`,15,65),t.text(`Kilos Totales: ${r.toLocaleString()} kg`,80,65),t.text(`Precio Promedio: $${a.toFixed(2)}`,150,65);let o=85;t.setFontSize(12),t.setTextColor(...n),t.text(`Detalle Viaje por Viaje`,15,o-5),t.setFontSize(9),t.setTextColor(100,100,100),t.setDrawColor(200,200,200),t.line(15,o,195,o),t.text(`ID / Camión`,15,o+5),t.text(`Fecha`,60,o+5),t.text(`Categorías`,90,o+5),t.text(`Kg Limpios`,140,o+5),t.text(`Precio Prom.`,170,o+5),o+=10,t.line(15,o,195,o),o+=5,e.forEach((e,n)=>{o>270&&(t.addPage(),o=20);let r=e.buy||{};t.setTextColor(0,0,0),t.text(`${e.truck?.name||`V`+e.id}`,15,o),t.text(`${e.date||``}`,60,o),t.text(`${(r.categories||[]).join(`, `).substring(0,20)}`,90,o),t.text(`${(r.totalKgClean||0).toLocaleString()}`,140,o),t.text(`$${(r.avgPrice||0).toFixed(2)}`,170,o),o+=8}),t.save(`Reporte_Viajes_KMP_${Date.now()}.pdf`)}async function ke(e){let t=[];e.forEach(e=>{let n=e.buy||{},r=e.truck?.name||`N/A`,i=e.truck?.licensePlate||`N/A`,a=e.driver?.name||`N/A`,o=n.agent?.name||`N/A`;(n.listOfProducers||[]).forEach(n=>{let s=n.producer?.name||`N/A`,c=n.producer?.cuit||`N/A`,l=(n.listOfProducts||[]).map(e=>e.name).join(`, `),u=n.totalKgClean||0,d=n.totalKgFaena||0,f=n.totalOpPlusComm||0,p=u>0?f/u:0,m=u>0?d/u*100:0;t.push({Fecha:e.date||``,"ID Viaje":e.id,Camión:r,Patente:i,Chofer:a,Comisionista:o,Productor:s,"CUIT Productor":c,Categorías:l,Cabezas:n.totalQuantity||0,"Kg Limpios":u,"Kg Faena":d,"Rendimiento (%)":m.toFixed(2),"Precio Prom. ($/kg)":p.toFixed(2),"Total c/ Comisión ($)":f,"Neto ($)":n.neto||0,"IVA ($)":n.totalIva||0,"Ganancias ($)":n.totalGanancias||0,"Factura ($)":n.totalFactura||0})})});let n=M.json_to_sheet(t),r=M.book_new();M.book_append_sheet(r,n,`Reporte Contable`),n[`!cols`]=Object.keys(t[0]||{}).map(e=>({wch:Math.max(e.length,15)})),j(r,`Reporte_Contable_KMP_${Date.now()}.xlsx`)}async function Ae(e,t){if(!e||e.length===0)return;let n=e.map(e=>{let t=e.type===`IN`,n=`-`;if(e.countedAmount!==void 0&&e.countedAmount!==null){let t=e.countedAmount-e.amount;n=Math.abs(t)<.01?`OK`:t>0?`Sobra ${t.toFixed(2)}`:`Falta ${Math.abs(t).toFixed(2)}`}return{Fecha:new Date(e.createdAt).toLocaleDateString(`es-AR`),Hora:new Date(e.createdAt).toLocaleTimeString(`es-AR`,{hour:`2-digit`,minute:`2-digit`}),Tipo:t?`INGRESO (+)`:`EGRESO (-)`,"Descripción / Concepto":e.description||``,"Entidad (Cliente/Prod)":e.clientName||e.producerName||`-`,"Monto ($)":e.amount||0,"Resultado Arqueo":n}}),r=M.json_to_sheet(n),i=M.book_new();M.book_append_sheet(i,r,`Movimientos`),r[`!cols`]=[{wch:12},{wch:10},{wch:15},{wch:30},{wch:30},{wch:15},{wch:20}],j(i,`Movimientos_${t.replace(/\s+/g,`_`)}_${Date.now()}.xlsx`)}async function je(e,t){if(!e||e.length===0)return;let n=e.map(e=>{let n=e.sellSide&&e.sellSide.status===`SOLD`,r=t.find(t=>t.id===e.buySide?.contactId)?.name||`Desconocido`,i=t.find(t=>t.id===e.sellSide?.contactId)?.name||`-`,a=`En Cartera`,o=e.sellSide?.status;return o===`SOLD`?a=`Vendido`:o===`RETURNED`?a=`Devuelto`:o===`REJECTED`?a=`Rechazado`:o===`BACK`&&(a=`Volvió`),{Banco:e.bank||`-`,"# Cheque":e.checkNumber||`-`,Tipo:e.isECheck?`E-Cheque`:`Físico`,Librador:e.issuerName||`-`,"CUIT Librador":e.issuerCuit||`-`,"F. Emisión":e.issueDate?new Date(e.issueDate).toLocaleDateString(`es-AR`):`-`,"F. Recepción":e.receptionDate?new Date(e.receptionDate).toLocaleDateString(`es-AR`):`-`,"F. Pago":e.dueDate?new Date(e.dueDate).toLocaleDateString(`es-AR`):`-`,"Plazo (días)":e.days||0,"Valor Nominal ($)":e.nominalValue||0,"Vendedor (Origen)":r,"Comprador (Destino)":n?i:`-`,Estado:a,"Ganancia ($)":n&&e.profit||0,Notas:e.notes||``}}),r=M.json_to_sheet(n),i=M.book_new();M.book_append_sheet(i,r,`Cheques`),r[`!cols`]=[{wch:20},{wch:15},{wch:15},{wch:15},{wch:15},{wch:20},{wch:25},{wch:25},{wch:15},{wch:15}],j(i,`Reporte_Cheques_${Date.now()}.xlsx`)}function Me(e,t,n){let{fromDate:r,toDate:i,title:a,subtitle:o}=n,s=window.open(``,`_blank`,`width=1000,height=900`),c=r?r.toLocaleDateString(`es-AR`):`Inicio`,l=i?i.toLocaleDateString(`es-AR`):`Hoy`,u=new Date().toLocaleString(`es-AR`),d=e.reduce((e,t)=>e+(parseFloat(t.nominalValue)||0),0),f=e.reduce((e,t)=>t.sellSide?.status===`SOLD`?e+(t.profit||0):e,0),p=e.map(e=>{let n=e.sellSide&&e.sellSide.status===`SOLD`,r=t.find(t=>t.id===e.buySide?.contactId)?.name||`Desconocido`,i=t.find(t=>t.id===e.sellSide?.contactId)?.name||`-`,a=`En Cartera`,o=e.sellSide?.status;return o===`SOLD`?a=`Vendido`:o===`RETURNED`?a=`Devuelto`:o===`REJECTED`?a=`Rechazado`:o===`BACK`&&(a=`Volvió`),`
      <tr>
        <td>
          <div style="font-weight:600; display:flex; align-items:center; gap:4px;">
            ${e.bank||`-`}
            <span style="font-size: 8px; font-weight: 800; background: ${e.isECheck?`#e0e7ff`:`#fef3c7`}; color: ${e.isECheck?`#4f46e5`:`#d97706`}; padding: 1px 4px; border-radius: 3px; font-family: sans-serif; text-transform: uppercase;">${e.isECheck?`E-Cheq`:`Físico`}</span>
          </div>
          <div style="font-size:11px; color:#666;">#${e.checkNumber||`-`}</div>
        </td>
        <td>
          <div>${e.dueDate?new Date(e.dueDate).toLocaleDateString(`es-AR`):`-`}</div>
          ${e.issueDate?`<div style="font-size:10px; color:#888;">Emi: ${new Date(e.issueDate).toLocaleDateString(`es-AR`)}</div>`:``}
        </td>
        <td>
          <div style="font-weight:600;">${e.issuerName||`-`}</div>
          <div style="font-size:10px; color:#666;">${e.issuerCuit||``}</div>
        </td>
        <td>
          <div style="font-size:11px;"><span style="color:#666;">De:</span> ${r}</div>
          <div style="font-size:11px;"><span style="color:#666;">A:</span> ${n?i:`-`}</div>
        </td>
        <td>${a}</td>
        <td class="amount">${(parseFloat(e.nominalValue)||0).toLocaleString(`es-AR`)}</td>
        <td class="amount">${n?(e.profit||0).toLocaleString(`es-AR`):`-`}</td>
      </tr>
      ${e.notes?`<tr><td colspan="8" style="font-size:10px; color:#777; border-top:none; padding-top:0;">📝 Nota: ${e.notes}</td></tr>`:``}
    `}).join(``),m=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${a||`Reporte de Cheques`}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: 900px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #5d5fef; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo { width: 150px; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: 24px; font-weight: 800; color: #5d5fef; margin: 0; }
        .receipt-info { text-align: right; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: 16px; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 8px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .totals { margin-top: 30px; border-top: 2px solid #5d5fef; padding-top: 15px; display: flex; justify-content: flex-end; gap: 40px; }
        .totals div { text-align: right; }
        .totals h4 { margin: 0 0 5px 0; color: #555; }
        .totals .value { font-size: 20px; font-weight: bold; }
        @media print {
          body { padding: 0; margin: 0; }
          .receipt-card { border: none; padding: 0; width: 100%; max-width: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="logo-area">
            <img src="/logo.jpg" class="logo" alt="Logo">
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">${a||`Reporte de Cheques`}</div>
            <div class="receipt-date">${u}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0 0 10px 0;">${o||`Filtro de Reporte`}</h3>
          ${o?``:`<p style="margin: 0;">Periodo: <strong>${c}</strong> al <strong>${l}</strong></p>`}
          <p style="${o?`margin: 0;`:`margin: 5px 0 0 0;`}">Total de Registros: <strong>${e.length}</strong></p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Banco / #</th>
              <th>F. Pago / Emisión</th>
              <th>Librador (CUIT)</th>
              <th>Origen / Destino</th>
              <th>Estado</th>
              <th class="amount">V. Nominal ($)</th>
              <th class="amount">Ganancia ($)</th>
            </tr>
          </thead>
          <tbody>
            ${p}
          </tbody>
        </table>

        <div class="totals">
          <div>
            <h4>Total Nominal</h4>
            <div class="value">$${d.toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          </div>
          <div>
            <h4>Total Ganancia Realizada</h4>
            <div class="value" style="color: #2e7d32;">$${f.toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          </div>
        </div>
        
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onfocus = function() { window.close(); }
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `;s.document.write(m),s.document.close()}function Ne(e,t,n=`Caja General`){let r=window.open(``,`_blank`,`width=800,height=900`),i=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recuento Auxiliar de Billetes</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #5d5fef; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo { width: 150px; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: 24px; font-weight: 800; color: #5d5fef; margin: 0; }
        .receipt-info { text-align: right; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: 14px; }
        .table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 10px 5px; border-bottom: 1px solid #eee; vertical-align: middle; }
        .table th.center { text-align: center; }
        .amount { text-align: right; white-space: nowrap; font-weight: 600; }
        .totals { margin-top: 30px; border-top: 2px dashed #5d5fef; padding-top: 15px; text-align: right; }
        .totals h4 { margin: 0 0 5px 0; color: #555; text-transform: uppercase; font-size: 12px; }
        .totals .value { font-size: 28px; font-weight: 800; color: #5d5fef; }
        .disclaimer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; font-style: italic; }
        @media print {
          body { padding: 0; margin: 0; }
          .receipt-card { border: none; padding: 0; width: 100%; max-width: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="logo-area">
            <img src="/logo.jpg" class="logo" alt="Logo">
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">Recuento Auxiliar</div>
            <div class="receipt-date">${new Date().toLocaleString(`es-AR`)}</div>
            <div style="font-size: 11px; color: #333; margin-top: 4px;">Módulo: ${n}</div>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Denominación</th>
              <th class="center">Bloques<br><small>(1000u)</small></th>
              <th class="center">Fajos<br><small>(100u)</small></th>
              <th class="center">Sueltos<br><small>(1u)</small></th>
              <th class="amount">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(e).sort((e,t)=>t-e).map(t=>{let n=e[t];return n.blocks===0&&n.batches===0&&n.qtys===0?``:`
      <tr>
        <td style="font-weight: 600;">$ ${parseInt(t).toLocaleString(`es-AR`)}</td>
        <td style="text-align: center;">${n.blocks>0?n.blocks:`-`}</td>
        <td style="text-align: center;">${n.batches>0?n.batches:`-`}</td>
        <td style="text-align: center;">${n.qtys>0?n.qtys:`-`}</td>
        <td class="amount">$ ${n.subtotal.toLocaleString(`es-AR`)}</td>
      </tr>
    `}).join(``)}
          </tbody>
        </table>

        <div class="totals">
          <h4>Total Contado</h4>
          <div class="value">$ ${t.toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        </div>
        
        <div class="disclaimer">
          Detalle impreso de recuento auxiliar de billetes físico. Documento sin validez fiscal originado de recuento de caja.
        </div>
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onfocus = function() { window.close(); }
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `;r.document.write(i),r.document.close()}function Pe(e){let{selectedItems:t,client:n,grandTotal:r,totalKg:i,byCategory:a}=e,o=window.open(``,`_blank`,`width=800,height=900`),s=new Date().toLocaleString(`es-AR`),c=t.map(e=>`
      <tr>
        <td>#${e.garron}</td>
        <td>${e.tropa}</td>
        <td>${e.standardizedCategory||e.category}</td>
        <td class="amount">${(e.kg||0).toFixed(1)} kg</td>
      </tr>
    `).join(``),l=Object.entries(a).map(([e,t])=>`
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
      <span>${e} (${t.kg.toFixed(1)} kg x $${t.price})</span>
      <span style="font-weight: bold;">$ ${t.subtotal.toLocaleString(`es-AR`)}</span>
    </div>
  `).join(``),u=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Despacho | Frigorífico Pampa</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo { width: 150px; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: 24px; font-weight: 800; color: #ef4444; margin: 0; }
        .receipt-info { text-align: right; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: 16px; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 8px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .totals { margin-top: 30px; border-top: 2px solid #ef4444; padding-top: 15px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .totals h4 { margin: 0 0 5px 0; color: #555; }
        .totals .value { font-size: 20px; font-weight: bold; color: #10b981; }
        .disclaimer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; border-top: 1px dashed #ccc; padding-top: 15px; }
        @media print {
          body { padding: 0; margin: 0; }
          .receipt-card { border: none; padding: 0; width: 100%; max-width: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="logo-area">
            <img src="/logo.jpg" class="logo" alt="Logo">
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">REMITO INFORMATIVO (Borrador)</div>
            <div class="receipt-date">${s}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
          <div>
            <h3 style="margin: 0 0 10px 0; color: #ef4444;">Destino / Cliente:</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${n?.name||`No especificado`}</p>
            ${n?.document?`<p style="margin: 3px 0 0 0; color: #555; font-size: 13px;">CUIT: ${n.document}</p>`:``}
            ${n?.address?`<p style="margin: 3px 0 0 0; color: #555; font-size: 13px;">Dirección: ${n.address}</p>`:``}
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;"><strong>${t.length}</strong> medias reses</p>
            <p style="margin: 5px 0 0 0;">Total Kg: <strong>${i.toFixed(1)} kg</strong></p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Garrón Nº</th>
              <th>Tropa Nº</th>
              <th>Categoría</th>
              <th class="amount">Peso (kg)</th>
            </tr>
          </thead>
          <tbody>
            ${c}
          </tbody>
        </table>

        <div class="totals" style="width: 100%; max-width: 350px; margin-left: auto;">
          <div style="width: 100%; text-align: left; margin-bottom: 10px;">
            <h4 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Detalle de Liquidación</h4>
            ${l}
          </div>
          <div style="width: 100%; display: flex; justify-content: space-between; border-top: 2px solid #ef4444; padding-top: 10px;">
            <h4 style="margin: 0;">TOTAL ESTIMADO:</h4>
            <div class="value">$ ${r.toLocaleString(`es-AR`)}</div>
          </div>
        </div>
        
        <div class="disclaimer">
          Documento no válido como factura. Remito informativo de despacho de carnes. Generado por Gestor KMP.
        </div>
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onfocus = function() { window.close(); }
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `;o.document.write(u),o.document.close()}function Fe(e,t,n,r,i){let a=window.open(``,`_blank`,`width=1000,height=900`),o=new Date().toLocaleString(`es-AR`),s=n?new Date(n).toLocaleString(`es-AR`):o,c=r.reduce((e,t)=>e+(parseFloat(t.nominalValue)||0),0),l=r.reduce((e,t)=>e+(parseFloat(t.buySide?.netAmount)||0),0),u=r.reduce((e,t)=>e+(parseFloat(t.sellSide?.netAmount)||0),0),d=u-l,f=r.map(e=>{let t=i.find(t=>t.id===e.buySide?.contactId)?.name||e.buySide?.contactId||`Desconocido`;return`
      <tr>
        <td>
          <div style="font-weight:600;">${e.bank||`-`}</div>
          <div style="font-size:11px; color:#666;">#${e.checkNumber||`-`}</div>
        </td>
        <td>
          <div>${e.dueDate?new Date(e.dueDate).toLocaleDateString(`es-AR`):`-`}</div>
          <div style="font-size:10px; color:#888;">Clear: ${e.clearing||0}d · Plazo: ${e.days||0}d</div>
        </td>
        <td>
          <div style="font-weight:600;">${e.issuerName||`-`}</div>
          <div style="font-size:10px; color:#666;">${e.issuerCuit||``}</div>
        </td>
        <td>
          <div style="font-size:11px;"><span style="color:#666;">De:</span> ${t}</div>
          <div style="font-size:10px; color:#888;">Tasa C: ${e.buySide?.monthlyInterest}% · P: ${e.buySide?.pesificacionRate}%</div>
        </td>
        <td class="amount">${(parseFloat(e.nominalValue)||0).toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td class="amount">${(parseFloat(e.sellSide?.netAmount)||0).toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td class="amount" style="color: #2e7d32; font-weight:600;">+${(parseFloat(e.profit)||0).toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      </tr>
      ${e.notes?`<tr><td colspan="7" style="font-size:10px; color:#777; border-top:none; padding-top:0;">📝 Nota: ${e.notes}</td></tr>`:``}
    `}).join(``),p=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Operación de Venta de Cheques</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: 900px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo { width: 150px; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; }
        .receipt-info { text-align: right; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: 16px; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 8px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .totals { margin-top: 30px; border-top: 2px solid #10b981; padding-top: 15px; display: flex; justify-content: flex-end; gap: 40px; }
        .totals div { text-align: right; }
        .totals h4 { margin: 0 0 5px 0; color: #555; }
        .totals .value { font-size: 18px; font-weight: bold; }
        @media print {
          body { padding: 0; margin: 0; }
          .receipt-card { border: none; padding: 0; width: 100%; max-width: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="logo-area">
            <img src="/logo.jpg" class="logo" alt="Logo">
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">Comprobante de Venta de Cheques</div>
            <div class="receipt-date">${e||`PROFORMA`}</div>
            <div style="font-size:11px; color:#555; margin-top:5px;">Fecha: ${s}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
          <div>
            <h3 style="margin: 0 0 5px 0;">Comprador / Destinatario:</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #10b981;">${t||`No especificado`}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;">Cantidad de Cheques: <strong>${r.length}</strong></p>
            <p style="margin: 5px 0 0 0;">Condiciones promedio: <strong>Tasa Venta: ${r[0]?.sellSide?.monthlyInterest||0}% · Pesif Venta: ${r[0]?.sellSide?.pesificacionRate||0}%</strong></p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Banco / #</th>
              <th>F. Pago / Plazo</th>
              <th>Librador (CUIT)</th>
              <th>Origen / Tasas C.</th>
              <th class="amount">V. Nominal ($)</th>
              <th class="amount">Neto Venta ($)</th>
              <th class="amount">Ganancia ($)</th>
            </tr>
          </thead>
          <tbody>
            ${f}
          </tbody>
        </table>

        <div class="totals">
          <div>
            <h4>Total Nominal</h4>
            <div class="value">$${c.toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          </div>
          <div>
            <h4>Neto Venta Recibido</h4>
            <div class="value" style="color: #10b981;">$${u.toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          </div>
          <div>
            <h4>Ganancia Realizada</h4>
            <div class="value" style="color: #2e7d32;">$${d.toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          </div>
        </div>
        
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onfocus = function() { window.close(); }
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `;a.document.write(p),a.document.close()}function Ie(e,t,n,r,i){if(!r||r.length===0)return;let a=r.map(e=>{let n=i.find(t=>t.id===e.buySide?.contactId)?.name||e.buySide?.contactId||`Desconocido`;return{Banco:e.bank||`-`,"# Cheque":e.checkNumber||`-`,Librador:e.issuerName||`-`,"CUIT Librador":e.issuerCuit||`-`,"F. Recepción":e.receptionDate?new Date(e.receptionDate).toLocaleDateString(`es-AR`):`-`,"F. Pago":e.dueDate?new Date(e.dueDate).toLocaleDateString(`es-AR`):`-`,Días:e.days||0,"Valor Nominal ($)":e.nominalValue||0,"Pesificación Venta (%)":e.sellSide?.pesificacionRate||0,"Interés Mensual Venta (%)":e.sellSide?.monthlyInterest||0,"Neto Compra ($)":e.buySide?.netAmount||0,"Neto Venta ($)":e.sellSide?.netAmount||0,"Ganancia Realizada ($)":e.profit||0,"Vendedor (Origen)":n,"Comprador (Destino)":t||`-`}}),o=M.json_to_sheet(a),s=M.book_new();M.book_append_sheet(s,o,`Venta Cheques`),o[`!cols`]=[{wch:18},{wch:12},{wch:18},{wch:15},{wch:12},{wch:12},{wch:8},{wch:15},{wch:15},{wch:18},{wch:15},{wch:15},{wch:18},{wch:18},{wch:18}],j(s,`Venta_Cheques_${e||`PROFORMA`}_${Date.now()}.xlsx`)}var Le=[2e4,1e4,2e3,1e3,500,200,100];function Re({onExport:e,onExcelExport:t}){let n=K(`div`,{classes:[`modal-overlay`]}),r=K(`div`,{classes:[`modal`]});r.innerHTML=`
    <h2>📄 Exportar Reporte PDF</h2>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">Selecciona el rango de viajes para incluir en el reporte.</p>
    
    <div class="form-group">
      <label>Criterio de Selección</label>
      <select id="export-type" class="form-input" style="width: 100%; border: 1px solid var(--border); padding: 0.75rem; border-radius: 12px; background: var(--bg-main); color: var(--text-main); margin-bottom: 1rem;">
        <option value="count">Últimos N Viajes</option>
        <option value="range">Rango de Fechas</option>
      </select>
    </div>

    <div id="export-count-section">
      <div class="form-group"><label>Cantidad de Viajes</label><input type="number" id="export-count" value="10" min="1" style="width: 100%;"></div>
    </div>

    <div id="export-range-section" style="display: none;">
      <div class="form-group"><label>Desde</label><input type="date" id="export-start" style="width: 100%;"></div>
      <div class="form-group"><label>Hasta</label><input type="date" id="export-end" style="width: 100%;"></div>
    </div>

    <div class="modal-actions">
      <button class="btn-outline" id="modal-cancel">Cancelar</button>
      <button class="btn-primary" id="modal-export" style="margin-top: 0; flex: 1; background: #841d1d;">PDF</button>
      <button class="btn-primary" id="modal-excel" style="margin-top: 0; flex: 1; background: #10b981;">Excel</button>
    </div>
  `,n.onclick=e=>{e.target===n&&n.remove()},n.appendChild(r),document.body.appendChild(n);let i=r.querySelector(`#export-type`),a=r.querySelector(`#export-count-section`),o=r.querySelector(`#export-range-section`);i.onchange=e=>{a.style.display=e.target.value===`count`?`block`:`none`,o.style.display=e.target.value===`range`?`block`:`none`},r.querySelector(`#modal-cancel`).onclick=()=>n.remove(),r.querySelector(`#modal-export`).onclick=()=>{let t=i.value;e({type:t,value:t===`count`?r.querySelector(`#export-count`).value:{start:r.querySelector(`#export-start`).value,end:r.querySelector(`#export-end`).value}}),n.remove()},r.querySelector(`#modal-excel`).onclick=()=>{let e=i.value;t({type:e,value:e===`count`?r.querySelector(`#export-count`).value:{start:r.querySelector(`#export-start`).value,end:r.querySelector(`#export-end`).value}}),n.remove()}}function ze({newCount:e,matchedCount:t,unmatchedCount:n,existCount:r,errorCount:i,errorMessages:a}){let o=K(`div`,{classes:[`modal-overlay`]}),s=K(`div`,{classes:[`modal`],style:`max-width: 600px; max-height: 80vh; overflow-y: auto;`}),c=a.length>0,l=`
    <h2 style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
      📂 Resultados del Escaneo
    </h2>
    <div style="background: var(--bg-hover); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
      <div style="color: #10b981; margin-bottom: 0.5rem; font-weight: 500;">✅ ${e} PDFs nuevos procesados exitosamente</div>
      <div style="color: #3b82f6; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem; padding-left: 1.5rem;">↳ ${t||0} emparejados a Viajes</div>
      <div style="color: #f59e0b; margin-bottom: 0.75rem; font-weight: 500; font-size: 0.9rem; padding-left: 1.5rem;">↳ ${n||0} guardados SIN Viaje (Huérfanas)</div>
      <div style="color: #60a5fa; margin-bottom: 0.5rem; font-weight: 500;">⏭️ ${r} PDFs ya existían (omitidos)</div>
      <div style="color: #ef4444; font-weight: 500;">❌ ${i} errores encontrados</div>
    </div>
  `;if(c){let e=a.join(`

`);l+=`
      <h3 style="margin-bottom: 0.5rem; color: var(--text-main); font-size: 1rem;">Detalle de Errores:</h3>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">
        Puedes seleccionar y copiar el texto a continuación si necesitas analizar los errores.
      </p>
      <textarea readonly style="
        width: 100%; 
        height: 150px; 
        background: var(--bg-main); 
        color: #ef4444; 
        border: 1px solid var(--border); 
        border-radius: 8px; 
        padding: 0.75rem; 
        font-family: monospace; 
        font-size: 0.85rem;
        resize: vertical;
      ">${e}</textarea>
    `}l+=`
    <div class="modal-actions" style="margin-top: 1.5rem;">
      <button class="btn-primary" id="modal-close" style="width: 100%;">Aceptar</button>
    </div>
  `,s.innerHTML=l,o.onclick=e=>{e.target===o&&o.remove()},o.appendChild(s),document.body.appendChild(o),s.querySelector(`#modal-close`).onclick=()=>o.remove()}function Be(e){let{title:t=`Seleccionar Fechas`,description:n=``,submitText:r=`Aceptar`,onSubmit:i,single:a=!1,value:o=``}=e,s=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;`}),c=K(`div`,{classes:[`modal`,`glass-card`],style:`max-width: 400px; padding: 2rem;`}),l=new Date().toISOString().split(`T`)[0],u=new Date;u.setDate(1);let d=u.toISOString().split(`T`)[0];a?c.innerHTML=`
      <h3 style="margin-bottom: 1.5rem; color: var(--text-main); font-weight: 700;">${t}</h3>
      <form id="date-modal-form">
        ${n?`<p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">${n}</p>`:``}
        <div class="form-group">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Fecha</label>
          <input type="date" id="modal-date" class="form-input" value="${o||l}" required style="width: 100%; padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600;">
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button type="button" class="btn-cancel" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-main); cursor: pointer;">Cancelar</button>
          <button type="submit" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: none; background: var(--primary); color: var(--on-primary); font-weight: 600; cursor: pointer;">${r}</button>
        </div>
      </form>
    `:c.innerHTML=`
      <h3 style="margin-bottom: 1.5rem; color: var(--text-main); font-weight: 700;">${t}</h3>
      <form id="date-modal-form">
        ${n?`<p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">${n}</p>`:``}
        <div class="form-group">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Desde</label>
          <input type="date" id="modal-from" class="form-input" value="${o?.start||d}" required style="width: 100%; padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600;">
        </div>
        <div class="form-group">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Hasta</label>
          <input type="date" id="modal-to" class="form-input" value="${o?.end||l}" required style="width: 100%; padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600;">
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button type="button" class="btn-cancel" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-main); cursor: pointer;">Cancelar</button>
          <button type="submit" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: none; background: var(--primary); color: var(--on-primary); font-weight: 600; cursor: pointer;">${r}</button>
        </div>
      </form>
    `,s.appendChild(c),document.body.appendChild(s);let f=c.querySelector(`#date-modal-form`);f.onsubmit=e=>{if(e.preventDefault(),a){let e=c.querySelector(`#modal-date`).value;i&&i(e)}else{let e=c.querySelector(`#modal-from`).value,t=c.querySelector(`#modal-to`).value;i&&i(e,t)}s.remove()},c.querySelector(`.btn-cancel`).onclick=()=>s.remove()}function Ve(e=`Caja General`){let t=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;`}),n=K(`div`,{classes:[`glass-card`],style:`width: 100%; max-width: 600px; padding: 1.5rem 1.25rem; display: flex; flex-direction: column; max-height: 95vh; box-sizing: border-box;`});n.innerHTML=`
    <style>
      .calc-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        overflow-y: auto;
        padding-right: 0.25rem;
        flex: 1;
        min-height: 150px;
      }
      .denom-row {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 12px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border);
        transition: border-color 0.2s;
        box-sizing: border-box;
      }
      .denom-row:focus-within {
        border-color: var(--primary);
      }
      .denom-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .denom-label {
        font-weight: 700;
        font-size: 1.05rem;
        color: var(--text-main);
      }
      .denom-total {
        font-weight: 700;
        font-size: 1.05rem;
        color: #10b981;
        font-family: monospace;
      }
      .denom-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.5rem;
      }
      .input-col {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .input-col label {
        font-size: 0.7rem;
        color: var(--text-muted);
        text-align: center;
        font-weight: 600;
      }
      .input-col input {
        padding: 0.4rem;
        border-radius: 8px;
        text-align: center;
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--border);
        color: var(--text-main);
        font-size: 0.9rem;
        width: 100%;
        box-sizing: border-box;
      }
      .calc-header-desktop {
        display: none;
      }
      .calc-sign {
        display: none;
      }
      
      @media (min-width: 576px) {
        .calc-container {
          max-height: 50vh;
        }
        .denom-row {
          display: grid;
          grid-template-columns: 80px 20px 80px 20px 80px 20px 80px 30px 1fr;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.5rem;
          border-radius: 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .denom-row:focus-within {
          border-color: transparent;
        }
        .denom-header {
          display: contents;
        }
        .denom-label {
          font-size: 0.95rem;
        }
        .denom-total {
          grid-column: 9;
          text-align: right;
          font-size: 1rem;
        }
        .denom-inputs {
          display: contents;
        }
        .input-col {
          display: contents;
        }
        .input-col label {
          display: none;
        }
        .input-col input {
          text-align: right;
          padding: 0.5rem;
        }
        .calc-sign {
          display: block;
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .calc-header-desktop {
          display: grid;
          grid-template-columns: 80px 20px 80px 20px 80px 20px 80px 30px 1fr;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          padding: 0 0.5rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }
      }
    </style>

    <h3 style="margin-top:0; margin-bottom: 1rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
      🧮 Calculadora Auxiliar
    </h3>
    
    <div class="calc-header-desktop">
      <div>Valor</div>
      <div></div>
      <div style="text-align: center;">Bloques <small>(1000u)</small></div>
      <div></div>
      <div style="text-align: center;">Fajos <small>(100u)</small></div>
      <div></div>
      <div style="text-align: center;">Sueltos <small>(1u)</small></div>
      <div></div>
      <div style="text-align: right;">Subtotal</div>
    </div>
    
    <div class="calc-container" id="aux-calc-rows">
      ${Le.map(e=>`
        <div class="denom-row" data-denom="${e}">
          <div class="denom-header">
            <span class="denom-label">$ ${e.toLocaleString()}</span>
            <span class="row-total denom-total">$ 0</span>
          </div>
          
          <div class="denom-inputs">
            <div class="calc-sign">×</div>
            <div class="input-col">
              <label>Bloques (1000u)</label>
              <input type="number" class="bill-block" data-denom="${e}" placeholder="0" min="0">
            </div>
            
            <div class="calc-sign">+</div>
            <div class="input-col">
              <label>Fajos (100u)</label>
              <input type="number" class="bill-batch" data-denom="${e}" placeholder="0" min="0">
            </div>
            
            <div class="calc-sign">+</div>
            <div class="input-col">
              <label>Sueltos (1u)</label>
              <input type="number" class="bill-qty" data-denom="${e}" placeholder="0" min="0">
            </div>
            <div class="calc-sign">=</div>
          </div>
        </div>
      `).join(``)}
    </div>
    
    <div style="background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 12px; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 500; font-size: 1.05rem;">Total Contado:</span>
      <span id="aux-grand-total" style="font-size: 1.6rem; font-weight: 800; color: var(--primary);">$ 0</span>
    </div>
    
    <div style="display: flex; gap: 0.75rem;">
      <button id="aux-calc-close" class="btn-cancel" style="flex: 1; padding: 0.75rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 0.95rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cerrar</button>
      <button id="aux-calc-clear" class="btn-secondary" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-size: 0.95rem; font-weight: 600; cursor: pointer;">🗑️ Limpiar</button>
      <button id="aux-calc-print" class="btn-primary" style="flex: 2; padding: 0.75rem; border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer;">🖨️ Imprimir</button>
    </div>
  `,t.appendChild(n),document.body.appendChild(t);let r=n.querySelectorAll(`.denom-row`),i=n.querySelector(`#aux-grand-total`),a=n.querySelectorAll(`.bill-block, .bill-batch, .bill-qty`),o=()=>{let e=0,t={};return r.forEach(n=>{let r=n.querySelector(`.bill-block`),i=n.querySelector(`.bill-batch`),a=n.querySelector(`.bill-qty`),o=parseInt(r.dataset.denom),s=parseInt(r.value)||0,c=parseInt(i.value)||0,l=parseInt(a.value)||0,u=(s*1e3+c*100+l)*o;e+=u,n.querySelector(`.row-total`).textContent=`$ `+u.toLocaleString(`es-AR`),t[o]={blocks:s,batches:c,qtys:l,subtotal:u}}),i.textContent=`$ `+e.toLocaleString(`es-AR`),{grand:e,breakdown:t}};a.forEach(e=>e.addEventListener(`input`,o)),n.querySelector(`#aux-calc-close`).onclick=()=>t.remove(),n.querySelector(`#aux-calc-clear`).onclick=()=>{a.forEach(e=>e.value=``),o()},n.querySelector(`#aux-calc-print`).onclick=()=>{let{grand:t,breakdown:n}=o();if(t===0){alert(`La calculadora está en cero. Añade billetes primero.`);return}Ne(n,t,e)}}function He(e,t){let n=document.getElementById(`travel-modal-container`)||(()=>{let e=K(`div`,{attrs:{id:`travel-modal-container`}});return document.body.appendChild(e),e})(),r=!!e,i=t.trucks||[],a=t.producers||[],o=t.agents||[],s=0,c=e?.date||new Date().toISOString().split(`T`)[0],l=e?.status||`DRAFT`,u=String(l).toUpperCase();u===`BORRADOR`&&(u=`DRAFT`),u===`ACTIVO`&&(u=`ACTIVE`),u===`FINALIZADO`&&(u=`COMPLETED`);let d=e?.description||``,f=e?.truck?.id||``,p=Number(e?.kmOnOrigin||0),m=Number(e?.kmOnDestination||0),h=Number(e?.kmOnPump||0),g=Number(e?.litersOnPump||0),_=e?.tropa||``,v=[...e?.expenses?Array.isArray(e.expenses)?e.expenses:Object.values(e.expenses):[]],y;y=e?.buy?{id:e.buy.id||``,agent:e.buy.agent?{id:e.buy.agent.id||``,name:e.buy.agent.name||``,percent:Number(e.buy.agent.percent)||0}:{name:``,percent:0},reduce:e.buy.reduce||0,totalReduce:e.buy.totalReduce||e.buy.reduce||0,listOfProducers:(e.buy.listOfProducers||[]).map(e=>({producer:e.producer?{id:e.producer.id||``,name:e.producer.name||``,cuit:e.producer.cuit||``,cbu:e.producer.cbu||``}:{name:``,cuit:``,cbu:``},origin:e.origin||``,manualIva:e.manualIva===void 0?null:e.manualIva,listOfProducts:(e.listOfProducts||[]).map(e=>({name:e.name||``,kg:Number(e.kg||0),roughing:Number(e.roughing||0),price:Number(e.price||0),quantity:Number(e.quantity||0),kgFaena:Number(e.kgFaena||0),taxes:e.taxes||{bill:{neto:0,iva:0,ganancias:0}}}))}))}:{agent:{name:``,percent:0},reduce:0,totalReduce:0,listOfProducers:[]},y.reduce=y.totalReduce||y.reduce||0,y.totalReduce=y.reduce;let b=()=>{let l=i.find(e=>String(e.id)===String(f)),x=new Te({agent:y.agent,totalReduce:y.totalReduce,reduce:y.totalReduce,listOfProducers:y.listOfProducers}),S=l?.trailer?.type===`DOUBLE`,C=Math.max(0,m-p),w=C*(S?e?.driverPricePerKmDouble||45:e?.driverPricePerKmSimple||30),T=e?.fuelPrice||1100,E=g*T,D=C*(S?e?.simulationFreightPriceDouble||900:e?.simulationFreightPriceSimple||650),O=v.reduce((e,t)=>e+Number(t.amount),0),k=i.map(e=>`<option value="${e.id}" ${String(f)===String(e.id)?`selected`:``}>${e.name}</option>`).join(``),A=`<option value="">-- Sin Agente / Comisión --</option>`+o.map(e=>`<option value="${e.id}" ${String(y.agent?.id||y.agent?.name)===String(e.id||e.name)?`selected`:``}>${e.name} (${e.percent}%)</option>`).join(``),j=`<option value="" disabled selected>-- Agregar Productor --</option>`+a.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``);n.innerHTML=`
      <div class="modal-overlay" style="position: fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1.5rem;">
        <div class="glass-card fade-in" id="travel-modal" style="max-width: 900px; width: 100%; max-height: 92vh; overflow-y: auto; border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0; display: flex; flex-direction: column;">
          
          <!-- Header Bar -->
          <div style="padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border-top-left-radius: 24px; border-top-right-radius: 24px;">
            <h3 style="margin: 0; color: var(--primary); font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.65rem;">
              <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>
              ${r?`Editar Viaje Operacional`:`Nuevo Viaje Operacional`}
            </h3>
            <kmp-status-chip status="${u}"></kmp-status-chip>
          </div>

          <!-- Modern Compose-like Tab Bar -->
          <div style="display: flex; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.01); user-select: none;">
            <button type="button" class="tab-item-m3 ${s===0?`active`:``}" data-tab="0" style="flex: 1; padding: 1.15rem 1rem; font-weight: 700; font-size: 0.85rem; border: none; background: transparent; color: ${s===0?`var(--primary)`:`var(--text-muted)`}; border-bottom: ${s===0?`3px solid var(--primary)`:`3px solid transparent`}; cursor: pointer; transition: all 0.2s ease;">
              🚚 Logística
            </button>
            <button type="button" class="tab-item-m3 ${s===1?`active`:``}" data-tab="1" style="flex: 1; padding: 1.15rem 1rem; font-weight: 700; font-size: 0.85rem; border: none; background: transparent; color: ${s===1?`var(--primary)`:`var(--text-muted)`}; border-bottom: ${s===1?`3px solid var(--primary)`:`3px solid transparent`}; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
              🥩 Cargas (${x.listOfProducers.length})
            </button>
            <button type="button" class="tab-item-m3 ${s===2?`active`:``}" data-tab="2" style="flex: 1; padding: 1.15rem 1rem; font-weight: 700; font-size: 0.85rem; border: none; background: transparent; color: ${s===2?`var(--primary)`:`var(--text-muted)`}; border-bottom: ${s===2?`3px solid var(--primary)`:`3px solid transparent`}; cursor: pointer; transition: all 0.2s ease;">
              💸 Finanzas y Gastos
            </button>
            <button type="button" class="tab-item-m3 ${s===3?`active`:``}" data-tab="3" style="flex: 1; padding: 1.15rem 1rem; font-weight: 700; font-size: 0.85rem; border: none; background: transparent; color: ${s===3?`var(--primary)`:`var(--text-muted)`}; border-bottom: ${s===3?`3px solid var(--primary)`:`3px solid transparent`}; cursor: pointer; transition: all 0.2s ease;">
              📈 Rentabilidad
            </button>
          </div>

          <!-- Main Scrollable Content Panel -->
          <div id="tab-content-panel" style="padding: 2rem; overflow-y: auto; flex: 1; min-height: 400px; max-height: 60vh;">
            <!-- Tab contents will render dynamically here -->
          </div>

          <!-- Sticky Modal Footer Actions -->
          <div style="padding: 1.25rem 2rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem; background: rgba(255,255,255,0.01); border-bottom-left-radius: 24px; border-bottom-right-radius: 24px;">
            <button type="button" class="btn-outline" id="btn-cancel-tmodal" style="padding: 0.65rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; margin: 0;">Cancelar</button>
            <button type="button" class="btn-primary" id="btn-save-tmodal" style="padding: 0.65rem 1.75rem; display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; font-weight: 750; margin: 0;">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" /></svg>
              Guardar Viaje
            </button>
          </div>

        </div>
      </div>
    `;let M=n.querySelector(`#tab-content-panel`);if(s===0){M.innerHTML=`
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">📅 Fecha de Viaje</label>
              <div style="display: flex; gap: 0.4rem; align-items: center; width: 100%;">
                <input type="text" id="t-date" value="${c}" readonly style="flex: 1; padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem; cursor: pointer;">
                <button type="button" id="btn-t-date-picker" title="Seleccionar Fecha" style="padding: 0 0.85rem; height: 38px; border-radius: 10px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.35); color: var(--primary); cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; margin: 0;">📅</button>
              </div>
            </div>
            <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">📌 Estado</label>
              <select id="t-status" style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem;">
                <option value="DRAFT" ${u===`DRAFT`?`selected`:``}>Borrador</option>
                <option value="ACTIVE" ${u===`ACTIVE`?`selected`:``}>Activo</option>
                <option value="COMPLETED" ${u===`COMPLETED`?`selected`:``}>Completado</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">📝 Descripción / Destino</label>
            <input type="text" id="t-desc" value="${d}" placeholder="Ej. Remisión Vacunos Liniers..." style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.85rem;">
          </div>

          <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">🚛 Camión Asignado</label>
              <select id="t-truck" required style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem; width: 100%;">
                <option value="">-- Seleccionar Camión --</option>
                ${k}
              </select>
            </div>
            <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">🔢 Número de Tropa / Remito</label>
              <input type="text" id="t-tropa" value="${_}" placeholder="Ej. Tropa 4028..." style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.85rem; width: 100%;">
            </div>
          </div>

          <!-- Odómetro panel card -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem;">
            <h4 style="margin: 0 0 1.25rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
              🛣️ Odómetro de Ruta
            </h4>
            <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Km Salida (Origen)</label>
                <input type="number" id="t-km-o" step="0.1" value="${p}" required style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              </div>
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Km Retorno (Destino)</label>
                <input type="number" id="t-km-d" step="0.1" value="${m}" required style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              </div>
            </div>
            <div style="margin-top: 1.25rem; padding: 0.75rem 1.25rem; background: var(--primary-container); border-radius: 12px; color: var(--on-primary-container); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 600;">Distancia Total Calculada:</span>
              <strong style="font-size: 1.2rem; font-weight: 850;">${C} km</strong>
            </div>
          </div>

          <!-- Combustible panel card -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem;">
            <h4 style="margin: 0 0 1.25rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
              ⛽ Consumo de Combustible
            </h4>
            <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Odo. en Surtidor (Km)</label>
                <input type="number" id="t-km-p" step="0.1" value="${h}" style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              </div>
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Litros Abastecidos</label>
                <input type="number" id="t-liters" step="0.1" value="${g}" style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              </div>
            </div>
          </div>

        </div>
      `;let e=M.querySelector(`#t-date`),t=M.querySelector(`#btn-t-date-picker`),r=M.querySelector(`#t-status`),i=M.querySelector(`#t-desc`),a=M.querySelector(`#t-truck`),o=M.querySelector(`#t-tropa`),s=M.querySelector(`#t-km-o`),l=M.querySelector(`#t-km-d`),v=M.querySelector(`#t-km-p`),y=M.querySelector(`#t-liters`),b=()=>{Be({title:`📅 Seleccionar Fecha de Viaje`,description:`Selecciona la fecha para este viaje operativo.`,submitText:`Aceptar`,single:!0,value:c,onSubmit:t=>{c=t,e.value=c}})};e.onclick=b,t.onclick=b,t.addEventListener(`mouseenter`,()=>{t.style.transform=`scale(1.05)`,t.style.background=`rgba(99,102,241,0.25)`}),t.addEventListener(`mouseleave`,()=>{t.style.transform=`scale(1)`,t.style.background=`rgba(99,102,241,0.15)`}),r.onchange=e=>{u=e.target.value;let t=n.querySelector(`kmp-status-chip`);t&&t.setAttribute(`status`,u)},i.oninput=e=>{d=e.target.value},a.onchange=e=>{f=e.target.value},o&&(o.oninput=e=>{_=e.target.value}),s.oninput=e=>{p=Number(e.target.value),M.querySelector(`strong`).textContent=Math.max(0,m-p)+` km`},l.oninput=e=>{m=Number(e.target.value),M.querySelector(`strong`).textContent=Math.max(0,m-p)+` km`},v.oninput=e=>{h=Number(e.target.value)},y.oninput=e=>{g=Number(e.target.value)}}else if(s===1)M.innerHTML=`
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; flex-wrap: wrap;">
            <div>
              <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #ffffff;">🥩 Productores y Cargas</h4>
              <p style="margin: 0.15rem 0 0 0; color: var(--text-muted); font-size: 0.78rem;">Asocia múltiples productores al viaje y detalla sus lotes comerciales.</p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 250px;">
              <select id="select-add-producer" class="form-input" style="padding: 0.55rem; font-size: 0.8rem; font-weight: 600; border-radius: 10px; flex: 1; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);">
                ${j}
              </select>
            </div>
          </div>

          <div id="assoc-producers-container" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Render list of associated producers -->
            ${x.listOfProducers.map((e,t)=>{let n=e.producer.name,r=e.producer.cuit,i=e.producer.cbu,a=e.manualIva!==null;return`
                <div class="producer-form-card" data-idx="${t}" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
                  
                  <!-- Producer Card Header -->
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.75rem; gap: 1rem; flex-wrap: wrap;">
                    <div>
                      <h5 style="margin:0; font-size: 1rem; font-weight: 750; color: var(--primary);">👤 ${n}</h5>
                      <span style="font-size:0.75rem; color: var(--text-muted); font-weight: 600;">CUIT: ${r} &bull; CBU: ${i}</span>
                    </div>
                    <button type="button" class="btn-remove-producer btn-icon" data-idx="${t}" style="padding: 0.4rem 0.8rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; border-radius: 8px; font-weight: 700; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; margin: 0;">
                      <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                      Quitar Productor
                    </button>
                  </div>

                  <!-- Origin & Manual IVA Row -->
                  <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.25rem; align-items: center;">
                    <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                      <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">📍 Localidad de Origen</label>
                      <input type="text" class="producer-origin" data-idx="${t}" value="${e.origin||``}" placeholder="Ej. Liniers, San Justo..." style="padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.82rem;">
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.12); padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem;">
                      <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; cursor: pointer; font-weight: 600; color: #ffffff; margin: 0; user-select: none;">
                        <input type="checkbox" class="toggle-p-manual-iva" data-idx="${t}" ${a?`checked`:``}>
                        IVA Manual
                      </label>
                      <input type="number" class="p-manual-iva-val" data-idx="${t}" value="${a?e.manualIva:``}" placeholder="IVA $" style="width: 100px; padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right; visibility: ${a?`visible`:`hidden`};">
                    </div>
                  </div>

                  <!-- Products (Cattle Lots) Sub-table -->
                  <div style="background: rgba(0,0,0,0.12); padding: 1rem; border-radius: 16px; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                      <strong style="font-size: 0.82rem; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">🥩 Lotes de Hacienda</strong>
                      <button type="button" class="btn-add-lot" data-idx="${t}" style="padding: 0.35rem 0.75rem; font-size: 0.72rem; font-weight: 700; background: var(--primary); color: var(--on-primary); border: none; border-radius: 6px; cursor: pointer; margin: 0;">
                        + Agregar Lote
                      </button>
                    </div>

                    <div style="overflow-x: auto;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; min-width: 600px;">
                        <thead>
                          <tr style="border-bottom: 1.5px solid var(--border); color: var(--text-muted); text-align: left; font-weight: 700; font-size: 0.75rem;">
                            <th style="padding: 0.5rem 0.25rem;">Categoría</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: center; width: 70px;">Cant.</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: right; width: 90px;">Kg Vivo</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: center; width: 75px;">Desb. %</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: right; width: 90px;">Kg Limpio</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: right; width: 100px;">$ / Kg</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: right; width: 100px;">Operación</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: center; width: 40px;"></th>
                          </tr>
                        </thead>
                        <tbody>
                          ${e.listOfProducts.map((e,n)=>`
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                              <td style="padding: 0.5rem 0.25rem;">
                                <input type="text" class="lot-name" data-pidx="${t}" data-lidx="${n}" value="${e.name}" placeholder="Novillo..." required style="width: 100%; padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: center;">
                                <input type="number" class="lot-quantity" data-pidx="${t}" data-lidx="${n}" value="${e.quantity}" min="1" required style="width: 60px; padding: 0.35rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; text-align: center;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: right;">
                                <input type="number" class="lot-kg" data-pidx="${t}" data-lidx="${n}" value="${e.kg}" min="1" required style="width: 80px; padding: 0.35rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: center;">
                                <input type="number" step="0.1" class="lot-roughing" data-pidx="${t}" data-lidx="${n}" value="${e.roughing}" style="width: 65px; padding: 0.35rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; text-align: center;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: right; font-family: monospace; color: #34d399; font-weight: 700;">
                                ${e.kgClean.toFixed(0).toLocaleString()} kg
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: right;">
                                <input type="number" step="0.01" class="lot-price" data-pidx="${t}" data-lidx="${n}" value="${e.price}" min="0" required style="width: 90px; padding: 0.35rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 750; text-align: right;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: right; font-family: monospace; color: #ffffff; font-weight: 700;">
                                $${e.operation.toLocaleString()}
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: center;">
                                <button type="button" class="btn-delete-lot btn-icon" data-pidx="${t}" data-lidx="${n}" style="color: #f87171; background: transparent; border: none; cursor: pointer; padding: 0.25rem;">
                                  <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                                </button>
                              </td>
                            </tr>
                          `).join(``)}
                          ${e.listOfProducts.length===0?`<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1rem 0;">No hay lotes de hacienda cargados para este productor.</td></tr>`:``}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Producer Total Mini-Dashboard Info -->
                  <div style="display: flex; gap: 1rem; justify-content: flex-end; align-items: center; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 0.75rem;">
                    <span>Total Cabezas: <strong style="color: #ffffff;">${e.totalQuantity}</strong></span>
                    <span>Total Kg Limpio: <strong style="color: #ffffff;">${e.totalKgClean.toFixed(0).toLocaleString()} kg</strong></span>
                    <span>Liquidación Bruta: <strong style="color: #34d399;">$${e.totalOperation.toLocaleString()}</strong></span>
                  </div>

                </div>
              `}).join(``)}
            ${x.listOfProducers.length===0?`
              <div style="text-align: center; padding: 3rem 1.5rem; border: 1.5px dashed var(--border); border-radius: 20px; color: var(--text-muted);">
                <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🥩</span>
                <strong style="font-size: 0.95rem; color: #ffffff; display: block; margin-bottom: 0.25rem;">Sin Productores Asociados</strong>
                <span>Selecciona un productor de la lista superior para comenzar a armar el viaje.</span>
              </div>
            `:``}
          </div>

        </div>
      `,M.querySelector(`#select-add-producer`).onchange=e=>{let t=e.target.value,n=a.find(e=>String(e.id)===String(t));n&&(y.listOfProducers.push({producer:{id:n.id,name:n.name,cuit:n.cuit,cbu:n.cbu},origin:``,manualIva:null,listOfProducts:[]}),b())},M.querySelectorAll(`.btn-remove-producer`).forEach(e=>{e.onclick=e=>{let t=parseInt(e.currentTarget.dataset.idx);y.listOfProducers.splice(t,1),b()}}),M.querySelectorAll(`.producer-origin`).forEach(e=>{e.oninput=e=>{let t=parseInt(e.target.dataset.idx);y.listOfProducers[t].origin=e.target.value}}),M.querySelectorAll(`.toggle-p-manual-iva`).forEach(e=>{e.onchange=e=>{let t=parseInt(e.target.dataset.idx),n=M.querySelector(`.p-manual-iva-val[data-idx="${t}"]`);e.target.checked?(y.listOfProducers[t].manualIva=0,n.style.visibility=`visible`,n.value=`0`):(y.listOfProducers[t].manualIva=null,n.style.visibility=`hidden`,n.value=``),b()}}),M.querySelectorAll(`.p-manual-iva-val`).forEach(e=>{e.oninput=e=>{let t=parseInt(e.target.dataset.idx);y.listOfProducers[t].manualIva=Number(e.target.value)||0},e.onblur=()=>{b()}}),M.querySelectorAll(`.btn-add-lot`).forEach(e=>{e.onclick=e=>{let t=parseInt(e.target.dataset.idx);y.listOfProducers[t].listOfProducts.push({name:`Novillo`,quantity:1,kg:400,roughing:8,price:2200,kgFaena:0}),b()}}),M.querySelectorAll(`.btn-delete-lot`).forEach(e=>{e.onclick=e=>{let t=parseInt(e.currentTarget.dataset.pidx),n=parseInt(e.currentTarget.dataset.lidx);y.listOfProducers[t].listOfProducts.splice(n,1),b()}}),M.querySelectorAll(`.lot-name`).forEach(e=>{e.oninput=e=>{let t=parseInt(e.target.dataset.pidx),n=parseInt(e.target.dataset.lidx);y.listOfProducers[t].listOfProducts[n].name=e.target.value}}),M.querySelectorAll(`.lot-quantity`).forEach(e=>{e.oninput=e=>{let t=parseInt(e.target.dataset.pidx),n=parseInt(e.target.dataset.lidx);y.listOfProducers[t].listOfProducts[n].quantity=Number(e.target.value)||0},e.onblur=()=>b()}),M.querySelectorAll(`.lot-kg`).forEach(e=>{e.oninput=e=>{let t=parseInt(e.target.dataset.pidx),n=parseInt(e.target.dataset.lidx);y.listOfProducers[t].listOfProducts[n].kg=Number(e.target.value)||0},e.onblur=()=>b()}),M.querySelectorAll(`.lot-roughing`).forEach(e=>{e.oninput=e=>{let t=parseInt(e.target.dataset.pidx),n=parseInt(e.target.dataset.lidx);y.listOfProducers[t].listOfProducts[n].roughing=Number(e.target.value)||0},e.onblur=()=>b()}),M.querySelectorAll(`.lot-price`).forEach(e=>{e.oninput=e=>{let t=parseInt(e.target.dataset.pidx),n=parseInt(e.target.dataset.lidx);y.listOfProducers[t].listOfProducts[n].price=Number(e.target.value)||0},e.onblur=()=>b()});else if(s===2)M.innerHTML=`
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Agente y Achique Global Panel -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
            <h4 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px;">
              👤 Intermediación y Descuento
            </h4>

            <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Agente (Comisionista)</label>
                <select id="t-agent" style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem;">
                  ${A}
                </select>
              </div>

              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Descuento Global / Achique Total ($)</label>
                <input type="number" id="t-reduce" value="${y.totalReduce}" style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 750; text-align: right;">
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; font-size: 0.85rem; font-weight: 700;">
              <span style="color: var(--text-muted);">Comisión Agente Consolidada:</span>
              <strong style="color: var(--primary); font-size: 1.05rem;">$${x.agentCommissionAmount.toLocaleString()}</strong>
            </div>
          </div>

          <!-- Gastos Adicionales panel card -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem;">
            <h4 style="margin: 0 0 1.25rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
              💸 Gastos Varios y Viáticos del Chofer
            </h4>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; max-height: 180px; overflow-y: auto; padding-right: 0.25rem;">
              ${v.map((e,t)=>`
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border);">
                  <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: #ffffff;">${e.description}</span>
                    <span style="font-size: 0.7rem; font-weight: 600; color: ${e.isReimbursable?`#34d399`:`var(--text-muted)`};">${e.isReimbursable?`♻️ A Reembolsar`:`❌ No Reembolsable`}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <strong style="font-size: 0.95rem; font-family: monospace; color: var(--text-main);">$${e.amount.toLocaleString()}</strong>
                    <button type="button" class="btn-delete-exp btn-icon" data-idx="${t}" style="color: #f87171; background: transparent; border: none; cursor: pointer; padding: 0.25rem; display: flex; align-items: center; justify-content: center; margin: 0;">
                      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                    </button>
                  </div>
                </div>
              `).join(``)}
              ${v.length===0?`<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem; border: 1px dashed var(--border); border-radius: 12px;">Sin viáticos o gastos adicionales registrados en este viaje.</div>`:``}
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; background: rgba(0,0,0,0.12); padding: 0.75rem; border-radius: 14px; border: 1px solid var(--border);">
              <input type="text" id="e-desc" placeholder="Descripción Gasto" style="flex: 2.2; padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); font-size: 0.82rem; background: var(--bg-main); color: var(--text-main); font-weight: 600;">
              <input type="number" id="e-amount" placeholder="Monto ($)" style="flex: 1.1; padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); font-size: 0.82rem; background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              
              <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; cursor: pointer; color: var(--text-muted); font-weight: 700; padding: 0.25rem 0.5rem; user-select: none;">
                <input type="checkbox" id="e-reimb" checked style="cursor: pointer;"> Reemb.
              </label>
              
              <button type="button" id="btn-add-exp" style="padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 800; background: var(--primary); color: var(--on-primary); border: none; cursor: pointer; transition: all 0.2s ease; margin: 0;">+</button>
            </div>
          </div>

        </div>
      `,M.querySelector(`#t-agent`).onchange=e=>{let t=e.target.value,n=o.find(e=>String(e.id)===String(t));n?y.agent={id:n.id,name:n.name,percent:n.percent}:y.agent={name:``,percent:0},b()},M.querySelector(`#t-reduce`).oninput=e=>{y.totalReduce=Number(e.target.value)||0,y.reduce=y.totalReduce},M.querySelector(`#t-reduce`).onblur=()=>{b()},M.querySelector(`#btn-add-exp`).onclick=()=>{let t=M.querySelector(`#e-desc`).value,n=Number(M.querySelector(`#e-amount`).value),r=M.querySelector(`#e-reimb`).checked;t&&n>0&&(v.push({id:Date.now(),travelId:e?.id||0,description:t,amount:n,category:`OTROS`,date:c,isReimbursable:r}),b())},M.querySelectorAll(`.btn-delete-exp`).forEach(e=>{e.onclick=e=>{let t=parseInt(e.currentTarget.dataset.idx);v.splice(t,1),b()}});else if(s===3){let e=x.totalOperation,t=x.totalOperationWithCommission,n=x.totalKgClean,r=n>0?t/n:0,i=x.generalYield*100,a=e-w-E-O,o=e>0?a/e*100:0,s=g>0&&C>0?(C/g).toFixed(2):`N/A`;M.innerHTML=`
        <div style="display: flex; flex-direction: column; gap: 1.75rem;">
          
          <!-- Profitability Banner -->
          <div style="background: ${a>=0?`rgba(16, 185, 129, 0.06)`:`rgba(239, 68, 68, 0.06)`}; border: 1.5px solid ${a>=0?`#10b981`:`#ef4444`}; border-radius: 20px; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">Retorno Neto Estimado (Margen Operativo)</span>
              <h3 style="margin: 0.25rem 0 0 0; font-size: 1.85rem; font-weight: 900; color: ${a>=0?`#34d399`:`#f87171`};">$${a.toLocaleString()}</h3>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">Margen de Ganancia</span>
              <h4 style="margin: 0.25rem 0 0 0; font-size: 1.4rem; font-weight: 850; color: ${a>=0?`#34d399`:`#f87171`};">${o.toFixed(1)}%</h4>
            </div>
          </div>

          <!-- Metrics Grid Dashboard -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
            
            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">🛣️ Distancia de Ruta</span>
              <strong style="font-size: 1.35rem; color: #ffffff; font-weight: 850;">${C} km</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">Patente: ${l?.licensePlate||`N/A`}</div>
            </div>

            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">⛽ Eficiencia de Consumo</span>
              <strong style="font-size: 1.35rem; color: #3b82f6; font-weight: 850;">${s} ${s===`N/A`?``:`km/l`}</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">Litros: ${g} L</div>
            </div>

            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">📈 Rendimiento de Faena</span>
              <strong style="font-size: 1.35rem; color: #10b981; font-weight: 850;">${i.toFixed(2)}%</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">(kg faena / kg limpios)</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">Prom. Cabeza: ${(x.totalQuantity>0?x.totalKgClean/x.totalQuantity:0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})} kg/cab</div>
            </div>

            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">💵 Costo Neto / Kg Limpio</span>
              <strong style="font-size: 1.35rem; color: #fbbf24; font-weight: 850;">$${r.toFixed(2)}</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">Total c/ Com: $${t.toLocaleString()}</div>
            </div>

          </div>

          <!-- Detailed Ledger Subcard -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem;">
            <h4 style="margin: 0 0 1rem 0; font-size: 0.85rem; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">📋 Desglose de Gastos & Flete</h4>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: var(--text-muted);">Flete Simulado Estimado (Ruta):</span>
                <strong style="color: #ffffff;">$${D.toLocaleString()}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: var(--text-muted);">Costo Total Chofer:</span>
                <strong style="color: #f87171;">- $${w.toLocaleString()}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: var(--text-muted);">Costo de Combustible (${g} L):</span>
                <strong style="color: #f87171;">- $${E.toLocaleString()}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: var(--text-muted);">Gastos Varios & Viáticos del Viaje:</span>
                <strong style="color: #f87171;">- $${O.toLocaleString()}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 1.1rem; border-top: 1.5px solid var(--border); padding-top: 1rem; margin-top: 0.5rem; font-weight: 800; color: #ffffff;">
                <span>Total de Costos Operativos del Viaje:</span>
                <span style="color: #f87171;">$${(w+E+O).toLocaleString()}</span>
              </div>

            </div>
          </div>

        </div>
      `}n.querySelectorAll(`.tab-item-m3`).forEach(e=>{e.onclick=e=>{s=parseInt(e.target.dataset.tab),b()}}),n.querySelector(`#btn-cancel-tmodal`).onclick=()=>{n.innerHTML=``,t.onCancel&&t.onCancel()},n.querySelector(`#btn-save-tmodal`).onclick=r=>{r.preventDefault();let a=i.find(e=>String(e.id)===String(f)),o={id:e?e.id:Date.now(),date:c,status:u,description:d,tropa:_,truck:a||null,kmOnOrigin:p,kmOnDestination:m,kmOnPump:h,litersOnPump:g,expenses:v,driverPricePerKmSimple:e?.driverPricePerKmSimple||0,driverPricePerKmDouble:e?.driverPricePerKmDouble||0,fuelPrice:e?.fuelPrice||0,pricePerKm:e?.pricePerKm||0,buy:{id:y.id||``,agent:y.agent,reduce:y.totalReduce,totalReduce:y.totalReduce,listOfProducers:y.listOfProducers},kgFaenaTotal:e?.kgFaenaTotal||0,updatedAt:Date.now()};n.innerHTML=``,t.onSaveTravel&&t.onSaveTravel(o)}};b()}function Ue(e){let t=K(`div`,{classes:[`selector-row`],style:`margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; justify-content: flex-start;`}),n=K(`span`,{text:`Período:`,classes:[`selector-label`]}),r=K(`select`,{classes:[`form-input`],style:`border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 8px; background: var(--bg-main); color: var(--text-main); font-size: 0.9rem; cursor: pointer;`,html:`
      <option value="all" ${e.timeFilterType===`all`?`selected`:``}>Todos los Viajes</option>
      <option value="count" ${e.timeFilterType===`count`?`selected`:``}>Últimos N Viajes</option>
      <option value="range" ${e.timeFilterType===`range`?`selected`:``}>Rango de Fechas</option>
    `}),i=K(`div`,{style:`display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;`}),a=new Date().toISOString().split(`T`)[0],o=(()=>{let e=new Date;return e.setMonth(e.getMonth()-1),e.toISOString().split(`T`)[0]})(),s=()=>{i.innerHTML=``;let t=r.value;if(t===`count`){let t=K(`input`,{attrs:{type:`number`,min:`1`,value:e.timeFilterType===`count`?e.timeFilterValue:10},style:`width: 80px; padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);`}),n=K(`button`,{classes:[`btn-primary`],text:`Aplicar`,style:`padding: 0.4rem 0.8rem; margin: 0; font-size: 0.85rem;`});n.onclick=()=>e.onTimeFilter(`count`,t.value),i.appendChild(t),i.appendChild(n)}else if(t===`range`){let t=e.timeFilterType===`range`&&e.timeFilterValue?e.timeFilterValue:{start:o,end:a},n=K(`input`,{attrs:{type:`date`,value:t.start||o},style:`padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);`}),r=K(`input`,{attrs:{type:`date`,value:t.end||a},style:`padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);`}),s=K(`button`,{classes:[`btn-primary`],text:`Aplicar`,style:`padding: 0.4rem 0.8rem; margin: 0; font-size: 0.85rem;`});s.onclick=()=>e.onTimeFilter(`range`,{start:n.value,end:r.value}),i.appendChild(n),i.appendChild(r),i.appendChild(s)}};return r.onchange=t=>{t.target.value===`all`?e.onTimeFilter(`all`,null):s()},s(),t.appendChild(n),t.appendChild(r),t.appendChild(i),t}function We(e,t){if(!e)return;let{data:n=[],totalItems:r=0,currentPage:i=1,itemsPerPage:a=10,currentFilter:o,currentSort:s,onFilter:c,onSort:l,onPage:u,categories:d=[],selectedCategories:f=[],includeCommission:p,onCategoryToggle:m,onCommissionToggle:h}=t,g=document.activeElement?document.activeElement.id:null,_=document.activeElement?document.activeElement.selectionStart:null,v=document.activeElement?document.activeElement.selectionEnd:null,y,b=e.querySelector(`.card-list`);if(b){y=b,y.innerHTML=``,e.querySelectorAll(`.filter-btn`).forEach(e=>{let t=e.textContent,n=o===t;e.style.background=n?`var(--primary)`:`transparent`,e.style.color=n?`var(--on-primary)`:`var(--text-muted)`});let t=e.querySelector(`.sort-toggle`);t&&(t.innerHTML=`📅 Fecha ${s===`DESC`?`▼`:`▲`}`),e.querySelectorAll(`.category-chip`).forEach(e=>{let t=e.textContent;e.className=`category-chip ${(t===`TODOS`?f.length===0:f.includes(t))?`active`:`inactive`}`});let n=e.querySelector(`.comm-toggle input`);n&&(n.checked=p);let r=e.querySelector(`.pagination`);r&&r.remove()}else{e.innerHTML=``;let n=K(`div`,{classes:[`settings-header-container`,`glass-card`],style:`display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; padding: 1.5rem 2rem; border-radius: 20px;`});n.innerHTML=`
      <div style="display: flex; align-items: center; gap: 1.25rem;">
        <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard" style="border: 1px solid var(--border); background: var(--bg-main);">
          <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
        </button>
        <div>
          <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main);"></h2>
          <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;"></p>
        </div>
      </div>
      <button id="btn-add-travel" class="btn-primary" style="margin: 0; padding: 0.7rem 1.4rem; border-radius: 12px; font-weight: 600;">+ Nuevo Viaje</button>
    `,n.querySelector(`h2`).textContent=`🚛 Gestión de Viajes`,n.querySelector(`p`).textContent=`Monitorea remisiones, rendimiento de faena y liquidaciones de productores.`,e.appendChild(n),n.querySelector(`#back-to-dash`).onclick=t.onBack,n.querySelector(`#btn-add-travel`).onclick=()=>{t.onAddTravel&&t.onAddTravel()};let r=K(`div`,{classes:[`glass-card`,`settings-card`],style:`margin-bottom: 2rem; padding: 1.75rem 2rem; border-radius: 20px; display: flex; flex-direction: column; gap: 1.25rem;`}),i=Ue(t);r.appendChild(i);let a=K(`div`,{classes:[`selector-row`],style:`display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; border-top: 1px solid var(--border); padding-top: 1.25rem; flex-wrap: wrap;`}),u=K(`div`,{style:`display: flex; align-items: center; gap: 1rem; flex: 1; flex-wrap: wrap;`});u.innerHTML=`<span style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Categorías:</span>`;let g=K(`div`,{classes:[`category-chips-container`],style:`display: flex; gap: 0.5rem; flex-wrap: wrap;`});d.forEach(e=>{let t=K(`button`,{classes:[`category-chip`,(e===`TODOS`?f.length===0:f.includes(e))?`active`:`inactive`],text:e});t.onclick=()=>m(e),g.appendChild(t)}),u.appendChild(g);let _=K(`label`,{classes:[`comm-toggle`],style:`display: flex; align-items: center; gap: 0.75rem; cursor: pointer; background: rgba(255,255,255,0.02); padding: 0.6rem 1rem; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease;`,html:`
        <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">Con Comisión</span>
        <label class="switch-container-m3" style="margin: 0;">
          <input type="checkbox" ${p?`checked`:``}>
          <span class="switch-slider-m3"></span>
        </label>
      `});_.querySelector(`input`).onchange=e=>h(e.target.checked),a.appendChild(u),a.appendChild(_),r.appendChild(a),e.appendChild(r);let v=K(`div`,{classes:[`toolbar`,`glass-card`],style:`margin-bottom: 2rem; padding: 1.25rem 1.75rem; border-radius: 18px; display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;`}),b=K(`div`,{classes:[`segmented-control-container`],style:`display: flex; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); padding: 4px; border-radius: 12px;`});[`TODOS`,`ACTIVO`,`BORRADOR`].forEach(e=>{let t=o===e,n=K(`button`,{classes:[`filter-btn`],text:e,style:`background: ${t?`var(--primary)`:`transparent`}; color: ${t?`var(--on-primary)`:`var(--text-muted)`}; border: none; padding: 0.5rem 1.15rem; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease;`});n.onclick=()=>c(e),b.appendChild(n)});let x=K(`input`,{classes:[`form-input`],attrs:{id:`travel-search`,type:`text`,placeholder:`🔍 Buscar productor, patente, chofer...`,value:t.searchQuery||``},style:`flex: 1; min-width: 250px; padding: 0.65rem 1.25rem; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.85rem;`});x.oninput=e=>t.onSearch(e.target.value);let S=K(`div`,{style:`display: flex; align-items: center; gap: 0.65rem;`}),C=K(`input`,{attrs:{type:`file`,accept:`.pdf`,id:`pdf-faena-input`},style:`display: none;`}),w=K(`button`,{classes:[`btn-primary`],text:`📄 Subir PDF`,style:`margin: 0; white-space: nowrap; background: #2563eb; border: none; font-size: 0.82rem; padding: 0.65rem 1.15rem; border-radius: 10px; font-weight: 600;`});w.onclick=()=>C.click(),C.onchange=e=>{e.target.files&&e.target.files[0]&&t.onPdfUpload(e.target.files[0])};let T=K(`input`,{attrs:{type:`file`,webkitdirectory:``,directory:``,multiple:``},style:`display: none;`}),E=K(`button`,{classes:[`btn-primary`],text:`📁 Escanear Carpeta`,title:`Escanear una carpeta local en busca de PDFs no procesados`,style:`margin: 0; white-space: nowrap; background: #10b981; border: none; font-size: 0.82rem; padding: 0.65rem 1.15rem; border-radius: 10px; font-weight: 600;`});E.onclick=()=>T.click(),T.onchange=e=>{e.target.files&&e.target.files.length>0&&t.onScanDirectory(Array.from(e.target.files)),T.value=``};let D=K(`button`,{classes:[`sort-toggle`],style:`background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border); color: var(--text-main); font-size: 0.82rem; padding: 0.65rem 1.15rem; border-radius: 10px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.35rem;`,html:`📅 Fecha ${s===`DESC`?`▼`:`▲`}`});D.onclick=()=>l(s===`DESC`?`ASC`:`DESC`),S.appendChild(C),S.appendChild(w),S.appendChild(T),S.appendChild(E),v.appendChild(b),v.appendChild(x),v.appendChild(S),v.appendChild(D),e.appendChild(v),y=K(`div`,{classes:[`card-list`],style:`display: flex; flex-direction: column; gap: 2rem; margin-bottom: 2rem;`}),e.appendChild(y)}n.forEach(e=>{let n=e.buy||{},r=n.agent?.name,i=K(`div`,{classes:[`glass-card`,`settings-card`],style:`padding: 2.25rem; border-radius: 24px; transition: all 0.25s cubic-bezier(0.2, 0, 0.2, 1); border: 1px solid var(--border); background: rgba(255,255,255,0.015); box-shadow: var(--elevation-1);`});i.addEventListener(`mouseenter`,()=>{i.style.transform=`translateY(-2px)`,i.style.boxShadow=`0 8px 24px rgba(0, 0, 0, 0.2)`,i.style.borderColor=`var(--primary)`}),i.addEventListener(`mouseleave`,()=>{i.style.transform=`translateY(0)`,i.style.boxShadow=`var(--elevation-1)`,i.style.borderColor=`var(--border)`});let a=n.agentCommissionAmount||0,o=n.totalOperation||0,s=n.totalOperationWithCommission||0,c=n.generalYield||0;i.innerHTML=`
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div class="header-main">
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">🚚 ${e.truck?.name||`Viaje #`+e.id}</h3>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap;">
            <span style="font-size: 1.05rem; font-weight: 750; color: #60a5fa; display: flex; align-items: center; gap: 0.35rem;">📅 ${e.date||``}</span>
            <span style="color: var(--text-muted); font-size: 0.85rem;">&bull;</span>
            <span class="card-subtitle" style="font-size: 0.85rem; color: var(--text-muted); font-weight: 550; display: flex; align-items: center; gap: 0.35rem;">🏷️ ${e.description||`Sin descripción`}</span>
          </div>
        </div>
        <div class="header-status" style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          ${r?`<span class="agent-badge" style="background: rgba(255,255,255,0.04); color: var(--text-main); font-weight: 600; font-size: 0.75rem; padding: 0.3rem 0.75rem; border-radius: 8px; border: 1px solid var(--border);">👤 ${r}</span>`:``}
          <kmp-status-chip status="${e.status||`DRAFT`}"></kmp-status-chip>
          <div class="travel-actions" style="display: flex; gap: 0.4rem;">
            <button class="btn-icon btn-edit-travel" data-id="${e.id}" title="Editar Logística" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: #60a5fa; padding: 0.5rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg></button>
            <button class="btn-icon btn-delete-travel" data-id="${e.id}" title="Eliminar Viaje" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: #f87171; padding: 0.5rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" /></svg></button>
          </div>
        </div>
      </div>
    `;let l=(n.categories||[]).join(`, `)||`N/A`,u=K(`div`,{classes:[`card-body`]});u.innerHTML=`
      <div class="grid-2-cols" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.75rem; margin-bottom: 1.5rem;">
        
        <!-- Column 1: Economy Subcard -->
        <div class="metrics-column" style="background: rgba(255,255,255,0.012); border: 1px solid var(--border); padding: 1.5rem; border-radius: 20px; transition: all 0.2s;">
          <h4 style="margin: 0 0 1rem 0; font-size: 0.9rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">💰 Economía</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Operación Total:</span> <strong style="color:var(--text-main); font-family:monospace;">$${o.toLocaleString()}</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Comisión Agente:</span> <strong style="color:var(--text-main); font-family:monospace;">$${a.toLocaleString()}</strong></div>
            <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.65rem; margin-top: 0.35rem; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight: 700; color: var(--text-main); font-size:0.88rem;">Total c/ Comisión:</span>
              <strong style="color: #60a5fa; font-size:1.1rem; font-family:monospace; font-weight:800; text-shadow:0 0 8px rgba(96,165,250,0.15);">$${s.toLocaleString()}</strong>
            </div>
            
            <div class="detail-row" style="margin-top: 0.65rem; border-top: 1px dashed var(--border); padding-top: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform:uppercase; letter-spacing:0.3px;">Achique Total (Viaje):</span>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">$</span>
                <input type="number" class="compact-input" value="${n.reduce||0}" 
                  style="width: 110px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); text-align: right; font-weight: 750; font-family:monospace; outline:none; transition:all 0.2s;"
                  onfocus="this.style.borderColor='var(--primary)'"
                  onblur="this.style.borderColor='var(--border)'"
                  onchange="this.dataset.id='${e.id}'; window._ui_onReduceUpdate && window._ui_onReduceUpdate('${e.id}', this.value)">
              </div>
            </div>
          </div>
        </div>
        
        <!-- Column 2: Yield Subcard -->
        <div class="metrics-column" style="background: rgba(255,255,255,0.012); border: 1px solid var(--border); padding: 1.5rem; border-radius: 20px; transition: all 0.2s;">
          <h4 style="margin: 0 0 1rem 0; font-size: 0.9rem; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">📈 Rendimiento</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Categoría(s):</span> <span style="background:rgba(255,255,255,0.04); color:var(--text-main); font-weight:700; padding:0.15rem 0.45rem; border-radius:6px; font-size:0.75rem; text-transform:uppercase; border:1px solid rgba(255,255,255,0.06);">${l}</span></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Cantidad:</span> <strong style="color:var(--text-main);">${n.totalQuantity||0} cabezas</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Kg Limpios:</span> <strong style="color:var(--text-main); font-family:monospace;">${(n.totalKgClean||0).toLocaleString()} kg</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Kg Faena:</span> <strong style="color:var(--text-main); font-family:monospace;">${(n.totalKgFaena||0).toLocaleString()} kg</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Promedio por Cabeza:</span> <strong style="color:var(--text-main); font-family:monospace;" title="kg limpio / cantidad cabezas">${(n.totalQuantity>0?n.totalKgClean/n.totalQuantity:0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})} kg/cab</strong></div>
            <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.65rem; margin-top: 0.35rem; display:flex; justify-content:space-between; align-items:center;">
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 700; color: var(--text-main); font-size:0.88rem;">Rendimiento Gral:</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">(kg faena / kg limpios)</span>
              </div>
              <span style="background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.25); font-weight: 800; font-size: 0.95rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-family:monospace;">${(c*100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="font-size: 0.85rem; font-weight: 750; color: var(--text-muted); text-transform: uppercase; margin: 1.5rem 0 1rem 0; letter-spacing: 0.8px; display: flex; align-items: center; gap: 0.4rem;">👥 Productores Asociados</div>
    `,window._ui_onReduceUpdate=(e,n)=>{t.onReduceUpdate&&t.onReduceUpdate(e,parseFloat(n))};let d=K(`div`,{classes:[`producers-list`],style:`display: flex; flex-direction: column; gap: 0.95rem;`});(n.listOfProducers||[]).forEach(n=>{let r=K(`div`,{classes:[`producer-sub-card`],style:`background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 16px; padding: 1.35rem; display: flex; flex-direction: column; gap: 0.85rem; transition: all 0.2s;`}),i=n.iva||0,a=n.retencionGanancias||0,o=n.producer?.name||`Productor`,s=n.producer?.cuit||``,c=n.producer?.cbu||``;n.totalAPagar;let l=K(`div`,{classes:[`producer-header`],style:`display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 0.75rem;`});l.innerHTML=`
        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <strong style="font-size: 1rem; color: #ffffff; letter-spacing:0.2px;">👤 ${o}</strong>
          ${n.origin?`<span style="background:rgba(255,255,255,0.03); color:var(--text-muted); font-size:0.7rem; font-weight:700; padding:0.15rem 0.45rem; border-radius:6px; border:1px solid rgba(255,255,255,0.05); text-transform:uppercase;">📍 ${n.origin}</span>`:``}
        </div>
      `;let u=K(`button`,{classes:[`btn-action`],text:`📊 Liquidar`,style:`background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; border: none; border-radius: 8px; padding: 0.45rem 1rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; box-shadow: 0 2px 8px rgba(37,99,235,0.25); transition: all 0.2s;`});u.onclick=r=>{r.stopPropagation(),r.preventDefault(),t.onProducerSettlement&&t.onProducerSettlement(e,n)},l.appendChild(u),r.appendChild(l);let f=K(`div`,{classes:[`producer-info`],style:`display: flex; gap: 0.65rem; flex-wrap: wrap; margin-top: -0.25rem;`});f.innerHTML=`
        ${s?`<span class="info-badge" style="background: rgba(255,255,255,0.015); color: var(--text-muted); font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--border); letter-spacing:0.3px;"><strong style="opacity:0.8;">CUIT:</strong> ${s}</span>`:``}
        ${c?`<span class="info-badge" style="background: rgba(255,255,255,0.015); color: var(--text-muted); font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--border); letter-spacing:0.3px;"><strong style="opacity:0.8;">CBU:</strong> ${c}</span>`:``}
      `,r.appendChild(f);let p=K(`div`,{classes:[`producer-taxes`],style:`display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;`});p.innerHTML=`
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
          <span class="tax-badge" style="background: rgba(255, 255, 255, 0.03); color: var(--text-main); border: 1px solid var(--border); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; letter-spacing:0.2px;">NETO: $${(n.neto||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
          ${i>0?`<span class="tax-badge tax-iva" style="background: rgba(37, 99, 235, 0.08); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.2); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; letter-spacing:0.2px;">IVA: $${i.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`:``}
          ${a>0?`<span class="tax-badge tax-ganancias" style="background: rgba(245, 158, 11, 0.08); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; letter-spacing:0.2px;">RET. GAN.: $${a.toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`:``}
        </div>
        <div style="margin-left: auto; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
          <span style="font-size:0.72rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px;">FACTURA (Neto + IVA):</span>
          <span class="tax-badge" style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); font-weight: 850; font-size: 0.85rem; padding: 0.3rem 0.85rem; border-radius: 8px; font-family:monospace; text-shadow:0 0 6px rgba(52,211,153,0.15);">$${(n.totalFactura||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
      `,r.appendChild(p);let m=K(`div`,{classes:[`product-mini-list`],style:`background: rgba(0,0,0,0.15); border-radius: 12px; border: 1px solid rgba(255,255,255,0.02); overflow: hidden; margin-top: 0.25rem;`}),h=K(`table`,{style:`width: 100%; border-collapse: collapse; font-size: 0.76rem; text-align: left;`});h.innerHTML=`
        <thead>
          <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.04); background: rgba(255,255,255,0.01); color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 0.55rem 0.85rem;">Detalle Producto</th>
            <th style="padding: 0.55rem 0.85rem; text-align: center; width: 80px;">Cabezas</th>
            <th style="padding: 0.55rem 0.85rem; text-align: right;">Kilos Limpios</th>
            <th style="padding: 0.55rem 0.85rem; text-align: center; width: 100px;">% Desbaste</th>
            <th style="padding: 0.55rem 0.85rem; text-align: right; width: 120px;">Precio Vivo</th>
          </tr>
        </thead>
        <tbody>
          ${(n.listOfProducts||[]).map(e=>`
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); color: var(--text-main); font-weight: 600;">
              <td style="padding: 0.5rem 0.85rem; font-weight: 700; color: #ffffff;">🥩 ${e.name}</td>
              <td style="padding: 0.5rem 0.85rem; text-align: center; color: var(--text-muted);">${e.quantity} uds</td>
              <td style="padding: 0.5rem 0.85rem; text-align: right; font-family: monospace;">${e.kgClean.toFixed(0).toLocaleString()} kg</td>
              <td style="padding: 0.5rem 0.85rem; text-align: center; color: var(--text-muted);">${e.roughing}%</td>
              <td style="padding: 0.5rem 0.85rem; text-align: right; font-family: monospace; color: var(--text-main); font-weight: 750;">$${e.price.toLocaleString()}</td>
            </tr>
          `).join(``)}
        </tbody>
      `,m.appendChild(h),r.appendChild(m),d.appendChild(r)}),u.appendChild(d),i.appendChild(u),y.appendChild(i)}),e.appendChild(y);let x=Math.ceil(r/a);if(x>1){let t=K(`div`,{classes:[`pagination`],style:`display: flex; align-items: center; justify-content: center; gap: 1.25rem; margin: 2rem 0;`}),n=K(`button`,{classes:[`page-btn`],text:`Anterior`,attrs:i===1?{disabled:``}:{},style:`background: rgba(255,255,255,0.03); color: ${i===1?`var(--text-muted)`:`var(--text-main)`}; border: 1px solid var(--border); padding: 0.6rem 1.25rem; border-radius: 12px; font-weight: 600; font-size: 0.82rem; cursor: pointer;`});n.onclick=()=>u(i-1);let r=K(`button`,{classes:[`page-btn`],text:`Siguiente`,attrs:i===x?{disabled:``}:{},style:`background: rgba(255,255,255,0.03); color: ${i===x?`var(--text-muted)`:`var(--text-main)`}; border: 1px solid var(--border); padding: 0.6rem 1.25rem; border-radius: 12px; font-weight: 600; font-size: 0.82rem; cursor: pointer;`});r.onclick=()=>u(i+1);let a=K(`span`,{classes:[`page-info`],text:`Página ${i} de ${x}`,style:`font-weight: 700; font-size: 0.85rem; color: var(--text-muted);`});t.appendChild(n),t.appendChild(a),t.appendChild(r),e.appendChild(t)}if(g){let e=document.getElementById(g);e&&(e.focus(),_!==null&&v!==null&&(e.type===`text`||e.type===`search`)&&e.setSelectionRange(_,v))}e.querySelectorAll(`.btn-edit-travel`).forEach(e=>{e.onclick=e=>{let r=e.currentTarget.dataset.id,i=n.find(e=>String(e.id)===String(r));i&&t.onEditTravel&&t.onEditTravel(i)}}),e.querySelectorAll(`.btn-delete-travel`).forEach(e=>{e.onclick=e=>{let n=e.currentTarget.dataset.id;confirm(`¿Deseas eliminar este viaje y toda su información logística asociada?`)&&t.onDeleteTravel&&t.onDeleteTravel(n)}})}function Ge(e,t){if(!e)return;e.innerHTML=``;let n=K(`div`,{classes:[`simulator-wrapper`,`fade-in`],style:`width: 100%; max-width: 100%; margin: 0; padding: 0 0 2rem 0;`}),r=K(`div`,{classes:[`settings-header-container`,`glass-card`],style:`grid-column: 1 / -1; margin-bottom: 1.5rem; padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1.25rem; border-radius: 20px;`});r.innerHTML=`
    <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard" style="border: 1px solid var(--border); background: var(--bg-main);">
      <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <div>
      <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main);">🧮 Simulador de Costo Gancho</h2>
      <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Estima de forma precisa costos de hacienda, fletes e impuestos aplicados a la carne.</p>
    </div>
  `,n.appendChild(r),r.querySelector(`#back-to-dash`).onclick=t.onBack;let i=K(`div`,{classes:[`glass-card`,`settings-card`],style:`padding: 2rem; border-radius: 20px; display: flex; flex-direction: column; gap: 1.5rem;`});i.innerHTML=`
    <div style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 0.25rem;">
      <h3 style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">⚙️ Parámetros de Operación</h3>
      <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.78rem;">Modifica los valores para recalcular al instante los costos ganchos.</p>
    </div>

    <!-- 1. Rendimiento Slider -->
    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Rendimiento Estimado (%)</label>
        <span class="badge-accent" id="rend-val-badge" style="background: var(--primary-container); color: var(--on-primary-container); font-weight: 700; font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 8px;">58.5%</span>
      </div>
      <input type="range" id="sim-rend" min="45" max="65" step="0.1" value="58.5" class="slider-m3" style="width: 100%;">
    </div>

    <!-- 2. Precio Vivo Input -->
    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
      <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Precio Vivo ($/kg en pie)</label>
      <div style="position: relative; display: flex; align-items: center;">
        <span style="position: absolute; left: 0.85rem; color: var(--text-muted); font-size: 0.9rem; font-weight: 500;">$</span>
        <input type="number" id="sim-precio" value="5050" step="10" class="form-input" style="padding-left: 1.75rem; width: 100%;" placeholder="Ej: 5050">
      </div>
    </div>

    <!-- 3. Distancia Input -->
    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
      <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Distancia al Establecimiento (km)</label>
      <div style="position: relative; display: flex; align-items: center;">
        <input type="number" id="sim-dist" value="400" step="5" class="form-input" style="width: 100%; padding-right: 2.5rem;" placeholder="Ej: 400">
        <span style="position: absolute; right: 0.85rem; color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">KM</span>
      </div>
    </div>

    <!-- 4. IIBB Slider -->
    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Porcentaje IIBB (%)</label>
        <span class="badge-accent" id="iibb-val-badge" style="background: rgba(255, 255, 255, 0.08); color: var(--text-main); font-weight: 600; font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 8px;">1.7%</span>
      </div>
      <input type="range" id="sim-iibb" min="0" max="5" step="0.1" value="1.7" class="slider-m3" style="width: 100%;">
    </div>

    <!-- 5. Jaula Toggle Switch -->
    <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02); padding: 0.95rem 1.25rem; border-radius: 14px; border: 1px solid var(--border); margin-top: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;" id="jaula-icon">🚛</span>
        <div>
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin: 0; display: block;">Modo de Carga</label>
          <span style="font-size: 0.72rem; color: var(--text-muted);" id="jaula-desc">Jaula Doble estándar</span>
        </div>
      </div>
      <label class="switch-container-m3">
        <input type="checkbox" id="sim-doble" checked>
        <span class="switch-slider-m3"></span>
      </label>
    </div>
  `;let a=K(`div`,{classes:[`glass-card`,`settings-card`,`simulator-results-panel`],style:`padding: 2rem; border-radius: 20px; display: flex; flex-direction: column; gap: 1.25rem;`});a.id=`sim-results`,n.appendChild(i),n.appendChild(a),e.appendChild(n);let o=()=>{let e={rendimiento:parseFloat(document.getElementById(`sim-rend`).value)||0,precioVivo:parseFloat(document.getElementById(`sim-precio`).value)||0,distancia:parseFloat(document.getElementById(`sim-dist`).value)||0,porcentajeIIBB:parseFloat(document.getElementById(`sim-iibb`).value)||0,jaulaDobleOrSimple:document.getElementById(`sim-doble`).checked,settings:t.settings},n=i.querySelector(`#rend-val-badge`);n&&(n.textContent=`${e.rendimiento.toFixed(1)}%`);let r=i.querySelector(`#iibb-val-badge`);r&&(r.textContent=`${e.porcentajeIIBB.toFixed(1)}%`);let o=i.querySelector(`#jaula-icon`),s=i.querySelector(`#jaula-desc`);e.jaulaDobleOrSimple?(o&&(o.textContent=`🚛`),s&&(s.textContent=`Jaula Doble estándar`)):(o&&(o.textContent=`🚚`),s&&(s.textContent=`Jaula Simple estándar`));let c=new te(e);a.innerHTML=`
      <div style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 0.5rem;">
        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">📊 Ficha de Resultados</h3>
        <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.78rem;">Cálculos automáticos computados según parámetros e impuestos.</p>
      </div>

      <div class="scorecard-list" style="display: flex; flex-direction: column; gap: 0.85rem;">
        <div class="score-row-item">
          <span class="score-label">Kg Venta Proyectados:</span>
          <strong class="score-value">${c.kgFaena.toFixed(0)} kg</strong>
        </div>
        <div class="score-row-item">
          <span class="score-label">Costo Hacienda Carne:</span>
          <strong class="score-value">$${c.costoInicialPorKgCarne.toFixed(2)}</strong>
        </div>
        <div class="score-row-item">
          <span class="score-label">Costo Flete por Kg:</span>
          <strong class="score-value">$${c.costoFletePorKgCarne.toFixed(2)}</strong>
        </div>
        <div class="score-row-item">
          <span class="score-label">Costo Impuesto IIBB:</span>
          <strong class="score-value">$${c.costoIIBB.toFixed(2)}</strong>
        </div>
        
        <hr style="border: none; border-top: 1px dashed var(--border); margin: 0.5rem 0;">
        
        <!-- Large Final Results Display -->
        <div class="score-row-item highlight-cost" style="background: rgba(143, 0, 20, 0.05); border: 1.5px solid rgba(143, 0, 20, 0.15); padding: 0.9rem 1.25rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
          <span style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">Costo Gancho Final:</span>
          <strong style="font-size: 1.35rem; font-weight: 850; color: #ffffff; text-shadow: 0 0 10px rgba(255,255,255,0.15);">$${c.costoFinal.toFixed(2)} <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">/kg</span></strong>
        </div>

        <div class="score-row-item highlight-invoice" style="background: rgba(59, 130, 246, 0.05); border: 1.5px solid rgba(59, 130, 246, 0.15); padding: 0.9rem 1.25rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; margin-top: 0.25rem;">
          <span style="font-weight: 700; color: #60a5fa; font-size: 0.95rem;">Facturación Sugerida:</span>
          <strong style="font-size: 1.35rem; font-weight: 850; color: #ffffff; text-shadow: 0 0 10px rgba(96,165,250,0.15);">$${c.facturaVentaPorKgCarne.toFixed(2)} <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">/kg</span></strong>
        </div>

        <div class="score-row-item highlight-net" style="background: rgba(16, 185, 129, 0.05); border: 1.5px solid rgba(16, 185, 129, 0.15); padding: 0.9rem 1.25rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; margin-top: 0.25rem;">
          <span style="font-weight: 700; color: #34d399; font-size: 0.95rem;">Utilidad Total Neta:</span>
          <strong style="font-size: 1.35rem; font-weight: 850; color: #ffffff; text-shadow: 0 0 10px rgba(52,211,153,0.15);">$${c.utilidadTotalEstimada.toLocaleString(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
        </div>
      </div>
    `};i.addEventListener(`input`,o),o()}var Ke=class{static async getReferencePrices(){try{let e=`mag_prices_cache`,t=localStorage.getItem(e);if(t){let{timestamp:e,data:n}=JSON.parse(t);if(Date.now()-e<720*60*1e3)return this.formatMagData(n)}let n=await fetch(`/api/mag-prices`);if(!n.ok)throw Error(`Network response was not ok`);let r=await n.json();if(r.success&&r.data)return localStorage.setItem(e,JSON.stringify({timestamp:Date.now(),data:r.data,source:r.source})),this.formatMagData(r.data)}catch(e){console.warn(`Error fetching MAG prices. Using fallbacks.`,e)}return{NOVILLO:4750*1.105,VAQUILLONA:4650*1.105,VACA:2750*1.105,TORO:2950*1.105,TERNERO:5150*1.105,NOVILLITO:5020*1.105,MEJ:4700*1.105}}static formatMagData(e){let t={};return e.forEach(e=>{let n=e.avg*1.105;e.category.toLowerCase().includes(`novillito`)?t.NOVILLITO=n:e.category.toLowerCase().includes(`novillo`)?t.NOVILLO=n:e.category.toLowerCase().includes(`vaquillona`)?t.VAQUILLONA=n:e.category.toLowerCase().includes(`vaca`)&&(t.VACA=n)}),t.NOVILLO||=4750*1.105,t.TORO||=2950*1.105,t.MEJ||=4700*1.105,t}static calculateGap(e,t){return!t||t===0?0:(e-t)/t*100}},qe={};function Je(e,t){if(!e)return;let{data:n=[],categories:r=[],selectedCategories:i=[],includeCommission:a=!1,onCategoryToggle:o,onCommissionToggle:s,categoryStats:c,stockTotals:l={kg:0,count:0,byCategory:{}},historyItems:u=[],clients:d=[],dashHistoryFilters:f={},onDashHistoryFilter:p,categoryPrices:m={}}=t;try{e.innerHTML=``;let h=K(`div`,{classes:[`dashboard-wrapper`]}),g=K(`div`,{classes:[`dashboard-header`,`glass-card`],style:`margin-bottom: 2rem; padding: 1.75rem 2rem; border-radius: 20px;`});g.innerHTML=`
      <h2 style="margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-main);">📊 Dashboard de Inteligencia</h2>
      <p style="margin: 0.35rem 0 0 0; color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Análisis gerencial y control en tiempo real de tendencias, rendimientos y stock.</p>
    `,h.appendChild(g);let _=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 2rem; padding: 1.75rem 2rem; border-radius: 22px;`}),v=K(`div`,{style:`display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;`});v.innerHTML=`
      <span style="font-size: 1.4rem;">🥩</span>
      <h3 style="margin: 0; font-size: 1.15rem; font-weight: 750; color: var(--text-main);">Stock Actual de Medias Reses</h3>
    `,_.appendChild(v);let y=K(`div`,{classes:[`stock-chips-grid`],style:`display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.15rem;`}),b=K(`div`,{classes:[`stock-category-card`,`glass-card`],style:`padding: 1.15rem 1.25rem; border-radius: 16px; border-left: 4px solid var(--primary);`});b.innerHTML=`
      <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL COLGADO</div>
      <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin: 0.35rem 0;">${l.kg.toLocaleString(void 0,{maximumFractionDigits:1})} kg</div>
      <div style="color: var(--text-muted); font-size: 0.7rem; font-weight: 500;">Peso total en cámaras</div>
    `,y.appendChild(b);let x=K(`div`,{classes:[`stock-category-card`,`glass-card`],style:`padding: 1.15rem 1.25rem; border-radius: 16px; border-left: 4px solid #10b981;`});x.innerHTML=`
      <div style="color: #34d399; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL PIEZAS</div>
      <div style="font-size: 1.35rem; font-weight: 800; color: #34d399; margin: 0.35rem 0;">${l.count}</div>
      <div style="color: var(--text-muted); font-size: 0.7rem; font-weight: 500;">Medias reses colgadas</div>
    `,y.appendChild(x),Object.entries(l.byCategory).forEach(([e,t])=>{let n=K(`div`,{classes:[`stock-category-card`,`glass-card`],style:`padding: 1.15rem 1.25rem; border-radius: 16px;`});n.innerHTML=`
        <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px;">${e}</div>
        <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin: 0.35rem 0;">${t.kg.toLocaleString(void 0,{maximumFractionDigits:1})} kg</div>
        <div style="color: var(--primary); font-size: 0.72rem; font-weight: 600;">${t.count} piezas colgadas</div>
      `,y.appendChild(n)}),_.appendChild(y),h.appendChild(_);let S=K(`div`,{classes:[`dashboard-filters`,`glass-card`],style:`margin-bottom: 2rem; padding: 1.5rem 2rem; border-radius: 22px; display: flex; flex-direction: column; gap: 1.25rem;`}),C=Ue(t);S.appendChild(C);let w=K(`div`,{classes:[`selector-row`],style:`display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; border-top: 1px solid var(--border); padding-top: 1.25rem; flex-wrap: wrap;`}),T=K(`div`,{style:`display: flex; align-items: center; gap: 1rem; flex: 1; flex-wrap: wrap;`});T.innerHTML=`<span style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Categorías:</span>`;let E=K(`div`,{classes:[`category-chips-container`],style:`display: flex; gap: 0.5rem; flex-wrap: wrap;`});r.forEach(e=>{let t=K(`button`,{classes:[`category-chip`,(e===`TODOS`?i.length===0:i.includes(e))?`active`:`inactive`],text:e});t.onclick=()=>o&&o(e),E.appendChild(t)}),T.appendChild(E);let D=K(`label`,{classes:[`comm-toggle`],style:`display: flex; align-items: center; gap: 0.75rem; cursor: pointer; background: rgba(255,255,255,0.02); padding: 0.6rem 1rem; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease;`,html:`
        <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">Con Comisión</span>
        <label class="switch-container-m3" style="margin: 0;">
          <input type="checkbox" ${a?`checked`:``}>
          <span class="switch-slider-m3"></span>
        </label>
      `}),O=D.querySelector(`input`);if(O&&(O.onchange=e=>s&&s(e.target.checked)),w.appendChild(T),w.appendChild(D),S.appendChild(w),h.appendChild(S),c){let e=i.length===0?`Totales`:i.join(`, `),n=K(`div`,{classes:[`stats-grid`],style:`margin-bottom: 2rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem;`}),r=K(`kmp-metric-card`,{attrs:{title:`Compra Promedio`,value:`$${(c.avgPrice||0).toFixed(2)}`,icon:`💰`,subtitle:`Filtro: [${e}]`}});n.appendChild(r);let a=K(`kmp-metric-card`,{attrs:{title:`Compra con Comis.`,value:`$${(c.avgPriceWithCommission||0).toFixed(2)}`,icon:`💸`,subtitle:`Precio c/ comisiones`}});if(n.appendChild(a),i.length===1){let e=i[0],{realCostGancho:t,sellPriceRef:r,margin:a,marginPct:o,yieldVal:s}=c,l=K(`kmp-metric-card`,{attrs:{title:`Costo Real Gancho`,value:`$${(t||0).toFixed(2)}`,icon:`🏗️`,subtitle:`Rend: ${((s||0)*100).toFixed(1)}% | Incl. Flete, Comis. e IIBB`}});if(n.appendChild(l),r>0){let t=K(`kmp-metric-card`,{attrs:{title:`Venta Config [${e}]`,value:`$${(r||0).toFixed(2)}`,icon:`🏷️`}});n.appendChild(t);let i=K(`kmp-metric-card`,{attrs:{title:`Utilidad $/Kg`,value:`${a>=0?`+`:``}$${(a||0).toFixed(2)}`,icon:`⚖️`,"value-color":a>=0?`#34d399`:`#f87171`,subtitle:`Margen de spread neto`}});n.appendChild(i);let s=K(`kmp-metric-card`,{attrs:{title:`Rentabilidad Final`,value:`${o>=0?`+`:``}${(o||0).toFixed(2)}%`,icon:`📊`,"value-color":o>=0?`#34d399`:`#f87171`,subtitle:`Retorno sobre costo real`}});n.appendChild(s)}}let o=K(`kmp-metric-card`,{attrs:{title:`Viajes Completados`,value:`${c.travelCount||0} viajes`,icon:`🚛`,subtitle:`Historial cargado`}});n.appendChild(o);let s=K(`kmp-metric-card`,{attrs:{title:`Peso Media Res (Prom.)`,value:`${(c.avgKgMediaRes||0).toFixed(2)} kg`,icon:`🥩`,subtitle:`Peso promedio de reses`}});n.appendChild(s);let l=K(`kmp-metric-card`,{attrs:{title:`Cabezas Faenadas`,value:`${c.totalQuantity||0} cabezas`,icon:`🐂`,subtitle:`Volumen total`}});n.appendChild(l);let u=K(`kmp-metric-card`,{attrs:{title:`Rendimiento Promedio`,value:`${((c.avgYield||0)*100).toFixed(2)}%`,icon:`📈`,"value-color":`#34d399`,subtitle:`Porcentaje promedio de rinde`}});n.appendChild(u);let d=K(`kmp-metric-card`,{attrs:{title:`Rendimiento Máximo`,value:c.maxYield>0?`${(c.maxYield*100).toFixed(2)}%`:`N/A`,icon:`👑`,"value-color":`#fbbf24`,subtitle:c.maxYieldEntity||`N/A`},style:c.maxYieldTravelId?`cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;`:``});c.maxYieldTravelId&&(d.title=`Ver viaje correspondiente`,d.addEventListener(`click`,()=>{t&&typeof t.onShowTravelDetail==`function`&&t.onShowTravelDetail(c.maxYieldTravelId)}),d.addEventListener(`mouseenter`,()=>{d.style.transform=`scale(1.03)`,d.style.boxShadow=`0 8px 16px rgba(0,0,0,0.15)`}),d.addEventListener(`mouseleave`,()=>{d.style.transform=`scale(1)`,d.style.boxShadow=`none`})),n.appendChild(d);let f=(c.totalKgFaena||0)*(c.avgPriceWithCommission||0),p=K(`kmp-metric-card`,{attrs:{title:`Kilos Faenados`,value:`${(c.totalKgFaena||0).toLocaleString()} kg`,icon:`🔪`,subtitle:`Costo: $${f.toLocaleString(void 0,{maximumFractionDigits:0})}`}});n.appendChild(p);let m=i.length===1?i[0]:null;m&&m!==`TODOS`&&Ke.getReferencePrices().then(e=>{let t=e[m];if(t){let e=Ke.calculateGap(c.avgPrice,t),r=K(`kmp-metric-card`,{attrs:{title:`Vs Mercado (MAG)`,value:`${e>0?`+`:``}${e.toFixed(1)}%`,icon:`📈`,"value-color":e>0?`#f87171`:`#34d399`,subtitle:e>0?`Por encima de ref MAG`:`Precio de oportunidad`}});n.appendChild(r);let i=K(`kmp-metric-card`,{attrs:{title:`Precio Ref MAG`,value:`$${t.toLocaleString()}`,icon:`🏛️`,subtitle:`Índice de referencia MAG`}});n.appendChild(i)}}),h.appendChild(n)}let k=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 2rem; padding: 0; overflow: hidden; border-radius: 20px;`}),A=K(`div`,{style:`padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.25s ease;`,classes:[`dispatch-accordion-header`]});A.innerHTML=`
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <span style="font-size: 1.4rem;">🚚</span>
        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 750; color: var(--text-main);">Salidas y Despachos de Hacienda</h3>
      </div>
      <div style="display: flex; align-items: center; gap: 1.25rem;">
        <span id="dispatch-count-badge" style="background: rgba(132, 29, 29, 0.08); color: var(--primary); border: 1px solid rgba(132, 29, 29, 0.2); padding: 0.35rem 0.85rem; border-radius: 10px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.5px;">...</span>
        <span class="accordion-arrow" style="transition: transform 0.3s ease; color: var(--text-muted); font-size: 0.95rem;">▼</span>
      </div>
    `;let j=K(`div`,{style:`display: none; padding: 2rem; background: rgba(0,0,0,0.08); border-top: 1px solid var(--border);`,classes:[`dispatch-accordion-content`]});A.onclick=()=>{let e=j.style.display===`block`;j.style.display=e?`none`:`block`,A.querySelector(`.accordion-arrow`).style.transform=e?`rotate(0deg)`:`rotate(180deg)`};let M=K(`div`,{style:`display: flex; gap: 1.25rem; margin-bottom: 1.75rem; flex-wrap: wrap; align-items: flex-end;`}),N=K(`div`,{style:`flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 0.4rem;`});N.innerHTML=`
      <label style="font-size: 0.78rem; font-weight: 650; color: var(--text-muted); text-transform: uppercase;">📅 Fecha Despacho</label>
      <input type="date" class="form-input" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600;" value="${f.date||``}">
    `,N.querySelector(`input`).onchange=e=>p(`date`,e.target.value);let P=K(`div`,{style:`flex: 2; min-width: 240px; display: flex; flex-direction: column; gap: 0.4rem;`});P.innerHTML=`
      <label style="font-size: 0.78rem; font-weight: 650; color: var(--text-muted); text-transform: uppercase;">🏢 Cliente Destinatario</label>
      <select class="form-input" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600;">
        <option value="">Todos los destinos</option>
        ${d.map(e=>`<option value="${e.name}" ${f.destination===e.name?`selected`:``}>${e.name}</option>`).join(``)}
      </select>
    `,P.querySelector(`select`).onchange=e=>p(`destination`,e.target.value),M.appendChild(N),M.appendChild(P),j.appendChild(M);let F=u.filter(e=>{if(!e.dispatchDate)return!1;let t=new Date(e.dispatchDate).toISOString().split(`T`)[0],n=!f.date||t===f.date,r=!f.destination||(e.destination||``).includes(f.destination);return n&&r});if(A.querySelector(`#dispatch-count-badge`).textContent=`${F.length} piezas`,F.length===0)j.appendChild(K(`div`,{style:`padding: 2.5rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 14px; border: 1px dashed var(--border); font-size: 0.82rem; font-weight: 600;`,text:`No se encontraron despachos registrados para esta fecha o destino.`}));else{let e=K(`div`,{classes:[`table-responsive`],style:`background: rgba(0,0,0,0.12); border-radius: 16px; border: 1px solid var(--border); overflow-x: auto; margin-bottom: 1.5rem;`}),t=K(`table`,{style:`width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 500px;`});t.innerHTML=`
        <thead>
          <tr style="border-bottom: 2px solid var(--border); text-align: left; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 0.85rem 1.15rem;">Garrón #</th>
            <th style="padding: 0.85rem 1.15rem;">Categoría</th>
            <th style="padding: 0.85rem 1.15rem; text-align: right;">Kilos Despachados</th>
            <th style="padding: 0.85rem 1.15rem; text-align: left;">Destino</th>
            <th style="padding: 0.85rem 1.15rem; text-align: center;">Hora Despacho</th>
          </tr>
        </thead>
        <tbody style="font-weight: 600; color: var(--text-main);">
          ${F.map(e=>`
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
              <td style="padding: 0.85rem 1.15rem; font-weight: 750; color: #ffffff;">#${e.garron}</td>
              <td style="padding: 0.85rem 1.15rem; color: var(--text-muted);">${e.standardizedCategory||e.category}</td>
              <td style="padding: 0.85rem 1.15rem; text-align: right; color: #34d399; font-weight: 750; font-family: monospace;">${(e.kg||0).toFixed(1)} kg</td>
              <td style="padding: 0.85rem 1.15rem; color: var(--primary); font-weight: 700;">${e.destination||`N/A`}</td>
              <td style="padding: 0.85rem 1.15rem; text-align: center; color: var(--text-muted); font-size: 0.78rem;">${new Date(e.dispatchDate).toLocaleTimeString([],{hour:`2-digit`,minute:`2-digit`})} hs</td>
            </tr>`).join(``)}
        </tbody>
      `,e.appendChild(t),j.appendChild(e);let n=F.reduce((e,t)=>{let n=t.destination||`Otro`;return e[n]||(e[n]={count:0,kg:0}),e[n].count++,e[n].kg+=t.kg||0,e},{}),r=K(`div`,{style:`display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;`});Object.entries(n).forEach(([e,t])=>{let n=K(`div`,{classes:[`glass-card`],style:`border-left: 3px solid #10b981; padding: 0.95rem 1.15rem; border-radius: 12px; background: rgba(16, 185, 129, 0.03);`});n.innerHTML=`
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px;">${e}</div>
          <div style="font-weight: 800; font-size: 1.25rem; color: #34d399; margin: 0.25rem 0; font-family: monospace;">${t.kg.toLocaleString(void 0,{maximumFractionDigits:0})} kg</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">${t.count} piezas despachadas</div>
        `,r.appendChild(n)}),j.appendChild(r)}if(k.appendChild(A),k.appendChild(j),h.appendChild(k),n.length===0&&l.kg===0){let t=K(`div`,{classes:[`alert`,`info`],text:`No hay datos operacionales suficientes para desplegar el análisis gráfico.`});h.appendChild(t),e.appendChild(h);return}let{trendsMap:I={},catDistributionMap:te={},entityMap:L={}}=c||{},R=Object.keys(I).sort((e,t)=>new Date(e)-new Date(t)),z=K(`div`,{classes:[`chart-grid`],style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 2rem; margin-bottom: 2rem;`});z.appendChild(K(`div`,{classes:[`chart-container`,`glass-card`],style:`padding: 1.5rem; border-radius: 20px;`,html:`<h3 style="margin: 0 0 1.25rem 0; font-size: 1.05rem; font-weight: 750;">📈 Tendencias de Precio y Rendimiento</h3><div class="canvas-holder" style="height: 300px; position: relative;"><canvas id="trendChart"></canvas></div>`})),z.appendChild(K(`div`,{classes:[`chart-container`,`glass-card`],style:`padding: 1.5rem; border-radius: 20px;`,html:`<h3 style="margin: 0 0 1.25rem 0; font-size: 1.05rem; font-weight: 750;">🍰 Mix de Categorías Compradas (Kilos)</h3><div class="canvas-holder" style="height: 300px; position: relative;"><canvas id="categoryChart"></canvas></div>`})),z.appendChild(K(`div`,{classes:[`chart-container`,`glass-card`],style:`padding: 1.5rem; border-radius: 20px;`,html:`<h3 style="margin: 0 0 1.25rem 0; font-size: 1.05rem; font-weight: 750;">🔝 Top 5 Productores (Kilos)</h3><div class="canvas-holder" style="height: 300px; position: relative;"><canvas id="topProducersChart"></canvas></div>`})),z.appendChild(K(`div`,{classes:[`chart-container`,`glass-card`],style:`padding: 1.5rem; border-radius: 20px;`,html:`<h3 style="margin: 0 0 1.25rem 0; font-size: 1.05rem; font-weight: 750;">🤝 Top 5 Comisionistas (Kilos)</h3><div class="canvas-holder" style="height: 300px; position: relative;"><canvas id="topAgentsChart"></canvas></div>`})),h.appendChild(z);let B=(e,t)=>{let n=Object.keys(L).filter(t=>L[t].type===e).map(e=>({name:e,avg:L[e].totalYield/L[e].count,min:L[e].minYield,max:L[e].maxYield,count:L[e].count})).sort((e,t)=>t.avg-e.avg);return n.length===0?``:`
        <div class="ranking-card glass-card" style="padding: 1.75rem 2rem; border-radius: 22px;">
          <h3 style="margin-top: 0; margin-bottom: 1.25rem; font-size: 1.1rem; font-weight: 750; color: var(--text-main);">🏆 ${t}</h3>
          <div class="table-responsive" style="background: rgba(0,0,0,0.12); border: 1px solid var(--border); border-radius: 16px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border); color: var(--text-muted); text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 0.85rem 1rem;">Nombre</th>
                  <th style="padding: 0.85rem 1rem; text-align: center;">Viajes</th>
                  <th style="padding: 0.85rem 1rem; text-align: right; color: #f87171;">Mín</th>
                  <th style="padding: 0.85rem 1rem; text-align: right; color: #34d399;">Máx</th>
                  <th style="padding: 0.85rem 1rem; text-align: right; font-weight: 800;">Promedio</th>
                </tr>
              </thead>
              <tbody style="font-weight: 650; color: var(--text-main);">
                ${n.map(e=>`
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);" class="ranking-row-hover">
                    <td style="padding: 0.85rem 1rem; font-weight: 700; color: #ffffff;">${e.name}</td>
                    <td style="padding: 0.85rem 1rem; text-align: center; color: var(--text-muted);">${e.count}</td>
                    <td style="padding: 0.85rem 1rem; text-align: right; color: rgba(248, 113, 113, 0.8); font-family: monospace;">${e.min.toFixed(2)}%</td>
                    <td style="padding: 0.85rem 1rem; text-align: right; color: rgba(52, 211, 153, 0.8); font-family: monospace;">${e.max.toFixed(2)}%</td>
                    <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 800; color: #34d399; font-family: monospace;">${e.avg.toFixed(2)}%</td>
                  </tr>
                `).join(``)}
              </tbody>
            </table>
          </div>
        </div>`};h.appendChild(K(`div`,{style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 2rem; margin-top: 1.5rem;`,html:B(`AGENT`,`Ranking de Comisionistas`)+B(`PRODUCER`,`Ranking de Productores`)})),e.appendChild(h),setTimeout(()=>{let e=document.body.classList.contains(`dark`)||!0,t=e?`#a1a1aa`:`#71717a`,n=e?`rgba(255, 255, 255, 0.05)`:`rgba(0, 0, 0, 0.08)`,r=[`#841d1d`,`#10b981`,`#3b82f6`,`#f59e0b`,`#8b5cf6`,`#ec4899`,`#06b6d4`],i=(e,t)=>{try{let n=document.getElementById(e);return n?(qe[e]&&qe[e].destroy(),qe[e]=new ee(n,t),qe[e]):null}catch(t){return console.error(`Error chart ${e}:`,t),null}};i(`trendChart`,{type:`line`,data:{labels:R,datasets:[{label:`Precio Promedio ($)`,data:R.map(e=>I[e].totalPrice/I[e].count),borderColor:`#841d1d`,backgroundColor:`rgba(132, 29, 29, 0.1)`,yAxisID:`y`,tension:.3,fill:!0},{label:`Rendimiento (%)`,data:R.map(e=>I[e].totalYield/I[e].count),borderColor:`#10b981`,yAxisID:`y1`,tension:.3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{labels:{color:t,font:{weight:`600`}}}},scales:{x:{ticks:{color:t},grid:{color:n}},y:{type:`linear`,display:!0,position:`left`,ticks:{color:t,callback:e=>`$`+e},grid:{color:n}},y1:{type:`linear`,display:!0,position:`right`,grid:{drawOnChartArea:!1},ticks:{color:t,callback:e=>e+`%`}}}}});let a=Object.keys(te);i(`categoryChart`,{type:`doughnut`,data:{labels:a,datasets:[{data:a.map(e=>te[e].kg),backgroundColor:r,borderColor:`#18181b`,borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:`right`,labels:{color:t,font:{size:10,weight:`600`}}},tooltip:{callbacks:{label:e=>{let t=e.label||``,n=te[t];if(!n)return t;let r=n.buyPriceSum/n.count,i=parseFloat(m[t])||0;return[`${t}: ${n.kg.toLocaleString(void 0,{maximumFractionDigits:0})} kg`,`Compra Prom: $${r.toFixed(2)}`,`Venta (Config): $${i.toFixed(2)}`]}}}}}});let o=Object.keys(L).filter(e=>L[e].type===`PRODUCER`).sort((e,t)=>L[t].totalKg-L[e].totalKg).slice(0,5);i(`topProducersChart`,{type:`bar`,data:{labels:o,datasets:[{label:`Kg Totales`,data:o.map(e=>L[e].totalKg),backgroundColor:`#3b82f6`,borderRadius:6}]},options:{indexAxis:`y`,responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:t}},y:{ticks:{color:t,font:{size:10,weight:`600`}}}}}});let s=Object.keys(L).filter(e=>L[e].type===`AGENT`).sort((e,t)=>L[t].totalKg-L[e].totalKg).slice(0,5);i(`topAgentsChart`,{type:`bar`,data:{labels:s,datasets:[{label:`Kg Totales`,data:s.map(e=>L[e].totalKg),backgroundColor:`#8b5cf6`,borderRadius:6}]},options:{indexAxis:`y`,responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:t}},y:{ticks:{color:t,font:{size:10,weight:`600`}}}}}})},150)}catch(t){console.error(`Dashboard Render Error:`,t),e.innerHTML=`<div class="alert error" style="padding: 1.5rem; border-radius: 12px; font-weight:600;">Error al cargar Dashboard: ${t.message}</div>`}}var Ye=e=>{try{let t=new(window.AudioContext||window.webkitAudioContext),n=t.createOscillator(),r=t.createGain();if(n.connect(r),r.connect(t.destination),r.gain.setValueAtTime(0,t.currentTime),r.gain.linearRampToValueAtTime(.1,t.currentTime+.01),e===`success`)n.type=`sine`,n.frequency.setValueAtTime(880,t.currentTime),r.gain.exponentialRampToValueAtTime(.01,t.currentTime+.4),n.start(),n.stop(t.currentTime+.4);else{n.type=`square`,n.frequency.setValueAtTime(220,t.currentTime),r.gain.setValueAtTime(.1,t.currentTime),n.start(),n.stop(t.currentTime+.1);let e=t.createOscillator(),i=t.createGain();e.connect(i),i.connect(t.destination),e.type=`square`,e.frequency.setValueAtTime(220,t.currentTime+.15),i.gain.setValueAtTime(.1,t.currentTime+.15),e.start(t.currentTime+.15),e.stop(t.currentTime+.25)}}catch(e){console.warn(`Audio feedback failed:`,e)}};function Xe(e,t){let n=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 1rem;`}),r=K(`div`,{classes:[`glass-card`],style:`background: var(--bg-dark); max-width: 450px; width: 100%; padding: 1.5rem; position: relative; display: flex; flex-direction: column; align-items: center;`});r.innerHTML=`
    <h3 style="margin-top: 0; margin-bottom: 1rem; text-align: center; color: white;">📷 Escáner Automático</h3>
    <div style="position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #000;">
      <video id="scanner-video" style="width: 100%; display: block; max-height: 50vh; object-fit: cover;" autoplay playsinline></video>
      <div id="scanner-reticle" style="position: absolute; inset: 0; border: 2px dashed rgba(255,255,255,0.3); margin: 20%; pointer-events: none; border-radius: 8px;"></div>
    </div>
    <canvas id="scanner-canvas" style="display: none;"></canvas>
    
    <div id="scanner-status" style="margin-top: 1rem; text-align: center; color: var(--text-muted); font-size: 0.95rem; min-height: 2.5em; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 8px; width: 100%;">
      Iniciando cámara...
    </div>
    
    <div style="margin-top: 1.5rem; display: flex; gap: 1rem; width: 100%;">
      <button id="scanner-cancel" class="btn-outline" style="flex: 1; padding: 0.8rem;">Cerrar Escáner</button>
    </div>
  `,n.appendChild(r),document.body.appendChild(n);let i=r.querySelector(`#scanner-video`),a=r.querySelector(`#scanner-canvas`),o=r.querySelector(`#scanner-status`),s=r.querySelector(`#scanner-cancel`),c=null,l=null,u=!1,d=!1,f=async()=>{try{o.textContent=`Buscando cámara trasera...`,c=await navigator.mediaDevices.getUserMedia({video:{facingMode:`environment`,width:{ideal:1280},height:{ideal:720}}}),i.srcObject=c,o.textContent=`🤖 Escaneo Automático Activo`,l=setTimeout(h,2e3)}catch{o.textContent=`❌ Error de cámara. Asegúrese de dar permisos.`,o.style.color=`#ef4444`}},p=()=>{d=!0,l&&clearTimeout(l),c&&c.getTracks().forEach(e=>e.stop())},m=()=>{p(),n.remove()};s.onclick=m;let h=async()=>{if(!(u||d)){u=!0,o.textContent=`🔍 Escaneando...`,o.style.color=`var(--text-muted)`;try{if(a.width=i.videoWidth,a.height=i.videoHeight,a.getContext(`2d`).drawImage(i,0,0,a.width,a.height),!window.Tesseract)throw Error(`Tesseract no cargado`);let n=a.toDataURL(`image/jpeg`,.8),r=((await window.Tesseract.recognize(n,`spa`)).data.text.match(/\d+/g)||[]).map(Number);if(console.log(`OCR Match Candidates:`,r),r.length<2)throw Error(`No se detectan suficientes datos. Acérquese más.`);let s=e.find(e=>{let t=parseInt(e.tropa,10),n=parseInt(e.garron,10);return r.includes(t)&&r.includes(n)});if(s)Ye(`success`),o.textContent=`✅ ENCONTRADO: Tr. ${s.tropa} - G. ${s.garron}`,o.style.color=`#10b981`,setTimeout(()=>{t(s.id),m()},1200);else throw Error(`Sin coincidencia en stock. Reintentando...`)}catch(e){e.message.includes(`Sin coincidencia`)&&Ye(`error`),o.textContent=`⏳ ${e.message}`,d||(l=setTimeout(h,1500))}finally{u=!1}}};f()}function Ze(e,t){let n=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 1rem;`}),r=K(`div`,{classes:[`glass-card`],style:`background: var(--bg-dark); max-width: 450px; width: 100%; padding: 2rem; position: relative; border: 1px solid var(--border); border-radius: 16px;`}),i=e.standardizedCategory||e.category||`OTRO`;r.innerHTML=`
    <h3 style="margin-top: 0; margin-bottom: 1.5rem; color: var(--primary);">Editar Categoría - Garrón #${e.garron}</h3>
    <div style="margin-bottom: 1.25rem;">
      <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Categoría Actual</label>
      <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-main);">${i}</div>
    </div>
    <div style="margin-bottom: 1.25rem;">
      <label for="new-cat-select" style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Nueva Categoría</label>
      <select id="new-cat-select" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: var(--text-main); font-size: 1rem; font-weight: 500;">
        ${[`NOVILLO`,`VACA`,`VAQUILLONA`,`TORO`,`OTRO`].map(e=>`<option value="${e}" ${e===i?`selected`:``}>${e}</option>`).join(``)}
      </select>
    </div>
    <div style="margin-bottom: 1.5rem;">
      <label for="cat-comment-input" style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Comentario / Motivo del Cambio</label>
      <textarea id="cat-comment-input" placeholder="Ej. Se corrigió porque figuraba Novillo en lugar de Vaquillona..." style="width: 100%; height: 100px; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: var(--text-main); font-size: 0.95rem; resize: none; box-sizing: border-box;"></textarea>
    </div>
    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
      <button id="cat-cancel-btn" class="btn btn-secondary" style="padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer;">Cancelar</button>
      <button id="cat-save-btn" class="btn btn-primary" style="padding: 0.6rem 1.2rem; border-radius: 8px; background: var(--primary); color: var(--on-primary); border: none; cursor: pointer; font-weight: 600;">Guardar</button>
    </div>
  `,n.appendChild(r),document.body.appendChild(n);let a=r.querySelector(`#new-cat-select`),o=r.querySelector(`#cat-comment-input`),s=r.querySelector(`#cat-cancel-btn`),c=r.querySelector(`#cat-save-btn`);s.onclick=()=>{document.body.removeChild(n)},c.onclick=()=>{let e=a.value,r=o.value.trim();if(!r){alert(`Por favor, ingrese un comentario o motivo para registrar el cambio.`);return}t(e,r),document.body.removeChild(n)}}function Qe(e){let t=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 1rem;`}),n=K(`div`,{classes:[`glass-card`],style:`background: var(--bg-dark); max-width: 550px; width: 100%; max-height: 85vh; display: flex; flex-direction: column; padding: 2rem; position: relative; border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);`}),r=[],i=e.createdAt?new Date(e.createdAt):null;r.push({title:`🟢 Ingreso a Frigorífico`,desc:`Tropa: ${e.tropa} | Garrón: #${e.garron} | Categoría: ${e.standardizedCategory||e.category} | Peso: ${e.kg.toFixed(1)} kg`,date:i?i.getTime():e.pdfDate?new Date(e.pdfDate+`T12:00:00`).getTime():0,dateStr:e.pdfDate||(i?i.toLocaleDateString():`N/A`)}),(e.movements||[]).forEach(t=>{t.type===`DESTINATION`?r.push({title:`🔄 Reasignación de Destino`,desc:`Destino cambiado de <strong>"${t.from}"</strong> a <strong>"${t.to}"</strong><br>Precio: $${t.price}/kg | Total: $${(e.kg*t.price).toLocaleString(void 0,{maximumFractionDigits:0})}`,date:t.date,dateStr:new Date(t.date).toLocaleString()}):t.type===`DISPATCH`?r.push({title:`🚚 Salida / Despacho`,desc:`Despachado a <strong>"${t.to}"</strong><br>Precio: $${t.price}/kg | Total: $${(e.kg*t.price).toLocaleString(void 0,{maximumFractionDigits:0})}`,date:t.date,dateStr:new Date(t.date).toLocaleString()}):r.push({title:`❄️ Movimiento de Cámara`,desc:`Trasladado de <strong>"${t.from||`Sin Asignar`}"</strong> a <strong>"${t.to}"</strong>`,date:t.date,dateStr:new Date(t.date).toLocaleString()})});let a=(e.movements||[]).some(e=>e.type===`DISPATCH`||e.type===`DESTINATION`);e.status===`DISPATCHED`&&!a&&r.push({title:`🚚 Salida / Despacho (Original)`,desc:`Despachado a <strong>"${e.destination||`Sin Destino`}"</strong>`,date:e.dispatchDate||Date.now(),dateStr:e.dispatchDate?new Date(e.dispatchDate).toLocaleString():`N/A`}),r.sort((e,t)=>e.date-t.date);let o=e.standardizedCategory||e.category||`OTRO`;n.innerHTML=`
    <h3 style="margin-top: 0; margin-bottom: 1rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
      🕒 Historial de Movimientos - Garrón #${e.garron} <span style="font-size: 0.9rem; padding: 0.2rem 0.6rem; border-radius: 12px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 700; margin-left: 0.5rem;">${o}</span>
    </h3>
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
      <div><strong>Tropa:</strong> ${e.tropa}</div>
      <div><strong>Kilos:</strong> ${e.kg.toFixed(1)} kg</div>
      <div><strong>Estado:</strong> <span style="text-transform: capitalize; color: ${e.status===`AVAILABLE`?`#10b981`:`#ef4444`}; font-weight: bold;">${e.status===`AVAILABLE`?`En Stock`:`Despachado`}</span></div>
    </div>
    <div style="flex: 1; overflow-y: auto; padding-right: 0.5rem; margin-bottom: 1.5rem;">
      <div class="timeline-container" style="position: relative; padding-left: 24px; border-left: 2px solid var(--border); margin-left: 8px;">
        ${r.map((e,t)=>`
          <div class="timeline-item" style="position: relative; margin-bottom: 1.5rem;">
            <div style="position: absolute; left: -31px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: ${t===r.length-1?`var(--primary)`:`var(--border)`}; border: 3px solid var(--bg-dark);"></div>
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500; margin-bottom: 0.25rem;">${e.dateStr}</div>
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); margin-bottom: 0.25rem;">${e.title}</div>
            <div style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.4;">${e.desc}</div>
          </div>
        `).join(``)}
      </div>
    </div>
    <div style="display: flex; justify-content: flex-end;">
      <button id="hist-close-btn" class="btn btn-secondary" style="padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">Cerrar</button>
    </div>
  `,t.appendChild(n),document.body.appendChild(t),n.querySelector(`#hist-close-btn`).onclick=()=>{document.body.removeChild(t)}}function $e(e,t,n){let r=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 1rem;`}),i=K(`div`,{classes:[`glass-card`],style:`background: var(--bg-dark); max-width: 450px; width: 100%; padding: 2rem; position: relative; border: 1px solid var(--border); border-radius: 16px;`}),a=e.destination||`Sin Destino`,o=0;if(e.movements&&e.movements.length>0){let t=e.movements.filter(e=>e.type===`DISPATCH`||e.type===`DESTINATION`).pop();t&&t.price&&(o=t.price)}i.innerHTML=`
    <h3 style="margin-top: 0; margin-bottom: 1.5rem; color: var(--primary);">✏️ Reasignar Destino - Garrón #${e.garron}</h3>
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.9rem; line-height: 1.5;">
      <div><strong>Tropa:</strong> ${e.tropa} | <strong>Peso:</strong> ${e.kg.toFixed(1)} kg</div>
      <div><strong>Categoría:</strong> ${e.standardizedCategory||e.category}</div>
      <div style="color: var(--danger); margin-top: 0.25rem;"><strong>Destino Actual:</strong> ${a} ${o>0?`($${o}/kg)`:``}</div>
    </div>
    <div style="margin-bottom: 1.25rem;">
      <label for="new-dest-input" style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Nuevo Destino / Cliente</label>
      <input type="text" id="new-dest-input" class="form-input" list="modal-clients-list" style="width: 100%; box-sizing: border-box;" placeholder="Buscar o ingresar carnicería..." value="">
      <datalist id="modal-clients-list">
        ${(t||[]).map(e=>`<option value="${e.name}">`).join(``)}
      </datalist>
    </div>
    <div style="margin-bottom: 1.5rem;">
      <label for="new-price-input" style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Nuevo Precio por Kg ($/kg)</label>
      <input type="number" id="new-price-input" class="form-input" style="width: 100%; box-sizing: border-box;" placeholder="Ingresar precio por kg..." value="${o>0?o:``}">
    </div>
    <div style="margin-bottom: 1.5rem; text-align: right; font-weight: bold; font-size: 1.05rem; display: none;" id="estimated-debt-wrap">
      Deuda a transferir: <span style="color: #10b981;" id="estimated-debt-val">$0</span>
    </div>
    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
      <button id="dest-cancel-btn" class="btn btn-secondary" style="padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer;">Cancelar</button>
      <button id="dest-save-btn" class="btn btn-primary" style="padding: 0.6rem 1.2rem; border-radius: 8px; background: var(--primary); color: var(--on-primary); border: none; cursor: pointer; font-weight: 600;">Confirmar Cambio</button>
    </div>
  `,r.appendChild(i),document.body.appendChild(r);let s=i.querySelector(`#new-dest-input`),c=i.querySelector(`#new-price-input`),l=i.querySelector(`#estimated-debt-wrap`),u=i.querySelector(`#estimated-debt-val`),d=i.querySelector(`#dest-cancel-btn`),f=i.querySelector(`#dest-save-btn`),p=()=>{let t=parseFloat(c.value);!isNaN(t)&&t>0?(u.textContent=`$${(e.kg*t).toLocaleString(void 0,{maximumFractionDigits:0})}`,l.style.display=`block`):l.style.display=`none`};c.addEventListener(`input`,p),p(),d.onclick=()=>{document.body.removeChild(r)},f.onclick=()=>{let t=s.value.trim(),i=parseFloat(c.value);if(!t){alert(`Por favor, ingrese un nuevo destino/cliente.`);return}if(isNaN(i)||i<=0){alert(`Por favor, ingrese un precio por kg válido.`);return}if(t.toLowerCase()===a.toLowerCase()){alert(`El nuevo destino es idéntico al actual.`);return}confirm(`¿Confirmar reasignación de Garrón #${e.garron} a "${t}"?\n\nLa transacción contable se transferirá automáticamente de "${a}" a "${t}" por un monto de $${(e.kg*i).toLocaleString(void 0,{maximumFractionDigits:0})}.`)&&(document.body.removeChild(r),n(e.id,t,i))}}function et(e,t){let{state:n,stockItems:r,historyItems:i,faenaStockSummary:a,allTropas:o=[],finishedTropas:s=[],onTabSwitch:c,onToggleSelection:l,onSelectAll:u,onClearSelection:d,onDestinationInput:f,onDispatch:p,onFilterChange:m,onToggleSort:h,onStockSearch:g,onCategoryChange:_,onTropaChange:v,onCategoryPriceInput:y=()=>{},onEditCategory:b=()=>{}}=t,x=document.activeElement?document.activeElement.id:null,S=document.activeElement?document.activeElement.selectionStart:null,C=document.activeElement?document.activeElement.selectionEnd:null;e.innerHTML=``;let w=K(`div`,{classes:[`dashboard`,`fade-in`]}),T=K(`div`,{classes:[`dashboard-header`],style:`display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;`}),E=K(`div`,{style:`display: flex; align-items: center; gap: 0.75rem;`});E.innerHTML=`
    <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard" style="margin: 0; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
      <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: var(--text-main);"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <div>
      <h2 style="margin: 0; font-size: 1.5rem;">🥩 Control de Faena e Inventario</h2>
      <p style="margin: 0.1rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Gestión de stock, cámaras de frío y despachos.</p>
    </div>
  `,E.querySelector(`#back-to-dash`).onclick=t.onBack,T.appendChild(E);let D=K(`div`,{style:`display: flex; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.35rem; gap: 0.25rem;`}),O=e=>`
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: ${e?`700`:`500`};
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: ${e?`var(--primary)`:`transparent`};
    color: ${e?`var(--on-primary)`:`var(--text-muted)`};
    box-shadow: ${e?`0 4px 12px rgba(132, 29, 29, 0.3)`:`none`};
  `,k=K(`button`,{style:O(n.activeTab===`STOCK`),text:`📦 Dispónible`}),A=K(`button`,{style:O(n.activeTab===`DRAFTS`),text:`📝 Preparaciones`}),j=K(`button`,{style:O(n.activeTab===`HISTORY`),text:`📜 Historial`}),M=K(`button`,{style:O(n.activeTab===`ACHURAS`),text:`🥩 Achuras`});k.onclick=()=>c(`STOCK`),A.onclick=()=>c(`DRAFTS`),j.onclick=()=>c(`HISTORY`),M.onclick=()=>c(`ACHURAS`),D.appendChild(k),D.appendChild(A),D.appendChild(j),D.appendChild(M),T.appendChild(D),w.appendChild(T);let ee=K(`div`,{style:`display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border);`}),N=K(`div`,{style:`display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;`});N.innerHTML=`<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; min-width: 60px;">Filtro:</span>`;let P=[`ALL`,`NOVILLO`,`VACA`,`VAQUILLONA`,`TORO`,`OTRO`],F={ALL:`Todas`,NOVILLO:`Novillo`,VACA:`Vaca`,VAQUILLONA:`Vaquillona`,TORO:`Toro`,OTRO:`Otro`};P.forEach(e=>{let t=n.categoryFilter===e,r=K(`button`,{classes:[`filter-chip`],text:F[e],style:`
        padding: 0.4rem 1rem; 
        border-radius: 20px; 
        font-size: 0.85rem; 
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid ${t?`var(--primary)`:`var(--border)`};
        background: ${t?`var(--primary)`:`transparent`};
        color: ${t?`var(--on-primary)`:`var(--text-main)`};
      `});r.onclick=()=>_(e),N.appendChild(r)}),ee.appendChild(N);let I=K(`div`,{style:`display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;`});I.innerHTML=`<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; min-width: 60px;">Cámara:</span>`;let te=K(`div`,{style:`display: flex; gap: 0.5rem; flex-wrap: wrap; overflow-x: auto;`}),L=K(`button`,{text:`Todas`,style:`padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${n.camaraFilter===`ALL`?`var(--primary)`:`var(--border)`}; background: ${n.camaraFilter===`ALL`?`var(--primary)`:`transparent`}; color: ${n.camaraFilter===`ALL`?`var(--on-primary)`:`var(--text-main)`}; cursor: pointer; transition: all 0.15s;`});L.onclick=()=>t.onCamaraChange(`ALL`),te.appendChild(L),(t.camarasList||[]).forEach(e=>{let r=typeof e==`string`?e:e.name,i=typeof e==`object`&&e.capacity?e.capacity:0,a=t.camaraOccupancy[r]||0,o=r;i>0?o+=` (${a}/${i})`:o+=` (${a})`;let s=i>0&&a>i,c=n.camaraFilter===r,l=K(`button`,{text:o,style:`padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${c?`var(--primary)`:s?`var(--danger)`:`var(--border)`}; background: ${c?`var(--primary)`:s?`rgba(239,68,68,0.1)`:`transparent`}; color: ${c?`var(--on-primary)`:s?`var(--danger)`:`var(--text-main)`}; cursor: pointer; transition: all 0.15s; font-weight: ${s?`600`:`400`}`});l.onclick=()=>t.onCamaraChange(r),te.appendChild(l)}),I.appendChild(te),ee.appendChild(I);let R=K(`div`,{style:`display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;`});R.innerHTML=`<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; min-width: 60px;">Tropa:</span>`;let z=K(`div`,{style:`display: flex; gap: 0.5rem; flex-wrap: wrap; overflow-x: auto;`}),B=K(`button`,{text:`Todas`,style:`padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${n.tropaFilter===`ALL`?`var(--primary)`:`var(--border)`}; background: ${n.tropaFilter===`ALL`?`var(--primary)`:`transparent`}; color: ${n.tropaFilter===`ALL`?`var(--on-primary)`:`var(--text-main)`}; cursor: pointer; transition: all 0.15s;`});B.onclick=()=>v(`ALL`),z.appendChild(B);let V=o.filter(e=>s.includes(e));if(o.filter(e=>!s.includes(e)).forEach(e=>{let t=n.tropaFilter===e,r=K(`button`,{text:`Tr. ${e}`,style:`padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${t?`var(--primary)`:`var(--border)`}; background: ${t?`var(--primary)`:`transparent`}; color: ${t?`var(--on-primary)`:`var(--text-main)`}; cursor: pointer; transition: all 0.15s;`});r.onclick=()=>{c(`STOCK`),v(e)},z.appendChild(r)}),V.length>0){let e=document.createElement(`select`),t=V.includes(n.tropaFilter);e.style.padding=`0.3rem 0.85rem`,e.style.borderRadius=`20px`,e.style.fontSize=`0.78rem`,e.style.cursor=`pointer`,e.style.transition=`all 0.15s`,t?(e.style.border=`1px solid var(--primary)`,e.style.background=`var(--primary)`,e.style.color=`var(--on-primary)`,e.style.fontWeight=`600`):(e.style.border=`1px solid #10b981`,e.style.background=`rgba(16,185,129,0.1)`,e.style.color=`#10b981`,e.style.fontWeight=`400`),e.innerHTML=`
      <option value="" style="background: var(--bg-dark); color: var(--text-main); font-weight: normal;">
        ${t?`Tr. ${n.tropaFilter} ✓`:`✓ Finalizadas...`}
      </option>
      ${V.map(e=>`
        <option value="${e}" ${n.tropaFilter===e?`selected`:``} style="background: var(--bg-dark); color: #10b981; font-weight: 600;">
          Tr. ${e} ✓
        </option>
      `).join(``)}
    `,e.onchange=e=>{e.target.value&&(c(`HISTORY`),v(e.target.value))},z.appendChild(e)}R.appendChild(z),ee.appendChild(R),w.appendChild(ee);let{stockTotals:H,dispatchSummary:U,groupedDrafts:ne,achurasTotals:re}=a;if(n.activeTab===`STOCK`){if(t.unassignedCount>0){let e=K(`div`,{style:`background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;`});e.innerHTML=`
        <span style="font-size: 1.5rem;">⚠️</span>
        <div>
          <div style="font-weight: 700; color: var(--danger); font-size: 0.95rem;">Reses sin cámara asignada</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Hay ${t.unassignedCount} medias reses que no se encuentran especificadas en ninguna cámara.</div>
        </div>
      `,w.appendChild(e)}if(s.length>0){let e=K(`div`,{style:`background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;`});e.innerHTML=`
        <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
          <span style="font-size: 1.5rem;">✅</span>
          <div>
            <div style="font-weight: 700; color: #10b981; font-size: 0.95rem;">Tropas Finalizadas: ${s.length}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Todos sus garrones fueron despachados.</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          ${s.map(e=>`<span style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.4); border-radius: 8px; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 600;">Tr. ${e}</span>`).join(``)}
        </div>
      `,w.appendChild(e)}let e=K(`div`,{classes:[`stats-grid`]}),i=(t,n,r)=>{e.appendChild(K(`div`,{classes:[`stat-card`,`glass-card`],html:`<h3>${t}</h3><div class="stat-value">${n}</div><div class="stat-subtitle">${r}</div>`}))};if(i(`Total Reses`,H.count,`${H.kg.toFixed(1)} kg Colgados`),Object.keys(H.byCategory).forEach(e=>{i(`Stock ${e}`,H.byCategory[e].count,`${H.byCategory[e].kg.toFixed(1)} kg`)}),w.appendChild(e),n.selectedIds.size>0){let{selectedItems:e,selKg:r,byCategory:i,catEntries:a,multiCat:o,grandTotal:s}=U,c=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 2rem; border-left: 4px solid #ef4444; padding: 1.5rem;`}),l=K(`div`,{style:`display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;`});l.innerHTML=`<h3 style="color: #ef4444; margin: 0;">📦 Preparando Despacho: ${e.length} piezas (${r.toFixed(1)} kg)</h3>`;let u=K(`button`,{classes:[`btn-outline`],text:`Limpiar Selección`,style:`font-size: 0.8rem; padding: 0.2rem 0.6rem;`});u.onclick=()=>d(),l.appendChild(u),c.appendChild(l);let m=K(`div`,{style:`margin-bottom: 1.25rem;`});m.innerHTML=`
        <label style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">Destino / Cliente</label>
        <input type="text" id="dispatch-dest" class="form-input" list="clients-list" style="width: 100%; max-width: 400px;" placeholder="Ej: Carnicería Centro" value="${n.destinationInput}">
        <datalist id="clients-list">
          ${(t.clients||[]).map(e=>`<option value="${e.name}">`).join(``)}
        </datalist>
      `,c.appendChild(m);let h=K(`div`,{style:`margin-bottom: 1.25rem;`});if(o){h.innerHTML=`<div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 600;">Precio por Categoría</div>`;let e=K(`div`,{style:`display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.5rem; align-items: center;`});e.innerHTML=`
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; padding: 0 0.5rem;">Categoría</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; padding: 0 0.5rem;">Kg totales</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; padding: 0 0.5rem;">$/kg</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; padding: 0 0.5rem;">Subtotal</div>
        `,a.forEach(([t,r])=>{let i=n.categoryPriceInputs?.[t]||``,a=r.kg*(parseFloat(i)||0);e.innerHTML+=`
            <div style="padding: 0.4rem 0.5rem; font-weight: 600; color: var(--text-main);">${t}</div>
            <div style="padding: 0.4rem 0.5rem; color: var(--text-muted);">${r.kg.toFixed(1)} kg <span style="font-size:0.75rem;">(${r.count} pz)</span></div>
            <div style="padding: 0.4rem 0.5rem;">
              <input type="number" class="form-input cat-price-input" data-cat="${t}"
                style="width: 100%; padding: 0.3rem 0.5rem; font-size: 0.85rem;"
                placeholder="$/kg" value="${i}">
            </div>
            <div style="padding: 0.4rem 0.5rem; font-weight: 700; color: #10b981;" id="subtotal-${t}">
              ${a>0?`$`+a.toLocaleString(void 0,{minimumFractionDigits:0}):`—`}
            </div>
          `}),h.appendChild(e)}else{let e=a[0][0];h.innerHTML=`
          <label style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">Precio por Kg — ${e} ($/kg)</label>
          <input type="number" class="form-input cat-price-input" data-cat="${e}"
            style="width: 100%; max-width: 200px;" placeholder="$/kg" value="${n.categoryPriceInputs?.[e]||``}">
        `}c.appendChild(h);let g=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 1rem;`}),_=K(`div`,{style:`display: flex; gap: 0.5rem; align-items: center; border-right: 1px solid var(--border); padding-right: 1rem;`});_.innerHTML=`
        <select id="move-camara-select" class="form-input" style="padding: 0.5rem; max-width: 150px;">
          <option value="">-- Mover a --</option>
          ${(t.camarasList||[]).map(e=>{let t=typeof e==`string`?e:e.name;return`<option value="${t}">${t}</option>`}).join(``)}
        </select>
        <button id="move-camara-btn" class="btn-outline" style="padding: 0.5rem 1rem; margin: 0; font-size: 0.85rem;">⮂ Mover Stock</button>
      `,g.appendChild(_);let v=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; flex: 1;`});v.innerHTML=`
        <div style="font-size: 1.1rem; font-weight: 600;">
          Total Estimado: <span style="color: #10b981;" id="grand-total-disp">$${s.toLocaleString(void 0,{minimumFractionDigits:0})}</span>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button id="cancel-dispatch-btn" class="btn-outline" style="border-radius: 12px; padding: 0.6rem 1.2rem; font-weight: 600; font-size: 0.9rem;">✕ Cancelar</button>
          <button id="print-dispatch-btn" class="btn-secondary" style="background: #3b82f6; color: white; border: none; border-radius: 12px; padding: 0.6rem 1.2rem; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: background 0.2s;">🖨️ Imprimir</button>
          <button id="dispatch-btn" class="btn-primary" style="background: #ef4444; border: none; border-radius: 12px; padding: 0.6rem 1.2rem; font-weight: 700; cursor: pointer; font-size: 0.9rem;">🚚 Salida Definitiva</button>
        </div>
      `,g.appendChild(v),c.appendChild(g),w.appendChild(c),c.querySelector(`#move-camara-btn`).onclick=()=>{let e=c.querySelector(`#move-camara-select`).value;e?t.onMoveToCamara(e):alert(`Selecciona una cámara destino`)},c.querySelector(`#dispatch-dest`).addEventListener(`input`,e=>f(e.target.value)),c.querySelector(`#cancel-dispatch-btn`).onclick=()=>d(),c.querySelector(`#dispatch-btn`).onclick=()=>p(),c.querySelector(`#print-dispatch-btn`).onclick=()=>{let i=0,o={};a.forEach(([e,t])=>{let r=parseFloat(n.categoryPriceInputs?.[e])||0;o[e]={kg:t.kg,price:r,subtotal:t.kg*r},i+=t.kg*r});let s=(t.clients||[]).find(e=>e.name.trim().toLowerCase()===n.destinationInput.trim().toLowerCase())||{name:n.destinationInput};Pe({selectedItems:e,client:s,grandTotal:i,totalKg:r,byCategory:o})},c.querySelectorAll(`.cat-price-input`).forEach(e=>{e.addEventListener(`input`,e=>{let t=e.target.dataset.cat,n=e.target.value;y(t,n);let r=i[t];if(r){let e=r.kg*(parseFloat(n)||0),i=c.querySelector(`#subtotal-${t}`);i&&(i.textContent=e>0?`$`+e.toLocaleString(void 0,{minimumFractionDigits:0}):`—`)}let a=0;c.querySelectorAll(`.cat-price-input`).forEach(e=>{let t=e.dataset.cat,n=parseFloat(e.value)||0;a+=(i[t]?.kg||0)*n});let o=c.querySelector(`#grand-total-disp`);o&&(o.textContent=`$`+a.toLocaleString(void 0,{minimumFractionDigits:0}))})})}let a=K(`div`,{classes:[`glass-card`],style:`flex: 1;`}),o=K(`div`,{style:`display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap;`}),c=K(`input`,{classes:[`form-input`],style:`flex: 1; max-width: 300px; padding: 0.5rem; font-size: 0.9rem;`,attrs:{id:`stock-search`,type:`text`,placeholder:`🔎 Buscar Tropa, Garron, Kg...`,value:n.stockSearch}});c.addEventListener(`input`,e=>g(e.target.value)),o.innerHTML=`<h3 style="margin: 0; min-width: 200px;">Medias Reses en Cámara</h3>`,o.appendChild(c);let m=K(`button`,{classes:[`btn-primary`],text:`📷 Leer Tarjeta`,style:`font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 8px;`});m.onclick=()=>Xe(r,e=>{l(e)}),o.appendChild(m),o.appendChild(K(`div`,{style:`flex-grow: 1;`}));let _=K(`button`,{classes:[`btn-outline`],text:`Seleccionar Todas`,style:`font-size: 0.8rem;`});_.onclick=()=>u(r.map(e=>e.id)),o.appendChild(_),a.appendChild(o);let v=K(`div`,{classes:[`table-responsive`]}),x=document.createElement(`table`);x.className=`faena-table`,x.style.width=`100%`,x.style.borderCollapse=`collapse`,x.style.textAlign=`left`,x.innerHTML=`
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
          <th style="padding: 1rem; width: 50px;">Sel</th>
          <th id="sort-garron-stock" style="padding: 1rem; cursor: pointer; user-select: none;" title="Ordenar por Número de Garron">
            Nº Garron ${n.sortOrder===`asc`?`▲`:`▼`}
          </th>
          <th style="padding: 1rem;">Mitad (Mz)</th>
          <th style="padding: 1rem;">Categoría</th>
          <th style="padding: 1rem;">Kilos</th>
          <th style="padding: 1rem;">Cámara</th>
          <th style="padding: 1rem;">Ingreso</th>
          <th style="padding: 1rem; width: 60px; text-align: center;">Hist</th>
        </tr>
      </thead>
      <tbody id="stock-tbody"></tbody>
    `,x.querySelector(`#sort-garron-stock`).onclick=()=>h();let S=x.querySelector(`#stock-tbody`);r.length===0?S.innerHTML=`<tr><td colspan="8" style="padding: 2rem; text-align: center; color: var(--text-muted);">No hay stock disponible. Carga reportes de faena desde la pestaña Viajes.</td></tr>`:r.forEach(e=>{let t=n.selectedIds.has(e.id),r=document.createElement(`tr`);r.style.borderBottom=`1px solid var(--border)`,r.style.background=t?`rgba(239, 68, 68, 0.1)`:`transparent`,r.style.cursor=`pointer`;let i=e.camaraId?`<span style="color: var(--primary);">${e.camaraId}</span>`:`<span style="color: var(--danger); font-weight: 600;">⚠️ Sin Asignar</span>`,a=e.standardizedCategory||e.category,o=e.comments&&e.comments.length>0?e.comments[e.comments.length-1].comment:``,s=e.comments&&e.comments.length>0?e.comments.map(e=>`[${new Date(e.date).toLocaleDateString()}]: ${e.comment}`).join(`
`):``;r.innerHTML=`
          <td style="padding: 1rem;"><input type="checkbox" ${t?`checked`:``} style="transform: scale(1.2); cursor: pointer; pointer-events: none;"></td>
          <td style="padding: 1rem; font-weight: 500;">#${e.garron}</td>
          <td style="padding: 1rem;">Mitad ${e.half||`1`}</td>
          <td style="padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: space-between;">
              <span style="font-weight: 500;">${a}</span>
              <button class="edit-cat-btn" style="background: transparent; border: none; cursor: pointer; padding: 2px; display: inline-flex; align-items: center; opacity: 0.6; transition: opacity 0.2s; font-size: 0.9rem;" title="Editar Categoría">
                ✏️
              </button>
            </div>
            ${o?`
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; font-style: italic; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: help;" title="${s}">
                💬 ${o}
              </div>
            `:``}
          </td>
          <td style="padding: 1rem; font-weight: bold; color: #10b981;">${e.kg.toFixed(1)} kg</td>
          <td style="padding: 1rem; font-weight: 500;">${i}</td>
          <td style="padding: 1rem; font-size: 0.85rem; color: var(--text-muted);">${e.pdfDate} (Tr. ${e.tropa})</td>
          <td style="padding: 1rem; text-align: center;">
            <button class="btn-stock-history" style="background: transparent; border: none; cursor: pointer; font-size: 1.1rem; padding: 2px;" title="Ver historial de movimientos">🕒</button>
          </td>
        `;let c=r.querySelector(`.edit-cat-btn`);c&&(c.onclick=t=>{t.stopPropagation(),Ze(e,(t,n)=>{b(e.id,t,n)})});let u=r.querySelector(`.btn-stock-history`);u&&(u.onclick=t=>{t.stopPropagation(),Qe(e)}),r.onclick=t=>{t.target.tagName!==`INPUT`&&!t.target.closest(`.edit-cat-btn`)&&!t.target.closest(`.btn-stock-history`)?l(e.id):t.target.tagName===`INPUT`&&(t.preventDefault(),l(e.id))},S.appendChild(r)}),v.appendChild(x),a.appendChild(v),w.appendChild(a)}else if(n.activeTab===`DRAFTS`){let e=K(`div`,{classes:[`glass-card`]});e.innerHTML=`<h3 style="margin-bottom: 1rem;">Borradores Pendientes de Confirmación</h3>`,ne.length===0?e.appendChild(K(`p`,{text:`No hay borradores pendientes.`,style:`color: var(--text-muted);`})):ne.forEach(n=>{let r=K(`div`,{style:`margin-bottom: 1rem; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; background: rgba(255,255,255,0.02);`});if(r.innerHTML=`
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <h4 style="margin:0; color: var(--primary);">Destino: ${n.destination}</h4>
                <div style="font-size: 0.85rem; color: var(--text-muted);">
                  ${n.items.length} reses | ${n.totalKg.toFixed(1)} kg | Preparado: ${new Date(n.draftDate).toLocaleString()}
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                 ${t.userRole===`ADMIN`?`<button class="btn-primary confirm-group-btn">Confirmar Despacho</button>`:`<span style="color:var(--text-muted); font-size:0.85rem; padding-top:0.5rem;">Solo un Administrador puede confirmar</span>`}
                 ${t.userRole===`ADMIN`?`<button class="btn-outline revert-group-btn" style="color: var(--danger); border-color: var(--danger);">Revertir</button>`:``}
              </div>
            </div>
          `,t.userRole===`ADMIN`){let e=r.querySelector(`.confirm-group-btn`),i=r.querySelector(`.revert-group-btn`);e.onclick=()=>t.onConfirmDraft(n.items,n.destination,n.draftPrices),i.onclick=()=>{confirm(`¿Revertir TODO este borrador y devolverlo al stock disponible?`)&&n.items.forEach(e=>t.onRevertDraft(e.id))}}let i=K(`div`,{classes:[`table-responsive`]}),a=K(`table`,{style:`width: 100%; min-width: 400px; font-size: 0.9rem; border-collapse: collapse;`});a.innerHTML=`
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
               <th style="text-align: left; padding: 0.5rem;">Tropa</th>
               <th style="text-align: left; padding: 0.5rem;">Garrón</th>
               <th style="text-align: left; padding: 0.5rem;">Categoría</th>
               <th style="text-align: right; padding: 0.5rem;">Peso (Kg)</th>
            </tr>
          `,n.items.forEach(e=>{a.innerHTML+=`
               <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 0.5rem;">${e.tropa}</td>
                  <td style="padding: 0.5rem;">#${e.garron}</td>
                  <td style="padding: 0.5rem;">${e.standardizedCategory||e.category}</td>
                  <td style="padding: 0.5rem; text-align: right;">${e.kg.toFixed(1)}</td>
               </tr>
             `}),i.appendChild(a),r.appendChild(i),e.appendChild(r)}),w.appendChild(e)}else if(n.activeTab===`ACHURAS`){let e=K(`div`,{classes:[`glass-card`]});e.innerHTML=`<h3 style="margin-bottom: 1rem;">🥩 Stock de Achuras</h3>`;let r=K(`div`,{style:`display: flex; gap: 1rem; margin-bottom: 2rem;`});if(r.innerHTML=`
      <div class="stat-card glass-card" style="flex: 1;">
        <h3>Juegos Disponibles</h3>
        <div class="stat-value" style="color: #10b981;">${re}</div>
      </div>
    `,e.appendChild(r),re>0){let r=K(`div`,{style:`background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;`}),i=n.categoryPriceInputs.ACHURAS||t.categoryPrices&&t.categoryPrices.ACHURAS||``;r.innerHTML=`
        <h4 style="margin-top: 0; color: #ef4444; margin-bottom: 1rem;">🚚 Despachar Achuras</h4>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
          <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;">
            <label>Cantidad (Juegos)</label>
            <input type="number" id="achuras-qty" class="form-input" placeholder="Ej: 10" min="1" max="${re}">
          </div>
          <div class="form-group" style="flex: 2; min-width: 200px; margin: 0;">
            <label>Destino / Cliente</label>
            <input type="text" id="achuras-dest" class="form-input" list="clients-list" placeholder="Ej: Carnicería Centro">
            <datalist id="clients-list">
              ${(t.clients||[]).map(e=>`<option value="${e.name}">`).join(``)}
            </datalist>
          </div>
          <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;">
             <label>Precio por Juego ($)</label>
             <input type="number" class="form-input cat-price-input" data-cat="ACHURAS" value="${i}" placeholder="Ej: 5000">
          </div>
          <button id="dispatch-achuras-btn" class="btn-primary" style="background: #ef4444; margin: 0;">Despachar</button>
        </div>
      `,e.appendChild(r),r.querySelector(`.cat-price-input`).addEventListener(`input`,e=>{t.onCategoryPriceInput(`ACHURAS`,e.target.value)}),r.querySelector(`#dispatch-achuras-btn`).onclick=()=>{let e=parseInt(r.querySelector(`#achuras-qty`).value,10),n=r.querySelector(`#achuras-dest`).value;t.onDispatchAchuras&&t.onDispatchAchuras(e,n)}}let i=K(`div`,{style:`overflow-x: auto;`}),a=document.createElement(`table`);a.className=`faena-table`,a.style.width=`100%`,a.style.borderCollapse=`collapse`,a.innerHTML=`
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); text-align: left;">
          <th style="padding: 1rem;">Fecha Origen</th>
          <th style="padding: 1rem;">Tropa</th>
          <th style="padding: 1rem;">Stock Inicial</th>
          <th style="padding: 1rem;">Stock Disponible</th>
        </tr>
      </thead>
      <tbody>
        ${!t.achurasItems||t.achurasItems.length===0?`<tr><td colspan="4" style="padding: 2rem; text-align: center;">Sin stock de achuras.</td></tr>`:t.achurasItems.map(e=>`
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 1rem;">${e.date?new Date(e.date).toLocaleDateString():`-`}</td>
              <td style="padding: 1rem;">Tr. ${e.tropa}</td>
              <td style="padding: 1rem;">${e.initialQuantity}</td>
              <td style="padding: 1rem; color: #10b981; font-weight: bold;">${e.availableQuantity}</td>
            </tr>
          `).join(``)}
      </tbody>
    `,i.appendChild(a),e.appendChild(i),w.appendChild(e)}else{let e=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 1.5rem; display: flex; gap: 1rem;`});e.innerHTML=`
      <div class="form-group" style="flex: 1; margin: 0;">
        <label>Búsqueda General</label>
        <input type="text" id="hist-search" class="form-input" placeholder="Tropa, Garron, Kg..." value="${n.historyFilters.search||``}">
      </div>
      <div class="form-group" style="flex: 1.5; margin: 0;">
        <label>Destino / Cliente</label>
        <input type="text" id="hist-dest" class="form-input" placeholder="Buscar carnicería..." value="${n.historyFilters.destination}">
      </div>
      <div class="form-group" style="flex: 1; margin: 0;">
        <label>Fecha de Salida</label>
        <input type="date" id="hist-date" class="form-input" value="${n.historyFilters.date}">
      </div>
    `,w.appendChild(e),e.querySelector(`#hist-search`).addEventListener(`input`,e=>m(`search`,e.target.value)),e.querySelector(`#hist-dest`).addEventListener(`input`,e=>m(`destination`,e.target.value)),e.querySelector(`#hist-date`).addEventListener(`change`,e=>m(`date`,e.target.value));let r=K(`div`,{classes:[`glass-card`]});r.innerHTML=`<h3 style="margin-bottom: 1rem;">Historial Integrado</h3>`;let a=K(`div`,{style:`overflow-x: auto;`}),o=document.createElement(`table`);o.style.width=`100%`,o.style.borderCollapse=`collapse`,o.style.textAlign=`left`,o.innerHTML=`
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
          <th style="padding: 1rem;">Fecha Salida</th>
          <th style="padding: 1rem;">Destino / Cliente</th>
          <th id="sort-garron-hist" style="padding: 1rem; cursor: pointer; user-select: none;">
            Nº Garron ${n.sortOrder===`asc`?`▲`:`▼`}
          </th>
          <th style="padding: 1rem;">Mitad (Mz)</th>
          <th style="padding: 1rem;">Categoría</th>
          <th style="padding: 1rem;">Kilos</th>
          <th style="padding: 1rem; width: 100px; text-align: center;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${i.length===0?`<tr><td colspan="7" style="padding: 2rem; text-align: center; color: var(--text-muted);">No se encontraron salidas.</td></tr>`:i.map(e=>{let t=e.standardizedCategory||e.category,n=e.comments&&e.comments.length>0?e.comments[e.comments.length-1].comment:``,r=e.comments&&e.comments.length>0?e.comments.map(e=>`[${new Date(e.date).toLocaleDateString()}]: ${e.comment}`).join(`
`):``;return`
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem;">${e.dispatchDate?new Date(e.dispatchDate).toLocaleDateString():`N/A`}</td>
                <td style="padding: 1rem; font-weight: 500; color: #ef4444;">${e.destination||`Sin Destino`}</td>
                <td style="padding: 1rem;">#${e.garron}</td>
                <td style="padding: 1rem;">Mitad ${e.half||`1`}</td>
                <td style="padding: 1rem;">
                  <span style="font-weight: 500;">${t}</span>
                  ${n?`
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; font-style: italic; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: help;" title="${r}">
                      💬 ${n}
                    </div>
                  `:``}
                </td>
                <td style="padding: 1rem;">${e.kg?e.kg.toFixed(1):0} kg</td>
                <td style="padding: 1rem; text-align: center;">
                  <div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                    <button class="btn-history-timeline" data-id="${e.id}" title="Ver Historial de Movimientos" 
                      style="background: transparent; border: none; font-size: 1.1rem; cursor: pointer; padding: 2px;">🕒</button>
                    <button class="btn-edit-destination" data-id="${e.id}" title="Reasignar Destino" 
                      style="background: transparent; border: none; font-size: 1.1rem; cursor: pointer; padding: 2px;">✏️</button>
                  </div>
                </td>
              </tr>
            `}).join(``)}
      </tbody>
    `,a.appendChild(o),o.querySelector(`#sort-garron-hist`).onclick=()=>h(),o.querySelectorAll(`.btn-history-timeline`).forEach(e=>{e.onclick=t=>{t.stopPropagation();let n=e.getAttribute(`data-id`),r=i.find(e=>e.id===n);r&&Qe(r)}}),o.querySelectorAll(`.btn-edit-destination`).forEach(e=>{e.onclick=n=>{n.stopPropagation();let r=e.getAttribute(`data-id`),a=i.find(e=>e.id===r);a&&$e(a,t.clients,t.onUpdateDestination)}}),r.appendChild(a),w.appendChild(r)}if(e.appendChild(w),x){let e=document.getElementById(x);e&&(e.focus(),S!==null&&C!==null&&(e.type===`text`||e.type===`search`)&&e.setSelectionRange(S,C))}}function tt(e,t){let n=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;`}),r=K(`div`,{classes:[`modal`,`glass-card`],style:`max-width: 500px; width: 100%; padding: 2rem;`}),i=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;`});i.innerHTML=`
    <h3 style="margin: 0; color: var(--primary);">Detalle de Movimiento</h3>
    <button class="close-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">&times;</button>
  `;let a=new Date(e.date||e.createdAt).toLocaleDateString(`es-AR`),o=e.description||(e.type===`DEBT`?`Despacho`:`Pago`),s=K(`div`,{style:`margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;`});s.innerHTML=`
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: var(--text-muted);">Fecha:</span>
      <span style="font-weight: 500;">${a}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: var(--text-muted);">Concepto:</span>
      <span style="font-weight: 500; text-align: right;">${o}</span>
    </div>
  `;let c=K(`div`),l=``,{totalWeight:u,totalPrice:d}=t.getTransactionDetailSummary(e),f=t.getWhatsAppText(e);l=e.breakout&&e.breakout.length>0?`
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
            <th style="padding: 0.5rem;">Garrón</th>
            <th style="padding: 0.5rem; text-align: right;">Peso (kg)</th>
            <th style="padding: 0.5rem; text-align: right;">Precio/kg</th>
            <th style="padding: 0.5rem; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${e.breakout.map(e=>{let t=Number(e.weight)||0,n=Number(e.total)||0;return`
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 0.5rem;">#${e.garron}</td>
          <td style="padding: 0.5rem; text-align: right;">${t}</td>
          <td style="padding: 0.5rem; text-align: right;">$${e.price}</td>
          <td style="padding: 0.5rem; text-align: right; color: #ef4444; font-weight: 500;">$${n.toLocaleString()}</td>
        </tr>
      `}).join(``)}
        </tbody>
        <tfoot>
          <tr style="border-top: 2px solid var(--border); font-weight: bold;">
            <td style="padding: 0.5rem;">TOTAL</td>
            <td style="padding: 0.5rem; text-align: right;">${u.toFixed(1)} kg</td>
            <td style="padding: 0.5rem;"></td>
            <td style="padding: 0.5rem; text-align: right; color: #ef4444;">$${d.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    `:`<p style="color: var(--text-muted);">No hay detalles desglosados para este movimiento.</p>`,c.innerHTML=l;let p=K(`div`,{style:`display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;`});p.innerHTML=`
    <button class="btn-outline print-btn" style="display: flex; align-items: center; gap: 0.5rem;">
      🖨️ Imprimir
    </button>
    <button class="btn-outline wa-btn" style="display: flex; align-items: center; gap: 0.5rem; color: #25D366; border-color: rgba(37,211,102,0.3);">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      WhatsApp
    </button>
    <button class="btn-primary close-modal-btn" style="padding: 0.5rem 1.5rem;">Cerrar</button>
  `,r.appendChild(i),r.appendChild(s),r.appendChild(c),r.appendChild(p),n.appendChild(r),document.body.appendChild(n);let m=()=>document.body.removeChild(n);i.querySelector(`.close-btn`).onclick=m,p.querySelector(`.close-modal-btn`).onclick=m,n.onclick=e=>{e.target===n&&m()},p.querySelector(`.wa-btn`).onclick=()=>{window.open(`https://wa.me/?text=${encodeURIComponent(f)}`,`_blank`)},p.querySelector(`.print-btn`).onclick=()=>{let t=window.open(``,`_blank`,`width=400,height=600`),n=``;e.breakout&&e.breakout.length>0&&(n=e.breakout.map(e=>`
        <tr>
          <td>#${e.garron}</td>
          <td style="text-align:right;">${e.weight}kg</td>
          <td style="text-align:right;">$${e.price}</td>
          <td style="text-align:right;">$${Number(e.total).toLocaleString()}</td>
        </tr>
      `).join(``),n+=`
        <tr style="font-weight:bold; border-top:1px solid #000;">
          <td>TOTAL</td>
          <td style="text-align:right;">${u.toFixed(1)}kg</td>
          <td></td>
          <td style="text-align:right;">$${d.toLocaleString()}</td>
        </tr>
      `),t.document.write(`
      <html>
      <head>
        <title>Detalle de Movimiento</title>
        <style>
          body { font-family: monospace; padding: 20px; color: #000; font-size: 14px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .info { margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 4px 0; border-bottom: 1px dotted #ccc; }
          @media print { @page { margin: 0; } body { padding: 10px; } }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <h2>DETALLE DE MOVIMIENTO</h2>
        </div>
        <div class="info">
          <div><strong>Fecha:</strong> ${a}</div>
          <div><strong>Concepto:</strong> ${o}</div>
        </div>
        ${e.breakout&&e.breakout.length>0?`
          <table>
            <thead>
              <tr>
                <th style="text-align:left;">Garrón</th>
                <th style="text-align:right;">Peso</th>
                <th style="text-align:right;">$/kg</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${n}
            </tbody>
          </table>
        `:`<p>Monto: $${(e.amount||0).toLocaleString()}</p>`}
      </body>
      </html>
    `),t.document.close()}}function nt(e,t,n){let r=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;`}),i=K(`div`,{classes:[`modal`,`glass-card`],style:`max-width: 400px; padding: 2rem;`}),a=new Date().toISOString().split(`T`)[0],o=new Date;o.setMonth(o.getMonth()-1),i.innerHTML=`
    <h3 style="margin-bottom: 1.5rem;">🖨️ Opciones de Impresión</h3>
    <form id="print-form">
      <div class="form-group">
        <label>Desde</label>
        <input type="date" id="print-from" class="form-input" value="${o.toISOString().split(`T`)[0]}">
      </div>
      <div class="form-group">
        <label>Hasta</label>
        <input type="date" id="print-to" class="form-input" value="${a}">
      </div>
      <div class="form-group">
        <label>Formato de Impresión</label>
        <select id="print-format" class="form-input">
          <option value="standard">📄 A4 (Estándar)</option>
          <option value="thermal">🧾 Térmico (80mm)</option>
        </select>
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <button type="button" class="btn-cancel" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-main); cursor: pointer;">Cancelar</button>
        <button type="submit" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: none; background: var(--primary); color: var(--on-primary); cursor: pointer;">Imprimir</button>
      </div>
    </form>
  `,r.appendChild(i),document.body.appendChild(r);let s=i.querySelector(`#print-form`);s.onsubmit=t=>{t.preventDefault();let a=new Date(i.querySelector(`#print-from`).value+`T00:00:00`).getTime(),o=new Date(i.querySelector(`#print-to`).value+`T23:59:59`).getTime(),s=i.querySelector(`#print-format`).value;rt(e,n.getTransactionsForRange(a,o),n.getBalanceForward(a),{format:s,fromDate:new Date(a),toDate:new Date(o)}),r.remove()},i.querySelector(`.btn-cancel`).onclick=()=>r.remove()}function rt(e,t,n,r){let{format:i,fromDate:a,toDate:o}=r,s=i===`thermal`,c=window.open(``,`_blank`,`width=800,height=900`),l=a.toLocaleDateString(`es-AR`),u=o.toLocaleDateString(`es-AR`),d=new Date().toLocaleString(`es-AR`),f=n,p=t.map(e=>{let t=e.type===`DEBT`,n=e.amount||0;f+=t?n:-n;let r=``;return e.breakout&&e.breakout.length>0&&(r=`
        <div class="breakout-rows">
          ${e.breakout.map(e=>`• G#${e.garron}: ${e.weight}kg @ $${e.price} = $${e.total.toLocaleString()}`).join(`<br>`)}
        </div>
      `),`
      <tr class="tx-row">
        <td>${new Date(e.date||e.createdAt).toLocaleDateString(`es-AR`)}</td>
        <td>
          <div style="font-weight: 600;">${e.description||(t?`Despacho`:`Pago`)}</div>
          ${r}
        </td>
        <td class="amount ${t?`debe`:``}">${t?n.toLocaleString():`-`}</td>
        <td class="amount ${t?``:`haber`}">${t?`-`:n.toLocaleString()}</td>
        <td class="amount balance">${f.toLocaleString()}</td>
      </tr>
    `}).join(``),m=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Estado de Cuenta - ${e.name}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: ${s?`10px`:`40px`}; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: ${s?`300px`:`800px`}; margin: 0 auto; border: ${s?`none`:`1px solid #eee`}; padding: ${s?`0`:`30px`}; border-radius: 8px; }
        .header { display: flex; flex-direction: ${s?`column`:`row`}; justify-content: space-between; align-items: ${s?`center`:`flex-start`}; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { width: ${s?`80px`:`120px`}; height: auto; object-fit: contain; }
        .company-name { font-size: ${s?`18px`:`24px`}; font-weight: 800; margin: 5px 0; }
        .client-info { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .table { width: 100%; border-collapse: collapse; font-size: ${s?`11px`:`13px`}; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 8px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .debe { color: #d32f2f; }
        .haber { color: #2e7d32; }
        .balance { font-weight: bold; }
        .breakout-rows { font-size: 0.85em; color: #555; margin-top: 4px; border-left: 2px solid #ddd; padding-left: 8px; line-height: 1.2; }
        .summary-box { margin-top: 30px; border-top: 2px solid #000; padding-top: 15px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600; }
        .disclaimer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px dotted #ccc; padding-top: 15px; }
        @media print { body { padding: 0; } .receipt-card { border: none; max-width: 100%; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="receipt-card">
        <div class="header">
          <div style="display:flex; flex-direction:column; align-items:${s?`center`:`flex-start`};">
            <img src="/logo.jpg" class="logo">
            <div class="company-name">FRIGORÍFICO PAMPA</div>
          </div>
          <div style="text-align: ${s?`center`:`right`}; margin-top: ${s?`10px`:`0`};">
            <div style="font-weight: bold; font-size: 1.1em;">ESTADO DE CUENTA</div>
            <div style="font-size: 0.9em;">Periodo: ${l} al ${u}</div>
            <div style="font-size: 0.8em; color: #666;">Emisión: ${d}</div>
          </div>
        </div>

        <div class="client-info">
          <div style="font-weight: 800; font-size: 1.2em;">${e.name}</div>
          <div style="font-size: 0.9em;">${e.address||``}</div>
          <div style="font-size: 0.9em;">CUIT: ${e.cuit||`N/A`}</div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th style="text-align:right;">Debe</th>
              <th style="text-align:right;">Haber</th>
              <th style="text-align:right;">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #fcfcfc; font-style: italic;">
              <td>${l}</td>
              <td>SALDO ANTERIOR (Balance forward)</td>
              <td style="text-align:right;">${n>0?n.toLocaleString():`-`}</td>
              <td style="text-align:right;">${n<0?Math.abs(n).toLocaleString():`-`}</td>
              <td style="text-align:right; font-weight:bold;">${n.toLocaleString()}</td>
            </tr>
            ${p}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-row">
            <span>Saldo Final</span>
            <span style="font-size: 1.3em; color: ${f>0?`#d32f2f`:`#2e7d32`}">$${f.toLocaleString()}</span>
          </div>
        </div>

        <div class="disclaimer">
          ⚠️ DOCUMENTO DE CONTROL INTERNO - NO VÁLIDO COMO FACTURA<br>
          FRIGORÍFICO PAMPA - GRACIAS POR SU CONFIANZA
        </div>
      </div>
    </body>
    </html>
  `;c.document.write(m),c.document.close()}function it(e,t,n=`CLIENT`){let r=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;`}),i=K(`div`,{classes:[`modal`,`glass-card`],style:`max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem; border-radius: 16px; box-sizing: border-box;`}),a=!!e,o=n===`OPERATOR`?`Operador`:`Cliente`;i.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; color: var(--primary);">${a?`Editar `+o:`Añadir Nuevo `+o}</h3>
      <button class="close-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <div class="form-group"><label>Nombre o Razón Social</label><input type="text" id="m-client-name" class="form-input" value="${e?.name||``}"></div>
    <div class="form-group"><label>CUIT</label><input type="text" id="m-client-cuit" class="form-input" value="${e?.cuit||``}"></div>
    <div class="form-group"><label>Dirección</label><input type="text" id="m-client-address" class="form-input" value="${e?.address||``}"></div>
    <div class="form-group"><label>Teléfono</label><input type="text" id="m-client-phone" class="form-input" value="${e?.phone||``}"></div>
    <div class="form-group"><label>CBU (Opcional)</label><input type="text" id="m-client-cbu" class="form-input" value="${e?.cbu||``}"></div>
    <div class="form-group"><label>Cuenta Contable / Alias</label><input type="text" id="m-client-account" class="form-input" value="${e?.account||``}"></div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; border-top: 1px dashed var(--border); padding-top: 1rem;">
      <div class="form-group" style="margin: 0;">
        <label>Límite de Crédito ($)</label>
        <input type="number" id="m-client-credit-limit" class="form-input" placeholder="Ej: 500000" min="0" value="${e?.creditLimit!==void 0&&e?.creditLimit!==null?e.creditLimit:``}">
      </div>
      <div class="form-group" style="margin: 0;">
        <label>Plazo Límite Pago (Días)</label>
        <input type="number" id="m-client-payment-term" class="form-input" placeholder="Ej: 15" min="0" value="${e?.paymentTermDays!==void 0&&e?.paymentTermDays!==null?e.paymentTermDays:``}">
      </div>
    </div>

    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
       <button class="btn-cancel btn-outline" style="flex: 1;">Cancelar</button>
       <button class="btn-save btn-primary" style="flex: 1; margin: 0; background: var(--primary);">Guardar</button>
    </div>
  `,r.appendChild(i),document.body.appendChild(r);let s=()=>r.remove();i.querySelector(`.close-btn`).onclick=s,i.querySelector(`.btn-cancel`).onclick=s,setTimeout(()=>i.querySelector(`#m-client-name`).focus(),100),i.querySelector(`.btn-save`).onclick=async()=>{let r=i.querySelector(`#m-client-name`).value.trim();if(!r)return alert(`El nombre o razón social es obligatorio`);let a=i.querySelector(`#m-client-credit-limit`).value,o=i.querySelector(`#m-client-payment-term`).value,c={id:e?.id||null,name:r,cuit:i.querySelector(`#m-client-cuit`).value,address:i.querySelector(`#m-client-address`).value,phone:i.querySelector(`#m-client-phone`).value,cbu:i.querySelector(`#m-client-cbu`).value,account:i.querySelector(`#m-client-account`).value,creditLimit:a===``?null:parseFloat(a),paymentTermDays:o===``?null:parseInt(o)};c.id||delete c.id;let l=i.querySelector(`.btn-save`);l.textContent=`Guardando...`,l.disabled=!0,t&&await t(c,n),s()}}function at(e,t,n){let r=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;`}),i=K(`div`,{classes:[`modal`,`glass-card`],style:`max-width: 550px; width: 100%; padding: 2rem; border-radius: 16px;`}),a=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;`}),o=e.id.startsWith(`RETAIL_`)?`Detalle de Venta Minorista`:`Detalle de Despacho Mayorista`,s=e.id.replace(`RETAIL_`,``).replace(`SALE_`,``);a.innerHTML=`
    <h3 style="margin: 0; color: var(--primary); font-size: 1.25rem;">${o}</h3>
    <button class="close-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">&times;</button>
  `;let c=new Date(e.date||e.updatedAt).toLocaleDateString(`es-AR`),l=new Date(e.date||e.updatedAt).toLocaleTimeString(`es-AR`,{hour:`2-digit`,minute:`2-digit`}),u=e.consumerName||`Consumidor Final`,d=null;if(n){let e=n.match(/\[Carnicer[ií]a:\s*([^\]]+)\]/i);e&&e[1]&&(d=e[1].trim())}let f=K(`div`,{style:`margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; font-size: 0.9rem;`});f.innerHTML=`
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: var(--text-muted);">Comprobante:</span>
      <span style="font-weight: 600;">N° ${s}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: var(--text-muted);">Fecha:</span>
      <span style="font-weight: 500;">${c} ${l}</span>
    </div>
    ${d?`
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: var(--text-muted);">Origen / Sucursal:</span>
      <span style="font-weight: 600; color: #818cf8;">${d.toUpperCase()}</span>
    </div>
    `:``}
    <div style="display: flex; justify-content: space-between;">
      <span style="color: var(--text-muted);">Cliente:</span>
      <span style="font-weight: 600; text-align: right;">${u}</span>
    </div>
  `;let p=K(`div`),m=``,h=0;m=e.items&&e.items.length>0?`
      <div style="max-height: 250px; overflow-y: auto; margin-bottom: 1.5rem; border: 1px solid var(--border); border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
          <thead>
            <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); color: var(--text-muted);">
              <th style="padding: 0.5rem;">Producto</th>
              <th style="padding: 0.5rem; text-align: right;">Peso</th>
              <th style="padding: 0.5rem; text-align: right;">Precio/kg</th>
              <th style="padding: 0.5rem; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${e.items.map(e=>{let n=Number(e.weight)||0,r=Number(e.pricePerKg)||0,i=Number(e.subtotal)||0;return h+=n,`
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 0.75rem 0.5rem; font-weight: 500;">${t[e.productId]?.name||`Producto (PLU: ${t[e.productId]?.plu||e.productId})`}</td>
          <td style="padding: 0.75rem 0.5rem; text-align: right;">${n.toFixed(3)} kg</td>
          <td style="padding: 0.75rem 0.5rem; text-align: right;">$${r.toLocaleString()}</td>
          <td style="padding: 0.75rem 0.5rem; text-align: right; color: var(--primary); font-weight: 600;">$${i.toLocaleString()}</td>
        </tr>
      `}).join(``)}
          </tbody>
        </table>
      </div>
    `:`<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No hay detalles de ítems registrados para esta venta.</p>`,p.innerHTML=m;let g=K(`div`,{style:`margin-bottom: 1.5rem; padding: 1rem; background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;`});g.innerHTML=`
    <div>
      <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Peso Total</div>
      <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-main);">${h.toFixed(3)} kg</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Importe Total</div>
      <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">$${(e.totalAmount||0).toLocaleString()}</div>
    </div>
  `;let _=K(`div`,{style:`display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;`});_.innerHTML=`
    <button class="btn-outline print-btn" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 8px;">
      🖨️ Imprimir Ticket
    </button>
    <button class="btn-primary close-modal-btn" style="padding: 0.6rem 1.5rem; border-radius: 8px; margin: 0; background: var(--primary);">Cerrar</button>
  `,i.appendChild(a),i.appendChild(f),i.appendChild(p),i.appendChild(g),i.appendChild(_),r.appendChild(i),document.body.appendChild(r);let v=()=>document.body.removeChild(r);a.querySelector(`.close-btn`).onclick=v,_.querySelector(`.close-modal-btn`).onclick=v,r.onclick=e=>{e.target===r&&v()},_.querySelector(`.print-btn`).onclick=()=>{ot(e,t,d)}}function ot(e,t,n){let r=window.open(``,`_blank`,`width=400,height=700`),i=e.id.startsWith(`RETAIL_`)?`TICKET VENTA MINORISTA`:`REMITO DE DESPACHO`,a=e.id.replace(`RETAIL_`,``).replace(`SALE_`,``),o=new Date(e.date||e.updatedAt).toLocaleDateString(`es-AR`),s=new Date(e.date||e.updatedAt).toLocaleTimeString(`es-AR`,{hour:`2-digit`,minute:`2-digit`}),c=new Date().toLocaleString(`es-AR`),l=e.consumerName||`Consumidor Final`,u=``,d=0;e.items&&e.items.length>0&&(u=e.items.map(e=>{let n=Number(e.weight)||0,r=Number(e.pricePerKg)||0,i=Number(e.subtotal)||0;return d+=n,`
        <tr>
          <td style="padding: 4px 0;">
            <div style="font-weight: bold;">${(t[e.productId]?.name||`Producto (PLU: ${t[e.productId]?.plu||e.productId})`).toUpperCase()}</div>
            <div style="font-size: 10px; color: #555;">${n.toFixed(3)} kg x $${r.toLocaleString()}</div>
          </td>
          <td style="text-align: right; vertical-align: bottom; padding: 4px 0;">$${i.toLocaleString()}</td>
        </tr>
      `}).join(``));let f=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket Venta - ${e.id}</title>
      <style>
        body { 
          font-family: 'Courier New', Courier, monospace; 
          padding: 10px; 
          color: #000; 
          font-size: 12px; 
          line-height: 1.3;
          margin: 0;
          background: #fff;
        }
        .header { 
          text-align: center; 
          border-bottom: 1px dashed #000; 
          padding-bottom: 10px; 
          margin-bottom: 10px; 
        }
        .company-name { 
          font-size: 16px; 
          font-weight: 800; 
          margin: 0 0 5px 0; 
        }
        .info { 
          margin-bottom: 10px; 
          font-size: 11px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 10px;
        }
        th, td { 
          border-bottom: 1px dotted #ccc; 
        }
        .totals {
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 10px;
          font-size: 13px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .disclaimer { 
          margin-top: 25px; 
          text-align: center; 
          font-size: 9px; 
          color: #555; 
          border-top: 1px dashed #000; 
          padding-top: 10px; 
        }
        @media print { 
          @page { margin: 0; } 
          body { padding: 15px; } 
        }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <div class="company-name">FRIGORÍFICO PAMPA</div>
        <div style="font-size: 11px;">Ruta Nac. 34 - Clucellas</div>
        <div style="font-weight: bold; margin-top: 5px; font-size: 13px;">${i}</div>
      </div>
      
      <div class="info">
        <div class="info-row">
          <span>Nro. Comprobante:</span>
          <strong>${a}</strong>
        </div>
        <div class="info-row">
          <span>Fecha:</span>
          <span>${o} ${s}</span>
        </div>
        ${n?`
        <div class="info-row">
          <span>Origen / Sucursal:</span>
          <strong>${n.toUpperCase()}</strong>
        </div>
        `:``}
        <div class="info-row">
          <span>Cliente:</span>
          <strong>${l.toUpperCase()}</strong>
        </div>
        <div class="info-row">
          <span>Emisión:</span>
          <span>${c}</span>
        </div>
      </div>
      
      <table>
        <tbody>
          ${u}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>PESO TOTAL:</span>
          <strong>${d.toFixed(3)} kg</strong>
        </div>
        <div class="total-row" style="font-size: 15px; font-weight: bold;">
          <span>TOTAL COMPRA:</span>
          <span>$${(e.totalAmount||0).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="disclaimer">
        *** DOCUMENTO DE USO INTERNO ***<br>
        NO VALIDO COMO FACTURA<br>
        ¡GRACIAS POR SU COMPRA!
      </div>
    </body>
    </html>
  `;r.document.write(f),r.document.close()}function st(e){let{clients:t,operators:n,selectedClient:r,selectedType:i,activeTab:a,transactions:o,accountSummary:s,onSelectClient:c,onAddPayment:l,onBack:u,onAnalyzePrice:d,onTabChange:f,onSaveClient:p}=e,m=document.getElementById(`content`);m.innerHTML=``;let h=K(`div`,{classes:[`dashboard`,`fade-in`]});if(r&&s){let{debtTotal:t,paymentsTotal:n,balance:i,account:a}=s,c=K(`div`,{classes:[`dashboard-header`],style:`display: flex; align-items: center; gap: 0.5rem;`});c.innerHTML=`
      <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
        <button id="back-clients" class="back-btn-m3" title="Volver">
          <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
        </button>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <h2 style="margin: 0; font-size: 1.5rem; letter-spacing: -0.02em;">${r.name}</h2>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 4px; font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; color: var(--text-muted);">
              <span>📍</span> ${r.address||`Sin dirección`}
            </div>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 0.8rem; background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 4px; color: #818cf8; font-weight: 600;">
              <span>🆔</span> CUIT: ${r.cuit||`N/A`}
            </div>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button id="analyze-price-btn" class="icon-btn" title="Análisis de Precio Promedio" style="background: var(--glass); padding: 0.75rem; border: 1px solid var(--border); width: auto; height: auto; display: flex; align-items: center; gap: 0.5rem; color: var(--primary);">
          <span style="font-size: 1.25rem;">📊</span>
          <span style="font-size: 0.9rem; font-weight: 600;">Análisis</span>
        </button>
        <button id="print-account-btn" class="icon-btn" title="Imprimir Detalle de Cuenta" style="background: var(--glass); padding: 0.75rem; border: 1px solid var(--border); width: auto; height: auto;">
          <span style="font-size: 1.2rem;">🖨️</span>
        </button>
      </div>
    `,h.appendChild(c),c.querySelector(`#analyze-price-btn`).onclick=d,c.querySelector(`#print-account-btn`).onclick=()=>nt(r,o,a);let f=a.getBlockingStatus();if(f.isBlocked){let e=K(`div`,{classes:[`glass-card`],style:`background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-left: 4px solid #ef4444; padding: 1rem 1.5rem; margin-bottom: 2rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; color: #fca5a5;`});e.innerHTML=`
        <span style="font-size: 2rem;">⚠️</span>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 0.25rem 0; color: #fca5a5; font-size: 1.05rem; font-weight: 700;">VENTAS Y DESPACHOS SUSPENDIDOS</h4>
          <p style="margin: 0; font-size: 0.9rem; line-height: 1.4; color: var(--text-muted);">${f.reason}</p>
        </div>
      `,h.appendChild(e)}let p=K(`div`,{classes:[`stats-grid`],style:`margin-bottom: 2rem;`}),m=(e,t,n)=>{p.appendChild(K(`div`,{classes:[`stat-card`,`glass-card`],html:`<h3>${e}</h3><div class="stat-value" style="color: ${n};">${t}</div>`}))};m(`Deuda Total`,`$${t.toLocaleString()}`,`var(--text-main)`),m(`Pagos Totales`,`$${n.toLocaleString()}`,`#10b981`),m(`Saldo Pendiente`,`$${i.toLocaleString()}`,i>0?`#ef4444`:`#10b981`),h.appendChild(p);let g=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 2rem; border-left: 4px solid #10b981;`});g.innerHTML=`
      <h3 style="margin-bottom: 1rem; color: #10b981;">➕ Registrar Pago</h3>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
        <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;"><label>Monto ($)</label><input type="number" id="pay-amount" class="form-input" placeholder="0.00"></div>
        <div class="form-group" style="flex: 2; min-width: 200px; margin: 0;"><label>Descripción / Concepto</label><input type="text" id="pay-desc" class="form-input" placeholder="Ej: Pago efectivo, Transferencia..."></div>
        <div class="form-group" style="flex: 1; min-width: 150px; margin: 0;"><label>Recibido por / en</label><input type="text" id="pay-received" class="form-input" placeholder="Ej: Caja Central, Juan..."></div>
        <button id="pay-btn" class="btn-primary" style="background: #10b981; margin: 0;">Registrar</button>
      </div>
    `,h.appendChild(g);let _=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 2rem; border-left: 4px solid #ef4444;`});_.innerHTML=`
      <h3 style="margin-bottom: 1rem; color: #ef4444;">🛒 Registrar Venta (Genérica)</h3>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
        <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;"><label>Monto ($)</label><input type="number" id="sale-amount" class="form-input" placeholder="0.00"></div>
        <div class="form-group" style="flex: 2; min-width: 200px; margin: 0;"><label>Descripción / Concepto</label><input type="text" id="sale-desc" class="form-input" placeholder="Ej: Venta de productos, Flete..."></div>
        <button id="sale-btn" class="btn-primary" style="background: #ef4444; margin: 0;">Registrar Venta</button>
      </div>
    `,h.appendChild(_);let v=K(`div`,{classes:[`glass-card`]});v.innerHTML=`<h3 style="margin-bottom: 1rem;">Historial de Movimientos</h3>`;let y=K(`div`,{style:`overflow-x: auto;`}),b=document.createElement(`table`);b.className=`faena-table`,b.style.width=`100%`,b.style.borderCollapse=`collapse`,b.innerHTML=`
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); text-align: left;">
          <th style="padding: 1rem;">Fecha</th>
          <th style="padding: 1rem;">Concepto</th>
          <th style="padding: 1rem;">Debe</th>
          <th style="padding: 1rem;">Haber</th>
          <th style="padding: 1rem;">Detalle</th>
        </tr>
      </thead>
      <tbody>
        ${o.length===0?`<tr><td colspan="5" style="padding: 2rem; text-align: center;">Sin movimientos.</td></tr>`:o.map(e=>{let t=e.type===`DEBT`,n=e.receivedBy?`<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">📥 Recibido: ${e.receivedBy}</div>`:``,r=e.description||``,i=r.includes(`Venta Mostrador`),a=r.includes(`Despacho Facturado`),o=null;if(i||a){let e=r.match(/N°\s*([a-zA-Z0-9_-]+)/);if(e&&e[1]){let t=e[1].trim();o=i?`RETAIL_${t}`:`SALE_${t}`}}let s=o?`<a href="#" class="sale-detail-link" data-sale-id="${o}" data-concept="${r}" style="color: var(--primary); text-decoration: underline; font-weight: 500; cursor: pointer;">${r}</a>`:`<div style="font-weight: 500;">${e.description||(t?`Despacho`:`Pago`)}</div>`;return`
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem;">${new Date(e.date||e.createdAt).toLocaleDateString()}</td>
                <td style="padding: 1rem;">
                  ${s}
                  ${n}
                </td>
                <td style="padding: 1rem; color: #ef4444; font-weight: 500;">${t?`$`+e.amount.toLocaleString():`-`}</td>
                <td style="padding: 1rem; color: #10b981; font-weight: 500;">${t?`-`:`$`+e.amount.toLocaleString()}</td>
                <td style="padding: 1rem;">
                  ${e.breakout?`<button class="btn-outline view-detail-btn" data-id="${e.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Ver Detalle</button>`:``}
                  ${o?`<button class="btn-outline view-sale-detail-btn" data-sale-id="${o}" data-concept="${r}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Ver Detalle</button>`:``}
                </td>
              </tr>
            `}).join(``)}
      </tbody>
    `,y.appendChild(b),v.appendChild(y),h.appendChild(v),c.querySelector(`#back-clients`).onclick=u,g.querySelector(`#pay-btn`).onclick=()=>{let e=document.getElementById(`pay-amount`).value,t=document.getElementById(`pay-desc`).value,n=document.getElementById(`pay-received`).value;e&&l(e,t,n)},_.querySelector(`#sale-btn`).onclick=()=>{let t=document.getElementById(`sale-amount`).value,n=document.getElementById(`sale-desc`).value||`Venta Genérica`;t&&e.onAddSale&&e.onAddSale(t,n)},h.querySelectorAll(`.view-detail-btn`).forEach(e=>{e.onclick=()=>{let t=o.find(t=>t.id===e.dataset.id);t&&t.breakout&&tt(t,a)}}),h.querySelectorAll(`.view-sale-detail-btn, .sale-detail-link`).forEach(t=>{t.onclick=n=>{n.preventDefault(),e.onViewSaleDetail&&e.onViewSaleDetail(t.dataset.saleId,t.dataset.concept)}})}else{let r=a===`OPERATORS`,i=K(`div`,{classes:[`dashboard-header`],style:`display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;`});i.innerHTML=`
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard">
          <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
        </button>
        <div>
          <h2 style="margin: 0;">👥 Cuentas y Saldos</h2>
          <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Administración de cuentas corrientes.</p>
        </div>
      </div>
      <button id="new-client-btn" class="btn-primary" style="margin: 0; width: auto; padding: 0.6rem 1.5rem;">➕ Nuevo ${r?`Operador`:`Cliente`}</button>
    `,h.appendChild(i);let o=K(`div`,{style:`display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;`});o.innerHTML=`
      <button id="tab-clients" style="background: none; border: none; font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; color: ${r?`var(--text-muted)`:`var(--primary)`}; border-bottom: ${r?`3px solid transparent`:`3px solid var(--primary)`};">Clientes y Deudores</button>
      <button id="tab-operators" style="background: none; border: none; font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; color: ${r?`var(--primary)`:`var(--text-muted)`}; border-bottom: ${r?`3px solid var(--primary)`:`3px solid transparent`};">Operadores de Cheques</button>
    `,h.appendChild(o),i.querySelector(`#back-to-dash`).onclick=e.onBackToDashboard,i.querySelector(`#new-client-btn`).onclick=()=>it(null,p,r?`OPERATOR`:`CLIENT`),o.querySelector(`#tab-clients`).onclick=()=>f(`CLIENTS`),o.querySelector(`#tab-operators`).onclick=()=>f(`OPERATORS`);let s=r?n||[]:t,l=K(`div`,{classes:[`card-list`]});if(s.length===0){let e=K(`div`,{classes:[`glass-card`],style:`padding: 3rem; text-align: center;`});e.innerHTML=`
        <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">No hay ${r?`operadores`:`clientes`} registrados.</p>
      `,l.appendChild(e)}else s.forEach(e=>{let t=K(`div`,{classes:[`card`,`glass-card`],style:`cursor: pointer; transition: transform 0.2s;`}),n=(e.balance||0)>0?`#ef4444`:`#10b981`,i=e.isBlocked;t.innerHTML=`
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.35rem;">
                ${e.name}
                ${i?`<span style="font-size: 0.95rem; color: #ef4444; cursor: help;" title="Ventas Suspendidas: ${e.blockingReason||``}">⚠️</span>`:``}
              </h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">${e.address||`Sin dirección`}</p>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">CUIT: ${e.cuit||`N/A`}</p>
              ${i?`<p style="color: #fca5a5; font-size: 0.78rem; margin: 0.25rem 0 0 0; font-weight: 600;">🚫 Cuenta Suspendida</p>`:``}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.2rem;">Saldo</div>
              <div style="font-size: 1.25rem; font-weight: bold; color: ${n};">$${(e.balance||0).toLocaleString()}</div>
              <button class="btn-outline edit-client-btn" style="margin-top: 0.5rem; padding: 0.2rem 0.5rem; font-size: 0.75rem;">Editar</button>
            </div>
          </div>
        `,t.querySelector(`.edit-client-btn`).onclick=t=>{t.stopPropagation(),it(e,p,r?`OPERATOR`:`CLIENT`)},t.onclick=()=>c(e,r?`OPERATOR`:`CLIENT`),l.appendChild(t)});h.appendChild(l)}m.appendChild(h)}var ct=null,lt=!1,ut={async getSyncLogs(){return I.sync_logs.orderBy(`timestamp`).reverse().limit(50).toArray()},async clearSyncLogs(){await I.sync_logs.clear()},async getLastSyncTime(){let e=await I.sync_logs.where(`status`).equals(`SUCCESS`).reverse().sortBy(`timestamp`);return e.length>0?e[0].timestamp:0},async syncAll(e){if(lt)return;lt=!0;let t=Date.now(),n=``,i=``,o=0;try{let e=await this.getLastSyncTime();console.log(`[SyncService] Iniciando sincronización. Último éxito: ${e>0?new Date(e).toLocaleString():`Nunca`}`);let s=a(P,`clientes`),c=await I.clientes.count(),l=g(s);e>0&&c>0&&(l=g(s,r(`updatedAt`,`>`,e)));let u=(await b(l)).docs.map(e=>({id:e.id,...e.data()}));u.length>0&&await I.clientes.bulkPut(u);let d=a(P,`travels`),f=await I.travels.count(),p=g(d);e>0&&f>0&&(p=g(d,r(`updatedAt`,`>`,e)));let m=(await b(p)).docs.map(e=>{let{data:t,updatedAt:n,createdAt:r,...i}=e.data(),a={};if(t&&typeof t==`string`)try{a=JSON.parse(t)}catch(e){console.warn(`[SyncService] Error al parsear JSON del viaje:`,e)}return{...i,...a,id:e.id,updatedAt:n||Date.now()}});m.length>0&&await I.travels.bulkPut(m);let h=a(P,`faenas_detalle`),_=await I.faenas_detalle.count(),v=[];if(e===0||_===0){let e=g(h,r(`status`,`in`,[`AVAILABLE`,`DRAFT`])),t=g(h,r(`dispatchDate`,`>=`,Date.now()-720*60*60*1e3)),[n,i]=await Promise.all([b(e),b(t)]),a=n.docs.map(e=>({id:e.id,...e.data()})),o=i.docs.map(e=>({id:e.id,...e.data()}));v=[...a,...o]}else v=(await b(g(h,r(`updatedAt`,`>`,e)))).docs.map(e=>({id:e.id,...e.data()}));if(v.length>0){let e=v.map(e=>({...e,barcode:e.barcode||null,updatedAt:e.updatedAt||Date.now()}));await I.faenas_detalle.bulkPut(e)}try{let t=a(P,`cash_extractions`),n=await I.cash_extractions.count(),i=g(t);e>0&&n>0&&(i=g(t,r(`updatedAt`,`>`,e)));let s=(await b(i)).docs.map(e=>{let t=e.data();return{id:e.id,status:t.status||`PENDING`,...t}});s.length>0&&(await I.cash_extractions.bulkPut(s),o=s.length)}catch(e){console.warn(`[SyncService] Error en sync de cash_extractions:`,e)}let y=0;try{let t=a(P,`accounting_entries`),n=await I.accounting_entries.where(`type`).equals(`accounting_entries`).count(),i=g(t);e>0&&n>0&&(i=g(t,r(`updatedAt`,`>`,e)));let o=(await b(i)).docs.map(e=>({id:e.id,type:`accounting_entries`,...e.data()}));o.length>0&&(await I.accounting_entries.bulkPut(o),y+=o.length)}catch(e){console.warn(`[SyncService] Error en sync de accounting_entries:`,e)}let x=0;try{let t=a(P,`frigorifico_entries`),n=await I.accounting_entries.where(`type`).equals(`frigorifico_entries`).count(),i=g(t);e>0&&n>0&&(i=g(t,r(`updatedAt`,`>`,e)));let o=(await b(i)).docs.map(e=>({id:e.id,type:`frigorifico_entries`,...e.data()}));o.length>0&&(await I.accounting_entries.bulkPut(o),x+=o.length)}catch(e){console.warn(`[SyncService] Error en sync de frigorifico_entries:`,e)}let S=0;try{let t=a(P,`check_operations`),n=await I.check_operations.count(),i=g(t);e>0&&n>0&&(i=g(t,r(`updatedAt`,`>`,e)));let o=(await b(i)).docs.map(e=>({id:e.id,...e.data()}));o.length>0&&(await I.check_operations.bulkPut(o),S+=o.length)}catch(e){console.warn(`[SyncService] Error en sync de check_operations:`,e)}let C=0;try{let t=a(P,`employee_time_logs`),n=await I.employee_time_logs.count(),i=g(t);e>0&&n>0&&(i=g(t,r(`updatedAt`,`>`,e)));let o=(await b(i)).docs.map(e=>({id:e.id,...e.data(),status:e.data().status||`UNPAID`}));o.length>0&&(await I.employee_time_logs.bulkPut(o),C+=o.length)}catch(e){console.warn(`[SyncService] Error en sync de employee_time_logs:`,e)}let w=Date.now()-t;n=`Clientes: ${u.length}, Viajes: ${m.length}, Faenas: ${v.length}, Asientos: ${y+x}, Cheques: ${S}, Fichadas: ${C}`,i=`Sincronización delta completada exitosamente en ${w}ms.`,await I.sync_logs.add({timestamp:Date.now(),status:`SUCCESS`,duration:w,recordsSynced:n,details:i}),console.log(`[SyncService] Sincronización exitosa. ${n}`);let T=u.length+m.length+v.length+o+y+x+S+C;window.dispatchEvent(new CustomEvent(`app:sync-completed`,{detail:{stats:n,syncedCount:T}}))}catch(e){console.error(`[SyncService] Error al sincronizar:`,e);let n=Date.now()-t;await I.sync_logs.add({timestamp:Date.now(),status:`ERROR`,duration:n,recordsSynced:`Ninguno`,details:`Error: ${e.message||e}`}),window.dispatchEvent(new CustomEvent(`app:sync-failed`,{detail:{error:e.message}}))}finally{lt=!1}},startAutoSync(e){ct&&clearInterval(ct),this.syncAll(e),ct=setInterval(()=>{this.syncAll(e)},300*1e3);let t=()=>{console.log(`[SyncService] Foco recuperado. Forzando sincronización delta...`),this.syncAll(e)};window.removeEventListener(`focus`,t),window.addEventListener(`focus`,t)},stopAutoSync(){ct&&=(clearInterval(ct),null)}};function dt(e,t){if(!e)return;let n=L.loadSettings();e.innerHTML=``;let r=K(`div`,{classes:[`settings-wrapper`,`fade-in`],style:`width: 100%; max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;`}),i=K(`div`,{classes:[`settings-header-container`,`glass-card`],style:`margin-bottom: 2rem; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; border-radius: 20px;`});i.innerHTML=`
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button id="back-btn" class="back-btn-m3" title="Volver al Dashboard" style="border: 1px solid var(--border); background: var(--bg-main);">
        <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
      </button>
      <div>
        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main);">⚙️ Configuración General</h2>
        <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Administra parámetros operacionales, costos logísticos, cámaras de acopio y privilegios del personal.</p>
      </div>
    </div>
  `,r.appendChild(i),i.querySelector(`#back-btn`).onclick=t.onBack;let a=K(`div`,{attrs:{id:`settings-msg`},classes:[`settings-toast-alert`],style:`display: none;`});r.appendChild(a);let o=(e,t=!1)=>{a.innerHTML=`
      <span class="toast-icon">${t?`⚠️`:`✅`}</span>
      <span class="toast-text">${e}</span>
    `,a.className=`settings-toast-alert ${t?`toast-error`:`toast-success`}`,a.style.display=`flex`,setTimeout(()=>{a.style.opacity=`0`,setTimeout(()=>{a.style.display=`none`,a.style.opacity=`1`},300)},4e3)},s=K(`h3`,{classes:[`settings-section-title`],text:`📈 Parámetros Comerciales & Fletes`,style:`margin: 2.5rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;`});r.appendChild(s);let c=K(`div`,{classes:[`settings-grid`],style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;`});c.innerHTML=`
    <!-- Card 1: Margen Económico -->
    <div class="glass-card settings-card" style="display: flex; flex-direction: column; padding: 1.5rem; border-radius: 16px; min-height: 200px;">
      <h4 class="card-title-m3">💵 Margen de Operación</h4>
      <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1.25rem;">Porcentaje de ganancia objetiva añadido por encima del costo gancho estimado en el simulador.</p>
      <div class="form-group" style="margin-top: auto; display: flex; flex-direction: column; gap: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">Ganancia Proyectada</label>
          <span class="badge-accent" id="margen-val-badge" style="background: var(--primary-container); color: var(--on-primary-container); font-weight: 700; font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 8px;">${((n.margenGanancia-1)*100).toFixed(0)}%</span>
        </div>
        <input type="range" id="set-margen" min="0" max="100" value="${((n.margenGanancia-1)*100).toFixed(0)}" class="slider-m3" style="width: 100%; margin-top: 0.5rem;">
      </div>
    </div>

    <!-- Card 2: Flete Jaula Doble -->
    <div class="glass-card settings-card" style="display: flex; flex-direction: column; padding: 1.5rem; border-radius: 16px;">
      <h4 class="card-title-m3">🚛 Transporte Jaula Doble</h4>
      <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1rem;">Capacidad y flete estandarizado para jaulas dobles de acopio.</p>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label>Peso Jaula Doble Promedio (kg)</label>
        <input type="number" id="set-jdd-kg" value="${n.pesoJaulaDoble}" class="form-input" style="width: 100%;" placeholder="Ej: 21500">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label>Costo por Kilómetro ($/km)</label>
        <input type="number" id="set-jdd-km" value="${n.precioKmDouble}" class="form-input" style="width: 100%;" placeholder="Ej: 3100">
      </div>
    </div>

    <!-- Card 3: Flete Jaula Simple -->
    <div class="glass-card settings-card" style="display: flex; flex-direction: column; padding: 1.5rem; border-radius: 16px;">
      <h4 class="card-title-m3">🚚 Transporte Jaula Simple</h4>
      <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1rem;">Capacidad y flete estandarizado para jaulas simples de acopio.</p>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label>Peso Jaula Simple Promedio (kg)</label>
        <input type="number" id="set-js-kg" value="${n.pesoJaulaSimple}" class="form-input" style="width: 100%;" placeholder="Ej: 15500">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label>Costo por Kilómetro ($/km)</label>
        <input type="number" id="set-js-km" value="${n.precioKmSimple}" class="form-input" style="width: 100%;" placeholder="Ej: 2500">
      </div>
    </div>
  `,r.appendChild(c);let l=c.querySelector(`#set-margen`),u=c.querySelector(`#margen-val-badge`);l&&u&&(l.oninput=e=>{u.textContent=`${e.target.value}%`});let d=K(`h3`,{classes:[`settings-section-title`],text:`🏷️ Placa & Precios de Compra de Referencia`,style:`margin: 2rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;`});r.appendChild(d);let f=K(`div`,{classes:[`glass-card`,`settings-card`],style:`padding: 1.75rem; border-radius: 20px; margin-bottom: 2.5rem;`});f.innerHTML=`
    <div class="price-header-row" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main);">Precios por Categoría ($/kg vivo)</h4>
        <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.8rem;">Establece los precios base para la compra de hacienda. Estos alimentan las cotizaciones sugeridas.</p>
      </div>
      <button id="gen-price-share-btn" class="btn-primary" style="width: auto; padding: 0.65rem 1.5rem; font-size: 0.82rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
        <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
        <span>📲 Generar Placa de Compartir</span>
      </button>
    </div>
    <div id="category-prices-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.25rem;"></div>
  `,r.appendChild(f);let p=(e={})=>{let t=f.querySelector(`#category-prices-grid`);if(!t)return;let n=[`NOVILLO`,`VACA`,`VAQUILLONA`,`TORO`,`OTRO`,`ACHURAS`];t.innerHTML=``;let r={NOVILLO:`🐂`,VACA:`🐄`,VAQUILLONA:`🐄`,TORO:`🐂`,OTRO:`🐂`,ACHURAS:`🥩`};n.forEach(n=>{let i=K(`div`,{classes:[`form-group`],style:`margin: 0; display: flex; flex-direction: column; gap: 0.4rem;`}),a=n===`ACHURAS`?`ACHURAS ($/juego)`:n;i.innerHTML=`
        <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>${r[n]||`🐂`}</span> ${a}
        </label>
        <div class="input-with-symbol" style="position: relative; display: flex; align-items: center;">
          <span style="position: absolute; left: 0.85rem; color: var(--text-muted); font-size: 0.9rem; font-weight: 500;">$</span>
          <input type="number" class="cat-price-input form-input" data-cat="${n}" value="${e[n]||``}" placeholder="Cargar..." style="padding-left: 1.75rem; width: 100%;">
        </div>
      `,t.appendChild(i)})},m=K(`h3`,{classes:[`settings-section-title`],text:`❄️ Logística de Acopio & Cámaras`,style:`margin: 2rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;`});r.appendChild(m);let h=K(`div`,{classes:[`glass-card`,`settings-card`],style:`padding: 2rem; border-radius: 20px; margin-bottom: 2.5rem;`});h.innerHTML=`
    <div style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 2.5rem; flex-wrap: wrap;">
       <div id="settings-camara-form" style="border-right: 1px solid var(--border); padding-right: 2.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <h4 id="camara-form-title" style="margin: 0 0 0.25rem 0; font-size: 1.05rem; font-weight: 600; color: var(--text-main);">Añadir Nueva Cámara</h4>
            <p style="margin: 0; font-size: 0.78rem; color: var(--text-muted);">Configura cámaras de frío para registrar stock colgado.</p>
          </div>
          <input type="hidden" id="camara-old-name">
          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Nombre de la Cámara</label>
            <input type="text" id="camara-name" class="form-input" placeholder="Ej: Cámara de Terneras" style="width: 100%;">
          </div>
          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Capacidad Máxima (Medias Reses)</label>
            <input type="number" id="camara-capacity" class="form-input" placeholder="Ej: 80" min="1" style="width: 100%;">
          </div>
          <div style="display: flex; gap: 0.75rem; margin-top: 0.75rem;">
             <button id="clear-camara-btn" class="btn-outline" style="flex: 1; padding: 0.65rem; border-radius: 8px;">Limpiar</button>
             <button id="save-camara-btn" class="btn-primary" style="flex: 2; margin: 0; padding: 0.65rem; border-radius: 8px; font-weight: 600;">Guardar Cámara</button>
          </div>
       </div>
       <div id="settings-camaras-list-container">
          <h4 style="margin: 0 0 1rem 0; font-size: 1.05rem; font-weight: 600; color: var(--text-main);">Cámaras de Frío Configuradas</h4>
          <div id="settings-camaras-list" class="card-list" style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; padding-right: 0.5rem;"></div>
       </div>
    </div>
  `,r.appendChild(h);let g=[...t.camarasList||[]],_=()=>{let e=h.querySelector(`#settings-camaras-list`);if(e){if(e.innerHTML=``,g.length===0){e.innerHTML=`
        <div style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted); background: rgba(0, 0, 0, 0.08); border-radius: 12px; border: 1px dashed var(--border);">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">❄️</span>
          <span>No hay cámaras de acopio configuradas.</span>
        </div>
      `;return}g.forEach(t=>{let n=K(`div`,{classes:[`camera-item-card`,`glass-card`],style:`padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-radius: 12px; border: 1px solid var(--border);`});n.innerHTML=`
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="camera-icon-badge" style="width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.15); color: #3b82f6; font-size: 1.15rem;">❄️</div>
          <div>
            <h4 style="margin: 0 0 0.2rem 0; font-size: 0.95rem; font-weight: 600; color: var(--text-main);">${t.name}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
              Capacidad: <strong>${t.capacity||0}</strong> medias reses
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-outline edit-camara-btn icon-btn" data-name="${t.name}" title="Editar Cámara" style="padding: 0.4rem 0.75rem; font-size: 0.78rem; border-radius: 8px;">✏️ Editar</button>
          <button class="btn-outline delete-camara-btn icon-btn delete-btn" data-name="${t.name}" title="Eliminar Cámara" style="padding: 0.4rem 0.75rem; font-size: 0.78rem; color: var(--danger); border-color: var(--danger); border-radius: 8px;">🗑️ Eliminar</button>
        </div>
      `,e.appendChild(n)}),e.querySelectorAll(`.edit-camara-btn`).forEach(e=>{e.onclick=()=>{let t=g.find(t=>t.name===e.dataset.name);t&&(h.querySelector(`#camara-old-name`).value=t.name,h.querySelector(`#camara-name`).value=t.name,h.querySelector(`#camara-capacity`).value=t.capacity,h.querySelector(`#camara-form-title`).textContent=`✏️ Editar Cámara: `+t.name,h.querySelector(`#camara-name`).focus())}}),e.querySelectorAll(`.delete-camara-btn`).forEach(e=>{e.onclick=async()=>{confirm(`¿Estás seguro de eliminar la cámara "${e.dataset.name}"?`)&&(g=g.filter(t=>t.name!==e.dataset.name),t.onSaveCamaras&&(await t.onSaveCamaras(g),_(),o(`Cámara eliminada correctamente.`)))}})}},v=()=>{h.querySelector(`#camara-old-name`).value=``,h.querySelector(`#camara-name`).value=``,h.querySelector(`#camara-capacity`).value=``,h.querySelector(`#camara-form-title`).textContent=`Añadir Nueva Cámara`};t&&t.categoryPrices?p(t.categoryPrices):p({}),_();let y=K(`div`,{attrs:{id:`settings-rbac-section`}});if(r.appendChild(y),t&&t.userRole===`ADMIN`){let e=r.querySelector(`#settings-rbac-section`);if(e){let n=[{id:`travels`,name:`Viajes`},{id:`consumption`,name:`Despacho y Stock`},{id:`clients`,name:`Clientes y Cuentas`},{id:`checks`,name:`Gestión de Cheques`},{id:`accounting`,name:`Caja General`},{id:`frigorifico`,name:`Caja Frigorífico`},{id:`establishments`,name:`Establecimientos`},{id:`master-data`,name:`Logística`},{id:`logistics-liquidations`,name:`Liquidaciones Fletes`},{id:`logistics-fuel`,name:`Rendimiento Combustible`},{id:`simulator`,name:`Simulador`},{id:`settings`,name:`Configuración`}],r=e=>e===`ADMIN`?[`travels`,`dashboard`,`consumption`,`clients`,`simulator`,`checks`,`accounting`,`frigorifico`,`settings`,`price-share`,`contact`,`logout`,`master-data`,`logistics-liquidations`,`logistics-fuel`,`establishments`]:e===`OPERARIO`?[`travels`,`dashboard`,`consumption`,`clients`,`simulator`,`checks`,`accounting`,`price-share`,`contact`,`logout`,`logistics-liquidations`,`logistics-fuel`]:[`dashboard`,`simulator`,`price-share`,`contact`,`logout`];e.innerHTML=`
        <h3 class="settings-section-title" style="margin: 2rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;">🔐 Accesos & Gestión de Permisos</h3>
        <div class="glass-card settings-card" style="padding: 2rem; border-radius: 20px; margin-bottom: 2.5rem;">
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main);">Gestión de Usuarios Activos</h4>
            <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.8rem;">Supervisa la nómina de personal que ingresa al sistema y administra sus roles y permisos de acceso (RBAC).</p>
          </div>
          <div id="rbac-list" class="card-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.25rem;"></div>
        </div>
      `;let i=e.querySelector(`#rbac-list`),a=t.usersList||[];a.length===0?i.innerHTML=`
          <div style="grid-column: 1 / -1; padding: 2.5rem; color: var(--text-muted); text-align: center; border: 1px dashed var(--border); border-radius: 12px; background: rgba(0,0,0,0.05);">
            No hay usuarios registrados en el sistema.
          </div>
        `:(a.forEach(e=>{let a=K(`div`,{classes:[`rbac-user-card`,`glass-card`],style:`padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1.25rem; border-radius: 14px; border: 1px solid var(--border);`}),o=e.uid===t.currentUserUid,s=e.uid===`iqy12KgqiDU0Z1QwwbqRSqvSpCM2`,c=String(e.email||e.uid||`U`).substring(0,2).toUpperCase(),l=o||s?`
            <span style="font-size: 0.72rem; color: var(--text-muted); background: rgba(255,255,255,0.04); padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 600; border: 1px solid var(--border); user-select: none;">
              ${s?`🛡️ Super-Admin`:`👤 Tú`}
            </span>
          `:`
            <button class="btn-outline btn-delete-user icon-btn delete-btn" data-uid="${e.uid}" data-email="${e.email}" title="Eliminar Usuario" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; color: var(--danger); border-color: var(--danger); border-radius: 8px; background: transparent; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              🗑️
            </button>
          `,u=s||o&&e.role===`ADMIN`?`disabled title="No puedes cambiar tu propio rol de administrador o modificar el del Super-Admin"`:``,d=s?`disabled`:``,f=s?`disabled style="opacity: 0.5; cursor: not-allowed;" title="El rol del Super-Admin no se puede modificar"`:``;a.innerHTML=`
            <div style="display: flex; align-items: center; gap: 0.85rem; justify-content: space-between; width: 100%;">
              <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0;">
                <div class="user-avatar-circle" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(143, 0, 20, 0.08); border: 1.5px solid rgba(143, 0, 20, 0.2); color: var(--primary); font-weight: 700; font-size: 0.9rem; flex-shrink: 0;">
                  ${c}
                </div>
                <div style="flex: 1; text-align: left; overflow: hidden;">
                  <h4 style="margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${e.email||e.uid}">${e.email||e.uid}</h4>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Registrado: ${e.createdAt?new Date(e.createdAt).toLocaleDateString(`es-AR`):`N/A`}</span>
                </div>
              </div>
              ${l}
            </div>
            
            <details style="border-top: 1px dashed var(--border); padding-top: 0.75rem;">
              <summary style="font-size: 0.8rem; font-weight: 600; color: var(--primary); cursor: pointer; user-select: none;">
                🔑 Configurar Secciones Permitidas
              </summary>
              <div class="sections-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; padding-top: 0.5rem; max-height: 150px; overflow-y: auto;">
                ${n.map(t=>{let n=e.allowedViews&&e.allowedViews.includes(t.id)||!e.allowedViews&&r(e.role).includes(t.id);return`
                    <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--text-muted); cursor: pointer; user-select: none;">
                      <input type="checkbox" class="section-check" data-uid="${e.uid}" data-view="${t.id}" ${n?`checked`:``} ${d} style="cursor: pointer;">
                      ${t.name}
                    </label>
                  `}).join(``)}
              </div>
            </details>

            <div style="display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem; justify-content: space-between;">
              <select class="form-input rbac-select" data-uid="${e.uid}" ${u} style="padding: 0.45rem 1rem 0.45rem 0.5rem; font-size: 0.8rem; border-radius: 8px; flex: 1;">
                <option value="ADMIN" ${e.role===`ADMIN`?`selected`:``}>Administrador (Full)</option>
                <option value="OPERARIO" ${e.role===`OPERARIO`?`selected`:``}>Operario (Edición)</option>
                <option value="VISOR" ${e.role===`VISOR`?`selected`:``}>Solo Lectura (Visor)</option>
              </select>
              <button class="btn-primary btn-save-role" data-uid="${e.uid}" data-email="${e.email}" ${f} style="padding: 0.5rem 1rem; font-size: 0.8rem; margin: 0; border-radius: 8px; font-weight: 600;">Actualizar</button>
            </div>
          `,i.appendChild(a)}),i.querySelectorAll(`.rbac-select`).forEach(e=>{e.onchange=()=>{let t=e.dataset.uid,n=e.value,a=i.querySelectorAll(`.section-check[data-uid="${t}"]`),o=r(n);a.forEach(e=>{let t=e.dataset.view;e.checked=o.includes(t)})}}),i.querySelectorAll(`.btn-save-role`).forEach(e=>{e.onclick=async()=>{let n=e.dataset.uid,r=e.dataset.email,a=i.querySelector(`.rbac-select[data-uid="${n}"]`).value,s=i.querySelectorAll(`.section-check[data-uid="${n}"]:checked`),c=Array.from(s).map(e=>e.dataset.view);e.textContent=`...`,e.disabled=!0,t.onSaveUserRole&&(await t.onSaveUserRole(n,a,c),o(`Rol y secciones de ${r||`usuario`} actualizados.`)),e.textContent=`Actualizar`,e.disabled=!1}}),i.querySelectorAll(`.btn-delete-user`).forEach(e=>{e.onclick=()=>{let n=e.dataset.uid,r=e.dataset.email||`usuario`;pt(r,async()=>{e.disabled=!0,e.textContent=`...`;try{t.onDeleteUser&&(await t.onDeleteUser(n),o(`Usuario ${r} eliminado correctamente.`))}catch(t){console.error(`Error deleting user metadata:`,t),o(`Error al eliminar usuario: `+t.message,!0),e.disabled=!1,e.textContent=`🗑️`}})}}))}}let b=K(`div`,{classes:[`settings-actions-row`],style:`display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-bottom: 4rem; border-top: 1px solid var(--border); padding-top: 1.5rem;`});b.innerHTML=`
    <button id="reset-settings" class="btn-outline" style="padding: 0.85rem 2rem; font-weight: 700; border-radius: 12px; font-size: 0.9rem; border-width: 1.5px;">Restaurar Predeterminados</button>
    <button id="save-settings" class="btn-primary" style="padding: 0.85rem 3.5rem; margin: 0; font-size: 0.9rem; font-weight: 700; border-radius: 12px; display: flex; align-items: center; gap: 0.5rem;">
      <span>💾 Guardar Cambios Globales</span>
    </button>
  `,r.appendChild(b);let x=f.querySelector(`#gen-price-share-btn`);x&&(x.onclick=t.onPriceShare),h.querySelector(`#clear-camara-btn`).onclick=v,h.querySelector(`#save-camara-btn`).onclick=async()=>{let e=h.querySelector(`#camara-old-name`).value,n=h.querySelector(`#camara-name`).value.trim(),r=parseInt(h.querySelector(`#camara-capacity`).value,10)||0;if(!n)return alert(`El nombre de la cámara es obligatorio.`);if(r<=0)return alert(`La capacidad debe ser un número mayor a 0.`);let i={name:n,capacity:r};if(e)g=g.map(t=>t.name===e?i:t);else{if(g.some(e=>e.name===n))return alert(`Ya existe una cámara con ese nombre.`);g.push(i)}let a=h.querySelector(`#save-camara-btn`);a.textContent=`Guardando...`,a.disabled=!0;try{t.onSaveCamaras&&(await t.onSaveCamaras(g),o(`Cámara guardada exitosamente.`),v(),_())}catch(e){console.error(e),o(`Error al guardar cámara: `+e.message,!0)}finally{a.textContent=`Guardar Cámara`,a.disabled=!1}},b.querySelector(`#save-settings`).onclick=async()=>{let e=b.querySelector(`#save-settings`);e.disabled=!0,e.innerHTML=`<span class="mini-spinner"></span> <span>Guardando Cambios...</span>`;try{let e={margenGanancia:1+parseFloat(c.querySelector(`#set-margen`).value)/100,pesoJaulaDoble:parseFloat(c.querySelector(`#set-jdd-kg`).value)||0,precioKmDouble:parseFloat(c.querySelector(`#set-jdd-km`).value)||0,pesoJaulaSimple:parseFloat(c.querySelector(`#set-js-kg`).value)||0,precioKmSimple:parseFloat(c.querySelector(`#set-js-km`).value)||0},n={};if(f.querySelectorAll(`.cat-price-input`).forEach(e=>{n[e.dataset.cat]=parseFloat(e.value)||0}),L.saveSettings(e)){if(t&&t.onSavePrices)try{await t.onSavePrices(n)}catch(e){throw console.error(`Error saving prices to Firebase:`,e),Error(`Error al guardar precios en la nube: ${e.message}`)}if(t&&t.onSaveCamaras)try{await t.onSaveCamaras(g)}catch(e){console.error(`Error during global cameras sync:`,e)}o(`¡Configuración de precios, cámaras y general guardada exitosamente!`)}else o(`Hubo un error al guardar localmente.`,!0)}catch(e){console.error(`Error al guardar: `,e),o(e.message||`Hubo un error al guardar. Ver consola.`,!0)}finally{e.disabled=!1,e.innerHTML=`<span>💾 Guardar Cambios Globales</span>`}},b.querySelector(`#reset-settings`).onclick=()=>{let e=L.getDefaults();c.querySelector(`#set-margen`).value=((e.margenGanancia-1)*100).toFixed(0),c.querySelector(`#margen-val-badge`).textContent=`${((e.margenGanancia-1)*100).toFixed(0)}%`,c.querySelector(`#set-jdd-kg`).value=e.pesoJaulaDoble,c.querySelector(`#set-jdd-km`).value=e.precioKmDouble,c.querySelector(`#set-js-kg`).value=e.pesoJaulaSimple,c.querySelector(`#set-js-km`).value=e.precioKmSimple,L.saveSettings(e),o(`¡Restaurado a los valores originales!`)};let S=K(`h3`,{classes:[`settings-section-title`],text:`🔄 Historial de Sincronización Local`,style:`margin: 2.5rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;`});r.appendChild(S);let C=K(`div`,{classes:[`glass-card`],style:`padding: 1.5rem; border-radius: 16px; margin-bottom: 2.5rem; display: flex; flex-direction: column; gap: 1rem;`});C.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
      <span style="font-weight: 600; color: var(--text-main);">Estado de Base de Datos y Logs</span>
      <div style="display: flex; gap: 0.5rem;">
        <button id="force-sync-btn" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin: 0; background: var(--primary);">Sincronizar Ahora</button>
        <button id="clear-logs-btn" class="btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-color: var(--border);">Limpiar Logs</button>
      </div>
    </div>
    <div id="sync-logs-list" style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; font-family: monospace; font-size: 0.8rem; padding-right: 0.5rem;">
      <div style="color: var(--text-muted); text-align: center; padding: 1rem;">Cargando registros...</div>
    </div>
  `,r.appendChild(C);let w=async()=>{let e=C.querySelector(`#sync-logs-list`);if(e)try{let t=await ut.getSyncLogs();if(t.length===0){e.innerHTML=`<div style="color: var(--text-muted); text-align: center; padding: 1rem;">No hay registros de sincronización aún.</div>`;return}e.innerHTML=t.map(e=>{let t=new Date(e.timestamp).toLocaleTimeString()+` `+new Date(e.timestamp).toLocaleDateString(),n=e.status===`SUCCESS`?`var(--success)`:`var(--danger)`;return`
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 0.75rem; border-radius: 8px; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>${`<span style="color: ${n}; font-weight: 700; border: 1px solid ${n}; padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.7rem; margin-right: 0.5rem;">${e.status}</span>`} <strong>${e.recordsSynced}</strong></span>
              <span style="color: var(--text-muted); font-size: 0.75rem;">${t} (${e.duration}ms)</span>
            </div>
            <div style="color: var(--text-muted); font-size: 0.75rem;">${e.details}</div>
          </div>
        `}).join(``)}catch(t){console.error(t),e.innerHTML=`<div style="color: var(--danger); text-align: center; padding: 1rem;">Error al cargar logs: ${t.message}</div>`}};C.querySelector(`#force-sync-btn`).onclick=async()=>{let e=C.querySelector(`#force-sync-btn`);e.disabled=!0,e.textContent=`Sincronizando...`,await ut.syncAll(window.SHARED_DATA_SOURCE_UID||`SHARED`),await w(),e.disabled=!1,e.textContent=`Sincronizar Ahora`},C.querySelector(`#clear-logs-btn`).onclick=async()=>{confirm(`¿Seguro que deseas vaciar el historial de sincronización local?`)&&(await ut.clearSyncLogs(),await w())};let T=()=>{w()};window.activeSyncLogsListener&&(window.removeEventListener(`app:sync-completed`,window.activeSyncLogsListener),window.removeEventListener(`app:sync-failed`,window.activeSyncLogsListener)),window.activeSyncLogsListener=T,window.addEventListener(`app:sync-completed`,T),window.addEventListener(`app:sync-failed`,T),w();let E=K(`h3`,{classes:[`settings-section-title`],text:`⚠️ Zona de Peligro / Mantenimiento`,style:`margin: 2.5rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--danger); font-weight: 700;`});r.appendChild(E);let D=K(`div`,{classes:[`glass-card`],style:`padding: 1.5rem; border-radius: 16px; margin-bottom: 2.5rem; border: 1px solid rgba(239, 68, 68, 0.2); display: flex; flex-direction: column; gap: 1.25rem;`});D.innerHTML=`
    <!-- Fila 1: Cajas (Retiros) -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
      <div style="flex: 1; min-width: 250px;">
        <span style="font-weight: 600; color: var(--text-main); display: block;">Reiniciar Cajas (Retiros)</span>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Vacía por completo la colección de Cajas (Retiros de carnicería) en la nube y su caché local IndexedDB.</span>
      </div>
      <button id="reset-cajas-btn" class="btn-primary" style="padding: 0.65rem 1.5rem; font-size: 0.82rem; margin: 0; background: var(--danger); border: none; color: #fff; font-weight: 600; cursor: pointer; border-radius: 8px;">
        💥 Reiniciar Cajas
      </button>
    </div>

    <!-- Fila 2: Caja General -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
      <div style="flex: 1; min-width: 250px;">
        <span style="font-weight: 600; color: var(--text-main); display: block;">Reiniciar Caja General</span>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Vacía por completo el libro contable de la Caja General en la nube.</span>
      </div>
      <button id="reset-caja-general-btn" class="btn-primary" style="padding: 0.65rem 1.5rem; font-size: 0.82rem; margin: 0; background: var(--danger); border: none; color: #fff; font-weight: 600; cursor: pointer; border-radius: 8px;">
        💥 Reiniciar Caja General
      </button>
    </div>

    <!-- Fila 3: Caja Frigorífico -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div style="flex: 1; min-width: 250px;">
        <span style="font-weight: 600; color: var(--text-main); display: block;">Reiniciar Caja Frigorífico</span>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Vacía por completo la colección de la Caja Frigorífico en la nube.</span>
      </div>
      <button id="reset-caja-frigorifico-btn" class="btn-primary" style="padding: 0.65rem 1.5rem; font-size: 0.82rem; margin: 0; background: var(--danger); border: none; color: #fff; font-weight: 600; cursor: pointer; border-radius: 8px;">
        💥 Reiniciar Caja Frigorífico
      </button>
    </div>
  `,r.appendChild(D);let O=(e,n,r,i)=>{let a=D.querySelector(`#`+e);a&&(a.onclick=()=>{ft(n,r,async()=>{a.disabled=!0;let e=a.textContent;a.textContent=`Reiniciando...`;try{t[i]?(await t[i](),o(`¡${n} reiniciada con éxito!`)):o(`Error: callback ${i} no definido.`,!0)}catch(e){console.error(`Error al reiniciar ${n.toLowerCase()}:`,e),o(`Error al reiniciar: `+e.message,!0)}finally{a.disabled=!1,a.textContent=e}})})};O(`reset-cajas-btn`,`Cajas (Retiros)`,`Esta acción borrará permanentemente todos los registros de Cajas (Retiros de carnicería) de forma irreversible en la base de datos de la nube y su caché local.`,`onResetCajasOnly`),O(`reset-caja-general-btn`,`Caja General`,`Esta acción borrará permanentemente todos los registros contables de la Caja General de forma irreversible en la base de datos de la nube.`,`onResetCajaGeneralOnly`),O(`reset-caja-frigorifico-btn`,`Caja Frigorífico`,`Esta acción borrará permanentemente todos los registros de la Caja Frigorífico de forma irreversible en la base de datos de la nube.`,`onResetCajaFrigorificoOnly`),e.appendChild(r)}function ft(e,t,n){let r=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem; animation: fadeIn 0.2s ease;`}),i=K(`div`,{classes:[`modal`,`glass-card`],style:`max-width: 420px; padding: 2rem; border-radius: 24px; border: 1px solid rgba(239, 68, 68, 0.3); background: var(--card-bg); box-shadow: var(--elevation-3); text-align: center;`});i.innerHTML=`
    <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; border: 1.5px solid rgba(239, 68, 68, 0.4); color: var(--danger); font-size: 1.8rem;">
      ⚠️
    </div>
    <h3 style="margin: 0 0 0.75rem 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main);">¿Reiniciar ${e}?</h3>
    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin: 0 0 1.5rem 0;">
      ${t}
    </p>
    <div style="margin-bottom: 1.5rem; text-align: left; display: flex; flex-direction: column; gap: 0.4rem;">
      <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Ingrese la contraseña de confirmación:</label>
      <input type="password" id="reset-confirm-password" class="form-input" placeholder="Contraseña..." style="width: 100%; text-align: center; font-size: 1.1rem; letter-spacing: 2px;">
    </div>
    <div style="display: flex; gap: 1rem; justify-content: stretch;">
      <button id="cancel-reset-btn" class="btn-outline" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer; border-color: var(--border); color: var(--text-main); background: transparent;">
        Cancelar
      </button>
      <button id="confirm-reset-btn" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 700; cursor: pointer; background: var(--danger); border: none; color: #fff; margin: 0;">
        Proceder
      </button>
    </div>
  `,r.appendChild(i),document.body.appendChild(r);let a=()=>r.remove();r.onclick=e=>{e.target===r&&a()},i.querySelector(`#cancel-reset-btn`).onclick=a;let o=i.querySelector(`#reset-confirm-password`);i.querySelector(`#confirm-reset-btn`).onclick=()=>{o.value===`180283`?(a(),n()):alert(`Contraseña incorrecta. Acción cancelada.`)}}function pt(e,t){let n=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem; animation: fadeIn 0.2s ease;`}),r=K(`div`,{classes:[`modal`,`glass-card`],style:`max-width: 420px; padding: 2rem; border-radius: 24px; border: 1px solid rgba(239, 68, 68, 0.2); background: var(--card-bg); box-shadow: var(--elevation-3); text-align: center;`});r.innerHTML=`
    <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; border: 1.5px solid rgba(239, 68, 68, 0.3); color: var(--danger); font-size: 1.8rem;">
      ⚠️
    </div>
    <h3 style="margin: 0 0 0.75rem 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main);">¿Eliminar Usuario?</h3>
    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin: 0 0 2rem 0;">
      Estás a punto de revocar todos los accesos del usuario <strong style="color: var(--danger); word-break: break-all;">${e}</strong>. Esta acción eliminará su registro de permisos en el sistema y no se puede deshacer.
    </p>
    <div style="display: flex; gap: 1rem; justify-content: stretch;">
      <button id="cancel-delete-btn" class="btn-outline" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer; border-color: var(--border); color: var(--text-main); background: transparent;">
        Cancelar
      </button>
      <button id="confirm-delete-btn" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 700; cursor: pointer; background: var(--danger); border: none; color: #fff; margin: 0;">
        Eliminar
      </button>
    </div>
  `,n.appendChild(r),document.body.appendChild(n);let i=()=>n.remove();n.onclick=e=>{e.target===n&&i()},r.querySelector(`#cancel-delete-btn`).onclick=i,r.querySelector(`#confirm-delete-btn`).onclick=()=>{i(),t()}}var mt=class{constructor(e={}){this._prices=e}get mestizoPrice(){let e=this._getValidNumericPrices();return e.length>0?Math.max(...e):0}get overoPrice(){let e=this.mestizoPrice,t=this._getValidNumericPrices().filter(t=>t<e);return t.length>0?Math.max(...t):e*.95}get vacaPrice(){return parseFloat(this._prices.VACA)||0}get toroPrice(){return parseFloat(this._prices.TORO)||0}_getValidNumericPrices(){return Object.values(this._prices).map(e=>parseFloat(e)).filter(e=>!isNaN(e))}},ht=e(D(),1);function gt(e,t){if(!e)return;let n=new mt(t.prices||{}),r=n.mestizoPrice,i=n.overoPrice,a=n.vacaPrice,o=n.toroPrice,s=new Date().toLocaleDateString(`es-AR`,{day:`2-digit`,month:`2-digit`,year:`numeric`}),c=e=>`$ `+new Intl.NumberFormat(`es-AR`,{minimumFractionDigits:2,maximumFractionDigits:2}).format(e)+`/kg`;e.innerHTML=``;let l=K(`div`,{classes:[`price-share-wrapper`,`fade-in`]}),u=K(`div`,{classes:[`price-share-nav`],style:`width: 100%; padding: 1rem; position: fixed; top: 0; left: 0; display: flex; align-items: center; justify-content: flex-start; z-index: 100;`});u.innerHTML=`
    <button id="back-btn" class="back-btn-m3" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);">
      <svg viewBox="0 0 24 24" style="fill: #fff;"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <span style="color: #fff; margin-left: 1rem; font-weight: 500; opacity: 0.7;">Placa de Cotizaciones</span>
  `,u.querySelector(`#back-btn`).onclick=t.onBack,l.appendChild(u);let d=K(`div`,{classes:[`theme-selector-panel`,`glass-card`]});d.innerHTML=`
    <h4 class="selector-title">🎨 Seleccionar Estilo de Placa</h4>
    <div class="theme-buttons">
      <button class="theme-btn active" data-theme="theme-crimson">
        <span class="color-dot crimson"></span> Crimson Luxury
      </button>
      <button class="theme-btn" data-theme="theme-gold">
        <span class="color-dot gold"></span> Midnight Gold
      </button>
      <button class="theme-btn" data-theme="theme-steel">
        <span class="color-dot steel"></span> Ocean Steel
      </button>
    </div>
  `,l.appendChild(d);let f=K(`div`,{classes:[`price-share-card`,`theme-crimson`],attrs:{id:`price-card-capture`}});f.innerHTML=`
    <div class="card-bg-overlay"></div>
    <div class="card-glass-glow"></div>
    <div class="card-border-line"></div>
    
    <div class="card-header-area">
      <div class="card-logo-container">
        <img src="/logo.jpg" alt="Logo" class="share-logo">
      </div>
      <div class="card-brand-details">
        <h2 class="card-brand-name">FRIGORÍFICO PAMPA</h2>
        <span class="card-badge-pill">PRECIOS DE REFERENCIA</span>
      </div>
    </div>
    
    <div class="card-title-area">
      <div class="card-date-badge">
        <svg viewBox="0 0 24 24" class="date-icon"><path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"></path></svg>
        <span>${s}</span>
      </div>
    </div>

    <div class="price-items-container">
      <div class="price-item-row item-mestizo">
        <div class="price-row-left">
          <span class="price-emoji">🐂</span>
          <span class="price-label">Mestizo</span>
        </div>
        <span class="price-value highlight-glow">${c(r)}</span>
      </div>
      
      <div class="price-item-row item-overo">
        <div class="price-row-left">
          <span class="price-emoji">🐂</span>
          <span class="price-label">Overo</span>
        </div>
        <span class="price-value">${c(i)}</span>
      </div>
      
      <div class="price-item-row item-vaca">
        <div class="price-row-left">
          <span class="price-emoji">🐄</span>
          <span class="price-label">Vaca</span>
        </div>
        <span class="price-value">${c(a)}</span>
      </div>
      
      <div class="price-item-row item-toro">
        <div class="price-row-left">
          <span class="price-emoji">🐂</span>
          <span class="price-label">Toro</span>
        </div>
        <span class="price-value">${c(o)}</span>
      </div>
    </div>

    <div class="card-footer-disclaimer">
      <p>⚠️ IMPORTANTE: Los precios exhibidos son de referencia y están sujetos a modificaciones sin previo aviso. Consulte con su asesor comercial antes de realizar operaciones.</p>
    </div>
  `,l.appendChild(f),d.querySelectorAll(`.theme-btn`).forEach(e=>{e.onclick=()=>{d.querySelectorAll(`.theme-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`);let t=e.dataset.theme;f.className=`price-share-card ${t}`}});let p=K(`div`,{classes:[`share-actions-container`]}),m=K(`button`,{classes:[`btn-share-action`,`btn-whatsapp`]});m.innerHTML=`
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.66 20.15 9.3 19.8 8.1 19.14L7.81 18.98L4.68 19.8L5.51 16.75L5.33 16.46C4.6 15.3 4.21 13.96 4.21 12.58C4.21 8.24 7.73 4.7 12.05 4.7M9.27 7.58C9.06 7.58 8.73 7.66 8.44 7.97C8.16 8.27 7.37 9.03 7.37 10.58C7.37 12.14 8.5 13.64 8.65 13.84C8.81 14.04 10.86 17.2 14.05 18.57C14.81 18.9 15.4 19.1 15.86 19.25C16.63 19.5 17.33 19.46 17.87 19.38C18.49 19.3 19.75 18.63 20.01 17.89C20.28 17.15 20.28 16.51 20.19 16.38C20.11 16.25 19.91 16.17 19.61 16.02C19.3 15.88 17.81 15.14 17.53 15.04C17.26 14.94 17.06 14.89 16.86 15.19C16.66 15.49 16.1 16.19 15.93 16.38C15.76 16.58 15.59 16.6 15.28 16.45C14.97 16.29 13.98 15.97 12.81 14.92C11.9 14.11 11.28 13.11 11.11 12.81C10.93 12.5 11.09 12.33 11.24 12.18C11.38 12.04 11.55 11.81 11.7 11.63C11.86 11.46 11.91 11.34 12.01 11.14C12.11 10.94 12.06 10.76 11.98 10.61C11.91 10.46 11.24 8.81 10.96 8.13C10.68 7.46 10.4 7.56 10.2 7.56C10 7.56 9.77 7.56 9.54 7.56" /></svg>
    <span>WhatsApp</span>
  `,m.onclick=()=>{let e=`📊 *PRECIOS DE REFERENCIA* (${s})\n*FRIGORIFICO PAMPA*\n\n🐂 *Mestizo:* ${c(r)}\n🐂 *Overo:* ${c(i)}\n🐄 *Vaca:* ${c(a)}\n🐂 *Toro:* ${c(o)}\n\n_Precios de referencia sujetos a modificaciones._\n*"IMPORTANTE: Los precios exhibidos son de referencia y pueden sufrir modificaciones sin previo aviso. Consulte con su asesor comercial."*`,t=`https://wa.me/?text=${encodeURIComponent(e)}`;window.open(t,`_blank`)},p.appendChild(m);let h=K(`button`,{classes:[`btn-share-action`,`btn-download`]});h.innerHTML=`
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>
    <span>Guardar Imagen</span>
  `,h.onclick=async()=>{try{let e=_t(h,`Generando...`),t=await(0,ht.default)(f,{scale:2.5,useCORS:!0,backgroundColor:null,logging:!1}),n=document.createElement(`a`);n.download=`Precios_Referencia_${s.replace(/\//g,`-`)}.png`,n.href=t.toDataURL(`image/png`),n.click(),vt(h,`Guardar Imagen`,e)}catch(e){console.error(`Failed to capture card`,e),alert(`Error al generar la imagen. Inténtelo de nuevo.`)}},p.appendChild(h);let g=K(`button`,{classes:[`btn-share-action`,`btn-copy`]});g.innerHTML=`
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" /></svg>
    <span>Copiar Portapapeles</span>
  `,g.onclick=async()=>{try{let e=_t(g,`Copiando...`),t=await(0,ht.default)(f,{scale:2.5,useCORS:!0,backgroundColor:null,logging:!1});t.toBlob(async n=>{if(!n)throw Error(`Canvas blob is empty`);try{await navigator.clipboard.write([new ClipboardItem({[n.type]:n})]),alert(`✅ ¡Imagen copiada al portapapeles con éxito!`)}catch(e){console.warn(`Direct clipboard copy failed, offering direct download instead.`,e);let n=document.createElement(`a`);n.href=t.toDataURL(`image/png`),n.download=`Precios_Referencia_${s.replace(/\//g,`-`)}.png`,n.click(),alert(`Su navegador no admite copiar imágenes directamente. Descargando en su lugar.`)}finally{vt(g,`Copiar Portapapeles`,e)}})}catch(e){console.error(`Failed to copy image`,e),alert(`Error al copiar la imagen.`)}},p.appendChild(g),l.appendChild(p),e.appendChild(l)}function _t(e,t){e.disabled=!0;let n=e.innerHTML;return e.dataset.original=n,e.innerHTML=`
    <span class="mini-spinner"></span>
    <span>${t}</span>
  `,e.querySelector(`.mini-spinner`)}function vt(e,t,n){n&&n.remove(),e.disabled=!1,e.innerHTML=e.dataset.original}function q(e){return new Intl.NumberFormat(`es-AR`,{style:`currency`,currency:`ARS`}).format(e||0)}function yt(e){return e?new Date(e).toLocaleDateString(`es-AR`):`-`}function bt(e){return e?new Date(e).toLocaleTimeString(`es-AR`,{hour:`2-digit`,minute:`2-digit`}):`-`}function xt(e){if(!e)return null;if(e instanceof Date){let t=new Date(e);return t.setHours(0,0,0,0),t}let t=String(e).split(`T`)[0].split(`-`);if(t.length===3){let[e,n,r]=t.map(Number);return new Date(e,n-1,r)}let n=new Date(e);return n.setHours(0,0,0,0),n}function St(e){if(!e)return 0;let t=xt(e),n=t?t.getTime():NaN;return isNaN(n)?0:n}function Ct(e){if(!e)return`-`;let t=xt(e);return t?t.toLocaleDateString(`es-AR`):`-`}function wt(e,t){if(!e)return null;let n=xt(e);return n?(n.setDate(n.getDate()+t),`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,`0`)}-${String(n.getDate()).padStart(2,`0`)}`):null}var Tt=class{constructor(e={}){this.id=e.id||``,this.bank=e.bank||``,this.checkNumber=e.checkNumber||``,this.nominalValue=parseFloat(e.nominalValue)||0,this.dueDate=e.dueDate||``,this.receptionDate=e.receptionDate||``,this.issueDate=e.issueDate||``,this.clearing=parseInt(e.clearing)||0,this.notes=e.notes||``,this.issuerName=e.issuerName||``,this.issuerCuit=e.issuerCuit||``,this.isECheck=e.isECheck===!0||e.isECheck===`true`,this.returned=e.returned||!1,this.returnedAt=e.returnedAt||null,this.settledByCompany=e.settledByCompany||!1,this.settledByCompanyAt=e.settledByCompanyAt||null,this.settledBySeller=e.settledBySeller||!1,this.settledBySellerAt=e.settledBySellerAt||null,this.buySide=e.buySide?{contactId:e.buySide.contactId||``,pesificacionRate:parseFloat(e.buySide.pesificacionRate)||0,monthlyInterest:parseFloat(e.buySide.monthlyInterest)||0,netAmount:parseFloat(e.buySide.netAmount)||0,operationId:e.buySide.operationId||``,date:e.buySide.date||null}:null,this.sellSide=e.sellSide?{contactId:e.sellSide.contactId||``,pesificacionRate:parseFloat(e.sellSide.pesificacionRate)||0,monthlyInterest:parseFloat(e.sellSide.monthlyInterest)||0,netAmount:parseFloat(e.sellSide.netAmount)||0,status:e.sellSide.status||`PENDING`,backReason:e.sellSide.backReason||``,operationId:e.sellSide.operationId||``,date:e.sellSide.date||null}:null,this.profit=parseFloat(e.profit)||0,this.days=parseInt(e.days)||0,this.expireAt=e.expireAt||null}calculate(){let e=new Date(this.receptionDate),t=new Date(this.dueDate),n=new Date(e);n.setFullYear(n.getFullYear()+3),this.expireAt=n;let r=t.getTime()-e.getTime(),i=Math.ceil(r/(1e3*60*60*24));if(this.days=i<=0?0:i+this.clearing,this.buySide){let e=this.nominalValue*(this.buySide.pesificacionRate/100),t=this.nominalValue*(this.buySide.monthlyInterest/100/30)*this.days;this.buySide.netAmount=this.nominalValue-e-t}if(this.sellSide&&this.sellSide.status===`SOLD`){let e=this.nominalValue*(this.sellSide.pesificacionRate/100),t=this.nominalValue*(this.sellSide.monthlyInterest/100/30)*this.days;this.sellSide.netAmount=this.nominalValue-e-t,this.profit=this.sellSide.netAmount-(this.buySide?this.buySide.netAmount:0)}else this.profit=0}get isPortfolio(){let e=this.sellSide?.status;return!e||e===`PENDING`||e===`BACK`||e===`RETURNED`}get isHistory(){let e=this.sellSide?.status;return e===`SOLD`||e===`REJECTED`}get purchaseDiscount(){return!this.buySide||isNaN(this.buySide.netAmount)?0:this.nominalValue-this.buySide.netAmount}get purchaseDiscountPercentage(){return this.nominalValue===0?0:this.purchaseDiscount/this.nominalValue*100}getDaysToPayDate(e=new Date){let t=new Date(e);t.setHours(0,0,0,0);let n=xt(this.dueDate);return n?Math.ceil((n-t)/(1e3*60*60*24)):0}getDaysToExpiry(e=new Date){let t=new Date(e);t.setHours(0,0,0,0);let n=xt(this.dueDate);if(!n)return 0;let r=new Date(n);return r.setDate(n.getDate()+30),Math.ceil((r-t)/(1e3*60*60*24))}getAlertState(e=new Date){let t=this.sellSide?.status||`PENDING`;if(t!==`PENDING`&&t!==`BACK`)return{status:t};let n=this.getDaysToPayDate(e),r=this.getDaysToExpiry(e);return r<0?{status:t,code:`EXPIRED`,label:`⛔ VENCIDO`,colorClass:`badge-danger`}:n<=0&&r<=10?{status:t,code:`EXPIRING_URGENT`,label:`⏳ PRÓXIMO A VENCER`,colorClass:`badge-warning`}:n<=0?{status:t,code:`AVAILABLE`,label:`✅ DISPONIBLE`,colorClass:`badge-disponible`}:n<=10?{status:t,code:`UPCOMING_PAYMENT`,label:`🔔 PAGO EN ${n}d`,colorClass:`badge-upcoming`,days:n}:{status:t,code:`IN_PORTFOLIO`,label:`EN CARTERA`,colorClass:`badge-pending`}}};function Et(e){let t=document.body.classList.contains(`dark`);return`border: 1.5px solid ${e}; background-color: ${t?`#1e1e1e`:`#ffffff`}; color: ${t?`#ffffff`:`#1a1a1a`}; border-radius: 10px; color-scheme: ${t?`dark`:`light`};`}function Dt(e,t,n,r){let i=!!e,a=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: flex-start; justify-content: center; z-index: 2000; padding: clamp(0.5rem, 3vw, 2rem); overflow-y: auto;`}),o=K(`div`,{classes:[`glass-card`],style:`width: 100%; max-width: 1100px; margin: auto; padding: 0; overflow: hidden; border-radius: 20px;`});o.innerHTML=`
    <div style="position: sticky; top: 0; z-index: 10; background: var(--card-bg); border-bottom: 1px solid var(--border); padding: 1.25rem 2rem; display: flex; align-items: center; justify-content: space-between; border-radius: 20px 20px 0 0;">
      <h2 style="margin: 0; font-size: clamp(1.1rem, 3vw, 1.4rem); font-weight: 700;">${i?`✏️ Editar`:`💸 Nueva`} Operación de Cheque</h2>
      <button type="button" class="btn-close-modal" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: var(--text-main); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s;">✕</button>
    </div>

    <div style="padding: clamp(1rem, 3vw, 2rem);">
    <form id="check-form">

      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1.25rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); font-weight: 600;">📄 Datos del Cheque</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem 1.5rem;">
          <div class="form-group" style="margin:0;">
            <label>Banco</label>
            <input type="text" name="bank" value="${e?.bank||``}" required placeholder="Ej: Banco Nación">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Número de Cheque</label>
            <input type="text" name="checkNumber" value="${e?.checkNumber||``}" required placeholder="12345678">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Valor Nominal ($)</label>
            <input type="number" step="0.01" name="nominalValue" value="${e?.nominalValue||``}" required placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Clearing (Días)</label>
            <input type="number" name="clearing" value="${e?.clearing||0}" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Fecha Emisión</label>
            <input type="date" name="issueDate" value="${e?.issueDate||``}">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Fecha Recepción</label>
            <input type="date" name="receptionDate" value="${e?.receptionDate||new Date().toISOString().split(`T`)[0]}" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Fecha de Pago</label>
            <input type="date" name="dueDate" value="${e?.dueDate||``}" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Tipo de Cheque</label>
            <select name="isECheck" style="width:100%;height:38px;padding:0 0.75rem;border-radius:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);color:var(--text-main);font-family:inherit;outline:none;font-weight:600;">
              <option value="false" ${e?.isECheck?``:`selected`}>Físico (Papel)</option>
              <option value="true" ${e?.isECheck?`selected`:``}>E-Cheque (Electrónico)</option>
            </select>
          </div>
        </div>
      </div>

      <div style="background: rgba(99,102,241,0.04); border: 1px solid rgba(99,102,241,0.25); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1.25rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--primary); font-weight: 600;">👤 Datos del Librador</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem 1.5rem;">
          <div class="form-group" style="margin:0;">
            <label>Nombre / Razón Social</label>
            <input type="text" name="issuerName" value="${e?.issuerName||``}" placeholder="Nombre del librador">
          </div>
          <div class="form-group" style="margin:0;">
            <label>CUIT Librador</label>
            <div style="display: flex; gap: 0.5rem;">
              <input type="text" name="issuerCuit" id="issuer-cuit" value="${e?.issuerCuit||``}" placeholder="20-XXXXXXXX-X" style="flex: 1;">
              <button type="button" id="btn-bcra" title="Consultar Situación Crediticia en BCRA" style="padding: 0 1rem; border-radius: 8px; background: #2563eb; color: white; border: none; cursor: pointer; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; white-space: nowrap;">
                🔍 BCRA
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style="background: rgba(99,102,241,0.06); border: 1px solid var(--primary); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1.25rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--primary); font-weight: 600;">📥 Compra (Origen)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem 1.5rem; align-items: end;">
          <div class="form-group" style="margin:0;">
            <label>Operador / Vendedor</label>
            <input type="text" id="buyside-contact-input" list="buyside-contacts-datalist" required placeholder="🔎 Buscar Operador..." autocomplete="off" value="${e?.buySide?.contactId?n.find(t=>t.id===e.buySide.contactId)?.name||e.buySide.contactId:``}">
            <datalist id="buyside-contacts-datalist">
              ${n.map(e=>`<option value="${e.name}"></option>`).join(``)}
            </datalist>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Pesificación (%)</label>
            <input type="number" step="0.01" name="buySide_pesificacionRate" value="${e?.buySide?.pesificacionRate!==void 0&&e?.buySide?.pesificacionRate!==null?e.buySide.pesificacionRate:``}" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual (%)</label>
            <input type="number" step="0.01" name="buySide_monthlyInterest" value="${e?.buySide?.monthlyInterest!==void 0&&e?.buySide?.monthlyInterest!==null?e.buySide.monthlyInterest:``}" required>
          </div>
          
          <div style="grid-column: 1 / -1; margin-top: 0.5rem; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.4); border-radius: 10px; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 700; color: var(--text-main); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Neto a Pagar</span>
            <div style="text-align: right;">
              <strong id="single-net-amount" style="font-size: 1.5rem; color: var(--primary); font-weight: 800;">$0,00</strong>
              <div id="single-net-days" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem; font-weight: 600;">0 días</div>
            </div>
          </div>
        </div>
      </div>

      ${i&&e?.sellSide?`
      <div style="background: rgba(16,185,129,0.04); border: 1px solid rgba(16,185,129,0.3); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1.25rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--success); font-weight: 600;">📤 Venta (Destino)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem 1.5rem; align-items: end;">
          <div class="form-group" style="margin:0;">
            <label>Estado de la Operación</label>
            <select name="sellSide_status" id="edit-sellside-status" style="width:100%;height:38px;padding:0 0.75rem;border-radius:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);color:var(--text-main);font-family:inherit;outline:none;">
              <option value="PENDING" ${e.sellSide.status===`PENDING`?`selected`:``}>En Cartera</option>
              <option value="SOLD" ${e.sellSide.status===`SOLD`?`selected`:``}>Vendido</option>
              <option value="RETURNED" ${e.sellSide.status===`RETURNED`?`selected`:``}>Devuelto</option>
              <option value="BACK" ${e.sellSide.status===`BACK`?`selected`:``}>Volvió</option>
              <option value="REJECTED" ${e.sellSide.status===`REJECTED`?`selected`:``}>Rechazado</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Comprador / Destinatario</label>
            <input type="text" id="sellside-contact-input" list="sellside-contacts-datalist" placeholder="🔎 Buscar contacto..." autocomplete="off" value="${e.sellSide.contactId?t.find(t=>t.id===e.sellSide.contactId)?.name||e.sellSide.contactId:``}">
            <datalist id="sellside-contacts-datalist">
              ${t.map(e=>`<option value="${e.name}"></option>`).join(``)}
            </datalist>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Pesificación Venta (%)</label>
            <input type="number" step="0.01" name="sellSide_pesificacionRate" value="${e.sellSide.pesificacionRate!==void 0&&e.sellSide.pesificacionRate!==null?e.sellSide.pesificacionRate:``}" placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual Venta (%)</label>
            <input type="number" step="0.01" name="sellSide_monthlyInterest" value="${e.sellSide.monthlyInterest!==void 0&&e.sellSide.monthlyInterest!==null?e.sellSide.monthlyInterest:``}" placeholder="0.00">
          </div>
          <div class="form-group" id="edit-backreason-group" style="margin:0; grid-column: 1 / -1; display:${e.sellSide.status===`BACK`?`block`:`none`};">
            <label>⚠️ Motivo de Retorno</label>
            <textarea name="sellSide_backReason" rows="2" style="resize:vertical;" placeholder="Motivo...">${e.sellSide.backReason||``}</textarea>
          </div>
          
          <div style="grid-column: 1 / -1; margin-top: 0.5rem; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); border-radius: 10px; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 700; color: var(--text-main); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Neto Cobrado / Venta</span>
            <div style="text-align: right;">
              <strong id="single-sell-net-amount" style="font-size: 1.5rem; color: #10b981; font-weight: 800;">$0,00</strong>
              <div id="single-sell-net-days" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem; font-weight: 600;">0 días</div>
            </div>
          </div>
        </div>
      </div>`:``}

      <div class="form-group">
        <label>Notas / Observaciones</label>
        <textarea name="notes" rows="2" placeholder="Observaciones adicionales..." style="resize: vertical;">${e?.notes||``}</textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.06); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer; min-width: 120px;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(99,102,241,0.4); letter-spacing: 0.03em; min-width: 180px;">Guardar Operación</button>
      </div>

    </form>
    </div>
  `,a.appendChild(o),document.body.appendChild(a),o.querySelector(`#btn-bcra`).onclick=()=>{let e=o.querySelector(`#issuer-cuit`).value.replace(/\D/g,``);if(!e||e.length<11){alert(`Por favor ingrese un CUIT válido (11 dígitos).`);return}navigator.clipboard.writeText(e).then(()=>{alert(`CUIT ${e} copiado al portapapeles.\n\nSe abrirá la web del BCRA. Pega el CUIT allí para consultar.`),window.open(`https://www.bcra.gob.ar/situacion-crediticia/`,`_blank`)}).catch(e=>{console.error(`Error copying to clipboard:`,e),window.open(`https://www.bcra.gob.ar/situacion-crediticia/`,`_blank`)})};let s=o.querySelector(`#edit-sellside-status`),c=o.querySelector(`#edit-backreason-group`);s&&c&&s.addEventListener(`change`,()=>{c.style.display=s.value===`BACK`?`block`:`none`});let l=o.querySelector(`#check-form`),u=()=>{let e=parseFloat(l.querySelector(`[name="nominalValue"]`).value)||0,t=parseFloat(l.querySelector(`[name="buySide_pesificacionRate"]`).value)||0,n=parseFloat(l.querySelector(`[name="buySide_monthlyInterest"]`).value)||0,r=parseInt(l.querySelector(`[name="clearing"]`).value)||0,i=l.querySelector(`[name="receptionDate"]`).value,a=l.querySelector(`[name="dueDate"]`).value,s=o.querySelector(`#single-sell-net-amount`),c=o.querySelector(`#single-sell-net-days`);if(!i||!a||e===0){o.querySelector(`#single-net-amount`).textContent=`$0,00`,o.querySelector(`#single-net-days`).textContent=`0 días`,s&&c&&(s.textContent=`$0,00`,c.textContent=`0 días`);return}let u=new Date(i+`T00:00:00`),d=new Date(a+`T00:00:00`),f=Math.max(0,Math.ceil((d-u)/864e5)+r),p=t/100*e,m=e*(n/100/30)*f,h=e-p-m;if(o.querySelector(`#single-net-amount`).textContent=q(h),o.querySelector(`#single-net-days`).textContent=`${f} días`,s&&c){let t=l.querySelector(`[name="sellSide_pesificacionRate"]`),n=l.querySelector(`[name="sellSide_monthlyInterest"]`),r=t&&parseFloat(t.value)||0,i=n&&parseFloat(n.value)||0,a=r/100*e,o=e*(i/100/30)*f;s.textContent=q(e-a-o),c.textContent=`${f} días`}};l.querySelectorAll(`input`).forEach(e=>e.addEventListener(`input`,u)),l.querySelectorAll(`select`).forEach(e=>e.addEventListener(`change`,u)),u(),l.onsubmit=s=>{s.preventDefault();let c=new FormData(l),u=o.querySelector(`#buyside-contact-input`).value.trim(),d=n.find(e=>e.name.toLowerCase().trim()===u.toLowerCase()),f=d?d.id:u;r({id:e?.id,bank:c.get(`bank`),checkNumber:c.get(`checkNumber`),nominalValue:c.get(`nominalValue`),clearing:c.get(`clearing`),issueDate:c.get(`issueDate`),receptionDate:c.get(`receptionDate`),dueDate:c.get(`dueDate`),issuerName:c.get(`issuerName`),issuerCuit:c.get(`issuerCuit`),notes:c.get(`notes`),isECheck:c.get(`isECheck`)===`true`,buySide:{contactId:f,pesificacionRate:c.get(`buySide_pesificacionRate`),monthlyInterest:c.get(`buySide_monthlyInterest`)},sellSide:(()=>{if(i&&e?.sellSide){let n=o.querySelector(`#edit-sellside-status`),r=o.querySelector(`#sellside-contact-input`),i=c.get(`sellSide_pesificacionRate`),a=c.get(`sellSide_monthlyInterest`),s=c.get(`sellSide_backReason`),l=n?n.value:e.sellSide.status,u=r?r.value.trim():``,d=t.find(e=>e.name.toLowerCase().trim()===u.toLowerCase()),f=d?d.id:u||e.sellSide.contactId;return{...e.sellSide,status:l,contactId:f||e.sellSide.contactId,pesificacionRate:i!==null&&i!==``?i:e.sellSide.pesificacionRate,monthlyInterest:a!==null&&a!==``?a:e.sellSide.monthlyInterest,backReason:s===null?e.sellSide.backReason||``:s}}return e?.sellSide||{status:`PENDING`,contactId:null,pesificacionRate:``,monthlyInterest:``,backReason:``}})()}),a.remove()};let d=()=>a.remove();o.querySelector(`.btn-cancel`).onclick=d,o.querySelector(`.btn-close-modal`).onclick=d,a.addEventListener(`click`,e=>{e.target===a&&d()})}function Ot(e,t){let n=new Date().toISOString().split(`T`)[0],r=K(`div`,{classes:[`modal-overlay`],style:`position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:flex-start;justify-content:center;z-index:2000;padding:clamp(0.5rem,3vw,2rem);overflow-y:auto;`}),i=K(`div`,{classes:[`glass-card`],style:`width:100%;max-width:1400px;margin:auto;padding:0;overflow:hidden;border-radius:20px;`});i.innerHTML=`
    <div style="position:sticky;top:0;z-index:10;background:var(--card-bg);border-bottom:1px solid var(--border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;border-radius:20px 20px 0 0;">
      <h2 style="margin:0;font-size:clamp(1.1rem,3vw,1.35rem);font-weight:700;">📥 Compra Masiva de Cheques</h2>
      <button type="button" class="btn-close-modal" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);color:var(--text-main);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>
    <div style="padding:clamp(1rem,3vw,1.75rem);">

      <div style="background:rgba(99,102,241,0.06);border:2px solid var(--primary);border-radius:14px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;">
        <h3 style="margin:0 0 1rem;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--primary);font-weight:600;">🔗 Datos Comunes del Lote</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
          <div class="form-group" style="margin:0;">
            <label>Vendedor (Origen)</label>
            <input type="text" id="batch-seller-input" list="batch-contacts-dl" placeholder="🔎 Buscar..." autocomplete="off">
            <datalist id="batch-contacts-dl">
              ${e.map(e=>`<option value="${e.name}"></option>`).join(``)}
            </datalist>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Pesificación Compra (%)</label>
            <input type="number" step="0.01" id="batch-buy-pesif" placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual Compra (%)</label>
            <input type="number" step="0.01" id="batch-buy-interest" placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>F. Recepción</label>
            <input type="date" id="batch-reception-date" value="${n}">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Clearing (Días)</label>
            <input type="number" id="batch-clearing" value="0">
          </div>
          <div class="form-group" style="margin:0; grid-column: 1 / -1; margin-top: 0.5rem;">
            <label>Notas / Observaciones</label>
            <textarea id="batch-notes" rows="2" placeholder="Observaciones adicionales (se aplicará a todos los cheques del lote)..." style="resize: vertical;"></textarea>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
        <h3 style="margin:0;font-size:0.9rem;font-weight:700;">📄 Cheques del Lote</h3>
        <button type="button" id="batch-add-row" style="padding:0.55rem 1.4rem;border-radius:10px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;cursor:pointer;font-weight:700;font-size:0.875rem;box-shadow:0 3px 10px rgba(99,102,241,0.4);letter-spacing:0.02em;transition:opacity 0.2s;">+ Agregar cheque</button>
      </div>
      <div id="batch-rows-container" style="display:flex;flex-direction:column;gap:0.75rem;max-height:380px;overflow-y:auto;padding-right:4px;"></div>

      <div id="batch-summary" style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(99,102,241,0.12)); border: 2px solid rgba(99,102,241,0.4); border-radius: 16px; display: flex; gap: 2rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 2.5rem;">
          <div><span style="color:var(--text-muted);font-size:0.85rem;font-weight:700;text-transform:uppercase;">Cant. Cheques</span><br><strong id="sum-count" style="font-size:1.4rem;">0</strong></div>
          <div><span style="color:var(--text-muted);font-size:0.85rem;font-weight:700;text-transform:uppercase;">Nominal Total</span><br><strong id="sum-nominal" style="font-size:1.4rem;">$0,00</strong></div>
        </div>
        <div style="text-align: right; background: rgba(0,0,0,0.15); padding: 1rem 1.5rem; border-radius: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
          <span style="color:var(--text-muted);font-size:0.9rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Neto a Pagar (Total)</span><br>
          <strong id="sum-net" style="color:var(--primary);font-size:2.2rem;font-weight:800;text-shadow:0 2px 10px rgba(99,102,241,0.2);line-height:1.2;">$0,00</strong>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:1rem;margin-top:1.5rem;flex-wrap:wrap;">
        <button type="button" class="btn-cancel" style="padding:0.85rem 2rem;border-radius:12px;background:rgba(255,255,255,0.06);color:var(--text-main);font-size:1rem;font-weight:600;border:1px solid var(--outline);cursor:pointer;">Cancelar</button>
        <button type="button" id="batch-save-btn" style="padding:0.85rem 2.5rem;border-radius:12px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:1rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 15px rgba(99,102,241,0.4);">Guardar Lote</button>
      </div>
    </div>
  `,r.appendChild(i),document.body.appendChild(r);let a=i.querySelector(`#batch-rows-container`);function o(e,t,n,r,i,a){let o=parseFloat(e)||0,s=parseFloat(t)||0,c=parseFloat(n)||0,l=parseInt(a)||0;if(!r||!i||o===0)return null;let u=new Date(r+`T00:00:00`),d=new Date(i+`T00:00:00`),f=Math.max(0,Math.ceil((d-u)/864e5)+l),p=s/100*o,m=o*(c/100/30)*f;return{net:o-p-m,days:f,nv:o}}function s(){let e=a.querySelectorAll(`.batch-check-row`),t=i.querySelector(`#batch-buy-pesif`).value,n=i.querySelector(`#batch-buy-interest`).value,r=i.querySelector(`#batch-reception-date`).value,s=i.querySelector(`#batch-clearing`).value,c=0,l=0,u=0;e.forEach(e=>{let i=e.querySelector(`.row-nominal`).value,a=e.querySelector(`.row-duedate`).value,d=o(i,t,n,r,a,s);if(d){c+=d.nv,l+=d.net,u++;let t=e.querySelector(`.row-net-preview`);t&&(t.textContent=`Neto: ${q(d.net)} (${d.days}d)`)}}),i.querySelector(`#sum-count`).textContent=e.length,i.querySelector(`#sum-nominal`).textContent=q(c),i.querySelector(`#sum-net`).textContent=q(l)}function c(){let e=K(`div`,{classes:[`batch-check-row`],style:`background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:0.85rem 1rem;display:flex;flex-direction:column;gap:0.65rem;`});e.innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:0.75rem;align-items:end;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">Banco</label>
          <input type="text" class="row-bank" placeholder="Ej: BNA" style="font-size:0.9rem;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;"># Cheque</label>
          <input type="text" class="row-number" placeholder="12345678" style="font-size:0.9rem;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">Nominal ($)</label>
          <input type="number" step="0.01" class="row-nominal" placeholder="0.00" style="font-size:0.9rem;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">F. Pago</label>
          <input type="date" class="row-duedate" style="font-size:0.9rem;">
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;">
          <button type="button" class="row-remove-btn" style="background:rgba(239,68,68,0.15);border:1px solid var(--danger);color:var(--danger);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer;font-size:0.8rem;font-weight:700;">✕</button>
          <span class="row-net-preview" style="font-size:0.85rem;font-weight:700;color:var(--primary);background:rgba(99,102,241,0.15);padding:0.4rem 0.8rem;border-radius:6px;border:1px solid rgba(99,102,241,0.3);white-space:nowrap;display:inline-block;min-width:120px;text-align:center;">Neto: $0,00</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1.2fr 1.2fr 0.8fr;gap:0.75rem;align-items:end;padding-top:0.15rem;border-top:1px solid rgba(255,255,255,0.06);">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">👤 Librador</label>
          <input type="text" class="row-issuer-name" placeholder="Nombre del librador" style="font-size:0.9rem;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">CUIT Librador</label>
          <div style="display:flex;gap:0.4rem;">
            <input type="text" class="row-issuer-cuit" placeholder="20-XXXXXXXX-X" style="font-size:0.9rem;flex:1;">
            <button type="button" class="row-bcra-btn" title="Consultar Central de Deudores BCRA" style="padding:0 0.8rem;border-radius:8px;background:#2563eb;color:white;border:none;cursor:pointer;font-size:0.75rem;font-weight:700;white-space:nowrap;flex-shrink:0;">🔍 BCRA</button>
          </div>
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">Tipo</label>
          <select class="row-isecheck" style="width:100%;height:38px;padding:0 0.5rem;border-radius:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);color:var(--text-main);font-family:inherit;outline:none;font-size:0.85rem;font-weight:600;">
            <option value="false">Físico</option>
            <option value="true">E-Cheque</option>
          </select>
        </div>
      </div>
    `,e.querySelector(`.row-remove-btn`).onclick=()=>{e.remove(),s()},e.querySelectorAll(`input`).forEach(e=>e.addEventListener(`input`,s)),e.querySelector(`.row-bcra-btn`).onclick=()=>{let t=e.querySelector(`.row-issuer-cuit`).value.replace(/\D/g,``);if(!t||t.length<11){alert(`Por favor ingrese un CUIT válido (11 dígitos).`);return}navigator.clipboard.writeText(t).then(()=>{alert(`CUIT ${t} copiado al portapapeles.\n\nSe abrirá la web del BCRA. Pega el CUIT allí para consultar.`),window.open(`https://www.bcra.gob.ar/situacion-crediticia/`,`_blank`)}).catch(()=>window.open(`https://www.bcra.gob.ar/situacion-crediticia/`,`_blank`))},a.appendChild(e),s()}c(),c(),c(),i.querySelector(`#batch-add-row`).onclick=c,i.querySelectorAll(`#batch-buy-pesif, #batch-buy-interest, #batch-reception-date, #batch-clearing`).forEach(e=>e.addEventListener(`input`,s)),i.querySelector(`#batch-save-btn`).onclick=()=>{let o=i.querySelector(`#batch-seller-input`).value.trim(),s=e.find(e=>e.name.toLowerCase()===o.toLowerCase()),c=s?s.id:o||null,l=i.querySelector(`#batch-buy-pesif`).value,u=i.querySelector(`#batch-buy-interest`).value,d=i.querySelector(`#batch-reception-date`).value,f=i.querySelector(`#batch-clearing`).value,p=i.querySelector(`#batch-notes`).value.trim(),m=a.querySelectorAll(`.batch-check-row`),h=[];if(m.forEach(e=>{let t=e.querySelector(`.row-bank`).value.trim(),r=e.querySelector(`.row-number`).value.trim(),i=e.querySelector(`.row-nominal`).value,a=e.querySelector(`.row-duedate`).value,o=e.querySelector(`.row-issuer-name`).value.trim(),s=e.querySelector(`.row-issuer-cuit`).value.trim(),m=e.querySelector(`.row-isecheck`).value===`true`;!i||!a||h.push({bank:t,checkNumber:r,nominalValue:i,dueDate:a,receptionDate:d||n,clearing:f||0,issueDate:``,issuerName:o,issuerCuit:s,notes:p,isECheck:m,buySide:{contactId:c,pesificacionRate:l,monthlyInterest:u},sellSide:{status:`PENDING`,contactId:null,pesificacionRate:``,monthlyInterest:``,backReason:``}})}),h.length===0){alert(`Agregue al menos un cheque con valor nominal y fecha de pago.`);return}t(h),r.remove()};let l=()=>r.remove();i.querySelector(`.btn-cancel`).onclick=l,i.querySelector(`.btn-close-modal`).onclick=l,r.addEventListener(`click`,e=>{e.target===r&&l()})}function kt(e,t,n,r,i=!1){let a=K(`div`,{classes:[`modal-overlay`],style:`position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;z-index:2000;padding:clamp(0.5rem,3vw,2rem);`}),o=K(`div`,{classes:[`glass-card`],style:`width:100%;max-width:1150px;padding:0;overflow:hidden;border-radius:20px;display:flex;flex-direction:column;max-height:90vh;`});o.innerHTML=`
    <div style="background:var(--card-bg);border-bottom:1px solid var(--border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;border-radius:20px 20px 0 0;flex-shrink:0;">
      <h2 style="margin:0;font-size:1.2rem;font-weight:700;">📤 Venta de ${t.length} Cheque${t.length>1?`s`:``}</h2>
      <button type="button" class="btn-close-modal" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);color:var(--text-main);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>
    <div style="padding:1.5rem 2rem;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:1.25rem;">
      <p style="margin:0;color:var(--text-muted);font-size:0.9rem;">Los datos de venta se aplicarán a los <strong>${t.length}</strong> cheque(s) seleccionados.</p>

      <!-- Resumen de Cheques Seleccionados -->
      <div>
        <h3 style="margin:0 0 0.5rem;font-size:0.9rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">📋 Detalle Completo de la Selección</h3>
        <div style="max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:12px;background:rgba(0,0,0,0.15);scrollbar-width:thin;">
          <table style="width:100%;border-collapse:collapse;font-size:0.82rem;text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);background:rgba(255,255,255,0.03);color:var(--text-muted);font-weight:700;text-transform:uppercase;font-size:0.72rem;letter-spacing:0.5px;">
                <th style="padding:0.6rem 0.85rem;">Banco / Nº</th>
                <th style="padding:0.6rem 0.85rem;">Librador / CUIT</th>
                <th style="padding:0.6rem 0.85rem;">Fechas / Días</th>
                <th style="padding:0.6rem 0.85rem;text-align:right;">Nominal</th>
                ${i?``:`
                <th style="padding:0.6rem 0.85rem;text-align:right;color:#fbbf24;">Neto Compra</th>
                <th style="padding:0.6rem 0.85rem;text-align:right;color:#60a5fa;">Neto Venta</th>
                <th style="padding:0.6rem 0.85rem;text-align:right;color:#34d399;">Ganancia</th>
                `}
              </tr>
            </thead>
            <tbody id="bsell-checks-tbody"></tbody>
            <tfoot>
              <tr style="border-top:1px solid var(--border);font-weight:800;background:rgba(255,255,255,0.03);font-size:0.85rem;color:#ffffff;">
                <td colspan="3" style="padding:0.65rem 0.85rem;text-transform:uppercase;">TOTALES</td>
                <td id="bsell-total-nominal" style="padding:0.65rem 0.85rem;text-align:right;font-family:monospace;color:#ffffff;">$0.00</td>
                ${i?``:`
                <td id="bsell-total-buy-net" style="padding:0.65rem 0.85rem;text-align:right;font-family:monospace;color:#fbbf24;">$0.00</td>
                <td id="bsell-total-net" style="padding:0.65rem 0.85rem;text-align:right;font-family:monospace;color:#60a5fa;">$0.00</td>
                <td id="bsell-total-profit" style="padding:0.65rem 0.85rem;text-align:right;font-family:monospace;color:#34d399;">$0.00</td>
                `}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:1.25rem;">
        <div class="form-group" style="margin:0;">
          <label>Comprador / Destinatario</label>
          <input type="text" id="bsell-buyer-input" list="bsell-contacts-dl" placeholder="🔎 Buscar..." autocomplete="off">
          <datalist id="bsell-contacts-dl">
            ${e.map(e=>`<option value="${e.name}"></option>`).join(``)}
          </datalist>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
          <div class="form-group" style="margin:0;">
            <label>Pesificación (%)</label>
            <input type="number" step="0.01" id="bsell-pesif" placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual (%)</label>
            <input type="number" step="0.01" id="bsell-interest" placeholder="0.00">
          </div>
        </div>
        <div class="form-group" style="margin:0;">
          <label>Estado</label>
          <select id="bsell-status" style="${Et(`var(--success)`,`#10b981`)} padding:0.55rem 0.75rem;">
            <option value="SOLD">Vendido</option>
            <option value="PENDING">En Cartera</option>
            <option value="RETURNED">Devuelto</option>
            <option value="BACK">Volvió</option>
            <option value="REJECTED">Rechazado</option>
          </select>
        </div>
        <div class="form-group" id="bsell-backreason-group" style="margin:0;display:none;">
          <label>⚠️ Motivo de Retorno</label>
          <textarea id="bsell-backreason" rows="2" style="resize:vertical;" placeholder="Motivo..."></textarea>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1.25rem;flex-wrap:wrap;gap:1rem;flex-shrink:0;">
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" id="bsell-print-btn" style="padding:0.75rem 1.25rem;border-radius:12px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.35);color:#818cf8;font-size:0.85rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.4rem;transition:all 0.2s;">🖨️ Imprimir</button>
          <button type="button" id="bsell-excel-btn" style="padding:0.75rem 1.25rem;border-radius:12px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);color:#34d399;font-size:0.85rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.4rem;transition:all 0.2s;">📥 Excel</button>
        </div>
        <div style="display:flex;gap:0.75rem;">
          <button type="button" class="btn-cancel" style="padding:0.75rem 1.75rem;border-radius:12px;background:rgba(255,255,255,0.06);color:var(--text-main);font-size:0.88rem;font-weight:600;border:1px solid var(--outline);cursor:pointer;transition:all 0.2s;">Cancelar</button>
          <button type="button" id="bsell-save-btn" style="padding:0.75rem 2.25rem;border-radius:12px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:0.88rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.4);transition:all 0.2s;">Aplicar Venta</button>
        </div>
      </div>
    </div>
  `,a.appendChild(o),document.body.appendChild(a);let s=o.querySelector(`#bsell-status`),c=o.querySelector(`#bsell-backreason-group`);s.addEventListener(`change`,()=>{c.style.display=s.value===`BACK`?`block`:`none`});let l=[],u=()=>{let e=parseFloat(o.querySelector(`#bsell-pesif`).value)||0,n=parseFloat(o.querySelector(`#bsell-interest`).value)||0,r=0,a=0,s=0,c=0,u=o.querySelector(`#bsell-checks-tbody`);u.innerHTML=``,l=t.map(t=>{let o=new Tt(JSON.parse(JSON.stringify(t)));o.sellSide||={},o.sellSide.status=`SOLD`,o.sellSide.pesificacionRate=e,o.sellSide.monthlyInterest=n,o.calculate(),r+=o.nominalValue,a+=o.buySide?.netAmount||0,s+=o.sellSide.netAmount,c+=o.profit;let l=document.createElement(`tr`);return l.style.borderBottom=`1px solid rgba(255,255,255,0.02)`,l.innerHTML=`
        <td style="padding:0.55rem 0.85rem;">
          <div style="font-weight:700;color:#ffffff;">${o.bank||`-`}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">Nº ${o.checkNumber||`-`}</div>
        </td>
        <td style="padding:0.55rem 0.85rem;">
          <div style="font-weight:600;color:#ffffff;">${o.issuerName||`-`}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">CUIT ${o.issuerCuit||`-`}</div>
        </td>
        <td style="padding:0.55rem 0.85rem;">
          <div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">Rec: ${Ct(o.receptionDate)}</div>
          <div style="font-weight:700;color:#ffffff;font-size:0.85rem;">Venc: ${Ct(o.dueDate)}</div>
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;">${o.days||0}d (Clear: ${o.clearing||0}d)</div>
        </td>
        <td style="padding:0.55rem 0.85rem;text-align:right;font-family:monospace;font-weight:700;color:#ffffff;">${q(o.nominalValue)}</td>
        ${i?``:`
        <td style="padding:0.55rem 0.85rem;text-align:right;font-family:monospace;color:#fbbf24;font-weight:700;">${q(o.buySide?.netAmount||0)}</td>
        <td style="padding:0.55rem 0.85rem;text-align:right;font-family:monospace;color:#60a5fa;font-weight:700;">${q(o.sellSide.netAmount)}</td>
        <td style="padding:0.55rem 0.85rem;text-align:right;font-family:monospace;color:#34d399;font-weight:700;">+${q(o.profit)}</td>
        `}
      `,u.appendChild(l),o}),o.querySelector(`#bsell-total-nominal`).textContent=q(r),i||(o.querySelector(`#bsell-total-buy-net`).textContent=q(a),o.querySelector(`#bsell-total-net`).textContent=q(s),o.querySelector(`#bsell-total-profit`).textContent=q(c))};o.querySelector(`#bsell-pesif`).addEventListener(`input`,u),o.querySelector(`#bsell-interest`).addEventListener(`input`,u),u(),o.querySelectorAll(`button`).forEach(e=>{e.addEventListener(`mouseenter`,()=>{e.style.transform=`scale(1.03)`,e.style.filter=`brightness(1.15)`}),e.addEventListener(`mouseleave`,()=>{e.style.transform=`scale(1)`,e.style.filter=`none`})}),o.querySelector(`#bsell-print-btn`).onclick=()=>{Fe(`PROFORMA`,o.querySelector(`#bsell-buyer-input`).value.trim()||`PROFORMA`,new Date().toISOString(),l,e)},o.querySelector(`#bsell-excel-btn`).onclick=()=>{Ie(`PROFORMA`,o.querySelector(`#bsell-buyer-input`).value.trim()||`PROFORMA`,new Date().toISOString(),l,e)},o.querySelector(`#bsell-save-btn`).onclick=()=>{let i=o.querySelector(`#bsell-buyer-input`).value.trim(),c=e.find(e=>e.name.toLowerCase()===i.toLowerCase()),l=c?c.id:i||null;n({status:s.value,contactId:l,pesificacionRate:o.querySelector(`#bsell-pesif`).value,monthlyInterest:o.querySelector(`#bsell-interest`).value,backReason:o.querySelector(`#bsell-backreason`).value||``},t.map(e=>e.id)),r&&r(),a.remove()};let d=()=>a.remove();o.querySelector(`.btn-cancel`).onclick=d,o.querySelector(`.btn-close-modal`).onclick=d,a.addEventListener(`click`,e=>{e.target===a&&d()})}function At(e,t,n,r){let i=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.25rem; background: rgba(255,255,255,0.01); border-radius: 14px; border: 1px solid var(--border); margin-bottom: 2rem; flex-wrap: wrap; gap: 0.75rem;`}),a=K(`div`,{text:`Mostrando página ${e} de ${t} (${n} registros)`,style:`font-size: 0.82rem; color: var(--text-muted); font-weight: 550;`});i.appendChild(a);let o=K(`div`,{style:`display: flex; gap: 0.5rem; align-items: center;`}),s=K(`button`,{classes:[`btn-secondary`],text:`Anterior`,style:`padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 8px;`});s.disabled=e===1,s.onclick=()=>r(e-1),o.appendChild(s);let c=K(`span`,{text:`Pág. ${e} / ${t}`,style:`font-size: 0.82rem; font-weight: 700; margin: 0 0.5rem; color: var(--text-main);`});o.appendChild(c);let l=K(`button`,{classes:[`btn-secondary`],text:`Siguiente`,style:`padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 8px;`});return l.disabled=e===t,l.onclick=()=>r(e+1),o.appendChild(l),i.appendChild(o),i}function jt(e){let t=e.getAlertState(),n=``;return t.status===`SOLD`?n+=`<kmp-status-chip status="SOLD"></kmp-status-chip>`:t.status===`RETURNED`?n+=`<kmp-status-chip status="RETURNED"></kmp-status-chip>`:t.status===`REJECTED`?n+=`<kmp-status-chip status="REJECTED"></kmp-status-chip>`:t.status===`BACK`&&(n+=`<kmp-status-chip status="BACK" label="VOLVIÓ"></kmp-status-chip>`),t.code===`EXPIRED`?n+=` <kmp-status-chip status="REJECTED" label="⛔ VENCIDO"></kmp-status-chip>`:t.code===`EXPIRING_URGENT`?n+=` <kmp-status-chip status="PENDING" label="⏳ PRÓXIMO VENC."></kmp-status-chip>`:t.code===`AVAILABLE`?n+=` <kmp-status-chip status="COMPLETED" label="✅ DISPONIBLE"></kmp-status-chip>`:t.code===`UPCOMING_PAYMENT`&&(n+=` <kmp-status-chip status="DRAFT" label="🔔 PAGO EN ${t.days}d"></kmp-status-chip>`),n||`<kmp-status-chip status="PENDING" label="EN CARTERA"></kmp-status-chip>`}function Mt(e,t,n,r,i=`receptionDate`,a=!1,o=!1,s=null,c=null,l=!1,u=[]){let d=K(`div`,{classes:[`glass-card`,`table-responsive`],style:`padding: 0; margin-bottom: 2rem; border-radius: 18px; overflow: hidden; border: 1px solid var(--border);`}),f=K(`table`,{classes:[`card-style-table`],style:`width: 100%; min-width: 850px; font-size: 0.88rem;`}),p=K(`thead`,{html:`
    <tr style="background: rgba(255,255,255,0.03); border-bottom: 2px solid var(--border); text-align: left; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
      ${o?`<th style="padding: 1rem; width: 40px; text-align: center;"><input type="checkbox" id="check-all-cb" style="width: 16px; height: 16px; cursor: pointer;" title="Seleccionar todos"></th>`:``}
      <th style="padding: 1rem 1.25rem;">Banco / Emisor</th>
      <th style="padding: 1rem 1.25rem;">Cobro / Vencimiento</th>
      <th style="padding: 1rem 1.25rem; text-align: right;">Valor Nominal</th>
      <th style="padding: 1rem 1.25rem; text-align: left;">Flujo Origen/Destino</th>
      ${l?``:`<th style="padding: 1rem 1.25rem; text-align: right;">${o?`Desc. Compra`:`Ganancia`}</th>`}
      <th style="padding: 1rem 1.25rem; text-align: right;">Acciones</th>
    </tr>
  `});f.appendChild(p);let m=K(`tbody`);if(e.length===0)m.innerHTML=`<tr><td colspan="7" style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-weight: 600;">Sin registros en esta sección.</td></tr>`;else if(e.sort((e,t)=>{let n=St(e[i]),r=St(t[i]);return a?n-r:r-n}).forEach(e=>{let i=K(`tr`,{classes:e.isECheck?[`check-card-row`,`echeck-row`]:[`check-card-row`],style:`box-shadow: var(--elevation-1);`}),a=e.sellSide&&e.sellSide.status===`SOLD`,d=t.find(t=>t.id===e.buySide?.contactId)?.name||e.buySide?.contactId||`Desconocido`,f=t.find(t=>t.id===e.sellSide?.contactId)?.name||e.sellSide?.contactId||`-`,p=e.getDaysToExpiry(),h=p<0?`#ef4444`:p<=10?`#f97316`:`var(--text-muted)`,g=p<0?`Vencido hace ${Math.abs(p)}d`:`${p}d restantes`,_=o?`<td style="padding: 1rem; width: 40px; text-align: center; border-radius: 14px 0 0 14px;"><input type="checkbox" class="portfolio-check-cb" data-id="${e.id}" style="width: 17px; height: 17px; cursor: pointer;"></td>`:``,v=g?`
        <div style="display: inline-flex; align-items: center; margin-top: 0.45rem; padding: 0.2rem 0.55rem; border-radius: 6px; background: ${p<0?`rgba(239, 68, 68, 0.15)`:p<=10?`rgba(249, 115, 22, 0.15)`:`rgba(255, 255, 255, 0.05)`}; border: 1px solid ${p<0?`rgba(239, 68, 68, 0.3)`:p<=10?`rgba(249, 115, 22, 0.3)`:`rgba(255, 255, 255, 0.1)`}; color: ${h}; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.2px;">
          ${p<0?`⚠️`:`⏳`} ${g.toUpperCase()}
        </div>`:``;i.innerHTML=`
        ${_}
        <td style="${o?``:`border-radius: 14px 0 0 14px;`}">
          <div style="font-size: 0.95rem; font-weight: 800; color: #ffffff; letter-spacing: 0.3px; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            Nº ${e.checkNumber||`S/N`}
            ${e.isECheck?`
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.4rem; border-radius: 4px; background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); letter-spacing: 0.5px;">E-CHEQ</span>
            `:`
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.4rem; border-radius: 4px; background: rgba(251,191,36,0.1); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); letter-spacing: 0.5px;">FÍSICO</span>
            `}
          </div>
          ${e.issuerName?`<div style="font-size: 0.82rem; color: var(--primary); font-weight: 700; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.3rem;"><span style="font-size: 0.85rem;">👤</span> ${e.issuerName}</div>`:``}
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.3rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.25rem;"><span style="font-size: 0.8rem;">🏛️</span> ${e.bank||`SIN BANCO`}</div>
        </td>
        <td>
          <div style="font-weight: 750; color: #ffffff; display: flex; align-items: center; gap: 0.35rem; font-size: 0.9rem;">
            <span style="color: var(--primary);">📅</span> ${Ct(e.dueDate)}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 600;">Límite: ${Ct(wt(e.dueDate,30))}</div>
          ${v}
        </td>
        <td style="font-weight: 900; text-align: right; font-family: monospace; font-size: 1.05rem; color: #ffffff; letter-spacing: 0.2px;">${q(e.nominalValue)}</td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.35rem; border-radius: 4px; background: rgba(143,0,20,0.12); color: var(--primary); border: 1px solid rgba(143,0,20,0.25);">DE</span>
              <span style="color: var(--text-main); font-weight: 700;">${d}</span>
            </div>
            <div style="font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.35rem; border-radius: 4px; background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25);">A</span>
              <span style="color: var(--text-main); font-weight: 700;">${a?f:`<span style="color:var(--text-muted);font-weight:600;font-style:italic;">(En Cartera)</span>`}</span>
            </div>
          </div>
          ${e.sellSide?.status===`BACK`&&e.sellSide?.backReason?`<div style="font-size: 0.72rem; color: #f43f5e; margin-top: 0.45rem; font-weight: 600; font-style: italic;">📝 Motivo: ${e.sellSide.backReason}</div>`:``}
          <div style="margin-top: 0.55rem; display: flex; align-items: center; gap: 0.35rem;">
            ${jt(e)}
          </div>
          
          ${e.sellSide?.status===`REJECTED`?`
            <div class="rejected-states-box" style="margin-top: 0.75rem; padding: 0.55rem; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 10px; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.78rem;">
              <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; color: var(--text-main); font-weight: 600; margin: 0; user-select: none;">
                <input type="checkbox" class="state-volvio" data-id="${e.id}" ${e.returned?`checked disabled`:``} style="width: 14px; height: 14px; cursor: pointer;">
                🔄 ¿Volvió?
              </label>
              <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; color: var(--text-main); font-weight: 600; margin: 0; user-select: none;">
                <input type="checkbox" class="state-levantado-empresa" data-id="${e.id}" ${e.settledByCompany?`checked disabled`:``} style="width: 14px; height: 14px; cursor: pointer;">
                🏢 Levantado por la empresa
              </label>
              <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; color: var(--text-main); font-weight: 600; margin: 0; user-select: none;">
                <input type="checkbox" class="state-levantado-vendedor" data-id="${e.id}" ${e.settledBySeller?`checked disabled`:``} style="width: 14px; height: 14px; cursor: pointer;">
                👤 Levantado por vendedor (${d})
              </label>
            </div>
          `:``}
        </td>
        ${l?``:`
        <td style="font-weight: 800; text-align: right; font-family: monospace; font-size: 1rem;">
          ${a?`<span style="color: #10b981; text-shadow: 0 1px 4px rgba(16,185,129,0.15);">+${q(e.profit)}</span>`:e.purchaseDiscount>0?`
                <span style="color: #10b981;">+${q(e.purchaseDiscount)}</span>
                <div style="display: inline-block; font-size: 0.65rem; color: #fbbf24; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.2); padding: 0.1rem 0.35rem; border-radius: 4px; margin-top: 0.2rem; font-weight: 700; letter-spacing: 0.2px;">
                  ${e.purchaseDiscountPercentage.toFixed(2)}% DESC
                </div>`:`<span style="color: var(--text-muted); font-weight: 550;">-</span>`}
        </td>
        `}
        <td style="text-align: right; white-space: nowrap; border-radius: 0 14px 14px 0;">
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
            <button class="icon-btn edit-btn" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Editar Cheque">
              <span style="font-size: 0.85rem;">✏️</span>
            </button>
            ${e.issuerCuit?`<button class="icon-btn bcra-list-btn" title="Consultar BCRA: ${e.issuerCuit}" style="height: 32px; display: flex; align-items: center; gap: 0.25rem; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.3); color: #60a5fa; border-radius: 8px; padding: 0 0.65rem; font-size: 0.72rem; font-weight: 800; cursor: pointer; transition: all 0.2s; letter-spacing: 0.2px;">🔍 BCRA</button>`:``}
            <button class="icon-btn delete-btn" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.18); color: var(--danger); border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Eliminar Cheque">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="pointer-events: none; vertical-align: middle;"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
            </button>
          </div>
        </td>
      `;let y=i.querySelector(`.state-volvio`),b=i.querySelector(`.state-levantado-empresa`),x=i.querySelector(`.state-levantado-vendedor`),S=(t,r,i,a)=>{t.addEventListener(`change`,o=>{t.checked&&(t.checked=!1,Pt({title:i,promptMsg:a,expectedValue:e.checkNumber,onConfirm:()=>{e[r]=!0,e[`${r}At`]=Date.now(),n(e)}}))})};if(y&&S(y,`returned`,`¿Volvió el Cheque?`,`¿Tienes la Hoja del Cheque? Para continuar por favor ingresa el número del cheque:`),b&&S(b,`settledByCompany`,`Levantado por la Empresa`,`¿El cheque fue levantado por la empresa? Para continuar por favor ingresa el número del cheque:`),x&&S(x,`settledBySeller`,`Levantado por Vendedor`,`¿El cheque fue levantado por el vendedor (${d})? Para continuar por favor ingresa el número del cheque:`),i.addEventListener(`click`,i=>{if(i.target.closest(`.edit-btn`)){Dt(e,t,u&&u.length>0?u:t,n);return}if(i.target.closest(`.delete-btn`)){r(e.id);return}if(i.target.closest(`.bcra-list-btn`)){let t=(e.issuerCuit||``).replace(/\D/g,``);if(!t||t.length<11){alert(`CUIT no válido para consultar.`);return}navigator.clipboard.writeText(t).then(()=>{alert(`CUIT ${t} copiado al portapapeles.\n\nSe abrirá la web de consulta crediticia del BCRA. Pegá el CUIT allí para consultar.`),window.open(`https://www.bcra.gob.ar/situacion-crediticia/`,`_blank`)}).catch(()=>window.open(`https://www.bcra.gob.ar/situacion-crediticia/`,`_blank`));return}i.target.closest(`.portfolio-check-cb`)||i.target.closest(`.state-volvio`)||i.target.closest(`.state-levantado-empresa`)||i.target.closest(`.state-levantado-vendedor`)}),i.querySelectorAll(`.icon-btn`).forEach(e=>{e.addEventListener(`mouseenter`,()=>{e.style.transform=`scale(1.08)`,e.style.filter=`brightness(1.2)`}),e.addEventListener(`mouseleave`,()=>{e.style.transform=`scale(1)`,e.style.filter=`none`})}),o&&s!==null){let t=i.querySelector(`.portfolio-check-cb`);t&&(s.has(String(e.id))&&(t.checked=!0),t.addEventListener(`change`,()=>{t.checked?s.add(String(e.id)):s.delete(String(e.id)),c&&c()}))}if(e.notes&&e.notes.trim()){i.title=`Observaciones: ${e.notes.trim()}`;let t=i.querySelector(`td:nth-child(`+(o?`2`:`1`)+`)`);if(t){let n=K(`span`,{text:`📝`,style:`display: inline-block; margin-left: 0.4rem; color: var(--primary); font-size: 0.78rem; cursor: help;`,attrs:{title:`Observaciones: ${e.notes.trim()}`}});t.appendChild(n)}}m.appendChild(i)}),o){let e=f.querySelector(`#check-all-cb`);e&&e.addEventListener(`change`,()=>{f.querySelectorAll(`.portfolio-check-cb`).forEach(t=>{t.checked=e.checked;let n=String(t.dataset.id);e.checked?s.add(n):s.delete(n)}),c&&c()})}return f.appendChild(m),d.appendChild(f),d}function Nt(e,t,n,r){return K(`kmp-metric-card`,{attrs:{title:e,value:t,icon:r,subtitle:`Indicador de cartera`}})}function Pt({title:e,promptMsg:t,expectedValue:n,onConfirm:r}){let i=K(`div`,{classes:[`modal-overlay`,`fade-in`],style:`position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1.5rem;`}),a=K(`div`,{classes:[`glass-card`],style:`max-width: 480px; width: 100%; padding: 2rem; border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 1.25rem;`});a.innerHTML=`
    <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 0.5rem;">
      ⚠️ Confirmar Cambio de Estado
    </h3>
    <div style="font-size: 0.88rem; color: var(--text-main); font-weight: 550; line-height: 1.5;">
      ${t}
    </div>
    
    <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.78rem; color: #f87171; font-weight: 600;">
      <strong>⚠️ Importante:</strong> Una vez confirmado este estado, no podrá ser desmarcado ni editado.
    </div>
    
    <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
      <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Número de Cheque</label>
      <input type="text" id="confirm-check-num-input" placeholder="Ingresa el número de cheque..." style="width: 100%; padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; font-size: 1rem; text-align: center; letter-spacing: 1px;">
      <div id="confirm-error-msg" style="color: #ef4444; font-size: 0.75rem; font-weight: 600; display: none; margin-top: 0.2rem;">El número ingresado no coincide.</div>
    </div>
    
    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 0.5rem;">
      <button type="button" class="btn-outline" id="btn-cancel-confirm" style="padding: 0.55rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.82rem; cursor: pointer; margin: 0;">Cancelar</button>
      <button type="button" class="btn-primary" id="btn-submit-confirm" style="padding: 0.55rem 1.5rem; border-radius: 10px; font-weight: 750; font-size: 0.82rem; background: var(--primary); border: none; color: var(--on-primary); cursor: pointer; margin: 0;">Confirmar</button>
    </div>
  `,i.appendChild(a),document.body.appendChild(i);let o=a.querySelector(`#confirm-check-num-input`),s=a.querySelector(`#confirm-error-msg`),c=a.querySelector(`#btn-cancel-confirm`),l=a.querySelector(`#btn-submit-confirm`);o.focus(),c.onclick=()=>i.remove();let u=()=>{o.value.trim()===String(n).trim()?(i.remove(),r()):(s.style.display=`block`,o.style.borderColor=`#ef4444`,o.focus())};l.onclick=u,o.onkeydown=e=>{e.key===`Enter`&&(e.preventDefault(),u())}}function Ft(e,t){let{checks:n=[],filteredChecks:r=[],globalSummary:i={},filteredSummary:a={},filters:o={},contacts:s=[],buyContacts:c=[],pagination:l={},onFilterChange:u,onSave:d,onDelete:f,onRefresh:p,onExport:m,onPrint:h,onBatchBuy:g,onBatchSell:_,onPortfolioPageChange:v,onHistoryPageChange:y,onUndoSale:b}=t;e._options=t;let x=document.activeElement?document.activeElement.id:null,S=document.activeElement?document.activeElement.selectionStart:null,C=document.activeElement?document.activeElement.selectionEnd:null;if(!e.querySelector(`#portfolio-table-wrapper`)){e.innerHTML=``;let t=K(`div`,{classes:[`dashboard-header`,`glass-card`],style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 1.5rem 2rem; border-radius: 20px; gap: 1rem; flex-wrap: wrap;`}),n=K(`div`,{style:`display: flex; align-items: center; gap: 1rem;`}),r=K(`button`,{classes:[`back-btn-m3`],html:`<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>`,attrs:{title:`Volver al Dashboard`}});r.onclick=()=>window.dispatchEvent(new CustomEvent(`nav:dashboard`)),n.appendChild(r);let i=K(`div`,{style:`display: flex; flex-direction: column;`});i.appendChild(K(`h1`,{text:`Gestión de Cheques`,style:`margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-main);`})),i.appendChild(K(`p`,{text:`Control de cartera, negociación de tasas y registro de operaciones.`,style:`margin: 0.25rem 0 0 0; font-size: 0.82rem; color: var(--text-muted); font-weight: 500;`})),n.appendChild(i),t.appendChild(n);let a=K(`div`,{style:`display: flex; gap: 0.75rem; flex-wrap: wrap;`}),s=K(`button`,{classes:[`btn-secondary`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.65rem 1.15rem; font-size: 0.88rem; font-weight: 600;`,html:`<span>📥 Exportar Excel</span>`});s.onclick=()=>{e._options&&typeof e._options.onExport==`function`&&Be({title:`Exportar Reporte de Cheques`,description:`Selecciona el rango de fechas de recepción o pago a incluir en el Excel.`,submitText:`Descargar Excel`,onSubmit:e._options.onExport})};let c=K(`button`,{style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.65rem 1.15rem; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.35); color: #818cf8; cursor: pointer; font-weight: 600; font-size: 0.88rem; transition: all 0.2s ease;`,html:`<svg viewBox="0 0 24 24" width="16" height="16" style="fill:currentColor;flex-shrink:0;"><path d="M17,12H14V8H10V12H7L12,17L17,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg> Compra Masiva`});c.onclick=()=>{e._options&&Ot(e._options.buyContacts,e._options.onBatchBuy)},c.addEventListener(`mouseenter`,()=>{c.style.background=`rgba(99, 102, 241, 0.2)`,c.style.borderColor=`rgba(99, 102, 241, 0.5)`}),c.addEventListener(`mouseleave`,()=>{c.style.background=`rgba(99, 102, 241, 0.12)`,c.style.borderColor=`rgba(99, 102, 241, 0.35)`});let l=K(`button`,{classes:[`btn-nueva-operacion`],style:`margin: 0; padding: 0.65rem 1.15rem; font-size: 0.88rem; display: flex; align-items: center; gap: 0.5rem;`,html:`<svg viewBox="0 0 24 24" width="16" height="16" style="fill:currentColor;flex-shrink:0;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> Nueva Operación`});l.onclick=()=>{e._options&&Dt(null,e._options.contacts,e._options.buyContacts,e._options.onSave)},a.appendChild(s),a.appendChild(c),a.appendChild(l),t.appendChild(a),e.appendChild(t);let u=K(`div`,{classes:[`stats-grid`],attrs:{id:`checks-stats-grid`},style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;`});u.appendChild(Nt(`Ganancia Vendida`,`...`,`#10b981`,`📈`)),u.appendChild(Nt(`Desc. en Cartera`,`...`,`#fbbf24`,`📉`)),u.appendChild(Nt(`Capital en Cartera`,`...`,`#3b82f6`,`💰`)),u.appendChild(Nt(`Cheques en Cartera`,`... uds.`,`var(--primary)`,`📂`)),e.appendChild(u);let d=K(`div`,{attrs:{id:`expiring-alert-wrapper`}});e.appendChild(d);let f=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 2rem; padding: 1.5rem; border-radius: 20px; display: flex; flex-direction: column; gap: 1.25rem;`}),p=K(`div`,{style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; align-items: end;`}),m=K(`div`,{classes:[`form-group`],style:`margin-bottom: 0;`});m.appendChild(K(`label`,{text:`🔍 Buscar Banco, Número, Librador o Contacto`,style:`font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; display: block;`}));let h=K(`datalist`,{attrs:{id:`checks-search-dl`}});m.appendChild(h);let g=K(`input`,{attrs:{id:`checks-search-input`,type:`text`,list:`checks-search-dl`,placeholder:`Escribí banco, número, librador, contacto...`,value:o?.searchTerm||``,autocomplete:`off`},style:`width: 100%; padding: 0.55rem 0.85rem; border-radius: 10px; border: 1px solid var(--border); background: rgba(0,0,0,0.15); color: var(--text-main); font-weight: 600;`}),_=null;g.addEventListener(`input`,t=>{clearTimeout(_),_=setTimeout(()=>{e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({searchTerm:t.target.value})},400)}),m.appendChild(g);function v(e,t,n){let r=K(`div`,{classes:[`form-group`],style:`margin-bottom: 0;`});r.appendChild(K(`label`,{text:e,style:`font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; display: block;`}));let i=K(`div`,{style:`display: flex; gap: 0.4rem; align-items: center;`}),a=K(`input`,{attrs:{id:n,type:`date`,value:t||``},style:`flex: 1; min-width: 0; padding: 0.55rem 0.85rem; border-radius: 10px; border: 1px solid var(--border); background: rgba(0,0,0,0.15); color: var(--text-main); font-weight: 600;`}),o=K(`button`,{attrs:{type:`button`,title:`Abrir calendario`},style:`flex-shrink: 0; padding: 0 0.75rem; height: 38px; border-radius: 10px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.35); color: var(--primary); cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; transition: all 0.2s ease;`,text:`📅`});return o.onclick=()=>{a.showPicker?a.showPicker():a.click()},o.addEventListener(`mouseenter`,()=>{o.style.transform=`scale(1.05)`,o.style.background=`rgba(99,102,241,0.25)`}),o.addEventListener(`mouseleave`,()=>{o.style.transform=`scale(1)`,o.style.background=`rgba(99,102,241,0.15)`}),i.appendChild(a),i.appendChild(o),r.appendChild(i),{group:r,input:a}}let y=K(`div`,{classes:[`form-group`],style:`margin-bottom: 0;`});y.appendChild(K(`label`,{text:`Tipo de Fecha`,style:`font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; display: block;`}));let b=K(`select`,{attrs:{id:`checks-date-type`},style:`width: 100%; height: 38px; padding: 0 0.85rem; border-radius: 10px; background: rgba(0,0,0,0.15); border: 1px solid var(--border); color: var(--text-main); outline: none; font-family: inherit; font-weight: 600;`});b.innerHTML=`
      <option value="DUE" ${o?.dateFilterType===`DUE`?`selected`:``}>Fecha de Pago</option>
      <option value="RECEPTION" ${o?.dateFilterType===`RECEPTION`?`selected`:``}>Fecha de Recepción</option>
    `,y.appendChild(b);let x=K(`div`,{classes:[`form-group`],style:`margin-bottom: 0;`});x.appendChild(K(`label`,{text:`Tipo de Cheque`,style:`font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; display: block;`}));let S=K(`select`,{attrs:{id:`checks-type-select`},style:`width: 100%; height: 38px; padding: 0 0.85rem; border-radius: 10px; background: rgba(0,0,0,0.15); border: 1px solid var(--border); color: var(--text-main); outline: none; font-family: inherit; font-weight: 600;`});S.innerHTML=`
      <option value="ALL" ${o?.checkType===`ALL`?`selected`:``}>Todos</option>
      <option value="PAPER" ${o?.checkType===`PAPER`?`selected`:``}>Físico (Papel)</option>
      <option value="ECHECK" ${o?.checkType===`ECHECK`?`selected`:``}>E-Cheque (Electrónico)</option>
    `,S.addEventListener(`change`,()=>{e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({checkType:S.value})}),x.appendChild(S);let C=v(`Desde`,o?.startDate||``,`checks-start-date`),w=v(`Hasta`,o?.endDate||``,`checks-end-date`),T=K(`div`,{style:`display: flex; gap: 0.5rem; align-items: flex-end; padding-bottom: 2px;`}),E=K(`button`,{style:`height: 38px; border-radius: 10px; padding: 0 1.25rem; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; background: var(--primary); color: var(--on-primary); border: none; flex-shrink: 0; cursor: pointer; transition: all 0.2s ease;`,text:`Aplicar`});E.onclick=()=>{e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({startDate:C.input.value||``,endDate:w.input.value||``,dateFilterType:b.value})},E.addEventListener(`mouseenter`,()=>{E.style.filter=`brightness(1.15)`}),E.addEventListener(`mouseleave`,()=>{E.style.filter=`none`});let D=K(`button`,{classes:[`btn-secondary`],style:`height: 38px; border-radius: 10px; padding: 0 0.85rem; font-weight: 700; display: flex; align-items: center; justify-content: center;`,attrs:{title:`Limpiar fechas`},text:`✕`});D.onclick=()=>{e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({startDate:``,endDate:``})},T.appendChild(E),T.appendChild(D);let O=K(`div`,{classes:[`form-group`],style:`margin-bottom: 0; display: flex; align-items: center; gap: 0.6rem; height: 38px; cursor: pointer; user-select: none;`}),k=K(`input`,{attrs:{type:`checkbox`,id:`filter-only-nominal`},style:`width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary);`}),A=K(`label`,{attrs:{for:`filter-only-nominal`},text:`🔍 Solo Total Nominal`,style:`font-size: 0.8rem; font-weight: 700; color: var(--text-muted); cursor: pointer; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;`});O.appendChild(k),O.appendChild(A),k.addEventListener(`change`,()=>{e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({onlyNominal:k.checked})}),p.appendChild(m),p.appendChild(x),p.appendChild(y),p.appendChild(C.group),p.appendChild(w.group),p.appendChild(O),p.appendChild(T),f.appendChild(p);let j=K(`div`,{attrs:{id:`filter-count-bar-wrapper`},style:`padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;`});f.appendChild(j),e.appendChild(f);let M=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.15rem; flex-wrap: wrap; gap: 1rem;`}),ee=K(`div`,{style:`display: flex; align-items: center; gap: 0.65rem;`});ee.innerHTML=`
      <span style="font-size: 1.2rem;">📂</span>
      <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Cheques en Cartera</h2>
    `,M.appendChild(ee);let N=K(`div`,{style:`display: flex; gap: 0.5rem; align-items: center;`}),P=K(`button`,{attrs:{id:`portfolio-sort-btn`},classes:[`btn-secondary`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600;`,html:`<span>⬆️ Más próximos</span>`});P.onclick=()=>{if(e._options&&typeof e._options.onFilterChange==`function`){let t=e._options.filters?.sortPortfolioAsc!==!1;e._options.onFilterChange({sortPortfolioAsc:!t})}};let F=K(`button`,{classes:[`btn-secondary`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600;`,html:`<span>🖨️ Imprimir</span>`});F.onclick=()=>{if(e._options&&typeof e._options.onPrint==`function`){let t=e._sortedPortfolioCached||[];e._options.onPrint(t)}},N.appendChild(P),N.appendChild(F),M.appendChild(N),e.appendChild(M);let I=K(`div`,{attrs:{id:`batch-sell-bar-wrapper`},classes:[`glass-card`],style:`display: none; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem; padding: 0.95rem 1.5rem; background: rgba(16, 185, 129, 0.05); border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 16px; flex-wrap: wrap; animation: slideIn 0.2s ease;`}),te=K(`span`,{text:`0 cheques seleccionados`,style:`font-weight: 750; font-size: 0.88rem; flex: 1; color: #34d399;`}),L=K(`button`,{classes:[`btn-secondary`],style:`border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 700;`,text:`Limpiar selección`}),R=K(`button`,{classes:[`btn-secondary`],style:`border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 700; display: flex; align-items: center; gap: 0.3rem;`,html:`🖨️ Imprimir Selección`}),z=K(`button`,{classes:[`btn-nueva-operacion`],style:`margin: 0; padding: 0.5rem 1.25rem; font-size: 0.82rem; font-weight: 700; background: linear-gradient(135deg, #10b981, #059669); border: none; box-shadow: 0 4px 12px rgba(16,185,129,0.3); display: flex; align-items: center; gap: 0.4rem;`,html:`📤 Vender Selección`});I.appendChild(te),I.appendChild(L),I.appendChild(R),I.appendChild(z),e.appendChild(I),R.onclick=()=>{let t=e._selectedChecksIds;if(!(!t||t.size===0)&&e._options&&typeof e._options.onPrint==`function`){let n=e._options.checks||[],r=Array.from(t).map(e=>n.find(t=>String(t.id)===String(e))).filter(Boolean);e._options.onPrint(r,`Reporte de Cheques Seleccionados`)}},L.onclick=()=>{let t=e._selectedChecksIds;t&&t.clear(),e.querySelectorAll(`.portfolio-check-cb`).forEach(e=>{e.checked=!1});let n=e.querySelector(`#check-all-cb`);n&&(n.checked=!1),e._updateBatchBarFn&&e._updateBatchBarFn()},z.onclick=()=>{let t=e._selectedChecksIds;if(!(!t||t.size===0)&&e._options){let n=e._options.checks||[],r=Array.from(t).map(e=>n.find(t=>String(t.id)===String(e))).filter(Boolean);kt(e._options.contacts,r,e._options.onBatchSell,()=>{t.clear(),e._updateBatchBarFn&&e._updateBatchBarFn()},e._options.filters?.onlyNominal)}};let B=K(`div`,{attrs:{id:`portfolio-table-wrapper`}}),V=K(`div`,{attrs:{id:`portfolio-pagination-wrapper`}});e.appendChild(B),e.appendChild(V);let H=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; margin-top: 3rem; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 1rem;`}),U=K(`div`,{style:`display: flex; align-items: center; gap: 0.65rem;`});U.innerHTML=`
      <span style="font-size: 1.2rem;">📜</span>
      <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Operaciones Realizadas</h2>
    `,H.appendChild(U);let ne=K(`button`,{attrs:{id:`history-print-btn`},classes:[`btn-secondary`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600;`,html:`<span>🖨️ Imprimir</span>`});ne.onclick=()=>{if(e._options&&typeof e._options.onPrint==`function`){let t=e._sortedHistoryCached||[];e._options.onPrint(t)}},H.appendChild(ne),e.appendChild(H);let re=K(`div`,{style:`display: flex; gap: 1rem; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 1.5rem;`}),ie=K(`div`,{style:`display: flex; gap: 0.5rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 0.25rem; border-radius: 12px; width: fit-content;`}),ae=K(`button`,{attrs:{id:`history-tab-list`},style:`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;`,text:`📋 Listado General`}),oe=K(`button`,{attrs:{id:`history-tab-grouped`},style:`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;`,text:`📦 Agrupado por Operación`});ie.appendChild(ae),ie.appendChild(oe),re.appendChild(ie);let W=K(`div`,{style:`display: flex; gap: 0.5rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 0.25rem; border-radius: 12px; width: fit-content;`}),G=K(`button`,{attrs:{id:`history-status-all`},style:`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;`,text:`Todos`});G.onclick=()=>{e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({historyStatusFilter:`ALL`})};let se=K(`button`,{attrs:{id:`history-status-sold`},style:`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;`,text:`Vendidos`});se.onclick=()=>{e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({historyStatusFilter:`SOLD`})};let ce=K(`button`,{attrs:{id:`history-status-rejected`},style:`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;`,text:`Rechazados`});ce.onclick=()=>{e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({historyStatusFilter:`REJECTED`})},W.appendChild(G),W.appendChild(se),W.appendChild(ce),re.appendChild(W),e.appendChild(re),ae.onclick=()=>{localStorage.setItem(`checks_history_tab`,`list`),e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({})},oe.onclick=()=>{localStorage.setItem(`checks_history_tab`,`grouped`),e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({})};let le=K(`div`,{attrs:{id:`history-table-wrapper`}}),ue=K(`div`,{attrs:{id:`history-pagination-wrapper`}}),de=K(`div`,{attrs:{id:`history-grouped-wrapper`}});e.appendChild(le),e.appendChild(ue),e.appendChild(de)}let w=e._selectedChecksIds||=new Set,T=new Set(n.map(e=>String(e.id)));for(let e of w)T.has(e)||w.delete(e);let E=e.querySelector(`#batch-sell-bar-wrapper`),D=E?.querySelector(`span`),O=()=>{if(E)if(w.size>0){E.style.display=`flex`;let e=0;(a.portfolioChecks||[]).forEach(t=>{w.has(String(t.id))&&(e+=parseFloat(t.nominalValue)||0)}),D&&(D.textContent=`${w.size} cheque${w.size>1?`s`:``} seleccionado${w.size>1?`s`:``} (${q(e)})`)}else E.style.display=`none`};e._updateBatchBarFn=O;let k=e.querySelector(`#checks-search-dl`);if(k){k.innerHTML=``;let e=new Set;n.forEach(t=>{t.bank&&e.add(t.bank),t.checkNumber&&e.add(String(t.checkNumber)),t.issuerName&&e.add(t.issuerName),t.issuerCuit&&e.add(String(t.issuerCuit))}),s.forEach(t=>{t.name&&e.add(t.name)}),e.forEach(e=>{let t=document.createElement(`option`);t.value=e,k.appendChild(t)})}let A=e.querySelector(`#checks-stats-grid`),{totalProfit:j=0,totalPortfolioDiscount:M=0,totalInPortfolio:ee=0,portfolioChecksCount:N=0}=a,{expiringChecks:P=[]}=i;if(A){let e=A.querySelectorAll(`kmp-metric-card`);e.length>=4&&(o?.onlyNominal?(e[0].setAttribute(`value`,`🔒 Oculto`),e[1].setAttribute(`value`,`🔒 Oculto`)):(e[0].setAttribute(`value`,q(j)),e[1].setAttribute(`value`,q(M))),e[2].setAttribute(`value`,q(ee)),e[3].setAttribute(`value`,`${N} uds.`))}let F=e.querySelector(`#expiring-alert-wrapper`);if(F&&(F.innerHTML=``,P&&P.length>0)){let e=K(`div`,{classes:[`glass-card`],style:`position: relative; margin-bottom: 2rem; padding: 1.25rem 3.5rem 1.25rem 1.5rem; background: rgba(239, 68, 68, 0.05); border: 1.5px solid rgba(239, 68, 68, 0.35); border-radius: 16px; display: flex; align-items: flex-start; gap: 0.85rem; animation: slideIn 0.3s ease;`}),t=K(`span`,{text:`⚠️`,style:`font-size: 1.35rem; flex-shrink: 0;`}),n=K(`div`,{style:`flex: 1;`});n.appendChild(K(`div`,{html:`<strong style="color: #ef4444; font-size: 0.92rem;">Tenés ${P.length} cheque${P.length>1?`s`:``} que está${P.length>1?`n`:``} por vencer.</strong>`,style:`margin-bottom: 0.25rem;`})),n.appendChild(K(`div`,{text:`Por disposición del Banco Central (BCRA), podés depositar o negociar estos cheques hasta un máximo de 30 días posteriores a su fecha de pago establecida.`,style:`font-size: 0.82rem; color: #f87171; opacity: 0.95; line-height: 1.5; font-weight: 550;`}));let r=K(`button`,{attrs:{type:`button`,title:`Cerrar aviso`},style:`position: absolute; top: 0.85rem; right: 1rem; background: none; border: none; cursor: pointer; font-size: 1.05rem; color: #ef4444; opacity: 0.75; transition: opacity 0.2s;`,text:`✕`});r.onclick=()=>e.remove(),r.addEventListener(`mouseenter`,()=>{r.style.opacity=`1`}),r.addEventListener(`mouseleave`,()=>{r.style.opacity=`0.75`}),e.appendChild(t),e.appendChild(n),e.appendChild(r),F.appendChild(e)}let I=e.querySelector(`#checks-search-input`);I&&document.activeElement!==I&&(I.value=o?.searchTerm||``);let te=e.querySelector(`#checks-start-date`),L=e.querySelector(`#checks-end-date`),R=e.querySelector(`#checks-date-type`);te&&document.activeElement!==te&&(te.value=o?.startDate||``),L&&document.activeElement!==L&&(L.value=o?.endDate||``),R&&document.activeElement!==R&&(R.value=o?.dateFilterType||`DUE`);let z=e.querySelector(`#checks-type-select`);z&&document.activeElement!==z&&(z.value=o?.checkType||`ALL`);let B=e.querySelector(`#filter-only-nominal`);B&&(B.checked=!!o?.onlyNominal);let V=a.portfolioChecks||[],H=a.historyChecks||[],U=o?.historyStatusFilter||`ALL`;U===`SOLD`?H=H.filter(e=>e.sellSide?.status===`SOLD`):U===`REJECTED`&&(H=H.filter(e=>e.sellSide?.status===`REJECTED`));let ne=e.querySelector(`#filter-count-bar-wrapper`);if(ne){let e=o?.searchTerm||o?.startDate||o?.endDate?`Resultados de los filtros aplicados`:`Total sin filtros adicionales`,t=a.totalInPortfolio||0,n=H.reduce((e,t)=>e+(parseFloat(t.nominalValue)||0),0);ne.innerHTML=`
      <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 550;">
        ${e}: <strong style="color: var(--primary); font-family: monospace;">${V.length}</strong> cheques en cartera (${q(t)}) y <strong style="color: #34d399; font-family: monospace;">${H.length}</strong> operaciones históricas (${q(n)})
      </span>
    `}let re=o?.sortPortfolioAsc!==!1,ie=e.querySelector(`#portfolio-sort-btn`);ie&&(ie.innerHTML=`<span>${re?`⬆️ Más próximos`:`⬇️ Más lejanos`}</span>`);let ae=[...V].sort((e,t)=>{let n=St(e.dueDate),r=St(t.dueDate);return re?n-r:r-n});e._sortedPortfolioCached=ae;let oe=e.querySelector(`#portfolio-table-wrapper`),W=e.querySelector(`#portfolio-pagination-wrapper`);if(oe){oe.innerHTML=``;let e=ae.length,t=Math.ceil(e/(l?.itemsPerPage||15)),n=l?.portfolioPage||1;n>t&&t>0&&(n=t);let r=(n-1)*(l?.itemsPerPage||15),i=Mt(ae.slice(r,r+(l?.itemsPerPage||15)),s,d,f,`dueDate`,re,!0,w,O,o?.onlyNominal,c);oe.appendChild(i),W&&(W.innerHTML=``,t>1&&W.appendChild(At(n,t,e,v)))}let G=localStorage.getItem(`checks_history_tab`)||`list`,se=e.querySelector(`#history-print-btn`);se&&(se.style.display=G===`list`?`block`:`none`);let ce=e.querySelector(`#history-tab-list`),le=e.querySelector(`#history-tab-grouped`);ce&&le&&(ce.style.cssText=`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${G===`list`?`background: var(--primary); color: var(--on-primary);`:`background: transparent; color: var(--text-muted);`}`,le.style.cssText=`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${G===`grouped`?`background: var(--primary); color: var(--on-primary);`:`background: transparent; color: var(--text-muted);`}`);let ue=e.querySelector(`#history-status-all`),de=e.querySelector(`#history-status-sold`),fe=e.querySelector(`#history-status-rejected`),pe=o?.historyStatusFilter||`ALL`;ue&&de&&fe&&(ue.style.cssText=`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${pe===`ALL`?`background: var(--primary); color: var(--on-primary);`:`background: transparent; color: var(--text-muted);`}`,de.style.cssText=`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${pe===`SOLD`?`background: rgba(16, 185, 129, 0.15); color: #34d399;`:`background: transparent; color: var(--text-muted);`}`,fe.style.cssText=`padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${pe===`REJECTED`?`background: rgba(239, 68, 68, 0.15); color: #f87171;`:`background: transparent; color: var(--text-muted);`}`);let me=[...H].sort((e,t)=>{let n=St(e.dueDate);return St(t.dueDate)-n});e._sortedHistoryCached=me;let he=e.querySelector(`#history-table-wrapper`),ge=e.querySelector(`#history-pagination-wrapper`),_e=e.querySelector(`#history-grouped-wrapper`);if(G===`list`){if(_e&&(_e.style.display=`none`),he){he.style.display=`block`,he.innerHTML=``;let e=me.length,t=Math.ceil(e/(l?.itemsPerPage||15)),n=l?.historyPage||1;n>t&&t>0&&(n=t);let r=(n-1)*(l?.itemsPerPage||15),i=Mt(me.slice(r,r+(l?.itemsPerPage||15)),s,d,f,`dueDate`,!1,!1,null,null,o?.onlyNominal,c);he.appendChild(i),ge&&(ge.style.display=`block`,ge.innerHTML=``,t>1&&ge.appendChild(At(n,t,e,y)))}}else if(he&&(he.style.display=`none`),ge&&(ge.style.display=`none`),_e){_e.style.display=`block`,_e.innerHTML=``;let t=localStorage.getItem(`checks_grouped_type`)||`sell`,n=K(`div`,{style:`display: flex; gap: 0.5rem; margin-bottom: 1.5rem;`}),i=K(`button`,{style:`padding: 0.45rem 1.15rem; border-radius: 20px; border: 1px solid ${t===`sell`?`rgba(16,185,129,0.35)`:`var(--border)`}; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${t===`sell`?`background: rgba(16,185,129,0.15); color: #34d399;`:`background: transparent; color: var(--text-muted);`}`,text:`📤 Ventas Realizadas`}),a=K(`button`,{style:`padding: 0.45rem 1.15rem; border-radius: 20px; border: 1px solid ${t===`buy`?`rgba(59,130,246,0.35)`:`var(--border)`}; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${t===`buy`?`background: rgba(59,130,246,0.15); color: #60a5fa;`:`background: transparent; color: var(--text-muted);`}`,text:`📥 Compras Realizadas`});n.appendChild(i),n.appendChild(a),_e.appendChild(n),i.onclick=()=>{localStorage.setItem(`checks_grouped_type`,`sell`),e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({})},a.onclick=()=>{localStorage.setItem(`checks_grouped_type`,`buy`),e._options&&typeof e._options.onFilterChange==`function`&&e._options.onFilterChange({})};let l=K(`div`,{style:`display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem;`});if(t===`sell`){let t={};me.forEach(e=>{if(e.sellSide?.status===`SOLD`){let n=e.sellSide?.operationId||`IND-${e.id}`;t[n]||(t[n]={id:n,isGrouped:!!e.sellSide?.operationId,contactId:e.sellSide?.contactId,contactName:s.find(t=>t.id===e.sellSide?.contactId)?.name||e.sellSide?.contactId||`Desconocido`,date:e.sellSide?.date||e.dueDate||``,checks:[],totalNominal:0,totalNet:0,totalProfit:0}),t[n].checks.push(e),t[n].totalNominal+=e.nominalValue,t[n].totalNet+=e.sellSide.netAmount,t[n].totalProfit+=e.profit}});let n=Object.values(t);n.sort((e,t)=>{let n=e.date?new Date(e.date).getTime():0;return(t.date?new Date(t.date).getTime():0)-n}),n.length===0?l.innerHTML=`<div class="glass-card" style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-weight: 600;">No se encontraron operaciones de venta en esta sección.</div>`:n.forEach(t=>{let n=K(`div`,{classes:[`glass-card`],style:`padding: 1.25rem 1.5rem; border-radius: 16px; border: 1px solid var(--border); background: rgba(255,255,255,0.015); display: flex; flex-direction: column; gap: 1rem; transition: all 0.2s ease;`});n.addEventListener(`mouseenter`,()=>{n.style.transform=`translateY(-2px)`,n.style.boxShadow=`0 6px 20px rgba(0,0,0,0.15)`}),n.addEventListener(`mouseleave`,()=>{n.style.transform=`translateY(0)`,n.style.boxShadow=`none`});let r=t.date?new Date(t.date).toLocaleDateString(`es-AR`):`-`,i=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;`});i.innerHTML=`
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="padding: 0.25rem 0.65rem; border-radius: 8px; background: rgba(16,185,129,0.12); color: #34d399; font-size: 0.72rem; font-weight: 800; text-transform: uppercase;">Venta</span>
                <strong style="font-family: monospace; font-size: 0.95rem; color: #ffffff;">${t.id}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">📅 ${r}</span>
              </div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">
                👤 <span style="color: var(--text-main);">${t.contactName}</span>
              </div>
            `;let a=K(`div`,{style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; background: rgba(0,0,0,0.15); border-radius: 12px; padding: 0.85rem 1.25rem; border: 1px solid rgba(255,255,255,0.02);`});a.innerHTML=`
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Total Nominal</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #ffffff; margin-top: 0.15rem;">${q(t.totalNominal)}</div>
              </div>
              ${o?.onlyNominal?``:`
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Neto Cobrado</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #60a5fa; margin-top: 0.15rem;">${q(t.totalNet)}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Ganancia Total</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #34d399; margin-top: 0.15rem;">+${q(t.totalProfit)}</div>
              </div>
              `}
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Cheques</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 0.15rem;">${t.checks.length} uds.</div>
              </div>
            `;let u=K(`div`,{style:`display: none; margin-top: 0.5rem;`}),p=Mt(t.checks,s,d,f,`dueDate`,!0,!1,null,null,o?.onlyNominal,c);p.style.marginBottom=`0`,p.style.borderRadius=`12px`,u.appendChild(p);let m=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;`}),h=K(`button`,{classes:[`btn-secondary`],style:`padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; display: flex; align-items: center; gap: 0.3rem;`,text:`👁️ Ver Detalles (${t.checks.length})`});h.onclick=()=>{let e=u.style.display===`none`;u.style.display=e?`block`:`none`,h.textContent=e?`🙈 Ocultar Detalles`:`👁️ Ver Detalles (${t.checks.length})`},m.appendChild(h);let g=K(`div`,{style:`display: flex; gap: 0.4rem;`}),_=K(`button`,{style:`padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.35); color: #818cf8; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; transition: all 0.2s;`,html:`🖨️ Imprimir`});_.onclick=()=>{Fe(t.id,t.contactName,t.date,t.checks,s)};let v=K(`button`,{style:`padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.35); color: #34d399; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; transition: all 0.2s;`,html:`📥 Excel`});v.onclick=()=>{Ie(t.id,t.contactName,t.date,t.checks,s)};let y=K(`button`,{style:`padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: var(--danger); cursor: pointer; display: flex; align-items: center; gap: 0.25rem; transition: all 0.2s;`,html:`↩️ Deshacer Venta`});y.onclick=()=>{e._options&&typeof e._options.onUndoSale==`function`&&e._options.onUndoSale(t.id)},g.appendChild(_),g.appendChild(v),g.appendChild(y),m.appendChild(g),[_,v,y].forEach(e=>{e.addEventListener(`mouseenter`,()=>{e.style.transform=`scale(1.05)`,e.style.filter=`brightness(1.2)`}),e.addEventListener(`mouseleave`,()=>{e.style.transform=`scale(1)`,e.style.filter=`none`})}),n.appendChild(i),n.appendChild(a),n.appendChild(u),n.appendChild(m),l.appendChild(n)})}else{let e={};r.forEach(t=>{if(t.buySide?.operationId){let n=t.buySide.operationId;e[n]||(e[n]={id:n,contactId:t.buySide?.contactId,contactName:s.find(e=>e.id===t.buySide?.contactId)?.name||t.buySide?.contactId||`Desconocido`,date:t.buySide?.date||t.receptionDate||``,checks:[],totalNominal:0,totalNet:0,totalDiscount:0}),e[n].checks.push(t),e[n].totalNominal+=t.nominalValue,e[n].totalNet+=t.buySide.netAmount,e[n].totalDiscount+=t.purchaseDiscount}});let t=Object.values(e);t.sort((e,t)=>{let n=e.date?new Date(e.date).getTime():0;return(t.date?new Date(t.date).getTime():0)-n}),t.length===0?l.innerHTML=`<div class="glass-card" style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-weight: 600;">No se encontraron operaciones de compra en esta sección.</div>`:t.forEach(e=>{let t=K(`div`,{classes:[`glass-card`],style:`padding: 1.25rem 1.5rem; border-radius: 16px; border: 1px solid var(--border); background: rgba(255,255,255,0.015); display: flex; flex-direction: column; gap: 1rem; transition: all 0.2s ease;`});t.addEventListener(`mouseenter`,()=>{t.style.transform=`translateY(-2px)`,t.style.boxShadow=`0 6px 20px rgba(0,0,0,0.15)`}),t.addEventListener(`mouseleave`,()=>{t.style.transform=`translateY(0)`,t.style.boxShadow=`none`});let n=e.date?new Date(e.date).toLocaleDateString(`es-AR`):`-`,r=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;`});r.innerHTML=`
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="padding: 0.25rem 0.65rem; border-radius: 8px; background: rgba(59,130,246,0.12); color: #60a5fa; font-size: 0.72rem; font-weight: 800; text-transform: uppercase;">Compra</span>
                <strong style="font-family: monospace; font-size: 0.95rem; color: #ffffff;">${e.id}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">📅 ${n}</span>
              </div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">
                👤 <span style="color: var(--text-main);">${e.contactName}</span>
              </div>
            `;let i=K(`div`,{style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; background: rgba(0,0,0,0.15); border-radius: 12px; padding: 0.85rem 1.25rem; border: 1px solid rgba(255,255,255,0.02);`});i.innerHTML=`
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Total Nominal</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #ffffff; margin-top: 0.15rem;">${q(e.totalNominal)}</div>
              </div>
              ${o?.onlyNominal?``:`
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Neto Pagado</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #60a5fa; margin-top: 0.15rem;">${q(e.totalNet)}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Desc. Compra</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #34d399; margin-top: 0.15rem;">+${q(e.totalDiscount)}</div>
              </div>
              `}
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Cheques</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 0.15rem;">${e.checks.length} uds.</div>
              </div>
            `;let a=K(`div`,{style:`display: none; margin-top: 0.5rem;`}),u=Mt(e.checks,s,d,f,`dueDate`,!0,!1,null,null,o?.onlyNominal,c);u.style.marginBottom=`0`,u.style.borderRadius=`12px`,a.appendChild(u);let p=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;`}),m=K(`button`,{classes:[`btn-secondary`],style:`padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; display: flex; align-items: center; gap: 0.3rem;`,text:`👁️ Ver Detalles (${e.checks.length})`});m.onclick=()=>{let t=a.style.display===`none`;a.style.display=t?`block`:`none`,m.textContent=t?`🙈 Ocultar Detalles`:`👁️ Ver Detalles (${e.checks.length})`},p.appendChild(m),t.appendChild(r),t.appendChild(i),t.appendChild(a),t.appendChild(p),l.appendChild(t)})}_e.appendChild(l)}if(x){let e=document.getElementById(x);e&&(e.focus(),S!==null&&C!==null&&(e.type===`text`||e.type===`search`)&&e.setSelectionRange(S,C))}O()}var It=[2e4,1e4,2e3,1e3,500,200,100];function Lt(e,t,n){return()=>{let r=parseFloat(e.value),i=parseFloat(t.value);if(!isNaN(r)&&!isNaN(i)){let e=i-r;n.style.display=`block`,e===0?(n.style.background=`rgba(255,255,255,0.05)`,n.style.borderColor=`var(--border)`,n.style.color=`var(--text-main)`,n.textContent=`Diferencias cuadradas (Monto y Caja son iguales)`):e>0?(n.style.background=`rgba(16,185,129,0.1)`,n.style.borderColor=`rgba(16,185,129,0.3)`,n.style.color=`#10b981`,n.textContent=`Sobra en Caja: ${q(e)}`):(n.style.background=`rgba(239,68,68,0.1)`,n.style.borderColor=`rgba(239,68,68,0.3)`,n.style.color=`#ef4444`,n.textContent=`Falta en Caja: ${q(Math.abs(e))}`)}else n.style.display=`none`}}function Rt(e,{clients:t,producers:n,onSave:r,title:i=`Contabilidad`}){let a=e?.billCounts||null,o=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;`}),s=K(`div`,{classes:[`glass-card`],style:`width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 2rem;`});s.innerHTML=`
    <h2 style="margin-top: 0; margin-bottom: 2rem;">${e?`Editar`:`Nuevo`} Movimiento de ${i}</h2>
    
    <form id="accounting-form">
      <div style="margin-bottom: 1.5rem; display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="IN" ${!e||e.type===`IN`?`checked`:``}> <span style="color: var(--success); font-weight: 600;">Ingreso (+)</span>
        </label>
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="OUT" ${e&&e.type===`OUT`?`checked`:``}> <span style="color: var(--danger); font-weight: 600;">Egreso (-)</span>
        </label>
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="WITHDRAWAL" ${e&&e.type===`WITHDRAWAL`?`checked`:``}> <span style="color: #8b5cf6; font-weight: 600;">Retiro / Ajuste (-)</span>
        </label>
      </div>

      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Descripción / Concepto</label>
        <input type="text" name="description" required placeholder="Ej: Pago de flete, Cobro venta meat..." value="${e?.description||``}">
      </div>

      <div class="responsive-grid-2" style="margin-bottom: 1.5rem;">
        <div class="form-group">
          <label>Cliente (Opcional)</label>
          <input type="text" id="client-input" list="clients-datalist" placeholder="🔎 Buscar cliente..." autocomplete="off" value="${e?.clientName||``}">
          <datalist id="clients-datalist">
            ${t.map(e=>`<option value="${e.name}"></option>`).join(``)}
          </datalist>
        </div>
        <div class="form-group">
          <label>Productor (Opcional)</label>
          <input type="text" id="producer-input" list="producers-datalist" placeholder="🔎 Buscar productor..." autocomplete="off" value="${e?.producerName||``}">
          <datalist id="producers-datalist">
            ${n.map(e=>`<option value="${e.name}"></option>`).join(``)}
          </datalist>
        </div>
      </div>

      <div class="responsive-grid-2" style="margin-bottom: 1rem;">
        <div class="form-group">
          <label>Monto Esperado ($)</label>
          <input type="number" step="0.01" name="amount" id="expected-amount-input" required placeholder="0.00" style="font-size: 1.25rem; font-weight: 700;" value="${e?.amount||``}">
        </div>
        <div class="form-group">
          <label>Monto Contado (Físico) ($)</label>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem;">
            <input type="number" step="0.01" name="countedAmount" id="counted-amount-input" placeholder="Opcional" style="width: 100%; font-size: 1.25rem; font-weight: 700;" value="${e?.countedAmount===void 0?``:e.countedAmount}">
            <button type="button" id="open-calc-btn" class="btn-secondary" style="white-space: nowrap; padding: 0 1rem; border-radius: 8px;">🧮 Calc.</button>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
          <input type="checkbox" id="save-breakdown-chk" ${e?.billCounts?`checked`:``}> 
          <span>Guardar detalle de billetes ( breakdown )</span>
        </label>
      </div>

      <div id="diff-container" style="display: none; margin-bottom: 1.5rem; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; text-align: center; font-size: 1.1rem; border: 1px solid transparent;"></div>

      <div style="display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 1rem; margin-top: 2rem; align-items: center;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(99,102,241,0.4); letter-spacing: 0.03em;">Guardar</button>
      </div>
    </form>
  `,o.appendChild(s),document.body.appendChild(o);let c=s.querySelector(`#accounting-form`),l=s.querySelector(`#expected-amount-input`),u=s.querySelector(`#counted-amount-input`),d=s.querySelector(`#diff-container`),f=s.querySelector(`#save-breakdown-chk`),p=Lt(l,u,d);l.addEventListener(`input`,p),u.addEventListener(`input`,p),e&&p(),s.querySelector(`#open-calc-btn`).onclick=()=>Bt(parseFloat(l.value)||0,e=>{u.value=e.grand,a=e.breakdown,f.checked=!0,p()}),c.onsubmit=i=>{i.preventDefault();let s=new FormData(c),l=c.querySelector(`#client-input`).value.trim().toLowerCase(),u=c.querySelector(`#producer-input`).value.trim().toLowerCase(),d=t.find(e=>e.name.toLowerCase().trim()===l),p=n.find(e=>e.name.toLowerCase().trim()===u),m=s.get(`countedAmount`);r({id:e?e.id:void 0,type:s.get(`type`),description:s.get(`description`),amount:parseFloat(s.get(`amount`)),countedAmount:m?parseFloat(m):null,billCounts:f.checked?a:null,clientId:d?d.id:null,clientName:d?d.name:l||null,clientCuit:d&&d.cuit||null,producerCuit:p?p.cuit:null,producerName:p?p.name:u||null}),o.remove()},s.querySelector(`.btn-cancel`).onclick=()=>o.remove()}function zt({establishments:e,onSave:t,title:n}){let r=null,i=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;`}),a=K(`div`,{classes:[`glass-card`],style:`width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 2rem;`});a.innerHTML=`
    <h2 style="margin-top: 0; margin-bottom: 2rem;">Pago de Sueldos - ${n}</h2>
    
    <form id="salary-form">
      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Sucursal / Establecimiento</label>
        <select id="est-select" required style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
          <option value="">Seleccione una sucursal...</option>
          ${e.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)}
        </select>
      </div>

      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Empleado</label>
        <select id="emp-select" required disabled style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
          <option value="">Primero seleccione sucursal...</option>
        </select>
      </div>

      <div class="responsive-grid-2" style="margin-bottom: 1rem;">
        <div class="form-group">
          <label>Monto a Pagar ($)</label>
          <input type="number" step="0.01" name="amount" id="expected-amount-input" required placeholder="0.00" style="font-size: 1.25rem; font-weight: 700;">
        </div>
        <div class="form-group">
          <label>Detalle de Billetes (Opcional)</label>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem;">
            <input type="number" step="0.01" name="countedAmount" id="counted-amount-input" placeholder="Monto Físico" style="width: 100%; font-size: 1.25rem; font-weight: 700;">
            <button type="button" id="open-calc-btn" class="btn-secondary" style="white-space: nowrap; padding: 0 1rem; border-radius: 8px;">🧮 Calc.</button>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
          <input type="checkbox" id="save-breakdown-chk"> 
          <span>Guardar detalle de billetes ( breakdown )</span>
        </label>
      </div>

      <div id="diff-container" style="display: none; margin-bottom: 1.5rem; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; text-align: center; font-size: 1.1rem; border: 1px solid transparent;"></div>

      <div style="display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 1rem; margin-top: 2rem; align-items: center;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.4); letter-spacing: 0.03em;">Registrar Pago</button>
      </div>
    </form>
  `,i.appendChild(a),document.body.appendChild(i);let o=a.querySelector(`#salary-form`),s=a.querySelector(`#est-select`),c=a.querySelector(`#emp-select`),l=a.querySelector(`#expected-amount-input`),u=a.querySelector(`#counted-amount-input`),d=a.querySelector(`#diff-container`),f=a.querySelector(`#save-breakdown-chk`);s.addEventListener(`change`,()=>{let t=s.value;if(c.innerHTML=`<option value="">Seleccione un empleado...</option>`,t){let n=e.find(e=>e.id===t);n&&n.employees&&n.employees.length>0?(n.employees.forEach(e=>{c.innerHTML+=`<option value="${e.id}" data-name="${e.name}" data-dni="${e.dni||``}" data-position="${e.position||``}">${e.name} ${e.position?`(${e.position})`:``}</option>`}),c.disabled=!1):(c.innerHTML=`<option value="">No hay empleados en esta sucursal</option>`,c.disabled=!0)}else c.disabled=!0});let p=Lt(l,u,d);l.addEventListener(`input`,p),u.addEventListener(`input`,p),a.querySelector(`#open-calc-btn`).onclick=()=>Bt(parseFloat(l.value)||0,e=>{u.value=e.grand,r=e.breakdown,f.checked=!0,p()}),o.onsubmit=e=>{e.preventDefault();let n=c.selectedOptions[0],a=n.dataset.name,o=n.dataset.dni,d=n.dataset.position,p=u.value;t({type:`OUT`,description:`Pago Sueldo: ${a}`,amount:parseFloat(l.value),countedAmount:p?parseFloat(p):null,billCounts:f.checked?r:null,isSalary:!0,establishmentId:s.value,employeeId:c.value,employeeName:a,employeeDni:o,employeePosition:d}),i.remove()},a.querySelector(`.btn-cancel`).onclick=()=>i.remove()}function Bt(e,t,n=null){let r=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;`}),i=K(`div`,{classes:[`glass-card`],style:`width: 100%; max-width: 600px; padding: 1.5rem 1.25rem; display: flex; flex-direction: column; max-height: 95vh; box-sizing: border-box;`});i.innerHTML=`
    <style>
      .calc-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        overflow-y: auto;
        padding-right: 0.25rem;
        flex: 1;
        min-height: 150px;
      }
      .denom-row {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 12px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border);
        transition: border-color 0.2s;
        box-sizing: border-box;
      }
      .denom-row:focus-within {
        border-color: var(--primary);
      }
      .denom-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .denom-label {
        font-weight: 700;
        font-size: 1.05rem;
        color: var(--text-main);
      }
      .denom-total {
        font-weight: 700;
        font-size: 1.05rem;
        color: #10b981;
        font-family: monospace;
      }
      .denom-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.5rem;
      }
      .input-col {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .input-col label {
        font-size: 0.7rem;
        color: var(--text-muted);
        text-align: center;
        font-weight: 600;
      }
      .input-col input {
        padding: 0.4rem;
        border-radius: 8px;
        text-align: center;
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--border);
        color: var(--text-main);
        font-size: 0.9rem;
        width: 100%;
        box-sizing: border-box;
      }
      .calc-header-desktop {
        display: none;
      }
      .calc-sign {
        display: none;
      }
      
      @media (min-width: 576px) {
        .calc-container {
          max-height: 50vh;
        }
        .denom-row {
          display: grid;
          grid-template-columns: 80px 20px 80px 20px 80px 20px 80px 30px 1fr;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.5rem;
          border-radius: 0;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .denom-row:focus-within {
          border-color: transparent;
        }
        .denom-header {
          display: contents;
        }
        .denom-label {
          font-size: 0.95rem;
        }
        .denom-total {
          grid-column: 9;
          text-align: right;
          font-size: 1rem;
        }
        .denom-inputs {
          display: contents;
        }
        .input-col {
          display: contents;
        }
        .input-col label {
          display: none;
        }
        .input-col input {
          text-align: right;
          padding: 0.5rem;
        }
        .calc-sign {
          display: block;
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .calc-header-desktop {
          display: grid;
          grid-template-columns: 80px 20px 80px 20px 80px 20px 80px 30px 1fr;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          padding: 0 0.5rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }
      }
    </style>
    
    <h3 style="margin-top:0; margin-bottom: 1rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
      💵 Recuento de Billetes
    </h3>
    
    <div class="calc-header-desktop">
      <div>Valor</div>
      <div></div>
      <div style="text-align: center;">Bloques <small>(1000u)</small></div>
      <div></div>
      <div style="text-align: center;">Fajos <small>(100u)</small></div>
      <div></div>
      <div style="text-align: center;">Sueltos <small>(1u)</small></div>
      <div></div>
      <div style="text-align: right;">Subtotal</div>
    </div>
    
    <div class="calc-container" id="calc-rows">
      ${It.map(e=>`
        <div class="denom-row" data-denom="${e}">
          <div class="denom-header">
            <span class="denom-label">$ ${e.toLocaleString()}</span>
            <span class="row-total denom-total">$ 0</span>
          </div>
          
          <div class="denom-inputs">
            <div class="calc-sign">×</div>
            <div class="input-col">
              <label>Bloques (1000u)</label>
              <input type="number" class="bill-block" data-denom="${e}" placeholder="0" min="0">
            </div>
            
            <div class="calc-sign">+</div>
            <div class="input-col">
              <label>Fajos (100u)</label>
              <input type="number" class="bill-batch" data-denom="${e}" placeholder="0" min="0">
            </div>
            
            <div class="calc-sign">+</div>
            <div class="input-col">
              <label>Sueltos (1u)</label>
              <input type="number" class="bill-qty" data-denom="${e}" placeholder="0" min="0">
            </div>
            <div class="calc-sign">=</div>
          </div>
        </div>
      `).join(``)}
    </div>
    
    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <span style="font-weight: 500; font-size: 0.85rem; color: var(--text-muted);">Monto Esperado:</span>
        <span style="font-weight: 600;">${e>0?q(e):`No especificado`}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 500;">Total Contado:</span>
        <span id="calc-grand-total" style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">$ 0</span>
      </div>
      <div id="calc-diff-container" style="display: none; justify-content: space-between; align-items: center; padding-top: 0.75rem; margin-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.1);">
         <span style="font-weight: 500; font-size: 0.85rem;">Diferencia:</span>
         <span id="calc-diff-val" style="font-weight: 700; font-size: 1.05rem;"></span>
      </div>
    </div>
    
    <div style="display: flex; gap: 1rem;">
      <button id="calc-cancel" class="btn-cancel" style="flex: 1; padding: 0.75rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 0.95rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cerrar</button>
      <button id="calc-apply" style="flex: 2; padding: 0.75rem; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 0.95rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3); letter-spacing: 0.03em;">Usar Total ✓</button>
    </div>
  `,r.appendChild(i),document.body.appendChild(r);let a=i.querySelectorAll(`.denom-row`),o=i.querySelector(`#calc-grand-total`),s=i.querySelectorAll(`.bill-block, .bill-batch, .bill-qty`),c=()=>{let t=0,n={};if(a.forEach(e=>{let r=e.querySelector(`.bill-block`),i=e.querySelector(`.bill-batch`),a=e.querySelector(`.bill-qty`),o=parseInt(i.dataset.denom),s=parseInt(r.value)||0,c=parseInt(i.value)||0,l=parseInt(a.value)||0,u=(s*1e3+c*100+l)*o;t+=u,e.querySelector(`.row-total`).textContent=`$ ${u.toLocaleString()}`,(s>0||c>0||l>0)&&(n[o]={blocks:s,batches:c,qtys:l,subtotal:u})}),o.textContent=`$ ${t.toLocaleString()}`,e>0){let n=i.querySelector(`#calc-diff-container`),r=i.querySelector(`#calc-diff-val`);n.style.display=`flex`;let a=t-e;a===0?(r.textContent=`OK`,r.style.color=`var(--text-main)`):a>0?(r.textContent=`Sobra ${q(a)}`,r.style.color=`#10b981`):(r.textContent=`Falta ${q(Math.abs(a))}`,r.style.color=`#ef4444`)}return{grand:t,breakdown:n}};n&&(a.forEach(e=>{let t=e.querySelector(`.bill-block`),r=e.querySelector(`.bill-batch`),i=e.querySelector(`.bill-qty`),a=parseInt(r.dataset.denom),o=n[a]||n[String(a)];o&&(t.value=o.blocks!==void 0&&o.blocks!==null&&o.blocks!==``?o.blocks:``,r.value=o.batches!==void 0&&o.batches!==null&&o.batches!==``?o.batches:``,i.value=o.qtys!==void 0&&o.qtys!==null&&o.qtys!==``?o.qtys:``)}),c()),s.forEach(e=>e.addEventListener(`input`,c)),i.querySelector(`#calc-cancel`).onclick=()=>r.remove(),i.querySelector(`#calc-apply`).onclick=()=>{t(c()),r.remove()}}function Vt({invoices:e=[],onConfirm:t}){let n=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;`}),r=K(`div`,{classes:[`glass-card`],style:`width: 100%; max-width: 850px; max-height: 90vh; overflow-y: auto; padding: 2rem;`});if(!e||e.length===0){r.innerHTML=`
      <h2 style="margin-top:0;">🤖 Importar Comprobantes ARCA</h2>
      <p style="color: var(--text-muted);">No se encontraron comprobantes recibidos ('R') en el rango de fechas seleccionado.</p>
      <div style="display:flex; justify-content:flex-end; margin-top: 1.5rem;">
        <button id="arca-close" class="btn-secondary">Cerrar</button>
      </div>
    `,n.appendChild(r),document.body.appendChild(n),r.querySelector(`#arca-close`).onclick=()=>n.remove();return}let i=e.map((e,t)=>{let n=Number(e.importeTotal||e.importe||e.total||0),r=e.cuitEmisor||e.cuit||e.NroDocEmisor||`N/A`,i=e.razonSocialEmisor||e.razonSocial||`CUIT ${r}`,a=e.tipoComprobante||e.descTipoComprobante||`Factura`,o=e.numero||e.numeroComprobante||e.NroComprobante||t+1,s=e.fecha||e.fechaEmision||e.Fecha||``,c=e.cuentaSugerida||{nombre:`Gastos Generales`,codigo:`5.9.99`};return`
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 0.75rem 0.5rem; text-align: center;">
          <input type="checkbox" class="arca-inv-checkbox" data-index="${t}" checked style="width: 18px; height: 18px; cursor: pointer;">
        </td>
        <td style="padding: 0.75rem 0.5rem; font-size: 0.85rem; color: var(--text-muted);">${s}</td>
        <td style="padding: 0.75rem 0.5rem;">
          <div style="font-weight: 600;">${i}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">CUIT: ${r}</div>
        </td>
        <td style="padding: 0.75rem 0.5rem; font-size: 0.85rem;">${a} N° ${o}</td>
        <td style="padding: 0.75rem 0.5rem;">
          <span style="background: rgba(59,130,246,0.15); color: #60a5fa; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">
            ${c.codigo} - ${c.nombre}
          </span>
        </td>
        <td style="padding: 0.75rem 0.5rem; font-weight: 700; text-align: right; color: var(--danger);">
          $ ${n.toLocaleString(`es-AR`,{minimumFractionDigits:2})}
        </td>
      </tr>
    `}).join(``);r.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
        🤖 Comprobantes Recibidos (ARCA)
      </h2>
      <span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">
        ${e.length} Comprobante(s)
      </span>
    </div>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; font-size: 0.82rem; color: var(--text-muted);">
      ℹ️ Se ha aplicado el <strong>Régimen de Transparencia Fiscal Ley 27.743 (RG 5614/24)</strong> y la consulta al Padrón Registral para la atribución de cuentas contables.
    </div>

    <div style="max-height: 50vh; overflow-y: auto; margin-bottom: 1.5rem;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border); text-align: left; font-size: 0.8rem; color: var(--text-muted);">
            <th style="padding: 0.5rem; text-align: center;"><input type="checkbox" id="arca-select-all" checked style="width: 18px; height: 18px; cursor: pointer;"></th>
            <th style="padding: 0.5rem;">Fecha</th>
            <th style="padding: 0.5rem;">Emisor / CUIT</th>
            <th style="padding: 0.5rem;">Comprobante</th>
            <th style="padding: 0.5rem;">Cuenta Sugerida (CLAE)</th>
            <th style="padding: 0.5rem; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${i}
        </tbody>
      </table>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center;">
      <button id="arca-cancel" class="btn-secondary">Cancelar</button>
      <button id="arca-submit" class="btn-nueva-operacion" style="margin: 0;">
        📥 Importar Seleccionados
      </button>
    </div>
  `,n.appendChild(r),document.body.appendChild(n);let a=r.querySelector(`#arca-select-all`),o=r.querySelectorAll(`.arca-inv-checkbox`);a.onchange=e=>{o.forEach(t=>t.checked=e.target.checked)},r.querySelector(`#arca-cancel`).onclick=()=>n.remove(),r.querySelector(`#arca-submit`).onclick=()=>{let r=[];if(o.forEach(t=>{if(t.checked){let n=parseInt(t.dataset.index);e[n]&&r.push(e[n])}}),r.length===0){alert(`Selecciona al menos un comprobante para importar.`);return}t(r),n.remove()}}function Ht({invoices:e=[],clients:t=[],onLinkToClient:n}){let r=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;`}),i=K(`div`,{classes:[`glass-card`],style:`width: 100%; max-width: 900px; max-height: 90vh; overflow-y: auto; padding: 2rem;`});if(!e||e.length===0){i.innerHTML=`
      <h2 style="margin-top:0;">📤 Comprobantes Emitidos (ARCA)</h2>
      <p style="color: var(--text-muted);">No se encontraron facturas ni comprobantes emitidos en el rango de fechas seleccionado.</p>
      <div style="display:flex; justify-content:flex-end; margin-top: 1.5rem;">
        <button id="issued-close" class="btn-secondary">Cerrar</button>
      </div>
    `,r.appendChild(i),document.body.appendChild(r),i.querySelector(`#issued-close`).onclick=()=>r.remove();return}let a=e.reduce((e,t)=>e+Number(t.importeTotal||t.importe||t.total||0),0),o=e.map((e,t)=>{let n=Number(e.importeTotal||e.importe||e.total||0),r=e.cuitReceptor||e.cuit||e.NroDocReceptor||`N/A`,i=e.razonSocialReceptor||e.razonSocial||`Cliente CUIT ${r}`,a=e.tipoComprobante||e.descTipoComprobante||`Factura`,o=e.numero||e.numeroComprobante||e.NroComprobante||t+1;return`
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 0.75rem 0.5rem; font-size: 0.85rem; color: var(--text-muted);">${e.fecha||e.fechaEmision||e.Fecha||``}</td>
        <td style="padding: 0.75rem 0.5rem;">
          <div style="font-weight: 600;">${i}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">CUIT: ${r}</div>
        </td>
        <td style="padding: 0.75rem 0.5rem; font-size: 0.85rem;">${a} N° ${o}</td>
        <td style="padding: 0.75rem 0.5rem; font-weight: 700; text-align: right; color: var(--success);">
          $ ${n.toLocaleString(`es-AR`,{minimumFractionDigits:2})}
        </td>
        <td style="padding: 0.75rem 0.5rem; text-align: center;">
          <button class="btn-link-client btn-secondary" data-index="${t}" style="font-size: 0.75rem; padding: 0.35rem 0.6rem; border-radius: 6px;">
            🔗 Vincular a Cta Cte
          </button>
        </td>
      </tr>
    `}).join(``);i.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
        📤 Comprobantes Emitidos / Libro de Ventas (ARCA)
      </h2>
      <span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">
        Total: $ ${a.toLocaleString(`es-AR`,{minimumFractionDigits:2})}
      </span>
    </div>
    
    <div style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; font-size: 0.82rem; color: var(--text-muted);">
      🛡️ <strong>Información Fiscal Independiente:</strong> Estos comprobantes pertenecen a tus ventas/facturación en ARCA. <strong>No afectan el saldo ni los movimientos de la Caja General</strong>. Puedes vincular voluntariamente cualquier venta a la Cuenta Corriente de un Cliente.
    </div>

    <div style="max-height: 50vh; overflow-y: auto; margin-bottom: 1.5rem;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border); text-align: left; font-size: 0.8rem; color: var(--text-muted);">
            <th style="padding: 0.5rem;">Fecha</th>
            <th style="padding: 0.5rem;">Cliente / Receptor</th>
            <th style="padding: 0.5rem;">Comprobante</th>
            <th style="padding: 0.5rem; text-align: right;">Total Facturado</th>
            <th style="padding: 0.5rem; text-align: center;">Acción Cta. Cte.</th>
          </tr>
        </thead>
        <tbody>
          ${o}
        </tbody>
      </table>
    </div>

    <div style="display: flex; justify-content: flex-end;">
      <button id="issued-done" class="btn-secondary">Cerrar</button>
    </div>
  `,r.appendChild(i),document.body.appendChild(r),i.querySelectorAll(`.btn-link-client`).forEach(r=>{r.onclick=()=>{let i=e[parseInt(r.dataset.index)];if(!i)return;let a=t.map(e=>e.name).join(`
`),o=prompt(`Selecciona o escribe el nombre del cliente para asociar la venta:\n\n${a}`,i.razonSocialReceptor||``);if(o){let e=t.find(e=>e.name.toLowerCase()===o.trim().toLowerCase());e&&typeof n==`function`?n({invoice:i,clientId:e.id}):alert(`Cliente "${o}" no encontrado en el maestro de clientes.`)}}}),i.querySelector(`#issued-done`).onclick=()=>r.remove()}function Ut(e,t){return e?`
    <div style="margin-top: ${t?`10px`:`20px`}; border-top: 1px solid #eee; padding-top: ${t?`10px`:`15px`};">
      <h4 style="margin-bottom: 8px; color: #444; font-size: ${t?`13px`:`16px`};">Detalle de Recuento:</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: ${t?`12px`:`14px`};">
        <tr style="background: #f9f9f9; text-align: left;">
          <th style="padding: 4px;">Denom.</th>
          <th style="padding: 4px; text-align: center;">Cant.</th>
          <th style="padding: 4px; text-align: right;">Total</th>
        </tr>
        ${Object.entries(e).sort((e,t)=>t[0]-e[0]).map(([e,t])=>{let n=(t.blocks||0)*1e3+(t.batches||0)*100+(t.qtys||0);return`
            <tr>
              <td style="padding: 4px;">$ ${parseInt(e).toLocaleString()}</td>
              <td style="padding: 4px; text-align: center;">${n}</td>
              <td style="padding: 4px; text-align: right;">$ ${t.subtotal.toLocaleString()}</td>
            </tr>
          `}).join(``)}
      </table>
    </div>
  `:``}function Wt(e,t=`standard`){let n=window.open(``,`_blank`,`width=800,height=900`),r=new Date().toLocaleDateString(`es-AR`),i=new Date().toLocaleTimeString(`es-AR`,{hour:`2-digit`,minute:`2-digit`}),a=e.clientCuit||e.producerCuit,o=(e.clientName||e.producerName||`Consumidor Final`)+(a?` (CUIT: ${a})`:``),s=e.type===`IN`,c=t===`thermal`,l=Ut(e.billCounts,c),u=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprobante - Frigorifico Pampa</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: ${c?`10px`:`40px`}; 
          color: #111; 
          line-height: 1.4; 
          margin: 0;
          background: #fff;
          position: relative;
        }
        .receipt-card { 
          border: ${c?`none`:`1px solid #ddd`}; 
          padding: ${c?`0`:`30px`}; 
          border-radius: ${c?`0`:`8px`}; 
          max-width: ${c?`300px`:`600px`}; 
          margin: ${c?`0`:`0 auto`}; 
          box-shadow: ${c?`none`:`0 4px 10px rgba(0,0,0,0.05)`}; 
          position: relative;
        }
        .indicator {
          position: absolute;
          top: 0;
          right: 0;
          font-size: 24px;
          font-weight: 900;
          color: #ddd;
          opacity: 0.5;
        }
        .header { 
          display: flex; 
          flex-direction: ${c?`column`:`row`};
          justify-content: ${c?`center`:`space-between`}; 
          align-items: ${c?`center`:`flex-start`}; 
          margin-bottom: 20px; 
          border-bottom: 2px solid ${c?`#000`:`#5d5fef`}; 
          padding-bottom: 15px;
          text-align: ${c?`center`:`left`};
        }
        .logo-area { display: flex; flex-direction: ${c?`column`:`row`}; align-items: center; gap: 10px; }
        .logo { width: ${c?`100px`:`150px`}; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: ${c?`16px`:`24px`}; font-weight: 800; color: ${c?`#000`:`#5d5fef`}; margin: 0; }
        .receipt-info { text-align: ${c?`center`:`right`}; margin-top: ${c?`10px`:`0`}; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: ${c?`13px`:`16px`}; }
        .section { margin-bottom: 15px; }
        .section-title { font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
        .val { font-size: ${c?`14px`:`18px`}; font-weight: 600; }
        .amount-box { 
          background: ${c?`#fff`:`#f4f7ff`}; 
          padding: 15px; 
          border-radius: 8px; 
          text-align: center; 
          border: ${c?`2px solid #000`:`1px dashed #5d5fef`}; 
          margin-top: 20px; 
        }
        .amount-val { font-size: ${c?`24px`:`32px`}; font-weight: 800; color: ${c?`#000`:`#5d5fef`}; }
        .disclaimer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 10px; 
          color: #666; 
          border-top: 1px solid #ddd; 
          padding-top: 10px; 
          font-style: italic; 
        }
        @media print {
          body { padding: 0; margin: 0; width: ${c?`80mm`:`auto`}; }
          .receipt-card { border: none; box-shadow: none; max-width: 100%; margin: 0; }
        }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="receipt-card">
        <div class="indicator">${s?`+`:`-`}</div>
        <div class="header">
          <div class="logo-area">
            <img src="/logo.jpg" class="logo" alt="Logo">
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">Comprobante de Caja</div>
            <div class="receipt-date">${r} ${i}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Concepto / Descripción</div>
          <div class="val">${e.description||`Sin descripción`}</div>
        </div>

        <div class="section">
          <div class="section-title">CLIENTE / PRODUCTOR</div>
          <div class="val">${o}</div>
        </div>

        ${l}

        <div class="amount-box">
          <div class="receipt-label">Monto Total</div>
          <div class="amount-val">${q(e.amount)}</div>
        </div>

        <div class="disclaimer" style="text-transform: uppercase;">
          ⚠️ NO ES COMPROBANTE FISCAL<br>
          <span style="font-size: 8px; text-transform: none;">Documento informativo de control interno.</span>
        </div>
      </div>
    </body>
    </html>
  `;n.document.write(u),n.document.close()}function Gt(e,t=`standard`,n=`Caja General`){let r=window.open(``,`_blank`,`width=800,height=900`),i=new Date(e.createdAt).toLocaleDateString(`es-AR`),a=new Date(e.createdAt).toLocaleTimeString(`es-AR`,{hour:`2-digit`,minute:`2-digit`}),o=t===`thermal`,s=Ut(e.billCounts,o),c=`
    <div class="receipt-card">
      <div class="header">
        <div class="logo-area">
          <img src="/logo.jpg" class="logo" alt="Logo">
          <div>
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
            <div style="font-size: ${o?`10px`:`12px`}; color: #666; margin-top: 4px;">COMPROBANTE DE PAGO DE HABERES</div>
          </div>
        </div>
        <div class="receipt-info">
          <div class="receipt-label">Fecha</div>
          <div class="receipt-date">${i} ${a}</div>
          <div class="receipt-label" style="margin-top: 8px;">Caja Origen</div>
          <div style="font-weight: 600; font-size: ${o?`12px`:`14px`};">${n}</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: ${o?`column`:`row`}; gap: 15px; margin-bottom: ${o?`20px`:`10px`};">
        <div class="section" style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 0;">
          <div class="section-title">Datos del Empleado</div>
          <div class="val" style="margin-bottom: 5px;">${e.employeeName||`No especificado`}</div>
          ${e.employeeDni?`<div style="font-size: 12px; color: #475569;">DNI: ${e.employeeDni}</div>`:``}
          ${e.employeePosition?`<div style="font-size: 12px; color: #475569;">Cargo: ${e.employeePosition}</div>`:``}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Concepto</div>
        <div class="val" style="font-size: ${o?`13px`:`15px`};">${e.description||`Adelanto / Pago Sueldo`}</div>
      </div>

      ${s}

      <div class="amount-box" style="border-color: #10b981; background: ${o?`#fff`:`#ecfdf5`};">
        <div class="receipt-label">Importe Abonado</div>
        <div class="amount-val" style="color: ${o?`#000`:`#059669`};">${q(e.amount)}</div>
      </div>

      <div style="margin-top: ${o?`30px`:`25px`}; display: flex; flex-direction: column; align-items: center; gap: 5px;">
        <div style="width: 200px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
        <div style="font-size: 12px; font-weight: 600;">Firma del Empleado</div>
        <div style="font-size: 10px; color: #666;">Aclaración: ${e.employeeName||`________________________`}</div>
      </div>
    </div>
  `,l=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recibo Sueldo - ${e.employeeName||``}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: ${o?`10px`:`15px`}; 
          color: #111; 
          line-height: 1.3; 
          margin: 0;
          background: #fff;
        }
        .container {
          display: flex;
          flex-direction: column;
          gap: ${o?`20px`:`15px`};
        }
        .receipt-card { 
          border: ${o?`none`:`1px solid #ddd`}; 
          padding: ${o?`0`:`15px 25px`}; 
          border-radius: ${o?`0`:`8px`}; 
          max-width: ${o?`300px`:`650px`}; 
          margin: ${o?`0`:`0 auto`}; 
          box-shadow: ${o?`none`:`0 4px 10px rgba(0,0,0,0.05)`}; 
          page-break-inside: avoid;
        }
        .header { 
          display: flex; 
          flex-direction: ${o?`column`:`row`};
          justify-content: ${o?`center`:`space-between`}; 
          align-items: ${o?`center`:`flex-start`}; 
          margin-bottom: 10px; 
          border-bottom: 2px solid ${o?`#000`:`#10b981`}; 
          padding-bottom: 10px;
          text-align: ${o?`center`:`left`};
        }
        .logo-area { display: flex; flex-direction: ${o?`column`:`row`}; align-items: center; gap: 10px; }
        .logo { width: ${o?`80px`:`85px`}; height: auto; max-height: 50px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: ${o?`14px`:`18px`}; font-weight: 800; color: ${o?`#000`:`#10b981`}; margin: 0; }
        .receipt-info { text-align: ${o?`center`:`right`}; margin-top: ${o?`10px`:`0`}; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: ${o?`12px`:`13px`}; }
        .section { margin-bottom: 10px; }
        .section-title { font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
        .val { font-size: ${o?`14px`:`15px`}; font-weight: 600; }
        .amount-box { 
          background: #fff; 
          padding: 10px; 
          border-radius: 8px; 
          text-align: center; 
          border: ${o?`2px solid #000`:`2px dashed #10b981`}; 
          margin-top: 15px; 
        }
        .amount-val { font-size: ${o?`22px`:`24px`}; font-weight: 800; }
        @page {
          size: ${o?`80mm auto`:`A4 portrait`};
          margin: ${o?`0`:`10mm`};
        }
        @media print {
          body { padding: 0; margin: 0; width: ${o?`80mm`:`auto`}; }
          .receipt-card { border: none; box-shadow: none; max-width: 100%; margin: 0; border-bottom: ${o?`1px dashed #ccc`:`none`}; padding-bottom: ${o?`20px`:`0`}; }
          .separator { display: ${o?`none`:`block`}; height: 1px; border-top: 1px dashed #ccc; margin: 15px 0; }
        }
      </style>
    </head>
    <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
      <div class="container">
        ${c}
        ${o?``:`
          <div class="separator"></div>
          <div style="text-align: center; font-size: 10px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">Duplicado Empresa</div>
          ${c}
        `}
      </div>
    </body>
    </html>
  `;r.document.write(l),r.document.close()}function Kt({extractions:e=[],userRole:t=`VISOR`,onSaveEntry:n,onOpenControlScreen:r,onOpenDetailScreen:i}){let a=K(`div`,{classes:[`extractions-tab-container`]}),o=e.filter(e=>e.status!==`ACCEPTED`),s=e.filter(e=>e.status===`ACCEPTED`),c=o.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),l=s.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),u=K(`div`,{classes:[`stats-grid`],style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;`});u.appendChild(qt(`Extracciones Pendientes`,`${o.length} retiros`,`#3b82f6`)),u.appendChild(qt(`Monto Pendiente de Ingreso`,q(c),`var(--warning)`)),u.appendChild(qt(`Extracciones Ingresadas`,`${s.length} retiros`,`var(--success)`)),u.appendChild(qt(`Total Ingresado`,q(l),`var(--success)`)),a.appendChild(u);let d=``,f=`ALL`,p=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 1.5rem; padding: 1rem 1.25rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;`}),m=K(`input`,{attrs:{type:`text`,placeholder:`🔍 Buscar por carnicería, precinto u observaciones...`},style:`flex: 1; min-width: 250px; padding: 0.6rem 1rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);`}),h=K(`select`,{style:`padding: 0.6rem 1rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 600;`});h.innerHTML=`
    <option value="ALL">Todos los estados</option>
    <option value="PENDING" selected>⏳ Pendientes de Ingreso</option>
    <option value="ACCEPTED">✅ Ingresados</option>
  `,p.appendChild(m),p.appendChild(h),a.appendChild(p);let g=K(`div`,{classes:[`glass-card`,`table-responsive`],style:`padding: 0;`});a.appendChild(g);let _=()=>{let n=d.toLowerCase(),a=e.filter(e=>{let t=f===`ALL`||f===`PENDING`&&e.status!==`ACCEPTED`||f===`ACCEPTED`&&e.status===`ACCEPTED`,r=(e.butcheryName||``).toLowerCase(),i=(e.description||``).toLowerCase(),a=!n||r.includes(n)||i.includes(n);return t&&a});g.innerHTML=``;let o=K(`table`,{style:`width: 100%; min-width: 800px; border-collapse: collapse;`}),s=K(`thead`,{html:`
      <tr style="background: rgba(255,255,255,0.05); text-align: left;">
        <th style="padding: 1rem;">Fecha / Hora</th>
        <th style="padding: 1rem;">Carnicería / Sucursal</th>
        <th style="padding: 1rem;">Detalle / Precinto</th>
        <th style="padding: 1rem; text-align: right;">Monto Extraído</th>
        <th style="padding: 1rem; text-align: center;">Estado</th>
        <th style="padding: 1rem; text-align: right;">Acciones</th>
      </tr>
    `});o.appendChild(s);let c=K(`tbody`);a.length===0?c.innerHTML=`<tr><td colspan="6" style="padding: 3rem; text-align: center; color: var(--text-muted);">
        <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">No se encontraron extracciones</div>
        <div style="font-size: 0.85rem;">Pruebe cambiando los criterios de búsqueda o filtro.</div>
      </td></tr>`:a.forEach(e=>{let n=e.status!==`ACCEPTED`,a=yt(e.timestamp||e.createdAt||Date.now()),o=bt(e.timestamp||e.createdAt||Date.now()),s=K(`tr`,{style:`border-top: 1px solid var(--border); transition: background 0.2s;`});s.innerHTML=`
          <td style="padding: 1rem;">
            <div style="font-weight: 600;">${a}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${o}</div>
          </td>
          <td style="padding: 1rem;">
            <div style="font-weight: 700; color: var(--text-main);">${e.butcheryName||`Sucursal`}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Sesión: ${e.cashSessionId||`-`}</div>
          </td>
          <td style="padding: 1rem;">
            <div style="font-size: 0.9rem;">${e.description||`Sin observaciones`}</div>
          </td>
          <td style="padding: 1rem; text-align: right; font-weight: 800; color: var(--success); font-size: 1.05rem;">
            ${q(e.amount)}
          </td>
          <td style="padding: 1rem; text-align: center;">
            ${n?`<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; white-space: nowrap;">⏳ Pendiente</span>`:`<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; white-space: nowrap;">✅ Ingresado</span>`}
          </td>
          <td style="padding: 1rem; text-align: right; white-space: nowrap;">
            ${n?t===`ADMIN`?`<button class="btn-primary process-btn" style="padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; background: linear-gradient(135deg, #10b981, #059669);">📥 Controlar y Dar Ingreso</button>`:`<span title="Requiere perfil Administrador para procesar" style="font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid var(--border);">🔒 Solo Admin</span>`:`<button class="btn-secondary detail-btn" style="padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.85rem;">🔍 Ver Billetes</button>`}
          </td>
        `,s.addEventListener(`click`,t=>{t.target.closest(`.process-btn`)&&typeof r==`function`&&r(e),t.target.closest(`.detail-btn`)&&typeof i==`function`&&i(e)}),c.appendChild(s)}),o.appendChild(c),g.appendChild(o)};return m.oninput=e=>{d=e.target.value,_()},h.onchange=e=>{f=e.target.value,_()},_(),a}function qt(e,t,n){let r=K(`div`,{classes:[`glass-card`],style:`padding: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; border-left: 4px solid ${n};`});return r.appendChild(K(`div`,{text:e,style:`font-size: 0.8rem; color: var(--text-muted); font-weight: 600;`})),r.appendChild(K(`div`,{text:t,style:`font-size: 1.35rem; font-weight: 800; color: ${n};`})),r}function Jt(e){if(!e)return{items:[],totalCalculated:0,billCounts:{}};try{let t=typeof e==`string`?JSON.parse(e):e,n=0,r={};return{items:t.map(e=>{let t=parseInt(e.fajos)||0,i=parseInt(e.sueltos)||0,a=parseInt(e.denominacion)||0,o=t*100+i,s=o*a;return n+=s,a>0&&(r[a]={blocks:0,batches:t,qtys:i,subtotal:s}),{...e,denominacion:a,fajos:t,sueltos:i,totalBilletes:o,subtotal:s}}),totalCalculated:n,billCounts:r}}catch(e){return console.error(`Error al parsear billeteBreakdownJson:`,e),{items:[],totalCalculated:0,billCounts:{}}}}async function Yt(e){return Xt()}async function Xt(){try{return(await I.cash_extractions.toArray()).sort((e,t)=>(t.timestamp||t.updatedAt||0)-(e.timestamp||e.updatedAt||0))}catch(e){return console.error(`Error leyendo cash_extractions desde IndexedDB:`,e),[]}}async function Zt(e,t,n,r=null){let i={status:n,updatedAt:Date.now()};r&&(i.accountingEntryId=r),await l(C(e,`cash_extractions`,t),i);try{let e=await I.cash_extractions.get(t);e&&await I.cash_extractions.put({...e,...i})}catch(e){console.warn(`Error actualizando IndexedDB local para extracción:`,e)}}function Qt(e,{extraction:t,onSave:n,onBack:r,userRole:i=`VISOR`}){if(e.innerHTML=``,i!==`ADMIN`){alert(`⚠️ Acceso Restringido: Únicamente el usuario ADMINISTRADOR puede autorizar y dar ingreso a las extracciones de carnicería.`),typeof r==`function`&&r();return}let{items:a,totalCalculated:o,billCounts:s}=Jt(t.billeteBreakdownJson),c={...s},l=yt(t.timestamp||t.createdAt||Date.now()),u=bt(t.timestamp||t.createdAt||Date.now()),d=K(`div`,{classes:[`extraction-screen-wrapper`,`fade-in`],style:`width: 100%; padding-bottom: 3rem;`}),f=K(`div`,{classes:[`dashboard-header`],style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;`}),p=K(`div`,{style:`display: flex; align-items: center; gap: 1rem;`}),m=K(`button`,{classes:[`back-btn-m3`],html:`<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>`,attrs:{title:`Volver a Caja General`}});m.onclick=()=>{typeof r==`function`&&r()},p.appendChild(m),p.appendChild(K(`div`,{html:`<h1 style="margin:0; font-size: 1.5rem;">📥 Control e Ingreso de Extracción</h1>
           <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${t.butcheryName||`Sucursal`} • ${l} (${u})</div>`})),f.appendChild(p);let h=K(`div`,{html:`<span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); font-weight: 700; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">⏳ Extracción Pendiente</span>`});f.appendChild(h),d.appendChild(f);let g=K(`div`,{style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;`}),_=K(`div`,{classes:[`glass-card`],style:`padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;`});_.innerHTML=`
    <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
      📄 Datos de la Extracción
    </h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div>
        <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700;">Monto Declarado</span>
        <span style="font-size: 1.5rem; font-weight: 800; color: var(--success);">${q(t.amount)}</span>
      </div>
      <div>
        <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700;">Sesión de Caja</span>
        <span style="font-size: 0.95rem; font-weight: 600; font-family: monospace;">${t.cashSessionId||`-`}</span>
      </div>
    </div>
    <div>
      <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700;">Detalle / Personal / Precinto</span>
      <div style="font-size: 0.95rem; color: var(--text-main); font-weight: 500; margin-top: 0.25rem;">${t.description||`Sin observaciones`}</div>
    </div>
  `,g.appendChild(_);let v=K(`div`,{classes:[`glass-card`],style:`padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;`});v.innerHTML=`
    <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
      ⚖️ Estado de Arqueo
    </h3>
    <div style="font-size: 0.9rem; color: var(--text-muted);">
      Compara el monto declarado por la carnicería contra el recuento de efectivo recibido en la Caja General.
    </div>
    <div id="screen-diff-container" style="padding: 1rem; border-radius: 10px; font-weight: 700; text-align: center; font-size: 1.1rem; border: 1px solid transparent; background: rgba(255,255,255,0.03);">
      Calculando diferencia...
    </div>
  `,g.appendChild(v),d.appendChild(g);let y=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 1.5rem; padding: 1.5rem;`});y.innerHTML=`
    <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; color: var(--primary); display: flex; align-items: center; justify-content: space-between;">
      <span>💵 Desglose de Billetes Declarado (Carnicería)</span>
      <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">Marca las filas con recuento erróneo ❌</span>
    </h3>
    
    ${a.length>0?`
      <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 600px;">
          <thead>
            <tr style="background: rgba(255,255,255,0.05); text-align: left; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.75rem 1rem;">Denominación</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">Fajos (100 u.)</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">Sueltos (1 u.)</th>
              <th style="padding: 0.75rem 1rem; text-align: right;">Subtotal</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">¿Recuento Mal?</th>
            </tr>
          </thead>
          <tbody>
            ${a.map(e=>`
              <tr class="breakdown-row" data-denom="${e.denominacion}" style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;">
                <td style="padding: 0.6rem 1rem; font-weight: 700; font-size: 1.05rem;">$ ${e.denominacion.toLocaleString()}</td>
                <td style="padding: 0.6rem 1rem; text-align: center; color: ${e.fajos>0?`#60a5fa`:`var(--text-muted)`}; font-weight: 600;">${e.fajos}</td>
                <td style="padding: 0.6rem 1rem; text-align: center; color: ${e.sueltos>0?`#60a5fa`:`var(--text-muted)`}; font-weight: 600;">${e.sueltos}</td>
                <td style="padding: 0.6rem 1rem; text-align: right; font-weight: 700; color: #10b981;">$ ${e.subtotal.toLocaleString()}</td>
                <td style="padding: 0.6rem 1rem; text-align: center;">
                  <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; padding: 0.3rem 0.75rem; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); user-select: none;">
                    <input type="checkbox" class="denom-bad-chk" data-denom="${e.denominacion}">
                    <span class="bad-status-text" style="color: var(--text-muted);">❌ Estuvo mal</span>
                  </label>
                </td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.75rem; display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.02); padding: 0.6rem 1rem; border-radius: 8px;">
        <span>💡</span> <span>Las denominaciones que marques con <strong>"❌ Estuvo mal"</strong> se abrirán <strong>vacías</strong> al presionar <strong>🧮 Recuento</strong>, mientras que las que estuvieron bien mantendrán su precarga.</span>
      </div>
    `:`
      <div style="font-size: 0.9rem; color: var(--text-muted); font-style: italic; background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
        No se adjuntó el desglose deserializado de billetes en esta extracción.
      </div>
    `}
  `,d.appendChild(y);let b=K(`div`,{classes:[`glass-card`],style:`padding: 1.5rem;`});b.innerHTML=`
    <h3 style="margin-top: 0; margin-bottom: 1.5rem; font-size: 1.1rem; color: var(--primary);">
      ✍️ Asentamiento en Libro Diario de Caja General
    </h3>

    <form id="screen-extraction-form">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Monto a Ingresar ($)</label>
          <input type="number" step="0.01" name="amount" id="expected-amount-input" required 
                 style="font-size: 1.3rem; font-weight: 700; width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);" 
                 value="${t.amount}">
        </div>
        
        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Monto Contado Físico ($)</label>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem;">
            <input type="number" step="0.01" name="countedAmount" id="counted-amount-input" required 
                   style="font-size: 1.3rem; font-weight: 700; width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);" 
                   value="${o>0?o:t.amount}">
            <button type="button" id="open-calc-btn" class="btn-secondary" style="white-space: nowrap; padding: 0 1.25rem; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;" title="Abrir la calculadora de recuento físico de billetes">
              🧮 Recuento
            </button>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 2rem;">
        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Concepto / Observaciones en Libro Diario</label>
        <input type="text" name="description" required style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);"
               value="[Ingreso Extracción] ${t.butcheryName} - ${t.description||``}">
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center; border-top: 1px solid var(--border); padding-top: 1.5rem; flex-wrap: wrap;">
        <button type="button" class="btn-cancel cancel-btn" style="padding: 0.9rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">
          ← Volver sin guardar
        </button>
        <button type="submit" style="padding: 0.9rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 1.05rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3); letter-spacing: 0.02em;">
          ✓ Confirmar y Dar Ingreso
        </button>
      </div>
    </form>
  `,d.appendChild(b),e.appendChild(d);let x=d.querySelector(`#screen-extraction-form`),S=d.querySelector(`#expected-amount-input`),C=d.querySelector(`#counted-amount-input`),w=d.querySelector(`#screen-diff-container`);d.querySelectorAll(`.denom-bad-chk`).forEach(e=>{e.addEventListener(`change`,e=>{let t=e.target.checked,n=e.target.closest(`.breakdown-row`),r=n.querySelector(`.bad-status-text`);t?(n.style.background=`rgba(239, 68, 68, 0.12)`,r.textContent=`⚠️ Mal (Se borrará)`,r.style.color=`#ef4444`,r.style.fontWeight=`700`):(n.style.background=`transparent`,r.textContent=`❌ Estuvo mal`,r.style.color=`var(--text-muted)`,r.style.fontWeight=`normal`)})});let T=()=>{let e=parseFloat(S.value),t=parseFloat(C.value);if(!isNaN(e)&&!isNaN(t)){let n=t-e;Math.abs(n)<.01?(w.style.background=`rgba(255,255,255,0.05)`,w.style.borderColor=`var(--border)`,w.style.color=`var(--text-main)`,w.textContent=`Diferencia en Caja: OK (Monto extraído y contado coinciden)`):n>0?(w.style.background=`rgba(16,185,129,0.1)`,w.style.borderColor=`rgba(16,185,129,0.3)`,w.style.color=`#10b981`,w.textContent=`Sobra en Caja General: ${q(n)}`):(w.style.background=`rgba(239,68,68,0.1)`,w.style.borderColor=`rgba(239,68,68,0.3)`,w.style.color=`#ef4444`,w.textContent=`Falta en Caja General: ${q(Math.abs(n))}`)}};S.addEventListener(`input`,T),C.addEventListener(`input`,T),T(),d.querySelector(`#open-calc-btn`).onclick=()=>{let e={};a.forEach(t=>{let n=t.denominacion,r=d.querySelector(`.denom-bad-chk[data-denom="${n}"]`);r&&r.checked?e[n]={blocks:``,batches:``,qtys:``}:e[n]={blocks:0,batches:t.fajos,qtys:t.sueltos,subtotal:t.subtotal}}),Bt(parseFloat(S.value)||0,e=>{C.value=e.grand,c=e.breakdown,T()},e)},x.onsubmit=e=>{e.preventDefault();let r=new FormData(x);n({entryData:{type:`IN`,description:r.get(`description`),amount:parseFloat(r.get(`amount`)),countedAmount:parseFloat(r.get(`countedAmount`)),billCounts:c,date:t.timestamp||Date.now(),extractionId:t.id,butcheryName:t.butcheryName},extractionId:t.id})},d.querySelector(`.cancel-btn`).onclick=()=>{typeof r==`function`&&r()}}function $t(e,{extraction:t,onBack:n}){e.innerHTML=``;let{items:r}=Jt(t.billeteBreakdownJson),i=yt(t.timestamp||t.createdAt||Date.now()),a=bt(t.timestamp||t.createdAt||Date.now()),o=K(`div`,{classes:[`extraction-screen-wrapper`,`fade-in`],style:`width: 100%; padding-bottom: 3rem;`}),s=K(`div`,{classes:[`dashboard-header`],style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;`}),c=K(`div`,{style:`display: flex; align-items: center; gap: 1rem;`}),l=K(`button`,{classes:[`back-btn-m3`],html:`<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>`,attrs:{title:`Volver a Caja General`}});l.onclick=()=>{typeof n==`function`&&n()},c.appendChild(l),c.appendChild(K(`h1`,{text:`Detalle de Extracción Ingresada`,style:`margin:0; font-size: 1.5rem;`})),s.appendChild(c);let u=K(`div`,{html:`<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">✅ Ingresado en Caja General</span>`});s.appendChild(u),o.appendChild(s);let d=K(`div`,{classes:[`glass-card`],style:`padding: 1.5rem;`});d.innerHTML=`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem;">
      <div><strong>Sucursal:</strong> <span style="display: block; font-size: 1.1rem; font-weight: 700;">${t.butcheryName||`-`}</span></div>
      <div><strong>Fecha y Hora:</strong> <span style="display: block; font-size: 1.05rem; font-weight: 600;">${i} (${a})</span></div>
      <div><strong>Monto Extraído:</strong> <span style="display: block; font-size: 1.3rem; font-weight: 800; color: var(--success);">${q(t.amount)}</span></div>
      <div><strong>Observaciones / Precinto:</strong> <span style="display: block; font-size: 0.95rem;">${t.description||`Sin datos`}</span></div>
    </div>

    <h3 style="margin: 1.5rem 0 1rem 0; font-size: 1.1rem; color: var(--primary);">Desglose de Billetes Declarado</h3>
    
    ${r.length>0?`
      <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; overflow-x: auto; margin-bottom: 2rem;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 500px;">
          <thead>
            <tr style="background: rgba(255,255,255,0.05); text-align: left; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.75rem 1rem;">Denominación</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">Fajos (100 u.)</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">Sueltos (1 u.)</th>
              <th style="padding: 0.75rem 1rem; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${r.map(e=>`
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 0.6rem 1rem; font-weight: 700; font-size: 1.05rem;">$ ${e.denominacion.toLocaleString()}</td>
                <td style="padding: 0.6rem 1rem; text-align: center;">${e.fajos}</td>
                <td style="padding: 0.6rem 1rem; text-align: center;">${e.sueltos}</td>
                <td style="padding: 0.6rem 1rem; text-align: right; font-weight: 700; color: #10b981;">$ ${e.subtotal.toLocaleString()}</td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      </div>
    `:`<p style="color: var(--text-muted); font-style: italic;">Sin desglose adjunto.</p>`}

    <div style="display: flex; justify-content: flex-end;">
      <button class="btn-secondary back-btn" style="padding: 0.75rem 2rem; border-radius: 10px; font-weight: 600;">← Volver a Caja General</button>
    </div>
  `,o.appendChild(d),e.appendChild(o),o.querySelector(`.back-btn`).onclick=()=>{typeof n==`function`&&n()}}function en(e,{establishments:t=[],initialData:n=null,onSave:r,onBack:i}){e.innerHTML=``;let a=null,o=n?.selectedLogIds||[],s=K(`div`,{classes:[`salary-screen-wrapper`,`fade-in`],style:`width: 100%; padding-bottom: 3rem;`}),c=K(`div`,{classes:[`dashboard-header`],style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;`}),l=K(`div`,{style:`display: flex; align-items: center; gap: 1rem;`}),u=K(`button`,{classes:[`back-btn-m3`],html:`<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>`,attrs:{title:`Volver a Caja General`}});u.onclick=()=>{typeof i==`function`&&i()},l.appendChild(u),l.appendChild(K(`div`,{html:`<h1 style="margin:0; font-size: 1.5rem;">💳 Registro y Pago de Haberes / Sueldo</h1>
           <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Caja General • Salida de Efectivo para Pago de Personal</div>`})),c.appendChild(l);let d=K(`div`,{html:`<span style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 700; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">🔴 Egreso de Caja General</span>`});c.appendChild(d),s.appendChild(c);let f=K(`div`,{classes:[`glass-card`],style:`padding: 2rem; max-width: 900px; margin: 0 auto;`}),p=n?.totalAmount!==void 0&&n?.totalAmount!==null?(Math.round(parseFloat(n.totalAmount)*100)/100).toFixed(2):``;f.innerHTML=`
    <h3 style="margin-top: 0; margin-bottom: 1.5rem; font-size: 1.15rem; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
      ✍️ Datos del Pago de Sueldo
    </h3>

    <form id="salary-screen-form">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Sucursal / Establecimiento</label>
          <select id="est-select" required style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-size: 1rem; font-weight: 600;">
            <option value="">Seleccione una sucursal...</option>
            ${t.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)}
          </select>
        </div>

        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Empleado</label>
          <select id="emp-select" required disabled style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-size: 1rem; font-weight: 600;">
            <option value="">Primero seleccione sucursal...</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-weight: 600; margin: 0;">Monto a Pagar ($)</label>
            <select id="round-amount-select" style="font-size: 0.78rem; padding: 0.2rem 0.5rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: #60a5fa; font-weight: 600;">
              <option value="exact">Exacto (2 decimales)</option>
              <option value="500">Múltiplo de $ 500</option>
              <option value="1000">Múltiplo de $ 1.000</option>
            </select>
          </div>
          <input type="number" step="0.01" name="amount" id="expected-amount-input" required placeholder="0.00" 
                 style="font-size: 1.3rem; font-weight: 800; width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--success);"
                 value="${p}">
        </div>


        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Recuento de Billetes Físicos ($)</label>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem;">
            <input type="number" step="0.01" name="countedAmount" id="counted-amount-input" placeholder="Opcional" 
                   style="font-size: 1.3rem; font-weight: 800; width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
            <button type="button" id="open-calc-btn" class="btn-secondary" style="white-space: nowrap; padding: 0 1.25rem; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;" title="Abrir calculadora de billetes">
              🧮 Calc.
            </button>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Concepto / Detalle en Libro Diario</label>
        <input type="text" name="description" id="description-input" required 
               style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);"
               value="${n?.periodSummary||`Pago Sueldo: `}">
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label style="display: inline-flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.9rem; user-select: none;">
          <input type="checkbox" id="save-breakdown-chk"> 
          <span>Adjuntar arqueo detallado de billetes al recibo de sueldo</span>
        </label>
      </div>

      <div id="diff-container" style="display: none; margin-bottom: 1.5rem; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; text-align: center; font-size: 1.05rem; border: 1px solid transparent;"></div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center; border-top: 1px solid var(--border); padding-top: 1.5rem; flex-wrap: wrap;">
        <button type="button" class="btn-cancel cancel-btn" style="padding: 0.9rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">
          ← Volver sin registrar
        </button>
        <button type="submit" style="padding: 0.9rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 1.05rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3); letter-spacing: 0.02em;">
          ✓ Confirmar y Registrar Pago de Sueldo
        </button>
      </div>
    </form>
  `,s.appendChild(f),e.appendChild(s);let m=s.querySelector(`#salary-screen-form`),h=s.querySelector(`#est-select`),g=s.querySelector(`#emp-select`),_=s.querySelector(`#expected-amount-input`),v=s.querySelector(`#round-amount-select`),y=s.querySelector(`#counted-amount-input`),b=s.querySelector(`#description-input`),x=s.querySelector(`#diff-container`),S=s.querySelector(`#save-breakdown-chk`),C=parseFloat(_.value)||0;_.addEventListener(`change`,()=>{C=parseFloat(_.value)||0}),v&&v.addEventListener(`change`,()=>{let e=v.value,t=C;t=e===`500`?Math.round(t/500)*500:e===`1000`?Math.round(t/1e3)*1e3:Math.round(t*100)/100,_.value=t.toFixed(2),T()});let w=(e,n=null)=>{if(g.innerHTML=`<option value="">Seleccione un empleado...</option>`,e){let r=t.find(t=>t.id===e);r&&r.employees&&r.employees.length>0?(r.employees.forEach(e=>{let t=n&&e.id===n?`selected`:``;g.innerHTML+=`<option value="${e.id}" data-name="${e.name}" data-dni="${e.dni||``}" data-position="${e.position||``}" ${t}>${e.name} ${e.position?`(${e.position})`:``}</option>`}),g.disabled=!1):(g.innerHTML=`<option value="">No hay empleados en esta sucursal</option>`,g.disabled=!0)}else g.disabled=!0};h.addEventListener(`change`,()=>{w(h.value)}),g.addEventListener(`change`,()=>{let e=g.selectedOptions[0];e&&e.dataset.name&&(!b.value||b.value.startsWith(`Pago Sueldo:`))&&(b.value=`Pago Sueldo: ${e.dataset.name}`)}),n?.establishment?.id&&(h.value=n.establishment.id,w(n.establishment.id,n.employee?.id));let T=()=>{let e=parseFloat(_.value),t=parseFloat(y.value);if(!isNaN(e)&&!isNaN(t)){let n=t-e;x.style.display=`block`,Math.abs(n)<.01?(x.style.background=`rgba(255,255,255,0.05)`,x.style.borderColor=`var(--border)`,x.style.color=`var(--text-main)`,x.textContent=`Diferencia en Caja: OK (Monto abonado y contado coinciden)`):n>0?(x.style.background=`rgba(16,185,129,0.1)`,x.style.borderColor=`rgba(16,185,129,0.3)`,x.style.color=`#10b981`,x.textContent=`Sobra en Arqueo: ${q(n)}`):(x.style.background=`rgba(239,68,68,0.1)`,x.style.borderColor=`rgba(239,68,68,0.3)`,x.style.color=`#ef4444`,x.textContent=`Falta en Arqueo: ${q(Math.abs(n))}`)}else x.style.display=`none`};_.addEventListener(`input`,T),y.addEventListener(`input`,T),T(),s.querySelector(`#open-calc-btn`).onclick=()=>{Bt(parseFloat(_.value)||0,e=>{y.value=e.grand,a=e.breakdown,S.checked=!0,T()})},m.onsubmit=e=>{e.preventDefault();let t=g.selectedOptions[0],n=t?t.dataset.name:``,i=t?t.dataset.dni:``,s=t?t.dataset.position:``,c=y.value;r({type:`OUT`,description:b.value,amount:parseFloat(_.value),countedAmount:c?parseFloat(c):null,billCounts:S.checked?a:null,isSalary:!0,establishmentId:h.value,employeeId:g.value,employeeName:n,employeeDni:i,employeePosition:s,selectedLogIds:o})},s.querySelector(`.cancel-btn`).onclick=()=>{typeof i==`function`&&i()}}function tn(e,t){let{entries:n,filteredEntries:r,extractions:i=[],selectedExtraction:a=null,extractionScreenMode:o=null,isSalaryPaymentActive:s=!1,salaryPaymentPayload:c=null,clients:l,producers:u,establishments:d=[],pagination:f,filters:p,activeTab:m=`journal`,userRole:h=`VISOR`,onTabChange:g,onOpenControlScreen:_,onOpenDetailScreen:v,onCloseExtractionScreen:y,onOpenSalaryPaymentScreen:b,onCloseSalaryPaymentScreen:x,onFilterChange:S,onSave:C,onSaveExtractionEntry:w,onDelete:T,onRefresh:E,onExport:D,title:O=`Caja General`}=t;if(e.innerHTML=``,a&&o===`control`){Qt(e,{extraction:a,userRole:h,onSave:w,onBack:y});return}if(a&&o===`detail`){$t(e,{extraction:a,onBack:y});return}if(s){en(e,{establishments:d,initialData:c,onSave:e=>{C(e),typeof x==`function`&&x()},onBack:x});return}let{onFetchArcaPipeline:k,onSaveArcaEntries:A,onFetchIssuedArcaPipeline:j,onLinkIssuedInvoiceToClient:M}=t,ee=i.filter(e=>e.status!==`ACCEPTED`).length;e.appendChild(rn({title:O,filteredEntries:r,entries:n,clients:l,producers:u,establishments:d,onSave:C,onExport:D,onOpenSalaryPaymentScreen:b,onFetchArcaPipeline:k,onSaveArcaEntries:A,onFetchIssuedArcaPipeline:j,onLinkIssuedInvoiceToClient:M,onBack:t.onBack})),O===`Caja General`&&e.appendChild(nn({activeTab:m,pendingCount:ee,onTabChange:g})),O===`Caja General`&&m===`extractions`?e.appendChild(Kt({extractions:i,userRole:h,onSaveEntry:w,onOpenControlScreen:_,onOpenDetailScreen:v})):(e.appendChild(on({filters:p,onFilterChange:S})),e.appendChild(sn(r||n)),e.appendChild(cn(n,{clients:l,producers:u,onSave:C,onDelete:T,title:O})),f&&f.totalPages>1&&e.appendChild(un(n,f)))}function nn({activeTab:e,pendingCount:t,onTabChange:n}){let r=K(`div`,{style:`display: flex; gap: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; padding-bottom: 0.25rem;`}),i=K(`button`,{classes:e===`journal`?[`btn-tab`,`active`]:[`btn-tab`],style:`background: transparent; border: none; font-size: 0.95rem; font-weight: 700; padding: 0.6rem 1rem; border-bottom: 3px solid ${e===`journal`?`var(--primary)`:`transparent`}; color: ${e===`journal`?`var(--primary)`:`var(--text-muted)`}; cursor: pointer; border-radius: 6px; transition: all 0.2s;`,html:`<span>📖 Libro Diario / Movimientos</span>`});i.onclick=()=>{typeof n==`function`&&n(`journal`)};let a=t>0?`<span style="background: #ef4444; color: #ffffff; padding: 0.15rem 0.55rem; border-radius: 12px; font-size: 0.75rem; font-weight: 800; margin-left: 0.5rem; box-shadow: 0 2px 8px rgba(239,68,68,0.4);">${t}</span>`:`<span style="background: rgba(255,255,255,0.08); color: var(--text-muted); padding: 0.15rem 0.55rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">0</span>`,o=K(`button`,{classes:e===`extractions`?[`btn-tab`,`active`]:[`btn-tab`],style:`background: transparent; border: none; font-size: 0.95rem; font-weight: 700; padding: 0.6rem 1rem; border-bottom: 3px solid ${e===`extractions`?`#10b981`:`transparent`}; color: ${e===`extractions`?`#10b981`:`var(--text-muted)`}; cursor: pointer; border-radius: 6px; transition: all 0.2s; display: flex; align-items: center;`,html:`<span>📥 Extracciones por Recibir</span> ${a}`});return o.onclick=()=>{typeof n==`function`&&n(`extractions`)},r.appendChild(i),r.appendChild(o),r}function rn({title:e,filteredEntries:t,entries:n,clients:r,producers:i,establishments:a,onSave:o,onExport:s,onOpenSalaryPaymentScreen:c,onFetchArcaPipeline:l,onSaveArcaEntries:u,onFetchIssuedArcaPipeline:d,onLinkIssuedInvoiceToClient:f,onBack:p}){let m=K(`div`,{classes:[`dashboard-header`],style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;`}),h=K(`div`,{style:`display: flex; align-items: center; gap: 1rem;`}),g=K(`button`,{classes:[`back-btn-m3`],html:`<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>`,attrs:{title:`Volver al Dashboard`}});g.onclick=()=>{typeof p==`function`?p():window.dispatchEvent(new CustomEvent(`nav:dashboard`))},h.appendChild(g),h.appendChild(K(`h1`,{text:e,style:`margin:0;`})),m.appendChild(h);let _=K(`div`,{style:`display: flex; gap: 0.75rem; flex-wrap: wrap;`}),v=K(`button`,{classes:[`btn-secondary`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem; color: #3b82f6; border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.1);`,html:`<span>🤖 Facturas Recibidas ARCA</span>`});v.onclick=()=>{Be({title:`🤖 Importar Facturas Recibidas ARCA`,description:`Selecciona el rango de fechas para consultar comprobantes recibidos de proveedores y su atribución contable.`,submitText:`Buscar Comprobantes`,onSubmit:async(e,t)=>{typeof l==`function`?Vt({invoices:await l(e,t),onConfirm:e=>{typeof u==`function`&&u(e)}}):alert(`Error: La integración con ARCA no está disponible.`)}})};let y=K(`button`,{classes:[`btn-secondary`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem; color: #10b981; border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.1);`,html:`<span>📤 Ventas Emitidas ARCA</span>`});y.onclick=()=>{Be({title:`📤 Consulta de Ventas / Comprobantes Emitidos ARCA`,description:`Selecciona el rango de fechas para consultar el reporte de ventas emitidas (sin alterar el saldo de caja).`,submitText:`Consultar Ventas`,onSubmit:async(e,t)=>{typeof d==`function`?Ht({invoices:await d(e,t),clients:r,onLinkToClient:e=>{typeof f==`function`&&f(e)}}):alert(`Error: La consulta de ventas emitidas ARCA no está disponible.`)}})};let b=K(`button`,{classes:[`btn-secondary`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem;`,html:`<span>📥 Exportar</span>`});b.onclick=()=>{typeof s==`function`?Be({title:`📥 Exportar Movimientos`,description:`Selecciona el rango de fechas para exportar a Excel.`,submitText:`Exportar Excel`,onSubmit:s}):alert(`Error: La función de exportación no está disponible.`)};let x=K(`button`,{classes:[`btn-outline`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem; color: var(--text-main); border-color: var(--border);`,html:`<span>⚖️ Cerrar a Cero</span>`});x.onclick=()=>an(t||n,o);let S=K(`button`,{classes:[`btn-nueva-operacion`],style:`margin: 0;`,html:`<svg viewBox="0 0 24 24" width="18" height="18" style="fill:currentColor;flex-shrink:0;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> Nuevo Movimiento`});S.onclick=()=>Rt(null,{clients:r,producers:i,onSave:o,title:e});let C=K(`button`,{classes:[`btn-secondary`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem;`,html:`<span>🧮 Calculadora Auxiliar</span>`});C.onclick=()=>Ve(e);let w=K(`button`,{classes:[`btn-secondary`],style:`display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem; color: #8b5cf6; border-color: rgba(139,92,246,0.3); background: rgba(139,92,246,0.1);`,html:`<span>👨‍💼 Pagar Sueldo</span>`});return w.onclick=()=>{typeof c==`function`?c():zt({establishments:a,onSave:o,title:e})},_.appendChild(x),_.appendChild(C),_.appendChild(w),_.appendChild(v),_.appendChild(y),_.appendChild(b),_.appendChild(S),m.appendChild(_),m}function an(e,t){let n=e.filter(e=>e.type===`IN`).reduce((e,t)=>e+(parseFloat(t.amount)||0),0),r=e.filter(e=>e.type===`OUT`).reduce((e,t)=>e+(parseFloat(t.amount)||0),0),i=e.filter(e=>e.type===`WITHDRAWAL`).reduce((e,t)=>e+(parseFloat(t.amount)||0),0),a=n-r-i;if(a===0){alert(`La caja ya se encuentra en saldo cero.`);return}confirm(`¿Estás seguro de cerrar la caja a cero?\nSe insertará un Retiro automático por $ ${a.toLocaleString()} para saldar la caja.`)&&t({type:`WITHDRAWAL`,amount:a,description:`Cierre de Caja a Cero / Retiro Automático`,date:Date.now()})}function on({filters:e,onFilterChange:t}){let n=K(`div`,{classes:[`glass-card`],style:`margin-bottom: 2rem; padding: 1.25rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; align-items: end;`}),r=K(`div`,{classes:[`form-group`],style:`margin-bottom:0;`});r.appendChild(K(`label`,{text:`🔍 Buscar (Monto, Desc, Vínculo)`}));let i=K(`input`,{attrs:{type:`text`,placeholder:`Filtrar movimientos...`,value:e.searchTerm||``},style:`width: 100%;`});i.oninput=e=>t({searchTerm:e.target.value}),r.appendChild(i);let a=K(`div`,{classes:[`form-group`],style:`margin-bottom:0;`});a.appendChild(K(`label`,{text:`Desde`}));let o=K(`input`,{attrs:{type:`date`,value:e.startDate||``},style:`width: 100%;`});o.onchange=e=>t({startDate:e.target.value}),a.appendChild(o);let s=K(`div`,{classes:[`form-group`],style:`margin-bottom:0;`});s.appendChild(K(`label`,{text:`Hasta`}));let c=K(`input`,{attrs:{type:`date`,value:e.endDate||``},style:`width: 100%;`});c.onchange=e=>t({endDate:e.target.value}),s.appendChild(c);let l=K(`div`,{style:`display: flex; gap: 0.5rem;`}),u=K(`button`,{classes:[`btn-secondary`],text:`Limpiar Filtros`,style:`width: 100%; height: 42px; border-radius: 8px;`});return u.onclick=()=>{i.value=``,o.value=``,c.value=``,t({searchTerm:``,startDate:null,endDate:null})},l.appendChild(u),n.appendChild(r),n.appendChild(a),n.appendChild(s),n.appendChild(l),n}function sn(e){let t=e.filter(e=>e.type===`IN`).reduce((e,t)=>e+(parseFloat(t.amount)||0),0),n=e.filter(e=>e.type===`OUT`).reduce((e,t)=>e+(parseFloat(t.amount)||0),0),r=e.filter(e=>e.type===`WITHDRAWAL`).reduce((e,t)=>e+(parseFloat(t.amount)||0),0),i=t-n-r,a=K(`div`,{classes:[`stats-grid`],style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;`});return a.appendChild(dn(`Saldo Selección`,q(i),i>=0?`var(--success)`:`var(--danger)`)),a.appendChild(dn(`Total Ingresos`,q(t),`var(--success)`)),a.appendChild(dn(`Total Egresos`,q(n),`var(--danger)`)),a.appendChild(dn(`Retiros / Ajustes`,q(r),`#8b5cf6`)),a}function cn(e,{clients:t,producers:n,onSave:r,onDelete:i,title:a}){let o=K(`div`,{classes:[`glass-card`,`table-responsive`],style:`padding: 0; margin-bottom: 1.5rem;`}),s=K(`table`,{style:`width: 100%; min-width: 800px; border-collapse: collapse;`}),c=K(`thead`,{html:`
    <tr style="background: rgba(255,255,255,0.05); text-align: left;">
      <th style="padding: 1rem;">Fecha / Hora</th>
      <th style="padding: 1rem;">Descripción</th>
      <th style="padding: 1rem;">Vínculo (Cliente/Prod)</th>
      <th style="padding: 1rem; text-align: right;">Monto</th>
      <th style="padding: 1rem; text-align: right;">Diferencia Caja</th>
      <th style="padding: 1rem; text-align: right;">Acciones</th>
    </tr>
  `});s.appendChild(c);let l=K(`tbody`);return e.length===0?l.innerHTML=`<tr><td colspan="6" style="padding: 3rem; text-align: center; color: var(--text-muted);">
      <div style="font-size: 1.25rem; margin-bottom: 0.5rem;">No hay movimientos</div>
      <div style="font-size: 0.9rem;">Pruebe ajustando los filtros o agregue uno nuevo.</div>
    </td></tr>`:e.forEach(e=>l.appendChild(ln(e,{clients:t,producers:n,onSave:r,onDelete:i,title:a}))),s.appendChild(l),o.appendChild(s),o}function ln(e,{clients:t,producers:n,onSave:r,onDelete:i,title:a}){let o=K(`tr`,{style:`border-top: 1px solid var(--border); transition: background 0.2s;`}),s=e.clientName||e.producerName||`-`,c=e.type===`IN`,l=e.type===`WITHDRAWAL`,u=c?`var(--success)`:l?`#8b5cf6`:`var(--danger)`,d=c?`+`:`-`,f=`<span style="color: var(--text-muted);">-</span>`;if(e.countedAmount!==void 0&&e.countedAmount!==null){let t=e.countedAmount-e.amount;f=Math.abs(t)<.01?`<span style="color: var(--text-main); font-weight: 600;">OK</span>`:t>0?`<span style="color: #10b981; font-weight: 600;">Sobra ${q(t)}</span>`:`<span style="color: #ef4444; font-weight: 600;">Falta ${q(Math.abs(t))}</span>`}return o.innerHTML=`
    <td style="padding: 1rem;">
      <div style="font-weight: 500;">${yt(e.createdAt)}</div>
      <div style="font-size: 0.75rem; color: var(--text-muted);">${bt(e.createdAt)}</div>
    </td>
    <td style="padding: 1rem;">
      <div style="font-weight: 600;">${e.description||`Sin descripción`}</div>
    </td>
    <td style="padding: 1rem;">
      <span style="font-size: 0.85rem; color: var(--text-muted);">${s}</span>
    </td>
    <td style="padding: 1rem; text-align: right; font-weight: 700; color: ${u};">
      ${d} ${q(e.amount)}
    </td>
    <td style="padding: 1rem; text-align: right;">${f}</td>
    <td style="padding: 1rem; text-align: right; white-space: nowrap; display: flex; gap: 0.5rem; justify-content: flex-end;">
      <button class="icon-btn print-btn" title="Imprimir A4">📄</button>
      <button class="icon-btn thermal-btn" title="Imprimir Térmico">🧾</button>
      <button class="icon-btn edit-btn" title="Editar">✏️</button>
      <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none;"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
      </button>
    </td>
  `,o.addEventListener(`click`,o=>{o.target.closest(`.print-btn`)&&(e.isSalary?Gt(e,`standard`,a):Wt(e,`standard`)),o.target.closest(`.thermal-btn`)&&(e.isSalary?Gt(e,`thermal`,a):Wt(e,`thermal`)),o.target.closest(`.edit-btn`)&&(e.isSalary?alert(`Para editar un pago de sueldo, elimínelo y vuelva a crearlo.`):Rt(e,{clients:t,producers:n,onSave:r,title:a})),o.target.closest(`.delete-btn`)&&i(e.id)}),o}function un(e,t){let n=K(`div`,{style:`display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border);`});n.appendChild(K(`div`,{text:`Mostrando ${e.length} de ${t.totalItems} movimientos`,style:`font-size: 0.85rem; color: var(--text-muted);`}));let r=K(`div`,{style:`display: flex; gap: 0.5rem; align-items: center;`}),i=K(`button`,{classes:[`btn-secondary`],text:`Anterior`,style:`padding: 0.5rem 1rem; font-size: 0.85rem;`});i.disabled=t.currentPage===1,i.onclick=()=>t.onPageChange(t.currentPage-1),r.appendChild(i),r.appendChild(K(`span`,{text:`Página ${t.currentPage} de ${t.totalPages}`,style:`font-size: 0.85rem; font-weight: 600; margin: 0 1rem;`}));let a=K(`button`,{classes:[`btn-secondary`],text:`Siguiente`,style:`padding: 0.5rem 1rem; font-size: 0.85rem;`});return a.disabled=t.currentPage===t.totalPages,a.onclick=()=>t.onPageChange(t.currentPage+1),r.appendChild(a),n.appendChild(r),n}function dn(e,t,n){let r=K(`div`,{classes:[`glass-card`],style:`padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; border-left: 4px solid ${n};`});return r.appendChild(K(`div`,{text:e,style:`font-size: 0.85rem; color: var(--text-muted); font-weight: 500;`})),r.appendChild(K(`div`,{text:t,style:`font-size: 1.5rem; font-weight: 700; color: ${n};`})),r}function fn(e,t){let{client:n,faenas:r=[],payments:i=[],history:a=[],analysis:o={startDate:``,endDate:``,expectedPrice:0,totalSales:0},results:s=null,onRunAnalysis:c,onSaveAnalysis:l,onBack:u,onSelectHistory:d}=t;e.innerHTML=``;let f=K(`style`,{text:`
      .table-row-hover:hover {
        background-color: var(--glass) !important;
      }
      .history-item-card {
        border-left: 4px solid var(--border);
        transition: var(--transition);
      }
      .history-item-card:hover {
        transform: translateY(-2px);
        border-color: var(--primary) !important;
        background-color: var(--glass) !important;
        box-shadow: var(--elevation-2);
      }
      .tab-active {
        border-bottom: 3px solid var(--primary) !important;
        color: var(--text-main) !important;
      }
      .tab-inactive {
        border-bottom: 3px solid transparent !important;
        color: var(--text-muted) !important;
      }
      .premium-input {
        transition: var(--transition);
      }
      .premium-input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-container);
      }
      .action-btn-hover {
        transition: var(--transition);
      }
      .action-btn-hover:hover {
        opacity: 0.95;
        transform: translateY(-1px);
        box-shadow: var(--elevation-2);
      }
      .action-btn-hover:active {
        transform: translateY(0);
      }
    `});e.appendChild(f);let p=K(`div`,{classes:[`dashboard-header`],style:`display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; padding: 1rem; background: var(--glass); border-radius: 16px; border: 1px solid var(--border);`});p.innerHTML=`
    <button id="back-analysis" class="back-btn-m3" title="Volver al Panel" style="margin: 0;">
      <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <div style="flex: 1;">
      <h2 style="margin: 0; font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
        <span>📈</span> Análisis de Precio Promedio
      </h2>
      <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 0.9rem;">
        Cliente: <strong style="color: var(--text-main); font-weight: 600;">${n.name}</strong>
      </p>
    </div>
  `,e.appendChild(p),p.querySelector(`#back-analysis`).onclick=u;let m=K(`div`,{classes:[`grid-2-cols`],style:`align-items: start; gap: 2rem;`}),h=K(`div`,{style:`display: flex; flex-direction: column; gap: 2rem;`}),g=K(`div`,{classes:[`glass-card`],style:`padding: 2rem; border-radius: 16px; display: flex; flex-direction: column; gap: 1.5rem;`});if(g.innerHTML=`
    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
      <span>🔍</span> Parámetros del Análisis
    </h3>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
      <div class="form-group" style="margin: 0;">
        <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>📅</span> Desde (Despacho)
        </label>
        <input type="date" id="analysis-start" class="form-input premium-input" style="width: 100%; margin-top: 0.35rem; border-radius: 8px;" value="${o.startDate||``}">
      </div>
      
      <div class="form-group" style="margin: 0;">
        <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>📅</span> Hasta (Despacho)
        </label>
        <input type="date" id="analysis-end" class="form-input premium-input" style="width: 100%; margin-top: 0.35rem; border-radius: 8px;" value="${o.endDate||``}">
      </div>
      
      <div class="form-group" style="margin: 0;">
        <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>💰</span> Precio Kg Esperado
        </label>
        <input type="number" step="0.01" id="analysis-expected" class="form-input premium-input" style="width: 100%; margin-top: 0.35rem; border-radius: 8px;" value="${o.expectedPrice||``}" placeholder="0.00">
      </div>
      
      <div class="form-group" style="margin: 0;">
        <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>🛍️</span> Venta Total (Sistema Ext.)
        </label>
        <input type="number" step="0.01" id="analysis-sales" class="form-input premium-input" style="width: 100%; margin-top: 0.35rem; border-radius: 8px;" value="${o.totalSales||``}" placeholder="0.00">
      </div>
    </div>

    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
      <button id="run-analysis-btn" class="btn-primary action-btn-hover" style="flex: 1; margin: 0; padding: 0.85rem 1.5rem; border-radius: 100px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--primary); font-weight: 600; border: none; cursor: pointer;">
        🚀 Calcular Análisis
      </button>
    </div>
  `,h.appendChild(g),g.querySelector(`#run-analysis-btn`).onclick=()=>{let e=document.getElementById(`analysis-start`).value,t=document.getElementById(`analysis-end`).value,n=parseFloat(document.getElementById(`analysis-expected`).value)||0,r=parseFloat(document.getElementById(`analysis-sales`).value)||0;c({startDate:e,endDate:t,expectedPrice:n,totalSales:r})},s){let e=K(`div`,{style:`display: flex; flex-direction: column; gap: 2rem;`}),t=s.actualPrice-s.expectedPrice,n=t>=0?`var(--success)`:`var(--danger)`,a=s.totalSales-s.totalPayments,o=a<=0?`var(--success)`:`var(--danger)`,c=K(`div`,{classes:[`stats-grid`],style:`margin-bottom: 0; gap: 1rem;`});c.appendChild(pn(`Kg Despachados`,`${(s.totalKg||0).toLocaleString()} kg`,`⚖️`,`var(--text-main)`)),c.appendChild(pn(`Precio Real $/Kg`,`$${(s.actualPrice||0).toFixed(2)}`,`💰`,`var(--primary)`)),c.appendChild(pn(`Vs. Esperado`,`${t>=0?`+`:``}${t.toFixed(2)}`,`📊`,n)),c.appendChild(pn(`Cobros Registrados`,`$${(s.totalPayments||0).toLocaleString()}`,`📥`,`var(--success)`)),c.appendChild(pn(`Faltante de Cobro`,`$${(a||0).toLocaleString()}`,`🚩`,o)),e.appendChild(c);let u=K(`div`,{style:`display: flex; justify-content: flex-end;`}),d=K(`button`,{classes:[`btn-primary`,`action-btn-hover`],style:`background: var(--success); color: var(--on-primary); margin: 0; padding: 0.75rem 1.5rem; border-radius: 100px; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; border: none; cursor: pointer;`});d.innerHTML=`<span>💾</span> Guardar este Análisis`,d.onclick=()=>l(s),u.appendChild(d),e.appendChild(u);let f=K(`div`,{classes:[`glass-card`],style:`padding: 2rem; border-radius: 16px; display: flex; flex-direction: column; gap: 1.5rem;`});f.innerHTML=`
      <div style="display: flex; gap: 1.5rem; border-bottom: 1px solid var(--border); overflow-x: auto;">
        <h3 style="margin: 0; padding-bottom: 0.75rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; transition: var(--transition);" id="tab-faenas" class="tab-active">
          <span>🥩</span> Desglose de Despachos
        </h3>
        <h3 style="margin: 0; padding-bottom: 0.75rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; transition: var(--transition);" id="tab-payments" class="tab-inactive">
          <span>💸</span> Pagos Recibidos
        </h3>
      </div>
      <div id="table-container"></div>
    `;let p=e=>{let t=f.querySelector(`#table-container`);t.innerHTML=``;let n=K(`table`,{style:`width: 100%; border-collapse: collapse; font-size: 0.9rem;`});e===`faenas`?n.innerHTML=`
          <thead>
            <tr style="text-align: left; border-bottom: 2px solid var(--border);">
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">Fecha</th>
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">ID/Garrón</th>
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">Categoría</th>
              <th style="padding: 1rem 0.75rem; text-align: right; color: var(--text-muted); font-weight: 600;">Peso</th>
            </tr>
          </thead>
          <tbody>
            ${r.length===0?`
              <tr>
                <td colspan="4" style="padding: 3rem 1rem; text-align: center; color: var(--text-muted);">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;">🥩</div>
                  No hay despachos registrados en el rango de fechas seleccionado.
                </td>
              </tr>
            `:r.map(e=>`
                <tr style="border-bottom: 1px solid var(--border); transition: var(--transition);" class="table-row-hover">
                  <td style="padding: 1rem 0.75rem; color: var(--text-main);">${new Date(e.dispatchDate).toLocaleDateString()}</td>
                  <td style="padding: 1rem 0.75rem; font-family: monospace; font-weight: 500; color: var(--text-main);">#${e.garron||(e.id?e.id.substring(0,6):`N/A`)}</td>
                  <td style="padding: 1rem 0.75rem;"><span class="agent-badge" style="background: var(--glass); border: 1px solid var(--border); padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; color: var(--text-muted);">${e.category||`N/A`}</span></td>
                  <td style="padding: 1rem 0.75rem; text-align: right; font-weight: 700; color: var(--text-main);">${(e.kg||0).toLocaleString()} kg</td>
                </tr>
              `).join(``)}
          </tbody>
        `:n.innerHTML=`
          <thead>
            <tr style="text-align: left; border-bottom: 2px solid var(--border);">
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">Fecha</th>
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">Concepto</th>
              <th style="padding: 1rem 0.75rem; text-align: right; color: var(--text-muted); font-weight: 600;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${i.length===0?`
              <tr>
                <td colspan="3" style="padding: 3rem 1rem; text-align: center; color: var(--text-muted);">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;">💸</div>
                  No hay cobros registrados en el rango de fechas seleccionado.
                </td>
              </tr>
            `:i.map(e=>`
                <tr style="border-bottom: 1px solid var(--border); transition: var(--transition);" class="table-row-hover">
                  <td style="padding: 1rem 0.75rem; color: var(--text-main);">${new Date(e.date||e.createdAt).toLocaleDateString()}</td>
                  <td style="padding: 1rem 0.75rem; color: var(--text-main); font-weight: 500;">${e.description||`Cobro`}</td>
                  <td style="padding: 1rem 0.75rem; text-align: right; font-weight: 700; color: var(--success);">$${(e.amount||0).toLocaleString()}</td>
                </tr>
              `).join(``)}
          </tbody>
        `;let a=K(`div`,{classes:[`table-responsive`]});a.appendChild(n),t.appendChild(a)};p(`faenas`),h.appendChild(e),e.appendChild(f),f.querySelectorAll(`h3`).forEach(e=>{e.onclick=()=>{f.querySelectorAll(`h3`).forEach(e=>{e.classList.remove(`tab-active`),e.classList.add(`tab-inactive`)}),e.classList.remove(`tab-inactive`),e.classList.add(`tab-active`),p(e.id===`tab-payments`?`payments`:`faenas`)}})}else{let e=K(`div`,{classes:[`glass-card`],style:`padding: 4rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; border: 1px dashed var(--outline); background: rgba(var(--card-bg), 0.3); border-radius: 16px;`});e.innerHTML=`
      <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--primary-container); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; color: var(--primary); margin-bottom: 0.5rem; box-shadow: var(--elevation-1);">
        📊
      </div>
      <h4 style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-main);">Listo para el Análisis</h4>
      <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 340px; line-height: 1.6; margin: 0;">
        Establece el rango de fechas y parámetros arriba para contrastar los kilogramos despachados frente a cobros reales y tus estimaciones de ventas esperadas.
      </p>
      <div style="display: flex; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; justify-content: center;">
        <div style="font-size: 0.8rem; background: var(--glass); padding: 0.5rem 1rem; border-radius: 20px; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border); color: var(--text-muted); font-weight: 500;">
          <span>1️⃣</span> Rango de fechas
        </div>
        <div style="font-size: 0.8rem; background: var(--glass); padding: 0.5rem 1rem; border-radius: 20px; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border); color: var(--text-muted); font-weight: 500;">
          <span>2️⃣</span> Precios y Venta
        </div>
        <div style="font-size: 0.8rem; background: var(--glass); padding: 0.5rem 1rem; border-radius: 20px; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border); color: var(--text-muted); font-weight: 500;">
          <span>3️⃣</span> Resultados al instante
        </div>
      </div>
    `,h.appendChild(e)}m.appendChild(h);let _=K(`div`,{style:`display: flex; flex-direction: column; gap: 1.5rem;`}),v=K(`div`,{classes:[`glass-card`],style:`padding: 2rem; height: 100%; display: flex; flex-direction: column; gap: 1.5rem;`});v.innerHTML=`
    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
      <span>📜</span> Historial de Análisis
    </h3>
    <div id="history-list" style="display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 70vh; padding-right: 0.25rem;"></div>
  `;let y=v.querySelector(`#history-list`);a.length===0?y.innerHTML=`
      <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.8rem; opacity: 0.4;">📭</span>
        <span>No hay análisis guardados previamente para este cliente.</span>
      </div>
    `:a.forEach(e=>{let t=e.actualPrice>=e.expectedPrice?`var(--success)`:`var(--danger)`,n=K(`div`,{classes:[`card`,`history-item-card`],style:`padding: 1.25rem; cursor: pointer; border: 1px solid var(--border); border-left: 4px solid ${t}; border-radius: 12px; background: var(--card-bg);`});n.innerHTML=`
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <span style="color: var(--primary); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;">
            📅 ${e.startDate} / ${e.endDate}
          </span>
          <small style="opacity: 0.6; font-size: 0.75rem; color: var(--text-muted);">${new Date(e.createdAt).toLocaleDateString()}</small>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">
            $${e.actualPrice?.toFixed(2)} 
            <span style="font-weight: 500; font-size: 0.75rem; color: var(--text-muted);">/kg real</span>
          </div>
          <div style="font-size: 0.85rem; font-weight: 700; color: ${t}; background: var(--glass); padding: 0.25rem 0.6rem; border-radius: 8px; display: flex; align-items: center; gap: 0.25rem; border: 1px solid var(--border);">
            ${e.actualPrice>=e.expectedPrice?`▲`:`▼`} ${Math.abs(e.actualPrice-e.expectedPrice).toFixed(2)}
          </div>
        </div>
      `,n.onclick=()=>d(e),y.appendChild(n)}),_.appendChild(v),m.appendChild(_),e.appendChild(m)}function pn(e,t,n,r){let i=K(`div`,{classes:[`stat-card`,`glass-card`],style:`border-left: 4px solid ${r}; padding: 1.25rem; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; transition: var(--transition);`});return i.innerHTML=`
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; width: 100%;">
      <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${e}</span>
      <span style="font-size: 1.1rem; background: var(--glass); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--border);">${n}</span>
    </div>
    <div style="font-size: 1.35rem; font-weight: 800; color: ${r}; word-break: break-all; margin-top: 0.25rem;">${t}</div>
  `,i}function mn(e,t,n,r={},i=null){let a=`
    <div class="tabs-container" style="display: flex; gap: 0.75rem; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);">
      ${[{id:`camiones`,label:`🚚 Camiones`,action:`loadTrucks`},{id:`jaulas`,label:`🚚 Jaulas`,action:`loadTrailers`},{id:`choferes`,label:`👨‍✈️ Choferes`,action:`loadDrivers`},{id:`productores`,label:`👥 Productores`,action:`loadProducers`},{id:`comisionistas`,label:`🤝 Comisionistas`,action:`loadAgents`}].map(e=>{let n=e.id===t;return`
          <button class="category-chip ${n?`active`:``}" data-action="${e.action}" style="
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: 1px solid ${n?`var(--primary)`:`var(--border)`};
            background: ${n?`rgba(99, 102, 241, 0.08)`:`rgba(255,255,255,0.02)`};
            color: ${n?`var(--primary)`:`var(--text-muted)`};
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          ">
            ${e.label}
          </button>
        `}).join(``)}
    </div>
  `,o=n.map(e=>yn(t,e)).join(``),s=r.hasMore?`<div id="load-more-wrapper" style="text-align: center; margin-top: 2rem; width: 100%;"><button id="btn-load-more" class="btn-secondary" style="padding: 0.85rem 2rem; border-radius: 12px; font-weight: 700;">Cargar Más</button></div>`:``;if(r.isLoadMore){let t=e.querySelector(`#master-cards-grid`);t&&t.insertAdjacentHTML(`beforeend`,o);let r=e.querySelector(`#btn-load-more-container`);r&&(r.innerHTML=s),e._currentDataList=(e._currentDataList||[]).concat(n)}else e._currentDataList=n,e.innerHTML=`
      <div class="dashboard-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2>Administración de Datos Maestros</h2>
          <p style="color: var(--text-muted); margin: 0.25rem 0 0 0;">Gestione los registros fundamentales del sistema de fletes y logística.</p>
        </div>
        <button id="btn-add-master" class="btn-primary" style="padding: 0.85rem 2rem; border-radius: 12px; font-weight: 700; height: 48px; display: flex; align-items: center; gap: 0.5rem;">
          ➕ Nuevo Registro
        </button>
      </div>

      ${a}

      <!-- Custom EditText Search Input -->
      <div class="search-container-m3 glass-card" style="
        margin-bottom: 1.75rem; 
        padding: 0.65rem 1.15rem; 
        border-radius: 14px; 
        display: flex; 
        align-items: center; 
        gap: 0.75rem; 
        border: 1px solid var(--border); 
        background: rgba(0,0,0,0.18);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.25s ease;
      ">
        <span style="font-size: 1.15rem; color: var(--primary); display: flex; align-items: center; user-select: none;">🔍</span>
        <input type="text" id="master-search-input" placeholder="${gn(t)}" autocomplete="off" style="
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-main);
          font-size: 0.95rem;
          font-weight: 600;
          outline: none;
          padding: 0.25rem 0;
          font-family: inherit;
        ">
        <button id="btn-clear-master-search" title="Limpiar búsqueda" style="
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.1rem;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          margin: 0;
          transition: color 0.2s;
        ">✕</button>
      </div>

      <div style="margin-bottom: 1.5rem; animation: fadeIn 0.3s ease-out;">
        <h3 style="color: var(--text-main); font-size: 1.25rem; font-weight: 700; margin: 0 0 1rem 0;">${hn(t)}</h3>
        <div id="master-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
          ${o.length>0?o:`
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border);">
              <span style="font-size: 2.5rem; display: block; margin-bottom: 1rem; opacity: 0.6;">📦</span>
              No hay registros creados en este maestro. Hacé click en "Nuevo Registro" para empezar.
            </div>
          `}
        </div>
      </div>

      <div id="btn-load-more-container">
        ${s}
      </div>
      <div id="master-modal-container"></div>
    `,e.querySelectorAll(`.category-chip`).forEach(e=>{e.addEventListener(`click`,e=>{let t=e.currentTarget.dataset.action;i&&i[t]&&i[t]()})}),document.getElementById(`btn-add-master`).addEventListener(`click`,()=>{bn(t,null,r,i)});let c=e.querySelector(`#btn-load-more`);if(c){let e=c.cloneNode(!0);c.parentNode.replaceChild(e,c),e.addEventListener(`click`,()=>{i&&i.loadProducers&&i.loadProducers(r.lastVisible,!0)})}document.querySelectorAll(`.btn-edit`).forEach(n=>{let a=n.cloneNode(!0);n.parentNode.replaceChild(a,n),a.addEventListener(`click`,n=>{let a=n.currentTarget.dataset.id,o=e._currentDataList.find(e=>String(e.id)===String(a));o&&bn(t,o,r,i)})}),document.querySelectorAll(`.btn-delete`).forEach(e=>{let n=e.cloneNode(!0);e.parentNode.replaceChild(n,e),n.addEventListener(`click`,e=>{let n=e.currentTarget.dataset.id;if(confirm(`¿Estás seguro de eliminar este registro maestro permanentemente?`)){let e=`delete${vn(_n(t))}`;i&&i[e]&&i[e](n)}})});let l=e.querySelector(`#master-search-input`),u=e.querySelector(`#btn-clear-master-search`),d=e.querySelector(`#master-cards-grid`),f=(e,t,n)=>{if(!n)return!0;let r=n.toLowerCase();return e===`choferes`?(t.name||``).toLowerCase().includes(r)||(t.dni||``).toLowerCase().includes(r)||(t.license||``).toLowerCase().includes(r):e===`jaulas`?(t.name||``).toLowerCase().includes(r)||(t.licensePlate||``).toLowerCase().includes(r)||(t.type||``).toLowerCase().includes(r):e===`camiones`?(t.name||``).toLowerCase().includes(r)||(t.licensePlate||``).toLowerCase().includes(r)||(t.driver?.name||``).toLowerCase().includes(r)||(t.trailer?.name||``).toLowerCase().includes(r):e===`productores`?(t.name||``).toLowerCase().includes(r)||(t.cuit||``).toLowerCase().includes(r)||(t.phone||``).toLowerCase().includes(r)||(t.cbu||``).toLowerCase().includes(r):e===`comisionistas`?(t.name||``).toLowerCase().includes(r)||(t.phone||``).toLowerCase().includes(r):!1},p=()=>{if(!l||!d)return;let n=l.value;u&&(u.style.display=n?`flex`:`none`);let r=d.querySelectorAll(`.master-card`),i=0;r.forEach(r=>{let a=r.dataset.id,o=e._currentDataList.find(e=>String(e.id)===String(a));if(o){let e=f(t,o,n);r.style.display=e?`flex`:`none`,e&&i++}});let a=d.querySelector(`#no-matches-msg`);i===0&&r.length>0?a||d.insertAdjacentHTML(`beforeend`,`
          <div id="no-matches-msg" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border); animation: fadeIn 0.2s ease;">
            No se encontraron registros que coincidan con la búsqueda.
          </div>
        `):a&&a.remove()};if(l){l.addEventListener(`input`,p),u&&u.addEventListener(`click`,()=>{l.value=``,p(),l.focus()});let t=e.querySelector(`.search-container-m3`);t&&(l.addEventListener(`focus`,()=>{t.style.borderColor=`var(--primary)`,t.style.boxShadow=`0 0 0 2px rgba(99, 102, 241, 0.2)`}),l.addEventListener(`blur`,()=>{t.style.borderColor=`var(--border)`,t.style.boxShadow=`0 4px 12px rgba(0,0,0,0.1)`}))}r.isLoadMore&&p()}function hn(e){return{choferes:`Personal de Conducción (Choferes)`,jaulas:`Jaulas de Transporte (Acoplados)`,camiones:`Flota Activa (Camiones)`,productores:`Catálogo de Productores Ganaderos`,comisionistas:`Comisionistas de Compra y Consignación`}[e]||`Gestión de Maestros`}function gn(e){return{choferes:`Buscar chofer por nombre, DNI o licencia...`,jaulas:`Buscar jaula por nombre, patente o tipo (Doble/Simple)...`,camiones:`Buscar camión por nombre, patente o chofer/jaula asignados...`,productores:`Buscar productor por nombre, CUIT, teléfono o CBU...`,comisionistas:`Buscar comisionista por nombre o teléfono...`}[e]||`Buscar en datos maestros...`}function _n(e){return{choferes:`Driver`,jaulas:`Trailer`,camiones:`Truck`,productores:`Producer`,comisionistas:`Agent`}[e]}function vn(e){return e?e.charAt(0).toUpperCase()+e.slice(1):``}function yn(e,t){let n=`
    <div class="actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.25rem; border-top: 1px solid var(--border); padding-top: 1rem;">
      <button class="btn-icon btn-edit" data-id="${t.id}" title="Editar Registro" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); color: var(--primary); padding: 0.55rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>
      </button> 
      <button class="btn-icon btn-delete" data-id="${t.id}" title="Eliminar Registro" style="background: rgba(239, 68, 68, 0.03); border: 1px solid rgba(239, 68, 68, 0.15); color: var(--danger); padding: 0.55rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" /></svg>
      </button>
    </div>
  `,r=``;return e===`choferes`?r=`
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(99, 102, 241, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
          ${t.name?.charAt(0)||`?`}
        </div>
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${t.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">ID Interno: ${t.id.toString().slice(-6)}</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between;"><span>DNI / Identificación</span> <strong style="color: var(--text-main);">${t.dni||`-`}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Licencia Profesional</span> <strong style="color: var(--text-main);">${t.license||`-`}</strong></div>
      </div>
    `:e===`jaulas`?r=`
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${t.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Patente: ${t.licensePlate||`N/A`}</span>
        </div>
        <span class="badge" style="background: rgba(16, 185, 129, 0.08); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.15); font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 8px;">
          ${t.type===`DOUBLE`?`Doble`:`Simple`}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between;"><span>Vencimiento VTV</span> <strong style="color: var(--text-main);">${t.vtvExpiration||`-`}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Vencimiento SENASA</span> <strong style="color: var(--text-main);">${t.senasaExpiration||`-`}</strong></div>
      </div>
    `:e===`camiones`?r=`
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${t.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Patente: ${t.licensePlate||`N/A`}</span>
        </div>
        <span class="badge" style="background: ${t.isFreightPaid?`rgba(245, 158, 11, 0.08)`:`rgba(99, 102, 241, 0.08)`}; color: ${t.isFreightPaid?`#f59e0b`:`var(--primary)`}; border: 1px solid ${t.isFreightPaid?`rgba(245, 158, 11, 0.15)`:`rgba(99, 102, 241, 0.15)`}; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 8px;">
          ${t.isFreightPaid?`Tercero`:`Propio`}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Chofer Designado</span> 
          <span style="color: var(--text-main); font-weight: 600;">
            ${t.driver?`👤 ${t.driver.name}`:`❌ Sin Asignar`}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Jaula Asignada</span> 
          <span style="color: var(--text-main); font-weight: 600;">
            ${t.trailer?`🚛 ${t.trailer.name}`:`❌ Sin Asignar`}
          </span>
        </div>
      </div>
    `:e===`productores`?r=`
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
          ${t.name?.charAt(0)||`?`}
        </div>
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${t.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">CUIT: ${t.cuit||`-`}</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between;"><span>Teléfono Contacto</span> <strong style="color: var(--text-main);">${t.phone||`-`}</strong></div>
        <div style="display: flex; justify-content: space-between; flex-direction: column; gap: 0.25rem;">
          <span>CBU / Cuenta Bancaria</span> 
          <span style="font-family: monospace; font-size: 0.8rem; background: rgba(255,255,255,0.02); padding: 0.25rem 0.5rem; border-radius: 4px; color: var(--text-main); border: 1px solid var(--border); overflow-x: auto; white-space: nowrap; max-width: 100%; display: block;">
            ${t.cbu||`N/A`}
          </span>
        </div>
      </div>
    `:e===`comisionistas`&&(r=`
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
          ${t.name?.charAt(0)||`?`}
        </div>
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${t.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Comisionista Asociado</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between;"><span>Teléfono Contacto</span> <strong style="color: var(--text-main);">${t.phone||`-`}</strong></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Porcentaje Comisión</span> 
          <span style="color: var(--success); font-weight: 800; font-size: 1rem;">
            ${t.percent||`0`} %
          </span>
        </div>
      </div>
    `),`
    <div class="glass-card master-card" data-id="${t.id}" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; height: 100%; border-radius: 16px; transition: all 0.25s ease;">
      <div>${r}</div>
      ${n}
    </div>
  `}function bn(e,t,n,r=null){let i=document.getElementById(`master-modal-container`);if(!i)return;let a=!!t,o=vn(e.slice(0,-1)),s=a?`Editar ${o}`:`Nuevo ${o}`,c=``;if(e===`choferes`)c=`
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Nombre Completo</label><input type="text" id="m-name" value="${t?.name||``}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Número de DNI</label><input type="text" id="m-dni" value="${t?.dni||``}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Código Licencia</label><input type="text" id="m-license" value="${t?.license||``}" style="border-radius:10px;"></div>
    `;else if(e===`jaulas`)c=`
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Nombre Identificador</label><input type="text" id="m-name" value="${t?.name||``}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Patente / Matrícula</label><input type="text" id="m-plate" value="${t?.licensePlate||``}" style="border-radius:10px;"></div>
      <div class="form-group">
        <label style="font-weight:600; margin-bottom:0.5rem; display:block;">Tipo de Acoplado</label>
        <select id="m-type" style="border-radius:10px; width:100%;">
          <option value="SIMPLE" ${t?.type===`SIMPLE`?`selected`:``}>Simple</option>
          <option value="DOUBLE" ${t?.type===`DOUBLE`?`selected`:``}>Doble</option>
        </select>
      </div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Vencimiento VTV</label><input type="date" id="m-vtv" value="${t?.vtvExpiration||``}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Vencimiento Registro SENASA</label><input type="date" id="m-senasa" value="${t?.senasaExpiration||``}" style="border-radius:10px;"></div>
    `;else if(e===`camiones`){let e=(n.drivers||[]).map(e=>`<option value="${e.id}" ${t?.driver?.id==e.id?`selected`:``}>${e.name}</option>`).join(``),r=(n.trailers||[]).map(e=>`<option value="${e.id}" ${t?.trailer?.id==e.id?`selected`:``}>${e.name}</option>`).join(``);c=`
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Nombre Identificador</label><input type="text" id="m-name" value="${t?.name||``}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Patente / Matrícula</label><input type="text" id="m-plate" value="${t?.licensePlate||``}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Vencimiento VTV</label><input type="date" id="m-vtv" value="${t?.vtvExpiration||``}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Vencimiento Seguro Obligatorio</label><input type="date" id="m-insurance" value="${t?.insuranceExpiration||``}" style="border-radius:10px;"></div>
      <div class="form-group" style="display:flex; align-items:center; gap:0.5rem; margin:1rem 0;">
        <input type="checkbox" id="m-freight" ${t?.isFreightPaid?`checked`:``} style="width:18px; height:18px; margin:0; cursor:pointer;">
        <label for="m-freight" style="font-weight:600; cursor:pointer; margin:0;">Flete Pagado a Tercero</label>
      </div>
      <div class="form-group">
        <label style="font-weight:600; margin-bottom:0.5rem; display:block;">Chofer Asignado</label>
        <select id="m-driver" style="border-radius:10px; width:100%;"><option value="">-- Ninguno (Vacante) --</option>${e}</select>
      </div>
      <div class="form-group">
        <label style="font-weight:600; margin-bottom:0.5rem; display:block;">Jaula Asignada</label>
        <select id="m-trailer" style="border-radius:10px; width:100%;"><option value="">-- Ninguna --</option>${r}</select>
      </div>
    `}else e===`productores`?c=`
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Razón Social / Nombre</label><input type="text" id="m-name" value="${t?.name||``}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Teléfono de Contacto</label><input type="text" id="m-phone" value="${t?.phone||``}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">CUIT del Productor</label><input type="text" id="m-cuit" value="${t?.cuit||``}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">CBU / Alias</label><input type="text" id="m-cbu" value="${t?.cbu||``}" style="border-radius:10px;"></div>
    `:e===`comisionistas`&&(c=`
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Nombre Completo</label><input type="text" id="m-name" value="${t?.name||``}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Teléfono de Contacto</label><input type="text" id="m-phone" value="${t?.phone||``}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Porcentaje de Comisión (%)</label><input type="number" step="0.1" id="m-percent" value="${t?.percent||``}" style="border-radius:10px;"></div>
    `);i.innerHTML=`
    <div class="modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      animation: fadeIn 0.25s ease-out;
    ">
      <div class="modal active glass-card" id="master-modal" style="
        width: 100%;
        max-width: 500px;
        padding: 2rem;
        border-radius: 20px;
        background: var(--card-bg);
        border: 1px solid var(--border);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-height: 90vh;
        overflow-y: auto;
      ">
        <h3 style="margin-top:0; color: var(--primary); font-size:1.4rem; margin-bottom:1.5rem; font-weight:700;">${s}</h3>
        <form id="master-form">
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${c}
          </div>
          <div class="modal-actions" style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn-secondary" id="btn-cancel-modal" style="padding:0.75rem 1.5rem; border-radius:12px; font-weight:600;">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" style="padding:0.75rem 2rem; border-radius:12px; font-weight:700;">
              💾 Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  `,document.getElementById(`btn-cancel-modal`).addEventListener(`click`,()=>{i.innerHTML=``});let l=document.getElementById(`content`),u=l&&l._currentDataList?l._currentDataList:[],d=null,f=``;if(e===`choferes`?(d=document.getElementById(`m-dni`),f=`dni`):e===`jaulas`||e===`camiones`?(d=document.getElementById(`m-plate`),f=`plate`):e===`productores`?(d=document.getElementById(`m-cuit`),f=`cuit`):e===`comisionistas`&&(d=document.getElementById(`m-name`),f=`name`),d){let n=document.createElement(`span`);n.id=`dup-error-msg`,n.style.cssText=`color: #f87171; font-size: 0.78rem; font-weight: 600; margin-top: 0.25rem; display: none;`,d.parentNode.appendChild(n);let r=document.querySelector(`#master-form button[type="submit"]`),i=()=>{let i=d.value,a=!1,o=``;if(f===`dni`){let e=i.replace(/\D/g,``);a=u.some(n=>String(n.id)!==String(t?.id)&&String(n.dni||``).replace(/\D/g,``)===e&&e.length>0),o=`Ya existe un chofer registrado con este DNI (${i}).`}else if(f===`plate`){let n=i.replace(/[^a-zA-Z0-9]/g,``).toUpperCase();a=u.some(e=>String(e.id)!==String(t?.id)&&String(e.licensePlate||``).replace(/[^a-zA-Z0-9]/g,``).toUpperCase()===n&&n.length>0),o=`Ya existe un${e===`jaulas`?`a`:``} ${e===`jaulas`?`jaula`:`camión`} con esta patente (${i.toUpperCase()}).`}else if(f===`cuit`){let e=i.replace(/\D/g,``);a=u.some(n=>String(n.id)!==String(t?.id)&&String(n.cuit||``).replace(/\D/g,``)===e&&e.length>0),o=`Ya existe un productor registrado con este CUIT (${i}).`}else if(f===`name`){let e=i.trim().toLowerCase();a=u.some(n=>String(n.id)!==String(t?.id)&&String(n.name||``).trim().toLowerCase()===e&&e.length>0),o=`Ya existe un comisionista registrado con este nombre ("${i}").`}a?(d.style.borderColor=`#f87171`,d.style.boxShadow=`0 0 0 2px rgba(239, 68, 68, 0.2)`,n.textContent=`❌ ${o}`,n.style.display=`block`,r&&(r.disabled=!0,r.style.opacity=`0.5`,r.style.cursor=`not-allowed`)):(d.style.borderColor=``,d.style.boxShadow=``,n.style.display=`none`,r&&(r.disabled=!1,r.style.opacity=`1`,r.style.cursor=`pointer`))};d.addEventListener(`input`,i),i()}document.getElementById(`master-form`).addEventListener(`submit`,a=>{a.preventDefault();let o={id:t?t.id:Date.now()};if(e===`choferes`)o.name=document.getElementById(`m-name`).value,o.dni=document.getElementById(`m-dni`).value,o.license=document.getElementById(`m-license`).value;else if(e===`jaulas`)o.name=document.getElementById(`m-name`).value,o.licensePlate=document.getElementById(`m-plate`).value,o.type=document.getElementById(`m-type`).value,o.vtvExpiration=document.getElementById(`m-vtv`).value,o.senasaExpiration=document.getElementById(`m-senasa`).value;else if(e===`camiones`){o.name=document.getElementById(`m-name`).value,o.licensePlate=document.getElementById(`m-plate`).value,o.vtvExpiration=document.getElementById(`m-vtv`).value,o.insuranceExpiration=document.getElementById(`m-insurance`).value,o.isFreightPaid=document.getElementById(`m-freight`).checked;let e=document.getElementById(`m-driver`).value;o.driver=e?n.drivers.find(t=>String(t.id)===e):null;let t=document.getElementById(`m-trailer`).value;o.trailer=t?n.trailers.find(e=>String(e.id)===t):null}else e===`productores`?(o.name=document.getElementById(`m-name`).value,o.phone=document.getElementById(`m-phone`).value,o.cuit=document.getElementById(`m-cuit`).value,o.cbu=document.getElementById(`m-cbu`).value,o.listOfProducts=t?t.listOfProducts:[]):e===`comisionistas`&&(o.name=document.getElementById(`m-name`).value,o.phone=document.getElementById(`m-phone`).value,o.percent=Number(document.getElementById(`m-percent`).value));i.innerHTML=``;let s=`save${vn(_n(e))}`;r&&r[s]&&r[s](o)})}var xn=class{constructor(e={}){this.id=e.id||Date.now(),this.name=e.name||``,this.dni=e.dni||``,this.license=e.license||``}},Sn=class{constructor(e={}){this.id=e.id||Date.now(),this.name=e.name||``,this.licensePlate=e.licensePlate||``,this.vtvExpiration=e.vtvExpiration||``,this.senasaExpiration=e.senasaExpiration||``,this.type=e.type||`SIMPLE`}},Cn=class{constructor(e={}){this.id=e.id||Date.now(),this.name=e.name||``,this.licensePlate=e.licensePlate||``,this.vtvExpiration=e.vtvExpiration||``,this.insuranceExpiration=e.insuranceExpiration||``,this.driverId=e.driverId||null,this.trailerId=e.trailerId||null,e.driver?typeof e.driver==`object`?(this.driver=new xn(e.driver),this.driverId=this.driverId||this.driver.id):(this.driver=null,this.driverId=this.driverId||e.driver):this.driver=null,e.trailer?typeof e.trailer==`object`?(this.trailer=new Sn(e.trailer),this.trailerId=this.trailerId||this.trailer.id):(this.trailer=null,this.trailerId=this.trailerId||e.trailer):this.trailer=null,this.isFreightPaid=e.isFreightPaid||!1,this.updatedAt=e.updatedAt||Date.now(),this.isDirty=e.isDirty!==void 0&&e.isDirty,this.isDeleted=e.isDeleted||!1}},wn=class{constructor(e={}){this.id=e.id||Date.now(),this.travelId=e.travelId||0,this.description=e.description||``,this.amount=e.amount||0,this.category=e.category||``,this.date=e.date||new Date().toISOString().split(`T`)[0],this.isReimbursable=e.isReimbursable===void 0||e.isReimbursable}},Tn=class{constructor(e={}){this.id=e.id||Date.now(),this.status=e.status||`DRAFT`,this.truck=e.truck?new Cn(e.truck):null,this.kmOnOrigin=e.kmOnOrigin||0,this.kmOnDestination=e.kmOnDestination||0,this.kmOnPump=e.kmOnPump||0,this.litersOnPump=e.litersOnPump||0,this.date=e.date||new Date().toISOString().split(`T`)[0],this.description=e.description||``,this.pricePerKm=e.pricePerKm||0,this.driverPricePerKmSimple=e.driverPricePerKmSimple||0,this.driverPricePerKmDouble=e.driverPricePerKmDouble||0,this.fuelPrice=e.fuelPrice||0,this.simulationFreightPriceSimple=e.simulationFreightPriceSimple||0,this.simulationFreightPriceDouble=e.simulationFreightPriceDouble||0,this.buy=e.buy||null,this.kgFaenaTotal=e.kgFaenaTotal||0,this.coefImposturesSobreLaVenta=e.coefImposturesSobreLaVenta||1,this.yieldCorrectionKg=e.yieldCorrectionKg||0,this.yieldCorrectionAmount=e.yieldCorrectionAmount||0,this.expenses=(e.expenses||[]).map(e=>new wn(e)),this.updatedAt=e.updatedAt||Date.now(),this.isDirty=e.isDirty!==void 0&&e.isDirty}get distanceKm(){return Math.max(0,this.kmOnDestination-this.kmOnOrigin)}get driverCost(){if(!this.truck||!this.truck.trailer)return 0;let e=this.truck.trailer.type===`DOUBLE`?this.driverPricePerKmDouble:this.driverPricePerKmSimple;return this.distanceKm*e}get fuelCost(){return this.litersOnPump*this.fuelPrice}calculateFuelEfficiency(e){if(this.litersOnPump<=0)return 0;let t=this.kmOnPump-e;return t>0?t/this.litersOnPump:0}},En=class{constructor(e={}){this.id=e.id||Date.now(),this.name=e.name||``,this.phone=e.phone||``,this.cuit=e.cuit||``,this.cbu=e.cbu||``,this.listOfProducts=e.listOfProducts||[],this.usageCount=e.usageCount||0}},Dn=class{constructor(e={}){this.id=e.id||Date.now(),this.name=e.name||``,this.phone=e.phone||``,this.percent=Number(e.percent)||0}},On=class{execute(e,t,n,r){if(!t)return{travels:[],totalDriverCost:0,totalExpenses:0,grandTotal:0};let i=e.map(e=>e instanceof Tn?e:new Tn(e)).filter(e=>e.truck&&e.truck.driver&&String(e.truck.driver.id)===String(t)&&e.status!==`DRAFT`&&e.date>=n&&e.date<=r);i.sort((e,t)=>new Date(e.date)-new Date(t.date));let a=0,o=0;return{travels:i.map(e=>{let t=e.driverCost||0;a+=t;let n=(e.expenses||[]).filter(e=>e.isReimbursable),r=n.reduce((e,t)=>e+Number(t.amount),0);return o+=r,{id:e.id,date:e.date,description:e.description||`-`,trailerType:e.truck?.trailer?.type||`-`,distanceKm:e.distanceKm,travelCost:t,reimbursableExpenses:n.map(e=>({description:e.description,amount:e.amount})),expTotal:r}}),totalDriverCost:a,totalExpenses:o,grandTotal:a+o}}};function kn(e,t,n){let r=document.getElementById(`content`);if(!r)return;let i=new Date,a=i.getDate()-i.getDay(),o=a+6,s=new Date(new Date(i).setDate(a)).toISOString().split(`T`)[0],c=new Date(new Date(i).setDate(o)).toISOString().split(`T`)[0];r.innerHTML=`
    <div class="dashboard-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>Liquidación de Choferes</h2>
        <p style="color: var(--text-muted); margin: 0.25rem 0 0 0;">Liquidación semanal de honorarios y reembolsos de gastos de viaje.</p>
      </div>
      <button id="btn-print-liq" class="btn-secondary" style="display:none; padding: 0.85rem 1.75rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; height: 48px;">
        🖨️ Imprimir Liquidación
      </button>
    </div>

    <div class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem; border-radius: 16px;">
      <form id="filter-form" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
        <div class="form-group" style="margin: 0; flex: 2; min-width: 220px;">
          <label style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">Seleccionar Chofer</label>
          <select id="f-driver" required style="width:100%; border-radius: 12px;">
            <option value="">-- Seleccionar Chofer --</option>
            ${n.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)}
          </select>
        </div>
        <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
          <label style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">Desde (Domingo)</label>
          <input type="date" id="f-start" value="${s}" required style="width:100%; border-radius: 12px;">
        </div>
        <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
          <label style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">Hasta (Sábado)</label>
          <input type="date" id="f-end" value="${c}" required style="width:100%; border-radius: 12px;">
        </div>
        <button type="submit" class="btn-primary" style="padding: 0.85rem 2rem; border-radius: 12px; font-weight: 700; height: 48px;">
          🚀 Calcular
        </button>
      </form>
    </div>

    <div id="liquidation-results" style="animation: fadeIn 0.4s ease-out;">
      <div style="text-align: center; color: var(--text-muted); padding: 3rem; background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border);">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 1rem; opacity: 0.7;">📋</span>
        Seleccioná un chofer y presioná Calcular para ver el desglose semanal.
      </div>
    </div>
  `,document.getElementById(`filter-form`).addEventListener(`submit`,e=>{e.preventDefault();let r=document.getElementById(`f-driver`).value,i=document.getElementById(`f-start`).value,a=document.getElementById(`f-end`).value;l(new On().execute(t,r,i,a),r,n.find(e=>String(e.id)===r))});function l(e,t,n){let r=document.getElementById(`liquidation-results`),i=document.getElementById(`btn-print-liq`);if(e.travels.length===0){i.style.display=`none`,r.innerHTML=`
        <div class="alert" style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.25rem;">⚠️</span>
          No se encontraron viajes activos/completados para el chofer seleccionado en el período indicado.
        </div>`;return}i.style.display=`flex`;let a=e.travels.map(e=>{let t=e.reimbursableExpenses.map(e=>`<div style="font-size: 0.75rem; color: var(--text-muted); padding-top: 0.25rem;">• ${e.description}: <strong>$${e.amount.toLocaleString()}</strong></div>`).join(``);return`
        <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;">
          <td style="padding: 1rem; font-weight: 500;">${e.date}</td>
          <td style="padding: 1rem;">${e.description}</td>
          <td style="padding: 1rem; font-size: 0.85rem;"><span style="background: rgba(99,102,241,0.1); color: #818cf8; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600;">${e.trailerType}</span></td>
          <td style="padding: 1rem; font-weight: 600; color: var(--primary);">${e.distanceKm} km</td>
          <td style="padding: 1rem; font-weight: 700; color: var(--text-main);">$${e.travelCost.toLocaleString()}</td>
          <td style="padding: 1rem;">
            ${e.expTotal>0?`<span style="font-weight: 700; color: var(--success);">$${e.expTotal.toLocaleString()}</span>${t}`:`-`}
          </td>
        </tr>
      `}).join(``);r.innerHTML=`
      <div class="glass-card" style="padding: 2rem; border-radius: 16px;" id="print-area">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.4rem;">Resumen de Liquidación: ${n?.name}</h3>
            <p style="color: var(--text-muted); margin: 0.25rem 0 0 0; font-size: 0.9rem;">
              Periodo Liquidado: <strong>${document.getElementById(`f-start`).value}</strong> al <strong>${document.getElementById(`f-end`).value}</strong>
            </p>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 8px;">
            CUIT Chofer: ${n?.dni||`N/A`}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
          <div style="background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Honorarios de Viajes</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary); margin-top: 0.25rem;">$${e.totalDriverCost.toLocaleString()}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Reembolsos de Gastos</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--success); margin-top: 0.25rem;">$${e.totalExpenses.toLocaleString()}</div>
          </div>
          <div style="background: var(--primary-container); color: var(--on-primary-container); border: 1px solid var(--border); padding: 1.25rem; border-radius: 12px;">
            <div style="font-size: 0.75rem; opacity: 0.85; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Total Neto a Liquidar</div>
            <div style="font-size: 1.8rem; font-weight: 800; margin-top: 0.25rem;">$${e.grandTotal.toLocaleString()}</div>
          </div>
        </div>

        <h4 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">📋 Detalle de Viajes Realizados</h4>
        <div class="table-responsive" style="border-radius: 12px; overflow: hidden; border: 1px solid var(--border);">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: rgba(255,255,255,0.02); text-align: left; border-bottom: 1px solid var(--border);">
                <th style="padding: 1rem;">Fecha</th>
                <th style="padding: 1rem;">Descripción</th>
                <th style="padding: 1rem;">Jaula</th>
                <th style="padding: 1rem;">Distancia</th>
                <th style="padding: 1rem;">Honorarios</th>
                <th style="padding: 1rem;">Gastos Reembolsables</th>
              </tr>
            </thead>
            <tbody>
              ${a}
            </tbody>
          </table>
        </div>
      </div>
    `,i.onclick=()=>{document.getElementById(`print-area`).innerHTML;let t=window.open(``,`_blank`);t.document.write(`
        <html>
          <head>
            <title>Liquidación de Viajes - ${n?.name}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 3rem; color: #1f2937; }
              h3 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #111827; }
              p { color: #4b5563; font-size: 0.95rem; margin: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 2rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
              th { background: #f3f4f6; color: #374151; font-weight: 700; text-align: left; padding: 1rem; border-bottom: 2px solid #e5e7eb; font-size: 0.85rem; text-transform: uppercase; }
              td { padding: 1rem; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; color: #374151; }
              .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 1.5rem; margin-bottom: 2.5rem; }
              .card { border: 1px solid #e5e7eb; padding: 1.25rem; border-radius: 12px; background: #fafafa; }
              .card-title { font-size: 0.75rem; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
              .card-val { font-size: 1.6rem; font-weight: 800; color: #111827; margin-top: 0.25rem; }
              .card-primary { background: #1e1b4b; color: #ffffff; border: none; }
              .card-primary .card-title { color: rgba(255,255,255,0.85); }
              .card-primary .card-val { color: #ffffff; }
              .badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.8rem; }
              .print-header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 2.5rem; }
              .print-header h2 { margin: 0; font-size: 1.8rem; color: #111827; }
              .print-header p { font-size: 0.9rem; color: #6b7280; margin-top: 0.25rem; }
              .signature-section { display: flex; justify-content: space-between; margin-top: 4rem; padding-top: 3rem; }
              .sig-line { width: 220px; border-top: 1px solid #9ca3af; text-align: center; padding-top: 0.5rem; font-size: 0.85rem; color: #4b5563; }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h2>Liquidación de Viajes KMP</h2>
              <p>Comprobante oficial de honorarios y reembolsos de chofer</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
              <div>
                <h3>Resumen de Liquidación: ${n?.name}</h3>
                <p>Periodo Liquidado: <strong>${document.getElementById(`f-start`).value}</strong> al <strong>${document.getElementById(`f-end`).value}</strong></p>
              </div>
              <div style="font-size: 0.85rem; color: #4b5563; background: #fafafa; border: 1px solid #e5e7eb; padding: 0.5rem 1rem; border-radius: 8px;">
                CUIT Chofer: ${n?.dni||`N/A`}
              </div>
            </div>

            <div class="summary-grid">
              <div class="card">
                <div class="card-title">Honorarios de Viajes</div>
                <div class="card-val">$${e.totalDriverCost.toLocaleString()}</div>
              </div>
              <div class="card">
                <div class="card-title">Reembolsos de Gastos</div>
                <div class="card-val">$${e.totalExpenses.toLocaleString()}</div>
              </div>
              <div class="card card-primary">
                <div class="card-title">Total Neto a Liquidar</div>
                <div class="card-val">$${e.grandTotal.toLocaleString()}</div>
              </div>
            </div>

            <h4 style="margin-top: 0; margin-bottom: 0.5rem; font-size: 1.1rem; color: #111827;">Detalle de Viajes Realizados</h4>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Jaula</th>
                  <th>Distancia</th>
                  <th>Honorarios</th>
                  <th>Gastos Reembolsables</th>
                </tr>
              </thead>
              <tbody>
                ${e.travels.map(e=>{let t=e.reimbursableExpenses.map(e=>`<div style="font-size: 0.75rem; color: #4b5563; padding-top: 0.25rem;">• ${e.description}: <strong>$${e.amount.toLocaleString()}</strong></div>`).join(``);return`
                    <tr>
                      <td style="font-weight: 500;">${e.date}</td>
                      <td>${e.description}</td>
                      <td><span class="badge">${e.trailerType}</span></td>
                      <td style="font-weight: 600; color: #4f46e5;">${e.distanceKm} km</td>
                      <td style="font-weight: 700; color: #111827;">$${e.travelCost.toLocaleString()}</td>
                      <td>
                        ${e.expTotal>0?`<span style="font-weight: 700; color: #16a34a;">$${e.expTotal.toLocaleString()}</span>${t}`:`-`}
                      </td>
                    </tr>
                  `}).join(``)}
              </tbody>
            </table>

            <div class="signature-section">
              <div class="sig-line">Firma del Chofer</div>
              <div class="sig-line">Autorizado por Administración</div>
            </div>

            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            <\/script>
          </body>
        </html>
      `),t.document.close()}}}var An=class{execute(e,t){if(!t)return{records:[],labels:[],efficiencyData:[],averageEfficiency:0};let n=e.map(e=>e instanceof Tn?e:new Tn(e)).filter(e=>e.truck&&String(e.truck.id)===String(t)&&e.status!==`DRAFT`&&e.litersOnPump>0);n.sort((e,t)=>e.kmOnPump-t.kmOnPump);let r=[],i=[],a=[],o=0,s=0;for(let e=0;e<n.length;e++){let t=n[e],c=e>0?n[e-1]:null,l=0,u=0;c&&(l=t.kmOnPump-c.kmOnPump,u=t.calculateFuelEfficiency(c.kmOnPump));let d=u>=2.5&&u<=3.5,f=u>0&&u<2.5,p=u>3.5,m=`NONE`,h=``;u>0&&(d?m=`NORMAL`:f?(m=`LOW`,h=`Consumo Elevado / Desvío`):p&&(m=`ANOMALY`,h=`Mal Cálculo / Falta Registro`));let g=c!==null&&u>0;g&&d&&(i.push(t.date),a.push(u.toFixed(2)),o+=u,s++),r.push({date:t.date,description:t.description||`-`,kmOnOrigin:t.kmOnOrigin,kmOnDestination:t.kmOnDestination,kmOnPump:t.kmOnPump,litersOnPump:t.litersOnPump,kmDiff:l>0?l:0,efficiency:u,status:m,alertMessage:h,hasReference:g})}return{records:r,labels:i,efficiencyData:a,averageEfficiency:s>0?Number((o/s).toFixed(2)):0}}},jn=null;function Mn(e,t,n,r=``){return`
    <div class="stat-card" style="background: ${r||`rgba(255,255,255,0.03)`}; border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
      <div class="stat-icon" style="font-size: 2rem; opacity: 0.85;">${n}</div>
      <div class="stat-info">
        <p style="margin: 0; color: var(--text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${e}</p>
        <h3 style="margin: 0.25rem 0 0 0; font-size: 1.5rem; font-weight: 700;">${t}</h3>
      </div>
    </div>
  `}function Nn(e,t,n){let r=document.getElementById(`content`);r&&(r.innerHTML=`
    <div class="dashboard-header" style="margin-bottom: 2rem;">
      <h2>Control de Rendimiento de Combustible</h2>
      <p style="color: var(--text-muted); margin: 0.25rem 0 0 0;">Análisis del consumo en surtidor y detección de anomalías de consumo.</p>
    </div>

    <div class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem; border-radius: 16px;">
      <form id="fuel-filter-form" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
        <div class="form-group" style="margin: 0; flex: 1; min-width: 250px;">
          <label style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">Camión de la Flota</label>
          <select id="f-truck" required style="width: 100%; border-radius: 12px;">
            <option value="">-- Seleccionar Camión --</option>
            ${n.map(e=>`<option value="${e.id}">${e.name} (${e.licensePlate})</option>`).join(``)}
          </select>
        </div>
        <button type="submit" class="btn-primary" style="padding: 0.85rem 2rem; border-radius: 12px; font-weight: 700; height: 48px; display: flex; align-items: center; gap: 0.5rem;">
          🔍 Analizar Eficiencia
        </button>
      </form>
    </div>

    <div id="fuel-results" style="display: none; animation: fadeIn 0.4s ease-out;">
      <!-- KPI GRID -->
      <div id="fuel-kpis-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;"></div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem; align-items: start;" class="responsive-grid-1">
        <!-- CHART -->
        <div class="glass-card" style="padding: 1.5rem; border-radius: 16px; min-height: 320px;">
          <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">📈 Historial de Consumo <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(Km/L)</span></h3>
          <div style="position: relative; height: 260px;">
            <canvas id="fuelChart"></canvas>
          </div>
        </div>

        <!-- SIMULATION OR INSIGHTS -->
        <div class="glass-card" style="padding: 1.5rem; border-radius: 16px; height: 100%; min-height: 320px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 style="margin-top: 0; margin-bottom: 1.25rem; font-size: 1.1rem; color: var(--text-main);">💡 Insights de Flota</h3>
            <div id="fuel-insights-content" style="font-size: 0.9rem; line-height: 1.5; color: var(--text-muted);">
              <!-- Contenido dinámico -->
            </div>
          </div>
          <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 1rem; margin-top: 1rem; display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem;">🔋</span>
            <div style="font-size: 0.8rem; color: var(--success); font-weight: 500;">El mantenimiento preventivo periódico de inyectores puede ahorrar hasta un 8% de gasoil.</div>
          </div>
        </div>
      </div>

      <!-- DETAILS TABLE -->
      <div class="glass-card" style="padding: 1.5rem; border-radius: 16px; overflow: hidden;">
        <h3 style="margin-top: 0; margin-bottom: 1.25rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">📋 Registro Detallado de Cargas</h3>
        <div class="table-responsive">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: rgba(255,255,255,0.02); text-align: left; border-bottom: 1px solid var(--border);">
                <th style="padding: 1rem;">Fecha</th>
                <th style="padding: 1rem;">Viaje / Destino</th>
                <th style="padding: 1rem; text-align: right;">Km Surtidor</th>
                <th style="padding: 1rem; text-align: right;">Litros Cargados</th>
                <th style="padding: 1rem; text-align: right;">Km Recorridos</th>
                <th style="padding: 1rem; text-align: right;">Rendimiento</th>
                <th style="padding: 1rem; text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody id="fuel-table-body">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`fuel-filter-form`).addEventListener(`submit`,e=>{e.preventDefault();let n=document.getElementById(`f-truck`).value,r=new An().execute(t,n),i=document.getElementById(`fuel-table-body`);i.innerHTML=``;let a=r.records.filter(e=>e.status===`LOW`||e.status===`ANOMALY`).length,o=r.records.reduce((e,t)=>e+t.kmDiff,0),s=r.records.reduce((e,t)=>e+t.litersOnPump,0),c=document.getElementById(`fuel-kpis-grid`);c.innerHTML=`
      ${Mn(`Eficiencia Promedio`,`${r.averageEfficiency.toFixed(2)} Km/L`,`⛽`,`rgba(16, 185, 129, 0.04)`)}
      ${Mn(`Kms Totales Controlados`,`${o.toLocaleString()} km`,`🛣️`)}
      ${Mn(`Combustible Cargado`,`${s.toLocaleString()} L`,`🛢️`)}
      ${Mn(`Alertas de Consumo / Datos`,`${a}`,`⚠️`,a>0?`rgba(239, 68, 68, 0.04)`:``)}
    `,r.records.length===0?i.innerHTML=`<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">No hay registros de combustible para este camión.</td></tr>`:r.records.forEach(e=>{let t=e.efficiency>0?`${e.efficiency.toFixed(2)} Km/L`:`-`,n=`-`,r=`var(--text-main)`;e.efficiency>0&&(e.status===`NORMAL`?n=`<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem;">Normal</span>`:e.status===`LOW`?(n=`<span class="badge" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem; cursor: help;" title="${e.alertMessage}">Consumo Alto</span>`,r=`#f59e0b`):e.status===`ANOMALY`&&(n=`<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem; cursor: help;" title="${e.alertMessage}">Registro / Cálculo</span>`,r=`#ef4444`)),i.innerHTML+=`
          <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;">
            <td style="padding: 1rem; font-weight: 500;">${e.date}</td>
            <td style="padding: 1rem; color: var(--text-muted); font-size: 0.85rem;">${e.description}</td>
            <td style="padding: 1rem; text-align: right; font-weight: 600;">${e.kmOnPump.toLocaleString()}</td>
            <td style="padding: 1rem; text-align: right; color: var(--text-muted);">${e.litersOnPump.toLocaleString()} L</td>
            <td style="padding: 1rem; text-align: right; color: var(--primary); font-weight: 600;">${e.kmDiff>0?`${e.kmDiff.toLocaleString()} km`:`-`}</td>
            <td style="padding: 1rem; text-align: right; font-weight: 700; color: ${r};">${t}</td>
            <td style="padding: 1rem; text-align: center;">${n}</td>
          </tr>
        `});let l=document.getElementById(`fuel-insights-content`);if(r.records.length<=1)l.innerHTML=`<p>Se requieren al menos dos registros con carga de combustible completa para calcular estadísticas e insights predictivos.</p>`;else{let e=``;e=r.averageEfficiency>=2.5&&r.averageEfficiency<=3.5?`<p>🟢 El rendimiento promedio de <strong>${r.averageEfficiency} Km/L</strong> está dentro del rango óptimo y normal establecido de <strong>2.5 a 3.5 Km/L</strong>.</p>`:r.averageEfficiency<2.5?`<p>🟡 El rendimiento promedio general de <strong>${r.averageEfficiency} Km/L</strong> se encuentra por debajo de la media normal. Se sugiere auditoría de inyectores o control de peso de carga.</p>`:`<p>🔴 Alerta de inconsistencia: El promedio calculado de <strong>${r.averageEfficiency} Km/L</strong> está por encima del rango normal. Esto sugiere un registro erróneo o falta de una carga previa en el historial.</p>`,a>0?e+=`<p>⚠️ Se detectaron <strong>${a}</strong> cargas fuera del rango normal (2.5 - 3.5 Km/L), marcadas como consumo elevado o registros/cálculos anómalos.</p>`:e+=`<p>✅ Historial de rendimiento sumamente estable y 100% dentro del rango normal.</p>`,l.innerHTML=e}document.getElementById(`fuel-results`).style.display=`block`;let u=document.getElementById(`fuelChart`);if(u){let e=u.getContext(`2d`);jn&&jn.destroy();let t=document.body.classList.contains(`dark`),n=t?`rgba(255, 255, 255, 0.08)`:`rgba(0, 0, 0, 0.06)`,i=t?`#ffffff`:`#71717a`,a=r.records.filter(e=>e.hasReference&&e.status===`NORMAL`).map(()=>`#10b981`);jn=new ee(e,{type:`line`,data:{labels:r.labels,datasets:[{label:`Rendimiento (Km/L)`,data:r.efficiencyData,borderColor:`#10b981`,backgroundColor:`rgba(16, 185, 129, 0.04)`,borderWidth:3,tension:.35,fill:!0,pointBackgroundColor:a,pointBorderColor:t?`#18181b`:`#ffffff`,pointBorderWidth:2,pointRadius:5,pointHoverRadius:7},{label:`Límite Mín (2.5)`,data:Array(r.labels.length).fill(2.5),borderColor:`rgba(245, 158, 11, 0.5)`,borderWidth:1.5,borderDash:[6,4],fill:!1,pointRadius:0,pointHoverRadius:0},{label:`Límite Máx (3.5)`,data:Array(r.labels.length).fill(3.5),borderColor:`rgba(239, 68, 68, 0.5)`,borderWidth:1.5,borderDash:[6,4],fill:!1,pointRadius:0,pointHoverRadius:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,labels:{color:i,font:{size:10}}},title:{display:!0,text:`Rendimiento Histórico vs Umbrales Normativos (2.5 - 3.5 Km/L)`,color:i,font:{size:13,weight:`bold`}}},scales:{x:{grid:{color:n},ticks:{color:i,font:{size:10}}},y:{beginAtZero:!0,grid:{color:n},ticks:{color:i,font:{size:10}}}}}})}}))}function Pn(e,t={}){if(!e.checkOutTime)return{workedHours:0,totalPayment:0,isOvertime:!1};let n=e.checkOutTime-e.checkInTime,r=Math.max(0,n/(1e3*3600)),i=e.hourlyRate!==void 0&&e.hourlyRate!==null?e.hourlyRate:t.hourlyRate||0;if(t.paymentType===`FIXED_DAILY`){let n=new Date(e.checkInTime),a=`${String(n.getHours()).padStart(2,`0`)}:${String(n.getMinutes()).padStart(2,`0`)}`>=(t.fixedDailyDepartureTime||`17:00`),o=a?r*i:t.dailyFixedRate||0;return{workedHours:r,totalPayment:Math.round(o*100)/100,isOvertime:a}}else return{workedHours:r,totalPayment:Math.round(r*i*100)/100,isOvertime:!1}}async function Fn(e,t,n){return In(t,n)}async function In(e,t){try{return(await I.employee_time_logs.where(`establishmentId`).equals(e).and(e=>e.employeeId===t).toArray()).map(e=>({...e,status:e.status||`UNPAID`})).sort((e,t)=>(t.checkInTime||0)-(e.checkInTime||0))}catch(e){return console.error(`Error leyendo localDb.employee_time_logs:`,e),[]}}async function Ln(e,t,n){if(!t||t.length===0)return;let r=Date.now(),i={status:`PAID`,paidAt:r,salaryPaymentEntryId:n,updatedAt:r};if(e)try{let n=x(e);t.forEach(t=>{let r=C(e,`employee_time_logs`,t);n.update(r,i)}),await n.commit()}catch(e){console.warn(`[TimeLogApi] Error actualizando Firestore para logs pagados:`,e)}try{for(let e of t){let t=await I.employee_time_logs.get(e);t?await I.employee_time_logs.put({...t,...i}):await I.employee_time_logs.put({id:e,...i})}}catch(e){console.warn(`Error actualizando IndexedDB para time logs:`,e)}}async function Rn(e,t,n,r){await l(C(e,`establishments`,t,`employees`,n),{...r,updatedAt:Date.now()})}var zn=[`Domingo`,`Lunes`,`Martes`,`Miércoles`,`Jueves`,`Viernes`,`Sábado`];function Bn(e){let t=new Date,n=(t.getDay()+1)%7,r=new Date(t);return r.setDate(t.getDate()-n),r.setHours(0,0,0,0),e>=r.getTime()}function Vn(e,{establishment:t,employee:n,timeLogs:r=[],onSaveRates:i,onNavigateToSalaryPayment:a,onBack:o}){e.innerHTML=``;let s=K(`div`,{classes:[`employee-timelog-wrapper`,`fade-in`],style:`width: 100%; padding-bottom: 3rem;`}),c=K(`div`,{classes:[`dashboard-header`],style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;`}),l=K(`div`,{style:`display: flex; align-items: center; gap: 1rem;`}),u=K(`button`,{classes:[`back-btn-m3`],html:`<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>`,attrs:{title:`Volver a Personal de ${t.name}`}});u.onclick=()=>{typeof o==`function`&&o()},l.appendChild(u),l.appendChild(K(`div`,{html:`<h1 style="margin:0; font-size: 1.5rem;">⏱️ Asistencia y Liquidación: ${n.name}</h1>
           <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Sucursal: ${t.name} • DNI: ${n.dni||`-`} • Puesto: ${n.position||`Operario`}</div>`})),c.appendChild(l);let d=K(`div`,{html:`<span style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-weight: 700; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">
             Esquema: ${n.paymentType===`FIXED_DAILY`?`Jornada Fija (${q(n.dailyFixedRate||0)})`:`Por Hora (${q(n.hourlyRate||0)}/h)`}
           </span>`});c.appendChild(d),s.appendChild(c);let f=K(`div`,{classes:[`glass-card`],style:`padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;`});f.innerHTML=`
    <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.05rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
      ⚙️ Tarifas y Modalidad de Pago del Empleado
    </h3>
    
    <form id="rates-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end;">
      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Modalidad de Pago</label>
        <select id="payment-type-select" name="paymentType" style="width: 100%; padding: 0.6rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 600;">
          <option value="HOURLY" ${n.paymentType===`HOURLY`?`selected`:``}>Por Hora Trabajada</option>

          <option value="FIXED_DAILY" ${n.paymentType===`FIXED_DAILY`?`selected`:``}>Jornada Fija por Día</option>
        </select>
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Tarifa por Hora ($/h)</label>
        <input type="number" step="0.01" name="hourlyRate" value="${n.hourlyRate||``}" placeholder="0.00" style="width: 100%; padding: 0.6rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 700;">
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Tarifa Jornada Fija ($/día)</label>
        <input type="number" step="0.01" name="dailyFixedRate" value="${n.dailyFixedRate||``}" placeholder="0.00" style="width: 100%; padding: 0.6rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 700;">
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Horario Salida Fija (HH:mm)</label>
        <input type="text" name="fixedDailyDepartureTime" value="${n.fixedDailyDepartureTime||`17:00`}" placeholder="17:00" style="width: 100%; padding: 0.6rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 600;">
      </div>

      <div>
        <button type="submit" class="btn-primary" style="width: 100%; padding: 0.65rem; border-radius: 8px; font-weight: 700; background: linear-gradient(135deg, #6366f1, #4f46e5);">
          💾 Actualizar Tarifas
        </button>
      </div>
    </form>
  `,s.appendChild(f);let p=f.querySelector(`#rates-form`);p.onsubmit=async e=>{e.preventDefault();let t=new FormData(p),n={paymentType:t.get(`paymentType`),hourlyRate:parseFloat(t.get(`hourlyRate`))||0,dailyFixedRate:parseFloat(t.get(`dailyFixedRate`))||0,fixedDailyDepartureTime:t.get(`fixedDailyDepartureTime`)||`17:00`};typeof i==`function`&&await i(n)};let m=K(`div`,{style:`display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;`}),h=K(`div`,{classes:[`glass-card`],style:`padding: 1.25rem; border-left: 4px solid #3b82f6;`});h.innerHTML=`<div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Horas Seleccionadas</div><div id="stat-hours" style="font-size: 1.5rem; font-weight: 800; color: #60a5fa;">0.0 hs</div>`;let g=K(`div`,{classes:[`glass-card`],style:`padding: 1.25rem; border-left: 4px solid #8b5cf6;`});g.innerHTML=`<div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Días Seleccionados</div><div id="stat-days" style="font-size: 1.5rem; font-weight: 800; color: #a78bfa;">0 días</div>`;let _=K(`div`,{classes:[`glass-card`],style:`padding: 1rem 1.25rem; border-left: 4px solid #10b981; display: flex; flex-direction: column; justify-content: space-between;`});_.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Total a Liquidar</span>
      <select id="round-mode-select" style="font-size: 0.75rem; padding: 0.15rem 0.4rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: #60a5fa; font-weight: 600;">
        <option value="exact">Exacto (2 dec)</option>
        <option value="500">Múltiplo $ 500</option>
        <option value="1000">Múltiplo $ 1.000</option>
      </select>
    </div>
    <div id="stat-amount" style="font-size: 1.5rem; font-weight: 800; color: #10b981;">$ 0,00</div>
  `;let v=K(`div`,{classes:[`glass-card`],style:`padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: center;`});v.innerHTML=`
    <div style="display: flex; flex-direction: column; gap: 0.4rem; width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">
        <span>Caja de Destino:</span>
        <select id="target-caja-select" style="padding: 0.2rem 0.5rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: #60a5fa; font-weight: 700; font-size: 0.8rem;">
          <option value="accounting">🏛️ Caja General</option>
          <option value="frigorifico">🥩 Caja Frigorífico</option>
        </select>
      </div>
      <button type="button" id="pay-btn" class="btn-primary" style="width: 100%; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.9rem; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); border: none; box-shadow: 0 4px 15px rgba(16,185,129,0.3); cursor: pointer;">
        <span id="pay-btn-label">💳 Liquidar en Caja ($ 0,00)</span>
      </button>
    </div>
  `;let y=v.querySelector(`#pay-btn`),b=v.querySelector(`#target-caja-select`);m.appendChild(h),m.appendChild(g),m.appendChild(_),m.appendChild(v),s.appendChild(m);let x=K(`div`,{classes:[`glass-card`],style:`padding: 1.5rem;`});x.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
      <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary);">📋 Desglose de Fichadas y Asistencia</h3>
      <div style="font-size: 0.8rem; color: var(--text-muted);">
        <span>💡 Semana actual pre-seleccionada • Semanas anteriores impagas desmarcadas</span>
      </div>
    </div>
  `;let S=K(`div`,{style:`background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; overflow-x: auto;`}),C=K(`table`,{style:`width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 750px;`});C.innerHTML=`
    <thead>
      <tr style="background: rgba(255,255,255,0.05); text-align: left; border-bottom: 1px solid var(--border);">
        <th style="padding: 0.75rem 1rem; text-align: center; width: 50px;">Cobrar</th>
        <th style="padding: 0.75rem 1rem;">Día y Fecha</th>
        <th style="padding: 0.75rem 1rem;">Horario (Entrada / Salida)</th>
        <th style="padding: 0.75rem 1rem; text-align: center;">Horas Trab.</th>
        <th style="padding: 0.75rem 1rem;">Modalidad / Categoría</th>
        <th style="padding: 0.75rem 1rem; text-align: right;">Subtotal ($)</th>
        <th style="padding: 0.75rem 1rem; text-align: center;">Estado</th>
      </tr>
    </thead>
  `;let w=K(`tbody`);r.length===0?w.innerHTML=`<tr><td colspan="7" style="padding: 3rem; text-align: center; color: var(--text-muted);">
      <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Sin registros de fichadas</div>
      <div style="font-size: 0.85rem;">No se encontraron marcaciones registradas para este empleado.</div>
    </td></tr>`:r.forEach(e=>{let t=e.status===`PAID`,r=Bn(e.checkInTime),{workedHours:i,totalPayment:a,isOvertime:o}=Pn(e,n),s=K(`tr`,{style:`border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s; ${t?`background: rgba(16, 185, 129, 0.05);`:``}`}),c=`${zn[new Date(e.checkInTime).getDay()]} ${yt(e.checkInTime)}`,l=bt(e.checkInTime),u=e.checkOutTime?bt(e.checkOutTime):`Trabajando...`,d=!t&&r,f=t&&e.totalPayment||a;s.innerHTML=`
        <td style="padding: 0.6rem 1rem; text-align: center;">
          <input type="checkbox" class="log-chk" data-id="${e.id}" data-date="${e.checkInTime}" data-hours="${i}" data-payment="${f}" 
                 ${t?`disabled`:d?`checked`:``}>
        </td>

        <td style="padding: 0.6rem 1rem; font-weight: 600;">
          ${c}
        </td>
        <td style="padding: 0.6rem 1rem; color: var(--text-main);">
          ${l} → ${u}
        </td>
        <td style="padding: 0.6rem 1rem; text-align: center; font-weight: 700; color: #60a5fa;">
          ${i.toFixed(1)} hs
        </td>
        <td style="padding: 0.6rem 1rem;">
          ${o?`<span style="color: #f59e0b; font-weight: 700; font-size: 0.8rem;">⚡ Horas Extras</span>`:`<span style="color: var(--text-muted); font-size: 0.8rem;">${n.paymentType===`FIXED_DAILY`?`Jornada Fija`:`Por Hora`}</span>`}
        </td>
        <td style="padding: 0.6rem 1rem; text-align: right; font-weight: 700; color: #10b981; font-size: 0.95rem;">
          $ ${f.toLocaleString()}
        </td>
        <td style="padding: 0.6rem 1rem; text-align: center;">
          ${t?`<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem;">✅ Pagado</span>`:`<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem;">⏳ Pendiente</span>`}
        </td>
      `,w.appendChild(s)}),C.appendChild(w),S.appendChild(C),x.appendChild(S),s.appendChild(x),e.appendChild(s);let T=s.querySelector(`#stat-hours`),E=s.querySelector(`#stat-days`),D=s.querySelector(`#stat-amount`),O=s.querySelector(`#pay-btn-label`),k=s.querySelector(`#round-mode-select`),A=()=>{let e=0,t=0,n=0,r=[],i=[];s.querySelectorAll(`.log-chk:checked:not(:disabled)`).forEach(a=>{t++,e+=parseFloat(a.dataset.hours)||0,n+=parseFloat(a.dataset.payment)||0,r.push(a.dataset.id),a.dataset.date&&i.push(parseInt(a.dataset.date))});let a=k?k.value:`exact`,o=n;return o=a===`500`?Math.round(n/500)*500:a===`1000`?Math.round(n/1e3)*1e3:Math.round(n*100)/100,T.textContent=`${e.toFixed(1)} hs`,E.textContent=`${t} días`,D.textContent=q(o),O.textContent=`💳 Liquidar en Caja (${q(o)})`,y.disabled=t===0,y.style.opacity=t===0?`0.5`:`1`,y.style.cursor=t===0?`not-allowed`:`pointer`,{selectedLogIds:r,selectedTimestamps:i,totalHours:e,selectedDaysCount:t,totalAmount:o}};k&&k.addEventListener(`change`,A),s.querySelectorAll(`.log-chk`).forEach(e=>{e.addEventListener(`change`,A)}),A(),y.onclick=()=>{let e=A();if(e.selectedDaysCount===0){alert(`Por favor selecciona al menos un día de fichada impago para liquidar.`);return}let r=e.selectedTimestamps.sort((e,t)=>e-t),i=``;if(r.length===1)i=`${zn[new Date(r[0]).getDay()]} ${yt(r[0])}`;else if(r.length>1){let e=r[0],t=r[r.length-1],n=new Date(e),a=new Date(t),o=zn[n.getDay()],s=zn[a.getDay()];i=`Del ${o} ${yt(e)} al ${s} ${yt(t)}`}let o=`Pago Sueldo: ${n.name} (${e.selectedDaysCount} ${e.selectedDaysCount===1?`día`:`días`}, ${e.totalHours.toFixed(1)} hs${i?` - ${i}`:``})`,s=b.value||`accounting`;typeof a==`function`&&a({establishment:t,employee:n,selectedLogIds:e.selectedLogIds,totalAmount:e.totalAmount,periodSummary:o,targetCaja:s})}}function Hn(e,t){let{establishments:n=[],selectedEstablishment:r=null,employees:i=[],selectedEmployee:a=null,timeLogs:o=[]}=t.state||{};if(e.innerHTML=``,r&&a){Vn(e,{establishment:r,employee:a,timeLogs:o,onSaveRates:e=>t.updateEmployeeRates(e),onNavigateToSalaryPayment:e=>t.navigateToSalaryPayment(e),onBack:()=>t.clearSelectedEmployee()});return}let s=K(`div`,{classes:[`dashboard-header`],style:`display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;`}),c=K(`div`,{style:`display: flex; align-items: center; gap: 1rem;`});if(r){let e=K(`button`,{classes:[`back-btn-m3`],html:`<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>`,attrs:{title:`Volver a Sucursales`}});e.onclick=()=>t.clearSelection(),c.appendChild(e)}c.appendChild(K(`h1`,{text:r?`Personal: ${r.name}`:`Gestión de Sucursales`,style:`margin:0;`})),s.appendChild(c);let l=K(`button`,{classes:[`btn-nueva-operacion`],style:`margin: 0;`,html:`<svg viewBox="0 0 24 24" width="18" height="18" style="fill:currentColor;flex-shrink:0;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> ${r?`Nuevo Empleado`:`Nueva Sucursal`}`});l.onclick=()=>{r?Kn(null,t):Gn(null,t)},s.appendChild(l),e.appendChild(s);let u=K(`div`,{classes:[`glass-card`],style:`padding: 0;`});r?u.appendChild(Wn(i,t)):u.appendChild(Un(n,t)),e.appendChild(u)}function Un(e,t){let n=K(`table`,{style:`width: 100%; border-collapse: collapse;`}),r=K(`thead`,{html:`
    <tr style="background: rgba(255,255,255,0.05); text-align: left;">
      <th style="padding: 1rem;">Nombre de Sucursal</th>
      <th style="padding: 1rem;">Dirección</th>
      <th style="padding: 1rem; text-align: right;">Acciones</th>
    </tr>
  `});n.appendChild(r);let i=K(`tbody`);return e.length===0?i.innerHTML=`<tr><td colspan="3" style="padding: 3rem; text-align: center; color: var(--text-muted);">
      No hay sucursales registradas.
    </td></tr>`:e.forEach(e=>{let n=K(`tr`,{style:`border-top: 1px solid var(--border); transition: background 0.2s;`});n.innerHTML=`
        <td style="padding: 1rem; font-weight: 600;">${e.name}</td>
        <td style="padding: 1rem; color: var(--text-muted);">${e.address||`-`}</td>
        <td style="padding: 1rem; text-align: right; white-space: nowrap; display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button class="icon-btn manage-btn" title="Gestionar Empleados" style="color: var(--primary);">👥 Personal</button>
          <button class="icon-btn edit-btn" title="Editar">✏️</button>
          <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">🗑️</button>
        </td>
      `,n.querySelector(`.manage-btn`).onclick=()=>t.selectEstablishment(e),n.querySelector(`.edit-btn`).onclick=()=>Gn(e,t),n.querySelector(`.delete-btn`).onclick=()=>t.deleteEstablishment(e.id),i.appendChild(n)}),n.appendChild(i),n}function Wn(e,t){let n=K(`table`,{style:`width: 100%; border-collapse: collapse;`}),r=K(`thead`,{html:`
    <tr style="background: rgba(255,255,255,0.05); text-align: left;">
      <th style="padding: 1rem;">Nombre Completo</th>
      <th style="padding: 1rem;">DNI</th>
      <th style="padding: 1rem;">Puesto</th>
      <th style="padding: 1rem;">Contacto / Dirección</th>
      <th style="padding: 1rem; text-align: right;">Acciones</th>
    </tr>
  `});n.appendChild(r);let i=K(`tbody`);return e.length===0?i.innerHTML=`<tr><td colspan="5" style="padding: 3rem; text-align: center; color: var(--text-muted);">
      No hay empleados registrados en esta sucursal.
    </td></tr>`:e.forEach(e=>{let n=K(`tr`,{style:`border-top: 1px solid var(--border); transition: background 0.2s;`});n.innerHTML=`
        <td style="padding: 1rem; font-weight: 600;">${e.name}</td>
        <td style="padding: 1rem;">${e.dni||`-`}</td>
        <td style="padding: 1rem;">
          <span style="background: rgba(99,102,241,0.1); color: #818cf8; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">
            ${e.position||`Sin asignar`}
          </span>
        </td>
        <td style="padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">
          <div>${e.phone?`📞 ${e.phone}`:``}</div>
          <div>${e.address?`📍 ${e.address}`:``}</div>
        </td>
        <td style="padding: 1rem; text-align: right; white-space: nowrap;">
          <button class="btn-secondary timelog-btn" style="padding: 0.35rem 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-right: 0.5rem;" title="Ver asistencia, fichadas y liquidar sueldo">⏱️ Asistencia</button>
          <button class="icon-btn edit-btn" title="Editar">✏️</button>
          <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">🗑️</button>
        </td>
      `,n.querySelector(`.timelog-btn`).onclick=()=>t.selectEmployee(e),n.querySelector(`.edit-btn`).onclick=()=>Kn(e,t),n.querySelector(`.delete-btn`).onclick=()=>t.deleteEmployee(e.id),i.appendChild(n)}),n.appendChild(i),n}function Gn(e,t){let n=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;`}),r=K(`div`,{classes:[`glass-card`],style:`width: 100%; max-width: 500px; padding: 2rem;`});r.innerHTML=`
    <h2 style="margin-top: 0; margin-bottom: 2rem;">${e?`Editar`:`Nueva`} Sucursal</h2>
    <form id="est-form">
      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Nombre de la Sucursal</label>
        <input type="text" name="name" required placeholder="Ej: Frigorífico Central" value="${e?.name||``}">
      </div>
      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Dirección</label>
        <input type="text" name="address" placeholder="Ej: Ruta 9 Km 42" value="${e?.address||``}">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: var(--primary); color: var(--on-primary); font-size: 1rem; font-weight: 700; border: none; cursor: pointer;">Guardar</button>
      </div>
    </form>
  `,n.appendChild(r),document.body.appendChild(n);let i=r.querySelector(`#est-form`);i.onsubmit=r=>{r.preventDefault();let a={id:e?.id,name:i.name.value.trim(),address:i.address.value.trim()};t.saveEstablishment(a),n.remove()},r.querySelector(`.btn-cancel`).onclick=()=>n.remove()}function Kn(e,t){let n=K(`div`,{classes:[`modal-overlay`],style:`position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;`}),r=K(`div`,{classes:[`glass-card`],style:`width: 100%; max-width: 600px; padding: 2rem;`});r.innerHTML=`
    <h2 style="margin-top: 0; margin-bottom: 2rem;">${e?`Editar`:`Nuevo`} Empleado</h2>
    <form id="emp-form">
      <div class="responsive-grid-2" style="margin-bottom: 1.5rem;">
        <div class="form-group">
          <label>Nombre Completo</label>
          <input type="text" name="name" required placeholder="Ej: Juan Pérez" value="${e?.name||``}">
        </div>
        <div class="form-group">
          <label>DNI</label>
          <input type="text" name="dni" required placeholder="Ej: 30123456" value="${e?.dni||``}">
        </div>
      </div>
      
      <div class="responsive-grid-2" style="margin-bottom: 1.5rem;">
        <div class="form-group">
          <label>Puesto / Cargo</label>
          <input type="text" name="position" placeholder="Ej: Carnicero, Chofer, Cajero" value="${e?.position||``}">
        </div>
        <div class="form-group">
          <label>Teléfono (Opcional)</label>
          <input type="text" name="phone" placeholder="Ej: 341 555-1234" value="${e?.phone||``}">
        </div>
      </div>
 
      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Dirección</label>
        <input type="text" name="address" placeholder="Ej: Calle Falsa 123" value="${e?.address||``}">
      </div>
 
      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: var(--primary); color: var(--on-primary); font-size: 1rem; font-weight: 700; border: none; cursor: pointer;">Guardar</button>
      </div>
    </form>
  `,n.appendChild(r),document.body.appendChild(n);let i=r.querySelector(`#emp-form`);i.onsubmit=r=>{r.preventDefault();let a={id:e?.id,name:i.name.value.trim(),dni:i.dni.value.trim(),position:i.position.value.trim(),phone:i.phone.value.trim(),address:i.address.value.trim()};t.saveEmployee(a),n.remove()},r.querySelector(`.btn-cancel`).onclick=()=>n.remove()}async function qn(e,t){return I.travels.toArray()}async function Jn(e,t,n){let i=`master_data:${n}`,o=V(i);if(o)return o;if(!t)throw Error(`UID is required to fetch data`);let s=(await b(g(a(e,`master_data`),r(`type`,`==`,n)))).docs.map(e=>ne(e)).filter(Boolean);return H(i,s,B),s}async function Yn(e,t,n,r){if(!t)throw Error(`UID is required to update data`);let i=C(e,`travels`,String(n)),a={...JSON.parse(JSON.stringify(r)),data:JSON.stringify(r),updatedAt:Date.now()};await l(i,a),await I.travels.put({...r,id:String(n),updatedAt:a.updatedAt})}async function Xn(e,t,n){if(!t)throw Error(`UID is required to save data`);let r=C(e,`travels`,String(n.id)),i={...JSON.parse(JSON.stringify(n)),data:JSON.stringify(n),updatedAt:Date.now()};i.createdAt||=Date.now(),await p(r,i),await I.travels.put({...n,updatedAt:i.updatedAt})}async function Zn(e,t,n){if(!t)throw Error(`UID is required to delete data`);await o(C(e,`travels`,String(n))),await I.travels.delete(String(n))}function Qn(e,t,n,r){if(!t)throw Error(`UID is required to subscribe to travels`);return c(a(e,`travels`),e=>{n(e.docs.map(e=>ne(e)).filter(Boolean))},r)}async function $n(e){let t=`master_data:PRODUCT`,n=V(t);if(n)return n;let i=(await b(g(a(e,`master_data`),r(`type`,`==`,`PRODUCT`)))).docs.map(e=>ne(e)).filter(Boolean);return H(t,i,B),i}async function er(e){let t=`master_data:RAW_MATERIAL_PRODUCT`,n=V(t);if(n)return n;let i=(await b(g(a(e,`master_data`),r(`type`,`==`,`RAW_MATERIAL_PRODUCT`)))).docs.map(e=>ne(e)).filter(Boolean);return H(t,i,B),i}async function tr(e){let t=`proveedores`,n=V(t);if(n)return n;let r=(await b(a(e,`proveedores`))).docs.map(e=>({id:e.id,...e.data()}));return H(t,r,z),r}async function nr(e,t){await p(C(e,`proveedores`,String(t.id)),{...t,updatedAt:Date.now()}),U(`proveedores`)}async function rr(e,t){await p(C(e,`frigorifico_entries`,`RAW_${t.id}`),{...t,updatedAt:Date.now()})}async function ir(e){let t=`price_lists`,n=V(t);if(n)return n;let r=(await b(a(e,`price_lists`))).docs.map(e=>({id:e.id,...e.data()}));return H(t,r,B),r}var ar=null;async function or(e,t,n){if(!t)throw Error(`UID is required to save details`);let r=a(e,`faenas_detalle`),i=x(e),o=Date.now(),s=[];n.forEach(e=>{let n=C(r),a=n.id,c={...e,id:a,ownerUid:t,createdAt:o,updatedAt:o};i.set(n,c),s.push(c)}),await i.commit(),s.length>0&&await I.faenas_detalle.bulkPut(s.map(e=>({...e,barcode:e.barcode||null})))}async function sr(e,t,n){return n?!(await b(g(a(e,`faenas_detalle`),r(`fileName`,`==`,n),s(1)))).empty:!1}async function cr(e,t,n){return n?!(await b(g(a(e,`faenas_detalle`),r(`tropa`,`==`,n),s(1)))).empty:!1}async function lr(e,t){return I.faenas_detalle.toArray()}async function ur(e,t,n,r){if(!t||!n||n.length===0)return;let i=x(e),a=Date.now(),o={...r,updatedAt:a};n.forEach(t=>{let n=C(e,`faenas_detalle`,t);i.update(n,o)}),await i.commit();for(let e of n){let t=await I.faenas_detalle.get(e);t&&await I.faenas_detalle.put({...t,...o})}}async function dr(e,t,n,r){let i=await I.faenas_detalle.where(`status`).equals(`DISPATCHED`).toArray();if(t){let e=t.toLowerCase();i=i.filter(t=>(t.destination||``).toLowerCase()===e)}if(n||r){let e=n?new Date(n+`T00:00:00`).getTime():0,t=r?new Date(r+`T23:59:59`).getTime():1/0;i=i.filter(n=>n.dispatchDate>=e&&n.dispatchDate<=t)}return i}async function fr(e,t,n,r){if(!t||!n||n.length===0)return;let i=Date.now(),a=x(e);n.forEach(t=>{let n=C(e,`faenas_detalle`,t.id),o={from:t.fromCamaraId||null,to:r,date:i};a.update(n,{camaraId:r,movements:w(o),updatedAt:i})}),await a.commit();for(let e of n){let t=await I.faenas_detalle.get(e.id);if(t){let n={from:e.fromCamaraId||null,to:r,date:i},a=t.movements?[...t.movements,n]:[n];await I.faenas_detalle.put({...t,camaraId:r,movements:a,updatedAt:i})}}}async function pr(e,t,n,r,i){if(!t)throw Error(`UID is required to add achuras`);await v(a(e,`achuras_stock`),{ownerUid:t,tropa:n,date:r||Date.now(),initialQuantity:i,availableQuantity:i,createdAt:Date.now(),updatedAt:Date.now()}),U(`achuras_stock`)}async function mr(e,t){let n=`achuras_stock`,r=V(n);if(r)return r;let i=(await b(a(e,`achuras_stock`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.availableQuantity>0).sort((e,t)=>(e.date||0)-(t.date||0));return H(n,i,z),i}async function hr(e,t,n){if(!t)throw Error(`UID is required to consume achuras`);let r=await mr(e,t),i=r.reduce((e,t)=>e+t.availableQuantity,0);if(i<n)throw Error(`Stock insuficiente de achuras. Disponible: ${i}, Requerido: ${n}`);let a=n,o=x(e);for(let t of r){if(a<=0)break;let n=C(e,`achuras_stock`,t.id);t.availableQuantity<=a?(o.update(n,{availableQuantity:0,updatedAt:Date.now()}),a-=t.availableQuantity):(o.update(n,{availableQuantity:t.availableQuantity-a,updatedAt:Date.now()}),a=0)}await o.commit(),U(`achuras_stock`)}async function gr(e){if(ar)return ar;let t=await f(C(e,`config`,`camaras`));return ar=t.exists()&&t.data().list?t.data().list:[],ar}async function _r(e,t){console.log(`api.saveCamaras called with:`,t),await p(C(e,`config`,`camaras`),{list:t,updatedAt:Date.now()}),console.log(`api.saveCamaras successfully completed`),ar=null}async function vr(e,t,{clientId:n,destName:r,priceListId:i,isNewClient:o,shouldLinkClient:s,providerToUpdate:c,isNewProvider:l,customerTransaction:u,providerTransaction:d,rawMaterialBatches:f,carcassesToUpdate:p}){let m=x(e);if(o){let t=C(e,`clientes`,n);m.set(t,{name:r,priceListId:i||null,createdAt:Date.now(),updatedAt:Date.now()})}else if(s&&i){let t=C(e,`clientes`,n);m.update(t,{priceListId:i,updatedAt:Date.now()})}let h=C(e,`proveedores`,String(c.id));l?m.set(h,{...c,createdAt:Date.now(),updatedAt:Date.now()}):m.update(h,{balance:c.balance,updatedAt:Date.now()});let g=C(a(e,`transactions`));if(m.set(g,{...u,createdAt:Date.now()}),d){let t=C(a(e,`transactions`));m.set(t,{...d,createdAt:Date.now()})}f&&f.length>0&&f.forEach(t=>{let n=C(e,`frigorifico_entries`,`RAW_${t.id}`);m.set(n,{...t,updatedAt:Date.now()})});let _=Date.now(),v=new Date(_+2160*60*60*1e3);if(p.forEach(t=>{let n=C(e,`faenas_detalle`,t.id);m.update(n,{status:`DISPATCHED`,destination:r,dispatchDate:_,movements:t.movements,updatedAt:_,deleteAt:v})}),await m.commit(),o)await I.clientes.put({id:n,name:r,priceListId:i||null,createdAt:_,updatedAt:_});else if(s&&i){let e=await I.clientes.get(n);e&&await I.clientes.put({...e,priceListId:i,updatedAt:_})}for(let e of p){let t=await I.faenas_detalle.get(e.id);t&&await I.faenas_detalle.put({...t,status:`DISPATCHED`,destination:r,dispatchDate:_,movements:e.movements,updatedAt:_,deleteAt:v})}ce()}async function yr(e,t,n,r){let i=C(e,`faenas_detalle`,t),a={category:n,standardizedCategory:n,comments:r,updatedAt:Date.now()};await l(i,a);let o=await I.faenas_detalle.get(t);o&&await I.faenas_detalle.put({...o,...a})}async function br(e,t,n,i,o){let s=await I.faenas_detalle.get(n);if(!s)throw Error(`No se encontró la res en la base de datos local.`);let c=s.destination;if(!c)throw Error(`Esta res no tiene un destino previo registrado.`);let l=await I.clientes.toArray(),u=l.find(e=>e.name.toLowerCase()===c.toLowerCase()),d=u?u.id:null,f=l.find(e=>e.name.toLowerCase()===i.toLowerCase()),p=f?f.id:`CUST_${Date.now()}`,m=!f,h=null,_=a(e,`transactions`);if(d){let e=await b(g(_,r(`clientId`,`==`,d),r(`type`,`==`,`DEBT`)));for(let t of e.docs){let e=t.data();if(e.breakout&&e.breakout.some(e=>e.id===n)){h={id:t.id,...e};break}}}let v=x(e),y=Date.now();if(m){let t=C(e,`clientes`,p);v.set(t,{name:i,priceListId:null,createdAt:y,updatedAt:y})}let S=s.kg*o,w={id:n,garron:s.garron,weight:s.kg,price:o,total:S};if(h){let t=(h.breakout||[]).filter(e=>e.id!==n);if(t.length>0){let r=(h.breakout||[]).find(e=>e.id===n)?.total||0,a=Math.max(0,(h.amount||0)-r),o=C(e,`transactions`,h.id);v.update(o,{amount:a,breakout:t,updatedAt:y});let l=C(_);v.set(l,{clientId:p,type:`DEBT`,amount:S,description:`Reasignado: Despacho de 1 res (Garrón #${s.garron}, ${s.kg.toFixed(1)} kg) a "${i}" (Origen anterior: "${c}")`,breakout:[w],date:y,createdAt:y,updatedAt:y})}else{let t=C(e,`transactions`,h.id);v.update(t,{clientId:p,amount:S,description:`Reasignado: Despacho de 1 res (Garrón #${s.garron}, ${s.kg.toFixed(1)} kg) a "${i}" (Origen anterior: "${c}")`,breakout:[w],updatedAt:y})}}else{let e=C(_);v.set(e,{clientId:p,type:`DEBT`,amount:S,description:`Reasignado: Despacho de 1 res (Garrón #${s.garron}, ${s.kg.toFixed(1)} kg) a "${i}"`,breakout:[w],date:y,createdAt:y,updatedAt:y})}let T=C(e,`faenas_detalle`,n),E=[...s.movements||[]];E.push({type:`DESTINATION`,from:c,to:i,date:y,price:o});let D={destination:i,movements:E,updatedAt:y};v.update(T,D),await v.commit(),m&&await I.clientes.put({id:p,name:i,priceListId:null,createdAt:y,updatedAt:y}),await I.faenas_detalle.put({...s,...D}),U(`transactions:all`),ce()}var xr=class{constructor(){}async fetchTravels(e){return qn(P,e)}async fetchMasterData(e,t){return Jn(P,e,t)}async updateTravel(e,t,n){await Yn(P,e,t,n)}async saveTravel(e,t){await Xn(P,e,t)}async deleteTravel(e,t){await Zn(P,e,t)}async saveFaenaDetalle(e,t){await or(P,e,t)}async getFaenaStock(e){return lr(P,e)}async dispatchFaenas(e,t,n){await ur(P,e,t,{status:`DISPATCHED`,destination:n,dispatchDate:Date.now(),deleteAt:new Date(Date.now()+2160*60*60*1e3)})}async prepareFaenas(e,t,n){await ur(P,e,t,n)}async moveFaenasToCamara(e,t,n){await fr(P,e,t,n)}async checkIfFaenaExists(e,t){return sr(P,e,t)}async checkIfTropaExists(e,t){return cr(P,e,t)}async addAchurasBatch(e,t,n,r){await pr(P,e,t,n,r)}async fetchAchurasStock(e){return mr(P,e)}async consumeAchuras(e,t){await hr(P,e,t)}subscribeTravels(e,t,n){return Qn(P,e,t,n)}async saveRawMaterialBatch(e){await rr(P,e)}async executeUnifiedDispatch(e,t){await vr(P,e,t)}async updateFaenaCategory(e,t,n){await yr(P,e,t,n)}async updateCarcassDestination(e,t,n,r){await br(P,e,t,n,r)}},Sr=class{constructor(e={}){this._raw=e,this.id=e.firebaseId||String(e.id||``),this.date=e.date||``,this.description=e.description||``,this.status=e.status||`DRAFT`,this.tropa=e.tropa||``,this.truck=e.truck||{name:``},this.kmOnOrigin=e.kmOnOrigin||0,this.kmOnDestination=e.kmOnDestination||0,this.pricePerKm=e.pricePerKm||0,this.litersOnPump=e.litersOnPump||0,this.fuelPrice=e.fuelPrice||0;let t=e.buy||{};e.reduce!==void 0&&(t.reduce=e.reduce),this.buy=e.buy?new Te(t):e.reduce===void 0?null:new Te({reduce:e.reduce})}get distanceKm(){return Math.max(0,this.kmOnDestination-this.kmOnOrigin)}get fleteCost(){return this.distanceKm*this.pricePerKm}get isCompleted(){let e=String(this.status||``).toUpperCase();return(e===`ACTIVE`||e===`ACTIVO`||e===`COMPLETED`||e===`FINALIZADO`)&&e!==`DRAFT`&&e!==`BORRADOR`}},Cr=class{constructor(e){this.travelRepository=e}async execute({uid:e,filter:t=`TODOS`,sort:n=`DESC`}={}){let r=(await this.travelRepository.fetchTravels(e)).map(e=>new Sr(e));return t!==`TODOS`&&(r=r.filter(e=>t===`ACTIVO`?e.status===`ACTIVE`||e.status===`COMPLETED`:t!==`BORRADOR`||e.status===`DRAFT`)),r.sort((e,t)=>{let r=new Date(e.date||0),i=new Date(t.date||0);return n===`DESC`?i-r:r-i}),r}},wr=class{execute(e,t,n=!1,r={}){let i=0,a=0,o=0,s=0,c=0,l=0,u=0,d=0,f=0,p=e.filter(e=>{let t=String(e.status||``).toUpperCase();return(e.isCompleted===!0||t===`COMPLETED`||t===`FINALIZADO`||t===`ACTIVE`||t===`ACTIVO`)&&t!==`DRAFT`&&t!==`BORRADOR`}),m=Array.isArray(t)?t:[t],h=m.length===0||m.includes(`TODOS`),g=new Map;p.forEach(e=>{let t=e.buy;if(!t)return;let n=t.agent?.name||`Sin Comisionista`;if(h){let r=t.totalKgClean;r>0&&(i+=t.totalOperation,a+=t.totalOperationWithCommission,o+=r,c+=t.totalQuantity,l+=t.totalKgFaena,u+=t.totalFreight||0,t.listOfProducers.forEach(t=>{let r=`${t.producer?.name||`Productor`} (ag. ${n})`;g.has(r)||g.set(r,{name:r,kg:0,kgForYield:0,kgFaena:0,maxTravelYield:0,travelId:null});let i=g.get(r),a=0,o=0;if(t.listOfProducts.forEach(e=>{let t=e.kgClean||0,n=e.kgFaena||0;i.kg+=t,i.kgFaena+=n,n>0&&(f+=t,i.kgForYield+=t,a+=t,o+=n);let r=e.taxes?.bill||{neto:0,iva:0};s+=(r.neto||0)+(r.iva||0)}),a>0&&o>0){let t=o/a;t>i.maxTravelYield&&(i.maxTravelYield=t,i.travelId=e.id)}}),d++)}else{let r=!1;if(t.listOfProducers.forEach(u=>{let d=`${u.producer?.name||`Productor`} (ag. ${n})`;g.has(d)||g.set(d,{name:d,kg:0,kgForYield:0,kgFaena:0,maxTravelYield:0,travelId:null});let p=g.get(d),h=0,_=0;if(u.listOfProducts.forEach(e=>{if(m.includes(e.standardizedCategory)){let n=e.kgClean;if(n>0){let u=e.kgFaena||0,d=e.operation,m=d*(1+(t.agent?.percent||0)/100);i+=d,a+=m,o+=n,c+=e.quantity||0,l+=u,p.kg+=n,p.kgFaena+=u,u>0&&(f+=n,p.kgForYield+=n,h+=n,_+=u);let g=e.taxes?.bill||{neto:0,iva:0};s+=(g.neto||0)+(g.iva||0),r=!0}}}),h>0&&_>0){let t=_/h;t>p.maxTravelYield&&(p.maxTravelYield=t,p.travelId=e.id)}}),r&&(d++,t.totalKgClean>0&&t.totalFreight>0)){let e=t.listOfProducers.reduce((e,t)=>e+t.listOfProducts.reduce((e,t)=>e+(m.includes(t.standardizedCategory)&&t.kgClean||0),0),0)/t.totalKgClean*t.totalFreight;u+=e}}});let _=i>0?s/i:0,v=c>0?l/c/2:0,y=f>0?l/f:0,b=0,x=`-`,S=null;g.forEach(e=>{if(e.kgForYield>0){let t=e.kgFaena/e.kgForYield;t>b&&(b=t,x=e.name,S=e.travelId)}});let C=((n?a:i)+u)/(o||1),w=y>0?y:.58,T=(w>0?C/w:0)/.983,E=0,D=0,O=0;if(m.length===1&&m[0]!==`TODOS`){let e=m[0];E=parseFloat(r[e])||0,E>0&&(D=E-T,O=D/(T||1)*100)}let k={},A={},j={};return p.forEach(e=>{let t=e.date||`Sin Fecha`;k[t]||(k[t]={totalPrice:0,totalYield:0,count:0});let r=e.buy||{},i=n?r.avgPriceWithCommission||0:r.avgPrice||0,a=(r.generalYield||0)*100;k[t].totalPrice+=i,k[t].totalYield+=a,k[t].count++,(r.categories||[]).forEach(e=>{A[e]||(A[e]={kg:0,buyPriceSum:0,count:0});let t=(r.totalKgClean||0)/(r.categories.length||1);A[e].kg+=t,A[e].buyPriceSum+=i,A[e].count++});let o=r.agent?.name;o&&(j[o]||(j[o]={totalPrice:0,totalYield:0,yields:[],count:0,totalKg:0,type:`AGENT`,minYield:999,maxYield:0}),j[o].totalPrice+=i,j[o].totalYield+=a,j[o].totalKg+=r.totalKgClean||0,j[o].count++,j[o].minYield=Math.min(j[o].minYield,a),j[o].maxYield=Math.max(j[o].maxYield,a)),(r.listOfProducers||[]).forEach(e=>{let t=e.producer?.name;t&&(j[t]||(j[t]={totalPrice:0,totalYield:0,yields:[],count:0,totalKg:0,type:`PRODUCER`,minYield:999,maxYield:0}),j[t].totalPrice+=i,j[t].totalYield+=a,j[t].totalKg+=e.totalKgClean||0,j[t].count++,j[t].minYield=Math.min(j[t].minYield,a),j[t].maxYield=Math.max(j[t].maxYield,a))})}),{avgPrice:o>0?i/o:0,avgPriceWithCommission:o>0?a/o:0,totalKg:o,totalKgFaena:l,totalQuantity:c,travelCount:d,facturaOverOp:_,hasFacturaWarning:_<.5||_>1,avgKgMediaRes:v,avgYield:y,maxYield:b,maxYieldEntity:x,maxYieldTravelId:S,totalFreight:u,realCostGancho:T,sellPriceRef:E,margin:D,marginPct:O,yieldVal:w,trendsMap:k,catDistributionMap:A,entityMap:j}}},Tr=class{constructor({stockItems:e=[],draftItems:t=[],achurasItems:n=[],selectedIds:r=new Set,categoryPriceInputs:i={}}={}){this.stockItems=e,this.draftItems=t,this.achurasItems=n,this.selectedIds=r,this.categoryPriceInputs=i}getStockTotals(){return this.stockItems.reduce((e,t)=>{e.kg+=t.kg||0,e.count+=1;let n=t.standardizedCategory||`OTRO`;return e.byCategory[n]||(e.byCategory[n]={kg:0,count:0}),e.byCategory[n].kg+=t.kg||0,e.byCategory[n].count+=1,e},{kg:0,count:0,byCategory:{}})}getDispatchSummary(){let e=this.stockItems.filter(e=>this.selectedIds.has(e.id)),t=e.reduce((e,t)=>e+(t.kg||0),0),n={};e.forEach(e=>{let t=e.standardizedCategory||`OTRO`;n[t]||(n[t]={kg:0,count:0}),n[t].kg+=e.kg||0,n[t].count+=1});let r=Object.entries(n),i=0;return r.forEach(([e,t])=>{let n=parseFloat(this.categoryPriceInputs?.[e])||0;i+=t.kg*n}),{selectedItems:e,selKg:t,byCategory:n,catEntries:r,multiCat:r.length>1,grandTotal:i}}getGroupedDrafts(){let e={};return this.draftItems.forEach(t=>{let n=`${t.destination}_${t.draftDate}`;e[n]||(e[n]={destination:t.destination||`Sin destino`,draftDate:t.draftDate,draftPrices:t.draftPrices,items:[],totalKg:0}),e[n].items.push(t),e[n].totalKg+=t.kg||0}),Object.values(e)}getAchurasTotals(){return this.achurasItems.reduce((e,t)=>e+(t.availableQuantity||0),0)}},Er=class{execute({stockItems:e,draftItems:t,achurasItems:n,selectedIds:r,categoryPriceInputs:i}){let a=new Tr({stockItems:e,draftItems:t,achurasItems:n,selectedIds:r,categoryPriceInputs:i});return{faenaStock:a,stockTotals:a.getStockTotals(),dispatchSummary:a.getDispatchSummary(),groupedDrafts:a.getGroupedDrafts(),achurasTotals:a.getAchurasTotals()}}};function Dr(e){let t=(e||``).trim().toUpperCase();return t.startsWith(`VQ`)||t.startsWith(`VAQ`)?`VAQUILLONA`:t.startsWith(`VA`)||t.startsWith(`VACA`)?`VACA`:t.startsWith(`TO`)||t.startsWith(`TORO`)?`TORO`:t.startsWith(`NO`)||t.startsWith(`NT`)||t.startsWith(`MEJ`)?`NOVILLO`:`OTRO`}var Or=class{constructor(){O.workerSrc=A}async parse(e){let t=await k({data:await e.arrayBuffer()}).promise,n=``;for(let e=1;e<=t.numPages;e++){let r=await(await t.getPage(e)).getTextContent();n+=r.items.map(e=>e.str).join(` `)+`
`}return console.log(`PDF Full Text Extracted:`,n),this._extractData(n)}_extractData(e){let t={producer:{name:``,cuit:``},tropa:``,date:``,totalKgFaena:0,totalKgVivos:0,totalHeadCount:0,items:[]},n=e.match(/Vendedor\s+CUIT:?\s*(\d+)\s+Razón Social:?\s*([^DTE:]+)/i);n&&(t.producer.cuit=n[1].trim(),t.producer.name=n[2].trim());let r=e.match(/TROPA:\s*(\d+)/i);r&&(t.tropa=r[1]);let i=e.match(/Fecha:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);i&&(t.date=i[1]);let a=e.match(/TOTAL FAENA\s+\d+\s+\d+\s+(\d+)/i);a&&(t.totalKgFaena=parseFloat(a[1]));let o=e.match(/KG\.\s*VIVOS\s+(\d+)/i);o&&(t.totalKgVivos=parseFloat(o[1]));let s=e.match(/CABEZA FAENA\s+(\d+)/i);s&&(t.totalHeadCount=parseInt(s[1]));let c=/(\d+)\s+(\d+)\s+([A-Z]{2})\s+([A-Z0-9]+)\s+(\d+)\s+(\d+)\s+([A-Z]{2})\s+(\d+)\s+(\d+)/g,l;for(;(l=c.exec(e))!==null;){let e=l[2],n=l[3],r=parseFloat(l[8]),i=parseFloat(l[9]),a=Dr(n);t.items.push({garron:e,half:1,category:n,kg:r,standardizedCategory:a}),t.items.push({garron:e,half:2,category:n,kg:i,standardizedCategory:a})}return t.totalItemsCount=t.items.length,t}},J=`rUY2SwonQJTtOE0iCbXDQBoVmc63`;function kr(e,t){let n;return function(...r){clearTimeout(n),n=setTimeout(()=>{clearTimeout(n),e(...r)},t)}}var Ar=class{constructor(e,t,n,r){this.travelRepository=e,this.logisticsRepository=n,this.clientRepository=r,this.getTravelsUseCase=new Cr(e),this.calculateStatsUseCase=new wr,this.getStockSummaryUseCase=new Er,this.pdfService=new Or,this.ui=t,this.allTravels=[],this.travelsUnsubscribe=null,this.stockItemsCache=null,this.historyItemsCache=null,this.clientsCache=null,this.categoryPricesCache=null;let i=new Date,a=new Date(i);a.setMonth(a.getMonth()-1),a.toISOString().split(`T`)[0],i.toISOString().split(`T`)[0],this.state={filter:`TODOS`,sort:`DESC`,page:1,itemsPerPage:5,selectedCategories:[],includeCommission:!1,currentView:`dashboard`,timeFilterType:`all`,timeFilterValue:`all`,searchQuery:``,dashHistoryFilters:{destination:``,date:i.toISOString().split(`T`)[0]}},this.debouncedSearch=kr(e=>{this.state.searchQuery=e,this.state.page=1,this.refresh()},300)}setTimeFilter(e,t){this.state.timeFilterType=e,this.state.timeFilterValue=t,this.state.page=1,this.refresh()}_applyTimeFilter(e){if(this.state.timeFilterType===`count`&&this.state.timeFilterValue)return[...e].sort((e,t)=>new Date(t.date||0)-new Date(e.date||0)).slice(0,parseInt(this.state.timeFilterValue,10)||0);if(this.state.timeFilterType===`range`&&this.state.timeFilterValue){let{start:t,end:n}=this.state.timeFilterValue;if(t&&n)return e.filter(e=>{let r=new Date(e.date);return r>=new Date(t)&&r<=new Date(n)})}return e}invalidateDashboardCache(){this.stockItemsCache=null,this.historyItemsCache=null,this.clientsCache=null,this.categoryPricesCache=null}processTravelEntities(e){this.invalidateDashboardCache();let t=new Set;this.allTravels=e.map(e=>e instanceof Sr?e:new Sr(e)).filter(e=>!e||!e.id||t.has(e.id)?!1:(t.add(e.id),!0)),this.completedTravelsCache=this.allTravels.filter(e=>{let t=String(e.status||``).toUpperCase();return(e.isCompleted===!0||t===`COMPLETED`||t===`FINALIZADO`||t===`ACTIVE`||t===`ACTIVO`)&&t!==`DRAFT`&&t!==`BORRADOR`});let n=new Set;this.completedTravelsCache.forEach(e=>{e.buy&&e.buy.categories&&e.buy.categories.forEach(e=>{e&&n.add(e)})}),this.allCategoriesCache=[`TODOS`,...Array.from(n).sort()]}processRawTravels(e){this.processTravelEntities(e)}async loadTravels(e){this.ui.showLoading();try{this.invalidateDashboardCache();let t=await this.getTravelsUseCase.execute({uid:e,filter:`TODOS`,sort:this.state.sort});this.processTravelEntities(t),this.ui.hideLoading(),this.refresh()}catch(e){console.error(`Critical error in loadTravels setup:`,e),this.ui.showError(e.message),this.ui.hideLoading()}}setFilter(e){this.state.filter=e,this.state.page=1,this.refresh()}setSort(e){this.state.sort=e,this.refresh()}setPage(e){this.state.page=e,this.refresh()}setSearchQuery(e){this.state.searchQuery=e,this.debouncedSearch(e)}toggleCategory(e){if(e===`TODOS`)this.state.selectedCategories=[];else{let t=this.state.selectedCategories.indexOf(e);t===-1?this.state.selectedCategories.push(e):this.state.selectedCategories.splice(t,1)}this.state.page=1,this.refresh()}toggleCommission(e){this.state.includeCommission=e,this.refresh()}refresh(){this.state.currentView===`dashboard`?this.showDashboard():this.updateView()}showTravelDetail(e){this.state.filter=`TODOS`,this.state.selectedCategories=[],this.state.searchQuery=String(e),this.state.page=1,this.state.currentView=`travels`;let t=document.getElementById(`kmp-sidebar`);t&&t.setAttribute(`active`,`travels`),this.ui&&typeof this.ui.navigateTo==`function`?this.ui.navigateTo(`travels`):this.updateView()}async updateView(){this.state.currentView=`travels`;let e=this.allCategoriesCache||[`TODOS`],t=await this.getTravelsUseCase.execute({uid:J,filter:this.state.filter,sort:this.state.sort});if(t=this._applyTimeFilter(t),this.state.selectedCategories.length>0&&(t=t.filter(e=>e.buy?e.buy.categories.some(e=>this.state.selectedCategories.includes(e)):!1)),this.state.searchQuery){let e=this.state.searchQuery.toLowerCase();t=t.filter(t=>{let n=String(t.id).toLowerCase();if(n===e||n.includes(e))return!0;let r=(t.truck?.name||``).toLowerCase(),i=(t.truck?.licensePlate||``).toLowerCase(),a=(t.description||``).toLowerCase(),o=(t.truck?.driver?.name||t.driver?.name||``).toLowerCase(),s=(t.buy?.agent?.name||``).toLowerCase(),c=(t.buy?.listOfProducers||[]).some(t=>(t.producer?.name||``).toLowerCase().includes(e)||(t.producer?.cuit||``).toLowerCase().includes(e));return r.includes(e)||i.includes(e)||a.includes(e)||o.includes(e)||s.includes(e)||c})}let n=this.calculateStatsUseCase.execute(t,this.state.selectedCategories,this.state.includeCommission),r=t.length,i=(this.state.page-1)*this.state.itemsPerPage,a=t.slice(i,i+this.state.itemsPerPage);this.ui.renderTravels({data:a,totalItems:r,currentPage:this.state.page,itemsPerPage:this.state.itemsPerPage,currentFilter:this.state.filter,currentSort:this.state.sort,categories:e,selectedCategories:this.state.selectedCategories,includeCommission:this.state.includeCommission,categoryStats:n,onFilter:e=>this.setFilter(e),onSort:e=>this.setSort(e),onPage:e=>this.setPage(e),onCategoryToggle:e=>this.toggleCategory(e),onCommissionToggle:e=>this.toggleCommission(e),timeFilterType:this.state.timeFilterType,timeFilterValue:this.state.timeFilterValue,onTimeFilter:(e,t)=>this.setTimeFilter(e,t),searchQuery:this.state.searchQuery,onSearch:e=>this.setSearchQuery(e),onPdfUpload:e=>this.handlePdfFaenaUpload(e,J),onScanDirectory:e=>this.handleScanDirectory(J,e),onReduceUpdate:(e,t)=>this.handleReduceUpdate(J,e,t),onProducerSettlement:(e,t)=>this.handleProducerSettlement(e,t),onAddTravel:()=>this.openTravelModal(),onEditTravel:e=>this.openTravelModal(e),onDeleteTravel:e=>this.handleDeleteTravel(e)})}async openTravelModal(e=null){try{this.ui.showLoading();let[t,n,r]=await Promise.all([this.logisticsRepository.getTrucks(),this.logisticsRepository.getProducers(),this.logisticsRepository.getAgents()]);this.ui.hideLoading(),this.ui.showTravelModal(e,{trucks:t,producers:n,agents:r,onSaveTravel:e=>this.handleSaveTravel(e),onCancel:()=>this.updateView()})}catch(e){this.ui.hideLoading(),this.ui.showError(`Error al cargar datos del formulario: `+e.message)}}async handleSaveTravel(e){try{this.ui.showLoading();let t=new Tn(e);if(!t.driverPricePerKmSimple){let e=await this.logisticsRepository.getAppConfig();t.driverPricePerKmSimple=e.defaultDriverPricePerKmSimple||0,t.driverPricePerKmDouble=e.defaultDriverPricePerKmDouble||0,t.simulationFreightPriceSimple=e.simulationFreightPriceSimple||0,t.simulationFreightPriceDouble=e.simulationFreightPriceDouble||0,t.fuelPrice=e.fuelPrice||0}await this.travelRepository.saveTravel(J,t);let n=await this.getTravelsUseCase.execute({uid:J,filter:`TODOS`,sort:this.state.sort});this.processTravelEntities(n),this.refresh(),this.ui.hideLoading()}catch(e){this.ui.hideLoading(),this.ui.showError(`Error al guardar viaje: `+e.message)}}async handleDeleteTravel(e){try{this.ui.showLoading(),await this.travelRepository.deleteTravel(J,e);let t=await this.getTravelsUseCase.execute({uid:J,filter:`TODOS`,sort:this.state.sort});this.processTravelEntities(t),this.refresh(),this.ui.hideLoading()}catch(e){this.ui.hideLoading(),this.ui.showError(`Error al eliminar viaje: `+e.message)}}async handleReduceUpdate(e,t,n){let r=this.allTravels.find(e=>e.id===t);if(r){r.buy||={},r.buy.reduce=n;try{let i=JSON.parse(JSON.stringify(r._raw||r));i.buy||={},i.buy.reduce=n,i.reduce=n,await this.travelRepository.updateTravel(e,t,i);let a=await this.getTravelsUseCase.execute({uid:e,filter:`TODOS`,sort:this.state.sort});this.processTravelEntities(a),this.refresh()}catch(e){this.ui.showError(`Error al actualizar achique: `+e.message)}}}handleProducerSettlement(e,t){this.ui.renderSettlementModal(e,t,{onUpdateSettlement:(e,t,n,r)=>this.handleSettlementUpdate(J,e,t,n,r)})}async handleSettlementUpdate(e,t,n,r,i){this.ui.showLoading();try{let a=this.allTravels.find(e=>e.id===t);if(!a)throw Error(`Viaje no encontrado`);let o=JSON.parse(JSON.stringify(a._raw||a)),s=o.buy?.listOfProducers||[],c=String(n||``).replace(/\D/g,``),l=s.find(e=>String(e.cuit||e.producer?.cuit||``).replace(/\D/g,``)===c&&c.length>0);if(!l)throw Error(`Productor no encontrado en el viaje`);r.forEach(e=>{let t=l.listOfProducts[e.index];t&&(t.price=e.price,t.roughing=e.roughing)}),l.manualIva=i,await this.travelRepository.updateTravel(e,t,o);let u=await this.getTravelsUseCase.execute({uid:e,filter:`TODOS`,sort:this.state.sort});this.processTravelEntities(u),this.refresh(),this.ui.showLoading(!1)}catch(e){this.ui.showError(`Error al guardar liquidación: `+e.message),this.ui.hideLoading()}}async showDashboard(){this.state.currentView=`dashboard`;let e=this.completedTravelsCache||[],t=this.allCategoriesCache||[`TODOS`];if(!this.stockItemsCache||!this.categoryPricesCache||!this.clientsCache)try{let[e,t]=await Promise.all([this.travelRepository.getFaenaStock(J),this.clientRepository.getCategoryPrices()]);this.categoryPricesCache=t||{},this.stockItemsCache=e.filter(e=>e.status===`AVAILABLE`),this.historyItemsCache=e.filter(e=>e.status===`DISPATCHED`),this.clientsCache=await this.clientRepository.getClients()}catch(e){console.error(`Error loading dashboard extended data:`,e)}let n=this.stockItemsCache||[],r=this.historyItemsCache||[],i=this.clientsCache||[],a=this.categoryPricesCache||{},o=this._applyTimeFilter(e);this.state.selectedCategories.length>0&&(o=o.filter(e=>e.buy&&e.buy.categories&&e.buy.categories.some(e=>this.state.selectedCategories.includes(e))));let s=this.calculateStatsUseCase.execute(o,this.state.selectedCategories,this.state.includeCommission,a),c=this.getStockSummaryUseCase.execute({stockItems:n,draftItems:[],achurasItems:[],selectedIds:new Set,categoryPriceInputs:{}});this.ui.renderDashboard({data:o,categories:t,selectedCategories:this.state.selectedCategories,includeCommission:this.state.includeCommission,categoryStats:s,stockTotals:c.stockTotals,historyItems:r,clients:i,categoryPrices:a,dashHistoryFilters:this.state.dashHistoryFilters,onCategoryToggle:e=>this.toggleCategory(e),onCommissionToggle:e=>this.toggleCommission(e),onShowTravelDetail:e=>this.showTravelDetail(e),timeFilterType:this.state.timeFilterType,timeFilterValue:this.state.timeFilterValue,onTimeFilter:(e,t)=>this.setTimeFilter(e,t),onDashHistoryFilter:(e,t)=>{this.state.dashHistoryFilters[e]=t,this.showDashboard()}})}openExportOptions(){this.ui.renderExportModal({onExport:e=>this.handleExport(e),onExcelExport:e=>this.handleExcelExport(e)})}async handleScanDirectory(e,t){if(!(!t||t.length===0)){this.ui.showLoading();try{let n=0,r=0,i=0,a=0,o=0,s=[];for(let c of t)if(c.name.toLowerCase().endsWith(`.pdf`))try{let t=await this.handlePdfFaenaUpload(c,e,!0);t.skipped?a++:(n++,t.matched?r++:i++)}catch(e){console.error(`Error procesando ${c.name}:`,e),s.push(`- ${c.name}: ${e.stack||e.message}`),o++}await this.loadTravels(e),this.ui.renderScanResultsModal({newCount:n,matchedCount:r,unmatchedCount:i,existCount:a,errorCount:o,errorMessages:s})}catch(e){console.error(e)}finally{this.updateView()}}}async handleExport(e){let{type:t,value:n}=e,r=this.allTravels.filter(e=>{let t=String(e.status||``).toUpperCase();return(e.isCompleted===!0||t===`COMPLETED`||t===`FINALIZADO`||t===`ACTIVE`||t===`ACTIVO`)&&t!==`DRAFT`&&t!==`BORRADOR`}).sort((e,t)=>new Date(t.date)-new Date(e.date));if(t===`count`)r=r.slice(0,parseInt(n));else if(t===`range`){let{start:e,end:t}=n;r=r.filter(n=>{let r=new Date(n.date);return r>=new Date(e)&&r<=new Date(t)})}this.ui.generateTravelReport(r)}async handleExcelExport(e){let{type:t,value:n}=e,r=this.allTravels.filter(e=>{let t=String(e.status||``).toUpperCase();return(e.isCompleted===!0||t===`COMPLETED`||t===`FINALIZADO`||t===`ACTIVE`||t===`ACTIVO`)&&t!==`DRAFT`&&t!==`BORRADOR`}).sort((e,t)=>new Date(t.date)-new Date(e.date));if(t===`count`)r=r.slice(0,parseInt(n));else if(t===`range`){let{start:e,end:t}=n;r=r.filter(n=>{let r=new Date(n.date);return r>=new Date(e)&&r<=new Date(t)})}this.ui.generateExcelReport(r)}async handlePdfFaenaUpload(e,t,n=!1){n||this.ui.showLoading();try{if(await this.travelRepository.checkIfFaenaExists(t,e.name))return n||(alert(`⚠️ El archivo "${e.name}" ya fue procesado anteriormente.`),this.updateView()),{skipped:!0,fileName:e.name};let r=await this.pdfService.parse(e);if(console.log(`PDF Data Extracted:`,r),!r.producer.cuit)throw Error(`[${e.name}] No se pudo encontrar el CUIT del productor en el PDF.`);let[i,a,o]=r.date.split(`/`),s=new Date(`${o}-${a}-${i}`);if(r.tropa&&await this.travelRepository.checkIfTropaExists(t,r.tropa))return n||(alert(`⚠️ La tropa "${r.tropa}" ya fue procesada anteriormente.`),this.updateView()),{skipped:!0,fileName:e.name};let c=this.allTravels.find(e=>{if(e.tropa&&r.tropa&&String(e.tropa).trim()===String(r.tropa).trim())return!0;if(e.tropa&&r.tropa&&String(e.tropa).trim()!==String(r.tropa).trim()||!(e.buy?.listOfProducers||[]).some(e=>(e.producer?.cuit||``).replace(/\D/g,``)===r.producer.cuit.replace(/\D/g,``)))return!1;let t=new Date(e.date),n=Math.abs(s-t);return Math.ceil(n/(1e3*60*60*24))<=7});if(!c)console.warn(`[${e.name}] No se encontró un viaje para el productor con CUIT ${r.producer.cuit} cerca de la fecha ${r.date}. Guardando como faena huérfana.`);else{console.log(`Matching Travel Found:`,c);let e=JSON.parse(JSON.stringify(c._raw||c)),n=String(e.id||e.firebaseId||c.id);delete e.firebaseId;let i=e.buy.listOfProducers.find(e=>(e.producer?.cuit||``).replace(/\D/g,``)===r.producer.cuit.replace(/\D/g,``));i&&(i.listOfProducts.forEach(e=>{let t=r.items.filter(t=>t.standardizedCategory===e.standardizedCategory);t.length>0&&(e.kgFaena=t.reduce((e,t)=>e+t.kg,0))}),e.buy.kgFaenaGlobal=r.totalKgFaena,e.kgFaenaTotal=r.totalKgFaena),await this.travelRepository.updateTravel(t,n,e)}let l=c?String(c.id||c.firebaseId||c._raw?.id||``):`UNMATCHED`,u=r.items.map(t=>({travelId:l,isOrphan:!c,fileName:e.name,tropa:r.tropa,garron:t.garron,half:t.half,category:t.category,standardizedCategory:t.standardizedCategory,kg:t.kg,status:`AVAILABLE`,producerCuit:r.producer.cuit,producerName:r.producer.name,pdfDate:r.date}));return await this.travelRepository.saveFaenaDetalle(t,u),r.totalHeadCount>0&&await this.travelRepository.addAchurasBatch(t,r.tropa,Date.now(),r.totalHeadCount),n||(await this.loadTravels(t),alert(c?`✅ Faena procesada con éxito: ${r.totalKgFaena} kg, ${r.totalHeadCount} cabezas.`:`⚠️ Faena procesada: ${r.totalKgFaena} kg. SIN VIAJE ASIGNADO (Huérfana).`)),{success:!0,matched:!!c,fileName:e.name}}catch(e){throw console.error(e),n||(alert(`❌ Error al procesar PDF: ${e.message}`),this.updateView()),e}}},jr=class{constructor(e={},t=[]){this.client=e,this.transactions=t}getDebtTotal(){return this.transactions.filter(e=>e.type===`DEBT`).reduce((e,t)=>e+(t.amount||0),0)}getPaymentsTotal(){return this.transactions.filter(e=>e.type===`PAYMENT`).reduce((e,t)=>e+(t.amount||0),0)}getBalance(){return this.getDebtTotal()-this.getPaymentsTotal()}getBalanceForward(e){return this.transactions.filter(t=>new Date(t.date||t.createdAt).getTime()<e).reduce((e,t)=>e+(t.type===`DEBT`?t.amount||0:-(t.amount||0)),0)}getTransactionsForRange(e,t){return this.transactions.filter(n=>{let r=new Date(n.date||n.createdAt).getTime();return r>=e&&r<=t}).sort((e,t)=>new Date(e.date||e.createdAt).getTime()-new Date(t.date||t.createdAt).getTime())}getTransactionDetailSummary(e){let t=0,n=0;return e.breakout&&e.breakout.length>0&&e.breakout.forEach(e=>{t+=Number(e.weight)||0,n+=Number(e.total)||0}),{totalWeight:t,totalPrice:n}}getWhatsAppText(e){let t=`*Detalle de Movimiento*\nFecha: ${new Date(e.date||e.createdAt).toLocaleDateString(`es-AR`)}\nConcepto: ${e.description||(e.type===`DEBT`?`Despacho`:`Pago`)}\n\n`;if(e.breakout&&e.breakout.length>0){t+=`*Detalle:*
`;let n=0,r=0;e.breakout.forEach(e=>{let i=Number(e.weight)||0,a=Number(e.total)||0;n+=i,r+=a,t+=`• G#${e.garron}: ${i}kg @ $${e.price} = $${a.toLocaleString(`es-AR`)}\n`}),t+=`\n*TOTAL:* ${n.toFixed(1)}kg - $${r.toLocaleString(`es-AR`)}`}else t+=`Monto: $${(e.amount||0).toLocaleString(`es-AR`)}`;return t}getBlockingStatus(){let e=this.getBalance(),t=parseFloat(this.client.creditLimit)||0;if(t>0&&e>t)return{isBlocked:!0,reason:`Límite de crédito excedido: El saldo pendiente de $${e.toLocaleString(`es-AR`)} supera el límite máximo de $${t.toLocaleString(`es-AR`)}.`};let n=parseInt(this.client.paymentTermDays)||0;if(n>0&&e>0){let e=this.transactions.filter(e=>e.type===`DEBT`).sort((e,t)=>new Date(t.date||t.createdAt).getTime()-new Date(e.date||e.createdAt).getTime());if(e.length>0){let t=e[0],r=new Date(t.date||t.createdAt).getTime(),i=(Date.now()-r)/(1e3*60*60*24);if(i>n)return{isBlocked:!0,reason:`Plazo de pago vencido: Han transcurrido ${Math.floor(i)} días desde su última compra (Garrón #${t.breakout?.[0]?.garron||``}), superando el límite de ${n} días con saldo pendiente.`}}}return{isBlocked:!1,reason:``}}},Mr=class{constructor(e,t,n){this.travelRepository=e,this.clientRepository=n,this.ui=t,this.allFaenas=[],this.clients=[],this.categoryPrices={},this.camarasList=[],this.achurasItems=[],this.userRole=null,this.state={activeTab:`STOCK`,selectedIds:new Set,destinationInput:``,categoryPriceInputs:{},sortOrder:`asc`,stockSearch:``,tropaFilter:`ALL`,categoryFilter:`ALL`,camaraFilter:`ALL`,historyFilters:{destination:``,date:``,search:``}},this.debouncedStockSearch=kr(e=>{this.state.stockSearch=e.toLowerCase(),this.updateView()},400),this.debouncedHistorySearch=kr(e=>{this.state.historyFilters.search=e.toLowerCase(),this.updateView()},400),this.getStockSummary=new Er}setUserRole(e){this.userRole=e}async loadFaenas(e,t=!1){this.currentUid=e,t||this.ui.showLoading();try{this.allFaenas=await this.travelRepository.getFaenaStock(e),this.clients=await this.clientRepository.getClients(),this.categoryPrices=await this.clientRepository.getCategoryPrices(),this.camarasList=await this.clientRepository.getCamaras()||[],this.achurasItems=await this.travelRepository.fetchAchurasStock(e),this.allFaenas.sort((e,t)=>(t.createdAt||0)-(e.createdAt||0)),this.stockCache=this.allFaenas.filter(e=>e.status===`AVAILABLE`),this.draftCache=this.allFaenas.filter(e=>e.status===`DRAFT`),this.historyCache=this.allFaenas.filter(e=>e.status===`DISPATCHED`),this.allTropasCache=[...new Set(this.allFaenas.map(e=>String(e.tropa||``)).filter(Boolean))].sort((e,t)=>parseInt(e)-parseInt(t)),this.finishedTropasCache=this.allTropasCache.filter(e=>{let t=this.allFaenas.filter(t=>String(t.tropa||``)===e);return t.length>0&&t.every(e=>e.status===`DISPATCHED`)}),this.updateView()}catch(e){console.error(`Error loading faena stock:`,e)}finally{t||this.ui.hideLoading()}}toggleTab(e){this.state.activeTab=e,this.state.selectedIds.clear(),this.updateView()}toggleSelection(e){this.state.selectedIds.has(e)?this.state.selectedIds.delete(e):this.state.selectedIds.add(e),this._autoSuggestPrice(),this.updateView()}selectAll(e){e.forEach(e=>this.state.selectedIds.add(e)),this._autoSuggestPrice(),this.updateView()}clearSelection(){this.state.selectedIds.clear(),this.state.categoryPriceInputs={},this.updateView()}setDestination(e){this.state.destinationInput=e}setCategoryPrice(e,t){this.state.categoryPriceInputs={...this.state.categoryPriceInputs,[e]:t}}_autoSuggestPrice(){let e=this.allFaenas.filter(e=>this.state.selectedIds.has(e.id)),t={...this.state.categoryPriceInputs};e.forEach(e=>{let n=e.standardizedCategory||`OTRO`;!t[n]&&this.categoryPrices[n]&&(t[n]=String(this.categoryPrices[n]))}),this.state.categoryPriceInputs=t}toggleSort(){this.state.sortOrder=this.state.sortOrder===`asc`?`desc`:`asc`,this.updateView()}setStockSearch(e){this.state.stockSearch=e.toLowerCase(),this.debouncedStockSearch(e)}setCategoryFilter(e){this.state.categoryFilter=e,this.state.selectedIds.clear(),this.state.priceInput=``,this.updateView()}setTropaFilter(e){this.state.tropaFilter=e,this.state.selectedIds.clear(),this.state.priceInput=``,this.updateView()}setCamaraFilter(e){this.state.camaraFilter=e,this.state.selectedIds.clear(),this.updateView()}async moveSelectedToCamara(e,t){if(!(this.state.selectedIds.size===0||!t)){this.ui.showLoading();try{let n=this.allFaenas.filter(e=>this.state.selectedIds.has(e.id)).map(e=>({id:e.id,fromCamaraId:e.camaraId||null}));await this.travelRepository.moveFaenasToCamara(e,n,t),this.state.selectedIds.clear(),await this.loadFaenas(e)}catch(e){console.error(e),alert(`Error al mover a cámara: ${e.message}`),this.ui.hideLoading()}}}async dispatchSelected(e){if(this.state.selectedIds.size===0)return;let t=this.state.destinationInput.trim();if(!t){alert(`Debes ingresar un Destino / Cliente para despachar las reses.`);return}let n=this.allFaenas.filter(e=>this.state.selectedIds.has(e.id)),r={};n.forEach(e=>{let t=e.standardizedCategory||`OTRO`;r[t]||(r[t]={items:[],kg:0}),r[t].items.push(e),r[t].kg+=e.kg||0});for(let e of Object.keys(r)){let t=parseFloat(this.state.categoryPriceInputs[e]);if(isNaN(t)||t<=0){alert(`Debes ingresar un precio válido para la categoría ${e}.`);return}r[e].price=t,r[e].subtotal=r[e].kg*t}let i=Object.values(r).reduce((e,t)=>e+t.subtotal,0),a=n.reduce((e,t)=>e+(t.kg||0),0),o=Object.entries(r).map(([e,t])=>`${e}: ${t.kg.toFixed(1)} kg × $${t.price} = $${t.subtotal.toLocaleString()}`).join(`
`);if(this.userRole===`OPERARIO`){if(!confirm(`¿Confirmar PREPARACIÓN (Borrador) de ${n.length} piezas a "${t}"?\n(Un administrador deberá validarlo luego)`))return;this.ui.showLoading();try{let n=Array.from(this.state.selectedIds),i={};for(let e of Object.keys(r))i[e]=r[e].price;await this.travelRepository.prepareFaenas(e,n,{status:`DRAFT`,destination:t,draftPrices:i,draftDate:Date.now()}),this.state.selectedIds.clear(),this.state.destinationInput=``,this.state.categoryPriceInputs={},await this.loadFaenas(e)}catch(e){console.error(e),alert(`Error al guardar borrador: ${e.message}`),this.ui.hideLoading()}return}if(confirm(`¿Confirmar SALIDA DEFINITIVA de ${n.length} piezas a "${t}"?\n\n${o}\n\nTOTAL: $${i.toLocaleString()}`)){this.ui.showLoading();try{let[o,s,c,l]=await Promise.all([this.clientRepository.getClients(),this.clientRepository.getPriceLists(),this.clientRepository.getRawMaterialProducts(),this.clientRepository.getProviders()]),u=o.find(e=>e.name.toLowerCase()===t.toLowerCase());if(u){let e=new jr(u,await this.clientRepository.getTransactions(u.id)).getBlockingStatus();if(e.isBlocked){alert(`🚫 DESPACHO DENEGADO\n\nEl cliente "${u.name}" tiene su cuenta suspendida por superar los límites financieros establecidos.\n\nMotivo: ${e.reason}`),this.ui.hideLoading();return}}let d=u?u.id:`CUST_${Date.now()}`,f=!u,p=!1,m=u?u.priceListId:null;if(!m){let e=s.find(e=>e.id.toLowerCase()===t.toLowerCase()||e.name.toLowerCase()===t.toLowerCase());e&&(m=e.id,p=!0,console.log(`Matched destination "${t}" with price list "${e.name}" (ID: ${m}).`))}let h=n.map(e=>{let t=e.standardizedCategory||`OTRO`,n=r[t].price;return{id:e.id,garron:e.garron,weight:e.kg,price:n,total:(e.kg||0)*n}}),g={clientId:d,type:`DEBT`,amount:i,description:`Despacho de ${n.length} reses (${a.toFixed(1)} kg) a "${t}"`,breakout:h,date:Date.now()},_={id:Date.now()+Math.floor(Math.random()*1e3),balance:i},v=!0,y=null,b=[];if(m){let e=l.find(e=>e.name.toLowerCase()===`frigorifico pampa`&&e.priceListId===m),t;if(e){t=Number(e.id);let n=(parseFloat(e.balance)||0)+i;_={...e,balance:n},v=!1}else t=Date.now()+Math.floor(Math.random()*1e3),_={id:t,name:`frigorifico pampa`,cuit:`30-71549281-8`,contact:``,address:``,balance:i,priceListId:m},v=!0;y={clientId:String(t),type:`DEBT`,amount:i,description:`Compra por despacho de ${n.length} reses (${a.toFixed(1)} kg) de Frigorífico Pampa`,date:Date.now(),priceListId:m,createdAt:Date.now(),updatedAt:Date.now()};for(let e of n){let n=r[e.standardizedCategory||`OTRO`].price,i=1781795650161,a=(e.standardizedCategory||e.category||``).toLowerCase();if(a){let e=c.find(e=>e.name.toLowerCase().includes(a));e?i=Number(e.id):a.includes(`novillo`)||a.includes(`novillito`)?(e=c.find(e=>e.name.toLowerCase().includes(`novillo`)),e&&(i=Number(e.id))):a.includes(`vaquillona`)||a.includes(`vaq`)?(e=c.find(e=>e.name.toLowerCase().includes(`vaquillona`)||e.name.toLowerCase().includes(`vaq`)),e&&(i=Number(e.id))):a.includes(`ternera`)||a.includes(`ternero`)||a.includes(`ter`)?(e=c.find(e=>e.name.toLowerCase().includes(`ternera`)||e.name.toLowerCase().includes(`ternero`)),e&&(i=Number(e.id))):a.includes(`vaca`)?(e=c.find(e=>e.name.toLowerCase().includes(`vaca`)||e.name.toLowerCase().includes(`vacuna`)),e&&(i=Number(e.id))):(e=c.find(e=>e.name.toLowerCase().includes(`vacuna`)||e.name.toLowerCase()===`res`),e&&(i=Number(e.id)))}let o=Date.now()+Math.floor(Math.random()*1e3);b.push({id:o,rawMaterialProductId:i,providerId:t,tropaNumber:`${e.tropa} / Garrón ${e.garron}`,initialWeight:e.kg,currentWeight:e.kg,costPerKg:n,date:Date.now(),priceListId:m,isReportUploaded:!1})}}let x=n.map(e=>{let n=e.standardizedCategory||`OTRO`,i=r[n].price,a=[...e.movements||[]];return a.push({type:`DISPATCH`,to:t,date:Date.now(),price:i}),{id:e.id,movements:a}});await this.travelRepository.executeUnifiedDispatch(e,{clientId:d,destName:t,priceListId:m,isNewClient:f,shouldLinkClient:p,providerToUpdate:_,isNewProvider:v,customerTransaction:g,providerTransaction:y,rawMaterialBatches:b,carcassesToUpdate:x}),this.state.selectedIds.clear(),this.state.destinationInput=``,this.state.categoryPriceInputs={},await this.loadFaenas(e)}catch(e){console.error(e),alert(`Error al despachar: ${e.message}`),this.ui.hideLoading()}}}async dispatchAchuras(e,t,n){if(!t||t<=0)return alert(`Ingresa una cantidad válida de achuras.`);if(!n)return alert(`Selecciona un cliente/destino.`);let r=parseFloat(this.state.categoryPriceInputs.ACHURAS)||0;if(r<=0)return alert(`Debes configurar el precio de Achuras (en Configuración o ingresarlo aquí).`);let i=this.achurasItems.reduce((e,t)=>e+(t.availableQuantity||0),0);if(t>i)return alert(`Stock insuficiente. Tienes ${i} juegos disponibles.`);let a=t*r;if(confirm(`¿Confirmar SALIDA de ${t} juegos de achuras a "${n}" por $${a.toLocaleString()}?`)){this.ui.showLoading();try{await this.travelRepository.consumeAchuras(e,t);let r={clientId:await this.clientRepository.saveClient({name:n}),type:`DEBT`,amount:a,description:`Despacho de ${t} juegos de Achuras`,date:Date.now()};await this.clientRepository.addTransaction(r),this.state.destinationInput=``,await this.loadFaenas(e),alert(`Achuras despachadas con éxito.`)}catch(e){console.error(e),alert(`Error al despachar achuras: ${e.message}`),this.ui.hideLoading()}}}async confirmDraftGroup(e,t,n){if(this.userRole!==`ADMIN`){alert(`Solo Administradores pueden confirmar despachos.`);return}this.state.selectedIds.clear(),e.forEach(e=>this.state.selectedIds.add(e.id)),this.state.destinationInput=t||``,n?this.state.categoryPriceInputs={...n}:this._autoSuggestPrice(),this.state.activeTab=`STOCK`,this.updateView()}async revertDraft(e,t){if(this.userRole===`ADMIN`&&confirm(`¿Revertir este despacho preparado y devolver a Stock disponible?`)){this.ui.showLoading();try{await this.travelRepository.prepareFaenas(e,[t],{status:`AVAILABLE`,destination:null,draftPrices:null,draftDate:null}),await this.loadFaenas(e)}catch(e){console.error(e),alert(e.message),this.ui.hideLoading()}}}async editCarcassCategory(e,t,n){this.ui.showLoading();try{let r=this.allFaenas.find(t=>t.id===e);if(!r)throw Error(`No se encontró el garrón seleccionado.`);let i=r.standardizedCategory||r.category||`OTRO`,a={date:Date.now(),oldCategory:i,newCategory:t,comment:n},o=[...r.comments||[],a];await this.travelRepository.updateFaenaCategory(e,t,o),await this.loadFaenas(this.currentUid)}catch(e){console.error(e),alert(`Error al editar la categoría: ${e.message}`),this.ui.hideLoading()}}setHistoryFilter(e,t){e===`search`?(this.state.historyFilters[e]=t.toLowerCase(),this.debouncedHistorySearch(t)):(this.state.historyFilters[e]=t.toLowerCase(),this.updateView())}_applySearchAndSort(e,t){let n=e;return t&&(n=n.filter(e=>{let n=String(e.tropa||``).toLowerCase(),r=String(e.garron||``).toLowerCase(),i=String(e.kg||``).toLowerCase();return n.includes(t)||r.includes(t)||i.includes(t)})),n.sort((e,t)=>{let n=parseInt(e.garron)||0,r=parseInt(t.garron)||0;return this.state.sortOrder===`asc`?n-r:r-n}),n}async changeCarcassDestination(e,t,n){this.ui.showLoading();try{let r=(await this.clientRepository.getClients()).find(e=>e.name.toLowerCase()===t.toLowerCase());if(r){let e=new jr(r,await this.clientRepository.getTransactions(r.id)).getBlockingStatus();if(e.isBlocked){alert(`🚫 REASIGNACIÓN DENEGADA\n\nEl cliente de destino "${r.name}" tiene su cuenta suspendida por superar los límites financieros establecidos.\n\nMotivo: ${e.reason}`),this.ui.hideLoading();return}}await this.travelRepository.updateCarcassDestination(this.currentUid,e,t,n),await this.loadFaenas(this.currentUid)}catch(e){console.error(e),alert(`Error al reasignar el destino: ${e.message}`),this.ui.hideLoading()}}updateView(){let e=this.stockCache||[],t=this.draftCache||[],n=this.historyCache||[],r=this.allTropasCache||[],i=this.finishedTropasCache||[];if(this.state.historyFilters.destination){let e=this.state.historyFilters.destination;n=n.filter(t=>(t.destination||``).toLowerCase().includes(e))}this.state.historyFilters.date&&(n=n.filter(e=>e.dispatchDate?new Date(e.dispatchDate).toISOString().split(`T`)[0]===this.state.historyFilters.date:!1)),this.state.tropaFilter!==`ALL`&&(e=e.filter(e=>String(e.tropa||``)===this.state.tropaFilter),t=t.filter(e=>String(e.tropa||``)===this.state.tropaFilter),n=n.filter(e=>String(e.tropa||``)===this.state.tropaFilter)),e=this._applySearchAndSort(e,this.state.stockSearch),t=this._applySearchAndSort(t,this.state.stockSearch),n=this._applySearchAndSort(n,this.state.historyFilters.search),this.state.categoryFilter!==`ALL`&&(e=e.filter(e=>e.standardizedCategory===this.state.categoryFilter),t=t.filter(e=>e.standardizedCategory===this.state.categoryFilter),n=n.filter(e=>e.standardizedCategory===this.state.categoryFilter)),this.state.camaraFilter!==`ALL`&&(e=e.filter(e=>(e.camaraId||``)===this.state.camaraFilter),t=t.filter(e=>(e.camaraId||``)===this.state.camaraFilter));let a=(this.stockCache||[]).filter(e=>!e.camaraId).length,o={};(this.stockCache||[]).forEach(e=>{e.camaraId&&(o[e.camaraId]=(o[e.camaraId]||0)+1)});let s=this.getStockSummary.execute({stockItems:e,draftItems:t,achurasItems:this.achurasItems,selectedIds:this.state.selectedIds,categoryPriceInputs:this.state.categoryPriceInputs}),c={state:this.state,stockItems:e,draftItems:t,historyItems:n,achurasItems:this.achurasItems,faenaStockSummary:s,allTropas:r,finishedTropas:i,userRole:this.userRole,clients:this.clients,onTabSwitch:this.toggleTab.bind(this),onToggleSelection:this.toggleSelection.bind(this),onSelectAll:this.selectAll.bind(this),onClearSelection:this.clearSelection.bind(this),onDestinationInput:this.setDestination.bind(this),onDispatch:()=>{this.dispatchSelected(this.currentUid)},onDispatchAchuras:(e,t)=>{this.dispatchAchuras(this.currentUid,e,t)},onFilterChange:this.setHistoryFilter.bind(this),onToggleSort:this.toggleSort.bind(this),onStockSearch:this.setStockSearch.bind(this),onCategoryChange:this.setCategoryFilter.bind(this),onTropaChange:this.setTropaFilter.bind(this),onCategoryPriceInput:this.setCategoryPrice.bind(this),camarasList:this.camarasList,camaraOccupancy:o,unassignedCount:a,onCamaraChange:this.setCamaraFilter.bind(this),onMoveToCamara:e=>this.moveSelectedToCamara(this.currentUid,e),onConfirmDraft:(e,t,n)=>this.confirmDraftGroup(e,t,n),onRevertDraft:e=>this.revertDraft(this.currentUid,e),onEditCategory:(e,t,n)=>this.editCarcassCategory(e,t,n),onUpdateDestination:(e,t,n)=>this.changeCarcassDestination(e,t,n)};this.ui.renderFaenaConsumption(c)}},Nr=class{execute({client:e,transactions:t}){let n=new jr(e,t);return{account:n,debtTotal:n.getDebtTotal(),paymentsTotal:n.getPaymentsTotal(),balance:n.getBalance()}}},Pr=class{constructor(e,t,n){this.clientRepository=e,this.operatorRepository=t,this.ui=n,this.clients=[],this.operators=[],this.selectedClient=null,this.selectedType=`CLIENT`,this.activeTab=`CLIENTS`,this.transactions=[],this.analysisResults=null,this.analysisHistory=[],this.analysisParams={startDate:``,endDate:``,expectedPrice:0,totalSales:0},this.viewMode=`accounts`,this.getClientAccountSummary=new Nr}async loadClients(){this.ui.showLoading();try{this.clients=await this.clientRepository.getClients();let e=await this.clientRepository.getAllTransactions();for(let t of this.clients){let n=new jr(t,e.filter(e=>e.clientId===t.id));t.balance=n.getBalance();let r=n.getBlockingStatus();t.isBlocked=r.isBlocked,t.blockingReason=r.reason}if(this.operatorRepository){this.operators=await this.operatorRepository.getOperators();let e=await this.operatorRepository.getAllTransactions();for(let t of this.operators){let n=new jr(t,e.filter(e=>e.operatorId===t.id));t.balance=n.getBalance();let r=n.getBlockingStatus();t.isBlocked=r.isBlocked,t.blockingReason=r.reason}}this.render()}catch(e){this.ui.showError(`Error al cargar clientes: `+e.message)}finally{this.ui.hideLoading()}}async selectClient(e,t=`CLIENT`){this.selectedClient=e,this.selectedType=t,this.ui.showLoading();try{t===`CLIENT`?this.transactions=await this.clientRepository.getTransactions(e.id):this.transactions=await this.operatorRepository.getTransactions(e.id),this.transactions.sort((e,t)=>(t.createdAt||0)-(e.createdAt||0)),this.render()}catch(e){this.ui.showError(`Error al cargar transacciones: `+e.message)}finally{this.ui.hideLoading()}}async addPayment(e,t,n){if(this.selectedClient){this.ui.showLoading();try{let r={clientId:this.selectedClient.id,operatorId:this.selectedClient.id,type:`PAYMENT`,amount:parseFloat(e),description:t,receivedBy:n,date:Date.now()};this.selectedType===`CLIENT`?await this.clientRepository.addTransaction(r):await this.operatorRepository.addTransaction(r),await this.selectClient(this.selectedClient,this.selectedType),await this.loadClients()}catch(e){this.ui.showError(`Error al registrar pago: `+e.message)}finally{this.ui.hideLoading()}}}async addSale(e,t){if(this.selectedClient){this.ui.showLoading();try{let n={clientId:this.selectedClient.id,operatorId:this.selectedClient.id,type:`DEBT`,amount:parseFloat(e),description:t,date:Date.now()};this.selectedType===`CLIENT`?await this.clientRepository.addTransaction(n):await this.operatorRepository.addTransaction(n),await this.selectClient(this.selectedClient,this.selectedType),await this.loadClients()}catch(e){this.ui.showError(`Error al registrar venta: `+e.message)}finally{this.ui.hideLoading()}}}async saveClient(e,t=`CLIENT`){this.ui.showLoading();try{t===`CLIENT`?await this.clientRepository.saveClient(e):await this.operatorRepository.saveOperator(e),await this.loadClients()}catch(e){this.ui.showError(`Error al guardar cliente: `+e.message)}finally{this.ui.hideLoading()}}render(){let e=null;this.selectedClient&&(e=this.getClientAccountSummary.execute({client:this.selectedClient,transactions:this.transactions})),this.ui.renderClientAccounts({clients:this.clients,operators:this.operators,selectedClient:this.selectedClient,selectedType:this.selectedType,activeTab:this.activeTab,transactions:this.transactions,accountSummary:e,onSelectClient:this.selectClient.bind(this),onAddPayment:this.addPayment.bind(this),onAddSale:this.addSale.bind(this),onAnalyzePrice:this.openPriceAnalysis.bind(this),onSaveClient:this.saveClient.bind(this),onViewSaleDetail:this.viewSaleDetail.bind(this),onTabChange:e=>{this.activeTab=e,this.render()},onBack:()=>{this.viewMode===`analysis`?(this.viewMode=`accounts`,this.render()):(this.selectedClient=null,this.render())}}),this.viewMode===`analysis`&&this.ui.renderPriceAnalysis({client:this.selectedClient,faenas:this.analysisFaenas,payments:this.analysisPayments,history:this.analysisHistory,analysis:this.analysisParams,results:this.analysisResults,onRunAnalysis:this.runPriceAnalysis.bind(this),onSaveAnalysis:this.saveAnalysis.bind(this),onSelectHistory:this.selectHistoryAnalysis.bind(this),onBack:()=>{this.viewMode=`accounts`,this.render()}})}async openPriceAnalysis(){if(this.selectedClient){this.viewMode=`analysis`,this.analysisResults=null,this.analysisFaenas=[],this.analysisPayments=[],this.ui.showLoading();try{this.analysisHistory=await this.clientRepository.getPriceAnalyses(this.selectedClient.id),this.render()}catch(e){this.ui.showError(`Error al cargar historial: `+e.message)}finally{this.ui.hideLoading()}}}async runPriceAnalysis(e){this.analysisParams=e,this.ui.showLoading();try{let[t,n]=await Promise.all([this.clientRepository.getDispatchedFaenas(this.selectedClient.name,e.startDate,e.endDate),this.clientRepository.getTransactionsInRange(this.selectedClient.id,e.startDate,e.endDate)]),r=t.reduce((e,t)=>e+(t.kg||0),0),i=n.filter(e=>e.type===`PAYMENT`).reduce((e,t)=>e+(t.amount||0),0),a=r>0?e.totalSales/r:0;this.analysisFaenas=t,this.analysisPayments=n.filter(e=>e.type===`PAYMENT`),this.analysisResults={...e,totalKg:r,totalPayments:i,actualPrice:a,clientId:this.selectedClient.id,clientName:this.selectedClient.name},this.render()}catch(e){this.ui.showError(`Error al ejecutar análisis: `+e.message)}finally{this.ui.hideLoading()}}async saveAnalysis(e){this.ui.showLoading();try{await this.clientRepository.savePriceAnalysis(e),this.analysisHistory=await this.clientRepository.getPriceAnalyses(this.selectedClient.id),this.render(),alert(`Análisis guardado con éxito.`)}catch(e){this.ui.showError(`Error al guardar análisis: `+e.message)}finally{this.ui.hideLoading()}}selectHistoryAnalysis(e){this.analysisParams={startDate:e.startDate,endDate:e.endDate,expectedPrice:e.expectedPrice,totalSales:e.totalSales},this.analysisResults=e,this.analysisFaenas=[],this.analysisPayments=[],this.render()}async viewSaleDetail(e,t){document.body.style.cursor=`wait`;try{let n=await this.clientRepository.getSaleById(e);if(!n){alert(`No se encontró la venta con ID: `+e);return}let r=await this.clientRepository.getProducts(),i={};r.forEach(e=>{i[e.id]=e}),this.ui.renderSaleDetailModal(n,i,t)}catch(e){alert(`Error al cargar detalle de venta: `+e.message)}finally{document.body.style.cursor=`default`}}};async function Fr(e){try{return(await I.accounting_entries.where(`type`).equals(e).toArray()).sort((e,t)=>(t.date||t.createdAt||0)-(e.date||e.createdAt||0))}catch(t){return console.error(`Error al leer asientos locales para ${e}:`,t),[]}}async function Ir(e,t,n=`accounting_entries`){return Fr(n)}async function Lr(e,t,n,r=`accounting_entries`){if(!t)throw Error(`UID is required to save an accounting entry`);let i=a(e,r),o,{id:s,...c}=n,u=Date.now(),d={...c,ownerUid:t,updatedAt:u},f=s;s?(o=C(e,r,s),await l(o,d)):(d.createdAt=u,o=await v(i,d),f=o.id);try{await I.accounting_entries.put({id:f,type:r,createdAt:d.createdAt||u,...d})}catch(e){console.warn(`[AccountingApi] Error escribiendo asiento contable local:`,e)}return f}async function Rr(e,t,n=`accounting_entries`){await o(C(e,n,t));try{await I.accounting_entries.delete(t)}catch(e){console.warn(`[AccountingApi] Error eliminando asiento contable local:`,e)}}async function zr(e,t){let n=await b(g(a(e,`transactions`),r(`accountingEntryId`,`==`,t)));for(let t of n.docs)await o(C(e,`transactions`,t.id))}async function Br(e,t,n){let i=a(e,`transactions`),o=await b(g(i,r(`accountingEntryId`,`==`,t)));if(o.empty)await v(i,{...n,accountingEntryId:t,createdAt:Date.now()});else{let t=o.docs[0].id;await l(C(e,`transactions`,t),{...n,updatedAt:Date.now()})}}var Vr=class{constructor(){}async getClients(){return se(P)}async saveClient(e){return le(P,e)}async getCategoryPrices(){return ue(P)}async saveCategoryPrices(e){return de(P,e)}async getCamaras(){return gr(P)}async saveCamaras(e){return _r(P,e)}async getTransactions(e){return fe(P,e)}async getAllTransactions(){return pe(P)}async addTransaction(e){return me(P,e)}async syncAccountingToTransaction(e,t){return Br(P,e,t)}async syncCheckTransaction(e,t,n){return he(P,`transactions`,e,t,n)}async getDispatchedFaenas(e,t,n){return dr(P,e,t,n)}async getTransactionsInRange(e,t,n){return ge(P,e,t,n)}async savePriceAnalysis(e){return _e(P,e)}async getPriceAnalyses(e){return ve(P,e)}async getSaleById(e){return ye(P,e)}async getProducts(){return $n(P)}async getRawMaterialProducts(){return er(P)}async getProviders(){return tr(P)}async saveProviderDirectly(e){return nr(P,e)}async getPriceLists(){return ir(P)}};async function Hr(){try{return(await I.check_operations.toArray()).sort((e,t)=>(t.createdAt||0)-(e.createdAt||0))}catch(e){return console.error(`Error al leer cheques locales:`,e),[]}}async function Ur(e,t){return Hr()}async function Wr(e,t,n){if(!t)throw Error(`UID is required to save check operation`);let r=a(e,`check_operations`),i,{id:o,...s}=n,c=Date.now(),u={...s,ownerUid:t,updatedAt:c},d=o;o?(i=C(e,`check_operations`,o),await l(i,u)):(u.createdAt=c,i=await v(r,u),d=i.id);try{await I.check_operations.put({id:d,createdAt:u.createdAt||c,...u})}catch(e){console.warn(`[CheckApi] Error escribiendo cheque local:`,e)}return d}async function Gr(e,t){await o(C(e,`check_operations`,t));try{await I.check_operations.delete(t)}catch(e){console.warn(`[CheckApi] Error eliminando cheque local:`,e)}}function Kr(e,t,n,r){return console.log(`[CheckApi] subscribeToCheckOperations is now a Local-First stub.`),Hr().then(n).catch(r),()=>{}}var qr=class{constructor(){}async fetchChecks(e){return Ur(P,e)}async saveCheck(e,t){return Wr(P,e,t)}async deleteCheck(e){return Gr(P,e)}async getContacts(){return se(P)}async getTravels(e){return qn(P,e)}subscribeChecks(e,t,n){return Kr(P,e,t,n)}},Jr=class{execute(e){let t=e.map(e=>{let t=new Tt(e);return t.calculate(),t}),n=t.filter(e=>e.isPortfolio),r=t.filter(e=>e.isHistory),i=t.reduce((e,t)=>e+t.profit,0),a=n.reduce((e,t)=>e+t.nominalValue,0),o=n.reduce((e,t)=>e+t.purchaseDiscount,0),s=n.filter(e=>e.getAlertState().code===`EXPIRING_URGENT`);return{domainChecks:t,portfolioChecks:n,historyChecks:r,totalProfit:i,totalInPortfolio:a,totalPortfolioDiscount:o,portfolioChecksCount:n.length,expiringChecks:s}}},Yr=class{constructor(e,t,n,r){this.checkRepository=e,this.ui=t,this.operatorRepository=n,this.clientRepository=r,this.checks=[],this.contacts=[],this.buyContacts=[],this.operators=[],this.currentUserUid=null,this.checksUnsubscribe=null,this.filters={startDate:``,endDate:``,dateFilterType:`DUE`,searchTerm:``,sortPortfolioAsc:!0,onlyNominal:!1,historyStatusFilter:`ALL`,checkType:`ALL`},this.pagination={portfolioPage:1,historyPage:1,itemsPerPage:50}}setUid(e){this.currentUserUid=e}async loadData(){this.ui.showLoading(),localStorage.getItem(`checks_contacts`)&&localStorage.removeItem(`checks_contacts`);try{let e=await this.checkRepository.getContacts(),t=await this.checkRepository.getTravels(this.currentUserUid),n=this.extractUniqueProducers(t),r=[];this.operatorRepository&&(r=await this.operatorRepository.getOperators()),this.operators=r.map(e=>({...e,isOperator:!0})),this.buyContacts=[...this.operators].sort((e,t)=>(e.name||``).localeCompare(t.name||``));let i=new Map;e.forEach(e=>i.set(e.id||e.name,e)),n.forEach(e=>{let t=e.cuit||e.name;i.has(t)||i.set(t,{id:e.cuit||e.name,name:e.name,cuit:e.cuit,isProducer:!0})}),r.forEach(e=>{let t=e.cuit||e.name||e.id;i.has(t)||i.set(t,{id:e.id||e.name,name:e.name,cuit:e.cuit,isOperator:!0})}),this.contacts=Array.from(i.values()).sort((e,t)=>(e.name||``).localeCompare(t.name||``));let a=await this.checkRepository.fetchChecks(this.currentUserUid),o=!1;if(!this.checks||this.checks.length!==a.length)o=!0;else{let e=new Map(this.checks.map(e=>[e.id,e.updatedAt||e.timestamp||0]));for(let t of a){let n=e.get(t.id);if(n===void 0||n!==(t.updatedAt||t.timestamp||0)){o=!0;break}}}(o||!this.checks)&&(this.checks=a),this.ui.hideLoading(),this.render()}catch(e){this.ui.showError(`Error al cargar cheques: `+e.message),this.ui.hideLoading()}}applyFilters(e){this.filters={...this.filters,...e},this.pagination.portfolioPage=1,this.pagination.historyPage=1,this.render()}setPortfolioPage(e){this.pagination.portfolioPage=e,this.render()}setHistoryPage(e){this.pagination.historyPage=e,this.render()}extractUniqueProducers(e){let t=new Map;return e?(e.forEach(e=>{(e.buy?.listOfProducers||[]).forEach(e=>{let n=String(e.cuit||e.producer?.cuit||``).replace(/\D/g,``),r=e.name||e.producer?.name||`Productor`;n&&!t.has(n)&&t.set(n,{cuit:n,name:r})})}),Array.from(t.values())):[]}getFilteredChecks(){return this.checks.filter(e=>{let t=!0;if(this.filters.startDate&&this.filters.endDate){let n=this.filters.dateFilterType===`RECEPTION`?e.receptionDate:e.dueDate;if(!n)t=!1;else{let e=n.split(`T`)[0];(e<this.filters.startDate||e>this.filters.endDate)&&(t=!1)}}if(t&&this.filters.checkType&&this.filters.checkType!==`ALL`){let n=!!e.isECheck;(this.filters.checkType===`ECHECK`&&!n||this.filters.checkType===`PAPER`&&n)&&(t=!1)}if(t&&this.filters.searchTerm){let n=this.filters.searchTerm.toLowerCase(),r=(e.bank||``).toLowerCase(),i=(e.checkNumber||``).toLowerCase(),a=String(e.nominalValue||``),o=(e.issuerName||``).toLowerCase(),s=(e.issuerCuit||``).toLowerCase(),c=(this.contacts.find(t=>t.id===e.buySide?.contactId)?.name||``).toLowerCase(),l=(this.contacts.find(t=>t.id===e.sellSide?.contactId)?.name||``).toLowerCase();!r.includes(n)&&!i.includes(n)&&!a.includes(n)&&!o.includes(n)&&!s.includes(n)&&!c.includes(n)&&!l.includes(n)&&(t=!1)}return t})}async exportData(e,t){let n=this.checks.filter(n=>{let r=n.receptionDate?n.receptionDate.split(`T`)[0]:``,i=n.dueDate?n.dueDate.split(`T`)[0]:``;return r>=e&&r<=t||i>=e&&i<=t});if(n.length===0){this.ui.showError(`No hay cheques en el rango seleccionado para exportar.`);return}this.ui.generateChecksExcel(n,this.contacts)}printList(e,t=null){if(!e||e.length===0){this.ui.showError(`No hay cheques en esta lista para imprimir.`);return}let n=null,r=null;this.filters.startDate&&(n=new Date(this.filters.startDate+`T00:00:00`)),this.filters.endDate&&(r=new Date(this.filters.endDate+`T23:59:59`));let i={fromDate:n,toDate:r};t&&(i.title=t,i.subtitle=`Cheques Seleccionados`),this.ui.printChecksReport(e,this.contacts,i)}async saveOperation(e){this.ui.showLoading();try{let t=this.calculateOperation(e),n=await this.checkRepository.saveCheck(this.currentUserUid,t);t.id=t.id||n,await this.syncTransactions(t),await this.loadData()}catch(e){this.ui.showError(`Error al guardar operación: `+e.message)}finally{this.ui.hideLoading()}}async deleteOperation(e){if(confirm(`¿Está seguro de eliminar esta operación?`)){this.ui.showLoading();try{await this.checkRepository.deleteCheck(e),await this.deleteTransactions(e),await this.loadData()}catch(e){this.ui.showError(`Error al eliminar: `+e.message)}finally{this.ui.hideLoading()}}}async syncTransactions(e){if(!(!this.operatorRepository||!this.clientRepository)){if(e.buySide&&e.buySide.contactId){if(this.operators.some(t=>t.id===e.buySide.contactId||t.name===e.buySide.contactId)){let t=e.receptionDate?new Date(e.receptionDate+`T00:00:00`).getTime():Date.now(),n={operatorId:e.buySide.contactId,type:`PAYMENT`,amount:e.buySide.netAmount||0,description:`Ingreso Cheque N°${e.checkNumber} (${e.bank})`,date:t};await this.operatorRepository.syncCheckTransaction(e.id,`BUY`,n)}}else await this.operatorRepository.syncCheckTransaction(e.id,`BUY`,null);if(e.sellSide&&e.sellSide.status===`SOLD`&&e.sellSide.contactId){let t={type:`DEBT`,amount:e.sellSide.netAmount||0,description:`Salida Cheque N°${e.checkNumber} (${e.bank})`,date:e.sellSide.date?new Date(e.sellSide.date).getTime():Date.now()};this.operators.some(t=>t.id===e.sellSide.contactId||t.name===e.sellSide.contactId)?(t.operatorId=e.sellSide.contactId,await this.operatorRepository.syncCheckTransaction(e.id,`SELL`,t),await this.clientRepository.syncCheckTransaction(e.id,`SELL`,null)):(t.clientId=e.sellSide.contactId,await this.clientRepository.syncCheckTransaction(e.id,`SELL`,t),await this.operatorRepository.syncCheckTransaction(e.id,`SELL`,null))}else await this.clientRepository.syncCheckTransaction(e.id,`SELL`,null),await this.operatorRepository.syncCheckTransaction(e.id,`SELL`,null)}}async deleteTransactions(e){!this.operatorRepository||!this.clientRepository||(await this.operatorRepository.syncCheckTransaction(e,`BUY`,null),await this.operatorRepository.syncCheckTransaction(e,`SELL`,null),await this.clientRepository.syncCheckTransaction(e,`SELL`,null))}calculateOperation(e){let t=new Tt(e);return t.calculate(),{...e,isECheck:t.isECheck,days:t.days,expireAt:t.expireAt,buySide:t.buySide?{...t.buySide}:null,sellSide:t.sellSide?{...t.sellSide}:null,profit:t.profit}}async saveBatchBuy(e){this.ui.showLoading();try{let t=`CMP-`+Date.now().toString(36).toUpperCase()+Math.random().toString(36).substring(2,6).toUpperCase(),n=new Date().toISOString();for(let r of e){r.buySide||={},r.buySide.operationId=t,r.buySide.date=n;let e=this.calculateOperation(r),i=await this.checkRepository.saveCheck(this.currentUserUid,e);e.id=e.id||i,await this.syncTransactions(e)}await this.loadData()}catch(e){this.ui.showError(`Error al guardar lote de cheques: `+e.message)}finally{this.ui.hideLoading()}}async saveBatchSell(e,t){this.ui.showLoading();try{let n=`VTA-`+Date.now().toString(36).toUpperCase()+Math.random().toString(36).substring(2,6).toUpperCase(),r=new Date().toISOString();for(let i of t){let t=this.checks.find(e=>e.id===i);if(!t)continue;let a={...t,sellSide:{...t.sellSide,...e,operationId:n,date:r}},o=this.calculateOperation(a),s=await this.checkRepository.saveCheck(this.currentUserUid,o);o.id=o.id||s,await this.syncTransactions(o)}await this.loadData()}catch(e){this.ui.showError(`Error al guardar venta masiva: `+e.message)}finally{this.ui.hideLoading()}}async undoSaleOperation(e){if(confirm(`¿Está seguro de deshacer la venta con ID ${e}? Los cheques volverán a cartera y se eliminarán sus registros contables.`)){this.ui.showLoading();try{let t=this.checks.filter(t=>t.sellSide?.operationId===e);if(t.length===0)throw Error(`No se encontraron cheques asociados a esta operación de venta.`);for(let e of t){let t={...e,sellSide:{status:`PENDING`,contactId:``,pesificacionRate:0,monthlyInterest:0,netAmount:0,backReason:``,operationId:``,date:null}},n=this.calculateOperation(t);await this.checkRepository.saveCheck(this.currentUserUid,n),await this.syncTransactions(n)}await this.loadData(),alert(`Venta deshecha con éxito. Los cheques volvieron a estar en cartera.`)}catch(e){this.ui.showError(`Error al deshacer la venta: `+e.message)}finally{this.ui.hideLoading()}}}render(){let e=new Jr,t=e.execute(this.checks),n=e.execute(this.getFilteredChecks());this.ui.renderChecks({checks:t.domainChecks,filteredChecks:n.domainChecks,globalSummary:t,filteredSummary:n,filters:this.filters,pagination:this.pagination,contacts:this.contacts,buyContacts:this.buyContacts,onFilterChange:this.applyFilters.bind(this),onSave:this.saveOperation.bind(this),onDelete:this.deleteOperation.bind(this),onRefresh:this.loadData.bind(this),onExport:this.exportData.bind(this),onPrint:this.printList.bind(this),onBatchBuy:this.saveBatchBuy.bind(this),onBatchSell:this.saveBatchSell.bind(this),onUndoSale:this.undoSaleOperation.bind(this),onPortfolioPageChange:this.setPortfolioPage.bind(this),onHistoryPageChange:this.setHistoryPage.bind(this)})}};async function Xr(e){let t=`establishments`,n=V(t);if(n)return n;let r=(await b(a(e,`establishments`))).docs.map(e=>({id:e.id,...e.data()}));return H(t,r,B),r}async function Zr(e,t){let n=a(e,`establishments`),r,{id:i,...o}=t,s={...o,updatedAt:Date.now()};return i?(r=C(e,`establishments`,i),await l(r,s)):(s.createdAt=Date.now(),r=await v(n,s)),U(`establishments`),r.id}async function Qr(e,t){await o(C(e,`establishments`,t)),U(`establishments`)}async function $r(e,t){if(!t)throw Error(`establishmentId is required to fetch employees`);let n=`employees:${t}`,r=V(n);if(r)return r;let i=(await b(a(e,`establishments`,t,`employees`))).docs.map(e=>({id:e.id,...e.data()}));return H(n,i,B),i}async function ei(e,t,n){if(!t)throw Error(`establishmentId is required to save an employee`);let r=a(e,`establishments`,t,`employees`),i,{id:o,...s}=n,c={...s,updatedAt:Date.now()};return o?(i=C(e,`establishments`,t,`employees`,o),await l(i,c)):(c.createdAt=Date.now(),i=await v(r,c)),U(`employees:${t}`),i.id}async function ti(e,t,n){if(!t||!n)throw Error(`establishmentId and employeeId are required`);await o(C(e,`establishments`,t,`employees`,n)),U(`employees:${t}`)}var ni=class{constructor(e=`accounting_entries`){this.collectionName=e}async fetchEntries(e){return Ir(P,e,this.collectionName)}async saveEntry(e,t){return Lr(P,e,t,this.collectionName)}async deleteEntry(e){return Rr(P,e,this.collectionName)}async getCashExtractions(){return Yt(P)}async updateExtractionStatus(e,t,n=null){return Zt(P,e,t,n)}async getClients(){return se(P)}async getTravels(e){return qn(P,e)}async getEstablishments(){return Xr(P)}async getEmployees(e){return $r(P,e)}async removeLinkedTransaction(e){return zr(P,e)}};async function ri(e,t){let n=await fetch(`/api/pipeline-atribucion?desde=${encodeURIComponent(e)}&hasta=${encodeURIComponent(t)}`),r=await n.json();if(!n.ok||!r.success)throw Error(r.error||`Error al ejecutar pipeline de atribución contable ARCA`);return r.data||[]}async function ii(e,t){let n=await fetch(`/api/pipeline-emitidos?desde=${encodeURIComponent(e)}&hasta=${encodeURIComponent(t)}`),r=await n.json();if(!n.ok||!r.success)throw Error(r.error||`Error al ejecutar pipeline de comprobantes emitidos ARCA`);return r.data||[]}var ai=class{constructor(e,t,n,r={}){this.accountingRepository=e,this.clientRepository=t,this.ui=n,this.db=r.db,this.title=r.title||`Caja General`,this.syncLabel=r.syncLabel||`Pago Caja General`,this.entries=[],this.clients=[],this.producers=[],this.establishments=[],this.extractions=[],this.selectedExtraction=null,this.extractionScreenMode=null,this.salaryPaymentPayload=null,this.isSalaryPaymentActive=!1,this.currentUserUid=null,this.currentUserRole=`VISOR`,this.activeTab=`journal`,this.currentPage=1,this.itemsPerPage=15,this.filters={startDate:null,endDate:null,searchTerm:``}}setUid(e){this.currentUserUid=e}setUserRole(e){this.currentUserRole=e||`VISOR`}async loadData(){this.ui.showLoading();try{let[e,t,n,r,i]=await Promise.all([this.accountingRepository.fetchEntries(this.currentUserUid),this.accountingRepository.getClients(),this.accountingRepository.getTravels(this.currentUserUid),this.accountingRepository.getEstablishments(),this.accountingRepository.getCashExtractions().catch(e=>(console.warn(`Error cargando cash_extractions:`,e),[]))]);this.entries=e,this.entries.sort((e,t)=>(t.createdAt||0)-(e.createdAt||0)),this.clients=t,this.producers=this.extractUniqueProducers(n),this.establishments=r,this.extractions=i,this.establishments&&this.establishments.length>0&&await Promise.all(this.establishments.map(async e=>{e.employees=await this.accountingRepository.getEmployees(e.id)})),this.render()}catch(e){this.ui.showError(`Error al cargar datos contables: `+e.message)}finally{this.ui.hideLoading()}}setActiveTab(e){this.activeTab=e,this.selectedExtraction=null,this.extractionScreenMode=null,this.render()}openExtractionControlScreen(e){this.selectedExtraction=e,this.extractionScreenMode=`control`,this.render()}openExtractionDetailScreen(e){this.selectedExtraction=e,this.extractionScreenMode=`detail`,this.render()}closeExtractionScreen(){this.selectedExtraction=null,this.extractionScreenMode=null,this.render()}openSalaryPaymentScreen(e=null){this.salaryPaymentPayload=e,this.isSalaryPaymentActive=!0,this.render()}closeSalaryPaymentScreen(){this.salaryPaymentPayload=null,this.isSalaryPaymentActive=!1,this.render()}async saveExtractionEntry({entryData:e,extractionId:t}){if(this.currentUserRole!==`ADMIN`){alert(`⚠️ Acción restringida a usuarios con rol ADMINISTRADOR.`);return}this.ui.showLoading();try{let n=await this.accountingRepository.saveEntry(this.currentUserUid,e);await this.accountingRepository.updateExtractionStatus(t,`ACCEPTED`,n),this.selectedExtraction=null,this.extractionScreenMode=null,await this.loadData()}catch(e){this.ui.showError(`Error al dar ingreso a la extracción: `+e.message)}finally{this.ui.hideLoading()}}applyFilters(e){this.filters={...this.filters,...e},this.currentPage=1,this.render()}setPage(e){this.currentPage=e,this.render()}getFilteredEntries(){return this.entries.filter(e=>{if(this.filters.startDate){let t=new Date(this.filters.startDate).setHours(0,0,0,0);if((e.createdAt||0)<t)return!1}if(this.filters.endDate){let t=new Date(this.filters.endDate).setHours(23,59,59,999);if((e.createdAt||0)>t)return!1}if(this.filters.searchTerm){let t=this.filters.searchTerm.toLowerCase(),n=String(e.amount||``),r=(e.description||``).toLowerCase(),i=(e.clientName||``).toLowerCase(),a=(e.producerName||``).toLowerCase();if(!(n.includes(t)||r.includes(t)||i.includes(t)||a.includes(t)))return!1}return!0})}extractUniqueProducers(e){let t=new Map;return e.forEach(e=>{(e.buy?.listOfProducers||[]).forEach(e=>{let n=String(e.cuit||e.producer?.cuit||``).replace(/\D/g,``),r=e.name||e.producer?.name||`Productor`;n&&!t.has(n)&&t.set(n,{cuit:n,name:r})})}),Array.from(t.values()).sort((e,t)=>e.name.localeCompare(t.name))}async saveEntry(e){this.ui.showLoading();try{let t=await this.accountingRepository.saveEntry(this.currentUserUid,e);if(e.type===`IN`&&e.clientId){let n={clientId:e.clientId,type:`PAYMENT`,amount:e.amount,description:`[${this.syncLabel}] ${e.description||``}`,date:e.date||Date.now()};await this.clientRepository.syncAccountingToTransaction(t,n)}else await this.accountingRepository.removeLinkedTransaction(t);e.isSalary&&e.selectedLogIds&&e.selectedLogIds.length>0&&await Ln(this.db,e.selectedLogIds,t),this.salaryPaymentPayload=null,this.isSalaryPaymentActive=!1,await this.loadData()}catch(e){this.ui.showError(`Error al guardar movimiento: `+e.message)}finally{this.ui.hideLoading()}}async exportData(e,t){let n=new Date(e+`T00:00:00`).getTime(),r=new Date(t+`T23:59:59`).getTime(),i=this.entries.filter(e=>{let t=new Date(e.createdAt).getTime();return t>=n&&t<=r}).sort((e,t)=>new Date(e.createdAt).getTime()-new Date(t.createdAt).getTime());if(i.length===0){this.ui.showError(`No hay movimientos en el rango seleccionado para exportar.`);return}this.ui.generateAccountingExcel(i,this.title)}async deleteEntry(e){if(confirm(`¿Eliminar este movimiento?`)){this.ui.showLoading();try{await this.accountingRepository.deleteEntry(e),await this.loadData()}catch(e){this.ui.showError(`Error al eliminar: `+e.message)}finally{this.ui.hideLoading()}}}async fetchArcaPipeline(e,t){this.ui.showLoading();try{return await ri(e,t)}catch(e){return this.ui.showError(`Error al consultar comprobantes ARCA: `+e.message),[]}finally{this.ui.hideLoading()}}async saveArcaEntries(e){if(!(!e||e.length===0)){this.ui.showLoading();try{for(let t of e){let e=Number(t.importeTotal||t.importe||t.total||0),n=t.fecha||t.fechaEmision||new Date().toISOString().split(`T`)[0],r=t.cuitEmisor||t.cuit||``,i=t.razonSocialEmisor||t.razonSocial||`CUIT ${r}`,a={type:`OUT`,amount:e,description:`[ARCA / ${t.tipoComprobante||`Factura`} N° ${t.numero||t.numeroComprobante||``}] ${i} - ${t.cuentaSugerida?.nombre||`Gastos Generales`}`,date:n,category:t.cuentaSugerida?.nombre||`Gastos Generales`,accountCode:t.cuentaSugerida?.codigo||`5.9.99`,cuitEmisor:r,leyendaTransparencia:t.leyendaTransparencia||`Régimen de Transparencia Fiscal Ley 27.743`,source:`ARCA_IMPORT`};await this.accountingRepository.saveEntry(this.currentUserUid,a)}await this.loadData()}catch(e){this.ui.showError(`Error al importar asientos contables de ARCA: `+e.message)}finally{this.ui.hideLoading()}}}async fetchIssuedArcaPipeline(e,t){this.ui.showLoading();try{return await ii(e,t)}catch(e){return this.ui.showError(`Error al consultar comprobantes emitidos ARCA: `+e.message),[]}finally{this.ui.hideLoading()}}async linkIssuedInvoiceToClient({invoice:e,clientId:t}){if(!(!e||!t)){this.ui.showLoading();try{let n=Number(e.importeTotal||e.importe||e.total||0),r=e.fecha||e.fechaEmision||Date.now(),i=e.tipoComprobante||`Factura`,a=e.numero||e.numeroComprobante||``,o={clientId:t,type:`SALE`,amount:n,description:`[Venta ARCA / ${i} N° ${a}]`,date:r,arcaRef:e.id||a,cuitReceptor:e.cuitReceptor||``};await this.clientRepository.syncAccountingToTransaction(`ARCA_SALE_${Date.now()}`,o),this.ui.showSuccess?this.ui.showSuccess(`Comprobante vinculado a la cuenta corriente del cliente.`):alert(`Comprobante vinculado a la cuenta corriente del cliente.`)}catch(e){this.ui.showError(`Error al vincular comprobante a cuenta corriente: `+e.message)}finally{this.ui.hideLoading()}}}render(){let e=this.getFilteredEntries(),t=e.length,n=Math.ceil(t/this.itemsPerPage);this.currentPage>n&&n>0&&(this.currentPage=n);let r=(this.currentPage-1)*this.itemsPerPage,i=e.slice(r,r+this.itemsPerPage);this.ui.renderAccounting({title:this.title,activeTab:this.activeTab,userRole:this.currentUserRole,selectedExtraction:this.selectedExtraction,extractionScreenMode:this.extractionScreenMode,isSalaryPaymentActive:this.isSalaryPaymentActive,salaryPaymentPayload:this.salaryPaymentPayload,entries:i,allEntries:this.entries,filteredEntries:e,extractions:this.extractions,clients:this.clients,producers:this.producers,establishments:this.establishments,pagination:{currentPage:this.currentPage,totalPages:n,totalItems:t,onPageChange:this.setPage.bind(this)},filters:this.filters,onTabChange:e=>this.setActiveTab(e),onOpenControlScreen:e=>this.openExtractionControlScreen(e),onOpenDetailScreen:e=>this.openExtractionDetailScreen(e),onCloseExtractionScreen:()=>this.closeExtractionScreen(),onOpenSalaryPaymentScreen:e=>this.openSalaryPaymentScreen(e),onCloseSalaryPaymentScreen:()=>this.closeSalaryPaymentScreen(),onFilterChange:this.applyFilters.bind(this),onSave:e=>this.saveEntry(e),onSaveExtractionEntry:e=>this.saveExtractionEntry(e),onDelete:e=>this.deleteEntry(e),onRefresh:()=>this.loadData(),onExport:(e,t)=>this.exportData(e,t),onFetchArcaPipeline:(e,t)=>this.fetchArcaPipeline(e,t),onSaveArcaEntries:e=>this.saveArcaEntries(e),onFetchIssuedArcaPipeline:(e,t)=>this.fetchIssuedArcaPipeline(e,t),onLinkIssuedInvoiceToClient:e=>this.linkIssuedInvoiceToClient(e)})}},oi=`master_data`,si=`travels`;function ci(){return F.currentUser?F.currentUser.uid:`unknown_user`}function li(e){let t=e.data();if(!t||!t.data)return null;try{return JSON.parse(t.data)}catch(t){return console.error(`Error parsing data for doc ${e.id}:`,t),null}}function ui(e,t,n){return{id:`${t}_${e}`,type:t,updatedAt:Date.now(),userId:ci(),data:JSON.stringify(n)}}function di(e){return{id:String(e.id),updatedAt:Date.now(),userId:ci(),data:JSON.stringify(e)}}async function fi(e){let t=await b(g(a(P,oi),r(`type`,`==`,e))),n=[];return t.forEach(e=>{let t=li(e);t&&n.push(t)}),n}async function pi(e=20,t=null){let n=a(P,oi),i;i=t?g(n,r(`type`,`==`,`PRODUCER`),u(t),s(e)):g(n,r(`type`,`==`,`PRODUCER`),s(e));let o=await b(i),c=[],l=null;return o.empty||(l=o.docs[o.docs.length-1],o.forEach(e=>{let t=li(e);t&&c.push(t)})),{results:c,lastVisible:l,hasMore:o.docs.length===e}}async function mi(){return fi(`DRIVER`)}async function hi(){return fi(`TRAILER`)}async function gi(){return fi(`TRUCK`)}async function _i(e,t,n){let r=`${t}_${e}`,i=ui(e,t,n);return await p(C(P,oi,r),i),n}async function vi(e,t){await o(C(P,oi,`${t}_${e}`))}async function yi(){let e=await f(C(P,oi,`APP_CONFIG_default`));if(e.exists()){let t=li(e);if(t)return t}return{id:`default`,defaultDriverPricePerKmSimple:150,defaultDriverPricePerKmDouble:200,defaultFreightPricePerKm:500,fuelPrice:1e3,simulationFreightPriceSimple:2500,simulationFreightPriceDouble:3100}}async function bi(){let e=await b(a(P,si)),t=[];return e.forEach(e=>{let n=li(e);n&&t.push(n)}),t}async function xi(e){let t=di(e);return await p(C(P,si,t.id),t),e}async function Si(e){await o(C(P,si,String(e)))}var Ci=class{constructor(){this.appConfig=null}async getAppConfig(){return this.appConfig||=await yi(),this.appConfig}async getDrivers(){return(await mi()).map(e=>new xn(e))}async saveDriver(e){let t=new xn(e);return await _i(t.id,`DRIVER`,t),t}async deleteDriver(e){await vi(e,`DRIVER`)}async getTrailers(){return(await hi()).map(e=>new Sn(e))}async saveTrailer(e){let t=new Sn(e);return await _i(t.id,`TRAILER`,t),t}async deleteTrailer(e){await vi(e,`TRAILER`)}async getTrucks(){let[e,t,n]=await Promise.all([gi(),this.getDrivers(),this.getTrailers()]);return e.map(e=>{let r=new Cn(e),i=r.driverId||(e.driver?e.driver.id||e.driver:null);if(i){let e=t.find(e=>String(e.id)===String(i));e&&(r.driver=e,r.driverId=e.id)}let a=r.trailerId||(e.trailer?e.trailer.id||e.trailer:null);if(a){let e=n.find(e=>String(e.id)===String(a));e&&(r.trailer=e,r.trailerId=e.id)}return r})}async saveTruck(e){let t=new Cn(e);return t.driver&&!t.driverId&&(t.driverId=t.driver.id),t.trailer&&!t.trailerId&&(t.trailerId=t.trailer.id),await _i(t.id,`TRUCK`,t),t}async deleteTruck(e){await vi(e,`TRUCK`)}async getTravels(){let[e,t,n,r]=await Promise.all([bi(),this.getTrucks(),this.getDrivers(),this.getTrailers()]);return e.map(e=>{let i=new Tn(e);if(i.truck){let a=t.find(e=>String(e.id)===String(i.truck.id));if(a)i.truck=a;else{let t=i.truck.driverId||(e.truck?.driver?e.truck.driver.id||e.truck.driver:null);t&&(i.truck.driver=n.find(e=>String(e.id)===String(t))||i.truck.driver,i.truck.driverId=t);let a=i.truck.trailerId||(e.truck?.trailer?e.truck.trailer.id||e.truck.trailer:null);a&&(i.truck.trailer=r.find(e=>String(e.id)===String(a))||i.truck.trailer,i.truck.trailerId=a)}}return i})}async saveTravel(e){let t=new Tn(e);return await xi(t),t}async deleteTravel(e){await Si(e)}async getProducers(){return(await fi(`PRODUCER`)).map(e=>new En(e))}async getProducersPaginated(e=20,t=null){let n=await pi(e,t);return{producers:n.results.map(e=>new En(e)),lastVisible:n.lastVisible,hasMore:n.hasMore}}async saveProducer(e){let t=new En(e);return await _i(t.id,`PRODUCER`,t),t}async deleteProducer(e){await vi(e,`PRODUCER`)}async getAgents(){return(await fi(`AGENT`)).map(e=>new Dn(e))}async saveAgent(e){let t=new Dn(e);return await _i(t.id,`AGENT`,t),t}async deleteAgent(e){await vi(e,`AGENT`)}},wi=class{constructor(e,t){this.repository=e,this.ui=t}async loadDrivers(){this.ui.showLoading(!0);try{let e=await this.repository.getDrivers();e.sort((e,t)=>(e.name||``).localeCompare(t.name||``,`es`,{sensitivity:`base`})),this.ui.renderLogisticsMaster(this,`choferes`,e)}catch(e){this.ui.showError(`Error loading drivers: `+e.message)}}async saveDriver(e){this.ui.showLoading(!0);try{let t=await this.repository.getDrivers(),n=String(e.dni||``).replace(/\D/g,``);if(t.some(t=>String(t.id)!==String(e.id)&&String(t.dni||``).replace(/\D/g,``)===n&&n.length>0)){this.ui.hideLoading(),this.ui.showError(`❌ Ya existe un chofer registrado con el DNI ${e.dni}.`);return}await this.repository.saveDriver(e),await this.loadDrivers()}catch(e){this.ui.showError(`Error saving driver: `+e.message)}}async deleteDriver(e){this.ui.showLoading(!0);try{await this.repository.deleteDriver(e),await this.loadDrivers()}catch(e){this.ui.showError(`Error deleting driver: `+e.message)}}async loadTrailers(){this.ui.showLoading(!0);try{let e=await this.repository.getTrailers();e.sort((e,t)=>(e.name||``).localeCompare(t.name||``,`es`,{sensitivity:`base`})),this.ui.renderLogisticsMaster(this,`jaulas`,e)}catch(e){this.ui.showError(`Error loading trailers: `+e.message)}}async saveTrailer(e){this.ui.showLoading(!0);try{let t=await this.repository.getTrailers(),n=String(e.licensePlate||``).replace(/[^a-zA-Z0-9]/g,``).toUpperCase();if(t.some(t=>String(t.id)!==String(e.id)&&String(t.licensePlate||``).replace(/[^a-zA-Z0-9]/g,``).toUpperCase()===n&&n.length>0)){this.ui.hideLoading(),this.ui.showError(`❌ Ya existe una jaula registrada con la patente ${e.licensePlate}.`);return}await this.repository.saveTrailer(e),await this.loadTrailers()}catch(e){this.ui.showError(`Error saving trailer: `+e.message)}}async deleteTrailer(e){this.ui.showLoading(!0);try{await this.repository.deleteTrailer(e),await this.loadTrailers()}catch(e){this.ui.showError(`Error deleting trailer: `+e.message)}}async loadTrucks(){this.ui.showLoading(!0);try{let[e,t,n]=await Promise.all([this.repository.getTrucks(),this.repository.getDrivers(),this.repository.getTrailers()]);e.sort((e,t)=>(e.name||``).localeCompare(t.name||``,`es`,{sensitivity:`base`})),this.ui.renderLogisticsMaster(this,`camiones`,e,{drivers:t,trailers:n})}catch(e){this.ui.showError(`Error loading trucks: `+e.message)}}async saveTruck(e){this.ui.showLoading(!0);try{let t=await this.repository.getTrucks(),n=String(e.licensePlate||``).replace(/[^a-zA-Z0-9]/g,``).toUpperCase();if(t.some(t=>String(t.id)!==String(e.id)&&String(t.licensePlate||``).replace(/[^a-zA-Z0-9]/g,``).toUpperCase()===n&&n.length>0)){this.ui.hideLoading(),this.ui.showError(`❌ Ya existe un camión registrado con la patente ${e.licensePlate}.`);return}await this.repository.saveTruck(e),await this.loadTrucks()}catch(e){this.ui.showError(`Error saving truck: `+e.message)}}async deleteTruck(e){this.ui.showLoading(!0);try{await this.repository.deleteTruck(e),await this.loadTrucks()}catch(e){this.ui.showError(`Error deleting truck: `+e.message)}}async loadProducers(){this.ui.showLoading(!0);try{let e=await this.repository.getProducers();e.sort((e,t)=>(e.name||``).localeCompare(t.name||``,`es`,{sensitivity:`base`})),this.ui.renderLogisticsMaster(this,`productores`,e)}catch(e){this.ui.showError(`Error loading producers: `+e.message)}}async saveProducer(e){this.ui.showLoading(!0);try{let t=await this.repository.getProducers(),n=String(e.cuit||``).replace(/\D/g,``);if(t.some(t=>String(t.id)!==String(e.id)&&String(t.cuit||``).replace(/\D/g,``)===n&&n.length>0)){this.ui.hideLoading(),this.ui.showError(`❌ Ya existe un productor registrado con el CUIT ${e.cuit}.`);return}await this.repository.saveProducer(e),await this.loadProducers()}catch(e){this.ui.showError(`Error saving producer: `+e.message)}}async deleteProducer(e){this.ui.showLoading(!0);try{await this.repository.deleteProducer(e),await this.loadProducers()}catch(e){this.ui.showError(`Error deleting producer: `+e.message)}}async loadAgents(){this.ui.showLoading(!0);try{let e=await this.repository.getAgents();e.sort((e,t)=>(e.name||``).localeCompare(t.name||``,`es`,{sensitivity:`base`})),this.ui.renderLogisticsMaster(this,`comisionistas`,e)}catch(e){this.ui.showError(`Error loading agents: `+e.message)}}async saveAgent(e){this.ui.showLoading(!0);try{let t=await this.repository.getAgents(),n=String(e.name||``).trim().toLowerCase();if(t.some(t=>String(t.id)!==String(e.id)&&String(t.name||``).trim().toLowerCase()===n&&n.length>0)){this.ui.hideLoading(),this.ui.showError(`❌ Ya existe un comisionista registrado con el nombre "${e.name}".`);return}await this.repository.saveAgent(e),await this.loadAgents()}catch(e){this.ui.showError(`Error saving agent: `+e.message)}}async deleteAgent(e){this.ui.showLoading(!0);try{await this.repository.deleteAgent(e),await this.loadAgents()}catch(e){this.ui.showError(`Error deleting agent: `+e.message)}}async loadTravelManagement(){this.ui.showLoading(!0);try{let[e,t,n]=await Promise.all([this.repository.getTravels(),this.repository.getTrucks(),this.repository.getAppConfig()]);this.ui.renderTravelManagement(this,e,{trucks:t,config:n})}catch(e){this.ui.showError(`Error loading travels: `+e.message)}}async saveTravel(e){this.ui.showLoading(!0);try{let t=new Tn(e);if(!t.driverPricePerKmSimple){let e=await this.repository.getAppConfig();t.driverPricePerKmSimple=e.defaultDriverPricePerKmSimple,t.driverPricePerKmDouble=e.defaultDriverPricePerKmDouble,t.simulationFreightPriceSimple=e.simulationFreightPriceSimple,t.simulationFreightPriceDouble=e.simulationFreightPriceDouble,t.fuelPrice=e.fuelPrice}await this.repository.saveTravel(t),await this.loadTravelManagement()}catch(e){this.ui.showError(`Error saving travel: `+e.message)}}async deleteTravel(e){this.ui.showLoading(!0);try{await this.repository.deleteTravel(e),await this.loadTravelManagement()}catch(e){this.ui.showError(`Error deleting travel: `+e.message)}}async loadLiquidations(){this.ui.showLoading(!0);try{let[e,t]=await Promise.all([this.repository.getTravels(),this.repository.getDrivers()]);this.ui.renderLiquidations(this,e,t)}catch(e){this.ui.showError(`Error loading liquidations: `+e.message)}}async loadFuelEfficiency(){this.ui.showLoading(!0);try{let[e,t]=await Promise.all([this.repository.getTravels(),this.repository.getTrucks()]);this.ui.renderFuelEfficiency(this,e,t)}catch(e){this.ui.showError(`Error loading fuel efficiency: `+e.message)}}},Ti=class{constructor(){}async getEstablishments(e=!1){return Xr(P)}async saveEstablishment(e){return Zr(P,e)}async deleteEstablishment(e){return Qr(P,e)}async getEmployees(e,t=!1){return $r(P,e)}async saveEmployee(e,t){return ei(P,e,t)}async deleteEmployee(e,t){return ti(P,e,t)}},Ei=class{constructor(e,t,n={}){this.repository=e,this.ui=t,this.db=n.db,this.onNavigateToSalaryPaymentCallback=n.onNavigateToSalaryPayment,this.state={establishments:[],selectedEstablishment:null,employees:[],selectedEmployee:null,timeLogs:[]}}async loadData(){console.log(`EstablishmentPresenter: loadData() started`),this.ui.showLoading();try{console.log(`EstablishmentPresenter: fetching establishments from repository...`),this.state.establishments=await this.repository.getEstablishments(),console.log(`EstablishmentPresenter: fetched`,this.state.establishments.length,`establishments`),this.render(),console.log(`EstablishmentPresenter: render complete`)}catch(e){console.error(`EstablishmentPresenter: Error loading data`,e),this.ui.showError(`Error al cargar sucursales: `+e.message),alert(`Error crítico al cargar sucursales: `+e.message)}finally{this.ui.hideLoading()}}async selectEstablishment(e){this.state.selectedEstablishment=e,this.state.selectedEmployee=null,this.state.timeLogs=[],this.ui.showLoading();try{this.state.employees=await this.repository.getEmployees(e.id),this.render()}catch(e){this.ui.showError(`Error al cargar empleados: `+e.message)}finally{this.ui.hideLoading()}}clearSelection(){this.state.selectedEstablishment=null,this.state.employees=[],this.state.selectedEmployee=null,this.state.timeLogs=[],this.render()}async selectEmployee(e){if(this.state.selectedEstablishment){this.state.selectedEmployee=e,this.ui.showLoading();try{this.state.timeLogs=await Fn(this.db,this.state.selectedEstablishment.id,e.id),this.render()}catch(e){this.ui.showError(`Error al cargar asistencia del empleado: `+e.message)}finally{this.ui.hideLoading()}}}clearSelectedEmployee(){this.state.selectedEmployee=null,this.state.timeLogs=[],this.render()}async updateEmployeeRates(e){if(!(!this.state.selectedEstablishment||!this.state.selectedEmployee)){this.ui.showLoading();try{await Rn(this.db,this.state.selectedEstablishment.id,this.state.selectedEmployee.id,e),this.state.selectedEmployee={...this.state.selectedEmployee,...e},this.state.employees=await this.repository.getEmployees(this.state.selectedEstablishment.id,!0),this.render()}catch(e){this.ui.showError(`Error al actualizar tarifas: `+e.message)}finally{this.ui.hideLoading()}}}navigateToSalaryPayment(e){typeof this.onNavigateToSalaryPaymentCallback==`function`&&this.onNavigateToSalaryPaymentCallback(e)}async saveEstablishment(e){this.ui.showLoading();try{await this.repository.saveEstablishment(e),await this.loadData()}catch(e){this.ui.showError(`Error al guardar sucursal: `+e.message)}finally{this.ui.hideLoading()}}async deleteEstablishment(e){if(confirm(`¿Está seguro de eliminar esta sucursal? Esta acción no se puede deshacer.`)){this.ui.showLoading();try{await this.repository.deleteEstablishment(e),await this.loadData()}catch(e){this.ui.showError(`Error al eliminar sucursal: `+e.message)}finally{this.ui.hideLoading()}}}async saveEmployee(e){if(this.state.selectedEstablishment){this.ui.showLoading();try{await this.repository.saveEmployee(this.state.selectedEstablishment.id,e),this.state.employees=await this.repository.getEmployees(this.state.selectedEstablishment.id,!0),this.render()}catch(e){this.ui.showError(`Error al guardar empleado: `+e.message)}finally{this.ui.hideLoading()}}}async deleteEmployee(e){if(this.state.selectedEstablishment&&confirm(`¿Está seguro de eliminar este empleado?`)){this.ui.showLoading();try{await this.repository.deleteEmployee(this.state.selectedEstablishment.id,e),this.state.employees=await this.repository.getEmployees(this.state.selectedEstablishment.id,!0),this.render()}catch(e){this.ui.showError(`Error al eliminar empleado: `+e.message)}finally{this.ui.hideLoading()}}}render(){this.ui.renderEstablishmentManager(this)}};async function Di(e){let t=`check_operators`,n=V(t);if(n)return n;let r=(await b(a(e,`check_operators`))).docs.map(e=>({id:e.id,...e.data()}));return H(t,r,B),r}async function Oi(e,t){if(t.id)return await l(C(e,`check_operators`,t.id),{...t,updatedAt:Date.now()}),U(`check_operators`),t.id;{let n=await v(a(e,`check_operators`),{...t,createdAt:Date.now()});return U(`check_operators`),n.id}}async function ki(e,t){return(await b(g(a(e,`operator_transactions`),r(`operatorId`,`==`,t)))).docs.map(e=>({id:e.id,...e.data()}))}async function Ai(e){let t=`operator_transactions:all`,n=V(t);if(n)return n;let r=(await b(a(e,`operator_transactions`))).docs.map(e=>({id:e.id,...e.data()}));return H(t,r,z),r}async function ji(e,t){await v(a(e,`operator_transactions`),{...t,createdAt:Date.now()}),U(`operator_transactions:all`)}var Mi=class{constructor(){}async getOperators(){return Di(P)}async saveOperator(e){return Oi(P,e)}async getTransactions(e){return ki(P,e)}async getAllTransactions(){return Ai(P)}async addTransaction(e){return ji(P,e)}async syncCheckTransaction(e,t,n){return he(P,`operator_transactions`,e,t,n)}};try{let e=document.querySelector(`.logo`);if(e){let t=document.createElement(`span`);t.style.fontSize=`0.62rem`,t.style.color=`var(--text-muted)`,t.style.background=`rgba(255, 255, 255, 0.04)`,t.style.border=`1px solid var(--border)`,t.style.padding=`0.2rem 0.5rem`,t.style.borderRadius=`6px`,t.style.marginLeft=`0.75rem`,t.style.fontFamily=`monospace`,t.style.fontWeight=`600`,t.textContent=`v-refactor: `,t.title=`Commit de Git: refactor: implement local-first architecture for accounting and check operations using IndexedDB synchronization (2aa89c1)`,e.appendChild(t)}}catch(e){console.warn(`Failed to inject git version badge`,e)}var Ni=new xr,Y=new Vr,Pi=new qr,Fi=new ni(`accounting_entries`),Ii=new ni(`frigorifico_entries`),Li=new Ci,Ri=new Ti,zi=new Mi,Bi=null,X=null,Vi=null,Hi=null,Ui=document.getElementById(`kmp-sidebar`),Z=document.getElementById(`content`),Wi=document.getElementById(`theme-toggle`),Gi=document.getElementById(`menu-toggle`);Ui&&Ui.addEventListener(`navigate`,e=>{$(e.detail.view)});var Q={showLoading:(e=!0)=>{if(e)Z.innerHTML=`
        <div class="loading-wrapper" id="global-loader">
          <div class="spinner"></div>
          <div>Cargando sistema...</div>
        </div>
      `;else{let e=document.getElementById(`global-loader`);e&&e.remove()}},hideLoading:()=>Q.showLoading(!1),showError:e=>{Q.hideLoading(),Z.innerHTML=`<div class="alert error" style="margin: 2rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); border-radius: 12px; color: var(--danger);">
      <strong>⚠️ Error:</strong> ${e}
      <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem; display: block; background: var(--danger);">Reintentar</button>
    </div>`},renderTravels:e=>{Q.hideLoading(),We(Z,{...e,onBack:()=>$(`dashboard`)})},renderDashboard:e=>{Q.hideLoading(),Je(Z,e)},renderFaenaConsumption:e=>{Q.hideLoading(),et(Z,{...e,onBack:()=>$(`dashboard`)})},renderScanResultsModal:e=>ze(e),renderExportModal:e=>Re(e),generateTravelReport:e=>Oe(e),generateExcelReport:e=>ke(e),renderClientAccounts:e=>st({...e,onBackToDashboard:()=>$(`dashboard`)}),renderSaleDetailModal:(e,t,n)=>at(e,t,n),renderSettlementModal:(e,t,n)=>Ce(e,t,n),renderChecks:e=>{Q.hideLoading(),Ft(Z,{...e,onBack:()=>$(`dashboard`)})},renderAccounting:e=>{Q.hideLoading(),tn(Z,{...e,onBack:()=>$(`dashboard`)})},renderPriceAnalysis:e=>fn(Z,e),generateAccountingExcel:(e,t)=>Ae(e,t),renderDateModal:e=>Be(e),generateChecksExcel:(e,t)=>je(e,t),printChecksReport:(e,t,n)=>Me(e,t,n),renderLogisticsMaster:(e,t,n,r)=>{Q.hideLoading(),mn(Z,t,n,r,e)},showTravelModal:(e,t)=>{Q.hideLoading(),He(e,t)},renderLiquidations:(e,t,n)=>{Q.hideLoading(),kn(e,t,n)},renderFuelEfficiency:(e,t,n)=>{Q.hideLoading(),Nn(e,t,n)},renderEstablishmentManager:e=>{Q.hideLoading(),Hn(Z,e)},navigateTo:e=>$(e)},Ki=new Ar(Ni,Q,Li,Y),qi=new Mr(Ni,Q,Y),Ji=new Pr(Y,zi,Q),Yi=new Yr(Pi,Q,zi,Y),Xi=new ai(Fi,Y,Q,{db:P,title:`Caja General`,syncLabel:`Pago Caja General`}),Zi=new ai(Ii,Y,Q,{db:P,title:`Caja Frigorífico`,syncLabel:`Pago Frigorífico`}),Qi=new wi(Li,Q),$i=new Ei(Ri,Q,{db:P,onNavigateToSalaryPayment:e=>{$(`accounting`),Xi.openSalaryPaymentScreen(e)}});d(F,async e=>{if(e){Bi=e,document.body.classList.add(`authenticated`);try{let t=await re(P,e);X=t.role||`VISOR`,Vi=t.allowedViews||null}catch(e){console.error(`Error fetching user role and metadata:`,e),X=`VISOR`,Vi=null}qi.setUserRole(X),Xi.setUserRole(X),Zi.setUserRole(X),Yi.setUid(e.uid),Xi.setUid(e.uid),Zi.setUid(e.uid);try{Ui&&(Ui.setAttribute(`role`,X),Ui.setAttribute(`active`,`dashboard`))}catch(e){console.error(`Error setting kmp-sidebar attributes:`,e)}$(`dashboard`),Ki.loadTravels(J),ut.startAutoSync(J)}else Bi=null,document.body.classList.remove(`authenticated`),ea()}),window.addEventListener(`app:sync-completed`,e=>{let t=e.detail?.syncedCount??0;if(t===0){console.log(`[SyncEvent] No new cloud data synced (syncedCount = 0). Skipping UI refresh.`);return}console.log(`[SyncEvent] Synced ${t} new records from cloud. Invalidation & Auto-refresh triggered.`),ce();let n=Ui?Ui.getAttribute(`active`):`dashboard`;n===`consumption`?(console.log(`[SyncEvent] Auto-refreshing Consumption UI (silent)...`),qi.loadFaenas(J,!0)):n===`dashboard`?(console.log(`[SyncEvent] Auto-refreshing Dashboard UI (silent)...`),Ki.stockItemsCache=null,Ki.clientsCache=null,Ki.categoryPricesCache=null,Ki.showDashboard()):n===`clients`?(console.log(`[SyncEvent] Auto-refreshing Clients UI (silent)...`),Ji.loadClients()):n===`travels`?(console.log(`[SyncEvent] Auto-refreshing Travels UI (silent)...`),Ki.loadTravels(J)):n===`accounting`||n===`frigorifico`?(console.log(`[SyncEvent] Auto-refreshing Accounting UI (silent)...`),Xi.loadData()):n===`checks`&&(console.log(`[SyncEvent] Auto-refreshing Checks UI (silent)...`),Yi.loadData())}),window.addEventListener(`app:logout`,()=>{h(F).then(()=>{localStorage.clear(),location.reload()})});function ea(){Z.innerHTML=`
    <div class="login-container glass-card">
      <img src="/logo.jpg" alt="Logo" class="login-logo" />
      <h2>Gestor de Viajes KMP</h2>
      <p>Inicia sesión mediante Google para continuar.</p>
      
      <button id="google-login-btn" class="btn-google">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        Continuar con Google
      </button>

      <p id="login-error" class="text-danger" style="margin-top: 1rem;"></p>
    </div>
  `,document.getElementById(`google-login-btn`).addEventListener(`click`,async()=>{let e=new m;try{await i(F,e)}catch(e){document.getElementById(`login-error`).textContent=e.message}})}function ta(e,t=Vi){if(t&&Array.isArray(t)&&t.length>0){let e=[...t];return e.includes(`logout`)||e.push(`logout`),e.includes(`dashboard`)||e.push(`dashboard`),e}return e===`ADMIN`?[`travels`,`dashboard`,`consumption`,`clients`,`simulator`,`checks`,`accounting`,`frigorifico`,`settings`,`price-share`,`contact`,`logout`,`master-data`,`logistics-liquidations`,`logistics-fuel`,`establishments`]:e===`OPERARIO`?[`travels`,`dashboard`,`consumption`,`clients`,`simulator`,`checks`,`accounting`,`price-share`,`contact`,`logout`,`logistics-liquidations`,`logistics-fuel`]:[`dashboard`,`simulator`,`price-share`,`contact`,`logout`]}function na(e){let t=ta(e);document.querySelectorAll(`#entity-list li`).forEach(e=>{let n=e.dataset.view;n&&!t.includes(n)?e.style.display=`none`:e.style.display=`block`})}var $=(e,t=X)=>{if(Ui&&Ui.setAttribute(`active`,e),e===`logout`){window.dispatchEvent(new Event(`app:logout`));return}if(!Bi&&e!==`simulator`)return ea();if(!ta(t).includes(e)){console.warn(`Access denied to ${e} for role ${t}`),alert(`Acceso denegado: No tienes permiso para acceder a esta sección (${e}).`);return}switch(document.body.classList.remove(`sidebar-open`),Z.innerHTML=``,e){case`travels`:Ki.updateView();break;case`dashboard`:Ki.showDashboard();break;case`consumption`:qi.loadFaenas(J);break;case`clients`:Ji.loadClients();break;case`checks`:Yi.loadData();break;case`accounting`:Xi.loadData();break;case`frigorifico`:Zi.loadData();break;case`establishments`:$i.loadData();break;case`master-data`:Qi.loadTrucks();break;case`logistics-liquidations`:Qi.loadLiquidations();break;case`logistics-fuel`:Qi.loadFuelEfficiency();break;case`simulator`:Ge(Z,{onBack:()=>$(`dashboard`),settings:L.loadSettings()});break;case`settings`:{Q.showLoading(!0);let e=async()=>{let t=await Y.getCategoryPrices(),n=await Y.getClients(),r=await Y.getCamaras()||[],i=[];X===`ADMIN`&&(Hi||=await ie(P),i=Hi),Q.hideLoading(),dt(Z,{categoryPrices:t,clients:n,camarasList:r,userRole:X,usersList:i,currentUserUid:Bi?Bi.uid:null,onSavePrices:e=>Y.saveCategoryPrices(e),onSaveClient:e=>Y.saveClient(e),onSaveCamaras:e=>Y.saveCamaras(e),onSaveUserRole:async(e,t,n)=>{await ae(P,e,t,n),Bi&&e===Bi.uid&&(X=t,Vi=n,Xi.setUserRole(X),qi.setUserRole(X),na(X)),Hi=null},onDeleteUser:async t=>{await oe(P,t),Hi=null,await e()},onResetCajasOnly:async()=>{Q.showLoading(!0);try{let e=await b(a(P,`cash_extractions`)),t=x(P),n=0;for(let r of e.docs)t.delete(r.ref),n++,n%100==0&&(await t.commit(),t=x(P));n%100!=0&&await t.commit();try{await I.cash_extractions.clear()}catch(e){console.warn(`Error clearing local cash_extractions IndexedDB:`,e)}console.log(`cash_extractions successfully reset.`),$(`dashboard`)}catch(e){throw console.error(`Error resetting cash_extractions:`,e),e}finally{Q.hideLoading()}},onResetCajaGeneralOnly:async()=>{Q.showLoading(!0);try{let e=await b(a(P,`accounting_entries`)),t=x(P),n=0;for(let r of e.docs)t.delete(r.ref),n++,n%100==0&&(await t.commit(),t=x(P));n%100!=0&&await t.commit(),console.log(`accounting_entries successfully reset.`),$(`dashboard`)}catch(e){throw console.error(`Error resetting accounting_entries:`,e),e}finally{Q.hideLoading()}},onResetCajaFrigorificoOnly:async()=>{Q.showLoading(!0);try{let e=await b(a(P,`frigorifico_entries`)),t=x(P),n=0;for(let r of e.docs)t.delete(r.ref),n++,n%100==0&&(await t.commit(),t=x(P));n%100!=0&&await t.commit(),console.log(`frigorifico_entries successfully reset.`),$(`dashboard`)}catch(e){throw console.error(`Error resetting frigorifico_entries:`,e),e}finally{Q.hideLoading()}},onReloadClients:e,onPriceShare:()=>$(`price-share`),onBack:()=>$(`dashboard`)})};e();break}case`price-share`:document.body.classList.add(`full-screen-view`),Q.showLoading(!0),(async()=>{gt(Z,{prices:await Y.getCategoryPrices(),onBack:()=>{document.body.classList.remove(`full-screen-view`),$(`settings`)}})})();break;case`contact`:document.body.classList.remove(`full-screen-view`),Z.innerHTML=`
        <div class="dashboard-header" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem;">
          <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard">
            <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
          </button>
          <h2 style="margin: 0;">Centro de Documentación Técnica</h2>
        </div>
        <div class="glass-card" style="padding: 2rem; width: 100%;">
          <div class="accordion">
            <!-- Sección Viajes -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🚛 Gestión de Viajes y Métricas</span><i>▼</i></div>
              <div class="accordion-content">
                <p>La sección de viajes procesa datos operativos para generar reportes financieros precisos. Las métricas se calculan dinámicamente según los filtros de categoría seleccionados:</p>
                <div class="formula-card"><span class="tech-tag">Cálculo</span> Precio Promedio = Total Operación / ∑ Kg Limpios</div>
                <div class="formula-card"><span class="tech-tag">Cálculo</span> Precio c/ Comis. = (Total Operación + Comisión Agente) / ∑ Kg Limpios</div>
                <div class="formula-card"><span class="tech-tag">Cálculo</span> Peso Media Res Prom. = ∑ Kg Limpios / Total Unidades</div>
                <p>El sistema también monitorea la relación <strong>Factura vs. Operación</strong> para detectar desviaciones impositivas o administrativas.</p>
              </div>
            </div>

            <!-- Sección Simulador -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🧮 Algoritmos del Simulador de Costo</span><i>▼</i></div>
              <div class="accordion-content">
                <p>El simulador utiliza un modelo de costos en cascada para proyectar la utilidad final basada en la logística y el rendimiento de faena:</p>
                <div class="formula-card"><span class="tech-tag">Logística</span> Kg Faena = Kg Vivos * (Rendimiento / 100)</div>
                <div class="formula-card"><span class="tech-tag">Hacienda</span> Costo Inic. (Carne) = Precio Vivo / (Rendimiento / 100)</div>
                <div class="formula-card"><span class="tech-tag">Flete</span> Costo Flete (Carne) = (Distancia * $/km) / Kg Faena</div>
                <div class="formula-card"><span class="tech-tag">Impuestos</span> Tasa Efectiva = Margen * (IIBB / 100)</div>
                <div class="formula-card"><span class="tech-tag">Venta</span> Factura Venta = Costo Final * Margen Ganancia</div>
                <div class="formula-card"><span class="tech-tag">Final</span> Utilidad Total = (Precio Venta - Costo Final) * Kg Faena</div>
                <p>Nota: El costo final se ajusta automáticamente mediante una base bruta dividida por la tasa impositiva residual para asegurar el margen neto proyectado.</p>
              </div>
            </div>

            <!-- Sección Datos Técnicos -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📋 Parámetros de Carga Logística</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Valores predeterminados configurados para el transporte:</p>
                <ul>
                  <li><strong>Jaula Doble:</strong> 21,500 kg ($3,100 /km)</li>
                  <li><strong>Jaula Simple:</strong> 15,500 kg ($2,500 /km)</li>
                  <li><strong>Margen Operativo:</strong> 10% (Factor 1.1)</li>
                </ul>
              </div>
            </div>

            <!-- Sección Dashboard de Tendencias -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📊 Dashboard de Tendencias Históricas</span><i>▼</i></div>
              <div class="accordion-content">
                <p>El Dashboard ofrece una vista analítica de rendimiento y precio promedio a lo largo del tiempo, con filtros por categoría y comisionista.</p>
                <div class="formula-card"><span class="tech-tag">Filtros</span> Seleccionar categorías (chips) para aislar datos por tipo de hacienda</div>
                <div class="formula-card"><span class="tech-tag">Gráficos</span> Tendencia de precio $/kg por viaje • Distribución por categoría • Evolución de volumen</div>
                <p>Los viajes en estado <strong>BORRADOR</strong> son excluidos automáticamente de todas las métricas y gráficos para garantizar la precisión del análisis.</p>
              </div>
            </div>

            <!-- Sección Exportación PDF -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📄 Exportación de Reportes PDF</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Genera reportes profesionales listos para compartir por WhatsApp o email directamente desde la app.</p>
                <div class="formula-card"><span class="tech-tag">Acceso</span> Tocar el botón 📄 en la esquina superior derecha del header</div>
                <div class="formula-card"><span class="tech-tag">Opciones</span> Selección por últimos N viajes o por rango de fechas</div>
                <p>Los borradores nunca se incluyen en los reportes exportados. El PDF se genera con <strong>jsPDF</strong> y se descarga automáticamente.</p>
              </div>
            </div>

            <!-- Sección Inteligencia de Mercado -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📈 Inteligencia de Mercado (MAG)</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Compara tus costos de compra contra los precios de referencia del Mercado Agroganadero (MAG) en tiempo real.</p>
                <div class="formula-card"><span class="tech-tag">Cálculo</span> Brecha (%) = ((Tu Precio - Precio MAG) / Precio MAG) × 100</div>
                <div class="formula-card"><span class="tech-tag">Lectura</span> 🟢 Verde = comprás por debajo del mercado • 🔴 Rojo = comprás por encima</div>
                <p>Esta tarjeta aparece automáticamente cuando filtras por una sola categoría.</p>
              </div>
            </div>

            <!-- Sección Tarjetas de Productor -->
            <div class="accordion-item">
              <div class="accordion-header"><span>👤 Tarjetas de Productor</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Cada viaje muestra una tarjeta detallada por productor con información fiscal y operativa.</p>
                <div class="formula-card"><span class="tech-tag">Identidad</span> Nombre, CUIT y CBU (si existen en la app KMP)</div>
                <div class="formula-card"><span class="tech-tag">Impuestos</span> IVA y Ganancias sumados de todos los productos del productor</div>
                <p>Los badges <span style="color: #3b82f6;">IVA</span> y <span style="color: #f59e0b;">Ganarias</span> aparecen solo si el valor es mayor a cero.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Procesamiento de Faena (PDF) -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📂 Procesamiento de Faena (PDF)</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Automatiza la carga de datos extrayendo información directamente de los reportes de faena de los frigoríficos.</p>
                <div class="formula-card"><span class="tech-tag">Vínculo</span> Búsqueda por <strong>CUIT</strong> y <strong>Fecha</strong> (±7 días) para asignar los kilos al viaje correspondiente.</div>
                <div class="formula-card"><span class="tech-tag">Deduplicación</span> Los archivos ya procesados se omiten automáticamente para evitar duplicar stock.</div>
                <p>El sistema divide cada registro en <strong>dos medias reses</strong> independientes para un control de inventario preciso.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Módulo de Consumo y Stock -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🥩 Módulo de Consumo y Stock</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Gestión dinámica del inventario de piezas faenadas y control de salidas a clientes.</p>
                <div class="formula-card"><span class="tech-tag">Despacho</span> Seleccionar piezas -> Ingresar Destino -> "🚚 Salida". La pieza pasa de Disponible a Despachada.</div>
                <p>Visualiza el total de kilos "colgados" y el conteo de piezas por categoría en tiempo real.</p>
              </div>
            </div>
            
            <!-- NUEVA SECCIÓN: Gestión de Cámaras de Frío -->
            <div class="accordion-item">
              <div class="accordion-header"><span>❄️ Gestión de Cámaras de Frío</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Sistema de trazabilidad de ubicación para el acopio de medias reses con control de movimientos:</p>
                <div class="formula-card"><span class="tech-tag">Movimientos</span> Seleccionar stock -> "Mover a [Cámara]" -> "Mover". Se registra historial (Log).</div>
                <div class="formula-card"><span class="tech-tag">Trazabilidad</span> Cada pieza guarda su historial completo de ubicaciones anteriores.</div>
                <p>Asegura que el personal sepa exactamente qué mercadería hay en cada sector de frío.</p>
              </div>
            </div>
            
            <!-- NUEVA SECCIÓN: Gestión de Clientes y Cuentas Corrientes -->
            <div class="accordion-item">
              <div class="accordion-header"><span>👥 Gestión de Clientes y Cuentas Corrientes</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Módulo centralizado para la administración de clientes, control de saldos pendientes y análisis de precio promedio:</p>
                <div class="formula-card"><span class="tech-tag">Débito Automático</span> Al despachar mercadería, se genera una <strong>DEUDA</strong>: Monto = Kg × Precio Categoría.</div>
                <div class="formula-card"><span class="tech-tag">Saldo</span> Saldo Pendiente = ∑ Deuda (Despachos) - ∑ Haber (Pagos)</div>
                <div class="formula-card"><span class="tech-tag">Análisis</span> <strong>Precio Promedio</strong> = Compara el Precio Real por Kg (venta externa) vs lo despachado automáticamente.</div>
                <p>Los pagos e imputaciones se registran manualmente desde la ficha individual de cada cliente, con un historial completo de operaciones.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Placa de Precios -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📲 Placa de Precios y Cotizaciones</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Herramienta diseñada para generar listas de precios visualmente atractivas listas para compartir.</p>
                <div class="formula-card"><span class="tech-tag">Diseño</span> Renderizado en vivo con animaciones y modo presentación a pantalla completa (Full Screen).</div>
                <div class="formula-card"><span class="tech-tag">Compartir</span> Generación de captura rápida mediante el botón de exportación integrado en la vista.</div>
                <p>Los precios exhibidos se alimentan de la "Configuración General" administrada por los perfiles jerárquicos.</p>
              </div>
            </div>

            <!-- SECCIÓN: Gestión de Cheques – Documentación completa -->
            <div class="accordion-item">
              <div class="accordion-header"><span>💸 Gestión Integral de Cheques – Proceso y Cálculos</span><i>▼</i></div>
              <div class="accordion-content">

                <p>El módulo de cheques permite administrar el ciclo de vida completo de cheques de pago diferido (físicos o eCheqs): desde la compra a un vendedor hasta la venta o acreditación, registrando automáticamente todos los cálculos financieros.</p>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--primary);">📥 Proceso de Compra (Ingreso al Sistema)</h4>
                <p>Al registrar una compra se cargan los siguientes datos:</p>
                <div class="formula-card"><span class="tech-tag">Datos del Cheque</span> Banco · Número de cheque · Valor Nominal · Fecha de Emisión · Fecha de Recepción · Fecha de Pago · Días de Clearing</div>
                <div class="formula-card"><span class="tech-tag">Datos del Librador</span> Nombre / Razón Social · CUIT del librador. El botón <strong>BCRA</strong> copia el CUIT y abre la Central de Deudores del BCRA para verificar la situación crediticia del firmante.</div>
                <div class="formula-card"><span class="tech-tag">Compra (Origen)</span> Vendedor (contacto del sistema) · Pesificación (%) · Interés Mensual (%)</div>

                <p>Con esos datos el sistema calcula automáticamente:</p>
                <div class="formula-card"><span class="tech-tag">Días Totales</span> Días = (Fecha de Pago − Fecha de Recepción) + Clearing</div>
                <div class="formula-card"><span class="tech-tag">Neto Compra</span> Neto Compra = Nominal − (Nominal × Pesif.%) − (Nominal × InterésMensual% / 30 × Días)</div>
                <div class="formula-card"><span class="tech-tag">Descuento Compra</span> Descuento = Nominal − Neto Compra → es la ganancia capturada en el momento de comprar, independientemente de si luego se vende o cobra directamente.</div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--success);">📤 Proceso de Venta (Salida del Sistema)</h4>
                <p>Cuando el cheque se vende a un tercero se registra el lado de venta con:</p>
                <div class="formula-card"><span class="tech-tag">Venta (Destino)</span> Comprador · Pesificación (%) · Interés Mensual (%) · Estado · Motivo de retorno (si aplica)</div>
                <div class="formula-card"><span class="tech-tag">Neto Venta</span> Neto Venta = Nominal − (Nominal × Pesif.%) − (Nominal × InterésMensual% / 30 × Días)</div>
                <div class="formula-card"><span class="tech-tag">Ganancia Realizada</span> Ganancia = Neto Venta − Neto Compra → el spread entre lo que se pagó y lo que se cobró por el cheque.</div>

                <p><strong>Ejemplo numérico:</strong> Cheque de $100.000 a 60 días.</p>
                <div class="formula-card"><span class="tech-tag">Compra</span> Pesif. 1% + Interés 2%/mes → Neto Compra = $100.000 − $1.000 − $4.000 = <strong>$95.000</strong></div>
                <div class="formula-card"><span class="tech-tag">Venta</span> Pesif. 0.5% + Interés 1.5%/mes → Neto Venta = $100.000 − $500 − $3.000 = <strong>$96.500</strong></div>
                <div class="formula-card"><span class="tech-tag">Ganancia</span> $96.500 − $95.000 = <strong>$1.500 (spread)</strong></div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--primary);">🔄 Ciclo de Vida y Estados</h4>
                <div class="formula-card"><span class="tech-tag">EN CARTERA</span> Cheque comprado, sin venta activa. Período de espera hasta la fecha de pago.</div>
                <div class="formula-card"><span class="tech-tag">🔔 PAGO EN Xd</span> La fecha de pago se acerca en los próximos 10 días. Aviso preventivo.</div>
                <div class="formula-card"><span class="tech-tag">✅ DISPONIBLE</span> La fecha de pago ya pasó y el cheque está dentro del período de gracia de 30 días del BCRA. Se puede cobrar o seguir negociando.</div>
                <div class="formula-card"><span class="tech-tag">⏳ PRÓXIMO A VENCER</span> Quedan 10 días o menos del período de gracia de 30 días. <strong>Urgente:</strong> gestionar antes del vencimiento definitivo.</div>
                <div class="formula-card"><span class="tech-tag">⛔ VENCIDO</span> Pasaron los 30 días de gracia desde la fecha de pago. El cheque ya no es cobrable de forma ordinaria.</div>
                <div class="formula-card"><span class="tech-tag">DEVUELTO</span> El cheque fue rechazado por el comprador y regresó a Cartera. Puede ser renegociado o gestionado con el librador.</div>
                <div class="formula-card"><span class="tech-tag">VENDIDO</span> Operación completa. La ganancia realizada se acumula en el total de la sección.</div>
                <div class="formula-card"><span class="tech-tag">RECHAZADO</span> Cheque sin fondos o con problema bancario. Queda en Operaciones Realizadas sin ganancia.</div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--success);">📊 Indicadores del Panel</h4>
                <div class="formula-card"><span class="tech-tag">Ganancia Vendida</span> Suma de <code>profit</code> de todos los cheques con estado VENDIDO. Solo incluye ganancias ya realizadas.</div>
                <div class="formula-card"><span class="tech-tag">Desc. en Cartera</span> Suma de los descuentos de compra (Nominal − Neto Compra) de todos los cheques aún en cartera. Representa la ganancia potencial ya capturada pero no realizada.</div>
                <div class="formula-card"><span class="tech-tag">Capital en Cartera</span> Suma del Valor Nominal de todos los cheques en cartera. Indica la exposición nominal total.</div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--primary);">⚡ Operaciones Masivas</h4>
                <div class="formula-card"><span class="tech-tag">Compra Masiva</span> Permite cargar múltiples cheques en una sola sesión con datos comunes compartidos (vendedor, pesificación, intereses) y datos individuales por cheque (banco, número, nominal, fechas, librador, CUIT).</div>
                <div class="formula-card"><span class="tech-tag">Venta Masiva</span> Seleccionar múltiples cheques de la tabla de Cartera con los checkboxes y aplicar condiciones de venta unificadas a todo el lote simultáneamente.</div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--primary);">⚖️ Marco Regulatorio BCRA</h4>
                <div class="formula-card"><span class="tech-tag">Período de Gracia</span> El BCRA establece un período de 30 días corridos después de la fecha de pago para presentar el cheque al cobro. Pasado ese plazo, el cheque prescribe.</div>
                <div class="formula-card"><span class="tech-tag">Central de Deudores</span> Disponible en <strong>bcra.gob.ar/situacion-crediticia</strong>. Permite verificar el historial crediticio del firmante (librador) antes de aceptar un cheque. El sistema facilita el acceso con un solo clic desde el formulario.</div>

              </div>
            </div>

            <!-- NUEVA SECCIÓN: Caja General y Contabilidad -->
            <div class="accordion-item">
              <div class="accordion-header"><span>💰 Caja General y Arqueo Físico</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Sistema contable principal para asentar ingresos, egresos, anticipos impositivos y reportes de liquidez bruta.</p>
                <div class="formula-card"><span class="tech-tag">Balance</span> Sistema de registro por partida simple con Saldos arrastrados dinámicamente.</div>
                <div class="formula-card"><span class="tech-tag">Arqueo Visual</span> "Validación Física" con sumatoria de denominación de billetes para control de caja frente a desfasajes operacionales.</div>
                <p>Permite exportación avanzada directa a Microsoft Excel (.XLSX) con tablas debidamente ordenadas.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Caja Frigorífico -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🏢 Caja Frigorífico</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Contabilidad paralela específica y cerrada, dedicada al establecimiento o planta matadero.</p>
                <div class="formula-card"><span class="tech-tag">Objetivo</span> Aislar impositivamente los gastos operativos estructurales (mantenimiento, servicios directos) de la rentabilidad cárnica.</div>
                <p>Comparte la misma topología de arqueo, filtros avanzados para cierres contables y la arquitectura base de la Contabilidad General.</p>
              </div>
            </div>
            
            <!-- NUEVA SECCIÓN: Gestión de Accesos (RBAC) -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🔐 Control de Privilegios y Roles (RBAC)</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Sistema de gestión de accesos basado en roles para asegurar la información de la plataforma.</p>
                <div class="formula-card"><span class="tech-tag">Admin</span> Acceso total. <span class="tech-tag">Operario</span> Escritura limitada (despachos/stock). <span class="tech-tag">Visor</span> Solo lectura.</div>
                <p>El primer usuario es ADMIN automáticamente. Los nuevos registros son VISOR por defecto.</p>
              </div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);">
            <p style="color: var(--text-muted);">Soporte: jmiguelhsg@gmail.com</p>
          </div>
        </div>
      `,Z.querySelector(`#back-to-dash`).onclick=()=>$(`dashboard`),Z.querySelectorAll(`.accordion-header`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.parentElement,n=t.classList.contains(`active`);Z.querySelectorAll(`.accordion-item`).forEach(e=>e.classList.remove(`active`)),n||t.classList.add(`active`)})});break;case`logout`:h(F);break;default:Z.textContent=`Vista no encontrada`}};Wi.addEventListener(`click`,()=>{document.body.classList.toggle(`dark`),Wi.textContent=document.body.classList.contains(`dark`)?`☀️`:`🌙`}),Gi.addEventListener(`click`,()=>{document.body.classList.toggle(`sidebar-open`)}),document.getElementById(`export-pdf`).addEventListener(`click`,()=>{Ki.openExportOptions()}),window.addEventListener(`nav:dashboard`,()=>$(`dashboard`));