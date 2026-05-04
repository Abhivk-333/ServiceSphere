/*  Service Sphere — Core System Engine v2
    Milestone-based tracking, ETA countdown, Safety alerts, Audit logic  */

const TrackingSystem = (() => {
  let timerInterval;

  /* ── Milestone display config ────────────────────────────── */
  const MILESTONE_META = {
    accepted:      { label:'Booking Accepted',    emoji:'✅', icon:'check-circle' },
    started_travel:{ label:'Provider On The Way', emoji:'🛵', icon:'truck'        },
    arrived:       { label:'Provider Arrived',    emoji:'📍', icon:'map-pin'      },
    started_work:  { label:'Work In Progress',    emoji:'🛠️', icon:'settings'     },
    completed:     { label:'Work Completed',      emoji:'🎉', icon:'award'        }
  };

  /* ── ETA countdown timer ─────────────────────────────────── */
  function startGlobalTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      window.dispatchEvent(new CustomEvent('ss_tick'));
    }, 1000);
  }

  /* ── Format milliseconds → MM:SS or HH:MM:SS ────────────── */
  function fmtMs(ms, showHours = false) {
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (showHours) {
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  /* ── Render full milestone timeline (customer view) ─────── */
  function renderTimeline(booking, containerId, isProvider = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const m = booking.milestones || {};
    const keys = SS.MILESTONES;
    const currentIdx = keys.reduce((acc, k, i) => m[k] ? i : acc, -1);

    // ETA countdown (while started_travel is stamped but arrived is null)
    let etaHtml = '';
    if (m.started_travel && !m.arrived) {
      const travelStart = new Date(m.started_travel).getTime();
      const etaMs = (booking.eta || 15) * 60 * 1000;
      const remaining = etaMs - (Date.now() - travelStart);
      etaHtml = `<div style="text-align:center;margin-bottom:1rem">
        <span style="font-size:.8rem;color:var(--text-muted)">ETA</span>
        <div id="eta-countdown" style="font-size:1.6rem;font-weight:800;color:var(--primary);font-family:monospace">${fmtMs(Math.max(remaining,0))}</div>
        <span style="font-size:.75rem;color:var(--text-muted)">estimated arrival</span>
      </div>`;
    }

    // Work timer (while started_work is stamped but completed is null)
    let workTimerHtml = '';
    if (m.started_work && !m.completed) {
      const elapsed = Date.now() - new Date(m.started_work).getTime();
      workTimerHtml = `<div style="text-align:center;margin-top:1rem">
        <span style="font-size:.8rem;color:var(--text-muted)">Work Timer</span>
        <div id="work-timer" style="font-size:1.6rem;font-weight:800;color:#10b981;font-family:monospace">${fmtMs(elapsed, true)}</div>
      </div>`;
    }

    // Safety alert popup (customer side, if overtime and unresolved)
    let safetyHtml = '';
    if (!isProvider && booking.alertTriggered && !booking.safetyStatus) {
      safetyHtml = `<div class="safety-alert-overlay">
        <div class="safety-alert-box">
          <div class="safety-alert-icon"><i data-feather="alert-triangle" style="width:32px;height:32px"></i></div>
          <h3 style="margin-bottom:1rem">Safety Check</h3>
          <p style="color:var(--text-muted);margin-bottom:2rem">Service is taking longer than expected. Are you safe?</p>
          <div style="display:flex;gap:1rem">
            <button class="btn btn-primary" style="flex:1" onclick="TrackingSystem.markSafe('${booking.id}')">YES, I AM SAFE</button>
            <button class="btn btn-outline" style="flex:1;border-color:#ef4444;color:#ef4444" onclick="TrackingSystem.report('${booking.id}')">REPORT ISSUE</button>
          </div>
        </div>
      </div>`;
    }

    // Provider action button — single dynamic CTA
    let providerActionHtml = '';
    if (isProvider) {
      const next = SS.getNextMilestone(booking);
      const nextMeta = next ? MILESTONE_META[next] : null;
      if (nextMeta) {
        // Special ETA prompt for started_travel
        if (next === 'started_travel') {
          providerActionHtml = `<div style="margin-top:1.25rem;padding:1rem;background:#f8fafc;border-radius:var(--radius-md);border:1px solid var(--border-color)">
            <label style="font-size:.82rem;font-weight:600;display:block;margin-bottom:.5rem">ETA (minutes)</label>
            <div style="display:flex;gap:.5rem">
              <select id="eta-select" style="padding:.5rem .75rem;border:1px solid var(--border-color);border-radius:var(--radius-md);font-size:.85rem;flex:1">
                <option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option>
              </select>
              <button class="btn btn-primary" style="padding:.5rem 1.25rem" onclick="TrackingSystem.providerAdvance('${booking.id}')">
                ${nextMeta.emoji} ${nextMeta.label}
              </button>
            </div>
          </div>`;
        } else {
          // Audit: arrived but not customer-confirmed
          let auditNote = '';
          if (next === 'started_work' && booking.milestones && booking.milestones.arrived && !booking.customerConfirmedArrival) {
            auditNote = `<p style="font-size:.75rem;color:#b45309;background:#fef9c3;padding:.4rem .75rem;border-radius:6px;margin-bottom:.6rem">⏳ Pending Customer Arrival Confirmation</p>`;
          }
          providerActionHtml = `<div style="margin-top:1.25rem">${auditNote}
            <button class="btn btn-primary" style="width:100%;padding:.65rem" onclick="TrackingSystem.providerAdvance('${booking.id}')">
              ${nextMeta.emoji} ${nextMeta.label}
            </button>
          </div>`;
        }
      } else {
        providerActionHtml = `<div style="margin-top:1.25rem"><span class="badge badge-green" style="width:100%;text-align:center;padding:.75rem">✅ Job Completed</span></div>`;
      }
    }

    const stepsHtml = keys.map((k, i) => {
      const done = !!m[k];
      const active = i === currentIdx + 1 && !m[k];
      const meta = MILESTONE_META[k];
      const ts = m[k] ? new Date(m[k]).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '';
      return `<div class="tl-step ${done ? 'done' : active ? 'active' : ''}">
        <div class="tl-dot"></div>
        <div class="tl-label">${meta.emoji} ${meta.label}</div>
        <div class="tl-time">${done ? ts : (active ? 'In Progress…' : '—')}</div>
      </div>`;
    }).join('');

    container.innerHTML = `
      ${etaHtml}
      ${workTimerHtml}
      <div class="status-timeline" style="margin:1rem 0">${stepsHtml}</div>
      ${providerActionHtml}
      ${safetyHtml}
    `;

    if (window.feather) feather.replace();
  }

  /* ── Live tick: update timers in DOM ─────────────────────── */
  function tickTimers() {
    // ETA countdown
    const etaEl = document.getElementById('eta-countdown');
    if (etaEl) {
      const bid = etaEl.closest('[data-bid]')?.dataset.bid;
      const booking = bid ? SS.getBooking(bid) : null;
      if (booking?.milestones?.started_travel && !booking.milestones.arrived) {
        const travelStart = new Date(booking.milestones.started_travel).getTime();
        const remaining = (booking.eta || 15) * 60 * 1000 - (Date.now() - travelStart);
        etaEl.textContent = fmtMs(Math.max(remaining, 0));
      }
    }

    // Work timer
    const workEl = document.getElementById('work-timer');
    if (workEl) {
      const bid = workEl.closest('[data-bid]')?.dataset.bid;
      const booking = bid ? SS.getBooking(bid) : null;
      if (booking?.milestones?.started_work && !booking.milestones.completed) {
        const elapsed = Date.now() - new Date(booking.milestones.started_work).getTime();
        workEl.textContent = fmtMs(elapsed, true);
      }
    }
  }

  return {
    init() {
      startGlobalTimer();
      window.addEventListener('ss_tick', tickTimers);
      // Cross-tab sync
      window.addEventListener('storage', (e) => {
        if (e.key === 'ss_bookings') window.dispatchEvent(new CustomEvent('ss_data_updated'));
      });
    },

    // Render timeline — public
    render(booking, containerId, isProvider) {
      renderTimeline(booking, containerId, isProvider);
    },

    // Provider presses action button → advance one milestone
    providerAdvance(bookingId) {
      const booking = SS.getBooking(bookingId);
      if (!booking) return;

      // Capture ETA if starting travel
      const next = SS.getNextMilestone(booking);
      if (next === 'started_travel') {
        const etaSel = document.getElementById('eta-select');
        if (etaSel) SS.updateBooking(bookingId, { eta: parseInt(etaSel.value) });
      }

      const advanced = SS.advanceMilestone(bookingId);
      if (advanced) window.dispatchEvent(new CustomEvent('ss_data_updated'));
    },

    // Customer confirms arrival (audit step)
    customerConfirmArrival(bookingId) {
      SS.updateBooking(bookingId, { customerConfirmedArrival: true });
      window.dispatchEvent(new CustomEvent('ss_data_updated'));
    },

    // Safety actions
    markSafe(id) { SS.markSafe(id); window.dispatchEvent(new CustomEvent('ss_data_updated')); },
    report(id)   { SS.markUnsafe(id); window.dispatchEvent(new CustomEvent('ss_data_updated')); },

    // Expose meta for other pages
    MILESTONE_META,
    fmtMs,

    // Legacy transition API (kept for backward-compat with older pages)
    transition(bookingId, newStatus) {
      const m = { eta:'started_travel', active:'started_work', completed:'completed' };
      if (m[newStatus]) SS.advanceMilestone(bookingId);
      window.dispatchEvent(new CustomEvent('ss_data_updated'));
    },

    markSafe(id) { SS.markSafe(id); window.dispatchEvent(new CustomEvent('ss_data_updated')); },
    report(id)   { SS.markUnsafe(id); window.dispatchEvent(new CustomEvent('ss_data_updated')); },
  };
})();

TrackingSystem.init();
