/* HiCentral redesign prototype - client-side search over demo data */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const THIS_YEAR = 2026;
const fmt$ = (n) => "$" + Math.round(n).toLocaleString("en-US");

const TYPE_LABELS = { single: "Single family", condo: "Condo", town: "Townhome", cpr: "CPR detached" };

// Hand-picked residential placeholder photos (Unsplash CDN), stable per listing
const IMG_IDS = {
  l01: "1522708323590-d24dbb6b0267", l02: "1502672260266-1c1ef2d93688",
  l03: "1545324418-cc1a3fa10c00",    l04: "1512917774080-9991f1c4c750",
  l05: "1570129477492-45c003edd2be", l06: "1600596542815-ffad4c1539a9",
  l07: "1568605114967-8130f3a36994", l08: "1523217582562-09d0def993a6",
  l09: "1449844908441-8829872d2607", l10: "1430285561322-7808604715df",
  l11: "1493809842364-78817add7ffb", l12: "1560448204-e02f11c3d0e2",
  l13: "1564013799919-ab600027ffc6", l14: "1600585154340-be6161a56a0c",
  l15: "1518780664697-55e3ad937233", l16: "1600607687939-ce8a6c25118c",
  l17: "1583608205776-bfd35f0d9f83", l18: "1494526585095-c41746248156",
};
function imgURL(l, w, h) {
  return `https://images.unsplash.com/photo-${IMG_IDS[l.id]}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

/* ---------- Cost model (illustrative estimates; see footer disclaimer) ---------- */

function monthlyPI(price, downPct, ratePct) {
  const loan = price * (1 - downPct);
  const r = ratePct / 100 / 12;
  const n = 360;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
}

// Honolulu property tax estimate: Residential $3.50/$1k with $120k home exemption
// for owner-occupants; Residential A tier ($4.50/$1k to $1M, $10.50 above) otherwise.
function monthlyTax(listing, ownerOcc) {
  const assessed = listing.taxAssessed;
  let annual;
  if (listing.tenure === "DHHL") return 0; // homestead lands: nominal
  if (ownerOcc) {
    annual = Math.max(0, assessed - 120000) * 3.5 / 1000;
  } else if (assessed > 1000000) {
    annual = 1000000 * 4.5 / 1000 + (assessed - 1000000) * 10.5 / 1000;
  } else {
    annual = assessed * 4.5 / 1000;
  }
  return annual / 12;
}

function monthlyInsurance(listing) {
  let base = listing.type === "condo" || listing.type === "town" ? 55 : 175;
  if (listing.floodZone === "AE") base += 110;
  if (listing.floodZone === "VE") base += 260;
  return base;
}

function costParts(listing, opts = {}) {
  const { downPct = 0.2, rate = 6.75, ownerOcc = true } = opts;
  const pi = monthlyPI(listing.price, downPct, rate);
  const maint = (listing.maintFee || 0) + (listing.hoaFee || 0);
  const leaseRent = listing.lease ? listing.lease.rentMonthly : 0;
  const tax = monthlyTax(listing, ownerOcc);
  const ins = monthlyInsurance(listing);
  return { pi, maint, leaseRent, tax, ins, total: pi + maint + leaseRent + tax + ins };
}

const leaseYearsLeft = (l) => (l.lease ? l.lease.expYear - THIS_YEAR : null);

/* Merge real public-record facts (js/public.js) into the demo listings:
   real address/TMK/zoning/hazards; assessed value only for whole-parcel homes
   (condo units keep curated values since the parcel record is land-only). */
function mergePublicRecords() {
  if (typeof PUBLIC_RECORDS === "undefined") return;
  LISTINGS.forEach((l) => {
    const p = PUBLIC_RECORDS[l.id];
    if (!p) return;
    const unit = l.address.includes("#") ? " #" + l.address.split("#")[1] : "";
    if (p.address) l.address = p.address + unit;
    if (p.floodZone) l.floodZone = p.floodZone;
    if (typeof p.tsunamiEvac === "boolean") l.tsunamiEvac = p.tsunamiEvac;
    if (typeof p.slrExposure === "boolean") l.slrExposure = p.slrExposure;
    if (p.assessedBldg > 0 && l.type !== "condo") {
      l.taxAssessed = p.assessedLand + p.assessedBldg;
    }
    l.publicRecord = p;
  });
}

/* ---------- Filter state ---------- */

const state = {
  tenure: "all", q: "", region: "all",
  priceMin: null, priceMax: null, bedsMin: 0, bathsMin: 0,
  types: new Set(["single", "condo", "town", "cpr"]),
  leaseYearsMin: 0, feeAvail: false, leaseRentMax: null, maintMax: null,
  fldSafe: false, tsuSafe: false, sewerOnly: false, pvOwned: false, strOnly: false,
  savedOnly: false,
  sort: "cost", view: "list",
};

/* ---------- Saved homes ---------- */

const saved = new Set(JSON.parse(localStorage.getItem("himls-saved") || "[]"));
function toggleSaved(id) {
  saved.has(id) ? saved.delete(id) : saved.add(id);
  localStorage.setItem("himls-saved", JSON.stringify([...saved]));
}

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  return LISTINGS.filter((l) => {
    if (state.tenure === "FS" && l.tenure !== "FS") return false;
    if (state.tenure === "LH" && l.tenure === "FS") return false; // LH view includes DHHL
    if (state.region !== "all" && l.region !== state.region) return false;
    if (q && ![l.address, l.neighborhood, l.desc].join(" ").toLowerCase().includes(q)) return false;
    if (state.priceMin != null && l.price < state.priceMin) return false;
    if (state.priceMax != null && l.price > state.priceMax) return false;
    if (l.beds < state.bedsMin || l.baths < state.bathsMin) return false;
    if (!state.types.has(l.type)) return false;
    if (l.lease && l.tenure === "LH") {
      if (leaseYearsLeft(l) < state.leaseYearsMin) return false;
      if (state.feeAvail && !l.lease.feeAvailable) return false;
      if (state.leaseRentMax != null && l.lease.rentMonthly > state.leaseRentMax) return false;
    } else if (state.feeAvail && l.tenure !== "FS") {
      return false; // DHHL never has fee available
    }
    if (state.maintMax != null && (l.maintFee || 0) + (l.hoaFee || 0) > state.maintMax) return false;
    if (state.fldSafe && ["AE", "VE"].includes(l.floodZone)) return false;
    if (state.tsuSafe && l.tsunamiEvac) return false;
    if (state.sewerOnly && l.sewer !== "sewer") return false;
    if (state.pvOwned && l.pv !== "owned-nem") return false;
    if (state.strOnly && !l.strEligible) return false;
    if (state.savedOnly && !saved.has(l.id)) return false;
    return true;
  });
}

/* ---------- Applied-filter chips ---------- */

function chipDefs() {
  const chips = [];
  const add = (label, clear) => chips.push({ label, clear });
  if (state.tenure !== "all") add(state.tenure === "FS" ? "Fee Simple" : "Leasehold", () => setTenure("all"));
  if (state.region !== "all") add(REGIONS.find((r) => r.id === state.region).name, () => { state.region = "all"; $("#regionSel").value = "all"; });
  if (state.q.trim()) add(`"${state.q.trim()}"`, () => { state.q = ""; $("#q").value = ""; });
  if (state.priceMin != null) add(`Min ${fmt$(state.priceMin)}`, () => { state.priceMin = null; $("#priceMin").value = ""; });
  if (state.priceMax != null) add(`Max ${fmt$(state.priceMax)}`, () => { state.priceMax = null; $("#priceMax").value = ""; });
  if (state.bedsMin) add(`${state.bedsMin}+ bd`, () => { state.bedsMin = 0; $("#bedsMin").value = "0"; });
  if (state.bathsMin) add(`${state.bathsMin}+ ba`, () => { state.bathsMin = 0; $("#bathsMin").value = "0"; });
  if (state.types.size < 4) add(`${[...state.types].map((t) => TYPE_LABELS[t]).join(", ") || "No types"}`, () => {
    state.types = new Set(["single", "condo", "town", "cpr"]);
    $$('input[data-type]').forEach((c) => { c.checked = true; });
  });
  if (state.leaseYearsMin) add(`Lease ${state.leaseYearsMin}+ yrs`, () => { state.leaseYearsMin = 0; $("#leaseYears").value = 0; $("#leaseYearsOut").textContent = "any"; });
  if (state.feeAvail) add("Fee available", () => { state.feeAvail = false; $("#feeAvail").checked = false; });
  if (state.leaseRentMax != null) add(`Lease rent under ${fmt$(state.leaseRentMax)}`, () => { state.leaseRentMax = null; $("#leaseRentMax").value = ""; });
  if (state.maintMax != null) add(`Maint under ${fmt$(state.maintMax)}`, () => { state.maintMax = null; $("#maintMax").value = ""; });
  const flags = [["fldSafe", "No high-risk flood"], ["tsuSafe", "No tsunami zone"], ["sewerOnly", "Sewer only"], ["pvOwned", "Owned PV"], ["strOnly", "STR legal"]];
  flags.forEach(([id, label]) => { if (state[id]) add(label, () => { state[id] = false; $("#" + id).checked = false; }); });
  if (state.savedOnly) add("Saved homes", () => { state.savedOnly = false; $("#savedOnly").setAttribute("aria-pressed", "false"); });
  return chips;
}

function renderChips() {
  const bar = $("#chipBar");
  const chips = chipDefs();
  if (!chips.length) { bar.innerHTML = ""; bar.hidden = true; return; }
  bar.hidden = false;
  bar.innerHTML = chips.map((c, i) =>
    `<button class="chip" data-chip="${i}" type="button">${c.label}<span aria-hidden="true">&times;</span></button>`).join("")
    + `<button class="chip chip-clear" data-chip="all" type="button">Clear all</button>`;
  $$("[data-chip]", bar).forEach((btn) => btn.addEventListener("click", () => {
    if (btn.dataset.chip === "all") { resetFilters(); return; }
    chips[+btn.dataset.chip].clear();
    render();
  }));
}

function setTenure(t) {
  state.tenure = t;
  $$("#heroSearch [data-tenure]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tenure === t)));
}

function sortListings(list) {
  const by = {
    cost: (a, b) => costParts(a).total - costParts(b).total,
    priceAsc: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
    leaseYears: (a, b) => (leaseYearsLeft(b) ?? 999) - (leaseYearsLeft(a) ?? 999),
    newest: (a, b) => b.yearBuilt - a.yearBuilt,
  };
  return [...list].sort(by[state.sort] || by.cost);
}

/* ---------- Rendering ---------- */

function tenureBadge(l) {
  if (l.tenure === "FS") return `<span class="badge badge-fs">Fee Simple</span>`;
  if (l.tenure === "DHHL") return `<span class="badge badge-dhhl">DHHL Homestead</span>`;
  return `<span class="badge badge-lh">Leasehold - ${leaseYearsLeft(l)} yrs left</span>`;
}

function flagBadges(l) {
  const flags = [];
  if (["AE", "VE"].includes(l.floodZone)) flags.push(`<span class="badge badge-risk">Flood ${l.floodZone}</span>`);
  if (l.tsunamiEvac) flags.push(`<span class="badge badge-risk">Tsunami zone</span>`);
  if (l.sewer === "cesspool") flags.push(`<span class="badge badge-risk">Cesspool</span>`);
  if (l.pv === "owned-nem") flags.push(`<span class="badge badge-note">Owned PV, NEM</span>`);
  if (l.strEligible) flags.push(`<span class="badge badge-note">STR legal</span>`);
  if (l.type === "cpr") flags.push(`<span class="badge badge-note">CPR</span>`);
  return flags.join("");
}

function cardHTML(l) {
  const cost = costParts(l);
  const maintBits = l.maintIncludes.length
    ? `incl. ${l.maintIncludes.map((k) => MAINT_LABELS[k].toLowerCase()).slice(0, 3).join(", ")}${l.maintIncludes.length > 3 ? " +" : ""}`
    : "";
  const leaseStrip = l.tenure === "LH" && l.lease
    ? `<div class="lease-strip">
         <span>Lease rent <b>${fmt$(l.lease.rentMonthly)}/mo</b></span>
         <span>Expires <b>${l.lease.expYear}</b></span>
         ${l.lease.feeAvailable ? `<span><b>Fee available ${fmt$(l.lease.feePrice)}</b></span>` : ""}
       </div>`
    : "";
  const maintLine = (l.maintFee || l.hoaFee)
    ? `<div class="card-hood">Maint/HOA ${fmt$((l.maintFee || 0) + (l.hoaFee || 0))}/mo ${maintBits}</div>`
    : "";
  return `
  <article class="card reveal" data-id="${l.id}" tabindex="0" role="button" aria-label="View ${l.address}">
    <div class="card-img">
      <img loading="lazy" src="${imgURL(l, 640, 427)}" alt="${TYPE_LABELS[l.type]} at ${l.address}" width="640" height="427" />
      <button class="save-btn ${saved.has(l.id) ? "on" : ""}" data-save="${l.id}" aria-label="${saved.has(l.id) ? "Remove from saved" : "Save this home"}" aria-pressed="${saved.has(l.id)}">
        <svg viewBox="0 0 256 256" aria-hidden="true"><path d="M178 40c-20.65 0-38.73 8.88-50 23.89C116.73 48.88 98.65 40 78 40a62.07 62.07 0 0 0-62 62c0 70 103.79 126.66 108.21 129a8 8 0 0 0 7.58 0C136.21 228.66 240 172 240 102a62.07 62.07 0 0 0-62-62Z"/></svg>
      </button>
    </div>
    <div class="card-body">
      <div class="card-top">
        <span class="card-price">${fmt$(l.price)}</span>
        ${tenureBadge(l)}
      </div>
      <div>
        <div class="card-addr">${l.address}</div>
        <div class="card-hood">${l.neighborhood} - ${REGIONS.find((r) => r.id === l.region).name}</div>
      </div>
      <div class="card-specs">
        <span><b>${l.beds}</b> bd</span><span><b>${l.baths}</b> ba</span>
        <span><b>${l.sqft.toLocaleString()}</b> sqft</span>
        ${l.lanaiSqft ? `<span><b>${l.lanaiSqft}</b> lanai</span>` : ""}
      </div>
      ${leaseStrip}
      ${maintLine}
      <div class="card-flags">${flagBadges(l)}</div>
      <div class="card-cost">
        <span class="cost-label">Est. true monthly</span>
        <span class="cost-num">${fmt$(cost.total)}/mo</span>
      </div>
    </div>
  </article>`;
}

function render() {
  const results = sortListings(applyFilters());
  const cardsEl = $("#cards");
  $("#resultsCount").innerHTML = `<strong>${results.length}</strong> ${results.length === 1 ? "home" : "homes"} on O'ahu`;
  if (!results.length) {
    cardsEl.innerHTML = `
      <div class="empty-state">
        <h3>No homes match these filters</h3>
        <p>Try widening the price range, lowering the minimum lease years, or including more property types.</p>
        <button class="btn btn-ghost" id="emptyReset" type="button">Reset all filters</button>
      </div>`;
    $("#emptyReset").addEventListener("click", resetFilters);
  } else {
    cardsEl.innerHTML = results.map(cardHTML).join("");
  }
  renderChips();
  if (state.view === "map") renderMapPins(results);
  observeReveals();
}

