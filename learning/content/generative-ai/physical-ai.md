---
title: "Connect perception, prediction and action"
description: "Understand VLA policies, data, simulation and the requirements of closed-loop embodied evaluation."
course: Generative AI
lesson: CHAPTER 31 OF 32
---

# Connect perception, prediction and action

<div class="genai-phase">ADVANCED ARCHITECTURES · STEP 31 OF 32</div>

**After this chapter:** Understand VLA policies, data, simulation and the requirements of closed-loop embodied evaluation.

**Before you start:** [30 · Predict a world and plan within it](world-models.md). Keep the [glossary](glossary.md) nearby when a term is new.

## Close the loop from sensing to action {#loop}

A physical AI system observes an environment, estimates relevant state, selects an action, executes through an authorized control interface and observes the consequences. Sensors can be noisy, observations can be delayed and actions can change the environment before the next decision.

Separate perception, state estimation, prediction, planning, policy and low-level control. A language-capable policy does not replace the actuator interface's timing, units, calibration or operating limits. The examples in this course are software simulations and numerical illustrations.

## Learn actions from different signals {#learning}

Behavioral cloning learns actions from demonstrations. Dataset aggregation approaches collect corrections on states a learner encounters. Reinforcement learning uses a reward and an interaction or offline-data setting with its own distribution and evaluation challenges. A reward can be an imperfect proxy for the intended behavior.

Vision-language-action models connect visual observations and language instructions to an action representation. Actions may be discretized or continuous, predicted in chunks or produced by a diffusion-style policy. [OpenVLA](https://arxiv.org/abs/2406.09246) is a primary example of a VLA approach; compare its interface and experiments with other architectures instead of assuming one common robotics capability.

## Make the action interface explicit {#interface}

```python
# A one-dimensional software-only illustration of a control boundary.
def limit_action(proposed, previous, stop, maximum_speed=0.2, maximum_change=0.05):
    if stop:
        return 0.0
    if abs(previous) > maximum_speed:
        raise ValueError("The prior state is outside the toy operating envelope")
    bounded = max(-maximum_speed, min(maximum_speed, proposed))
    return max(previous - maximum_change, min(previous + maximum_change, bounded))

assert limit_action(1.0, 0.0, False) == 0.05
assert limit_action(1.0, 0.1, True) == 0.0
assert -0.2 <= limit_action(-1.0, 0.0, False) <= 0.2
```

This shows how an application-owned boundary can constrain a proposal. It is not a hardware safety controller or a validation procedure for a real robot. Real systems require hardware-specific limits, state checks, sensing, control design and testing by qualified operators.

## Build a data and simulation loop {#simulation}

Record coordinate frames, timestamps, action units, task state, sensor calibration and outcomes with demonstrations. A sequence of plausible captions cannot substitute for synchronized observations and actions. Pretraining, task adaptation and post-training introduce different data and validation requirements.

Simulation supports controlled experiments and failure cases. Domain randomization varies selected properties; a digital twin also requires a maintained relationship to the system it represents. Sim-to-real transfer can fail through unmodeled contact, latency, visual differences or incorrect actuator assumptions.

The source primer surveys humanoid foundation models, Isaac GR00T-style ecosystems, autonomous driving and physical-AI data engines. These are advanced system studies: compare documented capabilities, evaluation environments and deployment constraints, rather than reading a demonstration as a general autonomy guarantee.

## Evaluate closed-loop behavior {#evaluation}

Measure task completion, collisions or constraint violations, intervention rate, recovery, timing and robustness under the intended conditions. Offline action similarity, visual quality and language fluency assess different properties. Autonomous-driving or robot-planning evaluation also needs appropriate simulation validity and real-world evidence for the proposed scope.

Retain an explicit stop path, fresh-state requirements and a clear ownership boundary for effects. A model should not be able to redefine its own operating envelope through generated instructions. Test degraded observations, delayed actions and partial failures in the validated software/simulation environment before increasing scope.

## Choose a beginner extension {#next-project}

Start with a recorded or synthetic scene: identify an object, preserve its coordinates and timestamp, predict a simple next state and compare it with a known reference. This combines the earlier VLM, world-model and workflow lessons without requiring access to physical hardware.

## Try it yourself {#practice}

Use a software-only sequence of proposed actions and delayed timestamps. Define a stale-observation rule and verify that the controller enters a stopped or review state when it cannot trust the observation.

## Check your understanding {#self-check}

Why is a low offline action-prediction error insufficient to establish safe closed-loop robot performance?

??? question "Check your reasoning"
    Small errors can change later states and compound under the learner’s own actions. Timing, calibration, sensor failures, constraints and recovery also matter. Evaluate the complete closed-loop system within a validated operating scope.

## Continue in order {#continue}

**Previous:** [30 · Predict a world and plan within it](world-models.md)<br>
**Next:** [32 · Capstone: explain, test and improve your assistant](capstone.md)

**Source reading:** [Physical AI](https://aman.ai/primers/physical-ai/) · [World modeling](https://aman.ai/primers/world-modeling/). The explanations and numerical examples on this page are original BuildMyX teaching material. Use the linked primers for further detail and their research bibliographies.
