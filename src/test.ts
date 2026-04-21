import { DEFAULT_CONFIG, DEFAULT_SPECIES } from "./simulation/defaultSpecies";
import { simulateStep } from "./simulation/engine";

let state = DEFAULT_SPECIES;
for (let i = 0; i < 10; i++) {
  state = simulateStep(state, DEFAULT_CONFIG);
  console.log(state.map((s) => `${s.name}: ${s.population}`));
}