/* ---------- Detail sheet ---------- */

const sheetOpts = { downPct: 0.2, rate: 6.75, ownerOcc: true };

function costRowsHTML(l) {
  const c = costParts(l, sheetOpts);
  const inclNote = l.maintIncludes.length
    ? `<span class="r-note">includes ${l.maintIncludes.map((k) => MAINT_LABELS[k]).join(", ")}</span>` : "";
  const taxNote = sheetOpts.ownerOcc
    ? `<span class="r-note">Residential rate with $120k home exemption</span>`
    : l.taxAssessed > 1000000
      ? `<span class="r-note">Residential A tier (not owner-occupied, over $1M)</span>`
      : `<span class="r-note">non-owner-occupant estimate</span>`;
  const rows = [
    [`Mortgage (P&I, 30-yr)`, c.pi, `<span class="r-note">${Math.round(sheetOpts.downPct * 100)}% down at ${sheetOpts.rate.toFixed(2)}%</span>`],
    l.maintFee || l.hoaFee ? [`Maintenance + HOA`, c.maint, inclNote] : null,
    l.lease && l.lease.rentMonthly ? [`Lease rent`, c.leaseRent, `<span class="r-note">until ${l.lease.renegYear ? "renegotiation in " + l.lease.renegYear : "expiration"}</span>`] : null,
    [`Property tax`, c.tax, taxNote],
    [`Insurance est.`, c.ins, ["AE", "VE"].includes(l.floodZone) ? `<span class="r-note">includes flood zone ${l.floodZone} premium</span>` : ""],
  ].filter(Boolean);
  return rows.map(([label, val, note]) => `
    <div class="cost-row">
      <span class="r-label">${label} ${note || ""}</span>
      <span class="r-val">${fmt$(val)}</span>
    </div>`).join("") + `
    <div class="cost-row total">
      <span class="r-label">Est. true monthly cost</span>
      <span class="r-val">${fmt$(c.total)}/mo</span>
    </div>`;
}

