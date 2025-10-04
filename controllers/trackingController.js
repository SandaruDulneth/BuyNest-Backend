import crypto from "crypto";
import LocationSession from "../models/LocationSession.js";
import RiderLocation from "../models/riderLocation.js";

/**
 * POST /api/tracking/start/:riderId
 * Admin-only: create (or reuse active) session and return share link
 */
export async function startTracking(req, res) {
  try {
    // Optional: protect with admin check if you want
    // if (!req.user || req.user.role !== 'admin') return res.status(403).json({message:'Forbidden'});

    const { riderId } = req.params;

    // Reuse active session if exists
    let session = await LocationSession.findOne({ riderId, active: true });
    if (!session) {
      session = await LocationSession.create({
        token: crypto.randomBytes(16).toString("hex"),
        riderId,
        active: true,
      });
    }

    const base = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
    const trackingUrl = `${base}/api/tracking/track/${session.token}`;

    res.json({ message: "Tracking enabled", riderId, token: session.token, trackingUrl });
  } catch (err) {
    res.status(500).json({ message: "Failed to start tracking", error: err.message });
  }
}

/**
 * POST /api/tracking/stop/:riderId
 * Admin-only: stop active session
 */
export async function stopTracking(req, res) {
  try {
    const { riderId } = req.params;
    const session = await LocationSession.findOne({ riderId, active: true });
    if (!session) return res.json({ message: "No active session" });

    session.active = false;
    session.endedAt = new Date();
    await session.save();

    res.json({ message: "Tracking stopped", riderId });
  } catch (err) {
    res.status(500).json({ message: "Failed to stop tracking", error: err.message });
  }
}

/**
 * GET /api/tracking/track/:token
 * Public minimal page the rider opens. It streams geolocation to /api/tracking/ping/:token
 */
export async function serveTrackerPage(req, res) {
  try {
    const { token } = req.params;
    const session = await LocationSession.findOne({ token, active: true });
    if (!session) {
      return res
        .status(404)
        .send("<h2>❌ Invalid or expired tracking link</h2>");
    }

    // Simple page with watchPosition → POST to ping endpoint
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Rider Live Tracking</title>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: system-ui, Arial; padding: 16px; max-width: 640px; margin: 0 auto; }
    .card { border:1px solid #e5e7eb; border-radius: 12px; padding:16px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
    .btn { background:#10b981; color:#fff; border:none; padding:12px 16px; border-radius:8px; font-size:16px; }
    .muted { color:#6b7280; font-size:14px; }
    .ok { color:#059669; }
    .err { color:#dc2626; }
  </style>
</head>
<body>
  <h2>📡 Rider Live Tracking</h2>
  <div class="card">
    <p class="muted">Keep this page open while you are on delivery. We'll share your live location with the admin.</p>
    <button id="startBtn" class="btn">Start Sharing Location</button>
    <div id="status" class="muted" style="margin-top:12px;"></div>
  </div>

  <script>
    const token = ${JSON.stringify(token)};
    let watchId = null;
    const statusEl = document.getElementById('status');
    const startBtn = document.getElementById('startBtn');

    function log(msg, cls) {
      statusEl.innerHTML = '<span class="' + (cls||'') + '">' + msg + '</span>';
    }

    async function ping(pos) {
      try {
        await fetch('/api/tracking/ping/' + token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            ts: Date.now()
          })
        });
      } catch (e) {
        log('Error sending location: ' + (e.message || e), 'err');
      }
    }

    function start() {
      if (!navigator.geolocation) {
        log('Geolocation is not supported by this browser.', 'err');
        return;
      }
      log('Requesting location permission...');
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          log('Live: ' + pos.coords.latitude.toFixed(5) + ', ' + pos.coords.longitude.toFixed(5), 'ok');
          ping(pos);
        },
        (err) => {
          log('Location error: ' + err.message, 'err');
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
      );
    }

    startBtn.addEventListener('click', start);
  </script>
</body>
</html>
`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch {
    res.status(500).send("Error loading tracker page");
  }
}

/**
 * POST /api/tracking/ping/:token
 * Public: receives GPS pings from rider page → stores latest → broadcasts via Socket.IO
 */
export async function pingLocation(req, res) {
  try {
    const { token } = req.params;
    const { lat, lng, accuracy, heading, speed } = req.body;

    const session = await LocationSession.findOne({ token, active: true });
    if (!session) return res.status(404).json({ message: "Invalid or expired session" });

    // Upsert latest location for rider
    const doc = await RiderLocation.findOneAndUpdate(
      { riderId: session.riderId },
      {
        riderId: session.riderId,
        lat,
        lng,
        accuracy,
        heading,
        speed,
        timestamp: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Broadcast to all connected dashboards
    const io = req.app.get("io");
    io.emit("riderLocation", {
      riderId: doc.riderId,
      lat: doc.lat,
      lng: doc.lng,
      accuracy: doc.accuracy,
      heading: doc.heading,
      speed: doc.speed,
      timestamp: doc.timestamp,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to record location", error: err.message });
  }
}

/**
 * GET /api/tracking/locations
 * Admin: list latest locations for all riders
 */
export async function getLatestLocations(req, res) {
  try {
    const list = await RiderLocation.find().lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch locations", error: err.message });
  }
}
