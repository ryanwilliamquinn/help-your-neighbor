import React from 'react';
import './AboutPage.css';

const AboutPage = (): React.JSX.Element => {
  return (
    <div className="about-page">
      <div className="about-container">
        <header className="about-header">
          <h1>About A Cup of Sugar</h1>
          <p className="about-subtitle">A way to help your community</p>
        </header>

        <div className="about-content">
          <section className="mission-section">
            <h2>Our Mission</h2>
            <p>
              A Cup of Sugar is a small app meant to address a small problem:
              sometimes I just need one ingredient for a recipe, or one screw
              for a project. I don't want to text everyone I know about it, that
              felt too disruptive. But I know people in my community go to the
              store frequently, maybe they can pick it up for me, and I can do
              the same for them. This is a way for people to opt-in to being
              helpers, and have an app that tries to make it as easy as
              possible. The motivations are community building, reducing car
              usage, and giving people an opportunity to feel helpful.
            </p>
          </section>

          <section className="how-it-works-section">
            <h2>How It Works</h2>
            <div className="steps-grid">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Join or Create a Group</h3>
                <p>
                  Start by joining or creating a group of people you trust in
                  your area. Groups help keep requests local and relevant.
                </p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Make or Fulfill Requests</h3>
                <p>
                  Post requests when you need help. When you are about to go on
                  your own shopping trips, browse what your neighbors need and
                  offer your assistance.
                </p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Build Community</h3>
                <p>
                  Once you there is an agreement to help, the next steps are
                  personal. Figure out the details of delivery/pickup/repayment
                  over text or in person. The app doesn't handle messaging or
                  money.
                </p>
              </div>
            </div>
          </section>

          <section className="values-section">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value">
                This service is free, and no data is sold. There are no ads.
                There is no plan for monetization.
              </div>
            </div>
          </section>

          <section className="get-started-section">
            <h2>Ready to Get Started?</h2>
            <p>
              This is an early release, give it a try and let me know what you
              think. There is a feedback link in the header, or you can email me
              at admin@acupofsugar.org.
            </p>
            <div className="cta-buttons">
              <a href="/signup" className="btn-primary">
                Sign Up Now
              </a>
              <a href="/login" className="btn-secondary">
                Already Have an Account?
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