function leasePanelHTML(l) {
  if (!l.lease) return "";
  if (l.tenure === "DHHL") {
    return `
    <div class="panel panel-amber">
      <h3>Hawaiian Home Lands homestead</h3>
      <div class="lease-grid">
        <div><div class="f-label">Lease</div><div class="f-val">99-yr, $1/yr</div></div>
        <div><div class="f-label">Expires</div><div class="f-val">${l.lease.expYear}</div></div>
        <div><div class="f-label">Lessor</div><div class="f-val">DHHL</div></div>
      </div>
      <p class="panel-note">Buyer must be a DHHL beneficiary of 50% or greater Native Hawaiian ancestry. Resale is restricted to qualified beneficiaries.</p>
    </div>`;
  }
  const yrs = leaseYearsLeft(l);
  const financeNote = yrs < 20
    ? "Under 20 lease years: expect cash-only offers."
    : yrs < 35
      ? "Under 35 lease years: most lenders shorten the loan term or decline; confirm financing early."
      : "Enough lease term remains for conventional 30-year financing today.";
  return `
  <div class="panel panel-amber">
    <h3>Leasehold terms</h3>
    <div class="lease-grid">
      <div><div class="f-label">Lease rent</div><div class="f-val">${fmt$(l.lease.rentMonthly)}/mo</div></div>
      <div><div class="f-label">Expires</div><div class="f-val">${l.lease.expYear} (${yrs} yrs)</div></div>
      ${l.lease.renegYear ? `<div><div class="f-label">Renegotiation</div><div class="f-val">${l.lease.renegYear}</div></div>` : ""}
      <div><div class="f-label">Lessor</div><div class="f-val" style="font-family:var(--sans)">${l.lease.lessor}</div></div>
      ${l.lease.feeAvailable ? `<div><div class="f-label">Fee available</div><div class="f-val">${fmt$(l.lease.feePrice)}</div></div>` : ""}
    </div>
    <p class="panel-note">${financeNote}${l.lease.feeAvailable ? " Buying the fee converts this home to fee simple and removes lease rent." : ""}</p>
  </div>`;
}

