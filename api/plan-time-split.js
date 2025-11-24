// api/plan-time-split.js
module.exports = async (req, res) => {
  try {
    // Read body (POST) or query (GET)
    const body = req.method === 'POST' ? req.body : req.query;

    // Dialogflow ES parameter mapping
    const params = body.queryResult?.parameters || {};

    // Unified input mapping
    const total_minutes = Number(
      params.total_minutes ||
      body.total_minutes ||
      body.totalMinutes
    );

    const muscle_group =
      params.muscle_group ||
      body.muscle_group ||
      body.muscleGroup ||
      null;

    const fitness_level =
      params.fitness_level ||
      body.fitness_level ||
      body.fitnessLevel ||
      "Intermediate";

    // Validate minutes
    if (!total_minutes || isNaN(total_minutes) || total_minutes < 0) {
      return res.status(400).json({
        error: "total_minutes must be a positive number",
      });
    }

    // Edge case: <5 minutes
    if (total_minutes < 5) {
      return res.json({
        total_minutes,
        num_blocks: 1,
        blocks: [
          {
            id: 1,
            duration_min: Math.max(1, total_minutes),
            type: "Micro-Break",
            target_muscles: ["Mobility"],
            intensity: "Low",
            purpose: "Quick mobility + breathing",
          },
        ],
        meta: {
          note: "Less than 5 minutes — micro-break recommended",
        },
      });
    }

    // Determine number of blocks using thresholds
    let num_blocks;
    if (total_minutes <= 9) num_blocks = 1;
    else if (total_minutes <= 19) num_blocks = 2;
    else if (total_minutes <= 29) num_blocks = total_minutes < 25 ? 2 : 3;
    else if (total_minutes <= 44) num_blocks = 3;
    else num_blocks = total_minutes < 75 ? 4 : 4;

    // Warmup & cooldown (fixed %)
    const warmup = Math.min(
      10,
      Math.max(3, Math.round(total_minutes * 0.12))
    );

    const cooldown = Math.min(
      10,
      Math.max(2, Math.round(total_minutes * 0.08))
    );

    let remaining = total_minutes - warmup - cooldown;

    // If remaining < 0 → compress
    if (remaining < 0) {
      return res.json({
        total_minutes,
        num_blocks: 1,
        blocks: [
          {
            id: 1,
            duration_min: total_minutes,
            type: "Quick Sequence",
            target_muscles: [muscle_group || "Full body"],
            intensity: "Low",
            purpose: "Condensed session",
          },
        ],
      });
    }

    // Main blocks count
    let main_count = Math.max(1, num_blocks - 2);
    if (num_blocks <= 2) main_count = 1;

    // Helper: balanced split
    function splitBalanced(total, parts) {
      const base = Math.floor(total / parts);
      const remainder = total % parts;
      const arr = Array(parts).fill(base);
      for (let i = 0; i < remainder; i++) arr[i] += 1;
      return arr;
    }

    const mains = splitBalanced(remaining, main_count);

    // Build blocks
    const blocks = [];
    let id = 1;

    // WARMUP
    blocks.push({
      id: id++,
      duration_min: warmup,
      type: "Warmup",
      target_muscles: ["Full body"],
      intensity: "Low",
      purpose: "Increase heart rate + joint mobility",
    });

    // MAIN BLOCKS
    for (let i = 0; i < mains.length; i++) {
      const dur = mains[i];

      // Determine type
      let type = "Main Strength";
      if (!muscle_group) {
        type = i % 2 === 0 ? "Main Strength" : "Mini HIIT";
      } else {
        type = dur >= 12 ? "Main Strength" : "Mini HIIT";
      }

      // Intensity based on fitness level
      const intensity =
        fitness_level === "Beginner"
          ? dur >= 15
            ? "Medium"
            : "Low"
          : dur >= 15
          ? "High"
          : "Medium";

      const target = muscle_group
        ? [muscle_group]
        : type === "Mini HIIT"
        ? ["Full body"]
        : ["Legs", "Glutes"];

      blocks.push({
        id: id++,
        duration_min: dur,
        type,
        target_muscles: target,
        intensity,
        purpose: "Primary training block",
      });
    }

    // COOLDOWN
    blocks.push({
      id: id++,
      duration_min: cooldown,
      type: "Cooldown",
      target_muscles: ["Full body"],
      intensity: "Low",
      purpose: "Recovery & flexibility",
    });

    // Limit max 4 blocks — merge if needed
    while (blocks.length > 4) {
      const last = blocks.pop();
      blocks[blocks.length - 1].duration_min += last.duration_min;
      blocks[blocks.length - 1].type += " + " + last.type;
    }

    // ---------------------------
    // Return final response
    // ---------------------------
    const response = {
      request_id: Date.now().toString(),
      total_minutes,
      num_blocks: blocks.length,
      blocks,
      meta: {
        fitness_level,
        muscle_preference: muscle_group || "None",
      },
    };

    // If request came from Dialogflow
    if (body.queryResult) {
      return res.json({
        fulfillmentText: `Your ${total_minutes}-minute plan is ready!`,
        payload: response,
      });
    }

    // Normal API response
    return res.json(response);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
