const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const POOL_FILE = path.join(__dirname, "coupon_pool.json");

const MIN_POOL_SIZE = 20;
const TARGET_POOL_SIZE = 40;

function readPool() {
  try {
    if (!fs.existsSync(POOL_FILE)) {
      return [];
    }

    return JSON.parse(
      fs.readFileSync(POOL_FILE, "utf8")
    );

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

function countAvailable(pool) {
  return pool.filter(x => !x.used).length;
}

function randomDiscount() {
  const discounts = [5, 6, 7, 8, 9, 10];

  return discounts[
    Math.floor(Math.random() * discounts.length)
  ];
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

      console.log(data.toString());
    });

    child.on("close", code => {

      try {

        const lines = stdout
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean);

        const lastLine = lines[lines.length - 1];

        const data = JSON.parse(lastLine);

        if (
          data &&
          data.success &&
          data.coupon
        ) {

          resolve({
            coupon: data.coupon,
            discount: discount,
            used: false,
            created_at: Date.now()
          });

          return;
        }

        reject(
          new Error(
            data.error || "Coupon generation failed"
          )
        );

      } catch (e) {

        reject(e);

      }
    });

  });
}

async function fillPool() {

  const pool = readPool();

  const available = countAvailable(pool);

  console.log("POOL AVAILABLE:", available);

  if (available >= MIN_POOL_SIZE) {
    console.log("POOL OK");
    return;
  }

  const need = TARGET_POOL_SIZE - available;

  console.log("GENERATING:", need);

  for (let i = 0; i < need; i++) {

    try {

      const discount = randomDiscount();

      console.log(
        "GENERATE",
        i + 1,
        "/",
        need,
        "DISCOUNT",
        discount
      );

      const coupon = await generateCoupon(discount);

      pool.push(coupon);

      savePool(pool);

      console.log(
        "SUCCESS",
        coupon.coupon
      );

    } catch (e) {

      console.log(
        "ERROR",
        String(e && e.message ? e.message : e)
      );

    }
  }

  console.log("POOL FILLED");
}

fillPool();