function hazardsHTML(l) {
  const items = [
    ["AE", "VE"].includes(l.floodZone)
      ? { warn: true, t: `Flood zone ${l.floodZone}`, d: "Lender-required flood insurance." }
      : { good: true, t: `Flood zone ${l.floodZone}`, d: "Outside high-risk flood zones." },
    l.tsunamiEvac
      ? { warn: true, t: "Tsunami evacuation zone", d: "Know the evacuation route; siren tests monthly." }
      : { good: true, t: "Outside tsunami zone", d: "Above the coastal evacuation area." },
    l.slrExposure
      ? { warn: true, t: "Sea-level-rise exposure", d: "Inside the state 3.2-ft SLR exposure area disclosure." }
      : null,
    l.sewer === "cesspool"
      ? { warn: true, t: "Cesspool", d: "Statewide conversion required by 2050 ($20k-50k typical)." }
      : { good: true, t: l.sewer === "sewer" ? "County sewer" : "Septic", d: "No cesspool conversion needed." },
    l.pv !== "none"
      ? { good: l.pv === "owned-nem", warn: l.pv === "leased", t: l.pv === "owned-nem" ? "Owned PV with NEM" : "Leased PV", d: l.pv === "owned-nem" ? "Grandfathered net-metering transfers with sale." : "Review lease transfer terms before closing." }
      : null,
  ].filter(Boolean);
  return items.map((h) => `
    <div class="hazard ${h.warn ? "warn" : ""} ${h.good ? "good" : ""}"><div><b>${h.t}</b>${h.d}</div></div>`).join("");
}

