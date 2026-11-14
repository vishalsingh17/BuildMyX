// A small numerical teaching explorer. State stays in this document's controls.
(() => {
  const initialize = () => {
    for (const lab of document.querySelectorAll("[data-genai-attention]")) {
      const query = lab.querySelector("[data-attention-query]");
      const temperature = lab.querySelector("[data-attention-temperature]");
      const mask = lab.querySelector("[data-attention-mask]");
      const cells = [...lab.querySelectorAll("[data-attention-weight]")];
      const output = lab.querySelector("[data-attention-output]");
      if (!query || !temperature || !mask || !output || cells.length !== 3)
        continue;
      const queries = [
        [1, 0],
        [0.5, 1],
        [1, 1],
      ];
      const keys = [
        [1, 0],
        [0, 1],
        [2, 0],
      ];
      const values = [
        [1, 0],
        [0, 1],
        [1, 1],
      ];
      const update = () => {
        const position = Math.max(0, Math.min(2, Number(query.value)));
        const scale = Math.max(0.25, Math.min(2, Number(temperature.value)));
        const scores = keys.map((key, index) =>
          mask.checked && index > position
            ? -Infinity
            : key.reduce(
                (sum, value, dimension) =>
                  sum + value * queries[position][dimension],
                0,
              ) /
              Math.sqrt(2) /
              scale,
        );
        const maximum = Math.max(...scores);
        const unnormalized = scores.map((score) => Math.exp(score - maximum));
        const total = unnormalized.reduce((sum, value) => sum + value, 0);
        const weights = unnormalized.map((value) => value / total);
        cells.forEach((cell, index) => {
          cell.textContent = weights[index].toFixed(3);
        });
        const result = [0, 1].map((dimension) =>
          values.reduce(
            (sum, value, index) => sum + weights[index] * value[dimension],
            0,
          ),
        );
        output.textContent = `Output [${result.map((value) => value.toFixed(3)).join(", ")}] · weights sum ${weights.reduce((sum, value) => sum + value, 0).toFixed(3)} · toy temperature ${scale.toFixed(2)}`;
      };
      query.addEventListener("change", update);
      temperature.addEventListener("input", update);
      mask.addEventListener("change", update);
      update();
    }
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
