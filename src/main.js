import "./style.css";
import { initScene } from "./scene.js";

const canvas = document.getElementById("scene");
const scene = initScene(canvas);

const hero = document.getElementById("hero");
const heroCopy = document.getElementById("heroCopy");
const heroReveal = document.getElementById("heroReveal");
const scrollHint = document.getElementById("scrollHint");
const header = document.getElementById("siteHeader");

let ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const heroTop = hero.offsetTop;
    const span = hero.offsetHeight - window.innerHeight;
    const progress = Math.min(1, Math.max(0, (window.scrollY - heroTop) / span));
    scene.setProgress(progress);

    // hero intro copy fades out as the pile disassembles
    const fade = Math.max(0, 1 - progress / 0.32);
    heroCopy.style.opacity = fade;
    heroCopy.style.transform = `translateY(${(1 - fade) * -40}px)`;

    // reveal copy ("AI assistant") fades in at the end
    const reveal = Math.max(0, (progress - 0.7) / 0.25);
    heroReveal.style.opacity = Math.min(1, reveal);
    heroReveal.style.transform = `translateX(-50%) translateY(${(1 - Math.min(1, reveal)) * 24}px)`;

    scrollHint.style.opacity = fade;

    header.classList.toggle("scrolled", window.scrollY > window.innerHeight * 0.6);

    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// reveal-on-scroll for content sections
const toReveal = document.querySelectorAll(
  ".problem .card, .feature, .step, .step-arrow, .section-title, .eyebrow"
);
toReveal.forEach((el, i) => {
  el.classList.add("reveal-up");
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
});
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.18 }
);
toReveal.forEach((el) => io.observe(el));

// CTA form (demo only)
const form = document.getElementById("ctaForm");
const note = document.getElementById("ctaNote");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  note.textContent = "ありがとうございます！ご案内メールをお送りしました。";
  form.reset();
});
