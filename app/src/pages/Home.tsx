import { Link } from "react-router-dom";
import { ThetaMark } from "../components/ThetaMark";
import { Note } from "../components/Hand";

/** The front door: the θ mark, the headline, one line of support, and the two ways in. (An animated intro will land here.) */
export function Home() {
  return (
    <section className="home" aria-labelledby="home-title">
      <ThetaMark size={88} className="home-mark" />
      <h1 id="home-title">
        Estimate <span className="voice-text">θ</span>, one topic at a time.
      </h1>
      <p className="home-support">Learn STAT 132 one stop at a time, then practise it the way the exam asks.</p>
      <div className="home-actions">
        <Note dir="right" className="home-note wide-only">start here</Note>
        <Note dir="down" className="home-note narrow-only">start here</Note>
        <Link to="/learn" className="button big">Learn</Link>
        <Link to="/practice" className="button ghost big">Practice</Link>
      </div>
    </section>
  );
}
