import { Arrow } from "./icons";

export function LearningLibrary() {
  return (
    <section
      id="learn"
      className="container home-learning"
      tabIndex={-1}
      aria-labelledby="home-learning-heading"
    >
      <div className="home-learning-intro">
        <p className="eyebrow">BUILDMYX LEARN / FREE LEARNING</p>
        <h2 id="home-learning-heading">
          Learn to design systems.
          <br />
          <em>One decision at a time.</em>
        </h2>
        <p className="home-learning-description">
          Turn an open question into a design you can explain. Work through
          requirements, APIs, data and scaling, then put it together in a guided
          design exercise.
        </p>
        <ul className="home-learning-meta" aria-label="About the lessons">
          <li>6 free lessons</li>
          <li>Self-paced</li>
          <li>No sign-up</li>
        </ul>
        <a
          href="/learn/"
          className="button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Explore free lessons
          <span className="sr-only"> (opens in a new tab)</span>
          <Arrow diagonal />
        </a>
        <p className="home-learning-tab-note">Lessons open in a new tab.</p>
      </div>
      <article
        className="home-learning-feature"
        aria-labelledby="home-learning-first-title"
      >
        <div className="home-learning-feature-meta">
          <span className="eyebrow">01 / START HERE</span>
          <span>8 min read + practice</span>
        </div>
        <h3 id="home-learning-first-title">
          What is a system design interview?
        </h3>
        <p>Start with the questions that shape a useful technical plan.</p>
        <ul>
          <li>Understand what the interview tests</li>
          <li>Follow a request through a system</li>
          <li>Explain the trade-offs behind your design</li>
        </ul>
        <a
          href="/learn/fundamentals/what-is-system-design-interview/"
          className="text-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the first lesson
          <span className="sr-only"> (opens in a new tab)</span>
          <Arrow diagonal />
        </a>
      </article>
    </section>
  );
}
