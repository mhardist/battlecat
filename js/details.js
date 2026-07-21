// Full-detail fields matching what hicentral.com property pages carry today.
// DETAIL_EXTRAS: per-listing physical/amenity facts (demo data).
// SCHOOLS: DOE school assignments by neighborhood (approximate; verify with DOE).

const SCHOOLS = {
  "Waikiki": ["Jefferson Elementary", "Washington Middle", "Kaimuki High"],
  "Makiki": ["Lincoln Elementary", "Stevenson Middle", "Roosevelt High"],
  "Kakaako": ["Royal Elementary", "Keelikolani Middle", "McKinley High"],
  "Hawaii Kai": ["Hahaione Elementary", "Niu Valley Middle", "Kaiser High"],
  "Kailua": ["Kainalu Elementary", "Kailua Intermediate", "Kailua High"],
  "Mililani Mauka": ["Mililani Mauka Elementary", "Mililani Middle", "Mililani High"],
  "Ocean Pointe": ["Keoneula Elementary", "Ewa Makai Middle", "Campbell High"],
  "Kaneohe": ["Kaneohe Elementary", "King Intermediate", "Castle High"],
  "Maili": ["Maili Elementary", "Waianae Intermediate", "Waianae High"],
  "Sunset Beach": ["Sunset Beach Elementary", "Kahuku High & Intermediate", "Kahuku High & Intermediate"],
  "Salt Lake": ["Salt Lake Elementary", "Aliamanu Middle", "Radford High"],
  "Kahala": ["Kahala Elementary", "Kaimuki Middle", "Kalani High"],
  "Pearlridge": ["Aiea Elementary", "Aiea Intermediate", "Aiea High"],
  "Aina Haina": ["Aina Haina Elementary", "Niu Valley Middle", "Kalani High"],
  "Ko Olina": ["Barbers Point Elementary", "Kapolei Middle", "Kapolei High"],
  "Nuuanu / Punchbowl": ["Pauoa Elementary", "Kawananakoa Middle", "McKinley High"],
  "Moiliili": ["Kuhio Elementary", "Washington Middle", "Kaimuki High"],
};

