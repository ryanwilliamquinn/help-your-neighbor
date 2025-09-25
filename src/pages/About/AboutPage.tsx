import React from 'react';
import './AboutPage.css';

const AboutPage = (): React.JSX.Element => {
  return (
    <div className="about-page">
      <div className="about-container">
        <header className="about-header">
          <h1>About Help Your Neighbor</h1>
          <p className="about-subtitle">
            Building stronger communities through mutual support
          </p>
        </header>

        <div className="about-content">
          <section className="mission-section">
            <h2>Our Mission</h2>
            <p>
              Help Your Neighbor is a platform designed to strengthen local
              communities by making it easy for neighbors to help each other.
              Whether you need a cup of sugar, someone to walk your dog, or help
              with moving furniture, our platform connects you with trusted
              neighbors who are ready to lend a hand.
            </p>
          </section>

          <section className="how-it-works-section">
            <h2>How It Works</h2>
            <div className="steps-grid">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Join or Create a Group</h3>
                <p>
                  Start by joining your neighborhood group or creating one for
                  your area. Groups help keep requests local and relevant.
                </p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Make or Fulfill Requests</h3>
                <p>
                  Post requests when you need help, or browse what your
                  neighbors need and offer your assistance.
                </p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Build Community</h3>
                <p>
                  As you help each other, you'll build lasting relationships and
                  create a stronger, more connected neighborhood.
                </p>
              </div>
            </div>
          </section>

          <section className="values-section">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value">
                <h3>🤝 Trust</h3>
                <p>
                  We believe in the fundamental goodness of people and the power
                  of community trust.
                </p>
              </div>
              <div className="value">
                <h3>🏠 Local First</h3>
                <p>
                  Hyperlocal communities work best. We focus on connecting
                  immediate neighbors who can actually help each other.
                </p>
              </div>
              <div className="value">
                <h3>💝 Mutual Aid</h3>
                <p>
                  Everyone has something to offer and something they need. We
                  facilitate the natural flow of community support.
                </p>
              </div>
              <div className="value">
                <h3>🔒 Privacy</h3>
                <p>
                  Your personal information stays private. We only share what
                  you choose to share with your community.
                </p>
              </div>
            </div>
          </section>

          <section className="get-started-section">
            <h2>Ready to Get Started?</h2>
            <p>
              Join thousands of neighbors who are already helping each other
              build stronger, more connected communities. It takes just a few
              minutes to get started, and your first act of kindness could
              happen today.
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