function row(label, val) {
  return val == null || val === "" ? "" :
    `<div class="drow"><span class="d-label">${label}</span><span class="d-val">${val}</span></div>`;
}

function detailSectionsHTML(l) {
  const x = DETAIL_EXTRAS[l.id] || {};
  const d = derivedDetails(l);
  const p = l.publicRecord || {};
  const schools = SCHOOLS[l.neighborhood];
  const c = costParts(l);

  const property = [
    row("Property type", TYPE_LABELS[l.type]),
    row("Condition", x.condition),
    row("Stories / style", x.stories),
    row("Year built", l.yearBuilt),
    row("Construction", x.construction),
    row("Roof", x.roof),
    row("Interior area", `${l.sqft.toLocaleString()} sqft`),
    row("Lanai / open", l.lanaiSqft ? `${l.lanaiSqft} sqft` : "None"),
    row("Total area", `${d.totalSqft.toLocaleString()} sqft`),
    row("Parking", `${l.parking} ${l.parking === 1 ? "stall" : "stalls"}${x.parkingType ? ", " + x.parkingType.toLowerCase() : ""}`),
    row("Furnished", x.furnished),
    row("Pool", x.pool),
    row("Frontage", x.frontage),
    row("View", l.views.join(", ")),
    row("Amenities", (x.amenities || []).join(", ")),
    row("Inclusions", (x.inclusions || []).join(", ")),
  ].join("");

  const remarks = `
    <p class="d-remarks">${l.desc}</p>
    ${x.remarksExtra ? `<p class="d-remarks">${x.remarksExtra}</p>` : ""}`;

  const financial = [
    row("List price", fmt$(l.price)),
    row("Est. true monthly cost", fmt$(c.total) + "/mo"),
    row("Maintenance fee", l.maintFee ? `${fmt$(l.maintFee)}/mo (${(l.maintIncludes || []).map((k) => MAINT_LABELS[k]).join(", ") || "no utilities"})` : "None"),
    row("Association / HOA", l.hoaFee ? `${fmt$(l.hoaFee)}/mo` : "None"),
    l.lease && l.tenure !== "DHHL" ? row("Lease rent", `${fmt$(l.lease.rentMonthly)}/mo to ${l.lease.expYear}${l.lease.renegYear ? ", renegotiates " + l.lease.renegYear : ""}`) : "",
    l.lease && l.lease.feeAvailable ? row("Fee purchase", fmt$(l.lease.feePrice)) : "",
    row("Assessed value" + (p.taxYear ? ` (${p.taxYear}, public record)` : ""), fmt$(l.taxAssessed)),
    row("Property tax est.", fmt$(monthlyTax(l, true)) + "/mo with home exemption"),
    row("Terms acceptable", d.terms),
  ].join("");

  const school = schools ? [
    row("Elementary", schools[0]),
    row("Middle / intermediate", schools[1]),
    row("High school", schools[2]),
    `<p class="d-note">DOE geographic exceptions and school boundaries change; verify with the Hawai'i DOE.</p>`,
  ].join("") : `<p class="d-note">School assignments unavailable for this neighborhood.</p>`;

  const other = [
    row("MLS#", l.mls + " (demo)"),
    row("Land tenure", l.tenure === "FS" ? "Fee Simple" : l.tenure === "DHHL" ? "DHHL Homestead Lease" : "Leasehold"),
    row("TMK (public record)", p.tmk),
    row("County zoning", p.zoning),
    row("Land recorded", d.landRecorded),
    row("Flood zone (FEMA)", l.floodZone),
    row("Tsunami evacuation zone", l.tsunamiEvac ? "Yes" : "No"),
    row("Sea-level-rise exposure", l.slrExposure ? "Inside 3.2-ft SLR-XA" : "Outside"),
    row("Wastewater", l.sewer === "sewer" ? "County sewer" : l.sewer === "cesspool" ? "Cesspool (2050 conversion applies)" : "Septic"),
    row("Solar PV", l.pv === "owned-nem" ? "Owned, NEM transfers" : l.pv === "leased" ? "Leased, transfer required" : "None"),
    row("Short-term rental", l.strEligible ? "Legal (resort-zoned)" : "Not permitted under Bill 41 (90-day min)"),
    row("Orientation", l.orientation === "mauka" ? "Mauka" : "Makai"),
    row("List date (demo)", d.listDate),
    row("Days on market", d.dom),
  ].join("");

  const section = (title, body, open) => `
    <details class="dsection" ${open ? "open" : ""}>
      <summary>${title}</summary>
      <div class="dbody">${body}</div>
    </details>`;

  return section("Property details", property, true)
    + section("Remarks", remarks, false)
    + section("Financial information", financial, false)
    + section("School information", school, false)
    + section("Other property details", other, false);
}

