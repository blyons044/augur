import React, { useState, useEffect, useRef } from 'react';

function AnimatedNumber({ value, duration = 1500, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState('0');
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animate();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  function animate() {
    const raw = String(value).replace(/[^0-9.]/g, '');
    const target = parseFloat(raw);
    if (isNaN(target)) { setDisplay(value); return; }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const current = target * eased;
      if (target % 1 === 0) {
        setDisplay(Math.round(current).toLocaleString());
      } else {
        setDisplay(current.toFixed(1));
      }
      if (progress < 1) requestAnimationFrame(step);
      else setDisplay(target % 1 === 0 ? Math.round(target).toLocaleString() : target.toFixed(1));
    };
    requestAnimationFrame(step);
  }

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

export default AnimatedNumber;
