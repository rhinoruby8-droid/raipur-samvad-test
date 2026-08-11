import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.comment.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.adPlacement.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding Users...');
  const users = [
    {
      id: 'usr-admin-1',
      email: 'editor@raipursamvad.com',
      name: 'Rajesh Sharma',
      role: 'ADMIN',
      password: 'admin123',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      bio: 'Editor-in-Chief, Raipur Samvad. 18+ years reporting on Chhattisgarh politics, civic development, and investigative journalism.',
      createdAt: new Date('2025-01-15T08:00:00Z'),
    },
    {
      id: 'usr-journo-1',
      email: 'priya.verma@raipursamvad.com',
      name: 'Priya Verma',
      role: 'JOURNALIST',
      password: 'journo123',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      bio: 'Senior Bureau Chief covering Raipur Smart City, urban infrastructure, and administrative affairs.',
      createdAt: new Date('2025-02-01T09:30:00Z'),
    },
    {
      id: 'usr-journo-2',
      email: 'amitabh.sahu@raipursamvad.com',
      name: 'Amitabh Sahu',
      role: 'JOURNALIST',
      password: 'journo123',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      bio: 'Cultural Correspondent and Local Economy Analyst in Chhattisgarh.',
      createdAt: new Date('2025-02-10T11:15:00Z'),
    },
    {
      id: 'usr-sub-1',
      email: 'deepak.agrawal@gmail.com',
      name: 'Deepak Agrawal',
      role: 'SUBSCRIBER',
      password: 'sub123',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      createdAt: new Date('2025-03-01T14:20:00Z'),
    },
    {
      id: 'usr-reader-1',
      email: 'kavita.sahu@outlook.com',
      name: 'Kavita Sahu',
      role: 'READER',
      password: 'reader123',
      createdAt: new Date('2025-03-05T16:00:00Z'),
    },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  console.log('Seeding Categories...');
  const categories = [
    { name: 'Raipur', slug: 'raipur' },
    { name: 'Chhattisgarh', slug: 'chhattisgarh' },
    { name: 'Administration', slug: 'administration' },
    { name: 'Business', slug: 'business' },
    { name: 'Culture', slug: 'culture' },
    { name: 'Opinion', slug: 'opinion' },
  ];

  for (const c of categories) {
    await prisma.category.create({ data: c });
  }

  console.log('Seeding Articles...');
  const articles = [
    {
      id: 'art-1',
      title: 'Raipur Municipal Corporation Approves ₹185 Cr Smart Elevated Corridor Connecting Jaistambh Chowk to Telibandha Marine Drive',
      slug: 'raipur-municipal-corporation-approves-185cr-elevated-corridor-telibandha',
      excerpt: 'In a unanimous vote, the city council passed the landmark infrastructure ordinance to ease peak-hour traffic bottleneck along GE Road and upgrade electric bus rapid transit.',
      content: `RAIPUR — In a major boost to city mobility, the Raipur Municipal Corporation (RMC) approved the final DPR for the ₹185 Crore Elevated Smart Transit Corridor during a high-powered council meeting on Tuesday.

The 4.2-kilometer four-lane flyover will directly connect the historic Jaistambh Chowk commercial precinct with the Telibandha Marine Drive promenade, bypassing five major signals along Great Eastern (GE) Road.

### Project Highlights:
- **EV Express Lane:** Dedicated double-width lane for zero-emission electric buses and emergency response vehicles.
- **Smart LED Canopy & Solar Noise Barriers:** Rooftop solar panels generate power for 100% of street lighting along the corridor.
- **Underpass Re-engineering:** Signalized junction upgrades at Ghadi Chowk and Collectorate Circle to ensure seamless traffic flow.

Mayor Aijaz Dhebar stated during the press briefing: "Raipur is expanding at a rapid pace as Chhattisgarh's administrative and financial hub. This elevated corridor will reduce commuter travel times between Jaistambh Chowk and Marine Drive from 35 minutes down to just 8 minutes."

### Public Reactions & Civil Engineering Timeline
Engineering teams from the Public Works Department (PWD) confirmed that preliminary soil testing and utility shifting will commence next month. 

To safeguard local traders around Malviya Road, construction work will utilize pre-cast concrete girders assembled off-site, drastically minimizing surface-level disruptions during festival shopping seasons.

Public hearings regarding traffic diversions along Fafadih and Pandri will take place at the Nagar Nigam Auditorium next Thursday at 5:00 PM.`,
      category: 'Raipur',
      paywallStatus: 'FREE',
      coverImageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&q=80&w=1200',
      viewCount: 4280,
      status: 'PUBLISHED',
      isPublished: true,
      publishedAt: new Date('2026-08-09T18:30:00Z'),
      authorId: 'usr-journo-1',
      seoHeadlines: JSON.stringify([
        'Raipur Municipal Corporation Approves ₹185 Cr Smart Flyover Project',
        'Jaistambh Chowk to Telibandha Marine Drive 4-Lane Elevated Road Announced',
        'Raipur Traffic Upgrade: ₹185 Cr GE Road Elevated Corridor Passes Final Vote'
      ]),
      metaDescription: 'RMC approves ₹185 Cr elevated corridor connecting Jaistambh Chowk to Telibandha Marine Drive in Raipur. Features EV lanes and solar noise barriers.',
      tags: JSON.stringify(['Raipur', 'Smart City', 'Infrastructure', 'Jaistambh Chowk', 'Telibandha', 'Chhattisgarh']),
      createdAt: new Date('2026-08-09T18:00:00Z'),
      updatedAt: new Date('2026-08-09T18:30:00Z'),
    },
    {
      id: 'art-2',
      title: 'Investigative Report: Industrial Expansion in Naya Raipur Sparks ₹4,500 Cr Manufacturing & Green Energy Boom',
      slug: 'investigative-report-industrial-expansion-naya-raipur-green-energy',
      excerpt: 'Global solar equipment makers and logistics hubs acquire land parcels in Atal Nagar as Chhattisgarh accelerates its new state industrial policy.',
      content: `ATAL NAGAR (NAYA RAIPUR) — Over the past 18 months, Naya Raipur's Sector 22 Industrial Zone has witnessed an unprecedented influx of technology manufacturers, lithium battery packagers, and agro-processing firms.

Our 4-month investigative analysis of Chhattisgarh State Industrial Development Corporation (CSIDC) land allotments reveals over **₹4,500 Crore in finalized capital investment pledges** across 28 new industrial units.

### Transitioning to Clean Energy Manufacturing
Key among the new developments is a 120-acre mega-factory by Central India Solar Tech, which aims to manufacture 2.5 GW of high-efficiency PV modules annually.

"Chhattisgarh's central geographical connectivity, reliable power grid, and skilled engineering workforce from NIT Raipur and IIIT Naya Raipur make this the ideal logistics epicenter," noted Managing Director Sanjay Khandelwal.

### Groundwater & Environmental Safeguards
While local business chambers have welcomed the employment boom—projected to generate over 14,000 direct jobs—environmental activists have called for stringent continuous emissions monitoring systems (CEMS) and zero-liquid discharge (ZLD) enforcement.

In response, the State Pollution Control Board announced daily telemetry monitoring standards accessible to the public via an online open-data portal.`,
      category: 'Business',
      paywallStatus: 'SUBSCRIBER_ONLY',
      coverImageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200',
      viewCount: 2310,
      status: 'PUBLISHED',
      isPublished: true,
      publishedAt: new Date('2026-08-08T10:15:00Z'),
      authorId: 'usr-journo-2',
      seoHeadlines: JSON.stringify([
        'Investigative Report: Naya Raipur Industrial Expansion Reaches ₹4,500 Cr',
        'Solar Tech & Logistics Hubs Driving Manufacturing Boom in Atal Nagar',
        'Chhattisgarh Industrial Policy Attracts Major Green Energy Investment to Naya Raipur'
      ]),
      metaDescription: 'Exclusive analysis of CSIDC land allotments in Naya Raipur shows ₹4,500 Cr in green energy and manufacturing investments. Over 14,000 jobs expected.',
      tags: JSON.stringify(['Naya Raipur', 'Business', 'Chhattisgarh', 'Industrial Policy', 'Green Energy']),
      createdAt: new Date('2026-08-08T09:30:00Z'),
      updatedAt: new Date('2026-08-08T10:15:00Z'),
    },
    {
      id: 'art-3',
      title: 'AIIMS Raipur Unveils Advanced Pediatric Intensive Care Unit & Statewide Tele-Medicine Network',
      slug: 'aiims-raipur-unveils-advanced-pediatric-icu-telemedicine-network',
      excerpt: 'The state-of-the-art facility features 40 specialized isolation beds and remote ICU monitoring for primary health centers across all 33 districts of Chhattisgarh.',
      content: `RAIPUR — All India Institute of Medical Sciences (AIIMS) Raipur inaugurated its expanded 40-bed Pediatric Intensive Care Unit (PICU) alongside a pioneering Tele-ICU Command Centre on Saturday.

Equipped with real-time AI vital monitoring and high-definition video conferencing, the Tele-ICU setup enables AIIMS pediatric specialists in Raipur to mentor medical officers treating critical patients at community health centers in Bastar, Surguja, and Dantewada.

### Strengthening Rural Healthcare Access
Director of AIIMS Raipur emphasized that early intervention through tele-consultation will reduce emergency patient transfer delays by over 60%.

"Distance should never dictate healthcare quality in Chhattisgarh," the Director remarked during the opening ceremony attended by state health dignitaries. "This network brings world-class ICU expertise to the most remote tribal blocks in real time."`,
      category: 'Administration',
      paywallStatus: 'FREE',
      coverImageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1200',
      viewCount: 1890,
      status: 'PUBLISHED',
      isPublished: true,
      publishedAt: new Date('2026-08-07T14:00:00Z'),
      authorId: 'usr-journo-1',
      seoHeadlines: JSON.stringify([
        'AIIMS Raipur Launches Advanced Pediatric ICU & Statewide Tele-ICU Centre',
        'New Tele-Medicine Hub Connects AIIMS Raipur Specialists with Remote Chhattisgarh Districts',
        'Healthcare Upgrade: AIIMS Raipur Unveils 40-Bed Pediatric ICU and AI Tele-Monitoring'
      ]),
      metaDescription: 'AIIMS Raipur opens 40-bed Pediatric ICU and Tele-ICU command hub connecting all 33 districts of Chhattisgarh for remote critical care.',
      tags: JSON.stringify(['Healthcare', 'AIIMS Raipur', 'Administration', 'Telemedicine', 'Chhattisgarh']),
      createdAt: new Date('2026-08-07T13:30:00Z'),
      updatedAt: new Date('2026-08-07T14:00:00Z'),
    },
    {
      id: 'art-4',
      title: 'State Handicrafts & Dokra Art Fair at Grass Memorial Ground Draws Thousands of Art Lovers',
      slug: 'state-handicrafts-dokra-art-fair-grass-memorial-ground-raipur',
      excerpt: 'Over 120 artisan stalls displaying Bell Metal craft, Kosa Silk sarees, and Terracotta pottery record record-breaking weekend sales in Raipur.',
      content: `RAIPUR — The historic Grass Memorial Ground near Budha Talab came alive on Saturday as the 10-day Chhattisgarh State Handicrafts Exhibition opened to enthusiastic crowds.

Organized by the Chhattisgarh Handicrafts Development Board (Handloom Board), the fair showcases heritage crafts including Kondagaon Bell Metal (Dokra), Raigarh Kosa Silk, and Kumhar Para Terracotta.

### Preserving Ancient Craft Heritage
Master artisan Sukhlal Jhared, a National Award winner from Kondagaon, demonstrated the intricate lost-wax casting technique used to craft Dokra idols.

"Each sculpture takes weeks of painstaking clay modeling, wax threading, and bronze casting," Jhared shared while demonstrating to students from Indira Kala Sangeet Vishwavidyalaya. "Seeing the younger generation in Raipur appreciate our traditional art gives us great hope."

The exhibition remains open daily from 11:00 AM to 9:30 PM until August 18, with cultural Chhattisgarhi folk dance performances held every evening.`,
      category: 'Culture',
      paywallStatus: 'FREE',
      coverImageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=1200',
      viewCount: 1250,
      status: 'PUBLISHED',
      isPublished: true,
      publishedAt: new Date('2026-08-06T09:00:00Z'),
      authorId: 'usr-journo-2',
      seoHeadlines: JSON.stringify([]),
      metaDescription: '',
      tags: JSON.stringify(['Culture', 'Raipur', 'Dokra Art', 'Handicrafts', 'Chhattisgarh', 'Budha Talab']),
      createdAt: new Date('2026-08-06T08:30:00Z'),
      updatedAt: new Date('2026-08-06T09:00:00Z'),
    },
    {
      id: 'art-5',
      title: 'Editorial: Hyper-Local Journalism in Raipur is Essential for Civic Integrity and Democratic Accountability',
      slug: 'editorial-hyper-local-journalism-raipur-essential-civic-integrity',
      excerpt: 'Why independent local news portals like Raipur Samvad matter in an era of national headline noise — keeping citizens informed and municipal bodies accountable.',
      content: `EDITORIAL — In today's fast-moving digital media environment, national television networks often drown out the daily stories that affect our immediate lives: water supply scheduling in Shankar Nagar, road repair tenders in Tatibandh, or school board decisions in Pandri.

Hyper-local journalism is the bedrock of vibrant community governance. When local news outlets thrive, public funds are spent more transparently, ward councilors remain responsive, and community voices find a resonant platform.

### The Mission of Raipur Samvad (रायपुर संवाद)
Our editorial pledge at Raipur Samvad is clear:
1. **Har Khabar, Raipur Ke Sath (हर खबर, रायपुर के साथ):** Ground-level reporting verified by reporters living in your neighborhood.
2. **Zero Clickbait & Independence:** No misleading headlines, no forced pop-up spam, and clear separation between editorial reporting and sponsored messages.
3. **Open Access to Essential Alerts:** Emergency civic bulletins, monsoon advisories, and public health updates will always remain free for all residents.

By subscribing to Raipur Samvad, you directly support local journalists fighting for truth and transparency across Raipur and Chhattisgarh.`,
      category: 'Opinion',
      paywallStatus: 'FREE',
      coverImageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200',
      viewCount: 3120,
      status: 'PUBLISHED',
      isPublished: true,
      publishedAt: new Date('2026-08-05T12:00:00Z'),
      authorId: 'usr-admin-1',
      seoHeadlines: JSON.stringify([]),
      metaDescription: '',
      tags: JSON.stringify(['Editorial', 'Raipur Samvad', 'Journalism', 'Raipur', 'Chhattisgarh']),
      createdAt: new Date('2026-08-05T11:00:00Z'),
      updatedAt: new Date('2026-08-05T12:00:00Z'),
    },
    // Seed a Draft Article
    {
      id: 'art-draft-1',
      title: 'Raipur Smart City Project to Get New Smart Parking Stations',
      slug: 'raipur-smart-city-smart-parking-stations',
      excerpt: 'Smart parking stations are set to be installed at five major markets in Raipur...',
      content: 'Smart parking stations are set to be installed at five major markets in Raipur to reduce road congestion and streamline parking space allocation using a mobile app.',
      category: 'Raipur',
      paywallStatus: 'FREE',
      coverImageUrl: 'https://images.unsplash.com/photo-1506521788723-85812b81920a?auto=format&fit=crop&q=80&w=1200',
      viewCount: 0,
      status: 'DRAFT',
      isPublished: false,
      publishedAt: new Date('2026-08-10T12:00:00Z'),
      authorId: 'usr-journo-1',
      seoHeadlines: JSON.stringify([]),
      metaDescription: 'Draft article about new smart parking stations in Raipur.',
      tags: JSON.stringify(['Raipur', 'Smart City', 'Parking']),
      createdAt: new Date('2026-08-10T12:00:00Z'),
      updatedAt: new Date('2026-08-10T12:00:00Z'),
    },
    // Seed a Pending Review Article
    {
      id: 'art-pending-1',
      title: 'New Cultural Center Proposal at Purkhouti Muktangan Gains Momentum',
      slug: 'new-cultural-center-proposal-purkhouti-muktangan',
      excerpt: 'A new state-of-the-art Chhattisgarhi heritage complex is being planned...',
      content: 'A new state-of-the-art Chhattisgarhi heritage complex is being planned inside Purkhouti Muktangan to showcase tribal art and traditional artifacts to tourists.',
      category: 'Culture',
      paywallStatus: 'FREE',
      coverImageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1200',
      viewCount: 0,
      status: 'PENDING_REVIEW',
      isPublished: false,
      publishedAt: new Date('2026-08-10T14:00:00Z'),
      authorId: 'usr-journo-2',
      seoHeadlines: JSON.stringify([]),
      metaDescription: 'Pending article regarding Purkhouti Muktangan heritage complex proposal.',
      tags: JSON.stringify(['Culture', 'Chhattisgarh', 'Purkhouti Muktangan']),
      createdAt: new Date('2026-08-10T14:00:00Z'),
      updatedAt: new Date('2026-08-10T14:00:00Z'),
    }
  ];

  for (const art of articles) {
    await prisma.article.create({ data: art });
  }

  console.log('Seeding Comments...');
  const comments = [
    {
      id: 'cmt-1',
      content: 'Finally! The bus transfer at 4th Ave has been an absolute mess in the rain for years. Glad to see zero-emission buses prioritize clean air in the city center.',
      articleId: 'art-1',
      authorId: 'usr-sub-1',
      parentId: null,
      createdAt: new Date('2026-08-09T19:15:00Z'),
    },
    {
      id: 'cmt-2',
      content: 'I agree about the facility improvements, but $1.2M in merchant grants seems low given 18 months of street closures along Main St. The council must monitor traffic impacts monthly.',
      articleId: 'art-1',
      authorId: 'usr-reader-1',
      parentId: 'cmt-1',
      createdAt: new Date('2026-08-09T19:40:00Z'),
    },
    {
      id: 'cmt-3',
      content: 'We will be releasing monthly construction status reports on LocalGrid starting in October. Thanks for staying engaged!',
      articleId: 'art-1',
      authorId: 'usr-journo-1',
      parentId: 'cmt-2',
      createdAt: new Date('2026-08-09T20:05:00Z'),
    },
    {
      id: 'cmt-4',
      content: 'This investigative piece hits home. Three of our neighborhood ceramics studios had to relocate last winter. Ordinance 2026-B needs to pass immediately.',
      articleId: 'art-2',
      authorId: 'usr-sub-1',
      parentId: null,
      createdAt: new Date('2026-08-08T11:20:00Z'),
    },
    {
      id: 'cmt-5',
      content: 'Huge congratulations to AIIMS Raipur! Tele-ICU will save many lives in remote tribal areas.',
      articleId: 'art-3',
      authorId: 'usr-reader-1',
      parentId: null,
      createdAt: new Date('2026-08-07T15:10:00Z'),
    }
  ];

  for (const c of comments) {
    await prisma.comment.create({ data: c });
  }

  console.log('Seeding Ad Placements...');
  const ads = [
    {
      id: 'ad-1',
      advertiserName: 'Raipur Central Mall & Plaza',
      title: 'Monsoon Mega Shopping Festival — Up to 50% Off Top Brands',
      bannerUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?auto=format&fit=crop&q=80&w=600',
      targetUrl: 'https://example.com/raipur-central-mall',
      location: 'HEADER',
      active: true,
      impressions: 5420,
      clicks: 198,
      maxImpressions: 15000,
      startDate: new Date('2026-08-01T00:00:00Z'),
    },
    {
      id: 'ad-2',
      advertiserName: 'Chhattisgarh Tourism Board',
      title: 'Explore Chitrakote & Tirathgarh Falls — Book Monsoon Tour Packages',
      bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      targetUrl: 'https://example.com/chhattisgarh-tourism',
      location: 'SIDEBAR',
      active: true,
      impressions: 4120,
      clicks: 145,
      maxImpressions: 10000,
      startDate: new Date('2026-08-01T00:00:00Z'),
    },
    {
      id: 'ad-3',
      advertiserName: 'Jaistambh Gold & Diamond Jewellers',
      title: 'Heritage Chhattisgarhi Gold Collection — Special Festival Discounts',
      bannerUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600',
      targetUrl: 'https://example.com/jaistambh-jewellers',
      location: 'IN_ARTICLE',
      active: true,
      impressions: 3450,
      clicks: 164,
      maxImpressions: 12000,
      startDate: new Date('2026-08-05T00:00:00Z'),
    },
    {
      id: 'ad-4',
      advertiserName: 'Atal Nagar Smart Commercial Hub',
      title: 'Prime Office & Retail Plots in Naya Raipur Sector 21',
      bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
      targetUrl: 'https://example.com/atal-nagar-realestate',
      location: 'FOOTER',
      active: true,
      impressions: 2980,
      clicks: 82,
      maxImpressions: 5000,
      startDate: new Date('2026-08-01T00:00:00Z'),
    }
  ];

  for (const ad of ads) {
    await prisma.adPlacement.create({ data: ad });
  }

  console.log('Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