function openSheet(id) {
  const l = LISTINGS.find((x) => x.id === id);
  if (!l) return;
  sheetOpts.downPct = 0.2; sheetOpts.rate = 6.75; sheetOpts.ownerOcc = true;
  const region = REGIONS.find((r) => r.id === l.region).name;
  $("#sheet").innerHTML = `
    <div class="sheet-img">
      <img src="${imgURL(l, 1400, 600)}" alt="${TYPE_LABELS[l.type]} at ${l.address}" width="1400" height="600" />
      <button class="sheet-close" aria-label="Close details">&times;</button>
    </div>
    <div class="sheet-body">
      <div class="sheet-head">
        <div>
          <h2>${l.address}</h2>
          <div class="card-hood">${l.neighborhood} - ${region} - MLS# ${l.mls} (demo)</div>
          <div class="sheet-badges">${tenureBadge(l)}${flagBadges(l)}</div>
        </div>
        <div class="sheet-price">${fmt$(l.price)}</div>
      </div>
      <p class="sheet-desc">${l.desc}</p>
      <div class="facts">
        <div class="fact"><div class="f-label">Type</div><div class="f-val">${TYPE_LABELS[l.type]}</div></div>
        <div class="fact"><div class="f-label">Beds / Baths</div><div class="f-val">${l.beds} bd, ${l.baths} ba</div></div>
        <div class="fact"><div class="f-label">Interior</div><div class="f-val">${l.sqft.toLocaleString()} sqft</div></div>
        ${l.lanaiSqft ? `<div class="fact"><div class="f-label">Lanai</div><div class="f-val">${l.lanaiSqft} sqft</div></div>` : ""}
        <div class="fact"><div class="f-label">Parking</div><div class="f-val">${l.parking} stalls</div></div>
        <div class="fact"><div class="f-label">Built</div><div class="f-val">${l.yearBuilt}</div></div>
        <div class="fact"><div class="f-label">Orientation</div><div class="f-val">${l.orientation === "mauka" ? "Mauka (mountains)" : "Makai (ocean)"}</div></div>
        <div class="fact"><div class="f-label">Views</div><div class="f-val">${l.views.join(", ")}</div></div>
      </div>
      ${leasePanelHTML(l)}
      <div class="panel cost-panel">
        <h3>True monthly cost</h3>
        <div class="cost-controls">
          <div>
            <label for="ctlDown">Down payment <output id="outDown">20%</output></label>
            <input type="range" id="ctlDown" min="5" max="50" step="5" value="20" />
          </div>
          <div>
            <label for="ctlRate">Rate <output id="outRate">6.75%</output></label>
            <input type="range" id="ctlRate" min="4" max="9" step="0.25" value="6.75" />
          </div>
          <div>
            <label class="check" style="margin-top:18px"><input type="checkbox" id="ctlOcc" checked /> Owner-occupant (home exemption)</label>
          </div>
        </div>
        <div class="cost-rows" id="costRows">${costRowsHTML(l)}</div>
      </div>
      <div class="panel">
        <h3>Island factors</h3>
        <div class="hazards">${hazardsHTML(l)}</div>
      </div>
      <div class="dsections">${detailSectionsHTML(l)}</div>
      <div class="sheet-cta">
        <button class="btn" type="button" data-contact>Ask an island agent</button>
        <button class="btn btn-ghost save-inline ${saved.has(l.id) ? "on" : ""}" type="button" data-save-sheet="${l.id}">${saved.has(l.id) ? "Saved" : "Save home"}</button>
      </div>
    </div>`;
  const overlay = $("#overlay");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  $(".sheet-close").addEventListener("click", closeSheet);
  $("[data-contact]").addEventListener("click", (e) => {
    e.target.textContent = "Demo only: agent contact goes here";
    e.target.disabled = true;
  });
  $("[data-save-sheet]").addEventListener("click", (e) => {
    toggleSaved(l.id);
    const on = saved.has(l.id);
    e.target.textContent = on ? "Saved" : "Save home";
    e.target.classList.toggle("on", on);
    render();
  });
  const refresh = () => { $("#costRows").innerHTML = costRowsHTML(l); };
  $("#ctlDown").addEventListener("input", (e) => { sheetOpts.downPct = e.target.value / 100; $("#outDown").textContent = e.target.value + "%"; refresh(); });
  $("#ctlRate").addEventListener("input", (e) => { sheetOpts.rate = parseFloat(e.target.value); $("#outRate").textContent = sheetOpts.rate.toFixed(2) + "%"; refresh(); });
  $("#ctlOcc").addEventListener("change", (e) => { sheetOpts.ownerOcc = e.target.checked; refresh(); });
}

function closeSheet() {
  $("#overlay").classList.remove("open");
  document.body.style.overflow = "";
}

/* ---------- Map view (OSM tiles, slippy-map math, no libraries) ---------- */

const MAP = { z: 11, x0: 123, x1: 127, y0: 897, y1: 900 };  // tile window covering O'ahu

function lonToWorldX(lon) { return ((lon + 180) / 360) * Math.pow(2, MAP.z) * 256; }
function latToWorldY(lat) {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, MAP.z) * 256;
}

function fmtShort(n) {
  return n >= 1000000 ? "$" + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M" : "$" + Math.round(n / 1000) + "k";
}

