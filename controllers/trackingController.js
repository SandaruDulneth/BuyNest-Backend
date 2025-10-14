import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import Rider from "../models/rider.js";
import LocationSession from "../models/LocationSession.js";
import RiderLocation from "../models/RiderLocation.js";

// ✅ Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * POST /api/tracking/start/:riderId
 * Admin-only: create (or reuse active) session, send tracking email to rider
 */
export async function startTracking(req, res) {
  try {
    const { riderId } = req.params;

    // Find rider
    const rider = await Rider.findOne({ riderId });
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // Reuse active session if exists
    let session = await LocationSession.findOne({ riderId, active: true });
    if (!session) {
      session = await LocationSession.create({
        token: crypto.randomBytes(16).toString("hex"),
        riderId,
        active: true,
      });
    }

    // ✅ Generate tracking link
    const base = process.env.BACKENDURL || "http://localhost:5000";
    const trackingUrl = `${base}/api/tracking/track/${session.token}`;

    // ✅ Send email to rider
    const msg = {
      to: rider.email,
      from: process.env.SENDGRID_FROM,
      subject: "📍 Live Tracking Started - BuyNest Delivery",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#333">
          <h2 style="color:#10b981;">Hello ${rider.Name},</h2>
          <p>Your live tracking session has started. Click below to open your tracking dashboard:</p>
          <p>
            <a href="${trackingUrl}" 
              style="background:#10b981;color:#fff;padding:10px 20px;
              text-decoration:none;border-radius:8px;display:inline-block;">
              Open Live Tracking
            </a>
          </p>
          <p style="margin-top:10px">
            Or copy this link: <br/>
            <a href="${trackingUrl}">${trackingUrl}</a>
          </p>
          <hr style="margin:16px 0;border:none;border-top:1px solid #ddd"/>
          <p style="font-size:13px;color:#555">
            Keep this page open during your delivery to update your live location.<br/>
            BuyNest Delivery System.
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`📧 Tracking email sent to ${rider.email}`);

    res.json({
      message: "Tracking started and email sent successfully",
      riderId,
      trackingUrl,
    });
  } catch (err) {
    console.error("Start Tracking Error:", err);
    res.status(500).json({
      message: "Failed to start tracking",
      error: err.message,
    });
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

    // (Optional) notify rider via email
    const rider = await Rider.findOne({ riderId });
    if (rider) {
      const msg = {
        to: rider.email,
        from: process.env.SENDGRID_FROM,
        subject: "🛑 Tracking Stopped - BuyNest Delivery",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#333">
            <h2 style="color:#e11d48;">Hello ${rider.Name},</h2>
            <p>Your live tracking session has been stopped by the administrator.</p>
            <p>Thank you for completing your delivery!</p>
            <hr style="margin:16px 0;border:none;border-top:1px solid #ddd"/>
            <p style="font-size:13px;color:#555">BuyNest Delivery Team</p>
          </div>
        `,
      };
      await sgMail.send(msg);
      console.log(`📧 Stop tracking email sent to ${rider.email}`);
    }

    res.json({ message: "Tracking stopped", riderId });
  } catch (err) {
    res.status(500).json({
      message: "Failed to stop tracking",
      error: err.message,
    });
  }
}

/**
 * GET /api/tracking/track/:token
 * Public: serves the HTML page the rider opens
 */
export async function serveTrackerPage(req, res) {
  try {
    const { token } = req.params;
    const session = await LocationSession.findOne({ token, active: true });
    if (!session) {
      return res.status(404).send("<h2>❌ Invalid or expired tracking link</h2>");
    }

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
        log('Geolocation not supported', 'err');
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
 * Public: receives GPS updates → stores + broadcasts via socket.io
 */
export async function pingLocation(req, res) {
  try {
    const { token } = req.params;
    const { lat, lng, accuracy, heading, speed } = req.body;

    const session = await LocationSession.findOne({ token, active: true });
    if (!session)
      return res.status(404).json({ message: "Invalid or expired session" });

    const doc = await RiderLocation.findOneAndUpdate(
      { riderId: session.riderId },
      {
        riderId: session.riderId,
        lat,
        lng,
        accuracy,
        heading,
        speed,
        timestamp: new Date(),
      },
      { upsert: true, new: true }
    );

    const io = req.app.get("io");
    io.emit("riderLocation", {
      riderId: doc.riderId,
      lat: doc.lat,
      lng: doc.lng,
      timestamp: doc.timestamp,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({
      message: "Failed to record location",
      error: err.message,
    });
  }
}

/**
 * GET /api/tracking/locations
 * Admin: fetch all latest rider locations
 */
export async function getLatestLocations(req, res) {
  try {
    const list = await RiderLocation.find().lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch locations",
      error: err.message,
    });
  }
}
