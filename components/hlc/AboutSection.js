// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
export default function AboutSection() {
  return (
    <section className="card" aria-labelledby="about-h">
      <h2 id="about-h">About &amp; accuracy</h2>
      <p>
        The 7-Tier Hierarchical Latent Controller (HLC) is a predictive-maintenance engine (“Sushumna Spine + Meridian
        Mesh” architecture) that runs on your own computer and estimates how many operating cycles of life remain from 30
        time steps of 21 sensor channels.
      </p>
      <p>
        <strong>Reported by the developer (for the original v1 weights):</strong> a root-mean-square error of{" "}
        <strong>9.02 cycles</strong> on the NASA C-MAPSS turbofan data (a random 20% hold-out of overlapping 30-cycle
        windows from the training file). This dashboard does not verify that number, and a random hold-out of
        overlapping windows is not an independent test.
      </p>

      <div className="synthetic-note" data-testid="accuracy-v2">
        <strong>v2 engine — retrained on real NASA FD001 (measured when v2 was built, not the developer’s number):</strong>
        <ul style={{ margin: "0.4rem 0 0.2rem", paddingLeft: "1.4rem" }}>
          <li>
            On the <strong>official FD001 test set</strong> (last 30 cycles of each of the 100 test engines) the shipped v2
            weights score a root-mean-square error of <strong>15.29 cycles</strong> against the official remaining-life
            file (<strong>13.75 cycles</strong> when the truth is capped at 125, which is what the model predicts), with a
            NASA asymmetric score of <strong>385</strong>. Always guessing the training average scores 41.84 RMSE and a
            NASA score of 18,461.
          </li>
          <li>
            Healthy vs failing is real now: on the 100 test engines the average prediction was 16.9 cycles for engines
            with 0–25 cycles left, 36.2 for 25–50, 87.0 for 50–100 and 111.6 for 100 or more. For engine unit 1 the first
            30 cycles read about 120 (NOMINAL) and the last 30 cycles about 6 (CRITICAL).
          </li>
          <li>
            Engines close to failure: of the <strong>19</strong> test engines with fewer than 25 cycles of life left,
            the engine reported <strong>15 as CRITICAL, 4 as WARNING and none as NOMINAL</strong>. So it did not label
            every near-failure engine CRITICAL; four were only flagged WARNING.
          </li>
          <li>
            <strong>The developer’s 9.02 was not reproduced</strong> on the official test set, so do not quote it as
            validated for these weights. The validation engines (20 held out) gave 13.09 RMSE; four training runs gave test RMSE
            between 14.70 and 15.57.
          </li>
          <li>
            Limits: FD001 is a simulation (one operating condition, one fault mode); other C-MAPSS subsets were not
            tested; the sensors must be scaled with the bundle’s <code>norm_stats.json</code>; and resetting Ojas before
            every request made results worse (17.83 RMSE), so the first request after a restart is a little less
            accurate. Details are in <code>RESULTS.md</code> inside the v2 zip.
          </li>
        </ul>
      </div>

      <div className="synthetic-note" data-testid="accuracy-check">
        <strong>The original v1 / v1.1 weights (check run while this dashboard was first built):</strong>
        <ul style={{ margin: "0.4rem 0 0.2rem", paddingLeft: "1.4rem" }}>
          <li>
            The v1 training script downloads NASA data from an address that now returns “404 Not Found”. When the
            download fails the script <strong>silently switches to a computer-generated “engine clone”</strong> and
            trains on that.
          </li>
          <li>
            The v1 weights score about <strong>9.3 cycles</strong> RMSE on that synthetic clone (matching the developer’s
            figure), but about <strong>46 cycles</strong> on real NASA FD001 training windows and about{" "}
            <strong>48 cycles</strong> on the official FD001 test engines. Always guessing the average would score about
            42. On real NASA data the v1 / v1.1 engine does <strong>not</strong> separate a healthy engine from a failing
            one. The v2 engine above is the retrained fix.
          </li>
        </ul>
      </div>

      <p>
        <strong>Ojas</strong> (“internal systemic load”) is a running memory inside the engine: it carries over between
        requests and builds up while stressed input keeps arriving. That is by design, but it means the same input can
        give slightly different results on repeat calls. Restarting the engine resets it to 1.0.
      </p>
      <p>
        The preset scenarios use <strong>real NASA C-MAPSS FD001</strong> telemetry (engine unit 1) scaled for the v2 engine
        (its <code>norm_stats.json</code>), the same real telemetry with the v1 scaling, or the{" "}
        <strong>synthetic clone</strong> (v1 only), each clearly labelled. When the connected engine reports v2 weights
        the page picks the v2 scaling by itself.
      </p>
    </section>
  );
}