let mapBuilt = false;
function buildMapTiles() {
  if (mapBuilt) return;
  mapBuilt = true;
  const cols = MAP.x1 - MAP.x0 + 1, rows = MAP.y1 - MAP.y0 + 1;
  const canvas = $("#mapCanvas");
  canvas.style.aspectRatio = `${cols * 256} / ${rows * 256}`;
  let tiles = "";
  for (let ty = MAP.y0; ty <= MAP.y1; ty++) {
    for (let tx = MAP.x0; tx <= MAP.x1; tx++) {
      const left = ((tx - MAP.x0) / cols) * 100, top = ((ty - MAP.y0) / rows) * 100;
      tiles += `<img class="map-tile" loading="lazy" alt="" src="https://tile.openstreetmap.org/${MAP.z}/${tx}/${ty}.png"
        style="left:${left}%;top:${top}%;width:${100 / cols}%;height:${100 / rows}%" />`;
    }
  }
  canvas.innerHTML = tiles + `<div class="map-pins" id="mapPins"></div>`;
}

function renderMapPins(results) {
  if (!mapBuilt) return;
  const cols = MAP.x1 - MAP.x0 + 1, rows = MAP.y1 - MAP.y0 + 1;
  const originX = MAP.x0 * 256, originY = MAP.y0 * 256;
  const w = cols * 256, h = rows * 256;
  $("#mapPins").innerHTML = results.filter((l) => l.publicRecord && l.publicRecord.lat).map((l) => {
    const px = ((lonToWorldX(l.publicRecord.lon) - originX) / w) * 100;
    const py = ((latToWorldY(l.publicRecord.lat) - originY) / h) * 100;
    if (px < 0 || px > 100 || py < 0 || py > 100) return "";
    const cls = l.tenure === "FS" ? "pin-fs" : "pin-lh";
    return `<button class="map-pin ${cls}" style="left:${px}%;top:${py}%" data-pin="${l.id}"
      aria-label="${l.address}, ${fmt$(l.price)}">${fmtShort(l.price)}</button>`;
  }).join("");
  $$("#mapPins .map-pin").forEach((p) => p.addEventListener("click", () => openSheet(p.dataset.pin)));
}

/* ---------- Regions ---------- */

// Wikimedia Commons photos (freely licensed); filled per region as sourced
const WM = "https://upload.wikimedia.org/wikipedia/commons/thumb";
const REGION_IMGS = {
  metro: `${WM}/4/49/Waikiki_Skyline_%287733357776%29.jpg/1280px-Waikiki_Skyline_%287733357776%29.jpg`,
  windward: `${WM}/b/b7/Kailua_Beach_Houses%2C_Oahu%2C_Hawaii.jpg/1280px-Kailua_Beach_Houses%2C_Oahu%2C_Hawaii.jpg`,
  northshore: `${WM}/d/d1/WaimeaBay.jpg/1280px-WaimeaBay.jpg`,
  kapolei: `${WM}/5/56/Ko_Olina_Lagoon_3.jpg/1280px-Ko_Olina_Lagoon_3.jpg`,
  ewa: `${WM}/e/e2/Ewa_Aerial.jpg/1280px-Ewa_Aerial.jpg`,
  diamondhead: `${WM}/b/bf/Diamond_Head_Beach_%285214957131%29.jpg/960px-Diamond_Head_Beach_%285214957131%29.jpg`,
  hawaiikai: `${WM}/1/15/Honolulu_near_Koko_Head_regional_park_-_panoramio.jpg/960px-Honolulu_near_Koko_Head_regional_park_-_panoramio.jpg`,
  pearlcity: `${WM}/b/b9/Pearl_Harbor_Middle_Loch.jpg/960px-Pearl_Harbor_Middle_Loch.jpg`,
  leeward: `${WM}/d/dc/M%C4%81kaha-Beach-Park-2014.jpg/960px-M%C4%81kaha-Beach-Park-2014.jpg`,
  central: `${WM}/0/07/Dole_Plantation_%2812113250643%29.jpg/960px-Dole_Plantation_%2812113250643%29.jpg`,
};

function renderRegions() {
  const sel = $("#regionSel");
  const grid = $("#regionGrid");
  REGIONS.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.id; opt.textContent = r.name;
    sel.appendChild(opt);
    const count = LISTINGS.filter((l) => l.region === r.id).length;
    const btn = document.createElement("button");
    btn.className = "region-card reveal";
    btn.type = "button";
    const photo = REGION_IMGS[r.id]
      ? `<div class="region-img"><img loading="lazy" src="${REGION_IMGS[r.id]}" alt="${r.name}" width="640" height="360" /></div>` : "";
    btn.innerHTML = `${photo}<div class="region-body"><h3>${r.name}</h3><p>${r.blurb}</p><span class="r-count">${count} ${count === 1 ? "listing" : "listings"}</span></div>`;
    btn.addEventListener("click", () => {
      state.region = r.id;
      sel.value = r.id;
      render();
      $("#search").scrollIntoView({ behavior: "smooth" });
    });
    grid.appendChild(btn);
  });
}

/* ---------- Reveal on scroll ---------- */

let revealObserver = null;
function observeReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$(".reveal").forEach((el) => el.classList.add("in"));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
  }
  $$(".reveal:not(.in)").forEach((el) => revealObserver.observe(el));
}

/* ---------- Wiring ---------- */