const DETAIL_EXTRAS = {
  l01: { condition: "Average", stories: "One (high-rise, 15 stories)", construction: "Concrete", roof: "Built-up", parkingType: "Assigned, covered", furnished: "Partial", pool: "Building pool", amenities: ["Pool", "Resident manager", "Trash chute", "Community laundry"], inclusions: ["Range", "Refrigerator", "AC (window)"], remarksExtra: "Building recently completed spall repairs; healthy reserves per demo HOA docs." },
  l02: { condition: "Above average", stories: "One (high-rise, 12 stories)", construction: "Concrete", roof: "Built-up", parkingType: "Assigned, covered", furnished: "No", pool: "Building pool", amenities: ["Pool", "BBQ", "Resident manager", "Storage"], inclusions: ["Range", "Refrigerator", "Dishwasher", "Washer/Dryer"], remarksExtra: "Fee purchase can be bundled into financing with participating local lenders." },
  l03: { condition: "Excellent", stories: "One (high-rise, 40 stories)", construction: "Concrete and glass", roof: "Built-up", parkingType: "2 assigned, secured", furnished: "No", pool: "Infinity pool", amenities: ["Infinity pool", "Fitness center", "Guest suites", "Dog park", "Concierge"], inclusions: ["Full appliance package", "Wine fridge", "Washer/Dryer"], remarksExtra: "Ward Village-style amenity deck; parking on cooled level P3." },
  l04: { condition: "Above average", stories: "Two", construction: "Wood frame and masonry", roof: "Asphalt shingle", parkingType: "2-car garage", furnished: "No", pool: "None (marina frontage)", frontage: "Marina", amenities: ["Boat dock", "Fenced yard"], inclusions: ["Range", "Refrigerator", "Washer/Dryer", "PV system (owned)"], remarksExtra: "Dock accommodates a 24-ft boat; direct channel access to Maunalua Bay." },
  l05: { condition: "Average", stories: "One", construction: "Single wall, redwood", roof: "Asphalt shingle", parkingType: "Carport + driveway", furnished: "No", pool: "None", amenities: ["Level yard", "Storage shed"], inclusions: ["Range", "Refrigerator"], remarksExtra: "Original single-wall charm; survey and permits for a future ohana in demo docs." },
  l06: { condition: "Above average", stories: "Two", construction: "Double wall", roof: "Asphalt shingle", parkingType: "2-car garage", furnished: "No", pool: "Association pool", amenities: ["Community pool", "Rec center", "Guest parking"], inclusions: ["Range", "Refrigerator", "Dishwasher", "Washer/Dryer"], remarksExtra: "Mililani Mauka association with seven rec centers island-famous for value." },
  l07: { condition: "Excellent", stories: "Two", construction: "Double wall", roof: "Asphalt shingle", parkingType: "2-car garage", furnished: "No", pool: "None", amenities: ["PV + battery", "Fenced yard", "Community parks"], inclusions: ["Full appliance package", "PV system (owned)", "Battery storage"], remarksExtra: "Post-2010 build with hurricane clips; insurer-friendly wind mitigation." },
  l08: { condition: "Average", stories: "One", construction: "Single wall", roof: "Corrugated metal", parkingType: "Carport", furnished: "No", pool: "None", amenities: ["Mountain views", "Fruit trees"], inclusions: ["Range", "Refrigerator"], remarksExtra: "CPR share includes exclusive-use yard; shared driveway maintenance agreement recorded." },
  l09: { condition: "Average", stories: "One", construction: "Masonry", roof: "Asphalt shingle", parkingType: "Driveway, 2 stalls", furnished: "No", pool: "None", amenities: ["Corner lot", "PV (owned)"], inclusions: ["Range", "Refrigerator", "PV system (owned)"], remarksExtra: "DHHL successorship rules apply; consult DHHL before writing an offer." },
  l10: { condition: "Fair, sold as-is", stories: "One", construction: "Single wall", roof: "Corrugated metal", parkingType: "Gravel pad, 3 stalls", furnished: "Partial", pool: "None", frontage: "Sand beach", amenities: ["Beach frontage", "Outdoor shower"], inclusions: ["Range", "Refrigerator"], remarksExtra: "Shoreline certification in demo docs; seawall not permitted, plan for managed retreat." },
  l11: { condition: "Average", stories: "One (mid-rise, 8 stories)", construction: "Concrete", roof: "Built-up", parkingType: "Assigned, open", furnished: "No", pool: "None", amenities: ["Resident manager", "Community laundry"], inclusions: ["Range", "Refrigerator"], remarksExtra: "Priced for the remaining lease term; lessor has not announced fee sale plans." },
  l12: { condition: "Above average", stories: "One (high-rise, 22 stories)", construction: "Concrete", roof: "Built-up", parkingType: "Valet (hotel program)", furnished: "Turnkey furnished", pool: "Resort pool", amenities: ["Resort pool", "Front desk", "Housekeeping program", "Restaurant"], inclusions: ["Turnkey furniture package", "Kitchenette appliances"], remarksExtra: "Hotel rental program history available; GET/TAT licenses transferable." },
  l13: { condition: "Excellent", stories: "Two", construction: "Double wall, custom", roof: "Tile", parkingType: "3-car garage", furnished: "Negotiable", pool: "In-ground pool", amenities: ["Pool pavilion", "Outdoor kitchen", "PV (owned)"], inclusions: ["Luxury appliance package", "Pool equipment", "PV system (owned)"], remarksExtra: "One lot from Kahala Beach access lane; mature coconut palms frame the yard." },
  l14: { condition: "Above average", stories: "Two", construction: "Double wall", roof: "Asphalt shingle", parkingType: "2 assigned, covered", furnished: "No", pool: "Association pool", amenities: ["Community pool", "Playground", "Guest parking"], inclusions: ["Range", "Refrigerator", "Dishwasher", "Washer/Dryer"], remarksExtra: "Association covers water, sewer, and building insurance; healthy demo reserves." },
  l15: { condition: "Average", stories: "One", construction: "Single wall", roof: "Asphalt shingle", parkingType: "2-car carport", furnished: "No", pool: "None", amenities: ["Valley breezes", "Ocean glimpse lanai"], inclusions: ["Range", "Refrigerator", "Washer/Dryer"], remarksExtra: "PV lease at $128/mo transfers; buyer to qualify with the PV lessor." },
  l16: { condition: "Above average", stories: "One", construction: "Concrete and masonry", roof: "Tile", parkingType: "2 assigned, 1 covered", furnished: "Turnkey furnished", pool: "Resort pools + lagoons", amenities: ["Lagoon access", "Golf", "Resort pools", "BBQ pavilions"], inclusions: ["Turnkey furniture package", "Full appliance package"], remarksExtra: "Resort-zoned; STR history and forward bookings conveyable in demo docs." },
  l17: { condition: "Average", stories: "One (mid-rise, 9 stories)", construction: "Concrete", roof: "Built-up", parkingType: "Assigned, open", furnished: "No", pool: "None", amenities: ["Resident manager", "Storage", "Trash chute"], inclusions: ["Range", "Refrigerator", "AC (window)"], remarksExtra: "Kamehameha Schools lease; fee purchase window in demo docs closes next year." },
  l18: { condition: "Average", stories: "One (walk-up, 3 stories)", construction: "Masonry", roof: "Built-up", parkingType: "1 assigned, open", furnished: "No", pool: "None", amenities: ["Bike storage", "Community laundry"], inclusions: ["Range", "Refrigerator", "AC (window)"], remarksExtra: "Walk score island-elite: UH, Ala Moana, and King Street bus spine at the door." },
};

// Land Court (Torrens) is typical for the master-planned subdivisions; Regular elsewhere
const LAND_COURT_REGIONS = new Set(["hawaiikai", "central", "ewa", "kapolei"]);

function derivedDetails(l) {
  const n = parseInt(l.id.slice(1), 10);
  const dom = 12 + ((n * 17) % 74);              // deterministic demo days-on-market
  const yrsLeft = l.lease ? l.lease.expYear - THIS_YEAR : null;
  let terms;
  if (l.tenure === "DHHL") terms = "Cash or DHHL-approved lender";
  else if (l.tenure === "LH" && yrsLeft < 20) terms = "Cash";
  else if (l.tenure === "LH") terms = "Cash, Conventional (term-limited)";
  else if (l.strEligible) terms = "Cash, Conventional";
  else terms = "Cash, Conventional, VA, FHA";
  return {
    dom,
    listDate: `2026-${String(((n * 3) % 5) + 3).padStart(2, "0")}-${String(((n * 7) % 27) + 1).padStart(2, "0")}`,
    terms,
    landRecorded: LAND_COURT_REGIONS.has(l.region) ? "Land Court" : "Regular System",
    totalSqft: l.sqft + (l.lanaiSqft || 0),
  };
}
