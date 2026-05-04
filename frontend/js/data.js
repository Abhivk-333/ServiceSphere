/*  Service Sphere — Shared Data Layer (localStorage)
    Every page imports this file. SINGLE SOURCE OF TRUTH.
    v2.0 — Milestone tracking, Provider Verification, Admin role  */

// ── One-time v1 → v2 migration: clear old seed so v2 seed runs ──
(function() {
  if (localStorage.getItem('ss_seeded') && !localStorage.getItem('ss_seeded_v2')) {
    ['ss_seeded','ss_providers','ss_bookings','ss_chats','ss_reviews','ss_currentUser'].forEach(k => localStorage.removeItem(k));
  }
})();

const SS = (() => {
  /* ── helpers ─────────────────────────────────────────────── */
  const _get = k => JSON.parse(localStorage.getItem(k) || 'null');
  const _set = (k,v) => localStorage.setItem(k, JSON.stringify(v));
  const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

  /* ── milestone helpers ───────────────────────────────────── */
  // Canonical milestone keys in order
  const MILESTONES = ['accepted','started_travel','arrived','started_work','completed'];

  function emptyMilestones() {
    return MILESTONES.reduce((o,k) => { o[k]=null; return o; }, {});
  }

  /* ── seed data (runs once) ──────────────────────────────── */
  function seed() {
    if (_get('ss_seeded_v2')) return;

    const providers = [
      {
        id:'p1', name:'Rajesh Kumar', phone:'9876543210',
        photo:'https://randomuser.me/api/portraits/men/32.jpg',
        bio:'Master electrician with 12+ years of experience in residential and commercial wiring, smart home setups, and EV charger installation.',
        category:'Electrician', city:'Mumbai', experience:'12 years', rating:4.8, reviewCount:124,
        verified:true,            // legacy key kept for UI references
        is_verified:true,         // NEW — admin-controlled gate
        govt_id_number:'MH-DL-2010-7823411',
        id_photo:'https://via.placeholder.com/300x180?text=Govt+ID+Photo',
        services:[
          {id:'s1',name:'Electrical Repair',price:500,unit:'per visit',duration:60,desc:'Diagnosis and repair of switches, sockets, MCB trips, and wiring faults.'},
          {id:'s2',name:'Smart Home Setup',price:2500,unit:'per session',duration:180,desc:'Complete smart lighting, automated switches, and voice-assistant integration.'},
          {id:'s3',name:'EV Charger Installation',price:4000,unit:'fixed',duration:240,desc:'Level 2 home charging station setup and electrical panel upgrade.'}
        ]
      },
      {
        id:'p2', name:'Priya Sharma', phone:'9876543211',
        photo:'https://randomuser.me/api/portraits/women/44.jpg',
        bio:'Professional home cleaner and organizer. Eco-friendly products, meticulous attention to detail.',
        category:'Cleaning', city:'Delhi', experience:'8 years', rating:4.9, reviewCount:210,
        verified:true, is_verified:true,
        govt_id_number:'DL-DL-2012-5547892',
        id_photo:'https://via.placeholder.com/300x180?text=Govt+ID+Photo',
        services:[
          {id:'s4',name:'Deep Home Cleaning',price:1800,unit:'per session',duration:180,desc:'Complete top-to-bottom cleaning including kitchen, bathrooms, and living areas.'},
          {id:'s5',name:'Move-in/Move-out Clean',price:3500,unit:'fixed',duration:300,desc:'Thorough cleaning for property handovers — walls, fixtures, appliances.'}
        ]
      },
      {
        id:'p3', name:'Amit Patel', phone:'9876543212',
        photo:'https://randomuser.me/api/portraits/men/75.jpg',
        bio:'Licensed plumber specializing in leak repairs, bathroom renovations, and water purifier installations.',
        category:'Plumbing', city:'Bangalore', experience:'10 years', rating:4.7, reviewCount:89,
        verified:true, is_verified:true,
        govt_id_number:'KA-DL-2011-9934512',
        id_photo:'https://via.placeholder.com/300x180?text=Govt+ID+Photo',
        services:[
          {id:'s6',name:'Leak Repair',price:400,unit:'per visit',duration:45,desc:'Identify and fix pipe, faucet, and toilet leaks.'},
          {id:'s7',name:'Bathroom Renovation',price:15000,unit:'fixed',duration:2880,desc:'Complete bathroom remodel — tiles, fixtures, waterproofing.'}
        ]
      },
      {
        id:'p4', name:'Sneha Reddy', phone:'9876543213',
        photo:'https://randomuser.me/api/portraits/women/68.jpg',
        bio:'Certified beauty and wellness professional. Bridal packages, hair styling, and spa treatments at your doorstep.',
        category:'Beauty & Wellness', city:'Hyderabad', experience:'6 years', rating:4.9, reviewCount:178,
        verified:true, is_verified:true,
        govt_id_number:'TS-DL-2014-3312908',
        id_photo:'https://via.placeholder.com/300x180?text=Govt+ID+Photo',
        services:[
          {id:'s8',name:'Bridal Makeup',price:8000,unit:'per session',duration:120,desc:'HD bridal makeup with premium products, including trial.'},
          {id:'s9',name:'Hair Styling',price:1200,unit:'per session',duration:60,desc:'Blowout, curling, straightening, and occasion styling.'},
          {id:'s10',name:'At-Home Spa',price:2000,unit:'per session',duration:90,desc:'Full body massage, facial, and manicure/pedicure combo.'}
        ]
      },
      {
        id:'p5', name:'Vikram Singh', phone:'9876543214',
        photo:'https://randomuser.me/api/portraits/men/45.jpg',
        bio:'AC technician and appliance repair expert. All major brands serviced.',
        category:'Appliance Repair', city:'Chennai', experience:'9 years', rating:4.6, reviewCount:67,
        verified:true, is_verified:true,
        govt_id_number:'TN-DL-2013-8823490',
        id_photo:'https://via.placeholder.com/300x180?text=Govt+ID+Photo',
        services:[
          {id:'s11',name:'AC Service & Repair',price:700,unit:'per visit',duration:90,desc:'Gas top-up, filter cleaning, compressor check, and general servicing.'},
          {id:'s12',name:'Washing Machine Repair',price:600,unit:'per visit',duration:60,desc:'Drum, motor, inlet valve, and drainage issue repairs.'}
        ]
      },
      // One unverified provider to demo the admin flow
      {
        id:'p6', name:'Deepak Nair', phone:'9876543215',
        photo:'https://randomuser.me/api/portraits/men/61.jpg',
        bio:'Experienced carpenter specializing in modular furniture, wardrobes, and wooden flooring.',
        category:'Carpentry', city:'Pune', experience:'7 years', rating:4.5, reviewCount:0,
        verified:false, is_verified:false,
        govt_id_number:'MH-DL-2015-1102347',
        id_photo:'https://via.placeholder.com/300x180?text=Govt+ID+Photo',
        services:[
          {id:'s13',name:'Furniture Assembly',price:800,unit:'per visit',duration:120,desc:'Flat-pack furniture assembly including IKEA and local brands.'},
          {id:'s14',name:'Custom Wardrobe',price:25000,unit:'fixed',duration:4320,desc:'Design, build, and install a custom wooden wardrobe.'}
        ]
      }
    ];

    const reviews = [
      {id:'r1',providerId:'p1',customerId:'c1',customerName:'Ananya Gupta',rating:5,comment:'Rajesh fixed our entire wiring in one visit. Super professional!',date:'2026-04-10'},
      {id:'r2',providerId:'p1',customerId:'c2',customerName:'Vikash Mehra',rating:5,comment:'Smart home setup was flawless. Very knowledgeable about latest tech.',date:'2026-04-05'},
      {id:'r3',providerId:'p2',customerId:'c1',customerName:'Ananya Gupta',rating:5,comment:'My apartment has never been this clean. Priya is amazing!',date:'2026-04-12'},
      {id:'r4',providerId:'p3',customerId:'c3',customerName:'Rohit Das',rating:4,comment:'Fixed the leak quickly. Fair pricing.',date:'2026-03-28'},
      {id:'r5',providerId:'p4',customerId:'c4',customerName:'Meera Joshi',rating:5,comment:'Bridal makeup was stunning. Everyone complimented!',date:'2026-04-01'},
      {id:'r6',providerId:'p5',customerId:'c2',customerName:'Vikash Mehra',rating:5,comment:'AC cooling like new after the service.',date:'2026-04-15'}
    ];

    // Bookings now use milestones instead of flat status
    const bookings = [
      {
        id:'b1', customerId:'c1', providerId:'p2', serviceId:'s4',
        date:'2026-04-12', time:'10:00 AM', address:'Flat 302, Lotus Apt, Andheri',
        amount:1800,
        eta:15,
        milestones:{
          accepted:  '2026-04-12T04:00:00.000Z',
          started_travel:'2026-04-12T04:15:00.000Z',
          arrived:   '2026-04-12T04:30:00.000Z',
          started_work:'2026-04-12T04:35:00.000Z',
          completed: '2026-04-12T07:35:00.000Z'
        },
        // Legacy status for backward-compat with older pages
        status:'completed',
        safetyStatus:'safe'
      },
      {
        id:'b2', customerId:'c1', providerId:'p1', serviceId:'s1',
        date:'2026-04-28', time:'11:00 AM', address:'Flat 302, Lotus Apt, Andheri',
        amount:500,
        eta:15,
        milestones:{
          accepted:  new Date().toISOString(),
          started_travel: null, arrived: null, started_work: null, completed: null
        },
        status:'active',
        startedAt: null,
        safetyStatus: null
      }
    ];

    const chats = [
      {bookingId:'b2',messages:[
        {from:'customer',text:'Hi Rajesh, will you bring your own tools?',time:'10:30 AM'},
        {from:'provider',text:'Yes, I carry a full kit. See you tomorrow!',time:'10:32 AM'}
      ]}
    ];

    _set('ss_providers', providers);
    _set('ss_reviews', reviews);
    _set('ss_bookings', bookings);
    _set('ss_chats', chats);
    _set('ss_sos_alerts', []);   // NEW — admin SOS inbox
    _set('ss_currentUser', {id:'c1',name:'Ananya',lastname:'Gupta',email:'ananya@email.com',phone:'9988776655',role:'customer'});
    _set('ss_seeded_v2', true);
  }

  /* ── public API ─────────────────────────────────────────── */
  return {
    init() { seed(); },

    // ── Current user ──────────────────────────────────────────
    getUser()       { return _get('ss_currentUser'); },
    setUser(u)      { _set('ss_currentUser', u); },
    logout()        { _set('ss_currentUser', null); },

    // ── Providers ─────────────────────────────────────────────
    // Returns ONLY verified providers (for customer-facing pages)
    getProviders()  {
      return (_get('ss_providers') || []).filter(p => p.is_verified === true);
    },
    // Returns ALL providers regardless of verification (for admin pages)
    getAllProviders() { return _get('ss_providers') || []; },
    getProvider(id) {
      // Search across ALL providers so provider dashboards work even if unverified
      return (_get('ss_providers') || []).find(p => p.id === id);
    },
    saveProvider(p) {
      const all = _get('ss_providers') || [];
      const i = all.findIndex(x => x.id === p.id);
      if (i >= 0) all[i] = p; else all.push(p);
      _set('ss_providers', all);
    },

    // ── Admin: approve a provider ──────────────────────────────
    approveProvider(id) {
      const all = _get('ss_providers') || [];
      const i = all.findIndex(p => p.id === id);
      if (i >= 0) { all[i].is_verified = true; all[i].verified = true; _set('ss_providers', all); }
    },

    // ── Flat service list (verified providers only) ────────────
    getAllServices() {
      const out = [];
      this.getProviders().forEach(p => {
        (p.services || []).forEach(s => {
          out.push({...s, providerId:p.id, providerName:p.name, providerPhoto:p.photo,
                    providerRating:p.rating, providerCity:p.city, category:p.category});
        });
      });
      return out;
    },
    getCategories() { return [...new Set(this.getProviders().map(p => p.category))]; },

    // ── Bookings ───────────────────────────────────────────────
    getBookings()   { return _get('ss_bookings') || []; },
    getBooking(id)  { return this.getBookings().find(b => b.id === id); },
    addBooking(b)   {
      const all = this.getBookings();
      b.id = b.id || 'b' + uid();
      b.milestones = b.milestones || emptyMilestones();
      b.eta = b.eta || 15;
      all.push(b);
      _set('ss_bookings', all);
      return b;
    },
    updateBooking(id, patch) {
      const all = this.getBookings();
      const i = all.findIndex(b => b.id === id);
      if (i >= 0) { Object.assign(all[i], patch); _set('ss_bookings', all); }
    },

    // ── Milestone helpers ──────────────────────────────────────
    MILESTONES,
    emptyMilestones,
    advanceMilestone(bookingId) {
      const b = this.getBooking(bookingId);
      if (!b) return null;
      b.milestones = b.milestones || emptyMilestones();
      // Find the first null milestone and stamp it
      const next = MILESTONES.find(k => !b.milestones[k]);
      if (next) {
        b.milestones[next] = new Date().toISOString();
        // Sync legacy status field for backward-compat
        const legacyMap = {
          accepted:'active', started_travel:'eta',
          arrived:'eta', started_work:'active', completed:'completed'
        };
        const patch = { milestones: b.milestones, status: legacyMap[next] || b.status };
        if (next === 'started_work') patch.startedAt = patch.workStartTime = Date.now();
        if (next === 'completed')    patch.completedAt = Date.now();
        this.updateBooking(bookingId, patch);
        return next;
      }
      return null; // all milestones done
    },
    getCurrentMilestone(booking) {
      const m = booking.milestones || {};
      // Last stamped milestone
      let last = null;
      MILESTONES.forEach(k => { if (m[k]) last = k; });
      return last; // null = not yet accepted
    },
    getNextMilestone(booking) {
      const m = booking.milestones || {};
      return MILESTONES.find(k => !m[k]) || null;
    },
    isMilestoneDone(booking, key) {
      return !!(booking.milestones && booking.milestones[key]);
    },

    // ── Reviews ───────────────────────────────────────────────
    getReviews(providerId)  { return (_get('ss_reviews') || []).filter(r => r.providerId === providerId); },
    addReview(r) {
      const all = _get('ss_reviews') || [];
      r.id = 'r' + uid();
      all.push(r);
      _set('ss_reviews', all);
      // Update provider rating
      const pr = this.getProvider(r.providerId);
      if (pr) {
        const revs = this.getReviews(r.providerId);
        pr.rating = +(revs.reduce((s,x) => s + x.rating, 0) / revs.length).toFixed(1);
        pr.reviewCount = revs.length;
        this.saveProvider(pr);
      }
    },

    // ── Chat ──────────────────────────────────────────────────
    getChat(bookingId)       { return (_get('ss_chats') || []).find(c => c.bookingId === bookingId); },
    addMessage(bookingId, msg) {
      const all = _get('ss_chats') || [];
      let chat = all.find(c => c.bookingId === bookingId);
      if (!chat) { chat = {bookingId, messages:[]}; all.push(chat); }
      chat.messages.push(msg);
      _set('ss_chats', all);
    },

    // ── Safety & SOS ──────────────────────────────────────────
    triggerSafetyAlert(bookingId) { this.updateBooking(bookingId, {alertTriggered:true}); },
    markSafe(bookingId)   { this.updateBooking(bookingId, {safetyStatus:'safe', alertTriggered:false}); },
    markUnsafe(bookingId) { this.updateBooking(bookingId, {safetyStatus:'reported', alertTriggered:false}); },

    // NEW: SOS alerts (visible in admin panel)
    sendSOS(bookingId, senderName, message, customerId, providerId, senderRole) {
      const alert = {
        id: 'sos' + uid(),
        bookingId,
        customerId:  customerId  || '',
        providerId:  providerId  || '',
        senderRole:  senderRole  || 'customer',
        customerName: senderName || 'Customer',  // kept for backward compat
        message: message || 'SOS triggered — immediate attention required.',
        timestamp: new Date().toISOString(),
        resolved: false,
        status: 'pending'
      };
      // Primary store — admin panel reads from here
      const all = _get('ss_sos_alerts') || [];
      all.push(alert);
      _set('ss_sos_alerts', all);
      // Secondary store — Phase 4 spec key
      const alerts2 = _get('ss_alerts') || [];
      alerts2.push(alert);
      _set('ss_alerts', alerts2);
    },
    getSOSAlerts()        { return _get('ss_sos_alerts') || []; },
    resolveSOSAlert(id) {
      // Update ss_sos_alerts
      const all = _get('ss_sos_alerts') || [];
      const i = all.findIndex(a => a.id === id);
      if (i >= 0) { all[i].resolved = true; all[i].status = 'resolved'; _set('ss_sos_alerts', all); }
      // Sync ss_alerts
      const alerts2 = _get('ss_alerts') || [];
      const j = alerts2.findIndex(a => a.id === id);
      if (j >= 0) { alerts2[j].resolved = true; alerts2[j].status = 'resolved'; _set('ss_alerts', alerts2); }
    },
  };
})();

SS.init();