function resetFilters() {
  Object.assign(state, {
    tenure: "all", q: "", region: "all", priceMin: null, priceMax: null,
    bedsMin: 0, bathsMin: 0, types: new Set(["single", "condo", "town", "cpr"]),
    leaseYearsMin: 0, feeAvail: false, leaseRentMax: null, maintMax: null,
    fldSafe: false, tsuSafe: false, sewerOnly: false, pvOwned: false, strOnly: false,
  });
  $("#q").value = ""; $("#regionSel").value = "all";
  $("#priceMin").value = ""; $("#priceMax").value = "";
  $("#bedsMin").value = "0"; $("#bathsMin").value = "0";
  $$("#heroSearch [data-tenure]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tenure === "all")));
  $$('input[data-type]').forEach((c) => { c.checked = true; });
  $("#leaseYears").value = 0; $("#leaseYearsOut").textContent = "any";
  $("#feeAvail").checked = false; $("#leaseRentMax").value = ""; $("#maintMax").value = "";
  ["fldSafe", "tsuSafe", "sewerOnly", "pvOwned", "strOnly"].forEach((id) => { $("#" + id).checked = false; });
  render();
}

function init() {
  mergePublicRecords();
  renderRegions();

  // Search typeahead: neighborhoods + regions
  const places = [...new Set([...LISTINGS.map((l) => l.neighborhood), ...REGIONS.map((r) => r.name)])].sort();
  $("#placesList").innerHTML = places.map((p) => `<option value="${p}"></option>`).join("");

  $("#heroSearch").addEventListener("submit", (e) => {
    e.preventDefault();
    state.q = $("#q").value;
    render();
    $("#search").scrollIntoView({ behavior: "smooth" });
  });
  $("#q").addEventListener("input", (e) => { state.q = e.target.value; render(); });

  $$("#heroSearch [data-tenure]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tenure = btn.dataset.tenure;
      $$("#heroSearch [data-tenure]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      render();
    });
  });

  $("#regionSel").addEventListener("change", (e) => { state.region = e.target.value; render(); });
  $("#priceMin").addEventListener("input", (e) => { state.priceMin = e.target.value ? +e.target.value : null; render(); });
  $("#priceMax").addEventListener("input", (e) => { state.priceMax = e.target.value ? +e.target.value : null; render(); });
  $("#bedsMin").addEventListener("change", (e) => { state.bedsMin = +e.target.value; render(); });
  $("#bathsMin").addEventListener("change", (e) => { state.bathsMin = +e.target.value; render(); });

  $$('input[data-type]').forEach((cb) => {
    cb.addEventListener("change", () => {
      cb.checked ? state.types.add(cb.dataset.type) : state.types.delete(cb.dataset.type);
      render();
    });
  });

  $("#leaseYears").addEventListener("input", (e) => {
    state.leaseYearsMin = +e.target.value;
    $("#leaseYearsOut").textContent = state.leaseYearsMin === 0 ? "any" : state.leaseYearsMin + "+ yrs";
    render();
  });
  $("#feeAvail").addEventListener("change", (e) => { state.feeAvail = e.target.checked; render(); });
  $("#leaseRentMax").addEventListener("input", (e) => { state.leaseRentMax = e.target.value ? +e.target.value : null; render(); });
  $("#maintMax").addEventListener("input", (e) => { state.maintMax = e.target.value ? +e.target.value : null; render(); });

  ["fldSafe", "tsuSafe", "sewerOnly", "pvOwned", "strOnly"].forEach((id) => {
    $("#" + id).addEventListener("change", (e) => { state[id] = e.target.checked; render(); });
  });

  $("#sortSel").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#resetBtn").addEventListener("click", resetFilters);

  $("#cards").addEventListener("click", (e) => {
    const save = e.target.closest(".save-btn");
    if (save) {
      e.stopPropagation();
      toggleSaved(save.dataset.save);
      save.classList.toggle("on");
      save.setAttribute("aria-pressed", save.classList.contains("on"));
      if (state.savedOnly) render();
      return;
    }
    const card = e.target.closest(".card");
    if (card) openSheet(card.dataset.id);
  });
  $("#savedOnly").addEventListener("click", (e) => {
    state.savedOnly = !state.savedOnly;
    e.currentTarget.setAttribute("aria-pressed", String(state.savedOnly));
    render();
  });
  $("#filtersToggle").addEventListener("click", () => {
    $(".filter-rail").classList.toggle("open");
    document.body.classList.toggle("sheet-open", $(".filter-rail").classList.contains("open"));
  });
  $("#railClose").addEventListener("click", () => {
    $(".filter-rail").classList.remove("open");
    document.body.classList.remove("sheet-open");
  });
  $("#viewToggle").addEventListener("click", (e) => {
    state.view = state.view === "list" ? "map" : "list";
    const isMap = state.view === "map";
    e.currentTarget.textContent = isMap ? "List" : "Map";
    e.currentTarget.setAttribute("aria-pressed", String(isMap));
    $("#mapWrap").hidden = !isMap;
    $("#cards").hidden = isMap;
    if (isMap) { buildMapTiles(); render(); }
  });
  $("#cards").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest(".card");
      if (card) { e.preventDefault(); openSheet(card.dataset.id); }
    }
  });
  $("#overlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeSheet(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

  $("#themeBtn").addEventListener("click", () => {
    const html = document.documentElement;
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("himls-theme", next);
  });

  render();
  observeReveals();
}

document.addEventListener("DOMContentLoaded", init);
