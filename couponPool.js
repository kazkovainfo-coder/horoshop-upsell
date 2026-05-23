const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const POOL_FILE = path.join(__dirname, "coupon_pool.json");
const LOCK_FILE = path.join(__dirname, "coupon_pool.lock");

const DISCOUNTS = [5, 6, 7, 8, 9, 10];

const MIN_PER_DISCOUNT = Number(process.env.COUPON_POOL_MIN_PER_DISCOUNT || 3);
const TARGET_PER_DISCOUNT = Number(process.env.COUPON_POOL_TARGET_PER_DISCOUNT || 7);
const COUPON_EXPIRE_DAYS = Number(process.env.COUPON_EXPIRE_DAYS || 14);

function readPool() {
  try {
    if (!fs.existsSync(POOL_FILE)) {
      return [];
    }

    return JSON.parse(fs.readFileSync(POOL_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

function savePool(pool) {
  fs.writeFileSync(
    POOL_FILE,
    JSON.stringify(pool, null, 2),
    "utf8"
  );
}

function removeExpiredCoupons(pool) {
  const now = Date.now();

  return pool.filter(item => {
    if (!item.created_at) return true;

    const ageDays =
      (now - Number(item.created_at)) /
      (1000 * 60 * 60 * 24);

    return ageDays <= COUPON_EXPIRE_DAYS;
  });
}

function availableByDiscount(pool, discount) {
  return pool.filter(item =>
    !item.used &&
    Number(item.discount) === Number(discount) &&
    item.coupon
  ).length;
}

function lockExists() {
  if (!fs.existsSync(LOCK_FILE)) {
    return false;
  }

  try {
    const stat = fs.statSync(LOCK_FILE);
    const age = Date.now() - stat.mtimeMs;

    if (age > 20 * 60 * 1000) {
      fs.unlinkSync(LOCK_FILE);
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

function createLock() {
  fs.writeFileSync(LOCK_FILE, String(Date.now()), "utf8");
}

function removeLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (e) {}
}

function generateCoupon(discount) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "node",
      [
        path.join(__dirname, "generateCoupon.js"),
        String(discount)
      ],
      {
        cwd: __dirname,
        env: process.env
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", data => {
      stdout += data.toString();
    });

    child.stderr.on("data", data => {
      stderr += data.toString();
      process.stderr.write(data.toString());
    });

    child.on("close", code => {
      try {
        const lines = stdout
          .split("\\n")
          .map(x => x.trim())
          .filter(Boolean);

        const lastLine = lines[lines.length - 1] || "";
        const data = JSON.parse(lastLine);

        if (code === 0 && data && data.success && data.coupon) {
          resolve({
            coupon: data.coupon,
            discount: Number(discount),
            used: false,
            created_at: Date.now(),
            expires_at: Date.now() + COUPON_EXPIRE_DAYS * 24 * 60 * 60 * 1000
          });
          return;
        }

        reject(new Error(
          (data && data.error) ||
          stderr ||
          stdout ||
          "Coupon generation failed"
        ));
      } catch (e) {
        reject(new Error(stderr || stdout || e.message || String(e)));
      }
    });
  });
}

async function fillPool() {
  if (lockExists()) {
    console.log("COUPON POOL: another refill is already running");
    return;
  }

  createLock();

  try {
    let pool = readPool();

    pool = removeExpiredCoupons(pool);
    savePool(pool);

    for (const discount of DISCOUNTS) {
      const available = availableByDiscount(pool, discount);

      console.log("COUPON POOL:", discount + "%", "available:", available);

      if (available >= MIN_PER_DISCOUNT) {
        continue;
      }

      const need = TARGET_PER_DISCOUNT - available;

      console.log("COUPON POOL:", "generating", need, "for", discount + "%");

      for (let i = 0; i < need; i++) {
        try {
          const coupon = await generateCoupon(discount);

          pool = readPool();
          pool = removeExpiredCoupons(pool);
          pool.push(coupon);
          savePool(pool);

          console.log("COUPON POOL: generated", coupon.coupon, discount + "%");
        } catch (e) {
          console.log("COUPON POOL ERROR:", discount + "%", String(e && e.message ? e.message : e));
        }
      }
    }

    console.log("COUPON POOL: refill finished");
  } finally {
    removeLock();
  }
}

fillPool();
